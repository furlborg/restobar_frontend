// Vigilancia de escrituras con axios real (HU-FLZ-ACT-006).
// Reproduce el orden de interceptores de src/api/index.js con un adaptador falso:
// respuestas, errores del servidor, cortes de red, cancelaciones y el reintento por token vencido.
import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { createUpdateBarrier, createHttpWriteTracker, BARRIER_REASON as R } from "./updateBarrier.js";

const makeClient = (respond) => {
  const barrier = createUpdateBarrier();
  const tracker = createHttpWriteTracker(barrier);
  const seen = [];
  const client = axios.create({
    baseURL: "https://demo.example/api/v1/",
    adapter: async (config) => {
      seen.push({ method: config.method, url: config.url, during: barrier.evaluate() });
      return respond(config, seen.length);
    },
  });
  client.interceptors.request.use((request) => tracker.onRequest(request));
  client.interceptors.response.use(
    (response) => tracker.onResponse(response),
    async (error) => {
      tracker.onError(error);
      // Igual que src/api/index.js: con token vencido se reintenta la misma petición.
      if (error.response?.status === 401 && error.response.data?.code === "token_not_valid") {
        return client(error.config);
      }
      return Promise.reject(error);
    }
  );
  return { client, barrier, seen };
};

const ok = (config, data = {}) => ({ data, status: 200, statusText: "OK", headers: {}, config });
const serverError = (config, status, data = {}) => {
  const response = { data, status, statusText: "ERR", headers: {}, config };
  throw new axios.AxiosError(`HTTP ${status}`, "ERR_BAD_RESPONSE", config, {}, response);
};
const networkError = (config) => {
  throw new axios.AxiosError("Network Error", "ERR_NETWORK", config, {});
};

test("una venta bloquea mientras espera y libera al responder 2xx", async () => {
  const { client, barrier, seen } = makeClient((config) => ok(config));
  await client.post("sales/", { total: 10 });
  assert.deepEqual(seen[0].during, { ok: false, reason: R.PAYMENT });
  assert.deepEqual(barrier.evaluate(), { ok: true });
});

test("un pedido bloquea con 'saving' mientras espera", async () => {
  const { client, barrier, seen } = makeClient((config) => ok(config));
  await client.patch("orders/12/", {});
  assert.deepEqual(seen[0].during, { ok: false, reason: R.SAVING });
  assert.deepEqual(barrier.evaluate(), { ok: true });
});

test("las lecturas no bloquean", async () => {
  const { client, seen } = makeClient((config) => ok(config));
  await client.get("sales/");
  assert.deepEqual(seen[0].during, { ok: true });
});

test("un error con respuesta del servidor (400/500) es un resultado conocido: libera", async () => {
  const { client, barrier } = makeClient((config) => serverError(config, 500));
  await assert.rejects(client.post("sales/", {}));
  assert.deepEqual(barrier.evaluate(), { ok: true });
});

test("CA02: una venta sin respuesta (red caída) queda incierta y bloquea", async () => {
  const { client, barrier } = makeClient((config) => networkError(config));
  await assert.rejects(client.post("sales/", {}));
  assert.deepEqual(barrier.evaluate(), { ok: false, reason: R.UNCERTAIN });
});

test("no se repite la escritura para comprobarla: una sola llamada al servidor", async () => {
  const { client, seen } = makeClient((config) => networkError(config));
  await assert.rejects(client.post("sales/", {}));
  assert.equal(seen.length, 1);
});

test("una escritura cancelada queda incierta (pudo llegar al servidor)", async () => {
  const controller = new AbortController();
  const { client, barrier } = makeClient(
    (config) =>
      new Promise((_, reject) => {
        config.signal.addEventListener("abort", () => reject(new axios.CanceledError("cancelada", config)));
      })
  );
  const p = client.post("orders/take_away/", {}, { signal: controller.signal });
  controller.abort();
  await assert.rejects(p);
  assert.deepEqual(barrier.evaluate(), { ok: false, reason: R.UNCERTAIN });
});

test("token vencido: la primera se cierra y el reintento se vigila aparte; al final libera", async () => {
  const { client, barrier, seen } = makeClient((config, n) =>
    n === 1 ? serverError(config, 401, { code: "token_not_valid" }) : ok(config)
  );
  await client.post("sales/", {});
  assert.equal(seen.length, 2);
  assert.deepEqual(seen[1].during, { ok: false, reason: R.PAYMENT }, "el reintento también bloquea mientras espera");
  assert.deepEqual(barrier.evaluate(), { ok: true });
  assert.deepEqual(barrier.snapshot(), { inFlight: 0, uncertain: 0, blockers: 0 });
});

test("login, logout y bloqueos de mesa no se vigilan", async () => {
  const { client, barrier, seen } = makeClient((config) => networkError(config));
  await assert.rejects(client.post("login/", {}));
  await assert.rejects(client.post("table-locks/release_my_locks/", {}));
  assert.deepEqual(seen.map((s) => s.during), [{ ok: true }, { ok: true }]);
  assert.deepEqual(barrier.evaluate(), { ok: true });
});

test("varias escrituras a la vez: bloquea hasta que terminan todas", async () => {
  const releases = [];
  const { client, barrier } = makeClient((config) => new Promise((resolve) => releases.push(() => resolve(ok(config)))));
  const a = client.post("sales/", {});
  const b = client.post("products/", {});
  await new Promise((r) => setImmediate(r));
  assert.equal(barrier.evaluate().reason, R.PAYMENT);
  releases[0]();
  await a;
  assert.equal(barrier.evaluate().reason, R.SAVING);
  releases[1]();
  await b;
  assert.deepEqual(barrier.evaluate(), { ok: true });
});
