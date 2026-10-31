import test from "node:test";
import assert from "node:assert/strict";
import {
  addPending,
  dropVolatileForTable,
  getActiveLock,
  isStalePending,
  localExpiry,
  lockHasExpired,
  lockHeartbeatMs,
  lockRemainingSeconds,
  normalizeLock,
  PENDING_MAX_AGE_MS,
} from "./tableLock.js";

const SERVER_NOW = Date.parse("2026-10-31T15:00:00Z");
const iso = (ms) => new Date(ms).toISOString();

// ---- Caso A: comportamiento previo (respaldo con expires_at del servidor) ----
test("lockHasExpired: sin hora local usa expires_at (comportamiento previo)", () => {
  const lock = { expires_at: iso(SERVER_NOW + 30_000) };
  assert.equal(lockHasExpired(lock, SERVER_NOW), false);
  assert.equal(lockHasExpired(lock, SERVER_NOW + 31_000), true);
});

test("lockHasExpired: un bloqueo sin datos de vencimiento no se descarta", () => {
  assert.equal(lockHasExpired({ user_id: 1 }, SERVER_NOW), false);
});

test("lockHasExpired: un bloqueo inexistente cuenta como vencido", () => {
  assert.equal(lockHasExpired(null), true);
  assert.equal(lockHasExpired(undefined), true);
});

// ---- Caso B: corrección ----
test("localExpiry: usa los segundos restantes y la hora de recepción", () => {
  assert.equal(localExpiry({ remaining_seconds: 50 }, 1_000), 51_000);
  assert.equal(localExpiry({}, 1_000), undefined);
  assert.equal(localExpiry(null, 1_000), undefined);
});

test("lockHasExpired: un reloj de cliente adelantado NO descarta un bloqueo vigente", () => {
  const received = SERVER_NOW + 300_000; // reloj del PC cliente adelantado 5 minutos
  const lock = {
    expires_at: iso(SERVER_NOW + 50_000), // hora del servidor: ya "pasada" para el reloj del cliente
    remaining_seconds: 50,
    local_expires_at: localExpiry({ remaining_seconds: 50 }, received),
  };
  assert.equal(lockHasExpired(lock, received + 10_000), false); // 10 s después sigue vigente
  assert.equal(lockHasExpired(lock, received + 51_000), true); // pasados los 50 s vence
});

test("lockHasExpired: con el reloj adelantado el respaldo por expires_at sí fallaría (por eso se usa la hora local)", () => {
  const lock = { expires_at: iso(SERVER_NOW + 50_000) };
  assert.equal(lockHasExpired(lock, SERVER_NOW + 300_000), true);
});

test("lockHasExpired: una renovación recibida extiende el vencimiento local", () => {
  const first = { remaining_seconds: 50, local_expires_at: localExpiry({ remaining_seconds: 50 }, 0) };
  assert.equal(lockHasExpired(first, 49_000), false);
  assert.equal(lockHasExpired(first, 51_000), true);
  const renewed = { remaining_seconds: 50, local_expires_at: localExpiry({ remaining_seconds: 50 }, 40_000) };
  assert.equal(lockHasExpired(renewed, 51_000), false);
  assert.equal(lockHasExpired(renewed, 91_000), true);
});

test("dropVolatileForTable: quita lock/renew/heartbeat de la mesa que se deja y conserva el resto", () => {
  const q = (type, table_id) => ({ message: { type, table_id }, queuedAt: 0 });
  const pending = [
    q("lock_table", 5),
    q("renew_lock", 5),
    q("heartbeat", 5),
    q("lock_table", 6),
    q("unlock_table", 5),
    q("heartbeat", undefined),
  ];
  const result = dropVolatileForTable(pending, "5");
  assert.deepEqual(
    result.map((i) => `${i.message.type}:${i.message.table_id}`),
    ["lock_table:6", "unlock_table:5", "heartbeat:undefined"]
  );
});

test("isStalePending: solo caducan los mensajes que crean/renuevan bloqueos", () => {
  const old = (type) => ({ message: { type, table_id: 1 }, queuedAt: 0 });
  assert.equal(isStalePending(old("lock_table"), PENDING_MAX_AGE_MS + 1), true);
  assert.equal(isStalePending(old("renew_lock"), PENDING_MAX_AGE_MS + 1), true);
  assert.equal(isStalePending(old("lock_table"), PENDING_MAX_AGE_MS - 1), false);
  assert.equal(isStalePending(old("unlock_table"), 60_000), false);
});

// ---- normalizeLock / getActiveLock / lockRemainingSeconds / lockHeartbeatMs / addPending ----
test("normalizeLock: unifica los nombres de campo de las distintas fuentes", () => {
  const fromSignal = normalizeLock({ table_id: "7", user_id: 3, username: "ANA", remaining_seconds: 40 }, 1_000);
  const fromHttp = normalizeLock({ table: 7, user: 3, username: "ANA", remaining_time: 40 }, 1_000);
  assert.deepEqual(fromSignal, fromHttp);
  assert.equal(fromSignal.table_id, 7);
  assert.equal(fromSignal.user_id, 3);
  assert.equal(fromSignal.local_expires_at, 41_000);
});

test("normalizeLock: un user_id 0 no se pierde y sin segundos restantes no hay vencimiento local", () => {
  const lock = normalizeLock({ table_id: 1, user_id: 0, expires_at: "2026-10-31T15:00:00Z" }, 1_000);
  assert.equal(lock.user_id, 0);
  assert.equal(lock.local_expires_at, undefined);
  assert.equal(lock.expires_at, "2026-10-31T15:00:00Z");
});

test("normalizeLock: tolera entradas vacías sin lanzar", () => {
  assert.doesNotThrow(() => normalizeLock(null));
  assert.doesNotThrow(() => normalizeLock(undefined));
});

test("getActiveLock: devuelve el bloqueo vigente, y null si venció, no existe o no hay datos", () => {
  const live = normalizeLock({ table_id: 5, user_id: 1, remaining_seconds: 30 }, 0);
  const lockedTables = { 5: live };
  assert.equal(getActiveLock(lockedTables, 5, 10_000), live);
  assert.equal(getActiveLock(lockedTables, "5", 10_000), live); // misma clave que 5
  assert.equal(getActiveLock(lockedTables, 5, 31_000), null); // venció
  assert.equal(getActiveLock(lockedTables, 6, 0), null);
  assert.equal(getActiveLock(null, 5, 0), null);
  assert.equal(getActiveLock(lockedTables, undefined, 0), null);
});

test("lockRemainingSeconds: usa el vencimiento local y nunca es negativo", () => {
  const lock = normalizeLock({ table_id: 1, remaining_seconds: 50 }, 0);
  assert.equal(lockRemainingSeconds(lock, 0), 50);
  assert.equal(lockRemainingSeconds(lock, 49_500), 1);
  assert.equal(lockRemainingSeconds(lock, 90_000), 0);
  assert.equal(lockRemainingSeconds({}, 0), 0);
  assert.equal(lockRemainingSeconds(null, 0), 0);
});

test("lockHeartbeatMs: con 50 s da 20 s y se adapta al tiempo configurado", () => {
  assert.equal(lockHeartbeatMs(50), 20_000); // Caso A: el valor que había fijo
  assert.equal(lockHeartbeatMs(10), 4_000); // TTL mínimo: antes el latido de 20 s dejaba vencer el bloqueo
  assert.equal(lockHeartbeatMs(300), 120_000); // TTL largo: menos mensajes
  assert.equal(lockHeartbeatMs(undefined), 20_000);
  assert.equal(lockHeartbeatMs("abc"), 20_000);
  assert.equal(lockHeartbeatMs(1), 3_000); // nunca por debajo de 3 s
});

test("addPending: un latido nuevo reemplaza al pendiente de la misma mesa en vez de acumularse", () => {
  let pending = [];
  pending = addPending(pending, { type: "lock_table", table_id: 5 }, 1_000);
  pending = addPending(pending, { type: "lock_table", table_id: 5 }, 2_000);
  pending = addPending(pending, { type: "lock_table", table_id: 6 }, 2_500);
  assert.equal(pending.length, 2);
  assert.equal(pending.find((i) => i.message.table_id === 5).queuedAt, 2_000);
});

test("addPending: un unlock cancela los pendientes de esa mesa y se conserva", () => {
  let pending = [];
  pending = addPending(pending, { type: "lock_table", table_id: 5 }, 1_000);
  pending = addPending(pending, { type: "heartbeat", table_id: 5 }, 1_100);
  pending = addPending(pending, { type: "lock_table", table_id: 6 }, 1_200);
  pending = addPending(pending, { type: "unlock_table", table_id: 5 }, 1_300);
  assert.deepEqual(
    pending.map((i) => `${i.message.type}:${i.message.table_id}`),
    ["lock_table:6", "unlock_table:5"]
  );
});

test("addPending: no muta la lista original", () => {
  const original = [{ message: { type: "lock_table", table_id: 1 }, queuedAt: 0 }];
  addPending(original, { type: "lock_table", table_id: 1 }, 5);
  assert.equal(original.length, 1);
  assert.equal(original[0].queuedAt, 0);
});
