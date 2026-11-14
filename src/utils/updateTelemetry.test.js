import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvent,
  sanitizePath,
  sanitizeReason,
  createAttemptId,
  createEventBuffer,
  SEND_RESULT as R,
  EVENT_TYPE as E,
} from "./updateTelemetry.js";

// ---- CA04: datos sensibles ----
test("sanitizePath: sin query ni #, ids y hashes como :id", () => {
  assert.equal(sanitizePath("/mesas/12/payment?dni=12345678&token=abc#cobro"), "/mesas/:id/payment");
  assert.equal(sanitizePath("/ventas/3f2a9c1b7d8e/detalle"), "/ventas/:id/detalle");
  assert.equal(sanitizePath("/login"), "/login");
  assert.equal(sanitizePath("/"), "/");
  assert.equal(sanitizePath("/clientes/Juan Pérez"), "/clientes/:id");
  assert.equal(sanitizePath("/clientes/12345678"), "/clientes/:id", "un DNI en la ruta no sale");
  assert.equal(sanitizePath("/take-order/delivery"), "/take-order/delivery");
  for (const bad of ["https://otro.sitio/x", "mesas", null, undefined, 5]) assert.equal(sanitizePath(bad), undefined, String(bad));
});

test("sanitizeReason: solo códigos cortos; el texto libre se reemplaza", () => {
  assert.equal(sanitizeReason("still_old"), "still_old");
  assert.equal(sanitizeReason("TypeError: token=MARCADOR"), "other");
  assert.equal(sanitizeReason("x".repeat(41)), "other");
  assert.equal(sanitizeReason(undefined), undefined);
});

test("buildEvent: solo campos permitidos y saneados", () => {
  const e = buildEvent({
    type: E.CONFIRMED,
    attempt: "a1b2c3d4",
    release: "0e6431a809232e9b",
    toRelease: "37cba964421792a5",
    deployment: "20261114202843-6e337e",
    reason: "Error con token=MARCADOR",
    path: "/ventas?dni=12345678",
    durationMs: 1830,
    contract: 1,
    total: "150.00",
    token: "MARCADOR",
  });
  assert.deepEqual(e, {
    type: E.CONFIRMED,
    attempt: "a1b2c3d4",
    release: "0e6431a809232e9b",
    to_release: "37cba964421792a5",
    deployment: "20261114202843-6e337e",
    reason: "other",
    path: "/ventas",
    duration_ms: 1830,
    contract: 1,
  });
  assert.equal(JSON.stringify(e).includes("MARCADOR"), false);
  assert.equal(JSON.stringify(e).includes("12345678"), false);
});

test("buildEvent: valores inválidos se omiten", () => {
  const e = buildEvent({ type: E.FAILED, attempt: "<x>", durationMs: -1, contract: 1.5 });
  assert.deepEqual(e, { type: E.FAILED });
});

test("createAttemptId: 8 caracteres alfanuméricos", () => {
  assert.match(createAttemptId(), /^[a-z0-9]{8}$/);
  assert.notEqual(createAttemptId(), createAttemptId());
});

// ---- Cola acotada ----
const timers = () => {
  let next = 1;
  const pending = new Map();
  return {
    setTimer: (fn, ms) => {
      const id = next++;
      pending.set(id, { fn, ms });
      return id;
    },
    clearTimer: (id) => pending.delete(id),
    async fire() {
      const all = [...pending.entries()];
      pending.clear();
      for (const [, t] of all) t.fn();
      for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r));
      return all.map(([, t]) => t.ms);
    },
    pending,
  };
};

test("agrupa eventos y los envía juntos", async () => {
  const t = timers();
  const sent = [];
  const buf = createEventBuffer({ send: async (b) => (sent.push(b), R.OK), ...t });
  buf.push({ type: "a" });
  buf.push({ type: "b" });
  assert.equal(t.pending.size, 1, "un solo temporizador");
  await t.fire();
  assert.deepEqual(sent, [[{ type: "a" }, { type: "b" }]]);
  assert.equal(buf.snapshot().queued, 0);
});

test("CA03: con el servidor caído reintenta 3 veces y después descarta, sin crecer", async () => {
  const t = timers();
  let calls = 0;
  const buf = createEventBuffer({ send: async () => (calls += 1, R.RETRY), ...t });
  buf.push({ type: "a" });
  const delays = [];
  for (let i = 0; i < 6; i += 1) delays.push(...(await t.fire()));
  assert.equal(calls, 4, "envío inicial + 3 reintentos");
  assert.deepEqual(delays, [2_000, 30_000, 60_000, 120_000]);
  assert.equal(t.pending.size, 0, "no queda nada programado: no hay reintentos ilimitados");
  assert.deepEqual(buf.snapshot(), { queued: 0, sending: false, retries: 0, dropped: 1 });
});

test("si send lanza un error, cuenta como reintento y nunca rompe", async () => {
  const t = timers();
  const buf = createEventBuffer({
    send: async () => {
      throw new Error("Failed to fetch");
    },
    ...t,
  });
  buf.push({ type: "a" });
  await t.fire();
  assert.equal(buf.snapshot().retries, 1);
});

test("un evento rechazado por formato (drop) no se reintenta", async () => {
  const t = timers();
  let calls = 0;
  const buf = createEventBuffer({ send: async () => (calls += 1, R.DROP), ...t });
  buf.push({ type: "a" });
  await t.fire();
  await t.fire();
  assert.equal(calls, 1);
  assert.equal(t.pending.size, 0);
});

test("la cola nunca pasa de 20: se descartan los más antiguos", () => {
  const t = timers();
  const buf = createEventBuffer({ send: async () => R.OK, ...t });
  for (let i = 0; i < 35; i += 1) buf.push({ type: "e", n: i });
  assert.deepEqual(buf.snapshot(), { queued: 20, sending: false, retries: 0, dropped: 15 });
});

test("flushNow envía todo de una vez (antes de recargar) y cancela el temporizador", () => {
  const t = timers();
  const beacons = [];
  const buf = createEventBuffer({ send: async () => R.OK, ...t });
  buf.push({ type: "update_started" });
  buf.flushNow((batch) => beacons.push(batch));
  assert.deepEqual(beacons, [[{ type: "update_started" }]]);
  assert.equal(t.pending.size, 0);
  buf.flushNow(() => {
    throw new Error("sin beacon");
  });
});
