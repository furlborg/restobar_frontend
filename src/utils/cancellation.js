// Reglas de anulación con destino (FLZ-MER-07/08, FLZ-SEC-03).
// Funciones puras: replican la política del backend
// (sisrestaurantes/apps/order/services/cancellation.py) para decidir qué pedir en pantalla.
// El backend vuelve a validar todo; esto solo evita pedir datos de más o de menos.

export const DESTINATION_STOCK = "STOCK";
export const DESTINATION_WASTE = "WASTE";
export const DESTINATION_CHOICE = "CHOICE";

// Modo de los payloads: `stock` (anulación desde Mesas/Pedidos) o `waste` (registro de
// mermas en el módulo "Anulaciones y mermas").
export const MODE_STOCK = "stock";
export const MODE_WASTE = "waste";
// Observación mínima de toda merma (igual que el backend).
export const WASTE_NOTE_MIN = 10;

export const PERMISSION_CANCEL_ORDER = "null_orders";

// Modos de autorización de una anulación a stock (business_settings.sale).
export const AUTH_MODE_USER_PASS = "user_pass";
export const AUTH_MODE_GENERAL_PASS = "general_pass";
export const AUTH_MODE_NONE = "none";

/** Busca un motivo del catálogo por código. */
export function findReason(reasons, code) {
  if (!code) return null;
  return (reasons || []).find((reason) => reason.code === code) || null;
}

/**
 * Destino efectivo: el motivo manda; solo "Otro" (CHOICE) acepta el destino elegido.
 * Devuelve null si el motivo es CHOICE y aún no se eligió destino.
 */
export function resolveDestination(reason, chosen) {
  if (!reason) return null;
  if (reason.destination !== DESTINATION_CHOICE) return reason.destination;
  return chosen === DESTINATION_STOCK || chosen === DESTINATION_WASTE ? chosen : null;
}

/** Motivos visibles según el modo: en `stock` solo STOCK/CHOICE; en `waste` solo WASTE/CHOICE. */
export function reasonsForMode(reasons, cancelMode) {
  if (!cancelMode) return reasons || [];
  return (reasons || []).filter((reason) => {
    if (cancelMode === MODE_WASTE) {
      return reason.destination === DESTINATION_WASTE || reason.destination === DESTINATION_CHOICE;
    }
    if (cancelMode === MODE_STOCK) {
      return reason.destination === DESTINATION_STOCK || reason.destination === DESTINATION_CHOICE;
    }
    return true;
  });
}

/**
 * Destino efectivo con el modo de FE-02: en `stock` el motivo "Otro" se fuerza a
 * STOCK (sin selector); en `waste` se fuerza a WASTE. Sin modo, comportamiento anterior.
 */
export function resolveDestinationForMode(reason, chosen, cancelMode) {
  if (!reason) return null;
  if (reason.destination !== DESTINATION_CHOICE) return reason.destination;
  if (cancelMode === MODE_WASTE) return DESTINATION_WASTE;
  if (cancelMode === MODE_STOCK) return DESTINATION_STOCK;
  return resolveDestination(reason, chosen);
}

/**
 * Modo de autorización de una anulación a stock según la configuración del negocio:
 * - "user_pass": `require_user_pass_to_null` (usuario + contraseña de un usuario activo).
 * - "general_pass": `require_general_pass_to_null` (clave general del negocio).
 * - "none": sin ninguno, no se pide credencial (autoriza el propio usuario).
 */
export function cancelAuthMode(settings) {
  if (settings?.require_user_pass_to_null) return AUTH_MODE_USER_PASS;
  if (settings?.require_general_pass_to_null) return AUTH_MODE_GENERAL_PASS;
  return AUTH_MODE_NONE;
}

/** Error de la credencial según el modo, o null si está completa. */
export function authError(mode, credentials) {
  const { username = "", password = "" } = credentials || {};
  if (mode === AUTH_MODE_USER_PASS) {
    return username.trim() && password ? null : "Ingrese usuario y contraseña.";
  }
  if (mode === AUTH_MODE_GENERAL_PASS) {
    return password ? null : "Ingrese la clave general.";
  }
  return null;
}

/** Campos de credencial del contrato de anulación a stock. */
export function credentialPayload(mode, credentials) {
  const { username = "", password = "" } = credentials || {};
  if (mode === AUTH_MODE_USER_PASS) return { username: username.trim(), pass: password };
  if (mode === AUTH_MODE_GENERAL_PASS) return { pass: password };
  return {};
}

/** Cuerpo de `tables/{id}/remove_detail/` (anulación parcial). */
/**
 * Anulación a stock como antes de mermas (Mesas y Pedidos): motivo en texto libre
 * (`null_reason`) y la credencial según Ajustes. Sin código de motivo: todo vuelve a stock.
 */
export function buildStockCancelPayload({ reasonText, mode, credentials }) {
  const text = (reasonText || "").trim();
  return { null_reason: text || null, ...credentialPayload(mode, credentials) };
}

/** Motivo obligatorio solo si Ajustes lo exige (`sale.required_null_reason`). */
export function stockReasonError(settings, reasonText) {
  return settings?.required_null_reason && !(reasonText || "").trim() ? "Ingrese el motivo de anulación." : null;
}

export function buildRemoveDetailPayload({
  detailId,
  quantity,
  reason,
  chosenDestination,
  note,
  mode,
  credentials,
  replacement = false,
  cancelMode,
}) {
  const cleanNote = (note || "").trim();
  const payload = {
    id: detailId,
    quantity,
    reason_code: reason.code,
    destination: resolveDestinationForMode(reason, chosenDestination, cancelMode),
    null_reason: cleanNote || reason.description,
  };
  // La merma no pide credenciales: el permiso `authorize_waste` basta (FLZ-MER-20).
  if (cancelMode !== MODE_WASTE) {
    Object.assign(payload, credentialPayload(mode, credentials));
  }
  if (replacement) payload.replacement = true;
  return payload;
}

/**
 * Cuerpo de `tables/{id}/cancel_order/` y `orders/{id}/secure_delete/` (anulación
 * total con un solo motivo general). Todos los ítems se anulan con el mismo motivo
 * y destino (STOCK o WASTE según el modo), sin `items[]`.
 * En modo merma no se envían credenciales (el permiso `authorize_waste` basta).
 */
export function buildCancelOrderPayload({
  reasonCode,
  reasons,
  note,
  mode,
  credentials,
  cancelMode,
  replacement = false,
}) {
  const reason = findReason(reasons, reasonCode);
  const cleanNote = (note || "").trim();
  const payload = {
    reason_code: reasonCode,
    destination: resolveDestinationForMode(reason, null, cancelMode),
    null_reason: cleanNote || reason?.description || null,
  };
  // "Regresó a cocina" (etiqueta del registro): solo aplica a mermas.
  if (replacement && cancelMode === MODE_WASTE) payload.replacement = true;
  // La merma no pide credenciales: el permiso `authorize_waste` basta (FLZ-MER-20).
  if (cancelMode !== MODE_WASTE) {
    Object.assign(payload, credentialPayload(mode, credentials));
  }
  return payload;
}

/** Mensaje claro para errores de la API de anulación (400 credenciales / 403 permisos). */
export function cancellationErrorMessage(error) {
  const data = error?.response?.data || {};
  return data.error || "No se pudo anular. Verifique los datos e intente de nuevo.";
}
