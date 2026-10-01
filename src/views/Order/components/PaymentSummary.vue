<template>
  <div class="flizzy-take-order-summary-card">
    <header class="summary-top-header">
      <div class="summary-title-box">
        <span class="summary-title">Resumen del Pedido</span>
        <span v-if="orderList.length" class="summary-badge-count">
          {{ orderList.length }} {{ orderList.length === 1 ? 'ítem' : 'ítems' }}
        </span>
      </div>
      <n-button
        type="info"
        secondary
        size="small"
        :disabled="orderList.length === 0 || isValidatingStock"
        :loading="isValidatingStock"
        @click="handleButtonClick"
        class="summary-btn-cobrar"
      >
        <v-icon class="me-1" name="fa-coins" scale="0.9" />
        {{ buttonText }}
      </n-button>
    </header>

    <div class="summary-search-box">
      <n-input-group size="small">
        <n-auto-complete
          :input-props="{ autocomplete: 'disabled' }"
          v-model:value="localProductSearch"
          :options="productOptions"
          :get-show="showOptions"
          :loading="searching"
          clear-after-select
          :filter="() => true"
          :render-label="renderLabel"
          placeholder="Buscar producto rápido..."
          @select="selectProduct"
          class="flizzy-search-autocomplete"
        />
      </n-input-group>
    </div>

    <!-- Lista de productos ordenados con scroll dedicado -->
    <div class="summary-items-scroll-viewport">
      <n-table size="small" class="flizzy-orders-table">
        <thead>
          <tr>
            <th width="8%"></th>
            <th width="42%">Producto</th>
            <th width="24%">Cant.</th>
            <th width="18%">SubTotal</th>
            <th width="8%"></th>
          </tr>
        </thead>
        <tbody>
          <!-- Menús -->
          <template v-for="(menu, menuIndex) in menuSets" :key="`menu-${menuIndex}`">
            <tr class="order-row-combo">
              <td class="text-center">
                <div class="row-icon-badge combo-badge">
                  <v-icon name="md-restaurant-round"/>
                </div>
              </td>
              <td><b>Menú: {{ menu.name }}</b></td>
              <td><span class="qty-pill">{{ menu.quantity }}x</span></td>
              <td class="order-price-col">S/. {{ formatPrice(menu.price * menu.quantity)}}</td>
              <td class="text-center">
                <n-button class="btn-order-delete" text @click.stop="removeMenuSet(menuIndex)">
                  <v-icon name="md-delete-round" />
                </n-button>
              </td>
            </tr>
            <!-- Items del menú -->
            <tr v-for="item in menu.items" :key="`menu-item-${item.product_id}`" class="subitem-row">
              <td></td>
              <td style="padding-left: 20px;">
                {{ item.product_name }} 
                <small v-if="item.phase_name" class="subitem-phase">({{ item.phase_name }})</small>
              </td>
              <td>{{ item.quantity }}</td>
              <td></td>
              <td></td>
            </tr>
          </template>

          <!-- Productos individuales -->
          <template v-for="(product, productIndex) in productLines" :key="`product-${productIndex}`">
            <tr class="order-row-product" @click="handleRowClick(productIndex)">
              <td class="text-center">
                <div class="row-icon-badge product-badge">
                  <v-icon name="md-listalt-round"/>
                </div>
              </td>
              <td>
                <span class="order-product-name">{{ product.product_name }}</span>
              </td>
              <td>
                <n-input-number
                  class="flizzy-stepper-input"
                  size="small"
                  :min="1"
                  v-model:value="product.quantity"
                  @update:value="updateOrderDetails"
                  @click.stop
                />
              </td>
              <td class="order-price-col">S/. {{ formatPrice(product.subTotal) }}</td>
              <td class="text-center">
                <n-button class="btn-order-delete" text @click.stop="removeProductLine(productIndex)">
                  <v-icon name="md-delete-round" />
                </n-button>
              </td>
            </tr>
          </template>

          <tr v-if="orderList.length === 0">
            <td colspan="5" class="py-4 text-center">
              <n-empty description="No hay productos en el pedido" size="small" />
            </td>
          </tr>
        </tbody>
      </n-table>
    </div>

    <!-- Footer fijo con totales -->
    <footer class="summary-card-footer">
      <div class="summary-footer-totals">
        <div v-if="Number(discount) > 0" class="totals-row">
          <span class="totals-label">Descuento:</span>
          <span class="totals-val text-warning">- S/. {{ formatPrice(discount) }}</span>
        </div>
        <div v-if="Number(otherCharges) > 0" class="totals-row">
          <span class="totals-label">Otros cargos:</span>
          <span class="totals-val text-purple">+ S/. {{ formatPrice(otherCharges) }}</span>
        </div>
        <div class="footer-total-box">
          <span class="total-label">TOTAL PEDIDO:</span>
          <span class="total-value">
            S/. {{ totalAmount !== null ? formatPrice(totalAmount) : formattedTotals.grandTotal }}
          </span>
        </div>
        <n-button
          class="flizzy-btn-order-submit d-lg-none mt-2"
          :disabled="orderList.length === 0 || isValidatingStock"
          :loading="isValidatingStock"
          @click="handleButtonClick"
          block
        >
          <v-icon class="me-2" name="fa-coins" scale="1.1" />
          <span>{{ buttonText }}</span>
        </n-button>
      </div>
    </footer>
  </div>
</template>

<script>

import { defineComponent, computed, ref, h, toRefs, onMounted } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useProductStore } from "@/store/modules/product";
import { useSaleTotals } from "@/composables/useSaleTotals";
import { useDebounce } from "@/composables/useDebounce";
import { useMessage } from "naive-ui";
import { retrieveProduct, searchProductByName, searchProductPrice } from "@/api/modules/products";
import ProductSearchLabel from "@/views/Product/components/ProductSearchLabel.vue";
import { getInsufficientStockItems } from "@/utils/orderStockValidation";

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
    },
    totalAmount: {
      type: [Number, String],
      default: null
    },
    discount: {
      type: [Number, String],
      default: 0
    },
    otherCharges: {
      type: [Number, String],
      default: 0
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

    const orderList = computed(() => orderStore?.orderList || []);
    const menuSets = computed(() => orderStore?.menuSets || []);
    const productLines = computed(() => orderStore?.productLines || []);

    const productStore = useProductStore();
    const formatPrice = (price) => isNaN(price) ? "0.00" : Number(price).toFixed(2);
    const { formattedTotals } = useSaleTotals();
    const message = useMessage();

    const products = ref([]);
    const searching = ref(false);
    const isValidatingStock = ref(false);

    // Variable local para el buscador de productos
    const localProductSearch = computed({
      get: () => props.productSearch,
      set: (value) => emit('update:productSearch', value)
    });

    const buttonText = computed(() => props.selectProducts ? "Seleccionar productos" : "Cobrar");

    // Opciones del producto para el autocompletar (igual que TableOrder)
    const productOptions = computed(() => products.value.filter((p) => p.product_type !== 'COMBO').map((product) => ({
      value: product.id,
      label: product.name,
      disabled: product.is_disabled,
      category: productStore.getCategorieDescription(product.category) || '',
      stock: product.stock,
      price: parseFloat(product.prices).toFixed(2),
    })));

    // Función para mostrar opciones cuando se busca (igual que TableOrder)
    const priceRegex = /^\d+(\.\d{0,2})?$/;

    onMounted(() => {
      productStore.loadCatalog().catch(() => {});
    });

    const { debounced: debouncedFetchProducts, cancel: cancelFetchProducts } = useDebounce((value) => {
      searching.value = true;
      const request = priceRegex.test(value)
        ? searchProductPrice(value)
        : searchProductByName(value);

      request
        .then((response) => {
          if (response.status === 200) {
            products.value = (response.data || []).filter((p) => p.product_type !== 'COMBO');
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          searching.value = false;
        });
    }, 200);

    const fetchProducts = (value) => {
      if (productStore.catalog?.length) {
        const localMatches = productStore.searchLocal(value);
        if (localMatches.length) {
          products.value = localMatches;
          searching.value = false;
          return;
        }
      }
      debouncedFetchProducts(value);
    };

    const showOptions = (value) => {
      if (value && (priceRegex.test(value) || value.trim().length >= 1)) {
        fetchProducts(value);
        return true;
      }
      cancelFetchProducts();
      products.value = [];
      searching.value = false;
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

    const refreshCurrentStock = async () => {
      const productIds = [
        ...new Set(orderStore.productLines.map((item) => item.product).filter(Boolean)),
      ];

      if (!productIds.length) return;

      const responses = await Promise.all(productIds.map((productId) => retrieveProduct(productId)));
      const productsById = new Map(
        responses
          .map((response) => response.data)
          .filter(Boolean)
          .map((product) => [String(product.id), product]),
      );

      orderStore.productLines.forEach((line) => {
        const product = productsById.get(String(line.product));
        if (!product) return;

        line.stock = product.stock;
        line.control_stock = product.control_stock;
        line.has_stock = product.has_stock;
        line.has_supplies = product.has_supplies;
      });
    };

    const showInsufficientStockMessage = (items) => {
      const details = items
        .map((item) => `${item.productName}: solicitado ${item.requested}, disponible ${item.available}`)
        .join("; ");
      message.error(
        `Stock insuficiente. ${details}.`,
        { duration: 7000 },
      );
    };

    const validateStockBeforeCheckout = async () => {
      isValidatingStock.value = true;
      try {
        await refreshCurrentStock();

        const insufficientItems = getInsufficientStockItems(orderStore.orderList);
        if (!insufficientItems.length) return true;

        showInsufficientStockMessage(insufficientItems);
        return false;
      } catch (error) {
        console.error("Error validando stock:", error);
        message.error("No se pudo validar el stock actual. Intenta nuevamente.");
        return false;
      } finally {
        isValidatingStock.value = false;
      }
    };

    const handleButtonClick = async () => {
      try {
        const shouldOpenCheckout = !props.selectProducts;
        if (shouldOpenCheckout && !(await validateStockBeforeCheckout())) return;

        emit('update:selectProducts', !props.selectProducts);
      } catch (error) {
        console.error('Error en handleButtonClick:', error);
      }
    };

    return {
      orderStore,
      saleStore,
      orderList,
      menuSets,
      productLines,

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
      isValidatingStock,
      ...toRefs(props)
    };
  }
});
</script>

<style lang="scss" scoped>
.flizzy-take-order-summary-card {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.summary-top-header {
  flex-shrink: 0;
  padding: 10px 14px 8px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.summary-badge-count {
  font-size: 11px;
  font-weight: 700;
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #ffedd5;
  padding: 1px 7px;
  border-radius: 6px;
}

.summary-btn-cobrar {
  font-weight: 700 !important;
  border-radius: 8px !important;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25) !important;
}

.summary-search-box {
  flex-shrink: 0;
  margin: 8px 10px 6px;
  background: #f8fafc;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.summary-items-scroll-viewport {
  flex: 1 1 0px;
  height: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 10px 6px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.summary-items-scroll-viewport::-webkit-scrollbar {
  width: 6px;
}
.summary-items-scroll-viewport::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}
.summary-items-scroll-viewport::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.summary-items-scroll-viewport::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.flizzy-orders-table {
  border: 1px solid #f1f5f9 !important;
  border-radius: 10px !important;
  overflow: hidden !important;
}

.flizzy-orders-table thead th {
  background: #f8fafc !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #64748b !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  border-bottom: 1.5px solid #e2e8f0 !important;
  padding: 6px 8px !important;
}

.flizzy-orders-table tbody td {
  padding: 6px 8px !important;
  vertical-align: middle !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

.order-row-combo {
  background: #fafffd !important;
}

.order-row-combo:hover,
.order-row-product:hover {
  background: #fffaf5 !important;
}

.row-icon-badge {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.combo-badge {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.product-badge {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.order-product-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
}

.subitem-row td {
  background: #fafafa !important;
  font-size: 11px;
  color: #64748b;
}

.subitem-phase {
  color: #94a3b8;
  font-style: italic;
}

.qty-pill {
  display: inline-block;
  padding: 2px 7px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
}

.order-price-col {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  white-space: nowrap;
}

.btn-order-delete {
  width: 26px !important;
  height: 26px !important;
  border-radius: 6px !important;
  color: #94a3b8 !important;
  transition: all 0.15s ease !important;
}

.btn-order-delete:hover {
  color: #ef4444 !important;
  background: #fee2e2 !important;
}

:deep(.flizzy-stepper-input) {
  max-width: 95px !important;
  border-radius: 6px !important;
}

.summary-card-footer {
  flex-shrink: 0;
  padding: 8px 10px 10px;
  background: #ffffff;
  border-top: 1.5px solid #e2e8f0;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
}

.summary-footer-totals {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totals-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.totals-label {
  color: #64748b;
  font-weight: 600;
}

.footer-total-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 4px;
}

.footer-total-box .total-label {
  font-size: 11.5px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.04em;
}

.footer-total-box .total-value {
  font-size: 17px;
  font-weight: 900;
  color: #0f172a;
}

.flizzy-btn-order-submit {
  display: none;
}

/* ==================================================== */
/* OPTIMIZACIONES EXCLUSIVAS PARA MÓVIL (<= 768px)      */
/* ==================================================== */
@media (max-width: 768px) {
  .flizzy-take-order-summary-card {
    height: 100% !important;
    max-height: 100% !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    border-radius: 10px !important;
  }

  .summary-top-header {
    flex-shrink: 0 !important;
    padding: 8px 10px 6px !important;
  }

  .summary-title {
    font-size: 14px !important;
  }

  .summary-search-box {
    flex-shrink: 0 !important;
    margin: 6px 6px 4px !important;
    padding: 6px !important;
  }

  .summary-items-scroll-viewport {
    flex: 1 1 0px !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding: 0 4px 8px !important;
  }

  .flizzy-orders-table thead th {
    padding: 5px 3px !important;
    font-size: 10px !important;
    letter-spacing: 0.02em !important;
  }

  .flizzy-orders-table tbody td {
    padding: 6px 3px !important;
  }

  .order-product-name {
    font-size: 12.5px !important;
    line-height: 1.25 !important;
    word-break: break-word;
  }

  .row-icon-badge {
    width: 22px !important;
    height: 22px !important;
    font-size: 11px !important;
    border-radius: 6px !important;
  }

  :deep(.flizzy-stepper-input) {
    max-width: 76px !important;
    min-width: 68px !important;
    width: 100% !important;
  }

  :deep(.flizzy-stepper-input .n-input__input-el) {
    font-size: 12px !important;
    padding: 0 2px !important;
    text-align: center !important;
  }

  :deep(.flizzy-stepper-input .n-input-number-button) {
    width: 18px !important;
    padding: 0 !important;
  }

  .qty-pill {
    padding: 2px 5px !important;
    font-size: 11px !important;
  }

  .order-price-col {
    font-size: 12px !important;
    padding-left: 2px !important;
    padding-right: 2px !important;
  }

  .btn-order-delete {
    width: 24px !important;
    height: 24px !important;
    padding: 0 !important;
  }

  .btn-order-delete :deep(svg) {
    width: 16px !important;
    height: 16px !important;
  }

  .summary-card-footer {
    flex-shrink: 0 !important;
    position: relative !important;
    bottom: auto !important;
    background: #ffffff !important;
    border-top: 1.5px solid #e2e8f0 !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05) !important;
    padding: 8px 10px max(10px, env(safe-area-inset-bottom, 10px)) !important;
    margin-top: 0 !important;
  }

  .footer-total-box {
    padding: 5px 8px !important;
  }

  .footer-total-box .total-label {
    font-size: 11px !important;
  }

  .footer-total-box .total-value {
    font-size: 16px !important;
  }

  .flizzy-btn-order-submit {
    display: flex !important;
    height: 44px !important;
    font-size: 15px !important;
    font-weight: 800 !important;
    border-radius: 10px !important;
    background: linear-gradient(135deg, #ff6b00 0%, #ea580c 100%) !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3) !important;
  }
}
</style>
