<template>
  <div id="TableOrder">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">Mesa {{ table }}</n-text>
        </n-space>
      </template>
    </n-page-header>
    <n-card>
      <n-grid responsive="screen" cols="5 s:5 m:5 l:5 xl:5 2xl:5" :x-gap="12">
        <n-gi :span="3">
          <router-view />
        </n-gi>
        <n-gi span="2">
          <n-card class="h-100" title="Pedidos" :bordered="false" embedded>
            <template #header-extra>
              <router-link
                class="text-decoration-none"
                :to="{
                  name: 'TablePayment',
                  params: { table: $route.params.table },
                }"
              >
                <n-button type="success" text>
                  <span class="fs-6">Cobrar</span>
                  <v-icon class="me-1" name="gi-money-stack" scale="1.5" />
                </n-button>
              </router-link>
            </template>
            <n-table>
              <thead>
                <tr>
                  <th width="10%"></th>
                  <th width="40%">Producto</th>
                  <th width="25%">Cantidad</th>
                  <th width="25%">SubTotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(order, index) in orderStore.orderList" :key="index">
                  <td>
                    <n-button
                      type="info"
                      text
                      @click="
                        itemIndex = index;
                        showModal = true;
                      "
                      ><v-icon name="md-listalt-round"
                    /></n-button>
                  </td>
                  <td>
                    {{ order.product_name }}
                  </td>
                  <td>
                    <n-input-number
                      class="border-top-0"
                      v-model:value="order.quantity"
                      @update:value="
                        order.quantity === 0
                          ? orderStore.orders.splice(index, 1)
                          : null
                      "
                    />
                  </td>
                  <td>S/. {{ order.subTotal }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">
                    <n-button type="info" text block>
                      <v-icon
                        class="me-2"
                        name="md-notealt-twotone"
                        scale="2"
                      />
                      <span class="fs-4">Guardar pedido</span>
                    </n-button>
                  </td>
                  <td class="fs-6 fw-bold">
                    TOTAL S/. {{ orderStore.orderTotal }}
                  </td>
                </tr>
              </tfoot>
            </n-table>
          </n-card>
        </n-gi>
      </n-grid>
      <OrderIndications
        v-model:show="showModal"
        preset="card"
        title="Indicaciones"
        :product="orderStore.orderList[itemIndex]"
        @success="showModal = false"
      ></OrderIndications>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import OrderIndications from "./OrderIndications";
import { renderIcon } from "@/utils";
import { useOrderStore } from "@/store/modules/order";

export default defineComponent({
  name: "TableOrder",
  components: {
    OrderIndications,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const table = route.params.table;
    const orderStore = useOrderStore();
    const listType = ref("grid");
    const showModal = ref(false);
    const itemIndex = ref(null);

    const productOptions = [
      {
        label: "Editar",
        key: "edit",
        icon: renderIcon("ri-edit-fill"),
      },
      {
        label: "Eliminar",
        key: "delete",
        icon: renderIcon("ri-delete-bin-2-fill"),
      },
    ];

    const handleBack = () => {
      router.push({ name: "TableHome" });
    };

    return {
      showModal,
      itemIndex,
      table,
      handleBack,
      listType,
      productOptions,
      orderStore,
    };
  },
});
</script>

<style lang="scss" scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 1s, transform 1s;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}
</style>