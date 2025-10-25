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
              <td>
                  <span>{{ order.product_name }}</span><br>
                  <span v-if="order?.indication.length > 0">
                   {{ order.indication.map(dt => dt?.description.split(", ")).flat().join(", ") }}
                   </span> <br v-if="order?.indication.length > 0">
              </td>
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
import { defineComponent, computed, ref, h } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useProductStore } from "@/store/modules/product";
import { useMessage } from "naive-ui";
import { searchProductByName, searchProductPrice } from "@/api/modules/products";
import ProductSearchLabel from "@/views/Product/components/ProductSearchLabel.vue";

export default defineComponent({
  name: "PaymentSummary",
  components: {
    ProductSearchLabel
  },
  props: {
    selectProducts: {
      type: Boolean,
      required: true
    },
    productSearch: {
      type: String,
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
    const productStore = useProductStore();
    const message = useMessage();

    const products = ref([]);
    const searching = ref(false);

    // Variable local para el buscador de productos
    const localProductSearch = computed({
      get: () => props.productSearch,
      set: (value) => emit('update:productSearch', value)
    });

    const buttonText = computed(() => props.selectProducts ? "Seleccionar productos" : "Cobrar");

    // Opciones del producto para el autocompletar (igual que TableOrder)
    const productOptions = computed(() => products.value.map((product) => ({
      value: product.id,
      label: product.name,
      disabled: product.is_disabled,
      category: productStore.getCategorieDescription(product.category),
      stock: product.stock,
      price: parseFloat(product.prices).toFixed(2),
    })));

    // Función para mostrar opciones cuando se busca (igual que TableOrder)
    const showOptions = (value) => {
      const priceRegex = /^\d+(\.\d{0,2})?$/;
      if (priceRegex.test(value)) {
        searching.value = true;
        searchProductPrice(value)
          .then((response) => {
            if (response.status === 200) {
              products.value = response.data;
            }
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            searching.value = false;
          });
        return true;
      }
      if (value.length >= 3) {
        searching.value = true;
        searchProductByName(value)
          .then((response) => {
            if (response.status === 200) {
              products.value = response.data;
            }
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            searching.value = false;
          });
        return true;
      }
      return false;
    };

    const selectProductInternal = (id) => {
      const item = products.value.find(product => product.id === id);
      if (item && item.has_supplies && item.has_stock) {
        orderStore.addOrder(item);
        emit('update:productSearch', '');
      }
    };

    const renderLabel = (option) => {
      return h(ProductSearchLabel, { option });
    };

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
          orderStore.removeOrder(index);
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
        selectProductInternal(value);
      } catch (error) {
        console.error('Error en selectProduct:', error);
      }
    };

    const handleButtonClick = () => {
      try {
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
      productOptions,
      searching,
      showOptions,
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