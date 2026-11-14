import test from "node:test";
import assert from "node:assert/strict";
import {
  createAttempt,
  canAttempt,
  parseAttempt,
  resolveAttemptOnBoot,
  markAttemptFailed,
  BOOT_RESULT as R,
  MAX_ATTEMPTS_PER_RELEASE,
} from "./updateAttempt.js";

const A = "aaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbb";
const C = "cccccccccccccccc";
const base = { fromRelease: A, toRelease: B, toDeployment: "dep-b", now: 1_000 };

test("createAttempt: primer intento, sin datos de negocio", () => {
  const a = createAttempt(base);
  assert.deepEqual(a, {
    schema: 1,
    from_release: A,
    to_release: B,
    to_deployment: "dep-b",
    started_at: 1_000,
    attempts: 1,
    status: "applying",
  });
});

test("createAttempt: reintentar la misma versión suma; otra versión empieza en 1", () => {
  const first = createAttempt(base);
  const second = createAttempt({ ...base, previous: markAttemptFailed(first) });
  assert.equal(second.attempts, 2);
  const other = createAttempt({ ...base, toRelease: C, previous: second });
  assert.equal(other.attempts, 1);
});

test("canAttempt: máximo de intentos por versión", () => {
  assert.equal(canAttempt(null, B), true);
  let prev = createAttempt(base);
  for (let i = 1; i < MAX_ATTEMPTS_PER_RELEASE; i += 1) {
    assert.equal(canAttempt(prev, B), true, `intento ${i + 1}`);
    prev = createAttempt({ ...base, previous: prev });
  }
  assert.equal(prev.attempts, MAX_ATTEMPTS_PER_RELEASE);
  assert.equal(canAttempt(prev, B), false, "se agotaron los intentos para B");
  assert.equal(canAttempt(prev, C), true, "una versión distinta sí puede intentarse");
});

test("parseAttempt: acepta lo que guarda createAttempt", () => {
  const a = createAttempt(base);
  assert.deepEqual(parseAttempt(JSON.stringify(a)), a);
});

test("parseAttempt: descarta vacíos, JSON roto, otro esquema o campos incorrectos", () => {
  const good = createAttempt(base);
  const bad = [
    null,
    "",
    "{",
    "null",
    JSON.stringify({ ...good, schema: 2 }),
    JSON.stringify({ ...good, to_release: "" }),
    JSON.stringify({ ...good, attempts: 0 }),
    JSON.stringify({ ...good, attempts: 1.5 }),
    JSON.stringify({ ...good, started_at: "ayer" }),
    JSON.stringify({ ...good, status: 3 }),
  ];
  for (const raw of bad) assert.equal(parseAttempt(raw), null, String(raw));
});

test("CA01: arrancó la versión esperada → completada", () => {
  assert.equal(resolveAttemptOnBoot(createAttempt(base), B), R.COMPLETED);
});

test("CA04: el servidor sigue entregando la versión de partida → sigue la anterior", () => {
  assert.equal(resolveAttemptOnBoot(createAttempt(base), A), R.STILL_OLD);
});

test("CA07: arrancó otra versión (publicación posterior) → hay que validarla", () => {
  assert.equal(resolveAttemptOnBoot(createAttempt(base), C), R.OTHER_RELEASE);
});

test("sin intento, o con un intento ya marcado como fallido, no hay nada que resolver", () => {
  assert.equal(resolveAttemptOnBoot(null, B), R.NONE);
  assert.equal(resolveAttemptOnBoot(markAttemptFailed(createAttempt(base)), A), R.NONE, "no se repite el aviso de fallo en cada arranque");
});

test("markAttemptFailed conserva el conteo", () => {
  const f = markAttemptFailed(createAttempt({ ...base, previous: createAttempt(base) }));
  assert.equal(f.status, "failed");
  assert.equal(f.attempts, 2);
  assert.equal(markAttemptFailed(null), null);
});
