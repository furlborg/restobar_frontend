<template>
  <n-modal preset="card" :title="mode === 'select' ? 'Seleccionar Mozo' : 'Ingresar Código de Mozo'" v-model:show="internalShow" :segmented="{ content: 'hard' }" style="max-width: 400px;">
    
    <template v-if="mode === 'select'">
      <n-select
        v-model:value="selectedWaiterId"
        :options="waiterOptions"
        placeholder="Seleccione el mozo responsable"
        size="large"
      />
    </template>
    
    <template v-else-if="mode === 'pin'">
      <n-input
        v-model:value="waiterCode"
        placeholder="Ingrese su código de usuario"
        type="password"
        show-password-on="click"
        size="large"
        @keyup.enter="handleConfirm"
      />
    </template>

    <template #action>
      <n-space justify="end">
        <n-button @click="internalShow = false">Cancelar</n-button>
        <n-button type="info" :disabled="!isValid" @click="handleConfirm">Confirmar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { useActiveUsersStore } from '@/store/modules/user';

const props = defineProps({
  show: Boolean,
  mode: String, // 'select' or 'pin'
});

const emit = defineEmits(['update:show', 'success']);

const message = useMessage();
const activeUsersStore = useActiveUsersStore();

const internalShow = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
});

const selectedWaiterId = ref(null);
const waiterCode = ref('');

const waiterOptions = computed(() => {
  return activeUsersStore.users
    .filter(u => u.role === 'MOZO' || u.role === 'ADMINISTRADOR')
    .map(u => ({
      label: u.names || u.username,
      value: u.id
    }));
});

const isValid = computed(() => {
  if (props.mode === 'select') return !!selectedWaiterId.value;
  if (props.mode === 'pin') return waiterCode.value.length > 0;
  return false;
});

watch(internalShow, (val) => {
  if (val) {
    selectedWaiterId.value = null;
    waiterCode.value = '';
    if (activeUsersStore.users.length === 0) {
      activeUsersStore.initializeStore();
    }
  }
});

const handleConfirm = () => {
  if (!isValid.value) return;

  let finalWaiterId = null;

  if (props.mode === 'select') {
    finalWaiterId = selectedWaiterId.value;
  } else if (props.mode === 'pin') {
    const user = activeUsersStore.users.find(u => 
      u.username === waiterCode.value || 
      String(u.id) === waiterCode.value
    );
    if (!user) {
      message.error("Código de usuario incorrecto o mozo no encontrado.");
      return;
    }
    finalWaiterId = user.id;
  }

  emit('success', finalWaiterId);
  internalShow.value = false;
};
</script>
