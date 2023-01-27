<template>
  <n-tabs type="line" justify-content="space-around">
    <template #prefix>
      <n-button
        class="ms-2"
        :disabled="$route.name !== 'WCategories'"
        text
        @click="showDrawer = true"
      >
        <v-icon name="md-search-round" />
      </n-button>
      <ProductsDrawer v-model:show="showDrawer" />
    </template>
    <n-tab-pane class="p-0" name="menu" tab="Carta">
      <router-view></router-view>
    </n-tab-pane>
    <n-tab-pane
      id="OrderPane"
      name="order"
      tab="Pedido"
      :disabled="!orderStore.orderId"
    >
      <n-card title="Pedido" size="small" :segmented="{ content: 'hard' }">
        <template #header-extra>
          <n-button
            v-if="userStore.hasPermission('print_order_prebill')"
            type="info"
            secondary
            size="small"
            @click="printOrderPrebill"
          >
            <v-icon name="fa-file-invoice-dollar" />
          </n-button>
        </template>
        <!-- <n-h2>Pedido</n-h2> -->
        <n-list class="m-0">
          <template v-for="(order, index) in orderStore.orderList">
            <n-list-item v-if="order.quantity > 0" :key="index">
              <n-thing>
                <template #header>
                  <n-tag>{{ order.quantity }}</n-tag>
                  <n-text class="ms-2">{{ order.product_name }}</n-text>
                </template>
                <template #header-extra>
                  <n-text>{{
                    `S/. ${order.quantity * order.price.toFixed(2)}`
                  }}</n-text>
                </template>
              </n-thing>
              <!-- @click="
                itemIndex = index;
                showModal = true;
              " -->
            </n-list-item>
          </template>
        </n-list>
      </n-card>
      <ProductIndications
        v-model:show="showModal"
        preset="card"
        title="Indicaciones"
        :product="orderStore.orderList[itemIndex]"
        @success="showModal = false"
      />
      <preview-drawer
        ref="previewDrawer"
        v-model:show="showPreview"
        :data="previewData"
        :preVoucher="true"
        :previewOnly="true"
      />
    </n-tab-pane>
  </n-tabs>
</template>

<script>
import { defineComponent, ref, onUpdated, onMounted } from "vue";
import ProductsDrawer from "../components/ProductsDrawer";
import { useMessage, useDialog } from "naive-ui";
import { isAxiosError } from "axios";
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from "vue-router";
import ProductIndications from "./ProductIndications";
import { useBusinessStore } from "@/store/modules/business";
import { useWaiterStore } from "@/store/modules/waiter";
import { useOrderStore } from "@/store/modules/order";
import { useUserStore } from "@/store/modules/user";
import { useSaleStore } from "@/store/modules/sale";
import { retrieveTableOrder } from "@/api/modules/tables";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "WOrder",
  components: {
    ProductIndications,
    ProductsDrawer,
    PreviewDrawer,
  },
  setup() {
    const businessStore = useBusinessStore();
    const waiterStore = useWaiterStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const userStore = useUserStore();
    const message = useMessage();
    const dialog = useDialog();
    const route = useRoute();
    const router = useRouter();
    const showDrawer = ref(false);
    const showModal = ref(false);
    const itemIndex = ref(null);
    const orderDetails = ref([]);

    orderStore.orders = [];
    saleStore.order_initial = [];
    orderStore.orderId = null;

    onBeforeRouteUpdate((to, from) => {
      if (to.name !== "WCategories" && to.name !== "WProducts") {
        if (waiterStore.preOrderList.length) {
          dialog.error({
            title: "Cambios sin guardar",
            content: "¿Salir de todos modos?",
            positiveText: "Sí",
            negativeText: "No",
            onPositiveClick: () => {
              waiterStore.preOrderList = [];
              router.push(to);
            },
          });
          return false;
        }
      }
    });

    onBeforeRouteLeave((to, from) => {
      if (to.name !== "WCategories" && to.name !== "WProducts") {
        if (waiterStore.preOrderList.length) {
          dialog.error({
            title: "Cambios sin guardar",
            content: "¿Salir de todos modos?",
            positiveText: "Sí",
            onPositiveClick: () => {
              waiterStore.preOrderList = [];
              router.push(to);
            },
          });
          return false;
        }
      }
    });

    const performRetrieveTableOrder = () => {
      retrieveTableOrder(route.params.table)
        .then((response) => {
          if (response.status === 200) {
            orderStore.orders = response.data.order_details;
            saleStore.order_initial = cloneDeep(orderStore.orderList);
            orderStore.orderId = response.data.id;
          }
        })
        .catch((error) => {
          if (error.response.status === 404) {
            orderStore.orders = [];
            saleStore.order_initial = [];
            orderStore.orderId = null;
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
        });
    };

    const printOrderPrebill = async () => {
      await retrieveTableOrder(route.params.table)
        .then((response) => {
          if (response.status === 200) {
            previewData.value = response.data;
            showPreview.value = true;
            setTimeout(() => previewDrawer.value.generate(), 250);
          }
        })
        .catch((error) => {
          if (isAxiosError(error)) {
            if (error.response.status === 400) {
              for (const value in error.response.data) {
                error.response.data[`${value}`].forEach((err) => {
                  if (typeof err === "object") {
                    for (const v in err) {
                      message.error(`${err[`${v}`]}`);
                    }
                  } else {
                    message.error(`${err}`);
                  }
                });
              }
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
          message.error("Algo salió mal...");
          console.error(error);
        });
    };

    function setTabStyle() {
      let tab_nav = document.getElementsByClassName("n-tabs-nav");
      for (let i = 0; i < tab_nav.length; i++) {
        tab_nav[i].style.position = "absolute";
        tab_nav[i].style.zIndex = 1;
        tab_nav[i].style.backgroundColor = "White";
      }
    }

    onMounted(() => {
      waiterStore.preOrderList = [];
      performRetrieveTableOrder();
      setTabStyle();
    });

    onUpdated(() => {
      setTabStyle();
    });

    const previewDrawer = ref(null);

    const showPreview = ref(false);

    const previewData = ref(null);

    return {
      waiterStore,
      orderStore,
      showModal,
      itemIndex,
      orderDetails,
      showDrawer,
      printOrderPrebill,
      userStore,
      previewDrawer,
      showPreview,
      previewData,
    };
  },
});
</script>

<style lang="scss" scoped>
.n-tab-pane {
  position: relative;
  top: 42px;
}
</style>
