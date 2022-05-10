<template>
  <n-tabs type="line" justify-content="space-around">
    <template #prefix>
      <n-button class="ms-2" text @click="$router.back()">
        <v-icon name="md-arrowback-round" />
      </n-button>
    </template>
    <n-tab-pane class="p-0" name="menu" tab="Carta">
      <router-view></router-view>
    </n-tab-pane>
    <n-tab-pane name="order" tab="Pedido" :disabled="!orderStore.orderId">
      <n-card title="Pedido" size="small" :segmented="{ content: 'hard' }">
        <!-- <n-h2>Pedido</n-h2> -->
        <n-list class="m-0">
          <n-list-item
            v-for="(order, index) in orderStore.orderList"
            :key="index"
          >
            <n-thing
              :title="`${order.quantity} - ${order.product_name}`"
              :title-extra="`S/. ${order.quantity * order.price.toFixed(2)}`"
              @click="
                itemIndex = index;
                showModal = true;
              "
            />
          </n-list-item>
        </n-list>
      </n-card>
      <ProductIndications
        v-model:show="showModal"
        preset="card"
        title="Indicaciones"
        :product="orderStore.orderList[itemIndex]"
        @success="showModal = false"
      ></ProductIndications>
    </n-tab-pane>
  </n-tabs>
</template>

<script>
import { defineComponent, ref, onUpdated, onMounted } from "vue";
import { useMessage, useDialog } from "naive-ui";
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from "vue-router";
import ProductIndications from "./ProductIndications";
import { useWaiterStore } from "@/store/modules/waiter";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { retrieveTableOrder } from "@/api/modules/tables";
import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "WOrder",
  components: {
    ProductIndications,
  },
  setup() {
    const waiterStore = useWaiterStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const message = useMessage();
    const dialog = useDialog();
    const route = useRoute();
    const router = useRouter();
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

    return {
      waiterStore,
      orderStore,
      showModal,
      itemIndex,
      orderDetails,
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