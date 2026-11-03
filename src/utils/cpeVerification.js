/**
 * Comprobante electrónico (CPE): reglas de la fila de ventas y lectura del resultado
 * de `POST sales/{id}/verify-cpe/`. Sin dependencias de Vue para poder probarlo con `node --test`.
 */

const NOTE_OF_SALE = "80";

// Estados desde los que el backend permite verificar: enviada, error, reintento y anulada.
export const VERIFIABLE_STATUSES = ["E", "X", "R", "A"];

const STATUS_LABELS = {
  N: "Nuevo",
  E: "Enviado",
  A: "Anulado",
  X: "Error",
  M: "Modificado",
  R: "Reintento",
  B: "Histórico",
};

export function canVerifyCpe(row) {
  return Boolean(row) && row.invoice_type !== NOTE_OF_SALE && VERIFIABLE_STATUSES.includes(row.status);
}

/** Líneas legibles del resultado de la verificación. */
export function cpeVerificationLines(result) {
  if (!result) return [];
  const lines = [];
  const before = STATUS_LABELS[result.status_before] || result.status_before;
  const after = STATUS_LABELS[result.status_after] || result.status_after;
  lines.push(before === after ? `Estado: ${after}` : `Estado: ${before} → ${after}`);

  const document = result.document || {};
  const detail = [document.state, document.description].filter(Boolean).join(" - ");
  if (detail) lines.push(`Comprobante: ${detail}`);

  const annulment = result.annulment;
  if (annulment) {
    const annulmentDetail = [annulment.state, annulment.description].filter(Boolean).join(" - ");
    lines.push(`Anulación: ${annulmentDetail || annulment.outcome}`);
  }
  if (result.warning) lines.push(result.warning);
  return lines;
}
