import test from "node:test";
import assert from "node:assert/strict";
import {
  decideNoticeView,
  createPostponement,
  parsePostponement,
  NOTICE_MESSAGE as M,
  REMIND_AFTER_MS,
} from "./updateNotice.js";
import { DETECTOR_STATUS as S } from "./versionDetector.js";
import { COORDINATOR_PHASE as P } from "./updateCoordinator.js";

const B = { releaseId: "bbbbbbbbbbbbbbbb", deploymentId: "dep-b", status: "ready" };
const C = { releaseId: "cccccccccccccccc", deploymentId: "dep-c", status: "ready" };
const detectorWith = (candidate) => ({ status: S.AVAILABLE, candidate });
const idle = { phase: P.IDLE, reason: null };

const view = (over = {}) =>
  decideNoticeView({
    detector: detectorWith(B),
    coordinator: idle,
    postponement: null,
    now: 1_000_000,
    interruptionUnsafe: false,
    ...over,
  });

test("CA01: con versión nueva se muestra la tarjeta 'disponible'", () => {
  assert.deepEqual(view(), { mode: "card", message: M.AVAILABLE, remindAt: null, reason: null });
});

test("sin versión nueva, al día o sin detector: nada", () => {
  assert.equal(view({ detector: null }).mode, "hidden");
  assert.equal(view({ detector: { status: S.UP_TO_DATE, candidate: null } }).mode, "hidden");
  assert.equal(view({ detector: { status: S.CHECK_FAILED, candidate: null } }).mode, "hidden");
  assert.equal(view({ detector: { status: S.NOT_CHECKED, candidate: null } }).mode, "hidden");
});

test("CA07: si el detector retira la candidata, desaparecen tarjeta e indicador", () => {
  const postponement = createPostponement("dep-b", 1_000_000);
  assert.equal(view({ postponement }).mode, "indicator");
  assert.equal(view({ postponement, detector: { status: S.UP_TO_DATE, candidate: null } }).mode, "hidden");
});

test("CA02: después de 'Más tarde' queda solo el indicador durante 30 minutos", () => {
  const now = 1_000_000;
  const postponement = createPostponement("dep-b", now);
  assert.equal(postponement.remind_at, now + REMIND_AFTER_MS);
  assert.deepEqual(view({ postponement, now: now + 60_000 }), {
    mode: "indicator",
    message: null,
    remindAt: now + REMIND_AFTER_MS,
    reason: null,
  });
  assert.equal(view({ postponement, now: now + REMIND_AFTER_MS - 1 }).mode, "indicator");
});

test("cumplido el plazo, la tarjeta vuelve", () => {
  const postponement = createPostponement("dep-b", 0);
  assert.equal(view({ postponement, now: REMIND_AFTER_MS }).mode, "card");
});

test("CA03: si el plazo se cumple durante un cobro, espera sin interrumpir", () => {
  const postponement = createPostponement("dep-b", 0);
  assert.equal(view({ postponement, now: REMIND_AFTER_MS + 5, interruptionUnsafe: true }).mode, "indicator");
  assert.equal(view({ postponement, now: REMIND_AFTER_MS + 5, interruptionUnsafe: false }).mode, "card");
});

test("la primera aparición tampoco irrumpe sobre un cobro", () => {
  assert.equal(view({ interruptionUnsafe: true }).mode, "indicator");
});

test("una publicación nueva vuelve a mostrar la tarjeta aunque la anterior estuviera pospuesta", () => {
  const postponement = createPostponement("dep-b", 1_000_000);
  assert.equal(view({ postponement, detector: detectorWith(C), now: 1_000_001 }).mode, "card");
});

test("lo que pidió el usuario siempre se informa en la tarjeta", () => {
  const postponement = createPostponement("dep-b", 1_000_000);
  const cases = [
    [{ phase: P.CHECKING }, M.CHECKING],
    [{ phase: P.OFFLINE, reason: "offline" }, M.OFFLINE],
    [{ phase: P.BLOCKED, reason: "unsaved" }, M.UNSAVED],
    [{ phase: P.BLOCKED, reason: "payment" }, M.PAYMENT],
    [{ phase: P.BLOCKED, reason: "saving" }, M.SAVING],
    [{ phase: P.BLOCKED, reason: "uncertain" }, M.UNCERTAIN],
    [{ phase: P.BLOCKED, reason: "barrier_error" }, M.UNSAVED],
    [{ phase: P.APPLYING }, M.APPLYING],
    [{ phase: P.FAILED, reason: "boot_timeout" }, M.FAILED],
  ];
  for (const [coordinator, message] of cases) {
    const v = view({ coordinator, postponement, interruptionUnsafe: true });
    assert.deepEqual(v, { mode: "card", message, remindAt: null, reason: coordinator.reason ?? null }, coordinator.phase);
  }
});

test("parsePostponement: acepta lo que guarda createPostponement", () => {
  const p = createPostponement("dep-b", 123);
  assert.deepEqual(parsePostponement(JSON.stringify(p)), p);
});

test("parsePostponement: descarta vacíos, JSON roto o campos incorrectos", () => {
  for (const raw of [null, undefined, "", "{", "null", "[]", '{"deployment_id":1,"remind_at":2}', '{"deployment_id":"x"}', '{"deployment_id":"x","remind_at":"mañana"}']) {
    assert.equal(parsePostponement(raw), null, String(raw));
  }
});

// ---- Resultado tras recargar (HU-FLZ-ACT-007) ----
test("resultado 'completada' se muestra aunque ya no haya candidata", () => {
  const v = view({ detector: { status: S.UP_TO_DATE, candidate: null }, result: { type: "completed" } });
  assert.deepEqual(v, { mode: "card", message: M.COMPLETED, remindAt: null, reason: null });
});

test("resultado 'fallida' muestra el motivo y gana a la posposición", () => {
  const postponement = createPostponement("dep-b", 1_000_000);
  const v = view({ postponement, result: { type: "failed", reason: "still_old" } });
  assert.deepEqual(v, { mode: "card", message: M.FAILED, remindAt: null, reason: "still_old" });
});

test("lo que el usuario está pidiendo ahora gana al resultado anterior", () => {
  const v = view({ coordinator: { phase: P.CHECKING }, result: { type: "failed", reason: "still_old" } });
  assert.equal(v.message, M.CHECKING);
});
