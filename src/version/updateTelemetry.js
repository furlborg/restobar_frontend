// Envío de eventos de actualización al log del backend (HU-FLZ-ACT-011).
// La lógica (saneamiento y cola acotada) está en src/utils/updateTelemetry.js.
//
// - POST /api/v1/client-events/ con text/plain: sin preflight, sin token ni cookies.
// - Va por fetch, no por axios: no cuenta para la barrera de operaciones ni muestra errores.
// - Si el servidor no los recibe, se reintenta poco y se descarta. Nunca bloquea una venta.

import { buildEvent, createEventBuffer, SEND_RESULT } from "@/utils/updateTelemetry";
import { readCurrentReleaseId } from "@/utils/appVersion";
import { CLIENT_CONTRACT_VERSION } from "@/version/contract";

const apiBase = import.meta.env.VITE_APP_URL;
const endpoint = apiBase && apiBase !== "undefined" ? `${apiBase}/api/v1/client-events/` : null;

const send = async (batch) => {
  if (!endpoint) return SEND_RESULT.DROP;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(batch),
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      credentials: "omit",
      keepalive: true,
    });
    if (res.ok) return SEND_RESULT.OK;
    // 400/405/413: formato rechazado, no tiene sentido reintentar. 429/5xx: más tarde.
    return res.status === 429 || res.status >= 500 ? SEND_RESULT.RETRY : SEND_RESULT.DROP;
  } catch {
    return SEND_RESULT.RETRY;
  }
};

const buffer = createEventBuffer({
  send,
  setTimer: (fn, ms) => window.setTimeout(fn, ms),
  clearTimer: (handle) => window.clearTimeout(handle),
});

const currentPath = () => `${window.location.pathname}`;

/**
 * Registra un evento. `data` acepta: attempt, toRelease, deployment, reason, path, durationMs.
 * La versión cargada, la ruta actual y el contrato se agregan solos.
 */
export const trackUpdateEvent = (type, data = {}) => {
  try {
    buffer.push(
      buildEvent({
        type,
        release: readCurrentReleaseId(document) ?? undefined,
        path: currentPath(),
        contract: CLIENT_CONTRACT_VERSION,
        ...data,
      })
    );
  } catch {
    // registrar nunca debe romper la operación
  }
};

/** Envía lo pendiente ya mismo (justo antes de recargar). Usa sendBeacon si existe. */
export const flushUpdateEvents = () => {
  if (!endpoint) return;
  buffer.flushNow((batch) => {
    const body = JSON.stringify(batch);
    if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body); // string → text/plain
    else fetch(endpoint, { method: "POST", body, headers: { "Content-Type": "text/plain;charset=UTF-8" }, credentials: "omit", keepalive: true });
  });
};
