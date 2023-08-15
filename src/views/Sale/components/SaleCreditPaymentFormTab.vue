<template>
  <n-form ref="form" class="p-2" :model="payment">
    <n-grid responsive="screen" cols="1" x-gap="6">
      <n-form-item-gi label="item" :rule="rule">
        <n-input />
      </n-form-item-gi>
    </n-grid>
  </n-form>
</template>

<script>
import { defineComponent, ref } from "vue";
export default defineComponent({
  name: "SaleCreditPaymentFormTab",
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const form = ref(null);

    const loading = ref(false);

    const payment = ref({});

    const rule = {
      required: true,
      trigger: ["input", "blur"],
      message: "requerido",
    };

    return {
      form,
      loading,
      payment,
      rule,
    };
  },
});
</script>

<style lang="scss" scoped></style>
