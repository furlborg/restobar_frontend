// Plugin de build: identidad de versión de la web (HU-FLZ-ACT-002).
//
// Al terminar `vite build`:
//   1. Calcula release_id con el index.html final (nombra los .js/.css con hash de contenido).
//   2. Inyecta <meta name="flizzy-release" content="<release_id>"> en ese index.html.
//   3. Escribe dist/app-version.json, el último archivo del build.
//
// deployment_id y published_at se generan en cada build: en Flizzy cada publicación
// compila de nuevo, así que build = activación. Un rollback (compilar un commit anterior)
// produce el release_id anterior con un deployment_id nuevo, como pide la HU.
//
// Solo corre en `vite build`; en `vite dev` no hay manifiesto ni <meta>.

import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import {
  RELEASE_META_NAME,
  READY_STATUS,
  SUPPORTED_SCHEMA_VERSION,
  VERSION_MANIFEST_FILE,
  isOpaqueId,
} from "../src/utils/appVersion.js";

const META_RE = new RegExp(`[ \\t]*<meta name="${RELEASE_META_NAME}" content="[^"]*">\\r?\\n?`, "g");

/** Quita el <meta> de versión, para que el cálculo no dependa de él. */
export const stripReleaseMeta = (html) => html.replace(META_RE, "");

/** release_id: 16 caracteres hex del sha256 del index.html sin el <meta> de versión. */
export const computeReleaseId = (html) =>
  createHash("sha256").update(stripReleaseMeta(html)).digest("hex").slice(0, 16);

/** Inserta (o reemplaza) el <meta> de versión justo antes de </head>. */
export const injectReleaseMeta = (html, releaseId) => {
  if (!isOpaqueId(releaseId)) throw new Error(`release_id inválido: ${releaseId}`);
  const clean = stripReleaseMeta(html);
  const idx = clean.indexOf("</head>");
  if (idx === -1) throw new Error("index.html no tiene </head>: no se puede marcar la versión");
  return `${clean.slice(0, idx)}  <meta name="${RELEASE_META_NAME}" content="${releaseId}">\n${clean.slice(idx)}`;
};

/** deployment_id: fecha UTC (AAAAMMDDhhmmss) + 6 hex aleatorios. */
export const createDeploymentId = (now = new Date(), random = randomBytes(3).toString("hex")) =>
  `${now.toISOString().replace(/[-:T]/g, "").slice(0, 14)}-${random}`;

export const buildManifest = ({ releaseId, deploymentId, publishedAt, minSupportedClientContract }) => ({
  schema_version: SUPPORTED_SCHEMA_VERSION,
  release_id: releaseId,
  deployment_id: deploymentId,
  published_at: publishedAt,
  min_supported_client_contract: minSupportedClientContract,
  status: READY_STATUS,
});

/** Falla el build si los números de contrato no tienen sentido. */
export const assertValidContract = ({ clientContract, minSupportedClientContract }) => {
  if (!Number.isInteger(clientContract) || clientContract < 1) {
    throw new Error(`CLIENT_CONTRACT_VERSION debe ser un entero >= 1 (vale ${clientContract})`);
  }
  if (!Number.isInteger(minSupportedClientContract) || minSupportedClientContract < 0) {
    throw new Error(`MIN_SUPPORTED_CLIENT_CONTRACT debe ser un entero >= 0 (vale ${minSupportedClientContract})`);
  }
  if (minSupportedClientContract > clientContract) {
    throw new Error(
      `MIN_SUPPORTED_CLIENT_CONTRACT (${minSupportedClientContract}) no puede ser mayor que CLIENT_CONTRACT_VERSION (${clientContract}): esta misma web quedaría sin soporte`
    );
  }
};

/** Escribe en un temporal y lo renombra: nadie lee un archivo a medio escribir. */
const writeAtomic = async (filePath, content) => {
  const tmp = path.join(path.dirname(filePath), `.${path.basename(filePath)}.tmp`);
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
};

export default function versionManifest({ clientContract, minSupportedClientContract }) {
  return {
    name: "flizzy-version-manifest",
    apply: "build",
    configResolved() {
      assertValidContract({ clientContract, minSupportedClientContract });
    },
    async writeBundle(options, bundle) {
      if (!bundle["index.html"] || !options.dir) return;

      const htmlPath = path.join(options.dir, "index.html");
      const html = await readFile(htmlPath, "utf8");
      const releaseId = computeReleaseId(html);
      await writeAtomic(htmlPath, injectReleaseMeta(html, releaseId));

      const manifest = buildManifest({
        releaseId,
        deploymentId: createDeploymentId(),
        publishedAt: new Date().toISOString(),
        minSupportedClientContract,
      });
      await writeAtomic(path.join(options.dir, VERSION_MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);

      console.log(`\n[flizzy] versión ${releaseId} · publicación ${manifest.deployment_id} → ${VERSION_MANIFEST_FILE}`);
    },
  };
}
