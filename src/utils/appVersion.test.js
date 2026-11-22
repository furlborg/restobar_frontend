import test from "node:test";
import assert from "node:assert/strict";
import {
  parseVersionManifest,
  readCurrentReleaseId,
  isUpdateCandidate,
  isOpaqueId,
  VERSION_MANIFEST_PATH,
} from "./appVersion.js";

const valid = () => ({
  schema_version: 1,
  release_id: "a1b2c3d4e5f60718",
  deployment_id: "20261114153000-9f3a2c",
  published_at: "2026-11-14T15:30:00.000Z",
  min_supported_client_contract: 1,
  status: "ready",
});

const fakeDoc = (content) => ({
  querySelector: (sel) =>
    sel === 'meta[name="flizzy-release"]' && content !== undefined ? { getAttribute: () => content } : null,
});

// ---- Manifiesto válido ----
test("parseVersionManifest: acepta un manifiesto completo, como texto o como objeto", () => {
  const expected = {
    schemaVersion: 1,
    releaseId: "a1b2c3d4e5f60718",
    deploymentId: "20261114153000-9f3a2c",
    publishedAt: "2026-11-14T15:30:00.000Z",
    minSupportedClientContract: 1,
    status: "ready",
  };
  assert.deepEqual(parseVersionManifest(JSON.stringify(valid())), { ok: true, manifest: expected });
  assert.deepEqual(parseVersionManifest(valid()), { ok: true, manifest: expected });
});

test("parseVersionManifest: ignora campos desconocidos (compatibilidad hacia adelante)", () => {
  const r = parseVersionManifest({ ...valid(), changelog: "x" });
  assert.equal(r.ok, true);
  assert.equal("changelog" in r.manifest, false);
});

test("la ruta del manifiesto es /app-version.json", () => {
  assert.equal(VERSION_MANIFEST_PATH, "/app-version.json");
});

// ---- CA02: respuestas inválidas nunca habilitan una actualización ----
test("parseVersionManifest: JSON roto", () => {
  assert.deepEqual(parseVersionManifest('{"schema_version": 1,'), { ok: false, reason: "not_json" });
});

test("parseVersionManifest: el servidor devuelve la página de inicio o del login (HTML)", () => {
  const html = '<!DOCTYPE html><html lang="es"><head><title>Flizzy</title></head><body><div id="app"></div></body></html>';
  assert.deepEqual(parseVersionManifest(html), { ok: false, reason: "not_json" });
});

test("parseVersionManifest: null, arreglo o número no son un manifiesto", () => {
  assert.equal(parseVersionManifest(null).ok, false);
  assert.equal(parseVersionManifest("null").ok, false);
  assert.equal(parseVersionManifest("[]").ok, false);
  assert.equal(parseVersionManifest("42").ok, false);
  assert.equal(parseVersionManifest(undefined).ok, false);
});

test("parseVersionManifest: cada campo obligatorio omitido se rechaza", () => {
  const reasons = {
    schema_version: "missing_schema_version",
    release_id: "invalid_release_id",
    deployment_id: "invalid_deployment_id",
    published_at: "invalid_published_at",
    min_supported_client_contract: "invalid_min_supported_client_contract",
    status: "invalid_status",
  };
  for (const [field, reason] of Object.entries(reasons)) {
    const m = valid();
    delete m[field];
    assert.deepEqual(parseVersionManifest(m), { ok: false, reason }, `sin ${field}`);
  }
});

test("parseVersionManifest: esquema desconocido o de otro tipo", () => {
  assert.deepEqual(parseVersionManifest({ ...valid(), schema_version: 2 }), { ok: false, reason: "unsupported_schema" });
  assert.deepEqual(parseVersionManifest({ ...valid(), schema_version: "1" }), { ok: false, reason: "missing_schema_version" });
  assert.deepEqual(parseVersionManifest({ ...valid(), schema_version: 1.5 }), { ok: false, reason: "missing_schema_version" });
});

test("parseVersionManifest: contrato negativo, decimal o texto", () => {
  for (const bad of [-1, 1.5, "1", null]) {
    assert.deepEqual(
      parseVersionManifest({ ...valid(), min_supported_client_contract: bad }),
      { ok: false, reason: "invalid_min_supported_client_contract" },
      String(bad)
    );
  }
  assert.equal(parseVersionManifest({ ...valid(), min_supported_client_contract: 0 }).ok, true);
});

test("parseVersionManifest: ids vacíos, con espacios, con caracteres raros o demasiado largos", () => {
  for (const bad of ["", "con espacio", "<script>", "a".repeat(129), 123]) {
    assert.equal(parseVersionManifest({ ...valid(), release_id: bad }).ok, false, `release_id ${bad}`);
    assert.equal(parseVersionManifest({ ...valid(), deployment_id: bad }).ok, false, `deployment_id ${bad}`);
  }
});

test("parseVersionManifest: fecha ilegible o estado vacío", () => {
  assert.equal(parseVersionManifest({ ...valid(), published_at: "ayer" }).ok, false);
  assert.equal(parseVersionManifest({ ...valid(), published_at: 1731598200000 }).ok, false);
  assert.equal(parseVersionManifest({ ...valid(), status: "" }).ok, false);
  assert.equal(parseVersionManifest({ ...valid(), status: 1 }).ok, false);
});

// ---- Identidad de la pestaña ----
test("readCurrentReleaseId: lee el <meta> que inyecta el build", () => {
  assert.equal(readCurrentReleaseId(fakeDoc("a1b2c3d4e5f60718")), "a1b2c3d4e5f60718");
});

test("readCurrentReleaseId: sin <meta> (vite dev) o con valor inválido devuelve null", () => {
  assert.equal(readCurrentReleaseId(fakeDoc(undefined)), null);
  assert.equal(readCurrentReleaseId(fakeDoc("")), null);
  assert.equal(readCurrentReleaseId(fakeDoc("x y")), null);
  assert.equal(readCurrentReleaseId(undefined), null);
  assert.equal(readCurrentReleaseId({}), null);
});

// ---- ¿Hay versión para ofrecer? ----
test("isUpdateCandidate: misma versión no ofrece nada", () => {
  const { manifest } = parseVersionManifest(valid());
  assert.equal(isUpdateCandidate(manifest, "a1b2c3d4e5f60718"), false);
});

test("isUpdateCandidate: versión distinta y ready se ofrece", () => {
  const { manifest } = parseVersionManifest(valid());
  assert.equal(isUpdateCandidate(manifest, "ffffffffffffffff"), true);
});

test("isUpdateCandidate (CA04): un rollback a una versión de fecha anterior también se reconoce", () => {
  const { manifest } = parseVersionManifest({ ...valid(), release_id: "0000aaaa0000aaaa", published_at: "2020-01-01T00:00:00Z" });
  assert.equal(isUpdateCandidate(manifest, "a1b2c3d4e5f60718"), true);
});

test("isUpdateCandidate: estados distintos de ready no se ofrecen", () => {
  for (const status of ["pending", "draft", "READY"]) {
    const { manifest } = parseVersionManifest({ ...valid(), status });
    assert.equal(isUpdateCandidate(manifest, "ffffffffffffffff"), false, status);
  }
});

test("isUpdateCandidate: sin identidad propia (dev) o sin manifiesto no se ofrece nada", () => {
  const { manifest } = parseVersionManifest(valid());
  assert.equal(isUpdateCandidate(manifest, null), false);
  assert.equal(isUpdateCandidate(null, "ffffffffffffffff"), false);
});

test("isOpaqueId: acepta hex, guiones, puntos y guion bajo", () => {
  assert.equal(isOpaqueId("20261114153000-9f3a2c"), true);
  assert.equal(isOpaqueId("v1.2_rc"), true);
  assert.equal(isOpaqueId("a/b"), false);
});
