<template>
  <div class="table-container">
    <n-scrollbar>
      <n-table class="m-auto text-center fs-6 mb-3" :bordered="false">
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
          <tr v-for="(detail, index) in saleDetails" :key="index">
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
                class="custom-input"
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
                @input="handleDiscountChange(detail)"
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
    }
  },
  emits: ["updateDetail"],
  setup(props, { emit }) {
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const userStore = useUserStore();

    // Datos de afectación para colores y etiquetas
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

    const ensureValidPrice = (detail) => {
      let price = normalizeNumber(detail.price_sale);
      if (detail.product_affectation !== 21 && price <= 0) {
        price = 1;
      }
      detail.price_sale = formatMoney(price || (detail.product_affectation === 21 ? 0 : 1));
    };

    const handleAffectationChange = (detail) => {
      if (detail.product_affectation === 21) {
        resetDiscount(detail);
      } else {
        ensureValidPrice(detail);
      }
      emit("updateDetail", detail);
    };

    const handlePriceInput = (detail) => {
      emit("updateDetail", detail);
    };

    const handlePriceBlur = (detail) => {
      ensureValidPrice(detail);
      resetDiscount(detail);
      emit("updateDetail", detail);
    };

    const handleDiscountChange = (detail) => {
      const quantity = normalizeNumber(detail.quantity);
      const price = normalizeNumber(detail.price_sale);
      const maxDiscount = Math.round(quantity * price * 100) / 100;
      let discount = normalizeNumber(detail.discount);

      if (discount > maxDiscount) {
        discount = maxDiscount;
      }

      if (discount < 0) {
        discount = 0;
      }

      const fullDiscount = maxDiscount > 0 && Math.abs(discount - maxDiscount) < 0.001;

      if (fullDiscount) {
        detail.product_affectation = 21;
        resetDiscount(detail);
      } else {
        detail.discount = discount.toFixed(2);
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
      handleDiscountChange
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
