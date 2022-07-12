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
      <n-list-item v-for="(product, index) in filteredProducts" :key="product.id">
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
            <n-text
              :delete="!product.has_stock || !product.has_supplies"
              :type="
                product.has_stock
                  ? product.has_supplies
                    ? 'default'
                    : 'error'
                  : 'error'
              "
              >{{ product.name }}</n-text
            >
            <n-text>S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text>
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
      <n-drawer-content title="Pedidos" closable>
        <n-list>
          <n-list-item
            v-for="(orderItem, index) in waiterStore.preOrderList"
            :key="index"
          >
            <n-thing
              :title="`${orderItem.quantity} - ${orderItem.product_name}`"
              :title-extra="`S/. ${
                Number(orderItem.quantity) *
                parseFloat(orderItem.price).toFixed(2)
              }`"
              ><n-button
                type="info"
                text
                @click="
                  orderItemIndex = index;
                  showModal = true;
                "
                >Indicaciones</n-button
              ></n-thing
            >
            <template #suffix>
              <n-button
                type="error"
                text
                @click="waiterStore.preOrderList.splice(index, 1)"
              >
                <v-icon name="md-disabledbydefault-round" />
              </n-button>
            </template>
          </n-list-item>
        </n-list>
        <template #footer>
          <n-space class="w-100" justify="center">
            <n-button type="error" secondary>Cancelar pedido</n-button>
            <n-button
              :disabled="loading"
              :loading="loading"
              type="info"
              secondary
              @click="
                orderStore.orderId
                  ? performUpdateTableOrder()
                  : performCreateTableOrder()
              "
              >{{ orderStore.orderId ? "Añadir" : "Realizar" }} pedido</n-button
            >
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script>
import printOrderTicket from "@/hooks/PrintsTemplates/Ticket/OrderTicket.js";
import printWEBADASDEBRASEROS from "@/hooks/PrintsTemplates/Ticket/WEBADASDEBRASEROS.js";
import { useSettingsStore } from "@/store/modules/settings";
import { defineComponent, ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import ProductIndications from "./ProductIndications";
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
  },
  setup() {
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
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
    const search = ref('');
    const products = ref([]);
    const table = route.params.table;

    const filteredProducts = computed(() => {
      return products.value.filter(
        (product) => product.name.toLowerCase().includes(search.value.toLowerCase())
      )
    })

    const performCreateTableOrder = () => {
      addToList();
      loading.value = true;
      createTableOrder(route.params.table, orderStore.orderList)
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");

            // printOrderTicket({
            //   data: response.data,
            //   table,
            // });

            switch (
              settingsStore.business_settings.printer.kitchen_ticket_format
            ) {
              case 1:
                printOrderTicket({ data: response.data, table });
                break;
              case 2:
                printWEBADASDEBRASEROS({ data: response.data, table });
                break;

              default:
                message.error("No se encontro el formato de impresion");
            }

            activeDrawer.value = false;
            tableStore.refreshData();
            waiterStore.preOrderList = [];
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

    const performUpdateTableOrder = async () => {
      addToList();
      loading.value = true;
      await updateTableOrder(
        route.params.table,
        orderStore.orderId,
        orderStore.orderList
      )
        .then((response) => {
          if (response.status === 202) {
            message.success("Orden actualizada correctamente");
            response.data.order_details = evalOrderList(
              response.data.order_details
            );

            // printOrderTicket({
            //   data: response.data,
            //   table,
            //   updateOrder: true,
            // });

            switch (
              settingsStore.business_settings.printer.kitchen_ticket_format
            ) {
              case 1:
                console.log(1);
                printOrderTicket({
                  data: response.data,
                  table,
                  updateOrder: true,
                });
                break;
              case 2:
                console.log(2);
                printWEBADASDEBRASEROS({
                  data: response.data,
                  table,
                  updateOrder: true,
                });
                break;

              default:
                message.error("No se encontro el formato de impresion");
            }

            activeDrawer.value = false;
            tableStore.refreshData();
            waiterStore.preOrderList = [];
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
          const existence = waiterStore.preOrderList.find(
            (order) => order.id === product.id
          );
          if (typeof existence !== "undefined") {
            existence.quantity += product.quantity;
          } else {
            let order = {
              id: product.id,
              product_name: product.name,
              price: product.prices,
              quantity: Number(product.quantity),
              indication: [],
            };
            waiterStore.preOrderList.push(order);
          }
        }
        product.quantity = 0;
        product.indications = [];
      });
    };

    const addToList = () => {
      waiterStore.preOrderList.forEach((product) => {
        orderStore.addOrderItem(product);
      });
    };

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
