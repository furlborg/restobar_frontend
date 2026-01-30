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
import { defineComponent, ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "naive-ui";
import ProductIndications from "./ProductIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import FloatingOrderButton from "@/WaiterMode/components/FloatingOrderButton.vue";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useWaiterStore } from "@/store/modules/waiter";
import { useSaleStore } from "@/store/modules/sale";
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

    const performCreateTableOrder = () => {
      loading.value = true;
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
      await updateTableOrder(
        route.params.table,
        orderStore.orderId,
        orderStore.orderList,
        undefined,
        !ask_for.value ? undefined : ask_for.value
      )
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

    const dateNow = ref(null);

    onMounted(async () => {
      loadProducts();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();
      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const addToOrderStore = () => {
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
