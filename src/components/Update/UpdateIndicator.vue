<template>
  <!-- Acceso discreto a una actualización pospuesta (HU-FLZ-ACT-005). Va en la cabecera. -->
  <n-tooltip v-if="noticeView.mode === 'indicator'" placement="bottom">
    <template #trigger>
      <button
        type="button"
        class="flz-update-indicator"
        :style="{ '--flz-primary': designStore.appTheme }"
        aria-label="Actualización pendiente. Ver opciones para actualizar"
        @click="reopenUpdateNotice"
      >
        <v-icon name="md-publishedwithchanges-round" scale="1.05" />
        <span class="flz-update-indicator__dot" aria-hidden="true"></span>
      </button>
    </template>
    <span>Actualización pendiente</span>
  </n-tooltip>
</template>

<script setup>
import { useDesignSettingStore } from "@/store/modules/designSetting";
import { noticeView, reopenUpdateNotice } from "@/version/updateFlow";

const designStore = useDesignSettingStore();
</script>

<style scoped>
.flz-update-indicator {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--flz-primary, #0099ff);
  cursor: pointer;
}

.flz-update-indicator:hover {
  background: color-mix(in srgb, var(--flz-primary, #0099ff) 12%, transparent);
}

.flz-update-indicator:focus-visible {
  outline: 2px solid var(--flz-primary, #0099ff);
  outline-offset: 1px;
}

.flz-update-indicator__dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d97706;
}
</style>
