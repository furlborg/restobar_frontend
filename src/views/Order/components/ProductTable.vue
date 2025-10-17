<template>
  <div class="table-container">
    <n-table class="product-details-table" :bordered="false">
    <thead>
      <tr>
        <th v-if="settingsStore.businessSettings.sale.manage_affectations">#</th>
        <th>Cantidad</th>
        <th>Producto</th>
        <th>Precio Unitario</th>
        <th>Descuento</th>
        <th>Precio Total</th>
      </tr>
    </thead>
    <tbody>
      <!-- Menús -->
      <template v-for="(menuSet, menuIndex) in saleMenuSets" :key="`menu-${menuIndex}`">
        <tr style="background-color: #f8f8f8; font-weight: bold;">
          <td v-if="settingsStore.businessSettings.sale.manage_affectations">
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
          <td>S/. 0.00</td>
          <td>S/. {{ (menuSet.quantity * menuSet.price).toFixed(2) }}</td>
        </tr>
        <!-- Items del menú -->
<!--         <tr v-for="(item, itemIndex) in menuSet.items" :key="`menu-item-${menuIndex}-${itemIndex}`" 
            style="background-color: #fafafa; font-size: 0.9em;">
          <td v-if="settingsStore.businessSettings.sale.manage_affectations"></td>
          <td>{{ item.quantity }}</td>
          <td style="padding-left: 20px;">
            • {{ item.product_name }}
            <small v-if="item.phase_name" style="color: #666;">({{ item.phase_name }})</small>
          </td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr> -->
      </template>

      <!-- Productos individuales -->
      <tr v-for="(detail, index) in saleDetails" :key="`product-${index}`">
        <td v-if="settingsStore.businessSettings.sale.manage_affectations">
          <n-popselect 
            size="small" 
            placement="bottom-start" 
            v-model:value="detail.product_affectation" 
            :options="productStore.affectationsOptions" 
            @update:value="() => $emit('updateDetail', detail)"
          >
            <n-tag
              size="small"
              :color="getAfcColor(detail.product_affectation)"
            >
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
            <div class="currency-input-wrapper">
              <span class="currency-symbol">S/.</span>
              <input
                class="custom-input price-input" 
                type="number"
                min="0"
                step="0.1"
                v-model="detail.price_sale"
                @input="handlePriceChange(detail)"
                v-autowidth
                @click="$event.target.select()"
              />
            </div>
          </td>
          <td>
            <div class="currency-input-wrapper">
              <span class="currency-symbol">S/.</span>
              <input
                class="custom-input discount-input"
                type="number"
                min="0"
                :max="!detail.price_sale ? 0 : detail.price_sale" 
                :disabled="detail.product_affectation === 21 || !!Number(sale.discount)" 
                step="0.1"
                v-model="detail.discount"
                v-autowidth
                @click="$event.target.select()"
              />
            </div>
          </td>
          <td class="total-cell">
            S/. {{ 
              detail.product_affectation === 21 
                ? "0.00" 
                : (detail.quantity * detail.price_sale - detail.discount).toFixed(2) 
            }}
          </td>
        </tr>
      </tbody>
    </n-table>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
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
  emits: ['updateDetail'],
  setup(props, { emit }) {
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();

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

    const handlePriceChange = (detail) => {
      emit('updateDetail', detail);
      detail.discount = parseFloat(0).toFixed(2);
    };

    return {
      productStore,
      settingsStore,
      getAfcColor,
      getAfcShort,
      handlePriceChange
    };
  }
});
</script>

<style lang="scss" scoped>
/* Solo lo esencial que NaiveUI no puede manejar */
.table-container {
  overflow-x: auto;
}

.product-details-table {
  min-width: 800px;
}

.currency-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.custom-input {
  border: none;
  outline: none;

  &:hover {
    outline: 2px solid #3b82f6;
  }
}

/* Remover controles de número */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>