<template>
  <!-- Modal de autorización de supervisor para operaciones gratuitas (cortesía / consumo interno) (FLZ-GRA-05, D1). -->
  <n-modal
    :show="show"
    preset="card"
    title="Autorización de Operación Gratuita"
    :mask-closable="false"
    closable
    style="max-width: 440px"
    @update:show="(val) => !val && close()"
  >
    <n-space vertical :size="14">
      <n-alert type="warning" :show-icon="true">
        Esta venta incluye ítems registrados como cortesía o consumo interno. Se requiere autorización de supervisor.
      </n-alert>

      <div class="auth-block" :class="{ 'is-supervisor': mode === 'supervisor' }">
        <div class="auth-title">
          {{ mode === 'supervisor' ? 'Credencial del supervisor' : 'Confirme con su contraseña' }}
        </div>
        <div class="auth-hint">
          {{
            mode === 'supervisor'
              ? 'Ingrese usuario y contraseña de un usuario con permiso para autorizar operaciones gratuitas.'
              : 'Usted cuenta con el permiso requerido. Confirme ingresando su contraseña personal.'
          }}
        </div>

        <n-form-item v-if="mode === 'supervisor'" label="Usuario del supervisor" :show-feedback="false">
          <n-input
            v-model:value="credentials.username"
            placeholder="usuario"
            autocomplete="off"
          />
        </n-form-item>

        <n-form-item
          :label="mode === 'supervisor' ? 'Contraseña del supervisor' : 'Su contraseña'"
          :show-feedback="false"
        >
          <n-input
            v-model:value="credentials.password"
            type="password"
            show-password-on="click"
            autocomplete="new-password"
            @keyup.enter="submit"
          />
        </n-form-item>
      </div>

      <div v-if="errorMessage" class="error-msg">
        {{ errorMessage }}
      </div>
    </n-space>

    <template #action>
      <n-space justify="end">
        <n-button @click="close">Cancelar</n-button>
        <n-button type="warning" :loading="loading" @click="submit">
          Autorizar y cobrar
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useUserStore } from "@/store/modules/user";
import {
  freeAuthMode,
  validateFreeAuth,
  buildFreeAuthorizationPayload,
} from "@/utils/freeOperations";

const props = defineProps({
  show: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:show", "authorized"]);

const userStore = useUserStore();

const credentials = ref({ username: "", password: "" });
const errorMessage = ref("");

const mode = computed(() => freeAuthMode((perm) => userStore.hasPermission(perm)));

watch(
  () => props.show,
  (val) => {
    if (val) {
      credentials.value = { username: "", password: "" };
      errorMessage.value = "";
    }
  }
);

const close = () => {
  emit("update:show", false);
};

const submit = () => {
  const err = validateFreeAuth(credentials.value, mode.value);
  if (err) {
    errorMessage.value = err;
    return;
  }
  errorMessage.value = "";
  const payload = buildFreeAuthorizationPayload(credentials.value, mode.value);
  emit("authorized", payload);
};
</script>

<style scoped>
.auth-block {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, #e0e0e6);
}

.auth-block.is-supervisor {
  border-color: #f0a020;
  background: rgba(240, 160, 32, 0.08);
}

.auth-title {
  font-weight: 700;
}

.auth-hint {
  font-size: 13px;
  opacity: 0.8;
}

.error-msg {
  color: #d03050;
  font-size: 13px;
  font-weight: 500;
}
</style>
