// Texto del tiempo restante de un bloqueo de mesa (puro, sin Vue, para poder probarlo con `node --test`).
// El servidor informa `remaining_seconds` o `remaining_time` (segundos) y, en algunas respuestas,
// `remaining_minutes` (entero, redondeado hacia abajo: 0 si falta menos de un minuto).

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Devuelve "N segundos" / "N minuto(s)" o "" si el bloqueo no informa tiempo restante.
 */
export const formatLockRemaining = (lock) => {
  if (!lock) return "";
  const seconds = Number(lock.remaining_seconds ?? lock.remaining_time);
  if (Number.isFinite(seconds) && seconds > 0) {
    if (seconds < 60) return plural(Math.ceil(seconds), "segundo", "segundos");
    return plural(Math.ceil(seconds / 60), "minuto", "minutos");
  }
  const minutes = Number(lock.remaining_minutes);
  if (Number.isFinite(minutes) && minutes > 0) return plural(minutes, "minuto", "minutos");
  return "";
};

/** Quién tiene la mesa bloqueada: el servidor manda `username`; se aceptan también los nombres anteriores. */
export const lockOwnerName = (lock) => lock?.locked_by_username || lock?.username || "otro usuario";
