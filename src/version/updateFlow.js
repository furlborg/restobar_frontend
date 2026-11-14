// Estado compartido del aviso de actualización (HU-FLZ-ACT-005).
// Une el detector (HU-FLZ-ACT-004), el coordinador y la posposición, y lo expone a la tarjeta
// (src/components/Update/UpdateNotice.vue) y al ícono de cabecera (UpdateIndicator.vue).
//
// Puntos que completan las HU siguientes:
// - evaluateBarrier / interruptionUnsafe: la barrera de HU-FLZ-ACT-006 (pedidos sin enviar, cobros).
// - apply: la aplicación de HU-FLZ-ACT-007. Mientras no exista, aplicar FALLA a propósito:
//   ningún botón recarga la página sin pasar por la barrera y el coordinador.

import { computed, readonly, ref, shallowRef, watch } from "vue";
import { createUpdateCoordinator } from "@/utils/updateCoordinator";
import {
  createPostponement,
  decideNoticeView,
  parsePostponement,
  POSTPONE_STORAGE_KEY,
} from "@/utils/updateNotice";
import { getUpdateDetector, updateState } from "@/version/updateDetector";
import { isIncompatible } from "@/utils/clientContract";
import { contractState } from "@/version/clientContract";
import { CLIENT_CONTRACT_VERSION } from "@/version/contract";

// ---- Puntos de integración (HU-FLZ-ACT-006 y HU-FLZ-ACT-007) ----
const interruptionUnsafe = ref(false);
const hooks = {
  evaluateBarrier: () => ({ ok: true }),
  apply: async () => {
    const error = new Error("La aplicación de la actualización aún no está integrada (HU-FLZ-ACT-007)");
    error.code = "apply_not_integrated";
    throw error;
  },
};

/** Lo usan HU-FLZ-ACT-006/007 para conectar la barrera y la aplicación. */
export const configureUpdateFlow = ({ evaluateBarrier, apply } = {}) => {
  if (evaluateBarrier) hooks.evaluateBarrier = evaluateBarrier;
  if (apply) hooks.apply = apply;
};

/** Marca que hay un cobro u operación sensible en pantalla: el aviso no la interrumpe. */
export const setInterruptionUnsafe = (value) => {
  interruptionUnsafe.value = Boolean(value);
};

// ---- Resultado comprobado al arrancar tras una actualización (HU-FLZ-ACT-007) ----
const updateResult = shallowRef(null);

/** Lo usa applyUpdate al arrancar: { type: "completed" } o { type: "failed", reason }. */
export const setUpdateResult = (result) => {
  updateResult.value = result ?? null;
};

// ---- Pantalla que no pudo cargar (HU-FLZ-ACT-008) ----
// { kind: "retry" | "offline" | "needs_update", target: "/ruta?x#y" }
const loadFailure = shallowRef(null);
let retryNavigation = null;

export const setLoadFailure = (failure) => {
  loadFailure.value = failure ?? null;
};

/** main.js registra cómo volver a intentar abrir una pantalla (router.push). */
export const setLoadRetryNavigator = (fn) => {
  retryNavigation = fn;
};

// ---- Coordinador ----
const coordinatorState = shallowRef(null);
const coordinator = createUpdateCoordinator({
  revalidate: async () => {
    const detector = getUpdateDetector();
    if (!detector) throw new Error("detector inactivo");
    return detector.checkNow();
  },
  isOnline: () => navigator.onLine !== false,
  evaluateBarrier: () => hooks.evaluateBarrier(),
  apply: (candidate, options) => hooks.apply(candidate, options),
});
coordinatorState.value = coordinator.getState();
coordinator.subscribe((next) => {
  coordinatorState.value = next;
});

// ---- Posposición (por pestaña y por publicación; sin datos personales) ----
const readStored = () => {
  try {
    return parsePostponement(window.sessionStorage.getItem(POSTPONE_STORAGE_KEY));
  } catch {
    return null;
  }
};
const postponement = ref(readStored());
const persist = (value) => {
  try {
    if (value) window.sessionStorage.setItem(POSTPONE_STORAGE_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(POSTPONE_STORAGE_KEY);
  } catch {
    // sin almacenamiento la posposición dura hasta recargar; no rompe nada
  }
};

// ---- Versión incompatible con la API (HU-FLZ-ACT-010) ----
// Por el mínimo que anuncia el backend, por un rechazo 409, o porque la versión publicada de la web
// declara que ya no soporta este contrato.
export const incompatible = computed(
  () =>
    contractState.value.rejected ||
    isIncompatible({
      clientContract: CLIENT_CONTRACT_VERSION,
      backendMin: contractState.value.backendMin,
      manifestMin: updateState.value?.candidate?.minSupportedClientContract ?? null,
    })
);

// ---- Reloj para el recordatorio ----
const now = ref(Date.now());
let remindTimer = null;

export const noticeView = computed(() =>
  decideNoticeView({
    detector: updateState.value,
    coordinator: coordinatorState.value,
    postponement: postponement.value,
    now: now.value,
    interruptionUnsafe: interruptionUnsafe.value,
    result: updateResult.value,
    loadFailure: loadFailure.value,
    incompatible: incompatible.value,
  })
);

watch(
  () => noticeView.value.remindAt,
  (remindAt) => {
    if (remindTimer) window.clearTimeout(remindTimer);
    remindTimer = null;
    if (!remindAt) return;
    const wait = Math.max(0, remindAt - Date.now());
    remindTimer = window.setTimeout(() => {
      remindTimer = null;
      now.value = Date.now();
    }, wait + 50);
  },
  { immediate: true }
);

export const coordinatorPhase = computed(() => coordinatorState.value?.phase ?? "idle");
export const updateCoordinatorState = readonly(coordinatorState);

// ---- Acciones de la interfaz ----
const currentDeploymentId = () => updateState.value?.candidate?.deploymentId ?? null;

/** "Actualizar ahora": siempre pasa por el coordinador (revalida, barrera, aplica). */
export const updateNow = () => {
  updateResult.value = null;
  loadFailure.value = null;
  return coordinator.requestUpdate();
};

/** Actualiza y llega a una pantalla concreta (la que no pudo cargar). Pasa por el coordinador igual. */
export const updateToTarget = (targetUrl) => {
  updateResult.value = null;
  loadFailure.value = null;
  return coordinator.requestUpdate({ targetUrl });
};

/** "Reintentar" tras un fallo de carga sin versión nueva: vuelve a intentar abrir la pantalla. */
export const retryFailedLoad = () => {
  const target = loadFailure.value?.target;
  loadFailure.value = null;
  if (target && retryNavigation) retryNavigation(target);
};

/** "Actualizar ahora" tras un fallo de carga: actualiza y llega a esa pantalla. */
export const updateToFailedLoad = () => updateToTarget(loadFailure.value?.target);

/** Cierra el aviso de fallo de carga; la pantalla actual sigue igual. */
export const dismissLoadFailure = () => {
  loadFailure.value = null;
};

/** "Más tarde" o cerrar: pospone esta publicación 30 minutos. */
export const postponeUpdate = () => {
  coordinator.dismiss();
  updateResult.value = null;
  const deploymentId = currentDeploymentId();
  if (!deploymentId) return;
  now.value = Date.now();
  postponement.value = createPostponement(deploymentId, now.value);
  persist(postponement.value);
};

/** Desde el ícono de cabecera: vuelve a mostrar la tarjeta. */
export const reopenUpdateNotice = () => {
  coordinator.dismiss();
  updateResult.value = null;
  postponement.value = null;
  persist(null);
  now.value = Date.now();
};

export const isUpdateRequestRunning = () => coordinator.isBusy();

/** Cierra el mensaje de resultado (p. ej., "Flizzy se actualizó"). */
export const dismissUpdateResult = () => {
  updateResult.value = null;
};
