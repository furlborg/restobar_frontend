import test from "node:test";
import assert from "node:assert/strict";
import { createVersionDetector, DETECTOR_STATUS as S } from "./versionDetector.js";

const A = "aaaaaaaaaaaaaaaa"; // versión cargada en la pestaña
const B = "bbbbbbbbbbbbbbbb";
const C = "cccccccccccccccc";

const manifestText = (releaseId, extra = {}) =>
  JSON.stringify({
    schema_version: 1,
    release_id: releaseId,
    deployment_id: `20261114000000-${releaseId.slice(0, 6)}`,
    published_at: "2026-11-14T00:00:00Z",
    min_supported_client_contract: 1,
    status: "ready",
    ...extra,
  });

const ok = (text) => Promise.resolve({ ok: true, status: 200, text });
const hang = (signal) =>
  new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("abort"))));
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r));
};

/** Reloj y timers falsos; `respond(n, signal)` decide la respuesta de la consulta n (1, 2, …). */
const harness = ({ respond = () => ok(manifestText(B)), random = () => 0.5, config } = {}) => {
  let t = 0;
  let nextId = 1;
  const timers = new Map();
  const env = { visible: true, online: true };
  const calls = [];
  const detector = createVersionDetector(
    {
      currentReleaseId: A,
      fetchText: ({ signal }) => {
        calls.push(t);
        return respond(calls.length, signal);
      },
      isVisible: () => env.visible,
      isOnline: () => env.online,
      setTimer: (fn, ms) => {
        const id = nextId++;
        timers.set(id, { at: t + ms, fn });
        return id;
      },
      clearTimer: (id) => timers.delete(id),
      now: () => t,
      random,
    },
    config
  );
  const advance = async (ms) => {
    const end = t + ms;
    for (;;) {
      let due = null;
      for (const [id, tm] of timers) if (tm.at <= end && (!due || tm.at < due[1].at)) due = [id, tm];
      if (!due) break;
      timers.delete(due[0]);
      t = due[1].at;
      due[1].fn();
      await flush();
    }
    t = end;
    await flush();
  };
  return { detector, env, calls, advance, pendingTimers: () => timers.size, now: () => t };
};

// ---- Arranque y CA01 ----
test("primera consulta a los 5 s, no antes", async () => {
  const h = harness();
  h.detector.start();
  await h.advance(4_999);
  assert.equal(h.calls.length, 0);
  assert.equal(h.detector.getState().status, S.NOT_CHECKED);
  await h.advance(1);
  assert.equal(h.calls.length, 1);
});

test("CA01: con la versión A cargada y B publicada, expone B como disponible", async () => {
  const h = harness();
  h.detector.start();
  await h.advance(5_000);
  const s = h.detector.getState();
  assert.equal(s.status, S.AVAILABLE);
  assert.equal(s.candidate.releaseId, B);
  assert.equal(s.currentReleaseId, A);
  assert.equal(s.lastError, null);
});

test("misma versión publicada: al día, sin candidata", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  await h.advance(5_000);
  assert.equal(h.detector.getState().status, S.UP_TO_DATE);
  assert.equal(h.detector.getState().candidate, null);
});

// ---- Intervalo ----
test("con la pestaña visible consulta cada 60 s (±10 %)", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  await h.advance(5_000 + 60_000 * 3);
  assert.deepEqual(h.calls, [5_000, 65_000, 125_000, 185_000]);
});

test("la variación aleatoria queda entre 54 s y 66 s", async () => {
  const low = harness({ respond: () => ok(manifestText(A)), random: () => 0 });
  low.detector.start();
  await low.advance(5_000 + 54_000);
  assert.deepEqual(low.calls, [5_000, 59_000]);

  const high = harness({ respond: () => ok(manifestText(A)), random: () => 0.9999999 });
  high.detector.start();
  await high.advance(5_000 + 65_999);
  assert.equal(high.calls.length, 1);
  await high.advance(1);
  assert.equal(high.calls.length, 2);
});

// ---- CA02: pestaña oculta ----
test("CA02: con la pestaña oculta deja de consultar y retoma al volver", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  await h.advance(5_000);
  h.env.visible = false;
  await h.advance(10 * 60_000);
  assert.equal(h.calls.length, 1, "ninguna consulta mientras está oculta");
  assert.equal(h.pendingTimers(), 0, "sin timers vivos mientras está oculta");
  h.env.visible = true;
  h.detector.notifyVisible();
  await h.advance(0);
  assert.equal(h.calls.length, 2, "consulta al volver a la pestaña");
});

test("evento de foco/red antes de 30 s: no consulta de inmediato, la programa una sola vez", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  await h.advance(5_000);
  h.env.visible = false;
  await h.advance(10_000);
  h.env.visible = true;
  h.detector.notifyVisible();
  h.detector.notifyOnline();
  h.detector.notifyVisible();
  await h.advance(0);
  assert.equal(h.calls.length, 1);
  await h.advance(20_000);
  assert.deepEqual(h.calls, [5_000, 35_000]);
});

test("evento de foco después de 30 s consulta enseguida y reinicia el intervalo", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  await h.advance(5_000 + 40_000);
  h.detector.notifyVisible();
  await h.advance(0);
  assert.deepEqual(h.calls, [5_000, 45_000]);
  await h.advance(60_000);
  assert.deepEqual(h.calls, [5_000, 45_000, 105_000], "sin la consulta vieja de los 65 s");
});

test("un evento antes de la primera consulta no adelanta los 5 s iniciales", async () => {
  const h = harness();
  h.detector.start();
  await h.advance(1_000);
  h.detector.notifyVisible();
  await h.advance(0);
  assert.equal(h.calls.length, 0);
  await h.advance(4_000);
  assert.equal(h.calls.length, 1);
});

test("eventos con la pestaña oculta se ignoran", async () => {
  const h = harness();
  h.detector.start();
  await h.advance(5_000 + 40_000);
  h.env.visible = false;
  h.detector.notifyOnline();
  await h.advance(0);
  assert.equal(h.calls.length, 1);
});

// ---- CA03: fallas ----
test("CA03: sin red o error, no inventa una versión nueva", async () => {
  const h = harness({ respond: () => Promise.reject(new Error("Failed to fetch")) });
  h.detector.start();
  await h.advance(5_000);
  const s = h.detector.getState();
  assert.equal(s.status, S.CHECK_FAILED);
  assert.equal(s.candidate, null);
  assert.equal(s.lastError, "network");
});

test("timeout de 5 s", async () => {
  const h = harness({ respond: (_n, signal) => hang(signal) });
  h.detector.start();
  await h.advance(5_000 + 4_999);
  assert.equal(h.detector.getState().status, S.NOT_CHECKED);
  await h.advance(1);
  assert.equal(h.detector.getState().lastError, "timeout");
});

test("HTTP 404 o la página de inicio en lugar del JSON son fallas, no versiones", async () => {
  const h404 = harness({ respond: () => Promise.resolve({ ok: false, status: 404, text: "Not Found" }) });
  h404.detector.start();
  await h404.advance(5_000);
  assert.equal(h404.detector.getState().lastError, "http_404");
  assert.equal(h404.detector.getState().candidate, null);

  const html = harness({ respond: () => ok("<!DOCTYPE html><html><head></head><body></body></html>") });
  html.detector.start();
  await html.advance(5_000);
  assert.equal(html.detector.getState().lastError, "not_json");
  assert.equal(html.detector.getState().status, S.CHECK_FAILED);
});

test("navegador sin red: no consulta y lo registra como falla", async () => {
  const h = harness();
  h.env.online = false;
  h.detector.start();
  await h.advance(5_000);
  assert.equal(h.calls.length, 0);
  assert.equal(h.detector.getState().lastError, "offline");
});

test("fallas seguidas esperan 60, 120 y 300 s; un éxito vuelve a 60 s", async () => {
  let fail = true;
  const h = harness({
    respond: () => (fail ? Promise.reject(new Error("x")) : ok(manifestText(A))),
  });
  h.detector.start();
  await h.advance(5_000); // falla 1 → espera 60 s
  await h.advance(60_000); // falla 2 → espera 120 s
  await h.advance(120_000); // falla 3 → espera 300 s
  await h.advance(300_000); // falla 4 → sigue en 300 s
  assert.deepEqual(h.calls, [5_000, 65_000, 185_000, 485_000]);
  assert.equal(h.detector.getState().consecutiveFailures, 4);
  fail = false;
  await h.advance(300_000); // éxito
  assert.equal(h.detector.getState().consecutiveFailures, 0);
  assert.equal(h.detector.getState().status, S.UP_TO_DATE);
  await h.advance(60_000);
  assert.deepEqual(h.calls, [5_000, 65_000, 185_000, 485_000, 785_000, 845_000]);
});

test("una falla pasajera no retira la versión ya ofrecida", async () => {
  const h = harness({ respond: (n) => (n === 1 ? ok(manifestText(B)) : Promise.reject(new Error("x"))) });
  h.detector.start();
  await h.advance(5_000 + 60_000);
  const s = h.detector.getState();
  assert.equal(s.status, S.AVAILABLE);
  assert.equal(s.candidate.releaseId, B);
  assert.equal(s.lastError, "network");
});

// ---- Cambios de candidata ----
test("A → B → C → A: cambia la candidata y la retira al volver a la versión actual (CA06)", async () => {
  const sequence = [B, C, A];
  const h = harness({ respond: (n) => ok(manifestText(sequence[Math.min(n, 3) - 1])) });
  h.detector.start();
  await h.advance(5_000);
  assert.equal(h.detector.getState().candidate.releaseId, B);
  await h.advance(60_000);
  assert.equal(h.detector.getState().candidate.releaseId, C);
  await h.advance(60_000);
  assert.equal(h.detector.getState().status, S.UP_TO_DATE);
  assert.equal(h.detector.getState().candidate, null);
});

test("una publicación que no está ready no se ofrece", async () => {
  const h = harness({ respond: () => ok(manifestText(B, { status: "pending" })) });
  h.detector.start();
  await h.advance(5_000);
  assert.equal(h.detector.getState().candidate, null);
  assert.notEqual(h.detector.getState().status, S.AVAILABLE);
});

test("JSON inválido después de B no reemplaza a B por basura", async () => {
  const h = harness({ respond: (n) => ok(n === 1 ? manifestText(B) : '{"schema_version":2}') });
  h.detector.start();
  await h.advance(5_000 + 60_000);
  assert.equal(h.detector.getState().candidate.releaseId, B);
  assert.equal(h.detector.getState().lastError, "unsupported_schema");
});

// ---- Concurrencia, contexto y una sola instancia ----
test("nunca hay dos consultas a la vez: checkNow repetido devuelve la misma", async () => {
  let release;
  const h = harness({
    respond: () => new Promise((resolve) => (release = () => resolve({ ok: true, status: 200, text: manifestText(B) }))),
  });
  h.detector.start();
  await h.advance(5_000);
  const p1 = h.detector.checkNow();
  const p2 = h.detector.checkNow();
  h.detector.notifyVisible();
  assert.equal(p1, p2);
  assert.equal(h.calls.length, 1);
  release();
  const s = await p1;
  assert.equal(s.candidate.releaseId, B);
});

test("CA04/CA05: la respuesta de una consulta anterior a stop() no modifica el estado", async () => {
  let release;
  const h = harness({
    respond: (n) =>
      n === 1
        ? new Promise((resolve) => (release = () => resolve({ ok: true, status: 200, text: manifestText(B) })))
        : ok(manifestText(A)),
  });
  h.detector.start();
  await h.advance(5_000);
  h.detector.stop();
  release();
  await flush();
  assert.equal(h.detector.getState().status, S.NOT_CHECKED);
  assert.equal(h.detector.getState().candidate, null);

  h.detector.start();
  await h.advance(5_000);
  assert.equal(h.detector.getState().status, S.UP_TO_DATE);
});

test("CA07: start() repetido no duplica timers ni consultas", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  h.detector.start();
  h.detector.start();
  assert.equal(h.pendingTimers(), 1);
  await h.advance(5_000 + 60_000);
  assert.equal(h.calls.length, 2);
});

test("stop() deja de consultar", async () => {
  const h = harness({ respond: () => ok(manifestText(A)) });
  h.detector.start();
  await h.advance(5_000);
  h.detector.stop();
  await h.advance(10 * 60_000);
  assert.equal(h.calls.length, 1);
  assert.equal(h.pendingTimers(), 0);
});

test("checkNow consulta sin esperar el intervalo", async () => {
  const h = harness();
  h.detector.start();
  await h.advance(1_000);
  const s = await h.detector.checkNow();
  assert.equal(h.calls.length, 1);
  assert.equal(s.candidate.releaseId, B);
});

// ---- Oyentes ----
test("los oyentes reciben cada cambio y uno con error no rompe a los demás", async () => {
  const h = harness();
  const seen = [];
  h.detector.subscribe(() => {
    throw new Error("oyente roto");
  });
  const off = h.detector.subscribe((s) => seen.push(s.status));
  h.detector.start();
  await h.advance(5_000);
  assert.deepEqual(seen, [S.AVAILABLE]);
  off();
  await h.advance(60_000);
  assert.deepEqual(seen, [S.AVAILABLE]);
});

test("el estado entregado es inmutable", async () => {
  const h = harness();
  h.detector.start();
  await h.advance(5_000);
  assert.throws(() => {
    "use strict";
    h.detector.getState().status = "x";
  });
});
