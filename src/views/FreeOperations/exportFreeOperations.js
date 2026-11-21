// Exportación de "Operaciones gratuitas" (FLZ-REP-06): Excel (exceljs) y PDF (jsPDF + autotable).
// Exporta exactamente los registros y totales del filtro (la API se consulta con `all=1`).
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { exportRows, money } from "@/utils/freeOperationsReport";

applyPlugin(jsPDF);

const LIST_COLUMNS = [
  { header: "Comprobante", key: "comprobante", width: 30 },
  { header: "Fecha", key: "fecha", width: 18 },
  { header: "Ítem", key: "item", width: 32 },
  { header: "Cant.", key: "cantidad", width: 8 },
  { header: "Valor referencial", key: "valor_referencial", width: 16 },
  { header: "IGV referencial", key: "igv_referencial", width: 15 },
  { header: "Afectación", key: "afectacion", width: 34 },
  { header: "Motivo", key: "motivo", width: 20 },
  { header: "Autorizó", key: "autorizo", width: 14 },
];

const DOCUMENT_COLUMNS = [
  { header: "Comprobante", key: "label", width: 26 },
  { header: "Condición", key: "kind", width: 26 },
  { header: "Registros", key: "records", width: 12 },
  { header: "Valor referencial", key: "reference_value", width: 18 },
  { header: "IGV referencial", key: "reference_igv", width: 16 },
];

const fileStamp = (range) => `${range.start || "inicio"}_${range.end || "hoy"}`.replace(/\//g, "-");

function headerLines({ businessName, branchName, range }) {
  return [
    businessName,
    branchName ? `Sucursal: ${branchName}` : null,
    `Rango: ${range.start || "—"} al ${range.end || "—"}`,
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

export async function exportFreeOperationsExcel({ records, summary, header }) {
  const workbook = new ExcelJS.Workbook();
  addSheet(workbook, "Operaciones", "Operaciones gratuitas", header, LIST_COLUMNS, exportRows(records), {
    comprobante: "Totales del filtro",
    cantidad: summary?.records ?? 0,
    valor_referencial: Number(summary?.reference_value || 0),
    igv_referencial: Number(summary?.reference_igv || 0),
  });
  addSheet(
    workbook,
    "Por comprobante",
    "Totales por tipo de comprobante",
    header,
    DOCUMENT_COLUMNS,
    (summary?.by_document_type || []).map((row) => ({
      label: row.label,
      kind: row.kind === "NOTE_OF_SALE" ? "Nota de venta (no informada)" : "Informado a SUNAT",
      records: row.records,
      reference_value: Number(row.reference_value),
      reference_igv: Number(row.reference_igv),
    })),
    {
      label: "Total",
      records: summary?.records ?? 0,
      reference_value: Number(summary?.reference_value || 0),
      reference_igv: Number(summary?.reference_igv || 0),
    }
  );
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `operaciones_gratuitas_${fileStamp(header.range)}.xlsx`);
}

export function exportFreeOperationsPdf({ records, summary, header }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 12;
  doc.setFontSize(14).setFont(undefined, "bold");
  doc.text("Operaciones gratuitas", 10, y);
  doc.setFontSize(9).setFont(undefined, "normal");
  headerLines(header).forEach((line) => {
    y += 5;
    doc.text(line, 10, y);
  });
  y += 5;
  doc.text(
    `Valor referencial: ${money(summary?.reference_value)} · IGV de retiros: ${money(
      summary?.reference_igv
    )} · Operaciones: ${summary?.records ?? 0}`,
    10,
    y
  );

  const rows = exportRows(records);
  doc.autoTable({
    startY: y + 4,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [247, 248, 250], textColor: 20 },
    head: [["Comprobante", "Fecha", "Ítem", "Cant.", "Valor ref.", "IGV ref.", "Afectación", "Motivo", "Autorizó"]],
    body: rows.map((row) => [
      row.comprobante,
      row.fecha,
      row.item,
      row.cantidad,
      money(row.valor_referencial),
      money(row.igv_referencial),
      row.afectacion,
      row.motivo,
      row.autorizo,
    ]),
    foot: [
      [
        "Totales del filtro",
        "",
        "",
        summary?.records ?? 0,
        money(summary?.reference_value),
        money(summary?.reference_igv),
        "",
        "",
        "",
      ],
    ],
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [247, 248, 250], textColor: 20 },
    head: [["Comprobante", "Condición", "Registros", "Valor referencial", "IGV referencial"]],
    body: (summary?.by_document_type || []).map((row) => [
      row.label,
      row.kind === "NOTE_OF_SALE" ? "Nota de venta (no informada)" : "Informado a SUNAT",
      row.records,
      money(row.reference_value),
      money(row.reference_igv),
    ]),
    foot: [
      [
        "Total",
        "",
        summary?.records ?? 0,
        money(summary?.reference_value),
        money(summary?.reference_igv),
      ],
    ],
  });
  doc.save(`operaciones_gratuitas_${fileStamp(header.range)}.pdf`);
}
