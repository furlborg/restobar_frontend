<template>
  <n-modal
    style="max-width: 1200px"
    id="SeparatePaymentsModal"
    :show="show"
    preset="card"
    :mask-closable="false"
    @update:show="
      (v) => {
        $emit('update:show', v);
      }
    "
    @close="
      () => {
        $emit('on-close');
      }
    "
  >
    <separate-payments
      :data="data"
      @success="() => ($emit('update:show', false), $emit('success'))"
    />
  </n-modal>
</template>

<script>
import { defineComponent } from "vue";
import SeparatePayments from "./SeparatePayments";

export default defineComponent({
  name: "SeparatePaymentsModal",
  components: {
    SeparatePayments,
  },
  props: {
    show: {
      type: Boolean,
    },
    data: {
      type: Object,
    },
  },
  emits: ["update:show", "on-close", "success"],
  setup(props) {
    return {};
  },
});
</script>

<style>
</style>