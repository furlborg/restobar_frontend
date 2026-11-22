import test from "node:test";
import assert from "node:assert/strict";
import { formatLockRemaining, lockOwnerName } from "./lockMessage.js";

// ---- Caso A: comportamiento previo (bloqueos de minutos) ----
test("formatLockRemaining: bloqueos de varios minutos siguen mostrándose en minutos", () => {
  assert.equal(formatLockRemaining({ remaining_seconds: 840 }), "14 minutos");
  assert.equal(formatLockRemaining({ remaining_time: 899 }), "15 minutos");
  assert.equal(formatLockRemaining({ remaining_minutes: 14 }), "14 minutos");
});

test("formatLockRemaining: un minuto exacto va en singular", () => {
  assert.equal(formatLockRemaining({ remaining_seconds: 60 }), "1 minuto");
  assert.equal(formatLockRemaining({ remaining_minutes: 1 }), "1 minuto");
});

test("lockOwnerName: acepta los nombres de campo anteriores", () => {
  assert.equal(lockOwnerName({ locked_by_username: "ANA" }), "ANA");
});

// ---- Caso B: corrección (bloqueos de segundos) ----
test("formatLockRemaining: menos de un minuto se muestra en segundos, no en '0 minutos'", () => {
  assert.equal(formatLockRemaining({ remaining_seconds: 49, remaining_minutes: 0 }), "49 segundos");
  assert.equal(formatLockRemaining({ remaining_time: 50, remaining_minutes: 0 }), "50 segundos");
  assert.equal(formatLockRemaining({ remaining_seconds: 1 }), "1 segundo");
  assert.equal(formatLockRemaining({ remaining_seconds: 0.4 }), "1 segundo");
});

test("formatLockRemaining: sin datos devuelve texto vacío (el llamador decide el texto alterno)", () => {
  assert.equal(formatLockRemaining(null), "");
  assert.equal(formatLockRemaining({}), "");
  assert.equal(formatLockRemaining({ remaining_seconds: 0, remaining_minutes: 0 }), "");
  assert.equal(formatLockRemaining({ remaining_seconds: "abc" }), "");
});

test("lockOwnerName: usa el `username` que manda el servidor y cae a 'otro usuario'", () => {
  assert.equal(lockOwnerName({ username: "CAJERO1" }), "CAJERO1");
  assert.equal(lockOwnerName({}), "otro usuario");
  assert.equal(lockOwnerName(null), "otro usuario");
});
