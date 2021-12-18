<template>
  <n-tabs type="line" justify-content="space-around">
    <template #prefix>
      <n-button class="ms-2" text @click="$router.push({ name: 'WHome' })">
        <v-icon name="md-arrowback-round" />
      </n-button>
    </template>
    <n-tab-pane class="p-0" name="menu" tab="Carta">
      <router-view></router-view>
    </n-tab-pane>
    <n-tab-pane name="order" tab="Pedido">
      <n-card title="Pedido" size="small" :segmented="{ content: 'hard' }">
        <!-- <n-h2>Pedido</n-h2> -->
        <n-list class="m-0">
          <n-list-item
            v-for="(order, index) in waiterStore.orderList"
            :key="index"
          >
            <n-thing
              :title="`${order.quantity} - ${order.title}`"
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
        :product="waiterStore.orderList[itemIndex]"
        @success="showModal = false"
      ></ProductIndications>
    </n-tab-pane>
  </n-tabs>
</template>

<script>
import { defineComponent, ref, onUpdated, onMounted } from "vue";
import ProductIndications from "./ProductIndications";
import { useWaiterStore } from "@/store/modules/waiter";

export default defineComponent({
  name: "WOrder",
  components: {
    ProductIndications,
  },
  setup() {
    const waiterStore = useWaiterStore();
    const showModal = ref(false);
    const itemIndex = ref(null);

    function setTabStyle() {
      let tab_nav = document.getElementsByClassName("n-tabs-nav");
      for (let i = 0; i < tab_nav.length; i++) {
        tab_nav[i].style.position = "absolute";
        tab_nav[i].style.zIndex = 1;
        tab_nav[i].style.backgroundColor = "White";
      }
    }

    onMounted(() => {
      setTabStyle();
    });

    onUpdated(() => {
      setTabStyle();
    });

    return {
      waiterStore,
      showModal,
      itemIndex,
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