<template>
  <div class="table-container">
    <n-scrollbar>
      <n-table class="product-details-table" :bordered="false">
        <thead>
          <tr>
            <th v-if="settingsStore.businessSettings?.sale?.manage_affectations" class="th-afc">#</th>
            <th class="th-qty">Cantidad</th>
            <th class="th-product">Producto</th>
            <th class="th-price">Precio Unitario</th>
            <th v-if="settingsStore.business_settings?.sale?.show_discount_label" class="th-discount">Descuento</th>
            <th class="th-total">Precio Total</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(menuSet, menuIndex) in saleMenuSets" :key="`menu-${menuIndex}`">
            <tr style="background-color: #f8f8f8; font-weight: bold;">
              <td v-if="settingsStore.businessSettings?.sale?.manage_affectations" class="col-tag">
                <n-tag size="small" :type="menuSet.from_combo || menuSet.set_type === 'COMBO' || menuSet.combo_id ? 'info' : 'warning'">
                  {{ menuSet.from_combo || menuSet.set_type === 'COMBO' || menuSet.combo_id ? 'COMBO' : 'MENÚ' }}
                </n-tag>
              </td>
              <td class="col-qty">{{ menuSet.quantity }}</td>
              <td class="col-name">
                <input class="custom-input product-name-input" v-model="menuSet.name" v-autowidth readonly style="font-weight: bold;" />
              </td>
              <td class="currency-input-wrapper col-price">S/. {{ Number(menuSet.price || 0).toFixed(2) }}</td>
              <td v-if="settingsStore.business_settings?.sale?.show_discount_label" class="col-discount">S/. 0.00</td>
              <td class="col-total">S/. {{ (menuSet.quantity * menuSet.price).toFixed(2) }}</td>
            </tr>
          </template>

          <tr v-for="(detail, index) in saleDetails" :key="`product-${index}`">
            <td v-if="settingsStore.businessSettings?.sale?.manage_affectations" class="col-tag">
              <n-popselect size="small" placement="bottom-start" v-model:value="detail.product_affectation"
                :disabled="!userStore.hasPermission('change_product_affectation')" :options="menuAffectationOptions"
                @update:value="handleAffectationChange(detail)">
                <n-tag size="small" :color="getAfcColor(detail.product_affectation)">
                  {{ getAfcShort(detail.product_affectation) }}
                </n-tag>
              </n-popselect>
            </td>
            <td class="col-qty">{{ detail.quantity }}</td>
            <td class="col-name">
              <input class="custom-input product-name-input" v-model="detail.product_name" v-autowidth
                @click="$event.target.select()" />
            </td>
            <td class="col-price">
              S/.
              <input class="custom-input price-input" type="number" :min="detail.product_affectation === 21 ? 0 : 1" step=".5"
                v-model="detail.price_sale" v-autowidth @click="$event.target.select()"
                :disabled="!settingsStore.business_settings?.sale?.show_discount_label"
                @input="handlePriceInput(detail)" @blur="handlePriceBlur(detail)"
                @keydown.enter.prevent="handlePriceBlur(detail)" />
            </td>
            <td v-if="settingsStore.business_settings?.sale?.show_discount_label" class="col-discount">
              S/.
              <input class="custom-input discount-input" type="number" min="0" :max="(detail.price_sale || 0) * (detail.quantity || 0)"
                step=".5" :disabled="detail.product_affectation === 21 || !!Number(sale.discount)"
                v-model="detail.discount" v-autowidth @click="$event.target.select()"
                @input="handleDiscountInput(detail)" @blur="handleDiscountBlur(detail)"
                @keydown.enter.prevent="handleDiscountBlur(detail)" />
            </td>
            <td class="col-total">
              {{
                detail.product_affectation === 21
                  ? "0.00"
                  : (detail.quantity * detail.price_sale - detail.discount).toFixed(2)
              }}
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-scrollbar>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import { lighten } from "@/utils";
import { directive as VueInputAutowidth } from "vue-input-autowidth";

export default defineComponent({
  name: "ProductTable",
  directives: {
    autowidth: VueInputAutowidth
  },
  props: {
    sale: {
      type: Object,
      required: true
    },
    saleDetails: {
      type: Array,
      required: true
    },
    saleMenuSets: {
      type: Array,
      default: () => []
    }
  },
  emits: ["updateDetail"],
  setup(props, { emit }) {
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const userStore = useUserStore();

    const DEFAULT_AFFECTATION = computed(() => settingsStore.businessSettings.sale?.default_affectation || 20);

    // Datos de afectación para colores y etiquetas
    const afcData = {
      10: { short: "GRV", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
      20: { short: "EXN", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
      21: { short: "GRT", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
      default: { short: "---", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" }
    };

    const getAfcColor = (afc) => {
      const data = afcData[afc] || afcData.default;
      return {
        color: data.bg,
        textColor: data.color,
        borderColor: data.border
      };
    };

    const getAfcShort = (afc) => {
      return (afcData[afc] || afcData.default).short;
    };

    const normalizeNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatMoney = (value) => Math.round(value * 100) / 100;

    const resetDiscount = (detail) => {
      detail.discount = parseFloat(0).toFixed(2);
    };

    const storePreviousPrice = (detail) => {
      const price = normalizeNumber(detail.price_sale);
      if (price > 0) {
        detail._last_price_sale = formatMoney(price);
      }
    };

    const restorePreviousPrice = (detail) => {
      const lastPrice = normalizeNumber(detail._last_price_sale);
      const price = lastPrice > 0 ? lastPrice : 1;
      detail.price_sale = formatMoney(price);
    };

    const applyTransferenciaGratuita = (detail) => {
      storePreviousPrice(detail);
      //console.info(detail)
      detail.product_affectation = 21;
      //detail.price_sale = formatMoney(0);
      resetDiscount(detail);
    };

    const ensureValidPrice = (detail, { fromAffectationChange = false } = {}) => {
      const price = normalizeNumber(detail.price_sale);

      if (detail.product_affectation === 21) {
        detail.price_sale = formatMoney(0);
        resetDiscount(detail);
        return;
      }

      if (price <= 0) {
        if (fromAffectationChange) {
          restorePreviousPrice(detail);
        } else {
          applyTransferenciaGratuita(detail);
        }
        return;
      }

      detail.price_sale = formatMoney(price);
    };

    const handleAffectationChange = (detail) => {
      if (detail.product_affectation === 21) {
        applyTransferenciaGratuita(detail);
      } else {
        restorePreviousPrice(detail);
        ensureValidPrice(detail, { fromAffectationChange: true });
      }
      emit("updateDetail", detail);
    };

    const handlePriceInput = (detail) => {
      if (detail.price_sale === "" || detail.price_sale === null) {
        emit("updateDetail", detail);
        return;
      }

      const price = normalizeNumber(detail.price_sale);

      if (price <= 0) {
        applyTransferenciaGratuita(detail);
      } else if (detail.product_affectation === 21) {
        detail.product_affectation = DEFAULT_AFFECTATION.value;
        detail.price_sale = formatMoney(price);
        storePreviousPrice(detail);
        resetDiscount(detail);
      }
      emit("updateDetail", detail);
    };

    const handlePriceBlur = (detail) => {
      ensureValidPrice(detail);
      resetDiscount(detail);
      emit("updateDetail", detail);
    };

    const getMaxDiscount = (detail) => {
      const quantity = normalizeNumber(detail.quantity);
      const price = normalizeNumber(detail.price_sale);
      return formatMoney(quantity * price);
    };

    const handleDiscountInput = (detail) => {
      emit("updateDetail", detail);
    };

    const handleDiscountBlur = (detail) => {
      const maxDiscount = getMaxDiscount(detail);
      let discount = normalizeNumber(detail.discount);

      if (discount > maxDiscount) {
        discount = maxDiscount;
      }

      if (discount < 0) {
        discount = 0;
      }

      const fullDiscount = maxDiscount > 0 && Math.abs(discount - maxDiscount) < 0.001;

      if (fullDiscount) {
        applyTransferenciaGratuita(detail);
      } else {
        detail.discount = formatMoney(discount).toFixed(2);
      }

      emit("updateDetail", detail);
    };

    const menuAffectationOptions = computed(() => {
      const options = productStore.affectationsOptions;
      return options.filter(opt => opt.value === 21)
    });

    return {
      productStore,
      settingsStore,
      userStore,
      getAfcColor,
      getAfcShort,
      handleAffectationChange,
      handlePriceInput,
      handlePriceBlur,
      handleDiscountInput,
      handleDiscountBlur,
      menuAffectationOptions
    };
  }
});
</script>

<style lang="scss" scoped>
.table-container {
  overflow-x: auto;
  width: 100%;
}

.product-details-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  th {
    padding: 10px 10px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 5;
    white-space: nowrap;
  }

  td {
    padding: 9px 10px;
    font-size: 13.5px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .th-afc,
  .col-tag {
    text-align: center;
    width: 48px;
  }

  .th-qty,
  .col-qty {
    text-align: center;
    font-weight: 800;
    font-size: 14.5px;
    color: #0f172a;
    width: 65px;
  }

  .th-product,
  .col-name {
    text-align: left;
  }

  .product-name-input {
    font-weight: 700;
    font-size: 14px;
    color: #0f172a;
    text-align: left;
    max-width: 100%;
  }

  .th-price,
  .col-price {
    text-align: center;
    font-weight: 600;
    font-size: 13.5px;
    color: #334155;
    white-space: nowrap;
  }

  .th-discount,
  .col-discount {
    text-align: center;
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
  }

  .th-total,
  .col-total {
    text-align: right;
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    padding-right: 14px;
  }
}

.custom-input {
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  width: auto;
  display: inline-block;
  font-family: inherit;
  font-size: inherit;
  padding: 3px 6px;
  transition: all 0.15s ease;
}

.custom-input:hover,
.custom-input:focus {
  border-radius: 6px;
  outline: #fdba74 solid 2px;
  background: #ffffff;
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
</style>
