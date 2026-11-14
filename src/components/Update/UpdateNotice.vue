<template>
  <!-- Aviso de actualización (HU-FLZ-ACT-005). No es modal: no bloquea la pantalla ni roba el foco. -->
  <n-config-provider abstract :theme="naiveTheme" :theme-overrides="themeOverrides">
    <transition name="flz-update">
      <section
        v-if="view.mode === 'card' && content"
        class="flz-update"
        :class="[`flz-update--${content.tone}`, { 'flz-update--dark': designStore.darkTheme }]"
        :style="{ '--flz-primary': designStore.appTheme }"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        @keydown.esc="content.closable && closeCard()"
      >
        <div class="flz-update__icon" aria-hidden="true">
          <v-icon :name="content.icon" scale="1.2" :animation="content.spin ? 'spin' : undefined" />
        </div>
        <div class="flz-update__body">
          <p class="flz-update__title">{{ content.title }}</p>
          <p v-if="content.detail" class="flz-update__detail">{{ content.detail }}</p>
          <div v-if="content.actions.length" class="flz-update__actions">
            <n-button
              v-for="action in content.actions"
              :key="action.id"
              :id="`flz-update-${action.id}`"
              size="small"
              :type="action.primary ? 'primary' : 'default'"
              :secondary="!action.primary"
              @click="action.run"
            >
              {{ action.label }}
            </n-button>
          </div>
        </div>
        <button
          v-if="content.closable"
          type="button"
          class="flz-update__close"
          :aria-label="content.closeLabel || 'Cerrar y actualizar más tarde'"
          @click="closeCard"
        >
          <v-icon name="md-close-round" />
        </button>
      </section>
    </transition>
  </n-config-provider>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from "vue";
import { darkTheme } from "naive-ui";
import { useDesignSettingStore } from "@/store/modules/designSetting";
import { lighten } from "@/utils";
import { NOTICE_MESSAGE as M } from "@/utils/updateNotice";
import { dismissUpdateResult, noticeView, postponeUpdate, updateNow } from "@/version/updateFlow";
import { acknowledgeUncertainAndRetry } from "@/version/updateBarrier";

const designStore = useDesignSettingStore();
const view = noticeView;

const naiveTheme = computed(() => (designStore.darkTheme ? darkTheme : undefined));
const themeOverrides = computed(() => ({
  common: {
    primaryColor: designStore.appTheme,
    primaryColorHover: lighten(designStore.appTheme, 6),
    primaryColorPressed: lighten(designStore.appTheme, 6),
  },
}));

const actionUpdate = { id: "update", label: "Actualizar ahora", primary: true, run: () => updateNow() };
const actionLater = { id: "later", label: "Más tarde", run: () => postponeUpdate() };
const actionRetry = { id: "retry", label: "Reintentar", primary: true, run: () => updateNow() };
const actionBack = { id: "back", label: "Volver a la operación", primary: true, run: () => postponeUpdate() };
const actionReviewed = { id: "reviewed", label: "Ya lo revisé", primary: true, run: () => acknowledgeUncertainAndRetry() };
const actionClose = { id: "close", label: "Cerrar", run: () => postponeUpdate() };

// Detalle del fallo según el motivo (HU-FLZ-ACT-007). Agotados los intentos ya no se ofrece reintentar.
const FAILED_BY_REASON = {
  still_old: {
    detail: "El servidor todavía entrega la versión anterior. Intenta de nuevo en unos minutos.",
  },
  boot_timeout: {
    detail: "La versión nueva tardó demasiado en cargar. Puedes reintentar o seguir trabajando.",
  },
  reload_not_started: {
    detail: "La página no se recargó. Puedes reintentar o seguir trabajando con esta versión.",
  },
  too_many_attempts: {
    detail: "Se intentó varias veces sin éxito. Sigue trabajando con esta versión y avisa a soporte.",
    actions: [actionClose],
  },
};

// Textos de la HU-FLZ-ACT-005. Nunca dicen "todo guardado" ni muestran porcentajes inventados.
const CONTENT = {
  [M.AVAILABLE]: {
    tone: "info",
    icon: "md-publishedwithchanges-round",
    title: "Hay una actualización disponible",
    detail: "Puedes actualizar ahora o seguir trabajando y hacerlo más tarde.",
    actions: [actionUpdate, actionLater],
    closable: true,
  },
  [M.CHECKING]: {
    tone: "info",
    icon: "hi-solid-refresh",
    spin: true,
    title: "Preparando la actualización…",
    actions: [],
    closable: false,
  },
  [M.UNSAVED]: {
    tone: "warning",
    icon: "md-warningamber-round",
    title: "Guarda o termina la operación antes de actualizar",
    detail: "No se actualizó nada; tu pantalla de trabajo sigue igual.",
    actions: [actionBack],
    closable: true,
  },
  [M.PAYMENT]: {
    tone: "warning",
    icon: "md-warningamber-round",
    title: "Estamos verificando la operación. Espera antes de actualizar",
    actions: [actionBack],
    closable: true,
  },
  [M.SAVING]: {
    tone: "warning",
    icon: "md-warningamber-round",
    title: "Espera a que termine de guardarse la operación",
    detail: "Cuando el servidor responda podrás actualizar.",
    actions: [actionRetry, actionLater],
    closable: true,
  },
  [M.UNCERTAIN]: {
    tone: "warning",
    icon: "md-warningamber-round",
    title: "Una operación quedó sin respuesta del servidor",
    detail: "Revisa que se haya registrado (por ejemplo, en Ventas o en la mesa) antes de actualizar.",
    actions: [actionReviewed, actionLater],
    closable: true,
  },
  [M.OFFLINE]: {
    tone: "warning",
    icon: "md-warningamber-round",
    title: "Necesitas conexión para actualizar",
    detail: "No se actualizó nada; tu pantalla de trabajo sigue igual.",
    actions: [actionRetry, actionLater],
    closable: true,
  },
  [M.APPLYING]: {
    tone: "info",
    icon: "hi-solid-refresh",
    spin: true,
    title: "Actualizando Flizzy…",
    actions: [],
    closable: false,
  },
  [M.COMPLETED]: {
    tone: "success",
    icon: "md-checkcircle-round",
    title: "Flizzy se actualizó",
    detail: "Ya estás usando la versión nueva.",
    actions: [],
    closable: true,
    closeLabel: "Cerrar aviso",
    onClose: () => dismissUpdateResult(),
    autoHideMs: 8000,
  },
  [M.FAILED]: {
    tone: "warning",
    icon: "md-warningamber-round",
    title: "No pudimos completar la actualización",
    detail: "Puedes reintentar o seguir trabajando con esta versión.",
    actions: [actionRetry, actionLater],
    closable: true,
  },
};

const content = computed(() => {
  const base = CONTENT[view.value.message];
  if (!base) return null;
  if (view.value.message === M.FAILED && FAILED_BY_REASON[view.value.reason]) {
    return { ...base, ...FAILED_BY_REASON[view.value.reason] };
  }
  return base;
});

const closeCard = () => (content.value?.onClose ?? postponeUpdate)();

// "Flizzy se actualizó" se cierra solo; los demás mensajes esperan una acción.
let autoHideTimer = null;
watch(
  () => content.value?.autoHideMs ?? null,
  (ms) => {
    if (autoHideTimer) window.clearTimeout(autoHideTimer);
    autoHideTimer = ms ? window.setTimeout(() => closeCard(), ms) : null;
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  if (autoHideTimer) window.clearTimeout(autoHideTimer);
});
</script>

<style scoped>
.flz-update {
  --flz-bg: #ffffff;
  --flz-fg: #1f2329;
  --flz-muted: #5c6370;
  --flz-border: #e4e7ec;
  --flz-warning: #d97706;
  --flz-success: #16a34a;
  --flz-accent: var(--flz-primary, #0099ff);

  position: fixed;
  z-index: 2000;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: min(440px, calc(100vw - 24px));
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 40px 14px 14px;
  background: var(--flz-bg);
  color: var(--flz-fg);
  border: 1px solid var(--flz-border);
  border-left: 4px solid var(--flz-accent);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgb(29 35 41 / 14%);
}

.flz-update--warning {
  --flz-accent: var(--flz-warning);
}

.flz-update--success {
  --flz-accent: var(--flz-success);
}

.flz-update--dark {
  --flz-bg: #26262b;
  --flz-fg: #ececf1;
  --flz-muted: #a6a8b0;
  --flz-border: #3a3a41;
  --flz-warning: #f0a33a;
  --flz-success: #4ade80;
  box-shadow: 0 8px 24px rgb(0 0 0 / 40%);
}

.flz-update__icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--flz-accent);
  background: color-mix(in srgb, var(--flz-accent) 14%, transparent);
}

.flz-update__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flz-update__title {
  margin: 0;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.35;
}

.flz-update__detail {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--flz-muted);
}

.flz-update__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.flz-update__close {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--flz-muted);
  cursor: pointer;
}

.flz-update__close:hover {
  background: color-mix(in srgb, var(--flz-fg) 8%, transparent);
}

.flz-update__close:focus-visible {
  outline: 2px solid var(--flz-accent);
  outline-offset: 1px;
}

.flz-update-enter-active,
.flz-update-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.flz-update-enter-from,
.flz-update-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

@media (max-width: 768px) {
  .flz-update {
    top: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flz-update-enter-active,
  .flz-update-leave-active {
    transition: none;
  }
}
</style>
