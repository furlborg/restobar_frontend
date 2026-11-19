import test from "node:test";
import assert from "node:assert/strict";
import {
  createUpdateBarrier,
  classifyWrite,
  normalizeApiPath,
  BARRIER_REASON as R,
  WRITE_KIND as K,
  OUTCOME as O,
} from "./updateBarrier.js";

// ---- Clasificación de peticiones ----
test("normalizeApiPath: quita dominio, /api/vN/, barras y query", () => {
  assert.equal(normalizeApiPath("https://demo.flizzy.pe/api/v1/sales/"), "sales/");
  assert.equal(normalizeApiPath("/api/v2/orders/12/?x=1"), "orders/12/");
  assert.equal(normalizeApiPath("sales/serie_number/"), "sales/serie_number/");
  assert.equal(normalizeApiPath(undefined), "");
});

test("classifyWrite: las lecturas no se vigilan", () => {
  assert.equal(classifyWrite("get", "sales/"), null);
  assert.equal(classifyWrite(undefined, "sales/"), null);
  assert.equal(classifyWrite("head", "orders/"), null);
});

test("classifyWrite: ventas, créditos y caja son cobros", () => {
  for (const url of ["sales/", "sales/resend-pending/", "sales/9/print/", "credits/", "customers/7/pay_credits/", "till_details/", "till_details/3", "tills/", "tills/5/"]) {
    assert.equal(classifyWrite("post", url), K.PAYMENT, url);
  }
  assert.equal(classifyWrite("PATCH", "/api/v1/tills/5/"), K.PAYMENT);
});

test("classifyWrite: pedidos, cambio de mesa y cocina son pedidos", () => {
  assert.equal(classifyWrite("post", "orders/take_away/"), K.ORDER);
  assert.equal(classifyWrite("patch", "orders/44/"), K.ORDER);
  assert.equal(classifyWrite("patch", "tables/3/change_order/"), K.ORDER);
  assert.equal(classifyWrite("post", "product-preparation/dispatch_order/"), K.ORDER);
});

test("classifyWrite: el resto de escrituras también se vigila", () => {
  assert.equal(classifyWrite("post", "products/"), K.OTHER);
  assert.equal(classifyWrite("delete", "customers/9/"), K.OTHER);
  assert.equal(classifyWrite("post", "payment_methods/"), K.OTHER, "configurar métodos de pago no es un cobro");
  assert.equal(classifyWrite("post", "tables/"), K.OTHER);
});

test("classifyWrite: POST que solo leen no se vigilan (verificado en el backend)", () => {
  for (const url of ["tills/current/", "sales/serie_number/", "business/validate_pass/", "users/verify_waiter/"]) {
    assert.equal(classifyWrite("post", url), null, url);
  }
});

test("classifyWrite: sesión y bloqueos de mesa no se vigilan", () => {
  for (const url of ["login/", "login/refresh/", "logout/", "table-locks/release_my_locks/", "/api/v1/table-locks/unlock/"]) {
    assert.equal(classifyWrite("post", url), null, url);
  }
});

// ---- Evaluación ----
test("sin nada pendiente se puede actualizar", () => {
  assert.deepEqual(createUpdateBarrier().evaluate(), { ok: true });
});

test("CA01: un pedido con cambios solo en memoria bloquea", () => {
  const b = createUpdateBarrier();
  let dirty = true;
  const off = b.registerBlocker(() => (dirty ? R.UNSAVED : null));
  assert.deepEqual(b.evaluate(), { ok: false, reason: R.UNSAVED });
  dirty = false;
  assert.deepEqual(b.evaluate(), { ok: true });
  dirty = true;
  off();
  assert.deepEqual(b.evaluate(), { ok: true }, "al salir de la pantalla deja de bloquear");
});

test("un cobro esperando respuesta bloquea con 'payment'", () => {
  const b = createUpdateBarrier();
  const t = b.beginOperation(K.PAYMENT);
  assert.deepEqual(b.evaluate(), { ok: false, reason: R.PAYMENT });
  assert.equal(b.hasPaymentInFlight(), true);
  b.endOperation(t, O.CONFIRMED);
  assert.deepEqual(b.evaluate(), { ok: true });
  assert.equal(b.hasPaymentInFlight(), false);
});

test("otra escritura esperando respuesta bloquea con 'saving'", () => {
  const b = createUpdateBarrier();
  const t = b.beginOperation(K.ORDER);
  assert.deepEqual(b.evaluate(), { ok: false, reason: R.SAVING });
  b.endOperation(t, O.FAILED);
  assert.deepEqual(b.evaluate(), { ok: true }, "un error con respuesta del servidor es un resultado conocido");
});

test("CA02: un cobro sin respuesta queda incierto y sigue bloqueando", () => {
  const b = createUpdateBarrier();
  const t = b.beginOperation(K.PAYMENT);
  b.endOperation(t, O.UNKNOWN);
  assert.deepEqual(b.evaluate(), { ok: false, reason: R.UNCERTAIN });
  assert.deepEqual(b.evaluate(), { ok: false, reason: R.UNCERTAIN }, "no se resuelve solo");
});

test("lo incierto solo se libera cuando el usuario confirma que lo revisó", () => {
  const b = createUpdateBarrier();
  b.endOperation(b.beginOperation(K.PAYMENT), O.UNKNOWN);
  b.endOperation(b.beginOperation(K.ORDER), O.UNKNOWN);
  assert.equal(b.snapshot().uncertain, 2);
  b.acknowledgeUncertain();
  assert.deepEqual(b.evaluate(), { ok: true });
});

test("prioridad: cobro en curso > escritura en curso > incierto > sin guardar", () => {
  const b = createUpdateBarrier();
  b.registerBlocker(() => R.UNSAVED);
  b.endOperation(b.beginOperation(K.OTHER), O.UNKNOWN);
  const order = b.beginOperation(K.ORDER);
  const pay = b.beginOperation(K.PAYMENT);
  assert.equal(b.evaluate().reason, R.PAYMENT);
  b.endOperation(pay, O.CONFIRMED);
  assert.equal(b.evaluate().reason, R.SAVING);
  b.endOperation(order, O.CONFIRMED);
  assert.equal(b.evaluate().reason, R.UNCERTAIN);
  b.acknowledgeUncertain();
  assert.equal(b.evaluate().reason, R.UNSAVED);
});

test("una pantalla cuyo estado no se puede leer bloquea (no es seguro)", () => {
  const b = createUpdateBarrier();
  b.registerBlocker(() => {
    throw new Error("store sin inicializar");
  });
  assert.deepEqual(b.evaluate(), { ok: false, reason: R.UNSAVED });
});

test("CA04: una operación nueva después de una evaluación correcta invalida la autorización", () => {
  const b = createUpdateBarrier();
  assert.equal(b.evaluate().ok, true);
  b.beginOperation(K.PAYMENT);
  assert.equal(b.evaluate().ok, false, "se evalúa en el momento, no se guarda el 'ok' anterior");
});

test("cerrar un token desconocido o dos veces no rompe nada", () => {
  const b = createUpdateBarrier();
  const t = b.beginOperation(K.ORDER);
  b.endOperation(t, O.CONFIRMED);
  b.endOperation(t, O.UNKNOWN);
  b.endOperation(999, O.UNKNOWN);
  assert.deepEqual(b.evaluate(), { ok: true });
});

test("los oyentes se enteran de cada cambio de operaciones", () => {
  const b = createUpdateBarrier();
  let calls = 0;
  b.subscribe(() => {
    calls += 1;
  });
  b.subscribe(() => {
    throw new Error("oyente roto");
  });
  const t = b.beginOperation(K.PAYMENT);
  b.endOperation(t, O.UNKNOWN);
  b.acknowledgeUncertain();
  assert.equal(calls, 3);
});
