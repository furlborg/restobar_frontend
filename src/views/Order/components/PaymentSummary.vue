<template>
  <n-card class="h-100" :bordered="false" embedded>
    <template #header>
      <n-button 
        type="info" 
        secondary 
        @click="$emit('update:selectProducts', !selectProducts)"
      >
        {{ selectProducts ? "Seleccionar productos" : "Cobrar" }}
      </n-button>
    </template>

    <!-- Búsqueda de productos -->
    <n-input-group>
      <n-auto-complete 
        :input-props="{ autocomplete: 'disabled' }"
        :value="productSearch"
        @update:value="$emit('update:productSearch', $event)"
        :options="productOptions" 
        :get-show="showOptions" 
        :loading="searching"
        clear-after-select 
        :render-label="renderLabel" 
        placeholder="Buscar producto"
        @select="selectProduct"
      />
    </n-input-group>

    <!-- Lista de productos ordenados -->
    <n-scrollbar :x-scrollable="true" style="max-width: 900px">
      <n-table class="mt-3">
        <thead>
          <tr>
            <th width="10%"></th>
            <th width="40%">Producto</th>
            <th width="25%">Cantidad</th>
            <th width="15%">SubTotal</th>
            <th width="10%"></th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(order, index) in orderStore.orderList" 
            :key="index" 
            style="cursor: pointer" 
            @click="handleRowClick(index)"
          >
            <td>
              <n-button type="info" text>
                <v-icon name="md-listalt-round"/>
              </n-button>
            </td>
            <td>{{ order.product_name }}</td>
            <td>
              <n-input-number 
                class="border-top-0" 
                size="small" 
                :min="1" 
                v-model:value="order.quantity" 
                @update:value="updateOrderDetails" 
                @click.stop
              />
            </td>
            <td>S/. {{ order.subTotal.toFixed(2) }}</td>
            <td>
              <n-button 
                type="error" 
                text 
                @click.stop="removeOrderItem(index)"
              >
                <v-icon name="md-disabledbydefault-round"/>
              </n-button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"></td>
            <td colspan="2" class="fs-6 fw-bold">
              S/. {{ orderStore.orderTotal.toFixed(2) }}
            </td>
          </tr>
        </tfoot>
      </n-table>
    </n-scrollbar>
  </n-card>
</template>

<script>
import { defineComponent } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";

export default defineComponent({
  name: "PaymentSummary",
  props: {
    selectProducts: {
      type: Boolean,
      required: true
    },
    productSearch: {
      type: String,
      required: true
    },
    productOptions: {
      type: Array,
      required: true
    },
    searching: {
      type: Boolean,
      required: true
    },
    showModal: {
      type: Boolean,
      required: true
    },
    itemIndex: {
      type: [Number, null],
      default: null
    }
  },
  emits: [
    'update:selectProducts',
    'update:productSearch', 
    'update:showModal',
    'update:itemIndex',
    'showOptions',
    'selectProduct',
    'renderLabel'
  ],
  setup(props, { emit }) {
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();

    const handleRowClick = (index) => {
      emit('update:itemIndex', index);
      emit('update:showModal', true);
    };

    const removeOrderItem = (index) => {
      orderStore.orderList.splice(index, 1);
      updateOrderDetails();
    };

    const updateOrderDetails = () => {
      saleStore.sale_details = orderStore.orderList;
    };

    const showOptions = (value) => {
      return emit('showOptions', value);
    };

    const selectProduct = (value) => {
      emit('selectProduct', value);
    };

    const renderLabel = (option) => {
      return emit('renderLabel', option);
    };

    return {
      orderStore,
      saleStore,
      handleRowClick,
      removeOrderItem,
      updateOrderDetails,
      showOptions,
      selectProduct,
      renderLabel
    };
  }
});
</script>

<style lang="scss" scoped>
.border-top-0 {
  border-top: 0;
}
</style>