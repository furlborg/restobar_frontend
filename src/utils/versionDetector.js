// Detector de versiones nuevas (HU-FLZ-ACT-004).
// Puro: no toca window, document ni fetch; todo llega por `deps`, para probarlo con `node --test`.
// La conexión con el navegador está en src/version/updateDetector.js.
//
// Qué hace:
// - Primera consulta a los 5 s; después cada 60 s (±10 %) solo con la pestaña visible.
// - Al volver a la pestaña o recuperar la red consulta de nuevo, con 30 s mínimo entre consultas.
// - Nunca hay dos consultas a la vez. Cada consulta se corta a los 5 s.
// - Si fallan seguidas, espera 60 s, 120 s y luego 300 s; un éxito vuelve al ritmo normal.
// - Solo informa. Nunca recarga, nunca borra nada y una falla nunca se toma como versión nueva.

import { parseVersionManifest, isUpdateCandidate } from "./appVersion.js";

export const DETECTOR_STATUS = Object.freeze({
  NOT_CHECKED: "sin_comprobar",
  UP_TO_DATE: "al_dia",
  AVAILABLE: "disponible",
  CHECK_FAILED: "comprobacion_fallida",
});

export const DEFAULT_DETECTOR_CONFIG = Object.freeze({
  initialDelayMs: 5_000,
  intervalMs: 60_000,
  jitterRatio: 0.1,
  timeoutMs: 5_000,
  minEventGapMs: 30_000,
  backoffMs: Object.freeze([60_000, 120_000, 300_000]),
});

/**
 * @param {object} deps
 * @param {string} deps.currentReleaseId  versión con la que arrancó esta pestaña
 * @param {(opts: {signal: AbortSignal}) => Promise<{ok: boolean, status: number, text: string}>} deps.fetchText
 * @param {() => boolean} deps.isVisible
 * @param {() => boolean} deps.isOnline   orienta; no prueba que el servidor responda
 * @param {(fn: Function, ms: number) => any} deps.setTimer
 * @param {(handle: any) => void} deps.clearTimer
 * @param {() => number} deps.now
 * @param {() => number} deps.random      [0, 1)
 * @param {object} [config]               reemplaza valores de DEFAULT_DETECTOR_CONFIG
 */
export const createVersionDetector = (deps, config = {}) => {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  const { currentReleaseId, fetchText, isVisible, isOnline, setTimer, clearTimer, now, random } = deps;

  let state = Object.freeze({
    status: DETECTOR_STATUS.NOT_CHECKED,
    currentReleaseId,
    candidate: null,
    lastCheckedAt: null,
    lastError: null,
    consecutiveFailures: 0,
  });
  const listeners = new Set();

  let started = false;
  let generation = 0; // sube con stop(): invalida resultados de consultas anteriores
  let timer = null;
  let timerDueAt = null;
  let inFlight = null; // { generation, promise, abort }
  let lastCheckStartedAt = null;

  const setState = (patch) => {
    state = Object.freeze({ ...state, ...patch });
    for (const fn of listeners) {
      try {
        fn(state);
      } catch {
        // un oyente con error no debe detener al detector
      }
    }
  };

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
      timerDueAt = null;
    }
  };

  const schedule = (ms) => {
    cancelTimer();
    timerDueAt = now() + ms;
    timer = setTimer(() => {
      timer = null;
      timerDueAt = null;
      if (!started) return;
      // Pestaña oculta: no se sigue consultando; se retoma con notifyVisible().
      if (!isVisible()) return;
      runCheck();
    }, ms);
  };

  const nextDelay = () => {
    const failures = state.consecutiveFailures;
    if (failures > 0) return cfg.backoffMs[Math.min(failures - 1, cfg.backoffMs.length - 1)];
    const jitter = cfg.jitterRatio * (2 * random() - 1);
    return Math.round(cfg.intervalMs * (1 + jitter));
  };

  const scheduleNext = () => {
    if (!started) return;
    if (!isVisible()) {
      cancelTimer();
      return;
    }
    schedule(nextDelay());
  };

  const applyFailure = (reason) => {
    const failures = state.consecutiveFailures + 1;
    // Si ya había una versión ofrecida se mantiene: una falla pasajera no la retira
    // ni la confirma. Sin versión ofrecida queda "comprobación fallida".
    setState({
      status: state.candidate ? DETECTOR_STATUS.AVAILABLE : DETECTOR_STATUS.CHECK_FAILED,
      lastError: reason,
      consecutiveFailures: failures,
      lastCheckedAt: now(),
    });
  };

  const applyManifest = (manifest) => {
    const base = { lastError: null, consecutiveFailures: 0, lastCheckedAt: now() };
    if (manifest.releaseId === currentReleaseId) {
      // Al día; también cubre el rollback a esta misma versión: se retira la oferta anterior.
      setState({ ...base, status: DETECTOR_STATUS.UP_TO_DATE, candidate: null });
    } else if (isUpdateCandidate(manifest, currentReleaseId)) {
      setState({ ...base, status: DETECTOR_STATUS.AVAILABLE, candidate: manifest });
    } else {
      // Publicación distinta pero no "ready": no es candidata y no cambia lo que ya se sabía.
      // Solo deja de figurar como falla, porque el servidor sí respondió bien.
      const status = state.status === DETECTOR_STATUS.CHECK_FAILED ? DETECTOR_STATUS.NOT_CHECKED : state.status;
      setState({ ...base, status });
    }
  };

  const runCheck = () => {
    if (inFlight && inFlight.generation === generation) return inFlight.promise;
    cancelTimer();
    lastCheckStartedAt = now();
    const myGeneration = generation;

    if (!isOnline()) {
      applyFailure("offline");
      scheduleNext();
      return Promise.resolve(state);
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutHandle = setTimer(() => {
      timedOut = true;
      controller.abort();
    }, cfg.timeoutMs);

    const promise = (async () => {
      let outcome;
      try {
        const res = await fetchText({ signal: controller.signal });
        if (!res || !res.ok) {
          outcome = { error: `http_${res?.status ?? "sin_respuesta"}` };
        } else {
          const parsed = parseVersionManifest(res.text);
          outcome = parsed.ok ? { manifest: parsed.manifest } : { error: parsed.reason };
        }
      } catch {
        outcome = { error: timedOut ? "timeout" : "network" };
      } finally {
        clearTimer(timeoutHandle);
      }

      // Respuesta de un contexto que ya no está activo (stop/start): se ignora.
      if (myGeneration !== generation) return state;
      inFlight = null;
      if (outcome.manifest) applyManifest(outcome.manifest);
      else applyFailure(outcome.error);
      scheduleNext();
      return state;
    })();

    inFlight = { generation: myGeneration, promise, abort: () => controller.abort() };
    return promise;
  };

  /** Evento de foco o red: consulta si pasaron 30 s desde la última; si no, la programa para entonces. */
  const onEvent = () => {
    if (!started || !isVisible()) return;
    if (inFlight && inFlight.generation === generation) return;
    if (lastCheckStartedAt === null) {
      // Aún no corrió la primera consulta: si su timer sigue pendiente, se respeta.
      if (timer !== null) return;
      runCheck();
      return;
    }
    const wait = lastCheckStartedAt + cfg.minEventGapMs - now();
    if (wait <= 0) runCheck();
    // Adelanta la próxima consulta al fin de los 30 s si estaba programada más tarde.
    else if (timer === null || timerDueAt > now() + wait) schedule(wait);
  };

  return {
    start() {
      if (started) return;
      started = true;
      schedule(cfg.initialDelayMs);
    },
    stop() {
      if (!started) return;
      started = false;
      generation += 1;
      cancelTimer();
      if (inFlight) {
        inFlight.abort();
        inFlight = null;
      }
    },
    /** Consulta ya, sin esperar el intervalo (la usa HU-FLZ-ACT-007 para revalidar antes de aplicar). */
    checkNow() {
      if (!started) return Promise.resolve(state);
      return runCheck();
    },
    notifyVisible: onEvent,
    notifyOnline: onEvent,
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
