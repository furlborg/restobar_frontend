<template>
  <div class="payment-section d-block d-md-none my-3">
    <n-card class="mb-3" size="small">
      <template #header>
        <span class="fw-bold">Resumen de Venta</span>
      </template>
      <div class="mobile-totals">
        <div v-for="(item, index) in itemsToShow" :key="index" class="total-row">
          <span class="label">{{ item.label }}:</span>
          <span v-if="!item.editable" class="amount">{{ currencySymbol }} {{ formatNumber(item.value) }}</span>
          <div v-else class="input-group">
            <span>{{ currencySymbol }}</span>
            <input
              class="custom-input fw-bold"
              :class="item.field === 'discount' ? 'discount-input' : 'others-input'"
              type="number"
              :min="item.min || 0"
              :step="item.step || 0.5"
              :value="item.value"
              :disabled="item.disabled"
              @input="$emit('valueChanged', { field: item.field, value: $event.target.value })"
              @click="$event.target.select()"
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
              <input
                class="payment-input"
                type="number"
                :min="paymentMin"
                step="0.1"
                :value="paymentAmount"
                @input="$emit('paymentChanged', $event.target.value)"
                @click="$event.target.select()"
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
        <span class="totals-header">Resumen de Venta</span>
      </template>
      <n-grid :cols="groupedItems.length" :x-gap="16">
        <n-gi v-for="(column, colIndex) in groupedItems" :key="colIndex">
          <div class="desktop-totals-column">
            <div v-for="(item, itemIndex) in column" :key="itemIndex" class="total-row-desktop">
              <span class="label-desktop">{{ item.label }}:</span>
              <span v-if="!item.editable" class="amount-desktop">{{ currencySymbol }} {{ formatNumber(item.value) }}</span>
              <div v-else class="input-group-desktop">
                <span>{{ currencySymbol }}</span>
                <input
                  class="custom-input fw-bold"
                  :class="item.field === 'discount' ? 'discount-input-desktop' : 'others-input-desktop'"
                  type="number"
                  :min="item.min || 0"
                  :step="item.step || 0.1"
                  :value="item.value"
                  :disabled="item.disabled"
                  @input="$emit('valueChanged', { field: item.field, value: $event.target.value })"
                  @click="$event.target.select()"
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
              <input
                class="payment-input-desktop"
                type="number"
                :min="paymentMin"
                step="0.1"
                :value="paymentAmount"
                @input="$emit('paymentChanged', $event.target.value)"
                @click="$event.target.select()"
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

export default defineComponent({
  name: "PaymentTotals",
  props: {
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
    
    return {
      itemsToShow,
      groupedItems,
      calculatedChange,
      formatNumber
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
$shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);

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
      min-height: 40px; // Altura mínima para evitar colapso
      
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
          width: 80px;
          padding: 4px 8px;
          border: 1px solid $border-color;
          border-radius: 4px;
          font-size: 14px;
          text-align: right;
          background: white;
          flex-shrink: 0;

          &.discount-input {
            border-color: #f59e0b;
            &:focus {
              border-color: #f59e0b;
              box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
            }
          }

          &.others-input {
            border-color: #6366f1;
            &:focus {
              border-color: #6366f1;
              box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
            }
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
        width: 70px;
        padding: 3px 6px;
        border: 1px solid $border-color;
        border-radius: 4px;
        font-size: 13px;
        text-align: right;
        background: white;
        flex-shrink: 0;

        &.discount-input-desktop {
          border-color: #f59e0b;
          &:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
          }
        }

        &.others-input-desktop {
          border-color: #6366f1;
          &:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
          }
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
        padding: 10px 12px;
        border: 2px solid $primary-color;
        border-radius: 6px;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        background: white;
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

// Efectos hover para inputs
.custom-input,
.payment-input,
.payment-input-desktop {
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: $primary-color;
  }
}

// Responsividad adicional
@media (max-width: 768px) {
  .payment-section {
    .mobile-totals {
      .total-row {
        padding: 10px 0;
        min-height: 36px;

        .label {
          font-size: 13px;
          line-height: 1.3;
        }

        .amount {
          font-size: 13px;
        }

        .input-group {
          gap: 1px; // Reducido aún más para pantallas pequeñas
          
          .custom-input {
            width: 65px; // Más pequeño en pantallas muy pequeñas
            font-size: 13px;
            padding: 3px 6px;
          }
        }
      }
    }

    .total-final {
      min-height: 44px;
      
      .label-total {
        font-size: 15px;
      }

      .amount-total {
        font-size: 18px;
      }
    }

    .payment-card .payment-section-mobile {
      padding: 12px 6px; // Reducido en pantallas pequeñas

      .payment-label {
        font-size: 11px;
        line-height: 1.2;
        min-height: 20px;
      }

      .payment-input-container {
        gap: 1px;
        
        .payment-input {
          width: 85px; // Más pequeño
          font-size: 15px;
          padding: 6px;
        }
      }

      .payment-amount-display {
        gap: 1px;
        
        .payment-amount {
          font-size: 15px;
        }
      }
    }
  }
}

// Pantallas muy pequeñas (móviles en orientación vertical)
@media (max-width: 480px) {
  .payment-section {
    .mobile-totals {
      .total-row {
        .input-group .custom-input {
          width: 60px;
          font-size: 12px;
        }
      }
    }

    .payment-card .payment-section-mobile {
      .payment-input-container .payment-input {
        width: 80px;
        font-size: 14px;
      }

      .payment-label {
        font-size: 10px;
      }
    }
  }
}

// Pantallas medianas (tablets)
@media (min-width: 769px) and (max-width: 1024px) {
  .desktop-totals-column {
    .total-row-desktop {
      gap: 6px;

      .input-group-desktop {
        gap: 1px;
        
        .custom-input {
          width: 65px;
        }
      }
    }
  }

  .payment-card-desktop {
    .payment-section-desktop {
      .payment-input-container-desktop {
        gap: 2px;
        
        .payment-input-desktop {
          width: 110px;
          font-size: 16px;
        }
      }
    }
  }
}

// Animaciones suaves
.payment-section {
  transition: all 0.3s ease-in-out;
}

:deep(.n-card) {
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

:deep(.n-divider) {
  margin: 12px 0;
}
</style>