import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import {
  createContractState,
  parseMinContract,
  isIncompatible,
  isUnsupportedResponse,
  CLIENT_CONTRACT_HEADER,
} from "./clientContract.js";

const res = (status, headers = {}, data = {}) => ({ status, headers, data });

test("parseMinContract: enteros ≥ 0; el resto es null", () => {
  assert.equal(parseMinContract("0"), 0);
  assert.equal(parseMinContract(" 3 "), 3);
  for (const raw of [undefined, null, "", "x", "-1", "1.5"]) assert.equal(parseMinContract(raw), null, String(raw));
});

test("con un backend anterior (sin anuncio) nunca se envía el header", () => {
  const c = createContractState(1);
  assert.deepEqual(c.requestHeaders(), {});
  c.noteResponse(res(200, { "content-type": "application/json" }));
  assert.deepEqual(c.requestHeaders(), {});
});

test("después del anuncio del backend se envía el contrato", () => {
  const c = createContractState(1);
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "0" }));
  assert.deepEqual(c.requestHeaders(), { [CLIENT_CONTRACT_HEADER]: "1" });
  assert.deepEqual(c.snapshot(), { backendSupports: true, backendMin: 0, rejected: false });
});

test("lee el anuncio desde AxiosHeaders real (mayúsculas indistintas)", () => {
  const c = createContractState(1);
  c.noteResponse(res(200, new axios.AxiosHeaders({ "X-Flizzy-Min-Client-Contract": "2" })));
  assert.equal(c.snapshot().backendMin, 2);
});

test("si una respuesta llega sin anuncio (backend revertido), deja de enviarlo enseguida", () => {
  const c = createContractState(1);
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "0" }));
  c.noteResponse(res(200, {}));
  assert.deepEqual(c.requestHeaders(), {});
});

test("sin respuesta (red caída) no cambia lo que se sabe", () => {
  const c = createContractState(1);
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "0" }));
  c.noteResponse(undefined);
  assert.equal(c.snapshot().backendSupports, true);
});

test("CA02: el rechazo 409 CLIENT_VERSION_UNSUPPORTED queda registrado", () => {
  const c = createContractState(1);
  c.noteResponse(res(409, { "x-flizzy-min-client-contract": "2" }, { code: "CLIENT_VERSION_UNSUPPORTED" }));
  assert.deepEqual(c.snapshot(), { backendSupports: true, backendMin: 2, rejected: true });
});

test("si el mínimo vuelve a ser compatible, se olvida el rechazo", () => {
  const c = createContractState(1);
  c.noteResponse(res(409, { "x-flizzy-min-client-contract": "2" }, { code: "CLIENT_VERSION_UNSUPPORTED" }));
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "1" }));
  assert.equal(c.snapshot().rejected, false);
});

test("CA04: una sesión vencida (401) u otro 409 no son incompatibilidad", () => {
  assert.equal(isUnsupportedResponse(res(401, {}, { code: "token_not_valid" })), false);
  assert.equal(isUnsupportedResponse(res(409, {}, { detail: "Mesa ocupada" })), false);
  assert.equal(isUnsupportedResponse(res(409, {}, { code: "CLIENT_VERSION_UNSUPPORTED" })), true);
  assert.equal(isUnsupportedResponse(undefined), false);
});

test("isIncompatible: por el backend o por la versión publicada de la web", () => {
  assert.equal(isIncompatible({ clientContract: 1, backendMin: 0, manifestMin: 1 }), false);
  assert.equal(isIncompatible({ clientContract: 1, backendMin: 1, manifestMin: null }), false);
  assert.equal(isIncompatible({ clientContract: 1, backendMin: 2, manifestMin: null }), true);
  assert.equal(isIncompatible({ clientContract: 1, backendMin: null, manifestMin: 2 }), true);
  assert.equal(isIncompatible({ clientContract: 2, backendMin: null, manifestMin: null }), false);
});

test("los oyentes se enteran solo cuando algo cambia", () => {
  const c = createContractState(1);
  let calls = 0;
  c.subscribe(() => {
    calls += 1;
  });
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "0" }));
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "0" }));
  c.noteResponse(res(200, { "x-flizzy-min-client-contract": "2" }));
  assert.equal(calls, 2);
});
