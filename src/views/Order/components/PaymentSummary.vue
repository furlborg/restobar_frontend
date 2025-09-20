<template>
  <n-card :bordered="false" style="background: white;" embedded>
    <template #header>
      <n-button
        type="info"
        secondary
        :disabled="orderStore.orderList.length === 0"
        @click="handleButtonClick"
      >
        {{ buttonText }}
      </n-button>
    </template>

    <n-input-group>
      <n-auto-complete
        :input-props="{ autocomplete: 'disabled' }"
        v-model:value="localProductSearch"
        :options="productOptions"
        :get-show="(value) => {
          return !!value && productOptions.length > 0;
        }"
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
import { defineComponent, computed } from "vue";
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
    'product-selected'
  ],
  setup(props, { emit }) {
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();

    // Variable local para el buscador de productos
    const localProductSearch = computed({
      get: () => props.productSearch,
      set: (value) => emit('update:productSearch', value)
    });

    const buttonText = computed(() => props.selectProducts ? "Seleccionar productos" : "Cobrar");

    const handleRowClick = (index) => {
      try {
        emit('update:itemIndex', index);
        emit('update:showModal', true);
      } catch (error) {
        console.error('Error en handleRowClick:', error);
      }
    };

    const removeOrderItem = (index) => {
      try {
        orderStore.orderList.splice(index, 1);
        updateOrderDetails();
      } catch (error) {
        console.error('Error en removeOrderItem:', error);
      }
    };

    const updateOrderDetails = () => {
      try {
        saleStore.sale_details = orderStore.orderList;
      } catch (error) {
        console.error('Error en updateOrderDetails:', error);
      }
    };

    const selectProduct = (value) => {
      try {
        emit('product-selected', value);
      } catch (error) {
        console.error('Error en selectProduct:', error);
      }
    };

    const renderLabel = (option) => {
      try {
        // Renderizar las opciones del autocomplete directamente
        // En lugar de emitir, devolvemos el valor formateado
        return option?.label || option?.name || option?.value || "";
      } catch (error) {
        console.error('Error en renderLabel:', error);
        return "";
      }
    };

    const handleButtonClick = () => {
      try {
        console.log('Botón clicked, selectProducts actual:', props.selectProducts, 'enviando:', !props.selectProducts);
        emit('update:selectProducts', !props.selectProducts);
      } catch (error) {
        console.error('Error en handleButtonClick:', error);
      }
    };

    return {
      orderStore,
      saleStore,
      localProductSearch,
      buttonText,
      handleRowClick,
      removeOrderItem,
      updateOrderDetails,
      selectProduct,
      renderLabel,
      handleButtonClick
    };
  }
});
</script>

<style lang="scss" scoped>
.border-top-0 {
  border-top: 0;
}
</style>