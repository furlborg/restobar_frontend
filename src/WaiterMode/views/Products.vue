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
      <n-input placeholder="Buscar" v-model:value="search" />
    </div>

    <n-list class="m-0 px-2">
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
    <ProductIndications
      v-if="selectedProduct"
      v-model:show="showModal"
      preset="card"
      title="Indicaciones"
      :product="selectedProduct"
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
            v-if="filteredProducts.some((product) => product.quantity > 0)"
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
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import ProductIndications from "./ProductIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import FloatingOrderButton from "@/WaiterMode/components/FloatingOrderButton.vue";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useWaiterStore } from "@/store/modules/waiter";
import { useUserStore } from "@/store/modules/user";
import { useSaleStore } from "@/store/modules/sale";
import { useTableLock } from "@/composables/useTableLock";
import { getProductsByCategory } from "@/api/modules/products";
import { createTableOrder, updateTableOrder } from "@/api/modules/tables";

import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "WProducts",
  components: {
    ProductIndications,
    TicketPreview,
    FloatingOrderButton,
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
    const userStore = useUserStore();
    const router = useRouter();
    const showModal = ref(false);
    const loading = ref(false);
    const orderItemIndex = ref(null);
    const search = ref("");
    const products = ref([]);

    const filteredProducts = computed(() => {
      return products.value.filter((product) =>
        product.name.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const transformOrderDetails = (orderDetails = []) => {
      return orderDetails.map((detail) => {
        if (detail.product_set) {
          const isCombo = detail.product_set.set_type === "COMBO";
          return {
            id: detail.id,
            from_menu: detail.product_set.set_type === "MENU",
            from_combo: isCombo,
            product_set_id: detail.product_set.id,
            order_detail_id: detail.id,
            combo_id: detail.product_set?.combo || null,
            name: detail.product_set.menu_name || detail.product_set.name,
            set_type: detail.product_set.set_type,
            price: parseFloat(detail.product_set.price || detail.product_set.fixed_price || detail.product_set.computed_price || 0),
            fixed_price: detail.product_set.fixed_price,
            pricing_mode: detail.product_set.pricing_mode,
            quantity: detail.quantity,
            product_set: detail.product_set,
            items: detail.product_set.items?.map((item) => ({
              quantity: item.quantity,
              product_name: item.product_name,
              phase_name: item.product_phase?.phase_name
            })) || []
          };
        }
        if (detail.product) {
          return {
            id: detail.id,
            product: detail.product,
            product_name: detail.product_name,
            price: parseFloat(detail.price),
            quantity: detail.quantity,
            indication: detail.indication || [],
            quick_indications: detail.quick_indications || "",
            icbper: detail.icbper,
            product_affectation: detail.product_affectation,
            product_igv: detail.product_igv
          };
        }
        return null;
      }).filter(Boolean);
    };

    const syncOrderFromResponse = (data) => {
      const orderData = data?.order ?? data;
      if (!orderData?.order_details) return;
      const transformed = transformOrderDetails(orderData.order_details);
      orderStore.setSavedOrders(transformed);
      orderStore.orderId = orderData.id ?? orderStore.orderId;
      saleStore.order_initial = cloneDeep(orderStore.fullOrderList);
    };

    const performCreateTableOrder = () => {
      loading.value = true;
      createTableOrder(
        route.params.table,
        orderStore.orderList,
        userStore.user?.id ?? null,
        !ask_for.value ? undefined : ask_for.value
      )
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");
            syncOrderFromResponse(response.data);

            tableStore.refreshData();
            // Limpiar solo productos del carrito que no son menús
            orderStore.orders = orderStore.orders.filter(order => order.from_menu);
            router.push({ name: "WHome" });
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

    const performUpdateTableOrder = async () => {
      loading.value = true;
      await updateTableOrder(
        route.params.table,
        orderStore.orderId,
        orderStore.fullOrderList,
        userStore.user?.id ?? null,
        !ask_for.value ? undefined : ask_for.value
      )
        .then((response) => {
          if (response.status === 202) {
            message.success("Orden actualizada correctamente");

            tableStore.refreshData();
            // Limpiar solo productos del carrito que no son menús
            orderStore.orders = orderStore.orders.filter(order => order.from_menu);
            router.push({ name: "WHome" });
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

    const dateNow = ref(null);

    // Table lock composable (solo para enviar mensajes WS)
    const { wsLockTable, wsUnlockTable } = useTableLock();
    
    // Controla si se debe desbloquear al salir
    const shouldUnlock = ref(false);
    // Guardamos el tableId al montar para usarlo en unmount (cuando la ruta ya cambió)
    const capturedTableId = ref(null);
    
    // ID de la mesa desde la ruta
    const tableId = computed(() => {
      const param = route.params.table;
      return typeof param === 'string' ? parseInt(param) : param;
    });
    
    // Función para desbloquear mesa (usada en múltiples lugares)
    const unlockCurrentTable = () => {
      const idToUnlock = capturedTableId.value || tableId.value;
      console.log('[WaiterProducts] 🔍 unlockCurrentTable llamado - shouldUnlock:', shouldUnlock.value, 'capturedTableId:', capturedTableId.value, 'tableId:', tableId.value);
      if (shouldUnlock.value && idToUnlock) {
        console.log('[WaiterProducts] 🔓 Desbloqueando mesa', idToUnlock);
        wsUnlockTable(idToUnlock);
        shouldUnlock.value = false;
      } else {
        console.log('[WaiterProducts] ⚠️ No se desbloqueará - shouldUnlock:', shouldUnlock.value, 'idToUnlock:', idToUnlock);
      }
    };
    
    // Handler para cierre brusco de ventana/pestaña
    const handleBeforeUnload = () => {
      console.log('[WaiterProducts] 🚪 beforeunload disparado');
      unlockCurrentTable();
    };

    onMounted(async () => {
      // Capturar el tableId inmediatamente
      capturedTableId.value = tableId.value;
      console.log('[WaiterProducts] 🟢 Componente montado - Mesa:', capturedTableId.value);
      
      loadProducts();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();
      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
      
      // Bloquear mesa si tiene ID de mesa
      if (capturedTableId.value) {
        const lockInfo = tableStore.lockedTables[capturedTableId.value];
        const isMyLock = lockInfo && lockInfo.user_id === userStore.user.id;
        
        if (!lockInfo || isMyLock) {
          console.log('[WaiterProducts] 🔒 Bloqueando mesa', capturedTableId.value);
          wsLockTable(capturedTableId.value, 15);
          shouldUnlock.value = true;
          
          // Agregar listener para cierre brusco
          window.addEventListener('beforeunload', handleBeforeUnload);
        }
      }
    });
    
    // Desbloquear mesa al salir - SIEMPRE desbloquear
    // El backend manejará la expiración automática para cierres bruscos
    onUnmounted(() => {
      // Remover listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Desbloquear
      unlockCurrentTable();
    });

    const addToOrderStore = () => {
      filteredProducts.value.forEach((product) => {
        if (product.quantity > 0) {
          // Crear nueva orden usando addOrderItem del orderStore
          let productOrder = {
            id: product.id,
            name: product.name,
            prices: product.prices,
            quantity: Number(product.quantity),
            indication: [],
            quick_indications: product.quick_indications,
            icbper: product.icbper || false,
            affectation: product.affectation || '10',
            igv_tax: product.igv_tax || 0
          };
          orderStore.addOrderItem(productOrder);
        }
        product.quantity = 0;
        product.indications = [];
      });
    };

    const showAskFor = ref(false);

    const ask_for = ref(null);

    const ticketPreview = ref(null);

    const showPdf = ref(false);

    const pdfData = ref(null);

    const selectedProduct = computed(
      () => orderStore.orderList[orderItemIndex.value] || null
    );

    return {
      loading,
      search,
      //activeDrawer,
      showModal,
      productStore,
      waiterStore,
      orderItemIndex,
      selectedProduct,
      filteredProducts,
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
