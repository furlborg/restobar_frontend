// Cuándo y cómo se muestra el aviso de actualización (HU-FLZ-ACT-005).
// Puro, para probarlo con `node --test`.
//
// - "card":      tarjeta con el mensaje y sus acciones.
// - "indicator": solo el ícono discreto de "Actualización pendiente" en la cabecera.
// - "hidden":    nada (no hay versión nueva, o se retiró).
//
// Reglas:
// - "Más tarde" (o cerrar) pospone ESA publicación (deployment_id) 30 minutos.
// - Cumplido el plazo, la tarjeta vuelve solo si no interrumpe una operación sensible (cobro).
// - Una publicación nueva vuelve a mostrar la tarjeta: es otra versión.
// - Lo que el usuario pidió (actualizar, bloqueo, sin red, fallo) siempre se muestra.

import { DETECTOR_STATUS } from "./versionDetector.js";
import { COORDINATOR_PHASE } from "./updateCoordinator.js";

export const REMIND_AFTER_MS = 30 * 60 * 1000;
export const POSTPONE_STORAGE_KEY = "flizzy-update-postponed";

export const NOTICE_MESSAGE = Object.freeze({
  AVAILABLE: "available",
  CHECKING: "checking",
  UNSAVED: "unsaved",
  PAYMENT: "payment",
  OFFLINE: "offline",
  APPLYING: "applying",
  FAILED: "failed",
});

/** Registro de posposición: solo ids y fechas, sin datos personales. */
export const createPostponement = (deploymentId, now, remindAfterMs = REMIND_AFTER_MS) => ({
  deployment_id: deploymentId,
  remind_at: now + remindAfterMs,
});

/** Lee el registro guardado; cualquier cosa rara se descarta (null). */
export const parsePostponement = (raw) => {
  if (typeof raw !== "string" || raw === "") return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data.deployment_id !== "string" || !Number.isFinite(data.remind_at)) return null;
    return { deployment_id: data.deployment_id, remind_at: data.remind_at };
  } catch {
    return null;
  }
};

const blockedMessage = (reason) => (reason === "payment" ? NOTICE_MESSAGE.PAYMENT : NOTICE_MESSAGE.UNSAVED);

const COORDINATOR_MESSAGE = {
  [COORDINATOR_PHASE.CHECKING]: () => NOTICE_MESSAGE.CHECKING,
  [COORDINATOR_PHASE.OFFLINE]: () => NOTICE_MESSAGE.OFFLINE,
  [COORDINATOR_PHASE.BLOCKED]: blockedMessage,
  [COORDINATOR_PHASE.APPLYING]: () => NOTICE_MESSAGE.APPLYING,
  [COORDINATOR_PHASE.FAILED]: () => NOTICE_MESSAGE.FAILED,
};

/**
 * @param {object} input
 * @param {object|null} input.detector        estado del detector (HU-FLZ-ACT-004)
 * @param {object|null} input.coordinator     estado del coordinador
 * @param {object|null} input.postponement    { deployment_id, remind_at }
 * @param {number} input.now
 * @param {boolean} input.interruptionUnsafe  hay un cobro u operación sensible en pantalla
 * @returns {{ mode: "hidden"|"card"|"indicator", message: string|null, remindAt: number|null }}
 */
export const decideNoticeView = ({ detector, coordinator, postponement, now, interruptionUnsafe }) => {
  const phase = coordinator?.phase ?? COORDINATOR_PHASE.IDLE;

  // Lo que el usuario pidió se informa aunque la candidata haya cambiado mientras tanto.
  if (phase !== COORDINATOR_PHASE.IDLE && COORDINATOR_MESSAGE[phase]) {
    return { mode: "card", message: COORDINATOR_MESSAGE[phase](coordinator.reason), remindAt: null };
  }

  const candidate = detector?.status === DETECTOR_STATUS.AVAILABLE ? detector.candidate : null;
  if (!candidate) return { mode: "hidden", message: null, remindAt: null };

  const postponedThis = postponement && postponement.deployment_id === candidate.deploymentId;
  if (postponedThis && now < postponement.remind_at) {
    return { mode: "indicator", message: null, remindAt: postponement.remind_at };
  }
  if (interruptionUnsafe) {
    // No irrumpir sobre un cobro: queda el ícono y la tarjeta espera una oportunidad segura.
    return { mode: "indicator", message: null, remindAt: null };
  }
  return { mode: "card", message: NOTICE_MESSAGE.AVAILABLE, remindAt: null };
};
