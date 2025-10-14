<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :title="title"
    :mask-closable="false"
    :closable="true"
    style="max-width: 500px"
  >
    <n-space vertical size="large">
      <!-- Icono de alerta -->
      <n-space justify="center">
        <v-icon name="md-lock-round" scale="4" fill="#ffc107" />
      </n-space>

      <!-- Mensaje principal -->
      <n-text class="text-center fs-5">
        {{ message }}
      </n-text>

      <!-- Información del usuario que bloqueó -->
      <n-card embedded v-if="lockData">
        <n-space vertical>
          <n-space align="center">
            <v-icon name="md-person-round" fill="#666" />
            <n-text><strong>Usuario:</strong> {{ lockData.user?.username || 'Desconocido' }}</n-text>
          </n-space>
          
          <n-space align="center">
            <v-icon name="md-accesstime-round" fill="#666" />
            <n-text><strong>Bloqueado desde:</strong> {{ formatTime(lockData.locked_at) }}</n-text>
          </n-space>
          
          <n-space align="center" v-if="remainingTime > 0">
            <v-icon name="md-timer-round" fill="#ff5722" />
            <n-text><strong>Tiempo restante:</strong> {{ formattedRemainingTime }}</n-text>
          </n-space>
          
          <n-space align="center" v-else>
            <v-icon name="md-checkcircle-round" fill="#4caf50" />
            <n-text type="success"><strong>Mesa disponible ahora</strong></n-text>
          </n-space>
        </n-space>
      </n-card>
    </n-space>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleClose" secondary>
          Cancelar
        </n-button>
        <n-button 
          type="primary" 
          @click="handleRetry"
          :loading="retrying"
        >
          Intentar de nuevo
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, computed, watch, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default defineComponent({
  name: 'LockedTableModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    lockData: {
      type: Object,
      default: null
    },
    tableDescription: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'retry', 'close'],
  setup(props, { emit }) {
    const show = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const retrying = ref(false);
    const remainingTime = ref(0);
    let countdownInterval = null;

    const title = computed(() => {
      return `Mesa ${props.tableDescription} bloqueada`;
    });

    const message = computed(() => {
      if (!props.lockData) {
        return 'Esta mesa está siendo utilizada por otro usuario.';
      }
      
      const username = props.lockData.user?.username || 'otro usuario';
      return `Esta mesa está siendo utilizada por ${username}.`;
    });

    /**
     * Calcula el tiempo restante en segundos
     */
    const calculateRemainingTime = () => {
      if (!props.lockData?.expires_at) return 0;
      
      const expiresAt = new Date(props.lockData.expires_at);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      return diff;
    };

    /**
     * Formatea el tiempo restante en MM:SS
     */
    const formattedRemainingTime = computed(() => {
      const minutes = Math.floor(remainingTime.value / 60);
      const seconds = remainingTime.value % 60;
      
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    });

    /**
     * Formatea una fecha a string legible
     */
    const formatTime = (dateString) => {
      if (!dateString) return 'Desconocido';
      
      try {
        const date = new Date(dateString);
        return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
      } catch (error) {
        return 'Fecha inválida';
      }
    };

    /**
     * Inicia el contador regresivo
     */
    const startCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      remainingTime.value = calculateRemainingTime();

      countdownInterval = setInterval(() => {
        remainingTime.value = calculateRemainingTime();
        
        // Si el tiempo se acabó, detener el contador
        if (remainingTime.value <= 0) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }, 1000);
    };

    /**
     * Detiene el contador regresivo
     */
    const stopCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    };

    /**
     * Maneja el evento de reintentar
     */
    const handleRetry = async () => {
      retrying.value = true;
      
      try {
        emit('retry');
        // La lógica de reintento se maneja en el componente padre
      } finally {
        retrying.value = false;
      }
    };

    /**
     * Maneja el evento de cerrar
     */
    const handleClose = () => {
      show.value = false;
      emit('close');
    };

    // Watcher para iniciar/detener el contador cuando el modal se muestra/oculta
    watch(() => show.value, (newValue) => {
      if (newValue) {
        startCountdown();
      } else {
        stopCountdown();
      }
    });

    // Watcher para actualizar el contador cuando cambian los datos del lock
    watch(() => props.lockData, () => {
      if (show.value) {
        remainingTime.value = calculateRemainingTime();
      }
    }, { deep: true });

    // Cleanup al desmontar
    onUnmounted(() => {
      stopCountdown();
    });

    return {
      show,
      title,
      message,
      remainingTime,
      formattedRemainingTime,
      formatTime,
      handleRetry,
      handleClose,
      retrying
    };
  }
});
</script>

<style scoped>
.text-center {
  text-align: center;
}
</style>
