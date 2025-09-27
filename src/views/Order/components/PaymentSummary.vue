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

    <n-input-group>
      <n-auto-complete
        :input-props="{ autocomplete: 'disabled' }"
        :value="productSearch"
        @update:value="$emit('update:productSearch', $event)"
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
    <!-- Debug Info (solo en desarrollo) -->
    <n-card v-if="isDev" title="Debug Info" style="margin-bottom: 16px; background-color: #f0f8ff;">
      <n-space vertical size="small">
        <n-text type="info">Total Orders: {{ orderStore.orderList?.length || 0 }}</n-text>
        <n-text type="success">Product Lines: {{ orderStore.productLines?.length || 0 }}</n-text>
        <n-text type="warning">Menu Sets: {{ orderStore.menuSets?.length || 0 }}</n-text>
        <n-text type="error" v-if="orderStore.menuSets?.length > 0">
          First Menu: {{ orderStore.menuSets[0]?.name || 'No name' }}
        </n-text>
      </n-space>
    </n-card>

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
              <td>
                <n-input-number
                  class="border-top-0"
                  size="small"
                  :min="1"
                  v-model:value="menu.quantity"
                  @update:value="updateOrderDetails"
                  @click.stop
                />
              </td>
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
import { defineComponent, computed } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useSaleTotals } from "@/composables/useSaleTotals";

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
    'selectProduct',
    'renderLabel'
  ],
  setup(props, { emit }) {
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const { formattedTotals } = useSaleTotals();

    // Debug mode check
    const isDev = computed(() => import.meta.env.DEV);

    const formatPrice = (price) => isNaN(price) ? "0.00" : Number(price).toFixed(2);

    const handleRowClick = (index) => {
      emit('update:itemIndex', index);
      emit('update:showModal', true);
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
      formattedTotals,
      isDev,
      handleRowClick,
      removeMenuSet,
      removeProductLine,
      updateOrderDetails,
      selectProduct,
      renderLabel,
      formatPrice,
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