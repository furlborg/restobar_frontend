<template>
  <n-space vertical size="large">
    <n-card size="small">
      <template #header>
        <n-text strong>Resumen de Venta</n-text>
      </template>

      <n-grid responsive="screen" cols="1 xs:1 s:2 m:3 l:4" :x-gap="12" :y-gap="12">
        <n-gi v-for="(item, index) in itemsToShow" :key="index">
          <n-space vertical size="small">
            <n-text type="secondary" strong class="fs-6" >{{ item.label }}</n-text>

            <template v-if="!item.editable">
              <n-text>{{ currencySymbol }} {{ formatNumber(item.value) }}</n-text>
            </template>

            <template v-else>
              <n-input-number
                :value="getNumericValue(item.value)"
                :min="item.min ?? 0"
                :max="typeof item.max === 'number' ? item.max : undefined"
                :step="item.step ?? 0.1"
                :precision="item.precision ?? 2"
                :disabled="item.disabled"
                @update:value="(value) => handleNumberChange(item, value)"
              >
                <template #prefix>{{ currencySymbol }}</template>
              </n-input-number>
            </template>
          </n-space>
        </n-gi>
      </n-grid>

      <n-divider />

      <n-space justify="space-between" align="center">
        <n-text type="secondary" strong>{{ totalLabel }}:</n-text>
        <n-text size="large" strong>{{ currencySymbol }} {{ formatNumber(totalAmount) }}</n-text>
      </n-space>
    </n-card>

    <n-grid responsive="screen" cols="1 xs:1 s:2" :x-gap="12" :y-gap="12">
      <n-gi>
        <n-card size="small" align="center">
          <n-space vertical align="center">
            <n-text strong class="fs-5">PAGO</n-text>
            <n-input-number
              :value="getNumericValue(paymentAmount)"
              :min="paymentMin"
              step="0.1"
              @update:value="handlePaymentInput"
              size="large"
              style="max-width: 12rem;"
            >
              <template #prefix>{{ currencySymbol }}</template>
            </n-input-number>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" style="height: 100%;">
          <n-space vertical align="center">
            <n-text strong class="fs-5">VUELTO</n-text>
            <n-text class="fs-6">{{ currencySymbol }} {{ formatNumber(calculatedChange) }}</n-text>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </n-space>
</template>

<script>
import { defineComponent, computed, toRefs } from "vue";
import { useMessage } from "naive-ui";

export default defineComponent({
  name: "PaymentTotals",
  props: {
    currencySymbol: {
      type: String,
      default: "S/."
    },
    items: {
      type: Array,
      default: () => []
    },
    totalLabel: {
      type: String,
      default: "TOTAL"
    },
    totalAmount: {
      type: [Number, String],
      default: 0
    },
    paymentAmount: {
      type: [Number, String],
      default: 0
    },
    paymentMin: {
      type: Number,
      default: 0
    },
    changeAmount: {
      type: [Number, String],
      default: 0
    }
  },
  emits: ["valueChanged", "paymentChanged"],
  setup(props, { emit }) {
    const message = useMessage();
    const {
      currencySymbol,
      totalLabel,
      totalAmount,
      paymentAmount,
      paymentMin
    } = toRefs(props);

    const itemsToShow = computed(() =>
      props.items.filter(
        (item) =>
          (item.value && Number(item.value) > 0) ||
          item.editable ||
          (item.alwaysShow !== undefined ? item.alwaysShow : false)
      )
    );

    const calculatedChange = computed(() => {
      const payment = parseFloat(props.paymentAmount) || 0;
      const total = parseFloat(props.totalAmount) || 0;
      return payment > total ? payment - total : 0;
    });

    const formatNumber = (value) => {
      if (value === undefined || value === null || isNaN(Number(value))) {
        return "0.00";
      }
      return Number(value).toFixed(2);
    };

    const getNumericValue = (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };

    const handleNumberChange = (item, value) => {
      if (!item?.field || item.disabled) {
        return;
      }

      const numericValue = Number(value);
      const sanitizedValue = Number.isFinite(numericValue) ? numericValue : 0;
      const max = typeof item.max === "number" ? item.max : undefined;
      let finalValue = sanitizedValue;

      if (max !== undefined && sanitizedValue > max) {
        const warningMessage =
          item.field === "discount"
            ? "El descuento no puede ser 100%. Debe cambiar a operación gratuita."
            : "Has alcanzado el valor máximo permitido.";
        message.warning(warningMessage);
        finalValue = max;
      }

      emit("valueChanged", { field: item.field, value: finalValue });
    };

    const handlePaymentInput = (value) => {
      const numericValue = Number(value);
      emit("paymentChanged", Number.isFinite(numericValue) ? numericValue : 0);
    };

    return {
      itemsToShow,
      calculatedChange,
      formatNumber,
      getNumericValue,
      handleNumberChange,
      handlePaymentInput,
      currencySymbol,
      totalLabel,
      totalAmount,
      paymentAmount,
      paymentMin
    };
  }
});
</script>
