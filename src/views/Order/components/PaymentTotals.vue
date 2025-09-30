<template>
  <div class="payment-section d-block d-md-none my-3">
    <n-card class="mb-3" size="small">
      <template #header>
        <span class="fw-bold">{{ title }}</span>
      </template>
      <div class="mobile-totals">
        <div v-for="(item, index) in itemsToShow" :key="index" class="total-row">
          <span class="label">{{ item.label }}:</span>
          <span v-if="!item.editable" class="amount">{{ currencySymbol }} {{ formatNumber(item.value) }}</span>
          <div v-else class="input-group">
            <span>{{ currencySymbol }}</span>
            <n-input-number
              class="custom-input fw-bold"
              :class="item.field === 'discount' ? 'discount-input' : 'others-input'"
              size="small"
              :value="toNumber(item.value)"
              :min="item.min || 0"
              :step="item.step || 0.5"
              :disabled="item.disabled"
              :precision="2"
              @update:value="(value) => $emit('valueChanged', { field: item.field, value: value ?? 0 })"
              @focus="handleFocus"
            />
          </div>
        </div>
      </div>
      <n-divider />
      <div class="total-final">
        <span class="label-total">{{ totalLabel }}:</span>
        <span class="amount-total">{{ currencySymbol }} {{ formatNumber(totalAmount) }}</span>
      </div>
    </n-card>
    <n-grid cols="2" :x-gap="12">
      <n-gi>
        <n-card size="small" class="payment-card">
          <div class="payment-section-mobile">
            <span class="payment-label">Pago</span>
            <div class="payment-input-container">
              <span class="currency">{{ currencySymbol }}</span>
              <n-input-number
                class="payment-input"
                size="small"
                :value="toNumber(paymentAmount)"
                :min="paymentMin"
                :step="0.1"
                :precision="2"
                :show-button="false"
                @update:value="(value) => $emit('paymentChanged', value ?? 0)"
                @focus="handleFocus"
              />
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" class="payment-card">
          <div class="payment-section-mobile">
            <span class="payment-label">Vuelto</span>
            <div class="payment-amount-display">
              <span class="currency">{{ currencySymbol }}</span>
              <span class="payment-amount">{{ formatNumber(calculatedChange) }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>

  <!-- Version Desktop -->
  <div class="payment-section d-none d-md-block my-3">
    <n-card class="mb-3 totals-card-desktop">
      <template #header>
        <span class="totals-header">{{ title }}</span>
      </template>
      <n-grid :cols="groupedItems.length" :x-gap="16">
        <n-gi v-for="(column, colIndex) in groupedItems" :key="colIndex">
          <div class="desktop-totals-column">
            <div v-for="(item, itemIndex) in column" :key="itemIndex" class="total-row-desktop">
              <span class="label-desktop">{{ item.label }}:</span>
              <span v-if="!item.editable" class="amount-desktop">{{ currencySymbol }} {{ formatNumber(item.value) }}</span>
              <div v-else class="input-group-desktop">
                <span>{{ currencySymbol }}</span>
                <n-input-number
                  class="custom-input fw-bold"
                  :class="item.field === 'discount' ? 'discount-input-desktop' : 'others-input-desktop'"
                  size="small"
                  :value="toNumber(item.value)"
                  :min="item.min || 0"
                  :step="0.1"
                  :disabled="item.disabled"
                  :precision="2"
                  @update:value="(value) => $emit('valueChanged', { field: item.field, value: value ?? 0 })"
                  @focus="handleFocus"
                />
              </div>
            </div>
          </div>
        </n-gi>
      </n-grid>
      <n-divider />
      <div class="total-final-desktop">
        <span class="label-total-desktop">{{ totalLabel }}:</span>
        <span class="amount-total-desktop">{{ currencySymbol }} {{ formatNumber(totalAmount) }}</span>
      </div>
    </n-card>
    <n-grid cols="2" :x-gap="16">
      <n-gi>
        <n-card class="payment-card-desktop" :hoverable="false">
          <div class="payment-section-desktop">
            <n-text class="fs-4">PAGO</n-text>
            <div class="payment-input-container-desktop">
              <span class="currency-desktop">{{ currencySymbol }}</span>
              <n-input-number
                class="payment-input-desktop"
                size="small"
                :value="toNumber(paymentAmount)"
                :min="paymentMin"
                :step="0.1"
                :precision="2"
                @update:value="(value) => $emit('paymentChanged', value ?? 0)"
                @focus="handleFocus"
              />
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="payment-card-desktop">
          <div class="payment-section-desktop">
            <n-text class="fs-4">VUELTO</n-text>
            <div class="payment-amount-display-desktop">
              <span class="currency-desktop">{{ currencySymbol }}</span>
              <span class="payment-amount-desktop">{{ formatNumber(calculatedChange) }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { NInputNumber } from "naive-ui";

export default defineComponent({
  name: "PaymentTotals",
  components: {
    NInputNumber
  },
  props: {
    // Configuración general
    title: {
      type: String,
      default: "Resumen de Venta"
    },
    currencySymbol: {
      type: String,
      default: "S/."
    },
    // Items a mostrar (valores y configuración)
    items: {
      type: Array,
      default: () => []
    },
    // Etiqueta y valor total
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

  emits: [
    'valueChanged',
    'paymentChanged'
  ],

  setup(props) {
    const itemsToShow = computed(() => {
      return props.items.filter(item =>
        (item.value && Number(item.value) > 0) || item.editable ||
        (item.alwaysShow !== undefined ? item.alwaysShow : false)
      );
    });

    // Agrupar los items en 3 columnas para la vista desktop
    const groupedItems = computed(() => {
      const columns = itemsToShow.value.length > 4 ? [[], [], []] : [[], []];
      const itemsToGroup = [...itemsToShow.value];
      const itemsPerColumn = 2;
      for (let i = 0; i < columns.length; i++) {
        columns[i] = itemsToGroup.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn);
      }
      return columns;
    });

    // Calcular el vuelto correctamente
    const calculatedChange = computed(() => {
      const payment = parseFloat(props.paymentAmount) || 0;
      const total = parseFloat(props.totalAmount) || 0;

      // El vuelto es la diferencia entre lo pagado y el total, solo si el pago es mayor
      const change = payment > total ? payment - total : 0;
      return change;
    });

    // Función para formatear números
    const formatNumber = (value) => {
      if (value === undefined || value === null || isNaN(Number(value))) {
        return "0.00";
      }
      return Number(value).toFixed(2);
    };

    const toNumber = (value) => {
      if (value === undefined || value === null || value === "") {
        return 0;
      }
      const numeric = Number(value);
      return Number.isNaN(numeric) ? 0 : numeric;
    };

    const handleFocus = (event) => {
      const target = event?.target;
      if (target && typeof target.select === "function") {
        requestAnimationFrame(() => target.select());
      }
    };
    
    return {
      itemsToShow,
      groupedItems,
      calculatedChange,
      formatNumber,
      toNumber,
      handleFocus
    };
  }
});
</script>

<style lang="scss" scoped>
// Variables globales
$primary-color: #18a058;
$border-color: #e5e7eb;
$text-color: #374151;
$text-muted: #6b7280;
$background-light: #f9fafb;

// Mixins para texto responsivo
@mixin text-ellipsis($lines: 1) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  hyphens: auto;
}

@mixin no-line-break {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

@mixin currency-amount {
  @include no-line-break;
  font-variant-numeric: tabular-nums;
}

// Estilos para móvil
.payment-section {
  .mobile-totals {
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid $border-color;
      min-height: 40px; 
      &:last-child {
        border-bottom: none;
      }

      .label {
        @include text-ellipsis(2);
        font-size: 14px;
        color: $text-muted;
        text-transform: uppercase;
        font-weight: 500;
        flex: 1;
        margin-right: 8px;
        min-width: 0; // Permite que flex funcione correctamente
      }

      .amount {
        @include currency-amount;
        font-size: 14px;
        color: $text-color;
        font-weight: 600;
        flex-shrink: 0; // No permite que se reduzca
      }

      .input-group {
        display: flex;
        align-items: center;
        gap: 2px; // Reducido para evitar saltos
        flex-shrink: 0;

        span {
          @include no-line-break;
          font-size: 14px;
          color: $text-muted;
          font-weight: 500;
        }

        .custom-input {
          max-width: 90px;
          border: 1px solid $border-color;
          border-radius: 4px;

          &.discount-input {
            border-color: #f59e0b;
          }

          &.others-input {
            border-color: #6366f1;
          }
        }
      }
    }
  }

  .total-final {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0 8px 0;
    margin-top: 8px;
    min-height: 50px;

    .label-total {
      @include text-ellipsis(1);
      font-size: 16px;
      font-weight: 700;
      color: $text-color;
      text-transform: uppercase;
      flex: 1;
      margin-right: 8px;
      min-width: 0;
    }

    .amount-total {
      @include currency-amount;
      font-size: 20px;
      font-weight: 700;
      color: $primary-color;
      flex-shrink: 0;
    }
  }

  .payment-card {
    .payment-section-mobile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px;

      .payment-label {
        @include text-ellipsis(2);
        font-size: 12px;
        font-weight: 600;
        color: $text-muted;
        text-transform: uppercase;
        text-align: center;
        width: 100%;
        min-height: 24px; // Altura mínima para consistencia
      }

      .payment-input-container {
        display: flex;
        align-items: center;
        gap: 2px;
        justify-content: center;

        .currency {
          @include no-line-break;
          font-size: 14px;
          color: $text-muted;
          font-weight: 500;
        }

        .payment-input {
          width: 100px;
          padding: 8px;
          border: 2px solid $primary-color;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          background: white;
        }
      }

      .payment-amount-display {
        @include currency-amount;
        justify-content: center;
        gap: 2px;

        .currency {
          font-size: 14px;
          color: $text-muted;
          font-weight: 500;
        }

        .payment-amount {
          font-size: 16px;
          font-weight: 600;
          color: $primary-color;
        }
      }
    }
  }
}

// Estilos para desktop
.totals-card-desktop {
  .totals-header {
    @include text-ellipsis(2);
    font-size: 18px;
    font-weight: 600;
    color: $text-color;
    min-height: 28px;
  }
}

.desktop-totals-column {
  .total-row-desktop {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    margin-bottom: 4px;
    min-height: 32px;
    gap: 8px;

    .label-desktop {
      @include text-ellipsis(2);
      font-size: 13px;
      color: $text-muted;
      text-transform: uppercase;
      font-weight: 500;
      flex: 1;
      min-width: 0;
    }

    .amount-desktop {
      @include currency-amount;
      font-size: 13px;
      color: $text-color;
      font-weight: 600;
      text-align: right;
      min-width: 80px;
      flex-shrink: 0;
    }

    .input-group-desktop {
      display: flex;
      align-items: center;
      gap: 2px;
      justify-content: flex-end;
      flex-shrink: 0;

      span {
        @include no-line-break;
        font-size: 13px;
        color: $text-muted;
        font-weight: 500;
      }

      .custom-input {
        max-width: 90px;
        border-radius: 4px;
        border: 1px solid $border-color;

        &.discount-input-desktop {
          border-color: #f59e0b;
        }

        &.others-input-desktop {
          border-color: #6366f1;
        }
      }
    }
  }
}

.total-final-desktop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 8px 0;
  margin-top: 12px;
  min-height: 56px;
  gap: 12px;

  .label-total-desktop {
    @include text-ellipsis(1);
    font-size: 18px;
    font-weight: 700;
    color: $text-color;
    text-transform: uppercase;
    flex: 1;
    min-width: 0;
  }

  .amount-total-desktop {
    @include currency-amount;
    font-size: 24px;
    font-weight: 700;
    color: $primary-color;
    flex-shrink: 0;
  }
}

.payment-card-desktop {
  .payment-section-desktop {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px;

    .payment-input-container-desktop {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: center;

      .currency-desktop {
        @include no-line-break;
        font-size: 16px;
        color: $text-muted;
        font-weight: 500;
      }

      .payment-input-desktop {
        width: 120px;
        border: 2px solid $primary-color;
        border-radius: 4px;
        text-align: center;
      }
    }

    .payment-amount-display-desktop {
      @include currency-amount;
      justify-content: center;
      gap: 4px;

      .currency-desktop {
        font-size: 16px;
        color: $text-muted;
        font-weight: 500;
      }

      .payment-amount-desktop {
        font-size: 18px;
        font-weight: 600;
        color: $primary-color;
      }
    }
  }
}
</style>
