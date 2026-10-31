import test from "node:test";
import assert from "node:assert/strict";
import {
  dropVolatileForTable,
  isStalePending,
  localExpiry,
  lockHasExpired,
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
