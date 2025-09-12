<template>
  <div class="payment-section d-block d-md-none mt-3">
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
            <input
              class="custom-input fw-bold"
              :class="item.field === 'discount' ? 'discount-input' : 'others-input'"
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
            <span class="payment-label">{{ paymentLabel }}</span>
            <div class="payment-input-container">
              <span class="currency">{{ currencySymbol }}</span>
              <input
                class="payment-input"
                type="number"
                :min="paymentMin"
                :step="paymentStep"
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
            <span class="payment-label">{{ changeLabel }}</span>
            <div class="payment-amount-display">
              <span class="currency">{{ currencySymbol }}</span>
              <span class="payment-amount">{{ formatNumber(changeAmount) }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>

  <!-- Version Desktop -->
  <div class="payment-section d-none d-md-block">
    <n-card class="mb-3 totals-card-desktop">
      <template #header>
        <span class="totals-header">{{ title }}</span>
      </template>
      <n-grid cols="3" :x-gap="16">
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
        <n-card class="payment-card-desktop">
          <div class="payment-section-desktop">
            <span class="payment-label-desktop">{{ paymentLabel }}</span>
            <div class="payment-input-container-desktop">
              <span class="currency-desktop">{{ currencySymbol }}</span>
              <input 
                class="payment-input-desktop" 
                type="number" 
                :min="paymentMin" 
                :step="paymentStep"
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
            <span class="payment-label-desktop">{{ changeLabel }}</span>
            <div class="payment-amount-display-desktop">
              <span class="currency-desktop">{{ currencySymbol }}</span>
              <span class="payment-amount-desktop">{{ formatNumber(changeAmount) }}</span>
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
    // Configuración del campo de pago
    paymentLabel: {
      type: String,
      default: "Pago"
    },
    paymentAmount: {
      type: [Number, String],
      default: 0
    },
    paymentMin: {
      type: Number,
      default: 0
    },
    paymentStep: {
      type: Number,
      default: 0.01
    },
    // Configuración del campo de vuelto
    changeLabel: {
      type: String,
      default: "Vuelto"
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
      const columns = [[], [], []];
      const itemsToGroup = [...itemsToShow.value];
      const itemsPerColumn = Math.ceil(itemsToGroup.length / 3);
      for (let i = 0; i < 3; i++) {
        columns[i] = itemsToGroup.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn);
      }
      return columns;
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
      formatNumber
    };
  }
});
</script>

<style lang="scss" scoped>
.custom-input {
  border: none;
  outline: none;
}

.custom-input:hover {
  border-radius: 5px;
  outline: LightBlue solid 2px;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.mobile-totals {
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 14px;
    .label {
      font-weight: 500;
      color: #666;
      white-space: nowrap;
      min-width: 100px;
    }
    .amount {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      text-align: right;
    }
    .input-group {
      display: flex;
      align-items: center;
      gap: 4px;
      span {
        font-weight: 600;
        color: #333;
      }
      .discount-input, .others-input {
        width: 50px;
        padding: 2px 4px;
        text-align: right;
        font-size: 13px;
        border: 1px solid #ddd;
        border-radius: 4px;
        &:focus {
          border-color: #409eff;
          outline: none;
        }
      }
    }
  }
}

.total-final {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  .label-total {
    font-size: 16px;
    font-weight: 700;
    color: #333;
  }
  .amount-total {
    font-size: 18px;
    font-weight: 700;
    color: #52c41a;
  }
}

.payment-card {
  min-width: 0;
  flex: 1;
  .payment-section-mobile {
    text-align: center;
    padding: 8px;
    .payment-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }
    .payment-input-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      white-space: nowrap;
      min-width: fit-content;
      .currency {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        flex-shrink: 0;
      }
      .payment-input {
        width: 80px;
        min-width: 80px;
        padding: 4px 8px;
        font-size: 16px;
        font-weight: 600;
        text-align: center;
        border: 1px solid #ddd;
        border-radius: 4px;
        flex-shrink: 0;
        &:focus {
          border-color: #409eff;
          outline: none;
        }
      }
    }
    .payment-amount-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      white-space: nowrap;
      min-width: fit-content;
      .currency {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        flex-shrink: 0;
      }
      .payment-amount {
        font-size: 16px;
        font-weight: 700;
        color: #409eff;
        flex-shrink: 0;
      }
    }
  }
}

.payment-card-desktop {
  .payment-section-desktop {
    text-align: center;
    padding: 20px 16px;
    .payment-label-desktop {
      display: block;
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .payment-input-container-desktop {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      .currency-desktop {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }
      .payment-input-desktop {
        width: 120px;
        padding: 8px 12px;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        border: 2px solid #ddd;
        border-radius: 6px;
        &:focus {
          border-color: #409eff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }
    }
    .payment-amount-display-desktop {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      .currency-desktop {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }
      .payment-amount-desktop {
        font-size: 20px;
        font-weight: 700;
        color: #409eff;
      }
    }
  }
}

.totals-card-desktop {
  .totals-header {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
}

.desktop-totals-column {
  .total-row-desktop {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 14px;
    .label-desktop {
      font-weight: 500;
      color: #666;
      white-space: nowrap;
      min-width: 100px;
    }
    .amount-desktop {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      text-align: right;
    }
    .input-group-desktop {
      display: flex;
      align-items: center;
      gap: 4px;
      span {
        font-weight: 600;
        color: #333;
      }
      .discount-input-desktop, .others-input-desktop {
        width: 60px;
        padding: 4px 6px;
        text-align: right;
        font-size: 13px;
        border: 1px solid #ddd;
        border-radius: 4px;
        &:focus {
          border-color: #409eff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
        }
      }
    }
  }
}

.total-final-desktop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  .label-total-desktop {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }
  .amount-total-desktop {
    font-size: 22px;
    font-weight: 700;
    color: #52c41a;
  }
}

@media (max-width: 768px) {
  .payment-section .payment-inputs {
    justify-content: flex-start !important;
    flex-direction: column;
  }
  .payment-section .totals {
    align-items: flex-start !important;
  }
}
</style>