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

/**
 * Encola un mensaje (devuelve la lista nueva). Un unlock cancela los lock/renew/heartbeat pendientes de esa mesa y un
 * mensaje volátil reemplaza al anterior del mismo tipo y mesa en vez de acumularse mientras el socket está caído.
 */
export const addPending = (pending, message, now = Date.now()) => {
  let list = message.type === "unlock_table" ? dropVolatileForTable(pending, message.table_id) : pending;
  if (VOLATILE_MESSAGE_TYPES.includes(message.type)) {
    list = list.filter(
      (item) =>
        !(item.message.type === message.type && Number(item.message.table_id) === Number(message.table_id))
    );
  }
  return [...list, { message, queuedAt: now }];
};

/**
 * Objeto "bloqueo" estándar que guardan todos los escritores del estado (WebSocket, store, 423 de la pantalla de mesa).
 * Acepta los nombres que envían las distintas fuentes (`table_id`/`table`, `user_id`/`user`,
 * `remaining_seconds`/`remaining_time`) y calcula el vencimiento local.
 */
export const normalizeLock = (raw, now = Date.now()) => {
  const lock = raw || {};
  const rawTableId = lock.table_id ?? lock.table;
  const tableId = Number(rawTableId);
  const remaining = lock.remaining_seconds ?? lock.remaining_time;
  return {
    table_id: Number.isNaN(tableId) ? rawTableId : tableId,
    user_id: lock.user_id ?? lock.user,
    username: lock.username,
    locked_at: lock.locked_at,
    expires_at: lock.expires_at,
    remaining_seconds: remaining,
    local_expires_at: localExpiry({ remaining_seconds: remaining }, now),
  };
};

/** Bloqueo vigente de una mesa en un objeto `{ [idMesa]: bloqueo }`, o null (en un objeto `obj[5]` y `obj['5']` son la misma clave). */
export const getActiveLock = (lockedTables, tableId, now = Date.now()) => {
  if (!tableId || !lockedTables) return null;
  const lock = lockedTables[tableId] ?? null;
  return lock && !lockHasExpired(lock, now) ? lock : null;
};

/** Segundos que le quedan a un bloqueo según su vencimiento local (0 si venció o no hay dato). */
export const lockRemainingSeconds = (lock, now = Date.now()) =>
  typeof lock?.local_expires_at === "number" ? Math.max(0, Math.ceil((lock.local_expires_at - now) / 1000)) : 0;

/**
 * Cada cuántos ms debe renovar su bloqueo una pantalla abierta: ~2,5 renovaciones por TTL, para tolerar una perdida.
 * Con el tiempo por defecto (50 s) son 20 s; con un TTL corto (mínimo 10 s) se acorta y con uno largo se espacia.
 */
export const lockHeartbeatMs = (ttlSeconds, fallbackSeconds = 50) => {
  const ttl = Number(ttlSeconds);
  const seconds = Number.isFinite(ttl) && ttl > 0 ? ttl : fallbackSeconds;
  return Math.max(3000, Math.round((seconds * 1000) / 2.5));
};
