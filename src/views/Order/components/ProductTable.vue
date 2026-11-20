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
              <n-tag
                size="small"
                :color="getAfcColor(detail.product_affectation)"
                class="afc-tag"
                :class="{ 'cursor-pointer': userStore.hasPermission('change_product_affectation') }"
                style="cursor: pointer"
                @click="userStore.hasPermission('change_product_affectation') && openFreeModal(detail)"
              >
                {{ getAfcShort(detail.product_affectation) }}
              </n-tag>
            </td>
            <td class="col-qty">{{ detail.quantity }}</td>
            <td class="col-name">
              <input class="custom-input product-name-input" v-model="detail.product_name" v-autowidth
                @click="$event.target.select()" />
              <n-tag v-if="detail.free_reason" size="tiny" type="warning" class="ms-1" round>
                {{ getFreeReasonLabel(detail.free_reason) }}
              </n-tag>
            </td>
            <td class="col-price">
              S/.
              <input class="custom-input price-input" type="number" :min="isFreeAffectation(detail.product_affectation) ? 0 : 1" step=".5"
                v-model="detail.price_sale" v-autowidth @click="$event.target.select()"
                :disabled="isFreeAffectation(detail.product_affectation) || !settingsStore.business_settings?.sale?.show_discount_label"
                @input="handlePriceInput(detail)" @blur="handlePriceBlur(detail)"
                @keydown.enter.prevent="handlePriceBlur(detail)" />
            </td>
            <td v-if="settingsStore.business_settings?.sale?.show_discount_label" class="col-discount">
              S/.
              <input class="custom-input discount-input" type="number" min="0" :max="(detail.price_sale || 0) * (detail.quantity || 0)"
                step=".5" :disabled="isFreeAffectation(detail.product_affectation) || !!Number(sale.discount)"
                v-model="detail.discount" v-autowidth @click="$event.target.select()"
                @input="handleDiscountInput(detail)" @blur="handleDiscountBlur(detail)"
                @keydown.enter.prevent="handleDiscountBlur(detail)" />
            </td>
            <td class="col-total">
              <template v-if="isFreeAffectation(detail.product_affectation)">
                <span class="free-strike">S/. {{ (detail.quantity * (detail.price_sale || 0)).toFixed(2) }}</span>
                <span class="free-zero">0.00</span>
                <div class="free-label">No se cobra</div>
              </template>
              <template v-else>
                {{ (detail.quantity * detail.price_sale - detail.discount).toFixed(2) }}
              </template>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-scrollbar>
    <ItemFreeModal v-model:show="showFreeModal" :detail="activeDetail" @apply="onApplyFree" />
  </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue';
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import { lighten } from "@/utils";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import ItemFreeModal from "@/components/FreeOperation/ItemFreeModal.vue";
import {
  isFreeAffectation,
  getAffectationTag,
  getFreeReasonLabel,
} from "@/utils/freeOperations";

export default defineComponent({
  name: "ProductTable",
  components: {
    ItemFreeModal,
  },
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

    const showFreeModal = ref(false);
    const activeDetail = ref(null);

    const openFreeModal = (detail) => {
      activeDetail.value = detail;
      showFreeModal.value = true;
    };

    const onApplyFree = ({ is_free, product_affectation, free_reason, original_affectation }) => {
      if (!activeDetail.value) return;
      const detail = activeDetail.value;
      detail.original_affectation = original_affectation;
      detail.product_affectation = product_affectation;
      detail.free_reason = free_reason;
      if (is_free) {
        storePreviousPrice(detail);
        detail.discount = 0;
      } else {
        restorePreviousPrice(detail);
      }
      emit("updateDetail", detail);
    };

    const getAfcColor = (afc) => {
      const data = getAffectationTag(afc);
      return {
        color: data.bg,
        textColor: data.color,
        borderColor: data.border
      };
    };

    const getAfcShort = (afc) => {
      return getAffectationTag(afc).short;
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

    const ensureValidPrice = (detail) => {
      const price = normalizeNumber(detail.price_sale);

      if (isFreeAffectation(detail.product_affectation)) {
        // En gratuitas el precio es el valor referencial: no se pone en cero.
        resetDiscount(detail);
        return;
      }

      if (price <= 0) {
        // Un precio 0 no convierte el ítem en gratuito: eso exige motivo y autorización
        // (FLZ-GRA-04). Se restaura el último precio válido.
        restorePreviousPrice(detail);
        return;
      }

      detail.price_sale = formatMoney(price);
    };

    const handlePriceInput = (detail) => {
      if (detail.price_sale === "" || detail.price_sale === null) {
        emit("updateDetail", detail);
        return;
      }

      const price = normalizeNumber(detail.price_sale);

      if (price <= 0) {
        // Se valida en blur; no se cambia la afectación automáticamente.
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

      // Un descuento del 100 % no se convierte en operación gratuita: la gratuidad
      // se registra con motivo y autorización desde el modal de afectación.
      detail.discount = formatMoney(discount).toFixed(2);

      emit("updateDetail", detail);
    };

    return {
      productStore,
      settingsStore,
      userStore,
      getAfcColor,
      getAfcShort,
      handlePriceInput,
      handlePriceBlur,
      handleDiscountInput,
      handleDiscountBlur,
      showFreeModal,
      activeDetail,
      openFreeModal,
      onApplyFree,
      isFreeAffectation,
      getFreeReasonLabel,
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

/* Solo celular: tabla compacta para que se vean precio y total sin deslizar de lado */
@media (max-width: 768px) {
  .product-details-table {
    th {
      padding: 8px 4px !important;
      font-size: 10px !important;
      letter-spacing: 0;
      white-space: normal;
      line-height: 1.15;
    }

    td {
      padding: 7px 4px !important;
      font-size: 12.5px !important;
    }

    .th-afc,
    .col-tag,
    .th-qty,
    .col-qty {
      width: auto !important;
    }

    .col-qty {
      font-size: 13px !important;
    }

    .product-name-input {
      font-size: 12.5px !important;
    }

    .th-price,
    .col-price,
    .th-discount,
    .col-discount,
    .th-total,
    .col-total {
      font-size: 12px !important;
    }

    .th-total,
    .col-total {
      padding-right: 6px !important;
    }

    th {
      word-break: normal !important;
      overflow-wrap: normal !important;
    }

    .th-afc,
    .th-qty {
      white-space: nowrap !important;
    }

    .th-price,
    .th-discount,
    .th-total {
      white-space: normal !important;
    }
  }
}

.free-strike {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 11px;
  display: block;
}

.free-zero {
  font-weight: 700;
  color: #15803d;
}

.free-label {
  font-size: 10px;
  color: #15803d;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
