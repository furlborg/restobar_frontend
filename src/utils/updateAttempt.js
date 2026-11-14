// Registro de un intento de actualización y su verificación al arrancar (HU-FLZ-ACT-007).
// Puro, para probarlo con `node --test`. Lo usa src/version/applyUpdate.js.
//
// Antes de recargar se guarda (en sessionStorage, solo para esta pestaña):
//   de qué versión se parte, a cuál se va, la publicación, cuándo y cuántos intentos van.
// No se guarda ningún dato de negocio: restaurar la vista nunca repite un pedido, pago ni impresión.
// Al arrancar se compara la versión que cargó con la esperada; el éxito nunca se deduce del tiempo.

export const ATTEMPT_STORAGE_KEY = "flizzy-update-attempt";
export const ATTEMPT_SCHEMA = 1;
export const MAX_ATTEMPTS_PER_RELEASE = 3;

export const BOOT_RESULT = Object.freeze({
  NONE: "none", // no había intento pendiente
  COMPLETED: "completed", // cargó la versión esperada
  STILL_OLD: "still_old", // el servidor sigue entregando la versión de partida
  OTHER_RELEASE: "other_release", // cargó otra versión (publicación posterior): hay que validarla
});

/**
 * Crea el registro del intento. Si el anterior iba a la misma versión, suma el intento.
 * @param {{fromRelease: string, toRelease: string, toDeployment: string, now: number, previous?: object|null}} p
 */
export const createAttempt = ({ fromRelease, toRelease, toDeployment, now, previous = null, attemptId = null }) => ({
  schema: ATTEMPT_SCHEMA,
  attempt_id: attemptId, // correlaciona los eventos del intento (HU-FLZ-ACT-011); no es sensible
  from_release: fromRelease,
  to_release: toRelease,
  to_deployment: toDeployment,
  started_at: now,
  attempts: previous && previous.to_release === toRelease ? previous.attempts + 1 : 1,
  status: "applying",
});

/** ¿Se puede intentar otra vez ir a esta versión? */
export const canAttempt = (previous, toRelease, max = MAX_ATTEMPTS_PER_RELEASE) =>
  !previous || previous.to_release !== toRelease || previous.attempts < max;

/** Lee el registro guardado; cualquier cosa rara o de otro esquema se descarta (null). */
export const parseAttempt = (raw) => {
  if (typeof raw !== "string" || raw === "") return null;
  try {
    const d = JSON.parse(raw);
    const isText = (v) => typeof v === "string" && v !== "";
    if (
      !d ||
      d.schema !== ATTEMPT_SCHEMA ||
      !isText(d.from_release) ||
      !isText(d.to_release) ||
      !isText(d.to_deployment) ||
      !Number.isFinite(d.started_at) ||
      !Number.isInteger(d.attempts) ||
      d.attempts < 1 ||
      !isText(d.status)
    ) {
      return null;
    }
    return {
      schema: d.schema,
      attempt_id: typeof d.attempt_id === "string" && /^[a-z0-9]{1,16}$/.test(d.attempt_id) ? d.attempt_id : null,
      from_release: d.from_release,
      to_release: d.to_release,
      to_deployment: d.to_deployment,
      started_at: d.started_at,
      attempts: d.attempts,
      status: d.status,
    };
  } catch {
    return null;
  }
};

/** Compara la versión que arrancó con la esperada por el intento. */
export const resolveAttemptOnBoot = (attempt, currentRelease) => {
  if (!attempt || attempt.status !== "applying") return BOOT_RESULT.NONE;
  if (currentRelease === attempt.to_release) return BOOT_RESULT.COMPLETED;
  if (currentRelease === attempt.from_release) return BOOT_RESULT.STILL_OLD;
  return BOOT_RESULT.OTHER_RELEASE;
};

/** El mismo registro marcado como fallido: conserva el conteo para limitar reintentos. */
export const markAttemptFailed = (attempt) => (attempt ? { ...attempt, status: "failed" } : null);
