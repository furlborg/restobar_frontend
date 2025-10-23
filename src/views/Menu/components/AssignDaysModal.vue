<template>
  <n-modal v-model:show="showLocal" preset="dialog" title="Asignar días de disponibilidad">
    <n-space vertical>
      <n-checkbox-group v-model:value="selectedDays">
        <n-space>
          <n-checkbox v-for="day in days" :key="day.value" :value="day.value">
            {{ day.label }}
          </n-checkbox>
        </n-space>
      </n-checkbox-group>
    </n-space>
    <template #action>
      <n-button @click="close">Cancelar</n-button>
      <n-button type="primary" @click="saveDays">Asignar</n-button>
    </template>
  </n-modal>
</template>

<script setup>
  import { ref, watch } from 'vue'
  const props = defineProps({ show: Boolean, product: Object })
  const emit = defineEmits(['update:show','save'])
  const showLocal = ref(props.show)
  watch(() => props.show, v => showLocal.value = v)
  watch(showLocal, v => emit('update:show', v))
  const days = [
    { value: 'LUN', label: 'Lunes' },
    { value: 'MAR', label: 'Martes' },
    { value: 'MIE', label: 'Miércoles' },
    { value: 'JUE', label: 'Jueves' },
    { value: 'VIE', label: 'Viernes' },
    { value: 'SAB', label: 'Sábado' },
    { value: 'DOM', label: 'Domingo' },
  ]

  const selectedDays = ref([])

  function close() { showLocal.value = false }
  function saveDays() {
    emit('save', selectedDays.value)
    showLocal.value = false
  }
</script>
