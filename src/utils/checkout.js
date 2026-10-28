import { DNI_THRESHOLD, DEFAULT_DUE_DAYS, dueDateInDays, validateCreditCustomer } from "./creditCustomer.js";

/**
 * Lógica de cobro compartida por las pantallas de cobro (mesa, para llevar, dividir cuenta).
 * Son funciones puras, sin Vue: cada pantalla solo las llama con su estado.
 */

const DOC_TYPE_RUC = "6";
const DEFAULT_VARIOUS_CUSTOMER_ID = 1;
const INVOICE_TYPE_FACTURA = 1;
const INVOICE_TYPE_NOTA_VENTA = 80;

/** Compara y resta montos en céntimos: el total suma decimales en coma flotante (0.1 + 0.2). */
export const cents = (value) => Math.round((Number(value) || 0) * 100);

/**
 * Billetes de atajo para el pago recibido: hasta 3 billetes mayores al total.
 * Desde S/ 200 ofrece también el siguiente múltiplo de 100 y 50 más.
 */
export function quickCashOptions(total) {
  const tot = Number(total) || 0;
  const candidates = [20, 50, 100, 200];
  if (tot >= 200) {
    const next100 = Math.ceil(tot / 100) * 100;
    const first = next100 === tot ? next100 + 50 : next100;
    candidates.push(first, first + 50);
  }
  return candidates
    .filter((bill) => bill > tot)
    .slice(0, 3)
    .map((bill) => ({ label: `S/ ${bill}`, value: bill }));
}

/** Estado del pago recibido frente al total: vuelto, exacto, faltante o crédito. */
export function changeStatus({ isCredit = false, given = 0, total = 0 }) {
  if (isCredit) {
    return { key: "credit", cls: "status-credit", label: "A CRÉDITO", hint: "Operación al crédito", value: 0 };
  }
  const g = cents(given);
  const t = cents(total);
  if (g > t) {
    return { key: "change", cls: "status-success", label: "VUELTO", hint: "A entregar al cliente", value: (g - t) / 100 };
  }
  if (g === t && t > 0) {
    return { key: "exact", cls: "status-neutral", label: "EXACTO", hint: "Monto exacto sin vuelto", value: 0 };
  }
  return { key: "missing", cls: "status-warning", label: "FALTANTE", hint: "Monto insuficiente", value: (t - g) / 100 };
}

/**
 * ¿Se puede pulsar Cobrar? Contado exige haber recibido al menos el total;
 * crédito exige que NO se haya recibido el total (si se pagó todo, es contado).
 */
export function canCharge({ hasItems = true, isCredit = false, given = 0, amount = 0 }) {
  if (!hasItems) return false;
  return isCredit ? cents(given) < cents(amount) : cents(given) >= cents(amount);
}

/**
 * Cambios que produce pasar a contado o crédito: contado recibe el total, crédito recibe 0 y
 * propone vencimiento a 30 días; contado no lleva vencimiento ni pago múltiple.
 */
export function conditionPatch({ condition, total, expiration = null }) {
  const isCredit = Number(condition) === 2;
  return {
    given_amount: Number(condition) === 1 ? total : "0.00",
    expiration_sale: isCredit ? expiration || dueDateInDays(DEFAULT_DUE_DAYS) : null,
    clearMultiple: Number(condition) !== 1,
  };
}

/**
 * Regla del campo cliente (async-validator) con las mismas exigencias del backend:
 * factura exige RUC; crédito exige DNI/RUC; boleta desde S/ 700 exige cliente; nota de venta, no.
 * `customer` es el objeto del cliente si se conoce (trae doc_type y doc_num).
 */
export function buildCustomerRule({ invoiceType, isCredit = false, amount = 0, customer = null }) {
  const isInvoice = Number(invoiceType) === INVOICE_TYPE_FACTURA;
  const required =
    isInvoice ||
    isCredit ||
    (Number(invoiceType) !== INVOICE_TYPE_NOTA_VENTA && cents(amount) >= DNI_THRESHOLD * 100);

  const message = isInvoice
    ? "Para emitir Factura debes agregar un cliente con RUC válido"
    : isCredit
      ? "Las ventas al crédito requieren un cliente con DNI o RUC"
      : `Debes agregar un cliente (DNI o RUC) para ventas desde S/ ${DNI_THRESHOLD}`;

  const validator = (_rule, value) => {
    const id = typeof value === "object" ? value?.id : value;
    const known = customer || (typeof value === "object" ? value : null);

    if (isCredit) {
      const creditError = validateCreditCustomer({ customerId: id, customer: known, invoiceType });
      if (creditError !== true) return creditError;
    }
    if (isInvoice) {
      if (!id || Number(id) === DEFAULT_VARIOUS_CUSTOMER_ID) {
        return new Error("Para emitir Factura es obligatorio un cliente con RUC (11 dígitos).");
      }
      if (known) {
        const docNum = String(known.doc_num || "").trim();
        if (String(known.doc_type || "") !== DOC_TYPE_RUC || !/^\d{11}$/.test(docNum)) {
          return new Error("El cliente seleccionado debe tener un RUC válido de 11 dígitos.");
        }
      }
    }
    return true;
  };

  return { required, message, validator };
}

/** Regla de la fecha de vencimiento: solo existe cuando la venta es a crédito. */
export function expirationRule(isCredit) {
  if (!isCredit) return null;
  return {
    trigger: ["blur", "change"],
    validator: (_rule, value) =>
      value ? true : new Error("Debes ingresar la fecha de vencimiento de la venta al crédito"),
  };
}
