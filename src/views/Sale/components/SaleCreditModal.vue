<template>
  <n-modal
    style="max-width: 540px"
    title="Detalle de Crédito"
    preset="card"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
  >
    <SaleCreditPaymentsTab :data="data" @success="(v) => $emit('success', v)" />
    <!-- <n-tabs type="line" justify-content="space-evenly" :tabs-padding="10">
      <n-tab-pane name="Pagos">

      </n-tab-pane>
      <n-tab-pane name="Cobrar">
        <SaleCreditPaymentFormTab :data="data" />
      </n-tab-pane>
    </n-tabs> -->
  </n-modal>
</template>

<script>
import { defineComponent } from "vue";
import SaleCreditPaymentsTab from "./SaleCreditPaymentsTab";
import SaleCreditPaymentFormTab from "./SaleCreditPaymentFormTab";

export default defineComponent({
  name: "SaleCreditModal",
  components: {
    SaleCreditPaymentsTab,
    SaleCreditPaymentFormTab,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
    },
  },
  emits: ["update:show", "success"],
  setup(props) {
    return {};
  },
});
</script>

<style lang="scss" scoped></style>
