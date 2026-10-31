const DOC_TYPE_DNI = "1";
const DOC_TYPE_RUC = "6";
const DEFAULT_VARIOUS_CUSTOMER_ID = 1;

/**
 * Una venta a crédito genera una deuda, así que el cliente debe estar identificado:
 * DNI o RUC (nunca Clientes Varios) y, si el comprobante es factura, solo RUC.
 * `customer` es el objeto del cliente cuando se conoce (trae doc_type); con solo el id
 * se valida únicamente que no sea vacío ni Clientes Varios y el backend completa la validación.
 */
export function validateCreditCustomer({ customerId, customer = null, invoiceType }) {
  const id = typeof customerId === "object" ? customerId?.id : customerId;
  if (!id || Number(id) === DEFAULT_VARIOUS_CUSTOMER_ID) {
    return new Error("Las ventas al crédito requieren un cliente con DNI o RUC.");
  }
  if (!customer) {
    return true;
  }
  const docType = String(customer.doc_type || "");
  if (Number(invoiceType) === 1) {
    return docType === DOC_TYPE_RUC
      ? true
      : new Error("Para factura a crédito el cliente debe tener RUC.");
  }
  return docType === DOC_TYPE_DNI || docType === DOC_TYPE_RUC
    ? true
    : new Error("El cliente seleccionado no tiene DNI ni RUC; no se puede vender a crédito.");
}

/** Monto desde el cual SUNAT exige DNI/RUC en boleta (backend: SUNAT_DNI_THRESHOLD). */
export const DNI_THRESHOLD = 700;

/** Mensaje del primer error de validación de un n-form, o el genérico. */
export function firstFormError(errors, fallback = "Datos incorrectos") {
  return errors?.[0]?.[0]?.message || fallback;
}

const cents = (value) => Math.round((Number(value) || 0) * 100);

/**
 * Motivo por el que aún no se puede cobrar (o "" si todo está listo).
 * Una sola función para las pantallas de cobro, así el mensaje es igual en todas.
 */
export function chargeHint({
  hasItems = true,
  isCredit = false,
  given = 0,
  amount = 0,
  invoiceType,
  customerId = null,
  customer = null,
  expiration = null,
}) {
  if (!hasItems) return "Agrega productos para poder cobrar.";

  if (!isCredit && cents(given) < cents(amount)) {
    return `Falta S/ ${((cents(amount) - cents(given)) / 100).toFixed(2)} para completar el pago.`;
  }

  const id = typeof customerId === "object" ? customerId?.id : customerId;
  if (isCredit) {
    const creditError = validateCreditCustomer({ customerId: id, customer, invoiceType });
    if (creditError !== true) return creditError.message;
    if (!expiration) return "Falta la fecha de vencimiento del crédito.";
    return "";
  }

  if (Number(invoiceType) === 1) {
    if (!id || Number(id) === DEFAULT_VARIOUS_CUSTOMER_ID) return "Falta el cliente con RUC para la factura.";
    if (customer && String(customer.doc_type || "") !== DOC_TYPE_RUC) return "El cliente seleccionado no tiene RUC.";
    return "";
  }

  if (Number(invoiceType) !== 80 && cents(amount) >= DNI_THRESHOLD * 100 && (!id || Number(id) === DEFAULT_VARIOUS_CUSTOMER_ID)) {
    return `Falta el cliente (DNI o RUC): la boleta desde S/ ${DNI_THRESHOLD} lo exige.`;
  }
  return "";
}

/** Atajos de vencimiento para ventas a crédito (días desde hoy) y plazo por defecto. */
export const DUE_DAY_SHORTCUTS = [7, 15, 30];
export const DEFAULT_DUE_DAYS = 30;

/** Fecha dd/MM/yyyy a N días de hoy, con el formato del selector de fecha. */
export function dueDateInDays(days, from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + Number(days));
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}
