import test from "node:test";
import assert from "node:assert/strict";
import {
  buildParams,
  exportRows,
  footerText,
  formatDate,
  money,
  originText,
  reasonPill,
  variationText,
} from "./wasteReport.js";

test("money: formato S/ con dos decimales", () => {
  assert.equal(money(187.4), "S/ 187.40");
  assert.equal(money("9.5"), "S/ 9.50");
  assert.equal(money(null), "S/ 0.00");
});

test("originText: mesa o tipo de pedido + número", () => {
  assert.equal(originText({ table: "Mesa 7", order_id: 1842, order_type_label: "Mesa" }), "Mesa 7 · Pedido 1842");
  assert.equal(originText({ table: null, order_id: 1826, order_type_label: "Para llevar" }), "Para llevar · Pedido 1826");
});

test("reasonPill: colores del mockup y gris por defecto", () => {
  assert.equal(reasonPill("PRODUCTO_MALOGRADO"), "p-red");
  assert.equal(reasonPill("ROTURA_DERRAME"), "p-amber");
  assert.equal(reasonPill("CAMBIO_YA_PREPARADO"), "p-violet");
  assert.equal(reasonPill("CLIENTE_SIN_PAGAR"), "p-gray");
  assert.equal(reasonPill(null), "p-gray");
});

test("formatDate: acepta formato DRF del proyecto", () => {
  assert.equal(formatDate("18/11/2026 23:41:05"), "18/11/2026 23:41");
});

test("variationText: signo y periodo anterior", () => {
  assert.equal(variationText({ variation_pct: "38.0" }), "+38 % vs. periodo anterior");
  assert.equal(variationText({ variation_pct: "-12.5" }), "-12.5 % vs. periodo anterior");
  assert.match(variationText({ variation_pct: null }), /Sin periodo/);
});

test("footerText: rango mostrado y totales del filtro", () => {
  const text = footerText({ page: 1, pageSize: 20, count: 23, shown: 8, summary: { units: 41, total_cost: "187.40" } });
  assert.equal(text, "Mostrando 1–8 de 23 · Totales del filtro: 41 u · S/ 187.40");
  assert.match(footerText({ page: 1, pageSize: 20, count: 0, shown: 0, summary: {} }), /Mostrando 0–0 de 0/);
});

test("buildParams: omite filtros vacíos", () => {
  assert.deepEqual(buildParams({ reason: "", till: null, item_type: "COMBO", page: 2 }), { item_type: "COMBO", page: 2 });
});

test("exportRows: mismas columnas que la tabla, 'Sin costo' cuando aplica", () => {
  const [row] = exportRows([
    {
      id: 1, created: "18/11/2026 23:41:00", item_name: "OCTAVO", item_type: "PRODUCT", quantity: 1,
      unit_cost: "0.00", total_cost: "0.00", no_cost: true, reason_description: "Malogrado",
      origin: { table: "Mesa 7", order_id: 5 }, requested_by: { username: "cajero" }, authorized_by: { username: "sup" },
    },
  ]);
  assert.equal(row.costo_unitario, "Sin costo");
  assert.equal(row.tipo, "PRODUCTO");
  assert.equal(row.origen, "Mesa 7 · Pedido 5");
});
