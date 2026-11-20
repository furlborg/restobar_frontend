import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_MODE_GENERAL,
  authError,
  authMode,
  buildCancelOrderPayload,
  buildRemoveDetailPayload,
  canSeeWasteCost,
  cancellationErrorMessage,
  credentialPayload,
  itemError,
  resolveAuthMode,
  resolveDestination,
  summarize,
  wasteModuleEnabled,
} from "./cancellation.js";

const reasons = [
  { code: "ERROR_COMANDA", description: "Error al tomar el pedido", destination: "STOCK", requires_note: false },
  { code: "PRODUCTO_MALOGRADO", description: "Producto malogrado", destination: "WASTE", requires_note: false },
  { code: "OTRO", description: "Otro", destination: "CHOICE", requires_note: true },
];
const [errorComanda, malogrado, otro] = reasons;

const perms = (...granted) => (permission) => granted.includes(permission);

test("resolveDestination: el motivo fija el destino; solo OTRO acepta el elegido", () => {
  assert.equal(resolveDestination(errorComanda, "WASTE"), "STOCK");
  assert.equal(resolveDestination(malogrado, "STOCK"), "WASTE");
  assert.equal(resolveDestination(otro, "WASTE"), "WASTE");
  assert.equal(resolveDestination(otro, undefined), null);
  assert.equal(resolveDestination(null, "STOCK"), null);
});

test("authMode: con permiso firma con su clave; sin permiso, supervisor", () => {
  assert.equal(authMode(perms("cancel_orderdetail"), "cancel_orderdetail", "STOCK"), "own");
  assert.equal(authMode(perms(), "cancel_orderdetail", "STOCK"), "supervisor");
});

test("authMode: merma sin authorize_waste exige supervisor aunque pueda anular", () => {
  assert.equal(authMode(perms("cancel_orderdetail"), "cancel_orderdetail", "WASTE"), "supervisor");
  assert.equal(authMode(perms("cancel_orderdetail", "authorize_waste"), "cancel_orderdetail", "WASTE"), "own");
});

test("itemError: motivo, destino de OTRO y observación obligatoria", () => {
  assert.match(itemError(null), /motivo/);
  assert.equal(itemError(errorComanda), null);
  assert.match(itemError(otro, undefined, "x"), /stock o es merma/);
  assert.match(itemError(otro, "WASTE", "  "), /observación/);
  assert.equal(itemError(otro, "WASTE", "se cayó"), null);
});

test("authError: modo supervisor pide usuario y clave; modo propio solo clave", () => {
  assert.match(authError("supervisor", { username: "", password: "x" }), /usuario/);
  assert.match(authError("supervisor", { username: "sup", password: "" }), /clave del supervisor/);
  assert.equal(authError("own", { password: "x" }), null);
  assert.match(authError("own", {}), /su clave/);
});

test("buildRemoveDetailPayload: contrato nuevo, sin usuario en modo propio", () => {
  const payload = buildRemoveDetailPayload({
    detailId: 7,
    quantity: 2,
    reason: malogrado,
    note: "",
    mode: "own",
    credentials: { username: "otro", password: "123" },
  });
  assert.deepEqual(payload, {
    id: 7,
    quantity: 2,
    reason_code: "PRODUCTO_MALOGRADO",
    destination: "WASTE",
    null_reason: "Producto malogrado",
    supervisor_username: "",
    supervisor_password: "123",
  });
});

test("buildCancelOrderPayload: destino por ítem", () => {
  const payload = buildCancelOrderPayload({
    items: [
      { id: 1, reasonCode: "ERROR_COMANDA" },
      { id: 2, reasonCode: "OTRO", chosenDestination: "WASTE", note: " se derramó " },
    ],
    reasons,
    generalNote: "cierre",
    mode: "supervisor",
    credentials: { username: " sup ", password: "p" },
  });
  assert.deepEqual(payload.items, [
    { order_detail_id: 1, reason_code: "ERROR_COMANDA", destination: "STOCK", note: null },
    { order_detail_id: 2, reason_code: "OTRO", destination: "WASTE", note: "se derramó" },
  ]);
  assert.equal(payload.supervisor_username, "sup");
  assert.equal(payload.null_reason, "cierre");
});

test("summarize: cuenta stock/merma y valoriza la merma en céntimos", () => {
  const result = summarize([
    { quantity: 2, unitCost: 0.1, destination: "WASTE" },
    { quantity: 1, unitCost: 0.2, destination: "WASTE" },
    { quantity: 3, unitCost: 5, destination: "STOCK" },
  ]);
  assert.deepEqual(result, { stockItems: 1, stockUnits: 3, wasteItems: 2, wasteUnits: 3, wasteCostCents: 40 });
});

test("cancellationErrorMessage: traduce códigos del backend", () => {
  assert.match(cancellationErrorMessage({ response: { data: { code: "MISSING_PERMISSION" } } }), /permiso/);
  assert.match(cancellationErrorMessage({ response: { data: { code: "INVALID_CREDENTIALS" } } }), /incorrectos/);
  assert.match(
    cancellationErrorMessage({ response: { data: { code: "INVALID_CREDENTIALS" } } }, AUTH_MODE_GENERAL),
    /clave general/i
  );
  assert.equal(cancellationErrorMessage({ response: { data: { error: "Otro error" } } }), "Otro error");
});

test("resolveAuthMode: la configuración manda y la merma queda blindada", () => {
  const has = perms("cancel_orderdetail", "authorize_waste");
  const base = { hasPermission: has, scopePermission: "cancel_orderdetail" };

  // Sin configuración se comporta como credencial personal.
  assert.equal(resolveAuthMode({ ...base, settings: {}, destination: "STOCK" }), "own");

  // Modo clave general: aplica a stock...
  assert.equal(
    resolveAuthMode({ ...base, settings: { cancellation_auth_mode: AUTH_MODE_GENERAL }, destination: "STOCK" }),
    AUTH_MODE_GENERAL
  );
  // ...pero no a merma salvo que se habilite aparte.
  assert.equal(
    resolveAuthMode({ ...base, settings: { cancellation_auth_mode: AUTH_MODE_GENERAL }, destination: "WASTE" }),
    "own"
  );
  assert.equal(
    resolveAuthMode({
      ...base,
      settings: { cancellation_auth_mode: AUTH_MODE_GENERAL, allow_general_pass_for_waste: true },
      destination: "WASTE",
    }),
    AUTH_MODE_GENERAL
  );

  // Modo personal: nunca acepta clave general.
  assert.equal(
    resolveAuthMode({ ...base, settings: { cancellation_auth_mode: "personal" }, destination: "STOCK" }),
    "own"
  );
});

test("authError y credentialPayload: modo clave general solo pide la clave", () => {
  assert.match(authError(AUTH_MODE_GENERAL, {}), /clave general/);
  assert.equal(authError(AUTH_MODE_GENERAL, { password: "999999" }), null);
  assert.deepEqual(credentialPayload(AUTH_MODE_GENERAL, { username: "ignorado", password: "999999" }), {
    supervisor_username: "",
    supervisor_password: "999999",
  });
});

test("canSeeWasteCost: solo con authorize_waste o view_waste_report", () => {
  assert.equal(canSeeWasteCost(perms("cancel_orderdetail", "null_orders")), false);
  assert.equal(canSeeWasteCost(perms("authorize_waste")), true);
  assert.equal(canSeeWasteCost(perms("view_waste_report")), true);
});

test("wasteModuleEnabled: activado por defecto, solo false lo apaga", () => {
  assert.equal(wasteModuleEnabled({}), true);
  assert.equal(wasteModuleEnabled({ modules: {} }), true);
  assert.equal(wasteModuleEnabled({ modules: { show_waste: true } }), true);
  assert.equal(wasteModuleEnabled({ modules: { show_waste: false } }), false);
});
