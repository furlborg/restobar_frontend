import test from "node:test";
import assert from "node:assert/strict";
import {
  buildParams,
  documentText,
  exportRows,
  footerText,
  formatDate,
  money,
  reasonText,
} from "./freeOperationsReport.js";

test("money y documentText: formato del comprobante", () => {
  assert.equal(money(7.63), "S/ 7.63");
  assert.equal(money(null), "S/ 0.00");
  assert.equal(
    documentText({ label: "BOLETA DE VENTA", serie: "B001", number: 123 }),
    "BOLETA DE VENTA B001-123"
  );
  assert.equal(documentText({ label: "NOTA DE VENTA", serie: "", number: 9 }), "NOTA DE VENTA 9");
});

test("reasonText: motivo con etiqueta o histórico", () => {
  assert.equal(reasonText({ free_reason: "COURTESY", free_reason_label: "Cortesía" }), "Cortesía");
  assert.equal(reasonText({ free_reason: "INTERNAL_CONSUMPTION" }), "Consumo interno");
  assert.equal(reasonText({ free_reason: null }), "Sin motivo (histórico)");
});

test("buildParams: omite filtros vacíos", () => {
  assert.deepEqual(buildParams({ start_date: "2026-11-01", free_reason: null, search: "" }), {
    start_date: "2026-11-01",
  });
});

test("exportRows: mismas columnas y montos que la pantalla", () => {
  const rows = exportRows([
    {
      id: 1,
      created: "2026-11-18T20:00:00-05:00",
      document: { label: "FACTURA", serie: "F001", number: 2 },
      item: "PISCO SOUR",
      quantity: 1,
      reference_value: "10.00",
      reference_igv: "1.53",
      affectation: { id: 15, description: "GRAVADO - BONIFICACIONES" },
      free_reason: "COURTESY",
      authorized_by: { username: "SUPERVISOR" },
    },
  ]);
  assert.equal(rows[0].comprobante, "FACTURA F001-2");
  assert.equal(rows[0].valor_referencial, 10);
  assert.equal(rows[0].igv_referencial, 1.53);
  assert.equal(rows[0].motivo, "Cortesía");
  assert.equal(rows[0].autorizo, "SUPERVISOR");
});

test("footerText: rango mostrado e IGV de retiros", () => {
  assert.equal(
    footerText({ page: 2, pageSize: 20, count: 25, summary: { reference_igv: 7.63 } }),
    "Mostrando 21–25 de 25 · IGV de retiros: S/ 7.63"
  );
});

test("formatDate: ISO a dd/mm/yyyy HH:MM", () => {
  assert.match(formatDate("2026-11-18T20:05:00-05:00"), /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  assert.equal(formatDate(null), "—");
});
