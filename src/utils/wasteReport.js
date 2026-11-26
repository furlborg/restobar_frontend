// Lógica pura de la pantalla "Mermas" (FLZ-REP-03/04). Sin Vue para poder probarla con node --test.

export const ITEM_TYPE_LABELS = { PRODUCT: "PRODUCTO", COMBO: "COMBO", MENU: "MENÚ", SUPPLY: "INSUMO" };

// Colores de motivo del mockup (p-red, p-amber, p-violet, p-gray).
const REASON_PILLS = {
  PRODUCTO_MALOGRADO: "p-red",
  DEVOLUCION_CALIDAD: "p-red",
  ROTURA_DERRAME: "p-amber",
  ERROR_PREPARACION: "p-amber",
  CAMBIO_YA_PREPARADO: "p-violet",
};

export const GROUP_BY_OPTIONS = [
  { label: "Motivo", value: "reason" },
  { label: "Producto", value: "product" },
  { label: "Solicitó", value: "requested_by" },
  { label: "Autorizó", value: "authorized_by" },
];

export function reasonPill(code) {
  return REASON_PILLS[code] || "p-gray";
}

export function money(value) {
  return `S/ ${(Number(value) || 0).toFixed(2)}`;
}

/** "Mesa 7 · Pedido 1842" / "Para llevar · Pedido 1826" */
export function originText(origin) {
  if (!origin) return "—";
  const place = origin.table ? origin.table : origin.order_type_label;
  return `${place} · Pedido ${origin.order_id}`;
}

/** Vía de la merma (FE-04): "A · Mesa/Orden" o "B · Directa". */
export function viaText(via) {
  if (via === "DIRECT") return "B · Directa";
  if (via === "ORDER") return "A · Mesa/Orden";
  return "—";
}

/**
 * Vistas disponibles y vista inicial del módulo "Anulaciones y mermas".
 * - Mermas: módulo `modules.show_waste` activo y permiso `view_waste_report`.
 * - Ventas/Órdenes anuladas: módulo `modules.show_anulates` activo (por defecto).
 * `requested` respeta el valor de `?view=...` si es válido.
 */
export function resolveAnulate({ showWaste, viewWasteReport, showAnulates, requested }) {
  const views = [];
  if (showWaste !== false && viewWasteReport) views.push("waste");
  if (showAnulates !== false) views.push("sales", "orders");
  const initial = views.includes(requested) ? requested : views[0] || "orders";
  return { views, initial };
}

/** Cantidad + unidad para mostrar en la lista ("1 und", "1.5 kg"). */
export function quantityText(row) {
  const quantity = row?.quantity ?? "";
  const unit = row?.unit || (row?.item_type === "SUPPLY" ? "" : "und");
  return unit ? `${quantity} ${unit}` : `${quantity}`;
}

/** Fecha del backend (ISO o "dd/mm/YYYY HH:MM:SS") a "dd/mm/YYYY HH:MM". */
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

/** Variación vs. periodo anterior: "+38 % vs. periodo anterior". */
export function variationText(summary) {
  const pct = summary?.variation_pct;
  if (pct === null || pct === undefined) return "Sin periodo anterior para comparar";
  const value = Number(pct);
  return `${value > 0 ? "+" : ""}${value.toFixed(value % 1 ? 1 : 0)} % vs. periodo anterior`;
}

/** "Mostrando 1–8 de 23 · Totales del filtro: 41 u · S/ 187.40" */
export function footerText({ page, pageSize, count, shown, summary }) {
  const from = count ? (page - 1) * pageSize + 1 : 0;
  const to = count ? from + shown - 1 : 0;
  return `Mostrando ${from}–${to} de ${count} · Totales del filtro: ${summary?.units ?? 0} u · ${money(summary?.total_cost)}`;
}

/** Parámetros de la API desde el estado de filtros de la pantalla (omite vacíos). */
export function buildParams(filters) {
  const params = {};
  for (const [key, value] of Object.entries(filters || {})) {
    if (value === null || value === undefined || value === "") continue;
    params[key] = value;
  }
  return params;
}

/** Filas para Excel/PDF: mismas columnas que la tabla. */
export function exportRows(records) {
  return (records || []).map((row) => ({
    id: row.id,
    fecha: formatDate(row.created),
    producto: row.item_name,
    tipo: ITEM_TYPE_LABELS[row.item_type] || row.item_type,
    cantidad: row.quantity,
    unidad: row.unit || (row.item_type === "SUPPLY" ? "" : "und"),
    costo_unitario: row.no_cost ? "Sin costo" : Number(row.unit_cost),
    costo_total: Number(row.total_cost),
    motivo: row.reason_description || "—",
    origen: originText(row.origin),
    via: viaText(row.via),
    reposicion: row.replacement ? "Sí" : "No",
    solicito: row.requested_by?.username || "—",
    autorizo: row.authorized_by?.username || "—",
    observacion: row.note || "",
  }));
}
