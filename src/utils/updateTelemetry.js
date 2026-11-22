// Eventos de actualización para soporte (HU-FLZ-ACT-011). Puro, para `node --test`.
//
// Datos mínimos y saneados: tipo, ids de versión e intento, un código de motivo, la ruta sin
// query ni # (con los números reemplazados por ":id"), duración y contrato. Nunca contenido de
// ventas o pedidos, tokens, cookies, documentos ni mensajes de error libres.
//
// La cola es acotada (20 eventos), reintenta como máximo 3 veces y después descarta:
// nunca compite con las ventas ni bloquea nada si el servidor no recibe eventos.

export const EVENT_TYPE = Object.freeze({
  DETECTED: "update_detected",
  POSTPONED: "update_postponed",
  BLOCKED: "update_blocked",
  STARTED: "update_started",
  CONFIRMED: "update_confirmed",
  FAILED: "update_failed",
  LIMIT_REACHED: "update_limit_reached",
  LOAD_ERROR: "load_error",
  INCOMPATIBLE: "client_incompatible",
});

const ID_RE = /^[A-Za-z0-9._-]{1,64}$/;
const CODE_RE = /^[a-z0-9_]{1,40}$/;
const NUMERIC_OR_HASH_SEGMENT = /^(\d+|[0-9a-f]{8,}|[0-9a-f-]{32,36})$/i;
// Un segmento se conserva solo si parece nombre de ruta ("table", "take-order"); lo demás es ":id".
const ROUTE_WORD = /^[A-Za-z][A-Za-z_-]{0,39}$/;

const cleanId = (v) => (typeof v === "string" && ID_RE.test(v) ? v : undefined);
const cleanInt = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max ? v : undefined);

/** Código de motivo acotado; cualquier texto libre se reemplaza por "other". */
export const sanitizeReason = (reason) => {
  if (reason === undefined || reason === null || reason === "") return undefined;
  return typeof reason === "string" && CODE_RE.test(reason) ? reason : "other";
};

/** Ruta sin query ni #; ids, hashes y cualquier segmento que no sea un nombre de ruta pasan a ":id". */
export const sanitizePath = (path) => {
  if (typeof path !== "string" || !path.startsWith("/")) return undefined;
  const pathname = path.split(/[?#]/, 1)[0];
  const cleaned = pathname
    .split("/")
    .map((segment) => {
      if (segment === "") return segment;
      if (NUMERIC_OR_HASH_SEGMENT.test(segment) || !ROUTE_WORD.test(segment)) return ":id";
      return segment;
    })
    .join("/")
    .slice(0, 120);
  return cleaned || "/";
};

/** Evento con solo los campos permitidos. */
export const buildEvent = ({ type, attempt, release, toRelease, deployment, reason, path, durationMs, contract }) => {
  const event = {
    type,
    attempt: cleanId(attempt),
    release: cleanId(release),
    to_release: cleanId(toRelease),
    deployment: cleanId(deployment),
    reason: sanitizeReason(reason),
    path: sanitizePath(path),
    duration_ms: cleanInt(durationMs, 24 * 60 * 60 * 1000),
    contract: cleanInt(contract, 10_000),
  };
  for (const key of Object.keys(event)) if (event[key] === undefined) delete event[key];
  return event;
};

/** Identificador no sensible para correlacionar un intento (8 caracteres). */
export const createAttemptId = (random = Math.random) =>
  Array.from({ length: 8 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(random() * 36)]).join("");

export const SEND_RESULT = Object.freeze({ OK: "ok", DROP: "drop", RETRY: "retry" });

/**
 * Cola acotada de eventos.
 * @param {object} deps
 * @param {(batch: object[]) => Promise<"ok"|"drop"|"retry">} deps.send
 * @param {(fn: Function, ms: number) => any} deps.setTimer
 * @param {(handle: any) => void} deps.clearTimer
 */
export const createEventBuffer = ({
  send,
  setTimer,
  clearTimer,
  maxSize = 20,
  flushDelayMs = 2_000,
  retryDelaysMs = [30_000, 60_000, 120_000],
}) => {
  let queue = [];
  let timer = null;
  let sending = false;
  let retries = 0;
  let dropped = 0;

  const trim = () => {
    if (queue.length > maxSize) {
      dropped += queue.length - maxSize;
      queue = queue.slice(queue.length - maxSize); // se descartan los más antiguos
    }
  };

  const schedule = (ms) => {
    if (timer !== null) return;
    timer = setTimer(() => {
      timer = null;
      flush();
    }, ms);
  };

  const flush = async () => {
    if (sending || queue.length === 0) return;
    const batch = queue;
    queue = [];
    sending = true;
    let result;
    try {
      result = await send(batch);
    } catch {
      result = SEND_RESULT.RETRY;
    }
    sending = false;

    if (result === SEND_RESULT.RETRY && retries < retryDelaysMs.length) {
      queue = [...batch, ...queue];
      trim();
      schedule(retryDelaysMs[retries]);
      retries += 1;
      return;
    }
    if (result === SEND_RESULT.RETRY) dropped += batch.length; // se agotaron los reintentos
    retries = 0;
    if (queue.length) schedule(flushDelayMs);
  };

  return {
    push(event) {
      queue.push(event);
      trim();
      if (!sending) schedule(flushDelayMs);
    },
    /** Envío inmediato antes de recargar (sendBeacon): sin reintentos. */
    flushNow(beacon) {
      if (queue.length === 0) return;
      const batch = queue;
      queue = [];
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
      try {
        beacon(batch);
      } catch {
        // si no se pudo, se pierde: nunca bloquear la recarga
      }
    },
    snapshot: () => ({ queued: queue.length, sending, retries, dropped }),
  };
};
