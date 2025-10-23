<template>
  <div id="WProducts" class="position-relative w-100">
    <n-page-header class="border-bottom border-2 border-success p-2">
      <template #title>
        <n-text class="fs-4">{{
          productStore.getCategorieDescription($route.params.category)
        }}</n-text>
      </template>
    </n-page-header>
    <div class="m-2">
      <n-input placeholder="Buscar por nombre o precio (ej: 15 o 15.50)..." v-model:value="search">
        <template #prefix>
          <v-icon name="md-search-round" />
        </template>
      </n-input>
    </div>

    <!-- Sección de Combos (si existen en esta categoría) -->
    <div v-if="filteredCombos.length > 0" class="px-2 mb-3">
      <n-divider title-placement="left">
        <n-space align="center">
          <v-icon name="md-localoffertwotone" style="color: #f0a020;" />
          <n-text strong>Combos Disponibles</n-text>
        </n-space>
      </n-divider>
      <n-list class="m-0">
        <n-list-item v-for="combo in filteredCombos" :key="`combo-${combo.id}`">
          <n-space vertical style="width: 100%;">
            <n-space
              justify="space-between"
              @click="combo.quantity ? null : (combo.quantity = 1)"
              style="cursor: pointer;"
            >
              <n-space vertical size="small">
                <n-space align="center" size="small">
                  <n-tag size="small" type="warning">COMBO</n-tag>
                  <n-text strong>{{ combo.name }}</n-text>
                </n-space>
                <n-text depth="3" style="font-size: 12px;">
                  {{ combo.items_count }} productos • 
                  {{ combo.pricing_mode === 'FIXED' ? 'Precio Fijo' : 'Precio Variable' }}
                </n-text>
              </n-space>
              <n-text class="fs-5" type="warning" strong>
                S/. {{ parseFloat(combo.computed_price || combo.fixed_price || 0).toFixed(2) }}
              </n-text>
            </n-space>
            
            <n-collapse-transition :show="combo.quantity > 0">
              <n-space justify="space-between" align="center">
                <n-input-group>
                  <n-button type="warning" size="small" @click="combo.quantity--">
                    <v-icon name="md-remove-round" />
                  </n-button>
                  <n-input
                    :value="combo.quantity.toString()"
                    style="width: 50px"
                    size="small"
                    readonly
                  />
                  <n-button type="warning" size="small" @click="combo.quantity++">
                    <v-icon name="md-add-round" />
                  </n-button>
                </n-input-group>
                <n-button
                  v-if="combo.extras && combo.extras.length > 0"
                  type="info"
                  size="small"
                  @click.stop="openComboExtrasModal(combo)"
                >
                  <v-icon name="md-tuneround" class="me-1" />
                  Adicionales
                </n-button>
              </n-space>
            </n-collapse-transition>
          </n-space>
        </n-list-item>
      </n-list>
    </div>

    <!-- Sección de Productos -->
    <div v-if="filteredProducts.length > 0" class="px-2">
      <n-divider v-if="filteredCombos.length > 0" title-placement="left">
        <n-text strong>Productos</n-text>
      </n-divider>
      <n-list class="m-0">
        <n-list-item
          v-for="(product) in filteredProducts"
          :key="product.id"
        >
        <n-space vertical>
          <n-space
            justify="space-between"
            @click="
              product.quantity
                ? null
                : product.has_stock
                ? product.has_supplies
                  ? (product.quantity = 1)
                  : null
                : null
            "
          >
                  <n-text :delete="!product.has_stock || !product.has_supplies" 
                          :type=" product.has_stock ? product.has_supplies ? 'default' : 'error' : 'error' ">
                      {{ product.name }}
                  </n-text>
              <div style="display: inline-flex; flex-direction: column">
                  <n-text>S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text>
                  <n-tag type="primary" strong v-if="product.stock && product.control_stock" >
                      Stock: {{ product.stock }}
                  </n-tag>
              </div>
          </n-space>
          <n-collapse-transition :show="product.quantity > 0">
            <n-space justify="end">
              <n-input-group>
                <n-button
                  type="warning"
                  size="small"
                  @click="product.quantity--"
                >
                  <v-icon name="md-remove-round" />
                </n-button>
                <n-input
                  :value="product.quantity.toString()"
                  style="width: 50px"
                  size="small"
                  placeholder=""
                  readonly
                />
                <n-button
                  type="warning"
                  size="small"
                  @click="product.quantity++"
                >
                  <v-icon name="md-add-round" />
                </n-button>
              </n-input-group>
            </n-space>
          </n-collapse-transition>
        </n-space>
      </n-list-item>
      </n-list>
    </div>
    
    <!-- Modal para adicionales de combos -->
    <ComboExtrasModal
      v-model:show="showComboExtrasModal"
      :combo="selectedCombo"
      @success="handleComboExtrasSelected"
    />
    
    <ProductIndications
      v-model:show="showModal"
      preset="card"
      title="Indicaciones"
      :product="orderStore.orderList[orderItemIndex]"
      @success="showModal = false"
    ></ProductIndications>
    <teleport to="body">
      <n-space
        class="position-absolute bottom-0 start-50 translate-middle-x mb-3"
        align="center"
        vertical
      >
        <transition name="slide-fade">
          <n-button
            v-if="filteredProducts.some((product) => product.quantity > 0) || filteredCombos.some((combo) => combo.quantity > 0)"
            type="success"
            round
            @click="addToOrderStore"
            ><v-icon class="me-1" name="md-add-round" /> Agregar</n-button
          >
        </transition>
        <!-- Botón para realizar pedido solo si hay productos no menús -->
        <transition name="slide-fade">
          <n-button
            v-if="orderStore.orderList.filter(order => !order.from_menu).length > 0"
            type="warning"
            round
            @click="
              settingsStore.business_settings.order.order_customer_name
                ? (showAskFor = true)
                : orderStore.orderId
                ? performUpdateTableOrder()
                : performCreateTableOrder()
            "
            :disabled="loading"
            :loading="loading"
            ><v-icon class="me-1" name="md-fastfood-round" />{{ orderStore.orderId ? "Añadir" : "Realizar" }} pedido</n-button
          >
        </transition>
      </n-space>
    </teleport>
    
    <!-- Modal para nombre de cliente -->
    <n-modal
      preset="card"
      title="Nombre de Cliente"
      v-model:show="showAskFor"
      :segmented="{ content: 'hard' }"
    >
      <n-input placeholder="" v-model:value="ask_for" />
      <template #action>
        <n-space justify="end">
          <n-button
            type="info"
            :disabled="!showAskFor || loading"
            :loading="loading"
            secondary
            @click="
              orderStore.orderId
                ? performUpdateTableOrder()
                : performCreateTableOrder()
            "
            >Guardar</n-button
          >
        </n-space>
      </template>
    </n-modal>
    <ticket-preview
      ref="ticketPreview"
      v-model:show="showPdf"
      :data="pdfData"
      :hidden="true"
      :isUpdate="!!orderStore.orderId"
      @printed="() => $router.push({ name: 'WHome' })"
      @canceled="() => $router.push({ name: 'WHome' })"
    />
    
    <!-- Botón flotante de pedido unificado -->
    <FloatingOrderButton />
  </div>
</template>

<script>
import { useSettingsStore } from "@/store/modules/settings";
import { computed, defineComponent, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "naive-ui";
import ProductIndications from "./ProductIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import FloatingOrderButton from "@/WaiterMode/components/FloatingOrderButton.vue";
import ComboExtrasModal from "@/WaiterMode/components/ComboExtrasModal.vue";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useWaiterStore } from "@/store/modules/waiter";
import { useSaleStore } from "@/store/modules/sale";
import { getProductsByCategory, getCombos } from "@/api/modules/products";
import { createTableOrder, updateTableOrder } from "@/api/modules/tables";

import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "WProducts",
  components: {
    ProductIndications,
    TicketPreview,
    FloatingOrderButton,
    ComboExtrasModal,
  },
  setup() {
    const message = useMessage();
    const route = useRoute();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const orderStore = useOrderStore();
    const tableStore = useTableStore();
    const saleStore = useSaleStore();
    const waiterStore = useWaiterStore();
    const showModal = ref(false);
    const loading = ref(false);
    const orderItemIndex = ref(null);
    const search = ref("");
    const products = ref([]);
    const combos = ref([]);
    const showComboExtrasModal = ref(false);
    const selectedCombo = ref(null);

    const filteredProducts = computed(() => {
      const searchTerm = search.value.toLowerCase().trim();
      if (!searchTerm) return products.value;
      
      // Detectar si es búsqueda por precio (formato numérico)
      const priceRegex = /^\d+(\.\d{0,2})?$/;
      const isPrice = priceRegex.test(searchTerm);
      
      return products.value.filter((product) => {
        if (isPrice) {
          // Búsqueda por precio: comparar precio exacto o parcial
          const productPrice = parseFloat(product.prices).toFixed(2);
          return productPrice.includes(searchTerm) || productPrice.startsWith(searchTerm);
        } else {
          // Búsqueda por nombre (comportamiento original)
          return product.name.toLowerCase().includes(searchTerm);
        }
      });
    });

    const filteredCombos = computed(() => {
      const searchTerm = search.value.toLowerCase().trim();
      if (!searchTerm) return combos.value;
      
      // Detectar si es búsqueda por precio
      const priceRegex = /^\d+(\.\d{0,2})?$/;
      const isPrice = priceRegex.test(searchTerm);
      
      return combos.value.filter((combo) => {
        if (isPrice) {
          // Búsqueda por precio: usar computed_price o fixed_price
          const comboPrice = parseFloat(combo.computed_price || combo.fixed_price || 0).toFixed(2);
          return comboPrice.includes(searchTerm) || comboPrice.startsWith(searchTerm);
        } else {
          // Búsqueda por nombre (comportamiento original)
          return combo.name.toLowerCase().includes(searchTerm);
        }
      });
    });
    
      const expandOrderList = (orderList) => {
          const expanded = [];

          for (const item of orderList) {
              const indications = item.indication || [];
              const totalQty = item.quantity || 1;
              const indicatedQty = indications.length;
              const remainingQty = totalQty - indicatedQty;

              if (indicatedQty > 0) {
                  for (const ind of indications) {
                      expanded.push({
                          ...item,
                          indication: [ ind ],
                          quantity: 1,
                          subTotal: parseFloat(item.price || 0)
                      });
                  }
              }

              if (remainingQty > 0) {
                  expanded.push({
                      ...item,
                      indication: [],
                      quantity: remainingQty,
                      subTotal: parseFloat(item.price || 0) * remainingQty
                  });
              }
          }

          const grouped = [];

          for (const product of expanded) {
              const indicationIsEmpty =
                  !product.indication ||
                  product.indication.length === 0 ||
                  product.indication.every(
                      (ind) =>
                          !ind.description?.trim() &&
                          ( !ind.quick_indications || ind.quick_indications.length === 0)
                  );

              if ( !indicationIsEmpty) {
                  grouped.push(product);
                  continue;
              }

              const existing = grouped.find(
                  (p) =>
                      ( !p.indication?.length ||
                        p.indication.every(
                            (ind) =>
                                !ind.description?.trim() &&
                                ( !ind.quick_indications ||
                                  ind.quick_indications.length === 0)
                        )) &&
                      p.product === product.product
              );

              if (existing) {
                  existing.quantity += product.quantity;
                  existing.subTotal =
                      parseFloat(existing.price || 0) * existing.quantity;
              } else {
                  grouped.push({ ...product, indication: [] });
              }
          }

          return grouped;
      };

    const performCreateTableOrder = () => {
      loading.value = true;
        const createNewOrder = expandOrderList(orderStore.orderList);
        createTableOrder(route.params.table, createNewOrder, undefined, !ask_for.value ? undefined : ask_for.value)
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");

            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);

            tableStore.refreshData();
            // Limpiar solo productos del carrito que no son menús
            orderStore.orders = orderStore.orders.filter(order => order.from_menu);
            // router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const evalOrderList = (details) => {
      let list = [];
      details.forEach((order) => {
        let item = saleStore.order_initial.find((v) => v.id === order.id);
        if (!!item && order.quantity > item.quantity) {
          let newOrder = cloneDeep(order);
          newOrder.quantity = order.quantity - item.quantity;
          newOrder.indication = newOrder.indication.slice(order.quantity - 1);
          list.push(newOrder);
        } else if (
          !!item &&
          JSON.stringify(order.indication) !== JSON.stringify(item.indication)
        ) {
          let newOrder = cloneDeep(order);
          list.push(newOrder);
        } else if (typeof item === "undefined") {
          list.push(order);
        }
      });
      return list;
    };

    const performUpdateTableOrder = async () => {
      loading.value = true;
        
        const createNewOrder = expandOrderList(orderStore.orderList);

        await updateTableOrder(route.params.table, orderStore.orderId, createNewOrder, undefined, !ask_for.value ? undefined : ask_for.value)
        .then((response) => {
          if (response.status === 202) {
            message.success("Orden actualizada correctamente");
            response.data.order_details = evalOrderList(
              response.data.order_details
            );

            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);

            tableStore.refreshData();
            // Limpiar solo productos del carrito que no son menús
            orderStore.orders = orderStore.orders.filter(order => order.from_menu);
            // router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const loadProducts = () => {
      getProductsByCategory(route.params.category)
        .then((response) => {
          if (response.status === 200) {
            products.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const loadCombos = async () => {
      try {
        const categoryId = route.params.category;
        const response = await getCombos({
          is_active: true,
          category_id: categoryId,
        });
        if (response.status === 200) {
          combos.value = response.data.results.map((combo) => ({
            ...combo,
            quantity: 0,
            selected_extras: [],
            indication: "",
          }));
        }
      } catch (error) {
        console.error("Error loading combos:", error);
        // No mostramos error porque es opcional
      }
    };

    const openComboExtrasModal = (combo) => {
      selectedCombo.value = combo;
      showComboExtrasModal.value = true;
    };

    const handleComboExtrasSelected = ({ selected_extras, indication }) => {
      if (selectedCombo.value) {
        selectedCombo.value.selected_extras = selected_extras;
        selectedCombo.value.indication = indication;
      }
      showComboExtrasModal.value = false;
    };

    const dateNow = ref(null);

    onMounted(async () => {
      loadProducts();
      loadCombos();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();
      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const addToOrderStore = () => {
      // Agregar productos normales
      filteredProducts.value.forEach((product) => {
        if (product.quantity > 0) {
          // Verificar si el producto ya existe en el carrito
          const existence = orderStore.orders.find(
            (order) => order.product === product.id && !order.from_menu
          );
          if (typeof existence !== "undefined") {
            existence.quantity += product.quantity;
          } else {
            // Crear nueva orden usando addOrderItem del orderStore
            let productOrder = {
              id: product.id,
              name: product.name,
              prices: product.prices,
              quantity: Number(product.quantity),
              indication: [],
              icbper: product.icbper,
              affectation: product.affectation,
              igv_tax: product.igv_tax,
              quick_indications: product.quick_indications,
              icbper: product.icbper || false,
              affectation: product.affectation || '10',
              igv_tax: product.igv_tax || 0
            };
            orderStore.addOrderItem(productOrder);
          }
        }
        product.quantity = 0;
        product.indications = [];
      });

      // Agregar combos
      const combosToAdd = filteredCombos.value.filter((combo) => combo.quantity > 0);
      combosToAdd.forEach((combo) => {
        for (let i = 0; i < combo.quantity; i++) {
          orderStore.addComboOrder({
            product_set_id: combo.id,
            combo_name: combo.name,
            price: combo.computed_price || combo.fixed_price || 0,
            quantity: 1,
            selected_extras: combo.selected_extras || [],
            indication: combo.indication || "",
            pricing_mode: combo.pricing_mode,
            category: combo.category,
            items: combo.items || [],
            from_combo: true,
            quick_indications: combo.extras || [],
            product_affectation: combo.affectation || 20,
            product_igv: combo.igv_tax || settingsStore.businessSettings.sale.igv_tax,
            icbper: false,
          });
        }
        // Reset combo
        combo.quantity = 0;
        combo.selected_extras = [];
        combo.indication = "";
      });

      if (combosToAdd.length > 0 || filteredProducts.value.some(p => p.quantity > 0)) {
        message.success("Productos y combos agregados al pedido");
      }
    };

    const showAskFor = ref(false);

    const ask_for = ref(null);

    const ticketPreview = ref(null);

    const showPdf = ref(false);

    const pdfData = ref(null);

    return {
      loading,
      search,
      //activeDrawer,
      showModal,
      productStore,
      waiterStore,
      orderItemIndex,
      filteredProducts,
      filteredCombos,
      addToOrderStore,
      orderStore,
      performCreateTableOrder,
      performUpdateTableOrder,
      settingsStore,
      showAskFor,
      ask_for,
      ticketPreview,
      showPdf,
      pdfData,
      showComboExtrasModal,
      selectedCombo,
      openComboExtrasModal,
      handleComboExtrasSelected,
    };
  },
});
</script>

<style lang="scss" scoped>
.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(25px);
  opacity: 0;
}
</style>
