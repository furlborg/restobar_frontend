<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Registrar Ingreso"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-form>
      <n-form-item label="Concepto">
        <n-input-group>
          <n-select />
          <n-button type="info">
            <v-icon name="ri-edit-fill" />
          </n-button>
        </n-input-group>
      </n-form-item>
      <n-form-item label="Método Pago">
        <n-select />
      </n-form-item>
      <n-form-item label="Descripción">
        <n-input />
      </n-form-item>
      <n-form-item label="Monto">
        <n-input />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button type="success">Registrar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useGenericsStore } from "@/store/modules/generics";

export default defineComponent({
  name: "TillModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    concept: {
      type: String,
    },
  },
  setup() {
    const genericsStore = useGenericsStore();

    return {
      genericsStore,
    };
  },
});
</script>

<style>
</style>