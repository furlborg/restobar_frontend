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
          <!-- Menús -->
          <template v-for="(menu, menuIndex) in orderStore.menuSets" :key="`menu-${menuIndex}`">
            <tr style="background-color: #f8f8f8">
              <td>
                <n-button type="warning" text>
                  <v-icon name="md-restaurant-round"/>
                </n-button>
              </td>
              <td><b>Menú: {{ menu.name }}</b></td>
              <td></td>
<!--               <td>
                <n-input-number
                  class="border-top-0"
                  size="small"
                  :min="1"
                  v-model:value="menu.quantity"
                  @update:value="updateOrderDetails"
                  @click.stop
                />
              </td> -->
              <td>S/. {{ formatPrice(menu.price * menu.quantity)}}</td>
              <td>
                <n-button type="error" text @click.stop="removeMenuSet(menuIndex)">
                  <v-icon name="md-disabledbydefault-round" />
                </n-button>
              </td>
            </tr>
            <!-- Items del menú -->
            <tr v-for="item in menu.items" :key="`menu-item-${item.product_id}`" style="background-color: #fafafa">
              <td></td>
              <td style="padding-left: 20px;">
                {{ item.product_name }} 
                <small v-if="item.phase_name">({{ item.phase_name }})</small>
              </td>
              <td>{{ item.quantity }}</td>
              <td></td>
              <td></td>
            </tr>
          </template>

          <!-- Productos individuales -->
          <template v-for="(product, productIndex) in orderStore.productLines" :key="`product-${productIndex}`">
            <tr style="cursor: pointer" @click="handleRowClick(productIndex)">
              <td>
                <n-button type="info" text>
                  <v-icon name="md-listalt-round"/>
                </n-button>
              </td>
              <td>{{ product.product_name }}</td>
              <td>
                <n-input-number
                  class="border-top-0"
                  size="small"
                  :min="1"
                  v-model:value="product.quantity"
                  @update:value="updateOrderDetails"
                  @click.stop
                />
              </td>
              <td>S/. {{ formatPrice(product.subTotal) }}</td>
              <td>
                <n-button type="error" text @click.stop="removeProductLine(productIndex)">
                  <v-icon name="md-disabledbydefault-round" />
                </n-button>
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"></td>
            <td colspan="2" class="fs-6 fw-bold">
              S/. {{ formattedTotals.grandTotal }}
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
import { useSaleTotals } from "@/composables/useSaleTotals";
import { useMessage } from "naive-ui";
import { searchProductByName } from "@/api/modules/products";
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
    const formatPrice = (price) => isNaN(price) ? "0.00" : Number(price).toFixed(2);
    const { formattedTotals } = useSaleTotals();
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

    const removeMenuSet = (menuIndex) => {
      // Encontrar el menú en orderList por índice
      const menuItems = orderStore.orderList.filter(item => item.from_menu);
      if (menuItems[menuIndex]) {
        const menuToRemove = menuItems[menuIndex];
        const orderIndex = orderStore.orderList.findIndex(item => 
          item === menuToRemove
        );
        if (orderIndex !== -1) {
          orderStore.orderList.splice(orderIndex, 1);
          updateOrderDetails();
        }
      }
    };

    const removeProductLine = (productIndex) => {
      // Encontrar el producto en orderList por índice
      const productItems = orderStore.orderList.filter(item => !item.from_menu);
      if (productItems[productIndex]) {
        const productToRemove = productItems[productIndex];
        const orderIndex = orderStore.orderList.findIndex(item => 
          item === productToRemove
        );
        if (orderIndex !== -1) {
          orderStore.orderList.splice(orderIndex, 1);
          updateOrderDetails();
        }
      }
    };

    const updateOrderDetails = () => {
      // Actualizar el store de sales con los datos actuales
      saleStore.sale_details = orderStore.productLines;
      saleStore.sale_product_sets = orderStore.menuSets;
      
      // Forzar la actualización del payload para disparar reactividad
      saleStore.buildSalePayload();
      
      // Log para debug
      console.log('PaymentSummary - Items actualizados:', {
        products: orderStore.productLines.length,
        menus: orderStore.menuSets.length,
        totalOrders: orderStore.orderList.length
      });
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
      formattedTotals,
      buttonText,
      productOptions,
      searching,
      showOptions,
      handleRowClick,
      removeMenuSet,
      removeProductLine,
      updateOrderDetails,
      selectProduct,
      renderLabel,
      formatPrice,
      handleButtonClick,
      ...props
    };
  }
});
</script>

<style lang="scss" scoped>
.border-top-0 {
  border-top: 0;
}
</style>