<template>
  <div class="table-container">
    <n-scrollbar>
      <n-table class="product-details-table" :bordered="false">
        <thead>
          <tr>
            <th v-if="settingsStore.businessSettings?.sale?.manage_affectations">#</th>
            <th>Cantidad</th>
            <th>Producto</th>
            <th>Precio Unitario</th>
            <th v-if="settingsStore.business_settings?.sale?.show_discount_label">Descuento</th>
            <th>Precio Total</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(menuSet, menuIndex) in saleMenuSets" :key="`menu-${menuIndex}`">
            <tr style="background-color: #f8f8f8; font-weight: bold;">
              <td v-if="settingsStore.businessSettings?.sale?.manage_affectations">
                <n-tag size="small" type="warning">MENÚ</n-tag>
              </td>
              <td>{{ menuSet.quantity }}</td>
              <td>
                <input
                  class="custom-input"
                  v-model="menuSet.name"
                  v-autowidth
                  readonly
                  style="font-weight: bold;"
                />
              </td>
              <td class="currency-input-wrapper">S/. {{ Number(menuSet.price || 0).toFixed(2) }}</td>
              <td v-if="settingsStore.business_settings?.sale?.show_discount_label">S/. 0.00</td>
              <td>S/. {{ (menuSet.quantity * menuSet.price).toFixed(2) }}</td>
            </tr>
          </template>

          <tr v-for="(detail, index) in saleDetails" :key="`product-${index}`">
            <td v-if="settingsStore.businessSettings?.sale?.manage_affectations">
              <n-popselect
                size="small"
                placement="bottom-start"
                v-model:value="detail.product_affectation"
                :disabled="!userStore.hasPermission('change_product_affectation')"
                :options="productStore.affectationsOptions"
                @update:value="handleAffectationChange(detail)"
              >
                <n-tag size="small" :color="getAfcColor(detail.product_affectation)">
                  {{ getAfcShort(detail.product_affectation) }}
                </n-tag>
              </n-popselect>
            </td>
            <td>{{ detail.quantity }}</td>
            <td>
              <input
                class="custom-input product-name-input"
                v-model="detail.product_name"
                v-autowidth
                @click="$event.target.select()"
              />
            </td>
            <td>
              S/.
              <input
                class="custom-input"
                type="number"
                :min="detail.product_affectation === 21 ? 0 : 1"
                step=".5"
                v-model="detail.price_sale"
                v-autowidth
                @click="$event.target.select()"
                :disabled="!settingsStore.business_settings?.sale?.show_discount_label"
                @input="handlePriceInput(detail)"
                @blur="handlePriceBlur(detail)"
                @keydown.enter.prevent="handlePriceBlur(detail)"
              />
            </td>
            <td v-if="settingsStore.business_settings?.sale?.show_discount_label">
              S/.
              <input
                class="custom-input"
                type="number"
                min="0"
                :max="(detail.price_sale || 0) * (detail.quantity || 0)"
                step=".5"
                :disabled="detail.product_affectation === 21 || !!Number(sale.discount)"
                v-model="detail.discount"
                v-autowidth
                @click="$event.target.select()"
                @input="handleDiscountInput(detail)"
                @blur="handleDiscountBlur(detail)"
                @keydown.enter.prevent="handleDiscountBlur(detail)"
              />
            </td>
            <td>
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
import { defineComponent } from "vue";
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

    const DEFAULT_AFFECTATION = 20;

    // Datos de afectaciÃ³n para colores y etiquetas
    const afcData = {
      10: { short: "GRV", color: "#008B8B" },
      20: { short: "EXN", color: "#9932CC" },
      21: { short: "GRT", color: "#006400" },
      default: { short: "---", color: "#8B0000" }
    };

    const getAfcColor = (afc) => {
      const data = afcData[afc] || afcData.default;
      return {
        color: lighten(data.color, 48),
        textColor: data.color,
        borderColor: lighten(data.color, 24)
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
      detail.product_affectation = 21;
      detail.price_sale = formatMoney(0);
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
        detail.product_affectation = DEFAULT_AFFECTATION;
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
      handleDiscountBlur
    };
  }
});
</script>

<style lang="scss" scoped>
.table-container {
  overflow-x: auto;
}

.custom-input {
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  width: auto;
  display: inline-block;
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
</style>


