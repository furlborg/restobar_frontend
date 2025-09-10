<template>
  <!-- Version Mobile -->
  <div class="payment-section d-block d-md-none">
    <n-card class="my-3" size="small">
      <template #header>
        <span class="fw-bold">Resumen de Venta</span>
      </template>
      <div class="mobile-totals">
        <div v-if="subTotal" class="total-row">
          <span class="label">SUBTOTAL:</span>
          <span class="amount">S/. {{ subTotal.toFixed(2) }}</span>
        </div>
        <div v-if="totalGrv" class="total-row">
          <span class="label">OP. GRAVADAS:</span>
          <span class="amount">S/. {{ totalGrv.toFixed(2) }}</span>
        </div>
        <div v-if="totalExn" class="total-row">
          <span class="label">OP. EXONERADAS:</span>
          <span class="amount">S/. {{ totalExn.toFixed(2) }}</span>
        </div>
        <div v-if="totalGrt" class="total-row">
          <span class="label">OP. GRATUITAS:</span>
          <span class="amount">S/. {{ totalGrt.toFixed(2) }}</span>
        </div>
        <div v-if="totalIgv" class="total-row">
          <span class="label">IGV:</span>
          <span class="amount">S/. {{ totalIgv.toFixed(2) }}</span>
        </div>
        <div v-if="icbper" class="total-row">
          <span class="label">ICBPER:</span>
          <span class="amount">S/. {{ icbper.toFixed(2) }}</span>
        </div>
        <div v-if="!!sale.delivery_info" class="total-row" key="delivery">
          <span class="label">DELIVERY:</span>
          <div class="input-group">
            <span>S/.</span>
            <input 
              class="custom-input fw-bold delivery-input" 
              type="number" 
              min="0" 
              step=".1"
              :value="sale.delivery_info.amount"
              @input="handleDeliveryAmountChange"
              @click="$event.target.select()"
            />
          </div>
        </div>
        <div class="total-row">
          <span class="label">DSCT:</span>
          <div class="input-group">
            <span>S/.</span>
            <input 
              class="custom-input fw-bold discount-input" 
              type="number" 
              min="0" 
              step=".5" 
              :value="totalDsct"
              @input="handleDiscountChange"
              :disabled="saleStore.toSale.some(d => Number(d.discount) > 0)" 
              @click="$event.target.select()"
            />
          </div>
        </div>
        <div class="total-row">
          <span class="label">OTROS:</span>
          <div class="input-group">
            <span>S/.</span>
            <input 
              class="custom-input fw-bold others-input" 
              type="number" 
              min="0" 
              step=".1"
              :value="sale.other_charges"
              @input="handleOtherChargesChange"
              @click="$event.target.select()"
            />
          </div>
        </div>
      </div>
      <n-divider />
      <div class="total-final">
        <span class="label-total">TOTAL:</span>
        <span class="amount-total">S/. {{ sale.amount }}</span>
      </div>
    </n-card>
    <n-grid cols="2" :x-gap="12">
      <n-gi>
        <n-card size="small" class="payment-card">
          <div class="payment-section-mobile">
            <span class="payment-label">Pago</span>
            <div class="payment-input-container">
              <span class="currency">S/.</span>
              <input 
                class="payment-input" 
                type="number" 
                min="0" 
                step=".01"
                :value="sale.given_amount"
                @input="handleGivenAmountChange"
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
              <span class="currency">S/.</span>
              <span class="payment-amount">{{ changing.toFixed(2) }}</span>
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
        <span class="totals-header">Resumen de Venta</span>
      </template>
      <n-grid cols="3" :x-gap="16">
        <n-gi>
          <div class="desktop-totals-column">
            <div v-if="subTotal" class="total-row-desktop">
              <span class="label-desktop">SUBTOTAL:</span>
              <span class="amount-desktop">S/. {{ subTotal.toFixed(2) }}</span>
            </div>
            <div v-if="totalGrv" class="total-row-desktop">
              <span class="label-desktop">OP. GRAVADAS:</span>
              <span class="amount-desktop">S/. {{ totalGrv.toFixed(2) }}</span>
            </div>
            <div v-if="totalExn" class="total-row-desktop">
              <span class="label-desktop">OP. EXONERADAS:</span>
              <span class="amount-desktop">S/. {{ totalExn.toFixed(2) }}</span>
            </div>
          </div>
        </n-gi>
        <n-gi>
          <div class="desktop-totals-column">
            <div v-if="totalGrt" class="total-row-desktop">
              <span class="label-desktop">OP. GRATUITAS:</span>
              <span class="amount-desktop">S/. {{ totalGrt.toFixed(2) }}</span>
            </div>
            <div v-if="totalIgv" class="total-row-desktop">
              <span class="label-desktop">IGV:</span>
              <span class="amount-desktop">S/. {{ totalIgv.toFixed(2) }}</span>
            </div>
            <div v-if="icbper" class="total-row-desktop">
              <span class="label-desktop">ICBPER:</span>
              <span class="amount-desktop">S/. {{ icbper.toFixed(2) }}</span>
            </div>
          </div>
        </n-gi>
        <n-gi>
          <div class="desktop-totals-column">
            <div v-if="!!sale.delivery_info" class="total-row-desktop" key="delivery">
              <span class="label-desktop">DELIVERY:</span>
              <div class="input-group-desktop">
                <span>S/.</span>
                <input 
                  class="custom-input fw-bold delivery-input-desktop" 
                  type="number" 
                  min="0" 
                  step=".1"
                  :value="sale.delivery_info.amount"
                  @input="handleDeliveryAmountChange"
                  @click="$event.target.select()"
                />
              </div>
            </div>
            <div class="total-row-desktop">
              <span class="label-desktop">DSCT:</span>
              <div class="input-group-desktop">
                <span>S/.</span>
                <input 
                  class="custom-input fw-bold discount-input-desktop" 
                  type="number" 
                  min="0" 
                  step=".5"
                  :value="totalDsct"
                  @input="handleDiscountChange"
                  :disabled="saleStore.toSale.some(d => Number(d.discount) > 0)"
                  @click="$event.target.select()" 
                />
              </div>
            </div>
            <div class="total-row-desktop">
              <span class="label-desktop">OTROS:</span>
              <div class="input-group-desktop">
                <span>S/.</span>
                <input 
                  class="custom-input fw-bold others-input-desktop" 
                  type="number" 
                  min="0" 
                  step=".1"
                  :value="sale.other_charges"
                  @input="handleOtherChargesChange"
                  @click="$event.target.select()" 
                />
              </div>
            </div>
          </div>
        </n-gi>
      </n-grid>
      <n-divider />
      <div class="total-final-desktop">
        <span class="label-total-desktop">TOTAL:</span>
        <span class="amount-total-desktop">S/. {{ sale.amount }}</span>
      </div>
    </n-card>
    <n-grid cols="2" :x-gap="16">
      <n-gi>
        <n-card class="payment-card-desktop">
          <div class="payment-section-desktop">
            <span class="payment-label-desktop">Pago</span>
            <div class="payment-input-container-desktop">
              <span class="currency-desktop">S/.</span>
              <input 
                class="payment-input-desktop" 
                type="number" 
                min="0" 
                step=".01"
                :value="sale.given_amount"
                @input="handleGivenAmountChange"
                @click="$event.target.select()" 
              />
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="payment-card-desktop">
          <div class="payment-section-desktop">
            <span class="payment-label-desktop">Vuelto</span>
            <div class="payment-amount-display-desktop">
              <span class="currency-desktop">S/.</span>
              <span class="payment-amount-desktop">{{ changing.toFixed(2) }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useSaleStore } from "@/store/modules/sale";

export default defineComponent({
  name: "PaymentTotals",
  props: {
    sale: {
      type: Object,
      required: true
    },
    changing: {
      type: Number,
      required: true
    },
    subTotal: {
      type: Number,
      required: true
    },
    totalGrv: {
      type: Number,
      required: true
    },
    totalExn: {
      type: Number,
      required: true
    },
    totalGrt: {
      type: Number,
      required: true
    },
    totalIgv: {
      type: Number,
      required: true
    },
    icbper: {
      type: Number,
      required: true
    },
    totalDsct: {
      type: Number,
      required: true
    }
  },
  emits: ['update:sale'],
  setup(props, { emit }) {
    const saleStore = useSaleStore();

    const updateSaleField = (field, value) => {
      const updatedSale = { ...props.sale };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updatedSale[parent] = { ...updatedSale[parent], [child]: value };
      } else {
        updatedSale[field] = value;
      }
      emit('update:sale', updatedSale);
    };

    const handleGivenAmountChange = (event) => {
      updateSaleField('given_amount', event.target.value);
    };

    const handleDeliveryAmountChange = (event) => {
      updateSaleField('delivery_info.amount', event.target.value);
    };

    const handleDiscountChange = (event) => {
      updateSaleField('discount', event.target.value);
    };

    const handleOtherChargesChange = (event) => {
      updateSaleField('other_charges', event.target.value);
    };

    return {
      saleStore,
      handleGivenAmountChange,
      handleDeliveryAmountChange,
      handleDiscountChange,
      handleOtherChargesChange
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
  appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.fw-bold {
  font-weight: bold;
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
      .discount-input, .others-input, .delivery-input {
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
      .discount-input-desktop, .others-input-desktop, .delivery-input-desktop {
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