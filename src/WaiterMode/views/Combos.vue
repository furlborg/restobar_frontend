<template>
  <div id="WCombos" class="position-relative w-100">
    <n-page-header class="border-bottom border-2 border-warning p-2">
      <template #title>
        <n-space align="center">
          <v-icon name="md-localoffertwotone" style="color: #f0a020;" scale="1.3" />
          <n-text class="fs-4">Combos Disponibles</n-text>
        </n-space>
      </template>
    </n-page-header>
    
    <div class="m-2">
      <n-input placeholder="Buscar por nombre o precio (ej: 15 o 15.50)..." v-model:value="search">
        <template #prefix>
          <v-icon name="md-search-round" />
        </template>
      </n-input>
    </div>

    <n-spin :show="loading">
      <n-list class="m-0 px-2">
        <n-list-item
          v-for="combo in filteredCombos"
          :key="combo.id"
        >
          <n-space vertical style="width: 100%;">
            <n-space
              justify="space-between"
              @click="combo.quantity ? null : (combo.quantity = 1)"
              style="cursor: pointer;"
            >
              <n-space vertical size="small">
                <n-text strong>{{ combo.name }}</n-text>
                <n-space size="small">
                  <n-tag size="small" :type="combo.pricing_mode === 'FIXED' ? 'success' : 'info'">
                    {{ combo.pricing_mode === 'FIXED' ? 'Precio Fijo' : 'Precio Variable' }}
                  </n-tag>
                  <n-tag size="small" type="default">
                    {{ combo.combo_products?.length || 0 }} productos
                  </n-tag>
                  <n-tag size="small" :type="combo.combo_category_details ? 'info' : 'default'">
                    {{ combo.combo_category_details?.description || 'Sin categoría' }}
                  </n-tag>
                </n-space>
                
                <!-- Mostrar productos del combo -->
                <n-collapse-transition :show="combo.showDetails">
                  <div class="mt-2" style="padding-left: 8px; border-left: 3px solid #f0a020;">
                    <n-text class="fs-7" type="warning" strong>Productos incluidos:</n-text>
                    <n-list class="mt-1" size="small">
                      <n-list-item 
                        v-for="(product, idx) in combo.combo_products" 
                        :key="idx"
                        style="padding: 4px 0;"
                      >
                        <n-space size="small" align="center">
                          <n-tag size="tiny" type="warning">{{ product.quantity }}x</n-tag>
                          <n-text class="fs-7">{{ product.product_name || 'Producto' }}</n-text>
                          <n-tag 
                            v-if="product.product?.stock !== undefined" 
                            size="tiny" 
                            :type="product.product.stock > 0 ? 'success' : 'error'"
                          >
                            Stock: {{ product.product.stock }}
                          </n-tag>
                        </n-space>
                      </n-list-item>
                    </n-list>
                  </div>
                </n-collapse-transition>
                
                <!-- Botón para ver/ocultar productos -->
                <n-button
                  text
                  size="tiny"
                  type="info"
                  @click.stop="combo.showDetails = !combo.showDetails"
                >
                  <v-icon 
                    :name="combo.showDetails ? 'md-keyboardarrowup-round' : 'md-keyboardarrowdown-round'" 
                    scale="0.9"
                  />
                  {{ combo.showDetails ? 'Ocultar productos' : 'Ver productos' }}
                </n-button>
              </n-space>
              <div style="display: inline-flex; flex-direction: column; align-items: flex-end;">
                <n-text class="fs-5" type="warning" strong>
                  S/. {{ parseFloat(combo.computed_price || combo.fixed_price || 0).toFixed(2) }}
                </n-text>
              </div>
            </n-space>
            
            <n-collapse-transition :show="combo.quantity > 0">
              <n-space justify="space-between" align="center">
                <n-input-group>
                  <n-button
                    type="warning"
                    size="small"
                    @click="combo.quantity--"
                  >
                    <v-icon name="md-remove-round" />
                  </n-button>
                  <n-input
                    :value="combo.quantity.toString()"
                    style="width: 50px"
                    size="small"
                    placeholder=""
                    readonly
                  />
                  <n-button
                    type="warning"
                    size="small"
                    @click="combo.quantity++"
                  >
                    <v-icon name="md-add-round" />
                  </n-button>
                </n-input-group>
                
                <!-- Botón para configurar adicionales -->
                <n-button
                  v-if="combo.extras && combo.extras.length > 0"
                  type="info"
                  size="small"
                  @click.stop="openExtrasModal(combo)"
                >
                  <v-icon name="md-tuneround" class="me-1" />
                  Adicionales
                </n-button>
              </n-space>
            </n-collapse-transition>
          </n-space>
        </n-list-item>
        
        <n-empty v-if="!loading && filteredCombos.length === 0" description="No hay combos disponibles" />
      </n-list>
    </n-spin>

    <!-- Modal para seleccionar adicionales -->
    <ComboExtrasModal
      v-model:show="showExtrasModal"
      :combo="selectedCombo"
      @success="handleExtrasSelected"
    />

    <teleport to="body">
      <n-space
        class="position-absolute bottom-0 start-50 translate-middle-x mb-3"
        align="center"
        vertical
      >
        <transition name="slide-fade">
          <n-button
            v-if="filteredCombos.some((combo) => combo.quantity > 0)"
            type="success"
            round
            @click="addToOrderStore"
          >
            <v-icon class="me-1" name="md-add-round" /> Agregar
          </n-button>
        </transition>
        
        <!-- Botón para realizar pedido -->
        <transition name="slide-fade">
          <n-button
            v-if="orderStore.orderList.length > 0"
            type="warning"
            round
            @click="
              settingsStore.business_settings.order.order_customer_name
                ? (showAskFor = true)
                : orderStore.orderId
                ? performUpdateTableOrder()
                : performCreateTableOrder()
            "
            :disabled="loadingOrder"
            :loading="loadingOrder"
          >
            <v-icon class="me-1" name="md-fastfood-round" />
            {{ orderStore.orderId ? "Añadir" : "Realizar" }} pedido
          </n-button>
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
            :disabled="!showAskFor || loadingOrder"
            :loading="loadingOrder"
            secondary
            @click="
              orderStore.orderId
                ? performUpdateTableOrder()
                : performCreateTableOrder()
            "
          >
            Guardar
          </n-button>
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
import { defineComponent, ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useOrderStore } from "@/store/modules/order";
import { useTableStore } from "@/store/modules/table";
import { useSaleStore } from "@/store/modules/sale";
import { getCombos } from "@/api/modules/products";
import { createTableOrder, updateTableOrder } from "@/api/modules/tables";
import { cloneDeep } from "@/utils";
import ComboExtrasModal from "@/WaiterMode/components/ComboExtrasModal.vue";
import TicketPreview from "@/views/Order/components/TicketPreview";
import FloatingOrderButton from "@/WaiterMode/components/FloatingOrderButton.vue";

export default defineComponent({
  name: "WCombos",
  components: {
    ComboExtrasModal,
    TicketPreview,
    FloatingOrderButton,
  },
  setup() {
    const message = useMessage();
    const router = useRouter();
    const route = useRoute();
    const settingsStore = useSettingsStore();
    const orderStore = useOrderStore();
    const tableStore = useTableStore();
    const saleStore = useSaleStore();
    
    const loading = ref(false);
    const loadingOrder = ref(false);
    const search = ref("");
    const combos = ref([]);
    const showExtrasModal = ref(false);
    const selectedCombo = ref(null);
    const showAskFor = ref(false);
    const ask_for = ref("");
    const showPdf = ref(false);
    const pdfData = ref(null);
    const ticketPreview = ref(null);

    const filteredCombos = computed(() => {
      const searchTerm = search.value.toLowerCase().trim();
      if (!searchTerm) return combos.value;
      
      // Detectar si es búsqueda por precio (formato numérico)
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

    const loadCombos = async () => {
      loading.value = true;
      try {
        const response = await getCombos({
          is_active: true,
        });
        if (response.status === 200) {
          combos.value = response.data.map((combo) => ({
            ...combo,
            quantity: 0,
            selected_extras: [],
            indication: "",
            showDetails: false,  // ✅ Estado para mostrar/ocultar productos
          }));
        }
      } catch (error) {
        console.error("Error loading combos:", error);
        message.error("Error al cargar los combos");
      } finally {
        loading.value = false;
      }
    };

    const openExtrasModal = (combo) => {
      selectedCombo.value = combo;
      showExtrasModal.value = true;
    };

    const handleExtrasSelected = ({ selected_extras, indication }) => {
      if (selectedCombo.value) {
        selectedCombo.value.selected_extras = selected_extras;
        selectedCombo.value.indication = indication;
      }
      showExtrasModal.value = false;
    };

    const addToOrderStore = () => {
      const combosToAdd = combos.value.filter((combo) => combo.quantity > 0);
      
      combosToAdd.forEach((combo) => {
        // Mapear productos del combo para la estructura items
        const comboItems = (combo.combo_products || []).map(cp => {
          const item = {
            combo_product_id: cp.id,
            product_id: cp.product?.id || cp.product,  // ✅ Asegurar que product_id esté presente
            product_name: cp.product_name || cp.product?.name || 'Producto',
            quantity: cp.quantity
          };
          
          // Solo incluir kardex_map si existe y no es null
          if (cp.kardex_map) {
            item.kardex_map = cp.kardex_map;
          }
          
          return item;
        });

        // Agregar el combo una sola vez con la cantidad correcta
        orderStore.addComboOrder({
          from_combo: true,
          order_detail_id: null,
          combo_id: combo.id,
          product_set_id: combo.id,
          name: combo.name,
          set_type: 'COMBO',
          pricing_mode: combo.pricing_mode,
          fixed_price: combo.fixed_price,
          computed_price: combo.computed_price,
          price: combo.fixed_price || combo.computed_price || 0,
          quantity: combo.quantity,
          items: comboItems,
          selected_extras: combo.selected_extras || [],
          indication: combo.indication || "",
          // Para cálculos de impuestos
          product_affectation: combo.affectation || 20,
          product_igv: combo.igv_tax || settingsStore.businessSettings.sale.igv_tax,
          icbper: false,
        });
        
        // Reset combo quantity
        combo.quantity = 0;
        combo.selected_extras = [];
        combo.indication = "";
      });
      
      message.success("Combos agregados al pedido");
    };

    const performCreateTableOrder = () => {
      loadingOrder.value = true;
      createTableOrder(
        route.params.table,
        orderStore.orderList,
        undefined,
        !ask_for.value ? undefined : ask_for.value
      )
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");
            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);
            tableStore.refreshData();
            orderStore.orders = orderStore.orders.filter(
              (order) => order.from_menu
            );
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loadingOrder.value = false;
        });
    };

    const evalOrderList = (details) => {
      let list = [];
      details.forEach((order) => {
        let item = saleStore.order_initial.find((v) => v.id === order.id);
        if (!!item && order.quantity > item.quantity) {
          let newOrder = cloneDeep(order);
          newOrder.quantity = order.quantity - item.quantity;
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

    const performUpdateTableOrder = () => {
      loadingOrder.value = true;
      updateTableOrder(
        route.params.table,
        evalOrderList(orderStore.orderList),
        !ask_for.value ? undefined : ask_for.value
      )
        .then((response) => {
          if (response.status === 200) {
            message.success("Orden actualizada correctamente");
            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);
            tableStore.refreshData();
            orderStore.clearNewOrders();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loadingOrder.value = false;
        });
    };

    onMounted(() => {
      loadCombos();
    });

    return {
      loading,
      loadingOrder,
      search,
      combos,
      filteredCombos,
      showExtrasModal,
      selectedCombo,
      showAskFor,
      ask_for,
      showPdf,
      pdfData,
      ticketPreview,
      settingsStore,
      orderStore,
      openExtrasModal,
      handleExtrasSelected,
      addToOrderStore,
      performCreateTableOrder,
      performUpdateTableOrder,
    };
  },
});
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
