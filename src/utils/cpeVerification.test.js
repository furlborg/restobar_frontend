import test from "node:test";
import assert from "node:assert/strict";
import { canVerifyCpe, cpeVerificationLines } from "./cpeVerification.js";

test("solo se verifican comprobantes electrónicos que llegaron al PSE", () => {
  assert.equal(canVerifyCpe({ invoice_type: "01", status: "E" }), true);
  assert.equal(canVerifyCpe({ invoice_type: "03", status: "X" }), true);
  assert.equal(canVerifyCpe({ invoice_type: "03", status: "A" }), true);
  assert.equal(canVerifyCpe({ invoice_type: "01", status: "N" }), false);
  assert.equal(canVerifyCpe({ invoice_type: "80", status: "E" }), false);
  assert.equal(canVerifyCpe(null), false);
});

test("resume el cambio de estado, el comprobante y la baja", () => {
  const lines = cpeVerificationLines({
    status_before: "X",
    status_after: "E",
    document: { state: "Aceptado", description: "La Factura F001-1 ha sido aceptada" },
    annulment: null,
    warning: null,
  });
  assert.deepEqual(lines, ["Estado: Error → Enviado", "Comprobante: Aceptado - La Factura F001-1 ha sido aceptada"]);
});

test("incluye la baja y el aviso cuando existen", () => {
  const lines = cpeVerificationLines({
    status_before: "A",
    status_after: "A",
    document: {},
    annulment: { outcome: "ACCEPTED", state: "ACEPTADO" },
    warning: "La anulacion de esta venta no se comunico al proveedor",
  });
  assert.deepEqual(lines, [
    "Estado: Anulado",
    "Anulación: ACEPTADO",
    "La anulacion de esta venta no se comunico al proveedor",
  ]);
});
