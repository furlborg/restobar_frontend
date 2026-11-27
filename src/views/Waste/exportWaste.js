// Exportación de la pantalla "Mermas" (FLZ-REP-04): Excel (exceljs) y PDF (jsPDF + autotable).
// Exporta exactamente los registros y totales del filtro (la API se consulta con `all=1`).
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { exportRows, money } from "@/utils/wasteReport";

applyPlugin(jsPDF);

const LIST_COLUMNS = [
  { header: "#", key: "id", width: 8 },
  { header: "Fecha", key: "fecha", width: 18 },
  { header: "Producto / combo / menú", key: "producto", width: 30 },
  { header: "Tipo", key: "tipo", width: 11 },
  { header: "Cant.", key: "cantidad", width: 8 },
  { header: "Unidad", key: "unidad", width: 8 },
  { header: "Costo unit.", key: "costo_unitario", width: 12 },
  { header: "Costo total", key: "costo_total", width: 12 },
  { header: "Motivo", key: "motivo", width: 26 },
  { header: "Origen", key: "origen", width: 24 },
  { header: "Vía", key: "via", width: 12 },
  { header: "Regresó a cocina", key: "reposicion", width: 12 },
  { header: "Solicitó", key: "solicito", width: 14 },
  { header: "Autorizó", key: "autorizo", width: 14 },
  { header: "Observación", key: "observacion", width: 30 },
];

const SUMMARY_COLUMNS = [
  { header: "Agrupación", key: "label", width: 34 },
  { header: "Registros", key: "records", width: 12 },
  { header: "Unidades", key: "units", width: 12 },
  { header: "Costo total", key: "total_cost", width: 14 },
  { header: "% del total", key: "pct", width: 12 },
];

const fileStamp = (range) => `${range.start || "inicio"}_${range.end || "hoy"}`.replace(/\//g, "-");

function headerLines({ businessName, branchName, range, groupLabel }) {
  return [
    businessName,
    branchName ? `Sucursal: ${branchName}` : null,
    `Rango: ${range.start || "—"} al ${range.end || "—"}`,
    groupLabel ? `Agrupado por: ${groupLabel}` : null,
  ].filter(Boolean);
}

function addSheet(workbook, name, title, header, columns, rows, totalsRow) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map(({ key, width }) => ({ key, width }));
  sheet.addRow([title]).font = { bold: true, size: 14 };
  headerLines(header).forEach((line) => sheet.addRow([line]));
  sheet.addRow([]);
  const head = sheet.addRow(columns.map((column) => column.header));
  head.font = { bold: true };
  head.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F8FA" } };
  });
  rows.forEach((row) => sheet.addRow(columns.map((column) => row[column.key])));
  if (totalsRow) sheet.addRow(columns.map((column) => totalsRow[column.key] ?? "")).font = { bold: true };
  return sheet;
}

export async function exportWasteExcel({ records, summary, grouped, header }) {
  const workbook = new ExcelJS.Workbook();
  const rows = exportRows(records);
  addSheet(workbook, "Mermas", "Lista de mermas", header, LIST_COLUMNS, rows, {
    producto: "Totales del filtro",
    cantidad: summary?.units ?? 0,
    costo_total: Number(summary?.total_cost || 0),
  });
  if (grouped) {
    addSheet(
      workbook,
      "Resumen",
      "Resumen de mermas",
      { ...header, groupLabel: header.groupLabel },
      SUMMARY_COLUMNS,
      grouped.rows.map((row) => ({ ...row, total_cost: Number(row.total_cost), pct: `${row.pct} %` })),
      { label: "Total", records: grouped.totals.records, units: grouped.totals.units, total_cost: Number(grouped.totals.total_cost), pct: "100 %" }
    );
  }
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `mermas_${fileStamp(header.range)}.xlsx`);
}

export function exportWastePdf({ records, summary, grouped, header }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 12;
  doc.setFontSize(14).setFont(undefined, "bold");
  doc.text("Mermas", 10, y);
  doc.setFontSize(9).setFont(undefined, "normal");
  headerLines(header).forEach((line) => {
    y += 5;
    doc.text(line, 10, y);
  });
  y += 5;
  doc.text(
    `Merma valorizada: ${money(summary?.total_cost)} · Registros: ${summary?.records ?? 0} · Unidades: ${summary?.units ?? 0} · Venta perdida (ref.): ${money(summary?.lost_sale)}`,
    10,
    y
  );

  const rows = exportRows(records);
  doc.autoTable({
    startY: y + 4,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [247, 248, 250], textColor: 20 },
    head: [["#", "Fecha", "Producto / combo / menú", "Cant.", "Unidad", "Costo unit.", "Costo total", "Motivo", "Origen", "Vía", "Regresó a cocina", "Solicitó", "Autorizó"]],
    body: rows.map((row) => [
      row.id, row.fecha, `${row.producto} (${row.tipo})`, row.cantidad, row.unidad,
      typeof row.costo_unitario === "number" ? money(row.costo_unitario) : row.costo_unitario,
      money(row.costo_total), row.motivo, row.origen, row.via, row.reposicion, row.solicito, row.autorizo,
    ]),
    foot: [["", "", "Totales del filtro", summary?.units ?? 0, "", "", money(summary?.total_cost), "", "", "", "", "", ""]],
  });

  if (grouped) {
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 8,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [247, 248, 250], textColor: 20 },
      head: [[header.groupLabel || "Motivo", "Registros", "Unidades", "Costo total", "% del total"]],
      body: grouped.rows.map((row) => [row.label, row.records, row.units, money(row.total_cost), `${row.pct} %`]),
      foot: [["Total", grouped.totals.records, grouped.totals.units, money(grouped.totals.total_cost), "100 %"]],
    });
  }
  doc.save(`mermas_${fileStamp(header.range)}.pdf`);
}
