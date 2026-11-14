// Recuperación cuando una pantalla no puede cargar (HU-FLZ-ACT-008). Puro, para `node --test`.
//
// Solo se ocupa de fallos al cargar archivos de la web (fragmentos .js/.css de una pantalla).
// Un error funcional de JavaScript no es una actualización y no se trata aquí.

import { DETECTOR_STATUS } from "./versionDetector.js";

export const LOAD_ACTION = Object.freeze({
  AUTO_UPDATE: "auto_update", // hay versión nueva y es el primer intento: recuperar una vez
  MANUAL_UPDATE: "manual_update", // ya se intentó esa versión: no se repite solo, lo decide el usuario
  OFFLINE: "offline", // no se pudo consultar el servidor: es la conexión, no una versión nueva
  RETRY: "retry", // la versión publicada es la misma: reintentar abrir la pantalla
});

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i, // Chrome / Edge
  /error loading dynamically imported module/i, // Firefox
  /Importing a module script failed/i, // Safari
  /Unable to preload CSS/i, // Vite (CSS de una pantalla)
  /Loading (CSS )?chunk [\w-]+ failed/i,
];

const NETWORK_ERRORS = new Set(["offline", "network", "timeout"]);

/** ¿El error es de carga de un archivo de la web (y no un error funcional)? */
export const isChunkLoadError = (error) => {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const message = typeof error === "string" ? error : String(error.message || "");
  return CHUNK_ERROR_PATTERNS.some((re) => re.test(message));
};

/**
 * Qué hacer con un fallo de carga, según lo que el detector acaba de consultar.
 * @param {{ detector: object|null, previousAttempt: object|null }} input
 *   detector: estado devuelto por checkNow() (HU-FLZ-ACT-004), o null si no hay detector (vite dev)
 *   previousAttempt: registro de intento de HU-FLZ-ACT-007 guardado en esta pestaña
 */
export const decideLoadRecovery = ({ detector, previousAttempt }) => {
  if (!detector) return LOAD_ACTION.RETRY;
  // "Failed to fetch" no demuestra que falte un archivo: si el servidor no respondió, es la red.
  if (NETWORK_ERRORS.has(detector.lastError)) return LOAD_ACTION.OFFLINE;
  const candidate = detector.status === DETECTOR_STATUS.AVAILABLE ? detector.candidate : null;
  if (candidate) {
    // Una sola recuperación automática por versión: si ya se intentó, no se repite sola.
    const alreadyTried = previousAttempt && previousAttempt.to_release === candidate.releaseId;
    return alreadyTried ? LOAD_ACTION.MANUAL_UPDATE : LOAD_ACTION.AUTO_UPDATE;
  }
  return LOAD_ACTION.RETRY;
};

/** Solo rutas del mismo sitio ("/mesas?x=1#y"); nunca otra web ni "//dominio". */
export const isSafeTargetPath = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !/[\r\n]/.test(path);

/**
 * Agrupa los avisos de un mismo fallo (router + Vite pueden avisar los dos): un solo intento.
 * Mientras se atiende un incidente, y hasta `cooldownMs` después, los demás se ignoran.
 */
export const createIncidentGate = ({ now, cooldownMs = 10_000 }) => {
  let busy = false;
  let releasedAt = -Infinity;
  return {
    tryEnter() {
      if (busy || now() - releasedAt < cooldownMs) return false;
      busy = true;
      return true;
    },
    release() {
      busy = false;
      releasedAt = now();
    },
    /** Una acción del usuario (Reintentar) es un incidente nuevo: no se agrupa con el anterior. */
    reset() {
      busy = false;
      releasedAt = -Infinity;
    },
    isBusy: () => busy,
  };
};
