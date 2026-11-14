// Recuperación cuando una pantalla no puede cargar, con la app funcionando (HU-FLZ-ACT-008).
// Reemplaza la recarga sin límite que hacía router.onError.
//
// Ante un fallo al cargar los archivos de una pantalla:
//   1. Agrupa los avisos del mismo fallo (router y Vite pueden avisar los dos): un solo intento.
//   2. Consulta el manifiesto ahora mismo.
//   3. Versión nueva y primer intento → actualiza por el coordinador (revalida + barrera) y llega
//      directo a la pantalla pedida. Si hay trabajo sin guardar, la barrera lo impide: no se recarga.
//   4. Versión nueva ya intentada → no se repite solo; el usuario decide.
//   5. Misma versión o sin conexión → "No se pudo abrir la pantalla" con Reintentar, sin recargar.
// Nunca llama a reload por su cuenta: todo pasa por el coordinador de HU-FLZ-ACT-007.

import { createIncidentGate, decideLoadRecovery, isChunkLoadError, isSafeTargetPath, LOAD_ACTION } from "@/utils/loadRecovery";
import { getUpdateDetector } from "@/version/updateDetector";
import { readAttempt } from "@/version/applyUpdate";
import { setLoadFailure, setLoadRetryNavigator, updateToTarget } from "@/version/updateFlow";

const gate = createIncidentGate({ now: () => Date.now() });
const PRELOAD_GRACE_MS = 300;

const currentPath = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

/** Atiende un fallo de carga. Devuelve true si era un fallo de carga (aunque se haya agrupado). */
export const handleChunkLoadError = async (error, targetPath) => {
  if (!isChunkLoadError(error)) return false;
  if (!gate.tryEnter()) return true;

  const target = isSafeTargetPath(targetPath) ? targetPath : currentPath();
  try {
    const detector = getUpdateDetector();
    const state = detector ? await detector.checkNow() : null;
    const action = decideLoadRecovery({ detector: state, previousAttempt: readAttempt() });

    if (action === LOAD_ACTION.AUTO_UPDATE) {
      // Muestra "Preparando…/Actualizando…"; si hay trabajo pendiente, el bloqueo con su motivo.
      await updateToTarget(target);
    } else if (action === LOAD_ACTION.MANUAL_UPDATE) {
      setLoadFailure({ kind: "needs_update", target });
    } else if (action === LOAD_ACTION.OFFLINE) {
      setLoadFailure({ kind: "offline", target });
    } else {
      setLoadFailure({ kind: "retry", target });
    }
  } catch (handlingError) {
    console.warn("[flizzy] no se pudo atender el fallo de carga", handlingError);
    setLoadFailure({ kind: "retry", target });
  } finally {
    gate.release();
  }
  return true;
};

/**
 * Instala la recuperación: router.onError (pantallas del router) y vite:preloadError
 * (archivos que Vite precarga, también en componentes diferidos fuera del router).
 * @param {import("vue-router").Router} router
 */
export const installLoadRecovery = (router) => {
  let lastRouterIncidentAt = 0;

  setLoadRetryNavigator((target) => {
    gate.reset(); // si vuelve a fallar, el usuario tiene que ver el aviso de nuevo
    router.push(target).catch(() => {
      // un nuevo fallo vuelve a pasar por router.onError
    });
  });

  router.onError((error, to) => {
    if (!isChunkLoadError(error)) return;
    lastRouterIncidentAt = Date.now();
    handleChunkLoadError(error, to?.fullPath);
  });

  window.addEventListener("vite:preloadError", (event) => {
    const error = event?.payload ?? event;
    // Si el mismo fallo llega también por el router (con la ruta destino), se usa ese.
    window.setTimeout(() => {
      if (Date.now() - lastRouterIncidentAt < PRELOAD_GRACE_MS * 2) return;
      handleChunkLoadError(error, currentPath());
    }, PRELOAD_GRACE_MS);
  });
};
