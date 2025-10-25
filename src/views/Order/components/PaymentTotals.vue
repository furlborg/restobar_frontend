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
              <n-text style="font-size: 16px;">{{ currencySymbol }} {{ formatNumber(item.value) }}</n-text>
            </template>

            <template v-else>
              <n-input-number
                :value="getNumericValue(item.value)"
                :min="item.min ?? 0"
                :max="typeof item.max === 'number' ? item.max : undefined"
                :step="item.step ?? 0.1"
                :precision="item.precision ?? 2"
                :disabled="item.disabled"
                :class="getInputClass(item)"
                @update:value="(value) => handleNumberChange(item, value)"
              >
                <template #prefix>{{ currencySymbol }}</template>
              </n-input-number>
            </template>
          </n-space>
        </n-gi>
      </n-grid>

      <n-divider />

      <n-space justify="space-between" align="center" class="total-section">
        <n-text type="secondary" strong class="fs-5">{{ totalLabel }}:</n-text>
        <n-text size="large" strong class="total-amount">{{ currencySymbol }} {{ formatNumber(totalAmount) }}</n-text>
      </n-space>
    </n-card>

    <n-grid responsive="screen" cols="1 xs:1 s:2" :x-gap="12" :y-gap="12">
      <n-gi>
        <n-card size="small">
          <n-space vertical align="center">
            <n-text strong class="fs-5">PAGO</n-text>
            <n-input-number
              :value="getNumericValue(paymentAmount)"
              :min="paymentMin"
              :precision="2"
              :show-button="false"
              step="0.1"
              @click="$event.target.select()"
              @update:value="handlePaymentInput"
              size="large"
              class="payment-input"
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
            <n-text strong class="change-amount">{{ currencySymbol }} {{ formatNumber(calculatedChange) }}</n-text>
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

    const getInputClass = (item) => {
      // Asignar clases CSS según el tipo de campo para colorear
      const fieldClassMap = {
        discount: 'input-discount',
        other_charges: 'input-charges',
        icbper: 'input-icbper'
      };
      return fieldClassMap[item.field] || 'input-default';
    };

    return {
      itemsToShow,
      calculatedChange,
      formatNumber,
      getNumericValue,
      handleNumberChange,
      handlePaymentInput,
      getInputClass,
      currencySymbol,
      totalLabel,
      totalAmount,
      paymentAmount,
      paymentMin
    };
  }
});
</script>

<style scoped>
/* Sección del total con fondo azul claro */
.total-section {
  padding: 8px 0;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 16px;
}

.total-amount {
  color: #18a058;
  font-size: 28px !important;
  font-weight: 700 !important;
}

.change-amount {
  color: #1d4ed8;
  font-size: 28px !important;
}

/* Input de PAGO - Solo borde verde */
:deep(.payment-input .n-input__border),
:deep(.payment-input .n-input__state-border) {
  border: 1px solid #18a058 !important;
}

:deep(.payment-input .n-input:hover .n-input__border),
:deep(.payment-input .n-input:hover .n-input__state-border) {
  border-color: #059669 !important;
}

:deep(.payment-input .n-input:focus-within .n-input__state-border) {
  border-color: #059669 !important;
  box-shadow: 0 0 0 3px rgba(24, 160, 88, 0.2) !important;
}

:deep(.payment-input .n-input__input-el) {
  font-size: 28px !important;
  font-weight: 700;
  color: #059669;
  text-align: center;
}

:deep(.payment-input .n-input__prefix) {
  font-size: 28px !important;
  font-weight: 700;
  color: #059669;
}

:deep(.payment-input .n-input-wrapper) {
  padding: 8px 12px;
}

/* Input de DESCUENTO - Solo borde amarillo/naranja */
:deep(.input-discount .n-input__border),
:deep(.input-discount .n-input__state-border) {
  border: 1px solid #f59e0b !important;
}

:deep(.input-discount .n-input:hover .n-input__border),
:deep(.input-discount .n-input:hover .n-input__state-border) {
  border-color: #d97706 !important;
}

:deep(.input-discount .n-input:focus-within .n-input__state-border) {
  border-color: #d97706 !important;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2) !important;
}

:deep(.input-discount .n-input-number__input) {
  color: #d97706;
  font-weight: 600;
}

/* Input de OTROS CARGOS - Solo borde púrpura */
:deep(.input-charges .n-input__border),
:deep(.input-charges .n-input__state-border) {
  border: 1px solid #8b5cf6 !important;
}

:deep(.input-charges .n-input:hover .n-input__border),
:deep(.input-charges .n-input:hover .n-input__state-border) {
  border-color: #7c3aed !important;
}

:deep(.input-charges .n-input:focus-within .n-input__state-border) {
  border-color: #7c3aed !important;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2) !important;
}

:deep(.input-charges .n-input-number__input) {
  color: #7c3aed;
  font-weight: 600;
}

/* Input de ICBPER - Solo borde cyan */
:deep(.input-icbper .n-input__border),
:deep(.input-icbper .n-input__state-border) {
  border: 1px solid #06b6d4 !important;
}

:deep(.input-icbper .n-input:hover .n-input__border),
:deep(.input-icbper .n-input:hover .n-input__state-border) {
  border-color: #0891b2 !important;
}

:deep(.input-icbper .n-input:focus-within .n-input__state-border) {
  border-color: #0891b2 !important;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2) !important;
}

:deep(.input-icbper .n-input-number__input) {
  color: #0891b2;
  font-weight: 600;
}

/* Input por defecto - Solo borde gris oscuro */
:deep(.input-default .n-input__border),
:deep(.input-default .n-input__state-border) {
  border: 1px solid #94a3b8 !important;
}

:deep(.input-default .n-input:hover .n-input__border),
:deep(.input-default .n-input:hover .n-input__state-border) {
  border-color: #64748b !important;
}

:deep(.input-default .n-input:focus-within .n-input__state-border) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2) !important;
}

/* Transiciones suaves */
:deep(.n-input-number) {
  transition: all 0.3s ease;
}
</style>
