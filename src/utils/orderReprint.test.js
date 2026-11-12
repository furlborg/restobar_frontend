import test from "node:test";
import assert from "node:assert/strict";
import { detailsForReprint } from "./orderReprint.js";

const qtys = (order) => detailsForReprint(order).map((d) => [d.product ?? d.product_set?.name, d.initial_quantity]);

test("pedido 4 unidades, se anula 1 y aún no se cobra → imprime 3", () => {
  const order = {
    order_details: [{ product: 1, quantity: 3, initial_quantity: 4 }],
    order_canceleddetails: [{ product: 1, quantity: 1 }],
  };
  assert.deepEqual(qtys(order), [[1, 3]]);
});

test("mismo caso pero ya cobrado (quantity 0) → imprime 3, no sale en blanco", () => {
  const order = {
    order_details: [{ product: 1, quantity: 0, initial_quantity: 4 }],
    order_canceleddetails: [{ product: 1, quantity: 1 }],
  };
  assert.deepEqual(qtys(order), [[1, 3]]);
});

test("mesa cobrada sin anulaciones → imprime lo pedido", () => {
  const order = {
    order_details: [
      { product: 1, quantity: 0, initial_quantity: 1 },
      { product: 2, quantity: 0, initial_quantity: 2 },
    ],
    order_canceleddetails: [],
  };
  assert.deepEqual(qtys(order), [[1, 1], [2, 2]]);
});

test("anulado total (línea borrada) no descuenta de otros productos", () => {
  const order = {
    order_details: [{ product: 1, quantity: 0, initial_quantity: 1 }],
    order_canceleddetails: [{ product: 3, quantity: 1 }],
  };
  assert.deepEqual(qtys(order), [[1, 1]]);
});

test("combo anulado parcialmente se empareja por nombre", () => {
  const order = {
    order_details: [{ product: null, product_set: { name: "COMBO POLLITO" }, quantity: 0, initial_quantity: 2 }],
    order_canceleddetails: [{ product: null, product_name: "COMBO POLLITO", quantity: 1 }],
  };
  assert.deepEqual(qtys(order), [["COMBO POLLITO", 1]]);
});

test("nunca imprime menos de lo que falta cobrar", () => {
  const order = {
    order_details: [{ product: 1, quantity: 2, initial_quantity: 2 }],
    order_canceleddetails: [{ product: 1, quantity: 5 }],
  };
  assert.deepEqual(qtys(order), [[1, 2]]);
});
