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
              <n-button
                v-if="!($route.name === 'TablePayment')"
                type="success"
                :disabled="!orderStore.orderId"
                text
                @click="
                  $router.push({
                    name: 'TablePayment',
                    params: { table: $route.params.table },
                  })
                "
              >
                <v-icon class="me-1" name="fa-coins" />
                <span class="fs-6">Cobrar</span>
              </n-button>
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
            <n-form v-if="!($route.name === 'TablePayment')">
              <n-form-item label="Buscar producto">
                <n-input-group>
                  <n-auto-complete
                    :input-props="{
                      autocomplete: 'disabled',
                    }"
                    v-model:value="productSearch"
                    :options="productOptions"
                    :get-show="showOptions"
                    :loading="searching"
                    @select="selectProduct"
                  />
                </n-input-group>
              </n-form-item>
            </n-form>
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
                      v-if="!($route.name === 'TablePayment')"
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
                      v-if="!($route.name === 'TablePayment')"
                      class="border-top-0"
                      size="small"
                      :min="1"
                      v-model:value="order.quantity"
                    />
                    <template v-else>
                      {{ order.quantity }}
                    </template>
                  </td>
                  <td>S/. {{ order.subTotal.toFixed(2) }}</td>
                  <td>
                    <n-button
                      v-if="!($route.name === 'TablePayment')"
                      type="error"
                      text
                      @click="
                        !order.id
                          ? (orderStore.orderList.splice(index, 1),
                            nullifyTableOrder())
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
                      :disabled="
                        orderStore.orderList.length ? checkState : true
                      "
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
                          orderStore.orderId ? "Actualizar" : "Realizar"
                        }}
                        pedido</span
                      >
                    </n-button>
                  </td>
                  <td colspan="2" class="fs-6 fw-bold">
                    S/. {{ orderStore.orderTotal.toFixed(2) }}
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
import { defineComponent, ref, computed, onMounted, watchEffect } from "vue";
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from "vue-router";
import { NSpace, useDialog, useMessage } from "naive-ui";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import {
  retrieveTableOrder,
  createTableOrder,
  updateTableOrder,
  cancelTableOrder,
  performDeleteOrderDetail,
} from "@/api/modules/tables";
import { searchProductByName } from "@/api/modules/products";
import { cloneDeep } from "@/utils";

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
    const saleStore = useSaleStore();
    const listType = ref("grid");
    const showModal = ref(false);
    const itemIndex = ref(null);
    const checkState = ref(false);
    const dateNow = ref(null);

    orderStore.orders = [];
    saleStore.sale_details = [];
    orderStore.orderId = null;

    watchEffect(() => {
      checkState.value =
        JSON.stringify(saleStore.sale_details) ===
        JSON.stringify(orderStore.orderList);
    });

    onBeforeRouteUpdate((to, from) => {
      if (to.name !== "ProductCategories" && to.name !== "CategoriesItems") {
        if (!checkState.value) {
          dialog.error({
            title: "Cambios sin guardar",
            content: "¿Salir de todos modos?",
            positiveText: "Sí",
            negativeText: "No",
            onPositiveClick: () => {
              checkState.value = true;
              router.push(to);
            },
          });
          return false;
        }
      }
    });

    onBeforeRouteLeave((to, from) => {
      if (to.name !== "ProductCategories" && to.name !== "CategoriesItems") {
        if (!checkState.value) {
          dialog.error({
            title: "Cambios sin guardar",
            content: "¿Salir de todos modos?",
            positiveText: "Sí",
            onPositiveClick: () => {
              checkState.value = true;
              router.push(to);
            },
          });
          return false;
        }
      }
    });

    const performRetrieveTableOrder = async () => {
      await retrieveTableOrder(route.params.table)
        .then((response) => {
          if (response.status === 200) {
            orderStore.orders = response.data.order_details;
            saleStore.sale_details = cloneDeep(orderStore.orderList);
            orderStore.orderId = response.data.id;
          }
        })
        .catch((error) => {
          if (error.response.status === 404) {
            orderStore.orders = [];
            saleStore.sale_details = [];
            orderStore.orderId = null;
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
        });
    };

    onMounted(() => {
      performRetrieveTableOrder();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm}/${yy} ${hh}:${msms}`;
    });

    const print = (responseData) => {
      message.success("Orden actualizada correctamente");
      checkState.value = true;

      let lC = 0;

      let lengthData = 0;

      let structure = [
        {
          dat: [
            [
              {
                content: `ORDEN: ${responseData.id}`,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 20,
                },
              },
            ],
          ],
        },
        {
          dat: [
            [
              {
                content: `MESA: ${"CHUPAMELA"}`,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 15,
                },
              },
            ],
          ],
        },
      ];

      responseData.order_details.map((val) => {
        let ind = "";
        let PL = [];

        val.indication.map((v, i) => {
          if (!!v.takeAway && v.takeAway && !!v.description === false) {
            PL.push(v.takeAway);
          }

          let cadenaConCaracteres = "";
          if (!!v.description) {
            let longitudCadena = v.description.length;

            for (let i = 0; i < longitudCadena; i += 40) {
              if (i + 40 < longitudCadena) {
                cadenaConCaracteres +=
                  v.description.substring(i, i + 40) + "\n";
                lC += v.description.length / 40;
              } else {
                cadenaConCaracteres += v.description.substring(
                  i,
                  longitudCadena
                );
              }
            }

            ind = `${ind}${i + 1}-${cadenaConCaracteres}${
              !!v.takeAway && v.takeAway ? " [¡PARA LLEVAR!]\n" : "\n"
            }`;
          }
        });

        if (ind && PL.length > 0) {
          lengthData += 6.5 * 2 + lC;
          ind = `${ind} \n y ${PL.length} para llevar`;
        }
        if (!!ind === false && PL.length > 0) {
          lengthData += 6.5 * 2 + lC;
          ind = `${PL.length} para llevar`;
        }

        lengthData += 6.5 * 3;

        structure.push(
          {
            line: true,
            dat: [
              [
                {
                  content: `PEDIDO`,
                  colSpan: "2",
                  rowSpan: "1",
                  styles: {
                    fontStyle: "bold",
                    fontSize: 8,
                  },
                },
                {
                  content: `CANT.`,
                  colSpan: "2",
                  rowSpan: "1",
                  styles: {
                    fontStyle: "bold",
                    fontSize: 8,
                  },
                },
              ],
            ],
          },

          {
            dat: [
              [
                {
                  content: val.product_name,
                  colSpan: "2",
                  rowSpan: "1",
                  styles: {
                    fontStyle: "bold",
                    fontSize: 8,
                  },
                },
                {
                  content: val.quantity,
                  colSpan: "2",
                  rowSpan: "1",
                  styles: {
                    fontStyle: "bold",
                    fontSize: 8,
                  },
                },
              ],
            ],
          }
        );
        if (ind) {
          lengthData += 6.5 * 2 + lC;
          structure.push({
            dat: [
              [
                {
                  content: `INDICACIONES`,
                  styles: {
                    fontStyle: "bold",
                    fontSize: 8,
                  },
                },
              ],
              [
                {
                  content: ind,
                  styles: {
                    fontStyle: "bold",
                    fontSize: 8,
                  },
                },
              ],
            ],
          });
        }
      });

      structure.push(
        {
          line: true,
          dat: [
            [
              {
                content: "ACA IRA UN TITULO DE MIERDA",
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 10,
                },
              },
            ],
          ],
        },
        {
          dat: [
            {
              tittle: "Fecha",
              twoPoints: ":",
              cont: dateNow.value,
            },
          ],
        }
      );

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      let requestOptions = {
        method: "POST",

        headers: myHeaders,
        body: JSON.stringify({
          height: lengthData,
          structure: structure,
          printerName: "CHUPAME LA PINGA OSCAR",
        }),
        redirect: "follow",
      };

      fetch("http://localhost:3000/printer", requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.log("error", error));

      router.push({ name: "TableHome" });
    };

    const performCreateTableOrder = async () => {
      createTableOrder(route.params.table, orderStore.orderList)
        .then((response) => {
          if (response.status === 201) {
            print(response.data);
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
            print(response.data);
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const nullifyTableOrder = () => {
      if (!orderStore.orderList.length && orderStore.orderId) {
        dialog.error({
          title: "Anular pedido",
          content: "¿Está seguro?",
          positiveText: "Sí",
          negativeText: "No",
          onPositiveClick: () => {
            performNullifyTableOrder();
          },
        });
      }
    };

    const performNullifyTableOrder = () => {
      cancelTableOrder(table)
        .then((response) => {
          if (response.status === 202) {
            message.success("Pedido anulado correctamente!");
            checkState.value = true;
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
                nullifyTableOrder();
              }
            }
          );
        },
      });
    };

    const searching = ref(false);

    const productSearch = ref("");

    const products = ref([]);

    const productOptions = computed(() => {
      return products.value.map((product) => ({
        value: product.id,
        label: product.name,
        disabled: product.is_disabled,
      }));
    });

    const showOptions = (value) => {
      if (value.length >= 3) {
        searching.value = true;
        searchProductByName(value)
          .then((response) => {
            if (response.status === 200) {
              products.value = response.data;
            }
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            searching.value = false;
          });
        return true;
      }
      return false;
    };

    const selectProduct = (v) => {
      const item = products.value.find((product) => product.id === v);
      orderStore.addOrder(item);
      productSearch.value = "";
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
      saleStore,
      performCreateTableOrder,
      performUpdateTableOrder,
      deleteOrderDetail,
      searching,
      checkState,
      productSearch,
      productOptions,
      showOptions,
      selectProduct,
      nullifyTableOrder,
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
