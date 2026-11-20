// Reglas de anulación con destino (FLZ-MER-07/08, FLZ-SEC-03).
// Funciones puras: replican la política del backend
// (sisrestaurantes/apps/users/services/authorization.py) para decidir qué pedir en pantalla.
// El backend vuelve a validar todo; esto solo evita pedir datos de más o de menos.

export const DESTINATION_STOCK = "STOCK";
export const DESTINATION_WASTE = "WASTE";
export const DESTINATION_CHOICE = "CHOICE";

export const PERMISSION_CANCEL_ORDER = "null_orders";
export const PERMISSION_CANCEL_DETAIL = "cancel_orderdetail";
export const PERMISSION_AUTHORIZE_WASTE = "authorize_waste";
export const PERMISSION_VIEW_WASTE_REPORT = "view_waste_report";

// `business_settings.sale.cancellation_auth_mode`: credencial personal (por defecto)
// o clave general del negocio. La merma solo admite clave general si además
// `allow_general_pass_for_waste` está activo.
export const AUTH_MODE_PERSONAL = "personal";
export const AUTH_MODE_GENERAL = "general_pass";

/** Solo quien autoriza mermas o ve su reporte puede ver el costo de compra. */
export function canSeeWasteCost(hasPermission) {
  return hasPermission(PERMISSION_AUTHORIZE_WASTE) || hasPermission(PERMISSION_VIEW_WASTE_REPORT);
}

export const destinationLabels = {
  [DESTINATION_STOCK]: "Vuelve al stock",
  [DESTINATION_WASTE]: "Merma",
};

/** Módulo de mermas activo (`business_settings.modules.show_waste`, activado por defecto). */
export function wasteModuleEnabled(businessSettings) {
  return businessSettings?.modules?.show_waste !== false;
}

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

/**
 * Modo de autorización:
 * - "own": el usuario tiene todos los permisos y confirma con su propia clave.
 * - "supervisor": se piden usuario y clave de un supervisor.
 * `hasPermission` es la función del userStore.
 */
export function authMode(hasPermission, scopePermission, destination) {
  if (!hasPermission(scopePermission)) return "supervisor";
  if (destination === DESTINATION_WASTE && !hasPermission(PERMISSION_AUTHORIZE_WASTE)) {
    return "supervisor";
  }
  return "own";
}

/**
 * Modo efectivo de la anulación: la configuración del negocio manda, salvo que la
 * merma esté blindada (`allow_general_pass_for_waste` inactivo), en cuyo caso se
 * aplica la credencial personal o de supervisor.
 */
export function resolveAuthMode({ settings, hasPermission, scopePermission, destination }) {
  const configured =
    settings?.cancellation_auth_mode === AUTH_MODE_GENERAL ? AUTH_MODE_GENERAL : AUTH_MODE_PERSONAL;
  if (configured === AUTH_MODE_GENERAL) {
    const wasteBlocked =
      destination === DESTINATION_WASTE && settings?.allow_general_pass_for_waste !== true;
    if (!wasteBlocked) return AUTH_MODE_GENERAL;
  }
  return authMode(hasPermission, scopePermission, destination);
}

/** Error de validación de un ítem (motivo, destino, observación) o null si está completo. */
export function itemError(reason, chosenDestination, note) {
  if (!reason) return "Seleccione un motivo.";
  if (reason.destination === DESTINATION_CHOICE && !resolveDestination(reason, chosenDestination)) {
    return "Indique si el producto vuelve al stock o es merma.";
  }
  if (reason.requires_note && !(note || "").trim()) {
    return "Escriba una observación para este motivo.";
  }
  return null;
}

/** Error de la credencial según el modo, o null si está completa. */
export function authError(mode, credentials) {
  const { username = "", password = "" } = credentials || {};
  if (mode === AUTH_MODE_GENERAL) {
    return password ? null : "Ingrese la clave general del negocio.";
  }
  if (mode === "supervisor" && !username.trim()) return "Ingrese el usuario del supervisor.";
  if (!password) return mode === "supervisor" ? "Ingrese la clave del supervisor." : "Ingrese su clave.";
  return null;
}

/** Campos de credencial del contrato nuevo. */
export function credentialPayload(mode, credentials) {
  const { username = "", password = "" } = credentials || {};
  if (mode === AUTH_MODE_GENERAL) {
    // La clave general viaja sin usuario: el backend la contrasta con
    // `business.general_pass` y deja `authorized_by` nulo.
    return { supervisor_username: "", supervisor_password: password };
  }
  return {
    supervisor_username: mode === "supervisor" ? username.trim() : "",
    supervisor_password: password,
  };
}

/** Cuerpo de `tables/{id}/remove_detail/` (anulación parcial). */
export function buildRemoveDetailPayload({ detailId, quantity, reason, chosenDestination, note, mode, credentials }) {
  const cleanNote = (note || "").trim();
  return {
    id: detailId,
    quantity,
    reason_code: reason.code,
    destination: resolveDestination(reason, chosenDestination),
    null_reason: cleanNote || reason.description,
    ...credentialPayload(mode, credentials),
  };
}

/**
 * Cuerpo de `tables/{id}/cancel_order/` (anulación total con destino por ítem).
 * `items`: [{ id, reasonCode, chosenDestination, note }]
 */
export function buildCancelOrderPayload({ items, reasons, generalNote, mode, credentials }) {
  return {
    items: items.map((item) => {
      const reason = findReason(reasons, item.reasonCode);
      return {
        order_detail_id: item.id,
        reason_code: item.reasonCode,
        destination: resolveDestination(reason, item.chosenDestination),
        note: (item.note || "").trim() || null,
      };
    }),
    null_reason: (generalNote || "").trim() || null,
    ...credentialPayload(mode, credentials),
  };
}

/**
 * Resumen previo a confirmar: unidades a stock y a merma, y valor de la merma al costo.
 * `items`: [{ quantity, unitCost, destination }]
 */
export function summarize(items) {
  return (items || []).reduce(
    (acc, item) => {
      const quantity = Number(item.quantity) || 0;
      if (item.destination === DESTINATION_WASTE) {
        acc.wasteItems += 1;
        acc.wasteUnits += quantity;
        // Céntimos para no acumular errores de coma flotante.
        acc.wasteCostCents += Math.round((Number(item.unitCost) || 0) * 100) * quantity;
      } else if (item.destination === DESTINATION_STOCK) {
        acc.stockItems += 1;
        acc.stockUnits += quantity;
      }
      return acc;
    },
    { stockItems: 0, stockUnits: 0, wasteItems: 0, wasteUnits: 0, wasteCostCents: 0 }
  );
}

/** Mensaje claro para errores de la API de anulación (400 credenciales / 403 permisos). */
export function cancellationErrorMessage(error, mode) {
  const data = error?.response?.data || {};
  switch (data.code) {
    case "INVALID_CREDENTIALS":
      if (mode === AUTH_MODE_GENERAL) {
        return "La clave general no es correcta. Verifíquela en Ajustes o use la credencial personal de un supervisor.";
      }
      return "Usuario o clave incorrectos. Use la clave personal de su usuario o de un supervisor; la clave general del negocio no se acepta en anulaciones.";
    case "MISSING_PERMISSION":
      return "Esa credencial no tiene permiso para autorizar esta anulación.";
    case "NOTE_REQUIRED":
      return "Este motivo requiere una observación.";
    case "REASON_NOT_ALLOWED":
      return "Seleccione un motivo válido.";
    default:
      return data.error || "No se pudo anular. Verifique los datos e intente de nuevo.";
  }
}
