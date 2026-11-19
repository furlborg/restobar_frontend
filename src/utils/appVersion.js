// Identidad de la versión publicada de la web (HU-FLZ-ACT-002).
// Puro, sin Vue ni DOM global, para poder probarlo con `node --test`.
// Lo usa el navegador (detector, HU-FLZ-ACT-004) y también el build (vite-plugins/version-manifest.mjs).
//
// Cómo funciona:
// - En cada build se calcula `release_id` a partir del index.html final, que nombra los
//   archivos con hash. Mismo contenido => mismo id; cualquier cambio de código => id distinto.
// - Ese id queda en el index.html como <meta name="flizzy-release"> (la versión que tiene
//   cargada esta pestaña) y en /app-version.json (la versión publicada en el servidor).
// - Si los dos difieren y el manifiesto está "ready", hay una versión nueva para ofrecer.
//   Se compara por igualdad, nunca por fecha ni por orden: un rollback también es un cambio.

export const VERSION_MANIFEST_FILE = "app-version.json";
export const VERSION_MANIFEST_PATH = `/${VERSION_MANIFEST_FILE}`;
export const RELEASE_META_NAME = "flizzy-release";
export const SUPPORTED_SCHEMA_VERSION = 1;
export const READY_STATUS = "ready";

const ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

/** Cadena opaca válida como release_id o deployment_id. */
export const isOpaqueId = (value) => typeof value === "string" && ID_RE.test(value);

const fail = (reason) => ({ ok: false, reason });

/**
 * Valida la respuesta de /app-version.json.
 * Acepta el texto de la respuesta o un objeto ya parseado.
 * Devuelve { ok: true, manifest } o { ok: false, reason }.
 * Una respuesta inválida (HTML del login, JSON roto, campos faltantes, esquema desconocido)
 * nunca debe provocar una actualización: el llamador la trata como "comprobación fallida".
 */
export const parseVersionManifest = (input) => {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return fail("not_json");
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return fail("not_object");

  if (!Number.isInteger(data.schema_version)) return fail("missing_schema_version");
  if (data.schema_version !== SUPPORTED_SCHEMA_VERSION) return fail("unsupported_schema");

  if (!isOpaqueId(data.release_id)) return fail("invalid_release_id");
  if (!isOpaqueId(data.deployment_id)) return fail("invalid_deployment_id");

  if (typeof data.published_at !== "string" || !Number.isFinite(Date.parse(data.published_at))) {
    return fail("invalid_published_at");
  }

  const minContract = data.min_supported_client_contract;
  if (!Number.isInteger(minContract) || minContract < 0) {
    return fail("invalid_min_supported_client_contract");
  }

  if (typeof data.status !== "string" || data.status === "") return fail("invalid_status");

  return {
    ok: true,
    manifest: {
      schemaVersion: data.schema_version,
      releaseId: data.release_id,
      deploymentId: data.deployment_id,
      publishedAt: data.published_at,
      minSupportedClientContract: minContract,
      status: data.status,
    },
  };
};

/**
 * release_id con el que arrancó esta pestaña, leído del <meta> que inyecta el build.
 * Devuelve null en desarrollo (vite dev no lo inyecta) o si falta: sin identidad no se ofrece nada.
 */
export const readCurrentReleaseId = (doc) => {
  const el = doc?.querySelector?.(`meta[name="${RELEASE_META_NAME}"]`);
  const id = el?.getAttribute?.("content");
  return isOpaqueId(id) ? id : null;
};

/**
 * ¿El manifiesto validado ofrece una versión distinta a la cargada?
 * Solo "ready" habilita ofrecerla; cualquier otro estado se ignora.
 */
export const isUpdateCandidate = (manifest, currentReleaseId) =>
  Boolean(
    manifest &&
      isOpaqueId(currentReleaseId) &&
      manifest.status === READY_STATUS &&
      manifest.releaseId !== currentReleaseId
  );
