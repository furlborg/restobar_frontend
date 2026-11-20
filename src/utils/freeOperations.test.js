import test from "node:test";
import assert from "node:assert/strict";

import {
  AFFECTATION_DEFAULT_COURTESY,
  AFFECTATION_DEFAULT_INTERNAL_CONSUMPTION,
  AFFECTATION_EXONERATED,
  AFFECTATION_FREE,
  AFFECTATION_TAXED,
  FREE_AFFECTATIONS,
  FREE_REASON_COURTESY,
  FREE_REASON_INTERNAL_CONSUMPTION,
  PERMISSION_AUTHORIZE_FREE_OPERATION,
  allowedFreeAffectations,
  buildFreeAuthorizationPayload,
  calculateTaxedFreeAmounts,
  defaultFreeAffectation,
  freeAffectationLabel,
  freeAuthMode,
  getAffectationTag,
  getFreeReasonLabel,
  isFreeAffectation,
  isTaxedFreeAffectation,
  validateFreeAuth,
} from "./freeOperations.js";

test("isFreeAffectation: reconoce 11-16 y 21 como gratuitas", () => {
  assert.equal(isFreeAffectation(10), false);
  assert.equal(isFreeAffectation(20), false);
  assert.equal(isFreeAffectation(21), true);
  for (const code of [11, 12, 13, 14, 15, 16]) {
    assert.equal(isFreeAffectation(code), true);
    assert.equal(isTaxedFreeAffectation(code), true);
  }
  assert.equal(isTaxedFreeAffectation(21), false);
});

test("allowedFreeAffectations: gravado solo acepta 11-16, exonerado solo 21", () => {
  assert.deepEqual(allowedFreeAffectations(AFFECTATION_TAXED), [11, 12, 13, 14, 15, 16]);
  assert.deepEqual(allowedFreeAffectations(AFFECTATION_EXONERATED), [21]);
  assert.deepEqual(allowedFreeAffectations(21), [21]);
});

test("defaultFreeAffectation: sugiere 13 para consumo interno y 15 para cortesía en gravados; 21 en exonerados", () => {
  assert.equal(defaultFreeAffectation(AFFECTATION_TAXED, FREE_REASON_INTERNAL_CONSUMPTION), AFFECTATION_DEFAULT_INTERNAL_CONSUMPTION);
  assert.equal(defaultFreeAffectation(AFFECTATION_TAXED, FREE_REASON_COURTESY), AFFECTATION_DEFAULT_COURTESY);
  assert.equal(defaultFreeAffectation(AFFECTATION_EXONERATED, FREE_REASON_INTERNAL_CONSUMPTION), AFFECTATION_FREE);
  assert.equal(defaultFreeAffectation(AFFECTATION_EXONERATED, FREE_REASON_COURTESY), AFFECTATION_FREE);
});

test("freeAuthMode: con permiso firma con su clave; sin permiso exige supervisor", () => {
  const withPerm = (p) => p === PERMISSION_AUTHORIZE_FREE_OPERATION;
  const withoutPerm = () => false;

  assert.equal(freeAuthMode(withPerm), "own");
  assert.equal(freeAuthMode(withoutPerm), "supervisor");
});

test("validateFreeAuth y buildFreeAuthorizationPayload", () => {
  assert.match(validateFreeAuth({}, "own"), /contraseña/);
  assert.equal(validateFreeAuth({ password: "123" }, "own"), null);

  assert.match(validateFreeAuth({ password: "123" }, "supervisor"), /usuario/);
  assert.match(validateFreeAuth({ username: "super" }, "supervisor"), /contraseña/);
  assert.equal(validateFreeAuth({ username: "super", password: "123" }, "supervisor"), null);

  assert.deepEqual(buildFreeAuthorizationPayload({ password: "abc" }, "own"), {
    supervisor_password: "abc",
  });
  assert.deepEqual(buildFreeAuthorizationPayload({ username: "admin", password: "abc" }, "supervisor"), {
    supervisor_username: "admin",
    supervisor_password: "abc",
  });
});

test("calculateTaxedFreeAmounts: calcula base e IGV referencial", () => {
  const { priceBase, igvTax } = calculateTaxedFreeAmounts(20.0, 0.18);
  assert.equal(priceBase, 16.95);
  assert.equal(igvTax, 3.05);
  assert.equal(Math.round((priceBase + igvTax) * 100) / 100, 20.0);
});

test("getAffectationTag y getFreeReasonLabel", () => {
  assert.equal(getAffectationTag(10).short, "GRV");
  assert.equal(getAffectationTag(13).short, "RET");
  assert.equal(getAffectationTag(15).short, "BON");
  assert.equal(getAffectationTag(21).short, "GRT");

  assert.equal(getFreeReasonLabel(FREE_REASON_COURTESY), "Cortesía");
  assert.equal(getFreeReasonLabel(FREE_REASON_INTERNAL_CONSUMPTION), "Consumo interno");
});

test("freeAffectationLabel: etiqueta legible para ticket y PDF (FLZ-GRA-08)", () => {
  assert.equal(freeAffectationLabel(13), "Gravado – Retiro");
  assert.equal(freeAffectationLabel(15), "Gravado – Bonificaciones");
  assert.equal(freeAffectationLabel(21), "Exonerado - Transferencia gratuita");
  assert.equal(freeAffectationLabel(10), "");
  assert.equal(freeAffectationLabel(null), "");
});
