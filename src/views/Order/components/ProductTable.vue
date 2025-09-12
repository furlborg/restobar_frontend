<template>
  <n-table class="m-auto text-center fs-6 mb-3" :bordered="false">
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
      <tr v-for="(detail, index) in saleDetails" :key="index">
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
            min="0" 
            step=".5" 
            v-model="detail.price_sale" 
            @input="handlePriceChange(detail)" 
            v-autowidth 
            @click="$event.target.select()"
          />
        </td>
        <td>
          S/.
          <input 
            class="custom-input" 
            type="number" 
            min="0" 
            :max="!detail.price_sale ? 0 : detail.price_sale" 
            :disabled="detail.product_affectation === 21 || !!Number(sale.discount)" 
            step=".5" 
            v-model="detail.discount" 
            v-autowidth 
            @click="$event.target.select()"
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
  -moz-appearance: textfield;
}
</style>