// Lógica pura de la pantalla "Operaciones gratuitas" (FLZ-REP-06).
// Separada de Vue para poder probarla con node --test.

export const FREE_REASON_LABELS = {
  COURTESY: "Cortesía",
  INTERNAL_CONSUMPTION: "Consumo interno",
};

export const DOCUMENT_KIND_LABELS = {
  SUNAT: "Informado a SUNAT",
  NOTE_OF_SALE: "Nota de venta (no informada)",
};

export function money(value) {
  return `S/ ${(Number(value) || 0).toFixed(2)}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const text = String(value);
  const local = text.match(/^(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2})/);
  if (local) return `${local[1]} ${local[2]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function documentText(document) {
  if (!document) return "—";
  const serie = document.serie ? `${document.serie}-` : "";
  return `${document.label} ${serie}${document.number ?? ""}`.trim();
}

export function reasonText(row) {
  return row?.free_reason_label || FREE_REASON_LABELS[row?.free_reason] || "Sin motivo (histórico)";
}

export function buildParams(filters) {
  const params = {};
  for (const [key, value] of Object.entries(filters || {})) {
    if (value === null || value === undefined || value === "") continue;
    params[key] = value;
  }
  return params;
}

/** Filas para Excel/PDF: mismas columnas y totales que la pantalla. */
export function exportRows(records) {
  return (records || []).map((row) => ({
    comprobante: documentText(row.document),
    fecha: formatDate(row.created),
    item: row.item,
    cantidad: row.quantity,
    valor_referencial: Number(row.reference_value),
    igv_referencial: Number(row.reference_igv),
    afectacion: row.affectation?.description || String(row.affectation?.id ?? ""),
    motivo: reasonText(row),
    autorizo: row.authorized_by?.username || "—",
  }));
}

export function footerText({ page, pageSize, count, summary }) {
  const from = count ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, count);
  return `Mostrando ${from}–${to} de ${count} · IGV de retiros: ${money(summary?.reference_igv)}`;
}
