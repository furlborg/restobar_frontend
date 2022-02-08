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
                v-if="!($route.name === 'TablePayment')"
                class="text-decoration-none"
                :to="{
                  name: 'TablePayment',
                  params: { table: $route.params.table },
                }"
              >
                <n-button type="success" :disabled="!orderStore.orderId" text>
                  <v-icon class="me-1" name="fa-coins" />
                  <span class="fs-6">Cobrar</span>
                </n-button>
              </router-link>
              <router-link
                v-else
                class="text-decoration-none"
                :to="{
                  name: 'ProductCategories',
                  params: { table: $route.params.table },
                }"
              >
                <n-button type="info" text>
                  <v-icon class="me-1" name="md-add-round" />
                  <span class="fs-6">Añadir pedido</span>
                </n-button>
              </router-link>
            </template>
            <n-table>
              <thead>
                <tr>
                  <th width="10%"></th>
                  <th width="40%">Producto</th>
                  <th width="25%">Cantidad</th>
                  <th width="15%">SubTotal</th>
                  <th width="10%"></th>
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
                      :min="1"
                      v-model:value="order.quantity"
                    />
                  </td>
                  <td>S/. {{ order.subTotal }}</td>
                  <td>
                    <n-button
                      type="error"
                      text
                      @click="
                        !order.id
                          ? orderStore.orderList.splice(index, 1)
                          : deleteOrderDetail(index, order.id)
                      "
                    >
                      <v-icon name="md-disabledbydefault-round" />
                    </n-button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">
                    <n-button
                      v-if="!($route.name === 'TablePayment')"
                      :type="orderStore.orderId ? 'info' : 'primary'"
                      text
                      block
                      :disabled="!orderStore.orderList.length"
                      @click="
                        orderStore.orderId
                          ? performUpdateTableOrder()
                          : performCreateTableOrder()
                      "
                    >
                      <v-icon
                        class="me-2"
                        name="md-notealt-twotone"
                        scale="1.5"
                      />
                      <span class="fs-4"
                        >{{
                          orderStore.orderId ? "Guardar" : "Realizar"
                        }}
                        pedido</span
                      >
                    </n-button>
                  </td>
                  <td colspan="2" class="fs-6 fw-bold">
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
        :order="orderStore.orderList[itemIndex]"
        @success="showModal = false"
      ></OrderIndications>
    </n-card>
  </div>
</template>

<script>
import OrderIndications from "./OrderIndications";
import { defineComponent, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useDialog, useMessage } from "naive-ui";
import { useOrderStore } from "@/store/modules/order";
import {
  retrieveTableOrder,
  createTableOrder,
  updateTableOrder,
  performDeleteOrderDetail,
} from "@/api/modules/tables";

export default defineComponent({
  name: "TableOrder",
  components: {
    OrderIndications,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
    const table = route.params.table;
    const orderStore = useOrderStore();
    const listType = ref("grid");
    const showModal = ref(false);
    const itemIndex = ref(null);

    orderStore.orders = [];

    const performRetrieveTableOrder = () => {
      retrieveTableOrder(route.params.table)
        .then((response) => {
          if (response.status === 200) {
            orderStore.orders = response.data.order_details;
            orderStore.orderId = response.data.id;
          }
        })
        .catch((error) => {
          if (error.response.status === 404) {
            orderStore.orders = [];
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
        });
    };

    onMounted(() => {
      performRetrieveTableOrder();
    });

    const performCreateTableOrder = () => {
      createTableOrder(route.params.table, orderStore.orderList)
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");
            router.push({ name: "TableHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performUpdateTableOrder = () => {
      updateTableOrder(
        route.params.table,
        orderStore.orderId,
        orderStore.orderList
      )
        .then((response) => {
          if (response.status === 202) {
            message.success("Orden actualizada correctamente");
            router.push({ name: "TableHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const deleteOrderDetail = (detailIndex, detailId) => {
      dialog.error({
        title: "Eliminando comanda",
        content: "¿Está seguro?",
        positiveText: "Sí",
        onPositiveClick: () => {
          performDeleteOrderDetail(route.params.table, detailId).then(
            (response) => {
              if (response.status === 202) {
                orderStore.orderList.splice(detailIndex, 1);
                message.success("Comanda eliminada");
              }
            }
          );
        },
      });
    };

    const handleBack = () => {
      router.push({ name: "TableHome" });
    };

    return {
      showModal,
      itemIndex,
      table,
      handleBack,
      listType,
      orderStore,
      performCreateTableOrder,
      performUpdateTableOrder,
      deleteOrderDetail,
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