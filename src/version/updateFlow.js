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
  apply: (candidate) => hooks.apply(candidate),
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
export const updateNow = () => coordinator.requestUpdate();

/** "Más tarde" o cerrar: pospone esta publicación 30 minutos. */
export const postponeUpdate = () => {
  coordinator.dismiss();
  const deploymentId = currentDeploymentId();
  if (!deploymentId) return;
  now.value = Date.now();
  postponement.value = createPostponement(deploymentId, now.value);
  persist(postponement.value);
};

/** Desde el ícono de cabecera: vuelve a mostrar la tarjeta. */
export const reopenUpdateNotice = () => {
  coordinator.dismiss();
  postponement.value = null;
  persist(null);
  now.value = Date.now();
};

export const isUpdateRequestRunning = () => coordinator.isBusy();
