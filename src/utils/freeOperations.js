// Reglas y utilidades para operaciones gratuitas: cortesía y consumo interno (FLZ-GRA-01, FLZ-GRA-05, FLZ-GRA-07).
// Funciones puras que replican la lógica del backend (apps/sale/free_operations.py).

export const AFFECTATION_TAXED = 10;
export const AFFECTATION_EXONERATED = 20;
export const AFFECTATION_FREE = 21;

export const AFFECTATION_DEFAULT_COURTESY = 15; // Gravado - Bonificaciones
export const AFFECTATION_DEFAULT_INTERNAL_CONSUMPTION = 13; // Gravado - Retiro

export const TAXED_FREE_AFFECTATIONS = [11, 12, 13, 14, 15, 16];
export const FREE_AFFECTATIONS = [11, 12, 13, 14, 15, 16, 21];

export const FREE_REASON_COURTESY = "COURTESY";
export const FREE_REASON_INTERNAL_CONSUMPTION = "INTERNAL_CONSUMPTION";

export const FREE_REASONS = [
  { value: FREE_REASON_COURTESY, label: "Cortesía", description: "Atención o cortesía a clientes" },
  { value: FREE_REASON_INTERNAL_CONSUMPTION, label: "Consumo interno", description: "Consumo del personal o del negocio" },
];

export const PERMISSION_AUTHORIZE_FREE_OPERATION = "authorize_free_operation";

export function isFreeAffectation(afc) {
  return FREE_AFFECTATIONS.includes(Number(afc));
}

export function isTaxedFreeAffectation(afc) {
  return TAXED_FREE_AFFECTATIONS.includes(Number(afc));
}

export function allowedFreeAffectations(originalAfc) {
  const original = Number(originalAfc);
  if (original === AFFECTATION_TAXED) {
    return [11, 12, 13, 14, 15, 16];
  }
  return [21];
}

export function defaultFreeAffectation(originalAfc, reason = FREE_REASON_INTERNAL_CONSUMPTION) {
  const original = Number(originalAfc);
  if (original === AFFECTATION_TAXED) {
    return reason === FREE_REASON_COURTESY ? AFFECTATION_DEFAULT_COURTESY : AFFECTATION_DEFAULT_INTERNAL_CONSUMPTION;
  }
  return AFFECTATION_FREE;
}

export function freeAffectationLabel(afc) {
  const code = Number(afc);
  if (code === AFFECTATION_FREE) return "Exonerado - Transferencia gratuita";
  if (TAXED_FREE_AFFECTATIONS.includes(code)) return getAffectationTag(code).label;
  return "";
}

export function getFreeReasonLabel(reason) {
  if (reason === FREE_REASON_COURTESY) return "Cortesía";
  if (reason === FREE_REASON_INTERNAL_CONSUMPTION) return "Consumo interno";
  return "";
}

export const AFFECTATION_TAGS = {
  10: { short: "GRV", label: "Gravado", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
  20: { short: "EXN", label: "Exonerado", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  21: { short: "GRT", label: "Gratuito", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  11: { short: "RET", label: "Gravado – Retiro", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  12: { short: "RET", label: "Gravado – Retiro", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  13: { short: "RET", label: "Gravado – Retiro", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  14: { short: "RET", label: "Gravado – Retiro", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  15: { short: "BON", label: "Gravado – Bonificaciones", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  16: { short: "RET", label: "Gravado – Retiro", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  default: { short: "---", label: "Otro", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
};

export function getAffectationTag(afc) {
  return AFFECTATION_TAGS[Number(afc)] || AFFECTATION_TAGS.default;
}

/**
 * Modo de autorización para operaciones gratuitas:
 * - "own": el usuario tiene el permiso `authorize_free_operation` y confirma con su propia clave.
 * - "supervisor": se piden usuario y clave de un supervisor con el permiso.
 */
export function freeAuthMode(hasPermission) {
  return hasPermission(PERMISSION_AUTHORIZE_FREE_OPERATION) ? "own" : "supervisor";
}

/**
 * Valida credenciales de autorización gratuita según el modo.
 */
export function validateFreeAuth(credentials, mode) {
  if (mode === "own") {
    if (!credentials?.password?.trim()) {
      return "Ingrese su contraseña para autorizar la operación gratuita.";
    }
  } else {
    if (!credentials?.username?.trim()) {
      return "Ingrese el usuario del supervisor.";
    }
    if (!credentials?.password?.trim()) {
      return "Ingrese la contraseña del supervisor.";
    }
  }
  return null;
}

/**
 * Prepara el objeto `free_authorization` para el backend.
 */
export function buildFreeAuthorizationPayload(credentials, mode) {
  if (mode === "own") {
    return {
      supervisor_password: credentials.password?.trim() || "",
    };
  }
  return {
    supervisor_username: credentials.username?.trim() || "",
    supervisor_password: credentials.password?.trim() || "",
  };
}

/**
 * Calcula base imponible e IGV referencial de una línea gratuita gravada (11-16).
 */
export function calculateTaxedFreeAmounts(priceSale, igvRate = 0.18) {
  const price = Number(priceSale) || 0;
  const rate = Number(igvRate) || 0.18;
  const normalizedRate = rate > 1 ? rate / 100 : rate;

  const base = Math.round((price / (1 + normalizedRate)) * 100) / 100;
  const igv = Math.round((price - base) * 100) / 100;

  return {
    priceBase: base,
    igvTax: igv,
  };
}
