import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import versionManifest, {
  computeReleaseId,
  injectReleaseMeta,
  stripReleaseMeta,
  createDeploymentId,
  buildManifest,
  assertValidContract,
} from "./version-manifest.mjs";
import { parseVersionManifest, readCurrentReleaseId } from "../src/utils/appVersion.js";

const htmlFor = (entry) => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Flizzy</title>
  <script type="module" crossorigin src="/assets/${entry}.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-D8c0evQ8.css">
</head>
<body>
<div id="app"></div>
</body>
</html>
`;

const metaOf = (html) => html.match(/<meta name="flizzy-release" content="([^"]*)">/)?.[1];
const docOf = (html) => ({
  querySelector: () => {
    const v = metaOf(html);
    return v === undefined ? null : { getAttribute: () => v };
  },
});

// ---- release_id ----
test("computeReleaseId: mismo index.html, mismo id (16 hex)", () => {
  const a = computeReleaseId(htmlFor("index-AAA"));
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.equal(computeReleaseId(htmlFor("index-AAA")), a);
});

test("computeReleaseId: si cambia un archivo con hash, cambia el id", () => {
  assert.notEqual(computeReleaseId(htmlFor("index-AAA")), computeReleaseId(htmlFor("index-BBB")));
});

test("computeReleaseId: no depende del <meta> de versión ya inyectado", () => {
  const html = htmlFor("index-AAA");
  const id = computeReleaseId(html);
  assert.equal(computeReleaseId(injectReleaseMeta(html, id)), id);
});

// ---- <meta> ----
test("injectReleaseMeta: inserta el <meta> antes de </head> y deja el resto igual", () => {
  const html = htmlFor("index-AAA");
  const out = injectReleaseMeta(html, "a1b2c3d4e5f60718");
  assert.equal(metaOf(out), "a1b2c3d4e5f60718");
  assert.ok(out.indexOf('name="flizzy-release"') < out.indexOf("</head>"));
  assert.equal(stripReleaseMeta(out), html);
});

test("injectReleaseMeta: inyectar dos veces deja un solo <meta>", () => {
  const once = injectReleaseMeta(htmlFor("index-AAA"), "1111111111111111");
  const twice = injectReleaseMeta(once, "2222222222222222");
  assert.equal(twice.match(/flizzy-release/g).length, 1);
  assert.equal(metaOf(twice), "2222222222222222");
});

test("injectReleaseMeta: falla si no hay </head> o si el id es inválido", () => {
  assert.throws(() => injectReleaseMeta("<html><body></body></html>", "a1b2c3d4e5f60718"), /<\/head>/);
  assert.throws(() => injectReleaseMeta(htmlFor("x"), 'a" onload="x'), /inválido/);
});

// ---- deployment_id y manifiesto ----
test("createDeploymentId: fecha UTC + aleatorio", () => {
  assert.equal(createDeploymentId(new Date("2026-11-14T15:30:05.123Z"), "9f3a2c"), "20261114153005-9f3a2c");
  assert.match(createDeploymentId(), /^\d{14}-[0-9a-f]{6}$/);
  assert.notEqual(createDeploymentId(), createDeploymentId());
});

test("buildManifest: lo que genera el build pasa la validación del navegador", () => {
  const m = buildManifest({
    releaseId: "a1b2c3d4e5f60718",
    deploymentId: "20261114153005-9f3a2c",
    publishedAt: "2026-11-14T15:30:05.123Z",
    minSupportedClientContract: 1,
  });
  const r = parseVersionManifest(JSON.stringify(m));
  assert.equal(r.ok, true);
  assert.equal(r.manifest.status, "ready");
  assert.equal(r.manifest.schemaVersion, 1);
});

// ---- Contrato ----
test("assertValidContract: valores coherentes pasan", () => {
  assert.doesNotThrow(() => assertValidContract({ clientContract: 1, minSupportedClientContract: 1 }));
  assert.doesNotThrow(() => assertValidContract({ clientContract: 3, minSupportedClientContract: 0 }));
});

test("assertValidContract: mínimo mayor que el propio contrato, negativos o decimales fallan", () => {
  assert.throws(() => assertValidContract({ clientContract: 1, minSupportedClientContract: 2 }), /no puede ser mayor/);
  assert.throws(() => assertValidContract({ clientContract: 0, minSupportedClientContract: 0 }));
  assert.throws(() => assertValidContract({ clientContract: 1.5, minSupportedClientContract: 1 }));
  assert.throws(() => assertValidContract({ clientContract: 1, minSupportedClientContract: -1 }));
});

// ---- Plugin completo sobre una carpeta dist de prueba ----
const runBuild = async (dir, entry) => {
  await writeFile(path.join(dir, "index.html"), htmlFor(entry));
  const plugin = versionManifest({ clientContract: 1, minSupportedClientContract: 1 });
  plugin.configResolved();
  const log = console.log;
  console.log = () => {};
  try {
    await plugin.writeBundle({ dir }, { "index.html": {} });
  } finally {
    console.log = log;
  }
  const html = await readFile(path.join(dir, "index.html"), "utf8");
  const manifest = parseVersionManifest(await readFile(path.join(dir, "app-version.json"), "utf8"));
  return { html, manifest };
};

test("plugin (CA01): el release_id del index.html coincide con el del manifiesto", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "flizzy-dist-"));
  try {
    const { html, manifest } = await runBuild(dir, "index-AAA");
    assert.equal(manifest.ok, true);
    assert.equal(readCurrentReleaseId(docOf(html)), manifest.manifest.releaseId);
    assert.deepEqual((await readdir(dir)).sort(), ["app-version.json", "index.html"], "sin temporales sueltos");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin (rollback A → B → A): dos artefactos, tres publicaciones", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "flizzy-dist-"));
  try {
    const a1 = (await runBuild(dir, "index-AAA")).manifest.manifest;
    const b = (await runBuild(dir, "index-BBB")).manifest.manifest;
    const a2 = (await runBuild(dir, "index-AAA")).manifest.manifest;
    assert.equal(a1.releaseId, a2.releaseId);
    assert.notEqual(a1.releaseId, b.releaseId);
    assert.equal(new Set([a1.deploymentId, b.deploymentId, a2.deploymentId]).size, 3);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin: no hace nada si el build no tiene index.html", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "flizzy-dist-"));
  try {
    const plugin = versionManifest({ clientContract: 1, minSupportedClientContract: 1 });
    await plugin.writeBundle({ dir }, {});
    assert.deepEqual(await readdir(dir), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin: con un contrato incoherente el build falla al arrancar", () => {
  const plugin = versionManifest({ clientContract: 1, minSupportedClientContract: 2 });
  assert.throws(() => plugin.configResolved(), /no puede ser mayor/);
});
