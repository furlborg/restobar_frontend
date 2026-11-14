// Aplicar la actualización y confirmar el nuevo arranque (HU-FLZ-ACT-007).
// La lógica del registro está en src/utils/updateAttempt.js.
//
// Aplicar (lo llama el coordinador solo después de revalidar la versión y pasar la barrera):
//   1. Vuelve a consultar la barrera en el mismo instante; entre esa consulta y la recarga no hay
//      ninguna espera, así que ninguna operación nueva puede colarse (HU-FLZ-ACT-006, CA04).
//   2. Anota el intento en sessionStorage (solo ids de versión y hora; nada de negocio).
//   3. Recarga SOLO esta pestaña. La URL se conserva completa (ruta, filtros y #); al volver,
//      las guardias del router validan sesión y permisos como siempre.
//
// Al arrancar (main.js): espera a que la app esté lista y compara la versión cargada con la esperada.
// El éxito se anuncia solo si cargó la versión correcta; nunca por tiempo transcurrido. No recarga sola.

import { readCurrentReleaseId } from "@/utils/appVersion";
import {
  ATTEMPT_STORAGE_KEY,
  BOOT_RESULT,
  canAttempt,
  createAttempt,
  markAttemptFailed,
  parseAttempt,
  resolveAttemptOnBoot,
} from "@/utils/updateAttempt";
import { DETECTOR_STATUS } from "@/utils/versionDetector";
import { isSafeTargetPath } from "@/utils/loadRecovery";
import { getUpdateDetector } from "@/version/updateDetector";
import { updateBarrier } from "@/version/updateBarrier";
import { configureUpdateFlow, setUpdateResult } from "@/version/updateFlow";
import { createAttemptId, EVENT_TYPE } from "@/utils/updateTelemetry";
import { flushUpdateEvents, trackUpdateEvent } from "@/version/updateTelemetry";

// Esperas máximas (HU-FLZ-ACT-001 las ajusta con medidas reales de las terminales).
export const BOOT_TIMEOUT_MS = 20_000; // la versión nueva debe quedar lista en este tiempo
export const RELOAD_START_TIMEOUT_MS = 15_000; // si la página sigue viva, la recarga no empezó

export const readAttempt = () => {
  try {
    return parseAttempt(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY));
  } catch {
    return null;
  }
};

const writeAttempt = (attempt) => {
  try {
    if (attempt) window.sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
    else window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
    return true;
  } catch {
    // Sin almacenamiento se puede actualizar igual, pero al volver no se anunciará el resultado.
    return false;
  }
};

const failure = (code) => Object.assign(new Error(code), { code });

/**
 * Aplica la candidata ya revalidada. Normalmente no vuelve: la página se recarga.
 * `options.targetUrl` (HU-FLZ-ACT-008): pantalla que no pudo cargar; se llega a ella con la versión nueva.
 */
export const applyUpdate = (candidate, options = {}) => {
  const barrier = updateBarrier.evaluate();
  if (!barrier.ok) {
    return Promise.reject(Object.assign(new Error("bloqueada"), { blockedReason: barrier.reason }));
  }

  const currentRelease = readCurrentReleaseId(document);
  if (!currentRelease || !candidate?.releaseId) return Promise.reject(failure("missing_release"));

  const previous = readAttempt();
  if (!canAttempt(previous, candidate.releaseId)) return Promise.reject(failure("too_many_attempts"));

  const attempt = createAttempt({
    fromRelease: currentRelease,
    toRelease: candidate.releaseId,
    toDeployment: candidate.deploymentId,
    now: Date.now(),
    previous,
    attemptId: createAttemptId(),
  });
  writeAttempt(attempt);

  // Evento de inicio, enviado antes de recargar (sendBeacon) (HU-FLZ-ACT-011).
  trackUpdateEvent(EVENT_TYPE.STARTED, {
    attempt: attempt.attempt_id,
    toRelease: attempt.to_release,
    deployment: attempt.to_deployment,
    reason: options?.targetUrl ? "load_recovery" : "manual",
  });
  flushUpdateEvents();

  const target = options?.targetUrl;
  const here = `${window.location.pathname}${window.location.search}`;
  const targetWithoutHash = isSafeTargetPath(target) ? target.split("#")[0] : null;
  if (targetWithoutHash && targetWithoutHash !== here) window.location.assign(target);
  else window.location.reload();

  // Si la página sigue viva demasiado tiempo, la recarga no ocurrió: se informa, sin quedarse cargando.
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      writeAttempt(markAttemptFailed(readAttempt()));
      reject(failure("reload_not_started"));
    }, RELOAD_START_TIMEOUT_MS);
  });
};

configureUpdateFlow({ apply: applyUpdate });

const withTimeout = (promise, ms) =>
  Promise.race([promise.then(() => true), new Promise((resolve) => window.setTimeout(() => resolve(false), ms))]);

/**
 * Al arrancar: si había un intento pendiente, comprueba qué versión cargó.
 * @param {import("vue-router").Router} router
 */
export const resolveUpdateOnBoot = async (router) => {
  const attempt = readAttempt();
  if (!attempt || attempt.status !== "applying") return;

  const eventData = (extra = {}) => ({
    attempt: attempt.attempt_id ?? undefined,
    toRelease: attempt.to_release,
    deployment: attempt.to_deployment,
    durationMs: Math.max(0, Date.now() - attempt.started_at),
    ...extra,
  });

  const ready = await withTimeout(router.isReady(), BOOT_TIMEOUT_MS).catch(() => false);
  if (!ready) {
    writeAttempt(markAttemptFailed(attempt));
    setUpdateResult({ type: "failed", reason: "boot_timeout" });
    trackUpdateEvent(EVENT_TYPE.FAILED, eventData({ reason: "boot_timeout" }));
    return;
  }

  const currentRelease = readCurrentReleaseId(document);
  const outcome = resolveAttemptOnBoot(attempt, currentRelease);

  if (outcome === BOOT_RESULT.COMPLETED) {
    writeAttempt(null);
    setUpdateResult({ type: "completed" });
    trackUpdateEvent(EVENT_TYPE.CONFIRMED, eventData());
    return;
  }

  if (outcome === BOOT_RESULT.STILL_OLD) {
    // El servidor (o una caché) sigue entregando la versión anterior. No se recarga de nuevo sola.
    writeAttempt(markAttemptFailed(attempt));
    setUpdateResult({ type: "failed", reason: "still_old" });
    trackUpdateEvent(EVENT_TYPE.FAILED, eventData({ reason: "still_old" }));
    return;
  }

  if (outcome === BOOT_RESULT.OTHER_RELEASE) {
    // Cargó una publicación posterior: solo es válida si el manifiesto confirma que es la publicada.
    writeAttempt(null);
    const detector = getUpdateDetector();
    const state = detector ? await detector.checkNow() : null;
    if (state?.status === DETECTOR_STATUS.UP_TO_DATE) {
      setUpdateResult({ type: "completed" });
      trackUpdateEvent(EVENT_TYPE.CONFIRMED, eventData({ reason: "other_release" }));
    } else {
      // Ni éxito ni fallo demostrado: queda registrado como intento sin confirmación.
      trackUpdateEvent(EVENT_TYPE.FAILED, eventData({ reason: "unconfirmed" }));
    }
    // Si no se confirma, no se anuncia nada: el detector ofrecerá la versión correcta si existe.
  }
};
