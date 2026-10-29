import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerRule,
  canCharge,
  cents,
  changeStatus,
  conditionPatch,
  expirationRule,
  quickCashOptions,
} from "./checkout.js";
import { chargeHint, dueDateInDays, validateCreditCustomer } from "./creditCustomer.js";

const dni = { id: 5, doc_type: "1", doc_num: "12345678" };
const ruc = { id: 6, doc_type: "6", doc_num: "20123456789" };
const rucShort = { id: 7, doc_type: "6", doc_num: "2012345" };

test("cents: suma de decimales sin error de coma flotante", () => {
  assert.equal(cents(0.1 + 0.2), 30);
  assert.equal(cents("11.80"), 1180);
  assert.equal(cents(null), 0);
});

test("quickCashOptions: hasta 3 billetes mayores al total", () => {
  assert.deepEqual(quickCashOptions(11.8).map((o) => o.value), [20, 50, 100]);
  assert.deepEqual(quickCashOptions(60).map((o) => o.value), [100, 200]);
  assert.deepEqual(quickCashOptions(250).map((o) => o.value), [300, 350]);
  assert.deepEqual(quickCashOptions(300).map((o) => o.value), [350, 400]);
  assert.deepEqual(quickCashOptions(0).map((o) => o.value), [20, 50, 100]);
});

test("changeStatus: vuelto, exacto, faltante y crédito", () => {
  assert.deepEqual(changeStatus({ given: 20, total: 11.8 }), { key: "change", cls: "status-success", label: "VUELTO", hint: "A entregar al cliente", value: 8.2 });
  assert.equal(changeStatus({ given: "11.80", total: 11.8 }).key, "exact");
  assert.equal(changeStatus({ given: 0.3, total: 0.1 + 0.2 }).key, "exact", "no depende de la coma flotante");
  const missing = changeStatus({ given: 5, total: 11.8 });
  assert.equal(missing.key, "missing");
  assert.equal(missing.value, 6.8);
  assert.equal(changeStatus({ isCredit: true, given: 0, total: 50 }).key, "credit");
  assert.equal(changeStatus({ given: 0, total: 0 }).key, "missing");
});

test("canCharge: contado exige pago completo; crédito exige NO haber pagado todo", () => {
  assert.equal(canCharge({ given: "11.80", amount: "11.80" }), true);
  assert.equal(canCharge({ given: "5.00", amount: "11.80" }), false);
  assert.equal(canCharge({ given: 0.3, amount: 0.1 + 0.2 }), true, "total con coma flotante no bloquea");
  assert.equal(canCharge({ isCredit: true, given: "0.00", amount: "11.80" }), true);
  assert.equal(canCharge({ isCredit: true, given: "11.80", amount: "11.80" }), false);
  assert.equal(canCharge({ hasItems: false, given: 10, amount: 10 }), false);
});

test("canCharge: cambiar de método de pago en crédito no bloquea (given sigue en 0)", () => {
  // El bug: al elegir Yape en crédito se igualaba given al total. Con given en 0 el cobro sigue habilitado.
  assert.equal(canCharge({ isCredit: true, given: "0.00", amount: "50.00" }), true);
});

test("conditionPatch: contado recibe el total; crédito recibe 0 y vence a 30 días", () => {
  const cash = conditionPatch({ condition: 1, total: "50.00", expiration: "01/01/2030" });
  assert.deepEqual(cash, { given_amount: "50.00", expiration_sale: null, clearMultiple: false });
  const credit = conditionPatch({ condition: 2, total: "50.00" });
  assert.equal(credit.given_amount, "0.00");
  assert.equal(credit.expiration_sale, dueDateInDays(30));
  assert.equal(credit.clearMultiple, true);
  assert.equal(conditionPatch({ condition: 2, total: "50.00", expiration: "15/11/2030" }).expiration_sale, "15/11/2030", "respeta la fecha ya elegida");
});

test("buildCustomerRule: cuándo el cliente es obligatorio", () => {
  const req = (args) => buildCustomerRule(args).required;
  assert.equal(req({ invoiceType: 80, amount: 5000 }), false, "nota de venta nunca");
  assert.equal(req({ invoiceType: 3, amount: 699.99 }), false);
  assert.equal(req({ invoiceType: 3, amount: 700 }), true, "boleta desde S/ 700");
  assert.equal(req({ invoiceType: 1, amount: 10 }), true, "factura siempre");
  assert.equal(req({ invoiceType: 80, amount: 10, isCredit: true }), true, "crédito siempre");
});

test("buildCustomerRule: validador de crédito y factura", () => {
  const run = (args, value) => buildCustomerRule(args).validator(null, value);
  assert.equal(run({ invoiceType: 3, isCredit: true, customer: dni }, 5), true);
  assert.ok(run({ invoiceType: 3, isCredit: true }, null) instanceof Error, "crédito sin cliente");
  assert.ok(run({ invoiceType: 3, isCredit: true }, 1) instanceof Error, "crédito a Clientes Varios");
  assert.ok(run({ invoiceType: 1, isCredit: true, customer: dni }, 5) instanceof Error, "factura a crédito con DNI");
  assert.equal(run({ invoiceType: 1, isCredit: true, customer: ruc }, 6), true);
  assert.ok(run({ invoiceType: 1, customer: dni }, 5) instanceof Error, "factura con DNI");
  assert.ok(run({ invoiceType: 1, customer: rucShort }, 7) instanceof Error, "RUC de menos de 11 dígitos");
  assert.ok(run({ invoiceType: 1 }, 0) instanceof Error, "factura sin cliente");
  assert.equal(run({ invoiceType: 3 }, null), true, "boleta pequeña de contado sin cliente");
  assert.equal(run({ invoiceType: 1 }, ruc), true, "acepta el objeto cliente como valor");
});

test("expirationRule: solo en crédito y exige fecha", () => {
  assert.equal(expirationRule(false), null);
  const rule = expirationRule(true);
  assert.ok(rule.validator(null, null) instanceof Error);
  assert.equal(rule.validator(null, "15/11/2026"), true);
});

test("chargeHint sigue coherente con canCharge", () => {
  const base = { hasItems: true, invoiceType: 80, customerId: null };
  assert.equal(chargeHint({ ...base, given: "11.80", amount: "11.80" }), "");
  assert.match(chargeHint({ ...base, given: "5.00", amount: "11.80" }), /Falta S\/ 6\.80/);
  assert.equal(chargeHint({ ...base, isCredit: true, given: "0.00", amount: "50", customerId: 5, customer: dni, expiration: "15/11/2026" }), "");
  assert.equal(validateCreditCustomer({ customerId: 5, customer: dni, invoiceType: 3 }), true);
});
