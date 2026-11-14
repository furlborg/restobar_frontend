// Conexión del detector de versiones con el navegador (HU-FLZ-ACT-004).
// La lógica está en src/utils/versionDetector.js; aquí solo se le dan fetch, timers y eventos.
//
// - Una sola instancia por pestaña: startUpdateDetector() repetido devuelve la misma.
// - En `vite dev` no hay <meta name="flizzy-release"> y el detector no arranca.
// - Consulta /app-version.json del mismo dominio que sirve la web, no la API:
//   sin token, sin interceptores de axios y sin avisos de error en pantalla.

import { readonly, shallowRef } from "vue";
import { createVersionDetector } from "@/utils/versionDetector";
import { readCurrentReleaseId, VERSION_MANIFEST_FILE } from "@/utils/appVersion";

const state = shallowRef(null);
let detector = null;

/** Estado reactivo del detector (null si no arrancó). Lo consume el aviso de HU-FLZ-ACT-005. */
export const updateState = readonly(state);

/** Instancia activa, para revalidar antes de aplicar (HU-FLZ-ACT-007). */
export const getUpdateDetector = () => detector;

const manifestUrl = () => `${import.meta.env.BASE_URL || "/"}${VERSION_MANIFEST_FILE}`;

const fetchText = async ({ signal }) => {
  // El parámetro t evita copias intermedias mientras el servidor no mande no-store (HU-FLZ-ACT-003).
  const res = await fetch(`${manifestUrl()}?t=${Date.now()}`, {
    cache: "no-store",
    credentials: "omit",
    headers: { Accept: "application/json" },
    signal,
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
};

export const startUpdateDetector = () => {
  if (detector) return detector;

  const currentReleaseId = readCurrentReleaseId(document);
  if (!currentReleaseId) return null;

  detector = createVersionDetector({
    currentReleaseId,
    fetchText,
    isVisible: () => document.visibilityState === "visible",
    isOnline: () => navigator.onLine !== false,
    setTimer: (fn, ms) => window.setTimeout(fn, ms),
    clearTimer: (handle) => window.clearTimeout(handle),
    now: () => Date.now(),
    random: Math.random,
  });

  state.value = detector.getState();
  detector.subscribe((next) => {
    state.value = next;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") detector.notifyVisible();
  });
  window.addEventListener("focus", () => detector.notifyVisible());
  window.addEventListener("online", () => detector.notifyOnline());

  detector.start();
  return detector;
};
