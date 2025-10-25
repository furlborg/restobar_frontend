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
      :product="waiterStore.preOrderList[orderItemIndex]"
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
            @click="addToPreList"
            ><v-icon class="me-1" name="md-add-round" /> Agregar</n-button
          >
        </transition>
        <n-button
          type="info"
          :disabled="!(waiterStore.preOrderList.length > 0)"
          round
          @click="activeDrawer = true"
          ><v-icon class="me-1" name="md-shoppingcart-round" />Ver
          pedido</n-button
        >
      </n-space>
    </teleport>
    <n-drawer height="50%" v-model:show="activeDrawer" placement="bottom">
      <n-drawer-content
        title="Pedidos"
        footer-style="padding: 0; height: 50px"
        body-style="padding: 0"
        body-content-style="padding: 6px"
        closable
      >
        <n-list>
          <n-list-item
            class="py-1"
            v-for="(orderItem, index) in waiterStore.preOrderList"
            :key="index"
          >
            <n-thing>
              <template #header>
                <n-button
                  class="fs-5"
                  type="info"
                  text
                  @click="
                    orderItemIndex = index;
                    showModal = true;
                  "
                  >{{ orderItem.product_name }}</n-button
                >
              </template>
              <n-space align="center" justify="space-between">
                <n-input-group>
                  <n-button
                    type="warning"
                    size="small"
                    primary
                    :disabled="orderItem.quantity <= 1"
                    @click.stop="orderItem.quantity--"
                  >
                    <v-icon name="md-remove-round" />
                  </n-button>
                  <n-input-number
                    v-model:value="orderItem.quantity"
                    style="width: 50px"
                    placeholder=""
                    :min="1"
                    :show-button="false"
                    size="small"
                    readonly
                    @click.stop
                  />
                  <n-button
                    type="warning"
                    size="small"
                    primary
                    @click.stop="orderItem.quantity++"
                  >
                    <v-icon name="md-add-round" />
                  </n-button>
                </n-input-group>
                <n-tag>{{
                  `S/. ${
                    Number(orderItem.quantity) *
                    parseFloat(orderItem.price).toFixed(2)
                  }`
                }}</n-tag>
                <!-- <n-text class="fs-6">
                {{
                  `S/. ${
                    Number(orderItem.quantity) *
                    parseFloat(orderItem.price).toFixed(2)
                  }`
                }}
              </n-text> -->
              </n-space>
            </n-thing>
            <template #suffix>
              <n-button
                type="error"
                text
                @click.stop="waiterStore.preOrderList.splice(index, 1)"
              >
                <v-icon name="md-disabledbydefault-round" scale="1.25" />
              </n-button>
            </template>
          </n-list-item>
        </n-list>
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
        <template #footer>
          <n-button
            class="h-100"
            :disabled="loading"
            :loading="loading"
            type="info"
            secondary
            block
            @click="
              orderStore.orderId
                ? performUpdateTableOrder()
                : settingsStore.business_settings.order.order_customer_name
                ? (showAskFor = true)
                : performCreateTableOrder()
            "
            >{{ orderStore.orderId ? "Añadir" : "Realizar" }} pedido</n-button
          >
        </template>
      </n-drawer-content>
    </n-drawer>
    <ticket-preview
      ref="ticketPreview"
      v-model:show="showPdf"
      :data="pdfData"
      :hidden="true"
      :isUpdate="!!orderStore.orderId"
      @printed="() => $router.push({ name: 'WHome' })"
      @canceled="() => $router.push({ name: 'WHome' })"
    />
  </div>
</template>

<script>
import { useSettingsStore } from "@/store/modules/settings";
import { computed, defineComponent, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useMessage } from "naive-ui";
import ProductIndications from "./ProductIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
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
    const activeDrawer = ref(false);
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
      addToList();
      loading.value = true;
        // const createNewOrder = expandOrderList(orderStore.orderList);
        createTableOrder(route.params.table, orderStore.orderList, undefined, !ask_for.value ? undefined : ask_for.value)
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");

            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);

            activeDrawer.value = false;
            tableStore.refreshData();
            waiterStore.preOrderList = [];
            // router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
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
      addToList();
      loading.value = true;
        
        // const createNewOrder = expandOrderList(orderStore.orderList);

        await updateTableOrder(route.params.table, orderStore.orderId, orderStore.orderList, undefined, !ask_for.value ? undefined : ask_for.value)
        .then((response) => {
          if (response.status === 202) {
            message.success("Orden actualizada correctamente");
            response.data.order_details = evalOrderList(
              response.data.order_details
            );

            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);

            activeDrawer.value = false;
            tableStore.refreshData();
            waiterStore.preOrderList = [];
            // router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
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

      const addToPreList = () => {
          filteredProducts.value.forEach((product) => {
              if (product.quantity > 0) {
                  // Normalizamos quick_indications como array
                  const quicks = typeof product.quick_indications === 'string'
                                 ? product.quick_indications.split(',').map(q => q.trim()).filter(Boolean)
                                 : Array.isArray(product.quick_indications)
                                   ? [...product.quick_indications]
                                   : [];

                  // Normalizamos indicaciones
                  const indications = Array.isArray(product.indication) ? product.indication.map(i => ({
                      ...i,
                      quick_indications: typeof i.quick_indications === 'string'
                                         ? i.quick_indications.split(',').map(q => q.trim()).filter(Boolean)
                                         : Array.isArray(i.quick_indications)
                                           ? [...i.quick_indications]
                                           : []
                  })) : [];

                  // Creamos un key único que refleje exactamente la combinación de indicaciones
                  const key = product.id + '__' + indications.map(i => i.description).join('|') + '__' + quicks.join('|');

                  // Verificamos si ya existe exactamente la misma combinación
                  const existence = waiterStore.preOrderList.find(order => order._key === key);

                  if (existence) {
                      // Si es exactamente igual, acumulamos la cantidad
                      existence.quantity += product.quantity;
                  } else {
                      // Si no existe, creamos un nuevo objeto independiente
                      waiterStore.preOrderList.push({
                          _key: key,
                          id: product.id,
                          name: product.name,
                          product_name: product.name,
                          prices: product.prices,
                          price: product.prices,
                          quantity: product.quantity,
                          indication: indications,
                          icbper: product.icbper,
                          affectation: product.affectation,
                          igv_tax: product.igv_tax,
                          quick_indications: quicks
                      });
                  }
              }

              // Reset
              product.quantity = 0;
              product.indication = [];
              product.quick_indications = [];
          });
      };

      const addToList = () => {
          waiterStore.preOrderList.forEach((product) => {
              const indications = Array.isArray(product.indication) ? product.indication : [];
              const quicks = Array.isArray(product.quick_indications) ? product.quick_indications : [];

              // Si no hay indicaciones, se envía tal cual
              if (indications.length === 0) {
                  const safeItem = {
                      ...product,
                      product: product.id,
                      id: null,
                      fromBackend: false,
                      indication: [],
                      quick_indications: [...quicks],
                      quantity: product.quantity
                  };
                  orderStore.addOrderItem(safeItem);
              } else {
                  // Por cada indicación, enviamos un objeto separado
                  indications.forEach((ind) => {
                      const indQuicks = Array.isArray(ind.quick_indications) ? [...ind.quick_indications] : [];
                      const safeItem = {
                          ...product,
                          product: product.id,
                          id: null,
                          fromBackend: false,
                          indication: [{
                              ...ind,
                              quick_indications: indQuicks
                          }],
                          quick_indications: [...quicks],
                          quantity: 1 // cada indicación es un item separado
                      };
                      orderStore.addOrderItem(safeItem);
                  });
              }
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
      activeDrawer,
      showModal,
      productStore,
      waiterStore,
      orderItemIndex,
      filteredProducts,
      addToPreList,
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
