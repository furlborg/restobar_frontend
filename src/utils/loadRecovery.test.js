import test from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  decideLoadRecovery,
  isSafeTargetPath,
  createIncidentGate,
  LOAD_ACTION as L,
} from "./loadRecovery.js";

const B = { releaseId: "bbbbbbbbbbbbbbbb", deploymentId: "dep-b", status: "ready" };

// ---- Clasificación ----
test("isChunkLoadError: reconoce los mensajes de cada navegador y de Vite", () => {
  const messages = [
    "Failed to fetch dynamically imported module: https://x/assets/Mesas-abc.js",
    "error loading dynamically imported module: https://x/assets/Mesas-abc.js",
    "Importing a module script failed.",
    "Unable to preload CSS for /assets/Mesas-abc.css",
    "Loading chunk 123 failed.",
    "Loading CSS chunk mesas failed",
  ];
  for (const m of messages) assert.equal(isChunkLoadError(new Error(m)), true, m);
  const named = new Error("x");
  named.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(named), true);
});

test("isChunkLoadError: los errores funcionales no son fallos de carga", () => {
  for (const e of [
    new TypeError("Cannot read properties of undefined (reading 'id')"),
    new Error("Request failed with status code 500"),
    new Error("Failed to fetch"), // fetch de API: no es un fragmento de la web
    null,
    undefined,
  ]) {
    assert.equal(isChunkLoadError(e), false, String(e?.message ?? e));
  }
});

// ---- Decisión ----
test("CA01: versión nueva y primer intento → una recuperación automática", () => {
  const d = decideLoadRecovery({ detector: { status: "disponible", candidate: B, lastError: null }, previousAttempt: null });
  assert.equal(d, L.AUTO_UPDATE);
});

test("CA06: si ya se intentó esa versión, no se repite sola", () => {
  const prev = { to_release: B.releaseId, attempts: 1, status: "failed" };
  const d = decideLoadRecovery({ detector: { status: "disponible", candidate: B, lastError: null }, previousAttempt: prev });
  assert.equal(d, L.MANUAL_UPDATE);
});

test("un intento anterior a otra versión no impide recuperar esta", () => {
  const prev = { to_release: "cccccccccccccccc", attempts: 3, status: "failed" };
  const d = decideLoadRecovery({ detector: { status: "disponible", candidate: B, lastError: null }, previousAttempt: prev });
  assert.equal(d, L.AUTO_UPDATE);
});

test("CA03: sin conexión no se informa una versión nueva", () => {
  for (const lastError of ["offline", "network", "timeout"]) {
    const d = decideLoadRecovery({ detector: { status: "disponible", candidate: B, lastError }, previousAttempt: null });
    assert.equal(d, L.OFFLINE, lastError);
  }
});

test("misma versión publicada → reintentar abrir la pantalla, sin recargar", () => {
  assert.equal(decideLoadRecovery({ detector: { status: "al_dia", candidate: null, lastError: null }, previousAttempt: null }), L.RETRY);
  assert.equal(decideLoadRecovery({ detector: { status: "comprobacion_fallida", candidate: null, lastError: "not_json" }, previousAttempt: null }), L.RETRY);
});

test("sin detector (vite dev) → reintentar", () => {
  assert.equal(decideLoadRecovery({ detector: null, previousAttempt: null }), L.RETRY);
});

// ---- Destino ----
test("isSafeTargetPath: solo rutas del mismo sitio", () => {
  assert.equal(isSafeTargetPath("/mesas/3?tab=cuenta#pago"), true);
  assert.equal(isSafeTargetPath("/"), true);
  for (const bad of ["//evil.com/x", "https://evil.com", "mesas", "", null, "/x\nSet-Cookie: a"]) {
    assert.equal(isSafeTargetPath(bad), false, String(bad));
  }
});

// ---- CA05: un solo intento por incidente ----
test("createIncidentGate: el segundo aviso del mismo fallo se ignora", () => {
  let t = 0;
  const gate = createIncidentGate({ now: () => t, cooldownMs: 10_000 });
  assert.equal(gate.tryEnter(), true);
  assert.equal(gate.tryEnter(), false, "mientras se atiende");
  t = 2_000;
  gate.release();
  t = 5_000;
  assert.equal(gate.tryEnter(), false, "dentro de la espera posterior");
  t = 12_001;
  assert.equal(gate.tryEnter(), true, "un fallo posterior sí se atiende");
});

test("createIncidentGate: un reintento del usuario abre un incidente nuevo enseguida", () => {
  let t = 0;
  const gate = createIncidentGate({ now: () => t, cooldownMs: 10_000 });
  gate.tryEnter();
  gate.release();
  t = 1_000;
  assert.equal(gate.tryEnter(), false);
  gate.reset();
  assert.equal(gate.tryEnter(), true);
});
