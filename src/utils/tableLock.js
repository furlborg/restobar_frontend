// Utilidades puras del bloqueo de mesas (sin Vue/Pinia, para poder probarlas con `node --test`).

// Los mensajes que crean o renuevan un bloqueo caducan si quedaron encolados con el socket caído:
// reenviados tarde, al reconectar crearían un bloqueo de una mesa que el usuario ya dejó.
export const PENDING_MAX_AGE_MS = 10000;
export const VOLATILE_MESSAGE_TYPES = ["lock_table", "renew_lock", "heartbeat", "check_lock"];

/**
 * Momento local (ms) en que vence un bloqueo, calculado con los segundos restantes que informa el
 * servidor y la hora de recepción. No depende del reloj del PC cliente.
 */
export const localExpiry = (lock, now = Date.now()) =>
  typeof lock?.remaining_seconds === "number" ? now + lock.remaining_seconds * 1000 : undefined;

/**
 * Indica si un bloqueo ya venció. Prefiere `local_expires_at` (independiente del reloj del cliente);
 * si no existe, usa `expires_at` del servidor como respaldo.
 */
export const lockHasExpired = (lock, now = Date.now()) => {
  if (!lock) return true;
  if (typeof lock.local_expires_at === "number") return now > lock.local_expires_at;
  if (lock.expires_at) {
    const expTime = new Date(lock.expires_at).getTime();
    if (!Number.isNaN(expTime)) return now > expTime;
  }
  return false;
};

/** Quita de la cola los mensajes que crean/renuevan el bloqueo de una mesa (el usuario ya salió de ella). */
export const dropVolatileForTable = (pending, tableId) =>
  pending.filter(
    (item) =>
      !(
        VOLATILE_MESSAGE_TYPES.includes(item.message.type) &&
        Number(item.message.table_id) === Number(tableId)
      )
  );

/** Un mensaje encolado está vencido si crea/renueva un bloqueo y lleva más de PENDING_MAX_AGE_MS en cola. */
export const isStalePending = (item, now = Date.now()) =>
  VOLATILE_MESSAGE_TYPES.includes(item.message.type) && now - item.queuedAt > PENDING_MAX_AGE_MS;
