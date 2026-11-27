import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_MODE_GENERAL_PASS,
  AUTH_MODE_NONE,
  AUTH_MODE_USER_PASS,
  MODE_STOCK,
  MODE_WASTE,
  authError,
  buildCancelOrderPayload,
  buildStockCancelPayload,
  stockReasonError,
  buildRemoveDetailPayload,
  cancelAuthMode,
  cancellationErrorMessage,
  credentialPayload,
  reasonsForMode,
  resolveDestination,
  resolveDestinationForMode,
} from "./cancellation.js";

const reasons = [
  { code: "ERROR_COMANDA", description: "Error al tomar el pedido", destination: "STOCK", requires_note: false },
  { code: "PRODUCTO_MALOGRADO", description: "Producto malogrado", destination: "WASTE", requires_note: false },
  { code: "OTRO", description: "Otro", destination: "CHOICE", requires_note: true },
];
const [errorComanda, malogrado, otro] = reasons;

test("resolveDestination: el motivo fija el destino; solo OTRO acepta el elegido", () => {
  assert.equal(resolveDestination(errorComanda, "WASTE"), "STOCK");
  assert.equal(resolveDestination(malogrado, "STOCK"), "WASTE");
  assert.equal(resolveDestination(otro, "WASTE"), "WASTE");
  assert.equal(resolveDestination(otro, undefined), null);
  assert.equal(resolveDestination(null, "STOCK"), null);
});

test("cancelAuthMode: usuario+clave, clave general o sin credencial", () => {
  assert.equal(cancelAuthMode({ require_user_pass_to_null: true }), AUTH_MODE_USER_PASS);
  assert.equal(
    cancelAuthMode({ require_user_pass_to_null: false, require_general_pass_to_null: true }),
    AUTH_MODE_GENERAL_PASS
  );
  assert.equal(
    cancelAuthMode({ require_user_pass_to_null: false, require_general_pass_to_null: false }),
    AUTH_MODE_NONE
  );
  assert.equal(cancelAuthMode({}), AUTH_MODE_NONE);
  assert.equal(cancelAuthMode(undefined), AUTH_MODE_NONE);
});

test("buildCancelOrderPayload: replacement solo en merma", () => {
  const base = { reasonCode: "PRODUCTO_MALOGRADO", reasons, note: "se cayó al servir", cancelMode: MODE_WASTE };
  assert.equal(buildCancelOrderPayload({ ...base, replacement: true }).replacement, true);
  assert.equal("replacement" in buildCancelOrderPayload(base), false);
  assert.equal(
    "replacement" in buildCancelOrderPayload({ ...base, reasonCode: "ERROR_COMANDA", cancelMode: MODE_STOCK, replacement: true }),
    false
  );
});

test("authError: user_pass exige usuario y contraseña; general_pass solo la clave; none nada", () => {
  assert.match(authError(AUTH_MODE_USER_PASS, {}), /usuario y contraseña/);
  assert.match(authError(AUTH_MODE_USER_PASS, { username: "sup", password: "" }), /usuario y contraseña/);
  assert.equal(authError(AUTH_MODE_USER_PASS, { username: "sup", password: "x" }), null);
  assert.match(authError(AUTH_MODE_GENERAL_PASS, {}), /clave general/);
  assert.equal(authError(AUTH_MODE_GENERAL_PASS, { password: "999999" }), null);
  assert.equal(authError(AUTH_MODE_NONE, {}), null);
});

test("credentialPayload: payloads de cada modo", () => {
  assert.deepEqual(credentialPayload(AUTH_MODE_USER_PASS, { username: " sup ", password: "x" }), {
    username: "sup",
    pass: "x",
  });
  assert.deepEqual(credentialPayload(AUTH_MODE_GENERAL_PASS, { username: "ignorado", password: "999999" }), {
    pass: "999999",
  });
  assert.deepEqual(credentialPayload(AUTH_MODE_NONE, { username: "x", password: "y" }), {});
});

test("buildRemoveDetailPayload: user_pass envía username y pass", () => {
  const payload = buildRemoveDetailPayload({
    detailId: 7,
    quantity: 2,
    reason: errorComanda,
    note: "",
    mode: AUTH_MODE_USER_PASS,
    credentials: { username: " sup ", password: "123" },
    cancelMode: MODE_STOCK,
  });
  assert.deepEqual(payload, {
    id: 7,
    quantity: 2,
    reason_code: "ERROR_COMANDA",
    destination: "STOCK",
    null_reason: "Error al tomar el pedido",
    username: "sup",
    pass: "123",
  });
});

test("buildCancelOrderPayload: general_pass envía solo pass", () => {
  const payload = buildCancelOrderPayload({
    reasonCode: "ERROR_COMANDA",
    reasons,
    note: "",
    mode: AUTH_MODE_GENERAL_PASS,
    credentials: { username: "ignorado", password: "999999" },
    cancelMode: MODE_STOCK,
  });
  assert.deepEqual(payload, {
    reason_code: "ERROR_COMANDA",
    destination: "STOCK",
    null_reason: "Error al tomar el pedido",
    pass: "999999",
  });
});

test("buildCancelOrderPayload: none no envía credencial", () => {
  const payload = buildCancelOrderPayload({
    reasonCode: "ERROR_COMANDA",
    reasons,
    note: "",
    mode: AUTH_MODE_NONE,
    credentials: { username: "x", password: "y" },
    cancelMode: MODE_STOCK,
  });
  assert.deepEqual(payload, {
    reason_code: "ERROR_COMANDA",
    destination: "STOCK",
    null_reason: "Error al tomar el pedido",
  });
});

test("buildCancelOrderPayload: OTRO en stock se fuerza a STOCK", () => {
  const payload = buildCancelOrderPayload({
    reasonCode: "OTRO",
    reasons,
    note: " se cayó ",
    mode: AUTH_MODE_USER_PASS,
    credentials: { username: " sup ", password: "p" },
    cancelMode: MODE_STOCK,
  });
  assert.equal(payload.destination, "STOCK");
  assert.equal(payload.null_reason, "se cayó");
  assert.equal(payload.username, "sup");
});

test("cancellationErrorMessage: muestra el mensaje del backend", () => {
  assert.equal(
    cancellationErrorMessage({ response: { data: { error: "Clave general inválida" } } }),
    "Clave general inválida"
  );
  assert.equal(
    cancellationErrorMessage({ response: { data: { error: "El usuario no tiene permiso para anular." } } }),
    "El usuario no tiene permiso para anular."
  );
  assert.equal(
    cancellationErrorMessage({ response: { data: {} } }),
    "No se pudo anular. Verifique los datos e intente de nuevo."
  );
});

test("reasonsForMode: stock solo STOCK/CHOICE; waste solo WASTE/CHOICE; sin modo, todos", () => {
  assert.deepEqual(
    reasonsForMode(reasons, MODE_STOCK).map((r) => r.code),
    ["ERROR_COMANDA", "OTRO"]
  );
  assert.deepEqual(
    reasonsForMode(reasons, MODE_WASTE).map((r) => r.code),
    ["PRODUCTO_MALOGRADO", "OTRO"]
  );
  assert.deepEqual(reasonsForMode(reasons, null).map((r) => r.code), ["ERROR_COMANDA", "PRODUCTO_MALOGRADO", "OTRO"]);
});

test("resolveDestinationForMode: OTRO se fuerza a STOCK/WASTE según el modo", () => {
  assert.equal(resolveDestinationForMode(otro, null, MODE_STOCK), "STOCK");
  assert.equal(resolveDestinationForMode(otro, "WASTE", MODE_STOCK), "STOCK");
  assert.equal(resolveDestinationForMode(otro, null, MODE_WASTE), "WASTE");
  assert.equal(resolveDestinationForMode(otro, "STOCK", MODE_WASTE), "WASTE");
  // Motivos con destino fijo no cambian con el modo.
  assert.equal(resolveDestinationForMode(malogrado, null, MODE_STOCK), "WASTE");
  assert.equal(resolveDestinationForMode(errorComanda, null, MODE_WASTE), "STOCK");
  // Sin modo: comportamiento anterior.
  assert.equal(resolveDestinationForMode(otro, undefined, null), null);
  assert.equal(resolveDestinationForMode(otro, "WASTE", null), "WASTE");
});

test("buildRemoveDetailPayload: replacement viaja solo cuando se pide", () => {
  const base = {
    detailId: 7,
    quantity: 1,
    reason: malogrado,
    note: "",
    mode: AUTH_MODE_USER_PASS,
    credentials: { password: "123" },
    cancelMode: MODE_WASTE,
  };
  const withReplacement = buildRemoveDetailPayload({ ...base, replacement: true });
  assert.equal(withReplacement.replacement, true);
  assert.equal(withReplacement.destination, "WASTE");
  const without = buildRemoveDetailPayload(base);
  assert.equal("replacement" in without, false);
});

test("buildCancelOrderPayload: modo waste fuerza destino WASTE y no envía credenciales", () => {
  const payload = buildCancelOrderPayload({
    reasonCode: "OTRO",
    reasons,
    note: "se derramó",
    mode: AUTH_MODE_USER_PASS,
    credentials: { username: "sup", password: "p" },
    cancelMode: MODE_WASTE,
  });
  assert.equal(payload.destination, "WASTE");
  assert.equal(payload.null_reason, "se derramó");
  assert.equal("username" in payload, false);
  assert.equal("pass" in payload, false);
});

test("buildCancelOrderPayload: motivo fijo WASTE conserva su destino", () => {
  const payload = buildCancelOrderPayload({
    reasonCode: "PRODUCTO_MALOGRADO",
    reasons,
    note: "",
    mode: AUTH_MODE_USER_PASS,
    credentials: { password: "p" },
    cancelMode: MODE_WASTE,
  });
  assert.equal(payload.destination, "WASTE");
  assert.equal(payload.null_reason, "Producto malogrado");
  assert.equal("username" in payload, false);
  assert.equal("pass" in payload, false);
});

test("buildRemoveDetailPayload: modo waste no envía credenciales", () => {
  const payload = buildRemoveDetailPayload({
    detailId: 7,
    quantity: 1,
    reason: malogrado,
    note: "",
    mode: AUTH_MODE_USER_PASS,
    credentials: { username: "sup", password: "123" },
    cancelMode: MODE_WASTE,
  });
  assert.equal(payload.destination, "WASTE");
  assert.equal("username" in payload, false);
  assert.equal("pass" in payload, false);
});

test("buildRemoveDetailPayload: modo stock sí envía credenciales", () => {
  const payload = buildRemoveDetailPayload({
    detailId: 7,
    quantity: 1,
    reason: errorComanda,
    note: "",
    mode: AUTH_MODE_USER_PASS,
    credentials: { username: "sup", password: "123" },
    cancelMode: MODE_STOCK,
  });
  assert.equal(payload.destination, "STOCK");
  assert.equal(payload.username, "sup");
  assert.equal(payload.pass, "123");
});

test("buildStockCancelPayload: texto libre y credencial según Ajustes", () => {
  assert.deepEqual(buildStockCancelPayload({ reasonText: "  Se equivocó  ", mode: "general_pass", credentials: { password: "123" } }), {
    null_reason: "Se equivocó",
    pass: "123",
  });
  assert.deepEqual(
    buildStockCancelPayload({ reasonText: "", mode: "user_pass", credentials: { username: " admin ", password: "x" } }),
    { null_reason: null, username: "admin", pass: "x" }
  );
  assert.deepEqual(buildStockCancelPayload({ reasonText: "ok", mode: "none" }), { null_reason: "ok" });
});

test("stockReasonError: el motivo solo es obligatorio si Ajustes lo pide", () => {
  assert.equal(stockReasonError({ required_null_reason: false }, ""), null);
  assert.match(stockReasonError({ required_null_reason: true }, "  "), /motivo/);
  assert.equal(stockReasonError({ required_null_reason: true }, "cliente se fue"), null);
});
