// Coordinador de "Actualizar ahora" (HU-FLZ-ACT-005, base para HU-FLZ-ACT-006 y HU-FLZ-ACT-007).
// Puro: todo llega por `deps`, para probarlo con `node --test`.
//
// El botón nunca recarga directamente. Pide aquí una evaluación:
//   1. Sin red: no se intenta.
//   2. Revalida la versión publicada (no confía en metadatos viejos).
//   3. Pregunta a la barrera si hay trabajo que se perdería (HU-FLZ-ACT-006).
//   4. Solo entonces aplica (HU-FLZ-ACT-007).
// Pulsar varias veces devuelve la misma solicitud en curso: una sola actualización activa.

import { DETECTOR_STATUS } from "./versionDetector.js";

export const COORDINATOR_PHASE = Object.freeze({
  IDLE: "idle",
  CHECKING: "checking",
  OFFLINE: "offline",
  BLOCKED: "blocked",
  APPLYING: "applying",
  FAILED: "failed",
});

const NETWORK_ERRORS = new Set(["offline", "network", "timeout"]);

/**
 * @param {object} deps
 * @param {() => Promise<object>} deps.revalidate        consulta ya el manifiesto; devuelve el estado del detector
 * @param {() => boolean} deps.isOnline
 * @param {() => ({ok: true} | {ok: false, reason: string})} deps.evaluateBarrier
 * @param {(candidate: object) => Promise<void>} deps.apply  normalmente no vuelve (recarga la página)
 */
export const createUpdateCoordinator = (deps) => {
  const { revalidate, isOnline, evaluateBarrier, apply } = deps;
  let state = Object.freeze({ phase: COORDINATOR_PHASE.IDLE, reason: null, candidate: null });
  let inFlight = null;
  const listeners = new Set();

  const setState = (next) => {
    state = Object.freeze({ phase: next.phase, reason: next.reason ?? null, candidate: next.candidate ?? null });
    for (const fn of listeners) {
      try {
        fn(state);
      } catch {
        // un oyente con error no debe detener al coordinador
      }
    }
  };

  const run = async () => {
    setState({ phase: COORDINATOR_PHASE.CHECKING });

    if (!isOnline()) {
      setState({ phase: COORDINATOR_PHASE.OFFLINE, reason: "offline" });
      return state;
    }

    let detected;
    try {
      detected = await revalidate();
    } catch {
      setState({ phase: COORDINATOR_PHASE.FAILED, reason: "revalidation_error" });
      return state;
    }

    // La revalidación tiene que haber respondido bien ahora; una candidata vieja no basta.
    if (detected?.lastError) {
      const offline = NETWORK_ERRORS.has(detected.lastError);
      setState({
        phase: offline ? COORDINATOR_PHASE.OFFLINE : COORDINATOR_PHASE.FAILED,
        reason: detected.lastError,
      });
      return state;
    }
    if (detected?.status !== DETECTOR_STATUS.AVAILABLE || !detected.candidate) {
      // Ya no hay nada que aplicar (p. ej., rollback a esta versión): se retira en silencio.
      setState({ phase: COORDINATOR_PHASE.IDLE });
      return state;
    }

    let barrier;
    try {
      barrier = evaluateBarrier();
    } catch {
      // Si no se puede comprobar, no es seguro: nunca recargar a ciegas.
      barrier = { ok: false, reason: "barrier_error" };
    }
    if (!barrier?.ok) {
      setState({ phase: COORDINATOR_PHASE.BLOCKED, reason: barrier?.reason || "unknown", candidate: detected.candidate });
      return state;
    }

    setState({ phase: COORDINATOR_PHASE.APPLYING, candidate: detected.candidate });
    try {
      await apply(detected.candidate);
    } catch (error) {
      // La barrera puede bloquear en el último instante (una operación empezó mientras tanto):
      // es un bloqueo, no un fallo, y el trabajo sigue en pantalla.
      if (error?.blockedReason) {
        setState({ phase: COORDINATOR_PHASE.BLOCKED, reason: error.blockedReason, candidate: detected.candidate });
      } else {
        setState({
          phase: COORDINATOR_PHASE.FAILED,
          reason: error?.code || "apply_error",
          candidate: detected.candidate,
        });
      }
    }
    return state;
  };

  return {
    /** "Actualizar ahora". Repetido mientras corre devuelve la misma promesa. */
    requestUpdate() {
      if (inFlight) return inFlight;
      inFlight = run().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
    /** "Volver a la operación" o cerrar el mensaje: vuelve a reposo si no hay nada corriendo. */
    dismiss() {
      if (inFlight || state.phase === COORDINATOR_PHASE.IDLE) return;
      setState({ phase: COORDINATOR_PHASE.IDLE });
    },
    isBusy: () => inFlight !== null,
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
