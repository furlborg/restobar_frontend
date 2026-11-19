// Conexión de la barrera de actualización con Vue y axios (HU-FLZ-ACT-006).
// La lógica está en src/utils/updateBarrier.js.
//
// - useUpdateBlocker(fn): una pantalla con trabajo propio registra cómo saber si tiene algo sin guardar.
// - useSensitiveScreen(): una pantalla de cobro avisa que el recordatorio no debe aparecer encima.
// - trackRequest / trackResponse / trackError: los usa src/api/index.js para vigilar escrituras.
//
// Solo afecta a esta pestaña: actualizar una pestaña nunca recarga a las demás.

import { onBeforeUnmount, onMounted } from "vue";
import { createHttpWriteTracker, createUpdateBarrier, BARRIER_REASON } from "@/utils/updateBarrier";
import { configureUpdateFlow, setInterruptionUnsafe, updateNow } from "@/version/updateFlow";

export const updateBarrier = createUpdateBarrier();

// ---- Pantallas de cobro: el recordatorio no las interrumpe ----
let sensitiveScreens = 0;
const refreshInterruption = () => {
  setInterruptionUnsafe(sensitiveScreens > 0 || updateBarrier.hasPaymentInFlight());
};
updateBarrier.subscribe(refreshInterruption);

configureUpdateFlow({ evaluateBarrier: () => updateBarrier.evaluate() });

/**
 * Registra el trabajo sin guardar de la pantalla actual mientras está montada.
 * `hasUnsaved()` devuelve true si recargar perdería algo. Se lee en el momento de actualizar.
 */
export const useUpdateBlocker = (hasUnsaved) => {
  let off = null;
  onMounted(() => {
    off = updateBarrier.registerBlocker(() => (hasUnsaved() ? BARRIER_REASON.UNSAVED : null));
  });
  onBeforeUnmount(() => {
    if (off) off();
    off = null;
  });
};

/** Mientras la pantalla está montada, el recordatorio de actualización no aparece encima. */
export const useSensitiveScreen = () => {
  let active = false;
  onMounted(() => {
    active = true;
    sensitiveScreens += 1;
    refreshInterruption();
  });
  onBeforeUnmount(() => {
    if (!active) return;
    active = false;
    sensitiveScreens = Math.max(0, sensitiveScreens - 1);
    refreshInterruption();
  });
};

/** "Ya lo revisé": el usuario confirmó por el flujo normal las operaciones sin respuesta. */
export const acknowledgeUncertainAndRetry = () => {
  updateBarrier.acknowledgeUncertain();
  return updateNow();
};

// ---- Escrituras por axios (los usa src/api/index.js) ----
// Con respuesta del servidor el resultado se conoce; sin respuesta (red caída, corte,
// cancelación) pudo haberse aplicado y queda incierto hasta que el usuario lo revise.
const tracker = createHttpWriteTracker(updateBarrier);
export const trackRequest = tracker.onRequest;
export const trackResponse = tracker.onResponse;
export const trackError = tracker.onError;
