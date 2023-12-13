<template>
  <n-modal
    style="max-width: 540px"
    title="Agregar Producto"
    preset="card"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
  >
    <FreeSaleProductForm @success="(v) => $emit('success', v)" />
  </n-modal>
</template>

<script>
import { defineComponent } from "vue";
import FreeSaleProductForm from "./FreeSaleProductForm.vue";

export default defineComponent({
  name: "FreeSaleProductModal",
  components: {
    FreeSaleProductForm,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:show", "success"],
  setup() {
    return {};
  },
});
</script>

<style lang="scss" scoped></style>
