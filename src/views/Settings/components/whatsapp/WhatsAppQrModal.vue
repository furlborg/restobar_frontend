<template>
  <n-modal
    :show="show"
    preset="card"
    title="Vincular WhatsApp"
    style="width: 440px; max-width: 95vw; border-radius: 12px"
    :mask-closable="false"
    :closable="!loading"
    @update:show="handleClose"
  >
    <div class="whatsapp-qr-container">
      <!-- Indicador / Instrucción de contexto -->
      <n-alert type="info" :show-icon="true" class="mb-3">
        <ol class="instruction-list">
          <li>Abre <strong>WhatsApp</strong> en tu teléfono celular.</li>
          <li>Toca en <strong>Menú ⋮</strong> o <strong>Configuración ⚙</strong>.</li>
          <li>Selecciona <strong>Dispositivos vinculados</strong> y luego <strong>Vincular un dispositivo</strong>.</li>
          <li>Apunta tu cámara a esta pantalla para escanear el código QR.</li>
        </ol>
      </n-alert>

      <!-- Zona del Código QR -->
      <div class="qr-display-box">
        <div v-if="(loading || isStarting) && !qrImage" class="qr-loading-placeholder">
          <n-spin size="large">
            <template #description>
              <span class="fs-6 mt-2 d-block">Generando código QR de WhatsApp...</span>
            </template>
          </n-spin>
        </div>

        <div v-else-if="qrImage" class="qr-image-wrapper">
          <img
            :src="qrImage"
            alt="Código QR WhatsApp"
            class="qr-image"
          />
          <div v-if="isSyncing" class="qr-syncing-overlay">
            <n-spin size="large">
              <template #description>
                <span class="text-white fw-bold">Sincronizando sesión...</span>
              </template>
            </n-spin>
          </div>
        </div>

        <div v-else class="qr-error-placeholder">
          <v-icon name="md-erroroutline-round" scale="3" fill="#d03050" />
          <n-text type="error" class="mt-2 text-center">
            {{ errorMessage || "No se pudo obtener el código QR." }}
          </n-text>
          <n-button size="small" type="primary" secondary class="mt-3" @click="initQrFlow">
            Reintentar
          </n-button>
        </div>
      </div>

      <!-- Barra de estado y polling -->
      <div class="qr-footer-status mt-3">
        <n-space justify="space-between" align="center">
          <n-text depth="3" class="fs-7">
            <span class="dot-indicator"></span> Sincronizando cada 5 segundos
          </n-text>
          <n-button
            size="tiny"
            quaternary
            :disabled="loading"
            @click="initQrFlow"
          >
            <template #icon><v-icon name="md-refresh" /></template>
            Refrescar QR
          </n-button>
        </n-space>
      </div>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button :disabled="loading" @click="handleClose">
          Cancelar
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, onUnmounted } from "vue";
import { useMessage } from "naive-ui";
import { startWhatsAppQr, getWhatsAppQr, getWhatsAppStatus } from "@/api/modules/business";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:show", "linked"]);

const message = useMessage();
const loading = ref(false);
const isStarting = ref(false);
const isSyncing = ref(false);
const qrImage = ref("");
const errorMessage = ref("");
let pollInterval = null;
let isPolling = false;

const clearTimer = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

const pollCycle = async () => {
  if (isPolling) return;
  isPolling = true;

  try {
    // Consultar QR y estado en llamada no bloqueante
    const qrRes = await getWhatsAppQr();
    const qrData = qrRes?.data || {};

    if (qrData.state === "ready" || qrData.is_ready) {
      clearTimer();
      isStarting.value = false;
      let finalData = qrData;
      try {
        const freshStatus = await getWhatsAppStatus({ refresh: 1 });
        if (freshStatus?.data) {
          finalData = freshStatus.data;
        }
      } catch (e) {
        console.warn("Aviso al refrescar estado completo tras vincular:", e);
      }
      const phoneText = finalData.phone_number ? ` Conectado como +${finalData.phone_number}` : "";
      message.success(`¡WhatsApp vinculado con éxito!${phoneText}`);
      emit("linked", finalData);
      window.dispatchEvent(
        new CustomEvent("whatsapp-status-changed", {
          detail: { is_connected: true, phone_number: finalData.phone_number },
        })
      );
      emit("update:show", false);
      return;
    }

    if (qrData.state === "authenticated") {
      isSyncing.value = true;
      const statusRes = await getWhatsAppStatus({ refresh: 1 });
      const statusData = statusRes?.data || {};
      if (statusData.state === "ready" || statusData.is_ready) {
        clearTimer();
        isStarting.value = false;
        const phoneText = statusData.phone_number ? ` Conectado como +${statusData.phone_number}` : "";
        message.success(`¡WhatsApp vinculado con éxito!${phoneText}`);
        emit("linked", statusData);
        window.dispatchEvent(
          new CustomEvent("whatsapp-status-changed", {
            detail: { is_connected: true, phone_number: statusData.phone_number },
          })
        );
        emit("update:show", false);
        return;
      }
    } else {
      isSyncing.value = false;
    }

    if (qrData.qr) {
      qrImage.value = qrData.qr;
      isStarting.value = false;
    }
  } catch (err) {
    console.warn("Aviso en ciclo de consulta WhatsApp QR:", err);
  } finally {
    isPolling = false;
  }
};

const initQrFlow = async () => {
  clearTimer();
  loading.value = true;
  isStarting.value = true;
  qrImage.value = "";
  isSyncing.value = false;
  errorMessage.value = "";

  try {
    // Protección defensiva: Si ya está listo o autenticado, no forzar un restart destructivo
    const statusRes = await getWhatsAppStatus({ refresh: 1 });
    const statusData = statusRes?.data || {};
    if (statusData.state === "ready" || statusData.is_ready) {
      isStarting.value = false;
      const phoneText = statusData.phone_number ? ` Conectado como +${statusData.phone_number}` : "";
      message.info(`WhatsApp ya se encuentra vinculado.${phoneText}`);
      emit("linked", statusData);
      window.dispatchEvent(
        new CustomEvent("whatsapp-status-changed", {
          detail: { is_connected: true, phone_number: statusData.phone_number },
        })
      );
      emit("update:show", false);
      return;
    }

    // Solicitar inicio y QR fresco solo si no está conectado
    await startWhatsAppQr();
    // Primera consulta inmediata
    await pollCycle();
    // Intervalo de 5 segundos estrictos (respetando rate-limit de Zendy)
    pollInterval = setInterval(pollCycle, 5000);
  } catch (err) {
    console.error("Error al iniciar sesión de QR:", err);
    isStarting.value = false;
    const errDetail = err.response?.data?.error || "Error al iniciar conexión con el servicio de WhatsApp";
    errorMessage.value = errDetail;
    message.error(errDetail);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  clearTimer();
  emit("update:show", false);
};

watch(
  () => props.show,
  (val) => {
    if (val) {
      initQrFlow();
    } else {
      clearTimer();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  clearTimer();
});
</script>

<style scoped>
.whatsapp-qr-container {
  display: flex;
  flex-direction: column;
}

.instruction-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.5;
}

.qr-display-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
  background-color: var(--n-color-modal, #fafafa);
  border: 1px dashed var(--n-border-color, #e0e0e6);
  border-radius: 8px;
  padding: 12px;
  position: relative;
}

.qr-loading-placeholder,
.qr-error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.qr-image-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.qr-image {
  width: 240px;
  height: 240px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background: white;
  padding: 6px;
}

.qr-syncing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.dot-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #18a058;
  border-radius: 50%;
  margin-right: 4px;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.6;
  }
}
</style>
