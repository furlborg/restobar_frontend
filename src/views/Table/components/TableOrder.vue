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
      <n-grid responsive="screen" cols="1 s:1 m:5 l:5 xl:5 2xl:5" :x-gap="12">
        <n-gi :span="3">
          <router-view />
        </n-gi>
        <n-gi span="2">
          <n-card class="h-100" title="Pedidos" :bordered="false" embedded>
            <template #header-extra>
              <div v-if="userStore.user.profile_des !== 'MOZO'">
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
              </div>
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
                    placeholder=""
                    clear-after-select
                    :render-label="renderLabel"
                    @select="selectProduct"
                  />
                </n-input-group>
              </n-form-item>
            </n-form>
            <n-scrollbar :x-scrollable="true" style="max-width: 900px">
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
                  <tr
                    v-for="(order, index) in orderStore.orderList"
                    :key="index"
                  >
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
                        :min="
                          order.id ? saleStore.getOrderQuantity(order.id) : 1
                        "
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
                        @click="validateSend()"
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
            </n-scrollbar>
          </n-card>
        </n-gi>
      </n-grid>
      <n-modal
        :class="{
          'w-100': genericsStore.device === 'mobile',
          'w-50': genericsStore.device === 'tablet',
          'w-25': genericsStore.device === 'desktop',
        }"
        preset="card"
        v-model:show="showUserConfirm"
        title="Registrar pedido"
        :mask-closable="false"
        closable
      >
        <n-form-item label="Ingrese código de usuario">
          <n-input type="password" v-model:value="userConfirm" placeholder="" />
        </n-form-item>
        <template #action>
          <n-space justify="end">
            <n-button
              type="success"
              :loading="loadingConfirm"
              :disabled="!userConfirm || loadingConfirm"
              secondary
              @click.prevent="
                orderStore.orderId
                  ? performUpdateTableOrder()
                  : performCreateTableOrder()
              "
              >Confirmar</n-button
            >
          </n-space>
        </template>
      </n-modal>
      <n-modal
        :class="{
          'w-100': genericsStore.device === 'mobile',
          'w-50': genericsStore.device === 'tablet',
          'w-25': genericsStore.device === 'desktop',
        }"
        preset="card"
        v-model:show="showConfirm"
        title="Eliminando comanda"
        :mask-closable="false"
        closable
      >
        <n-form>
          <n-grid cols="2" :x-gap="12">
            <n-form-item-gi label="Cantidad">
              <n-input-number
                v-model:value="deleteQuantity"
                min="1"
                :max="maxQuantity"
                placeholder=""
              />
            </n-form-item-gi>
            <n-form-item-gi label="Clave de seguridad">
              <n-input
                type="password"
                v-model:value="passConfirm"
                placeholder=""
              />
            </n-form-item-gi>
          </n-grid>
        </n-form>
        <template #action>
          <n-space justify="end">
            <n-button
              type="success"
              :disabled="!passConfirm"
              secondary
              @click.prevent="performDeleteDetail"
              >Confirmar</n-button
            >
          </n-space>
        </template>
      </n-modal>
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
import { defineComponent, ref, computed, onMounted, watchEffect, h } from "vue";
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from "vue-router";
import { NThing, NTag, NSpace, useDialog, useMessage } from "naive-ui";
import { useUserStore } from "@/store/modules/user";
import { useTableStore } from "@/store/modules/table";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
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
import { cloneDeep, lighten } from "@/utils";
import { generatePrintCopy } from "./PrintsCopy/printsCopy";

export default defineComponent({
  name: "TableOrder",
  components: {
    OrderIndications,
  },
  setup() {
    const userStore = useUserStore();
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
    const table = route.params.table;
    const genericsStore = useGenericsStore();
    const productStore = useProductStore();
    const tableStore = useTableStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const listType = ref("grid");
    const showModal = ref(false);
    const itemIndex = ref(null);
    const checkState = ref(false);
    const dateNow = ref(null);
    const tableName = ref(null);

    orderStore.orders = [];
    saleStore.order_initial = [];
    orderStore.orderId = null;

    watchEffect(() => {
      checkState.value =
        JSON.stringify(saleStore.order_initial) ===
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
              orderStore.orders = saleStore.order_initial;
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
              orderStore.orders = saleStore.order_initial;
              router.push(to);
            },
            closable: false,
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

    onMounted(async () => {
      await performRetrieveTableOrder();
      tableName.value = await tableStore.getTableByID(table).description;
      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const print = (val, update = false) => {
      message.success("Orden actualizada correctamente");
      checkState.value = true;

      let lengthData = 0;

      let structure = [
        {
          dat: [
            [
              {
                content: `ORDEN: ${val.id}`,
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
                content: `${update ? "ACTUALIZACION DE " : ""}MESA: ${
                  tableStore.getTableByID(table).description
                }`,
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
      let thisIndicatesIfEverythingIsToGO = [];

      val.order_details.map((valOrder) => {
        let lC = 0;

        if (!!valOrder.preparation_place) {
          let ind = "";
          let PL = [];

          valOrder.indication.map((v, i) => {
            if (!!v.takeAway && v.takeAway) {
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

              if (!!v.takeAway && v.takeAway) {
                ind = `${ind}${
                  i + 1
                }-${cadenaConCaracteres}${"\n[¡PARA LLEVAR!]"}`;
              } else {
                ind = `${ind}${i + 1}-${cadenaConCaracteres}${"\n"}`;
              }
              lengthData += lC * 6.5;
            }
          });

          if (!!ind === false && PL.length > 0) {
            ind = `${PL.length} para llevar`;
            lengthData += 6.5;
          } else if (
            !!ind &&
            PL.length > 0 &&
            PL.length !== valOrder.indication.length
          ) {
            ind += `\n y ${PL.length} para llevar`;
            lengthData += 6.5;
          } else if (
            !!ind === false &&
            valOrder.indication.length !== 0 &&
            PL.length !== 0 &&
            PL.length === valOrder.indication.length
          ) {
            ind = `para llevar`;
            lengthData += 6.5;
          }

          let prodDetail = !!valOrder.product_description
            ? valOrder.product_description.split(",")
            : valOrder.product_description;

          let newNameProd = valOrder.product_name;

          let heightForNmae = 10;

          let verifyNameCombo = "";

          if (
            (valOrder.product_category.toLowerCase().includes("combo") ||
              valOrder.product_category.toLowerCase().includes("menu") ||
              valOrder.product_category.toLowerCase().includes("menus") ||
              valOrder.product_category.toLowerCase().includes("combos")) &&
            !!prodDetail &&
            prodDetail.length > 0
          ) {
            prodDetail.map((v, index) => {
              verifyNameCombo += `${index !== 0 ? "\n-" : "-"} ${v.trim()}`;
              lengthData += 6.5;
            });
          }

          if (
            valOrder.product_category.toLowerCase().includes("menu") ||
            valOrder.product_category.toLowerCase().includes("menus")
          ) {
            newNameProd = `[MENU] ${newNameProd}`;
          } else if (
            (!!valOrder.product_category.toLowerCase().includes("menu") ===
              false ||
              !!valOrder.product_category.toLowerCase().includes("menus") ===
                false) &&
            (!!valOrder.product_category.toLowerCase().includes("combo") ===
              false ||
              !!valOrder.product_category.toLowerCase().includes("combo") ===
                false)
          ) {
            newNameProd = `[CARTA] ${newNameProd}`;
          }

          lengthData += 7 * heightForNmae;

          if (
            valOrder.indication.length > 0 &&
            valOrder.indication.length === PL.length
          ) {
            thisIndicatesIfEverythingIsToGO.push(true);
          }
          structure.push(
            {
              line: true,
              dat: [
                [
                  {
                    content: `• ${newNameProd}`,
                    styles: {
                      fontStyle: "bold",
                      fontSize: process.env.VUE_APP_PRODUCT_SIZE,
                    },
                  },
                ],
              ],
            },
            verifyNameCombo && {
              dat: [
                [
                  {
                    content: verifyNameCombo,
                    styles: {
                      fontSize: 12,
                    },
                  },
                ],
              ],
            },
            ind && {
              dat: [
                [
                  {
                    content: ind,
                    styles: {
                      fontStyle: "bold",
                      fontSize: 12,
                    },
                  },
                ],
              ],
            },
            {
              dat: [
                [
                  {
                    content: `Cant.: ${valOrder.quantity}`,
                    styles: {
                      fontStyle: "bold",
                      fontSize: 12,
                    },
                  },
                ],
              ],
            }
          );
        }
      });

      if (val.order_details.length === thisIndicatesIfEverythingIsToGO.length) {
        structure.splice(1, 0, {
          dat: [
            [
              {
                content: "PARA LLEVAR",
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 14,
                },
              },
            ],
          ],
        });
      }

      structure.push({
        line: true,
        dat: [
          {
            tittle: "Fecha",
            twoPoints: ":",
            cont: dateNow.value,
          },
        ],
      });
      console.log(val);
      console.log(val.username);
      if (!!val.username) {
        lengthData += 10;
        structure.push({
          dat: [
            [
              {
                content: `MOZO: ${val.username}`,
                styles: {
                  fontStyle: "bold",
                  halign: "right",
                  fontSize: 16,
                },
              },
            ],
          ],
        });
      }

      const a = val.order_details.filter(
        (valOrd) => !!valOrd.preparation_place
      );

      if (a.length > 0) {
        generatePrintCopy(structure, lengthData);
      }

      router.push({ name: "TableHome" });
    };

    const performCreateTableOrder = async () => {
      await createTableOrder(
        route.params.table,
        orderStore.orderList,
        userConfirm.value
      )
        .then((response) => {
          if (response.status === 201) {
            print(response.data);
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          userConfirm.value = "";
          loadingConfirm.value = false;
          showUserConfirm.value = false;
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
      await updateTableOrder(
        route.params.table,
        orderStore.orderId,
        orderStore.orderList,
        userConfirm.value
      )
        .then((response) => {
          if (response.status === 202) {
            response.data.order_details = evalOrderList(
              response.data.order_details
            );
            print(response.data, true);
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          userConfirm.value = "";
          loadingConfirm.value = false;
          showUserConfirm.value = false;
        });
    };

    const nullifyTableOrder = () => {
      if (!orderStore.orderList.length && orderStore.orderId) {
        dialog.error({
          title: "Anular pedido",
          content: "¿Está seguro?",
          positiveText: "Sí",
          negativeText: "No",
          onPositiveClick: async () => {
            await performNullifyTableOrder();
          },
        });
      }
    };

    const performNullifyTableOrder = async () => {
      await cancelTableOrder(table)
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

    const showConfirm = ref(false);

    const passConfirm = ref("");

    const deleteQuantity = ref(1);

    const maxQuantity = ref(1);

    const removingItem = ref({ ind: null, id: null });

    const performDeleteDetail = async () => {
      await performDeleteOrderDetail(
        route.params.table,
        removingItem.value.id,
        passConfirm.value,
        deleteQuantity.value
      )
        .then((response) => {
          if (response.status === 204) {
            orderStore.orderList.splice(removingItem.value.ind, 1);
            saleStore.order_initial.splice(removingItem.value.ind, 1);
            message.success("Comanda eliminada");
            removingItem.value.ind = "";
            removingItem.value.id = "";
            passConfirm.value = "";
            deleteQuantity.value = 1;
            maxQuantity.value = 1;
            showConfirm.value = false;
            nullifyTableOrder();
          } else if (response.status === 202) {
            orderStore.orderList[removingItem.value.ind].quantity -=
              response.data.quantity;
            saleStore.order_initial[removingItem.value.ind].quantity -=
              response.data.quantity;
            saleStore.order_initial[removingItem.value.ind].subTotal =
              saleStore.order_initial[removingItem.value.ind].quantity *
              saleStore.order_initial[removingItem.value.ind].price;
            message.success("Comanda actualizada correctamente");
            removingItem.value.ind = "";
            removingItem.value.id = "";
            passConfirm.value = "";
            deleteQuantity.value = 1;
            maxQuantity.value = 1;
            showConfirm.value = false;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal");
        });
    };

    const deleteOrderDetail = (detailIndex, detailId) => {
      removingItem.value.ind = detailIndex;
      removingItem.value.id = detailId;
      deleteQuantity.value = saleStore.getOrderQuantity(detailId);
      maxQuantity.value = saleStore.getOrderQuantity(detailId);
      showConfirm.value = true;
    };

    const searching = ref(false);

    const productSearch = ref("");

    const products = ref([]);

    const productOptions = computed(() => {
      return products.value.map((product) => ({
        value: product.id,
        label: product.name,
        disabled: product.is_disabled,
        category: productStore.getCategorieDescription(product.category),
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
    };

    const renderLabel = (option) => {
      const t = option.label.split("-");
      let color = "#3B689F";
      let text = "MESA";
      if (t.length > 1) {
        if (t[1].includes("LL")) {
          color = "#926ED7";
          text = "PARA LLEVAR";
        } else if (t[1].includes("D")) {
          color = "#995C4E";
          text = "DELIVERY";
        }
      }
      return h(
        NThing,
        {
          title: t[0],
        },
        {
          default: () => "",
          description: () =>
            h(
              NSpace,
              {},
              {
                default: () => [
                  h(
                    NTag,
                    {
                      size: "small",
                      type: "info",
                    },
                    {
                      default: () =>
                        option.category.toLowerCase().includes("menu")
                          ? "MENU"
                          : option.category.toLowerCase().includes("comb")
                          ? "COMBO"
                          : "CARTA",
                    }
                  ),
                  h(
                    NTag,
                    {
                      size: "small",
                      color: {
                        color: lighten(color, 48),
                        textColor: color,
                        borderColor: lighten(color, 24),
                      },
                    },
                    {
                      default: () => text,
                    }
                  ),
                  h(
                    NTag,
                    {
                      size: "small",
                      type: "info",
                    },
                    {
                      default: () => option.category,
                    }
                  ),
                ],
              }
            ),
        }
      );
    };

    const showUserConfirm = ref(false);

    const loadingConfirm = ref(false);

    const userConfirm = ref("");

    const handleBack = () => {
      router.push({ name: "TableHome" });
    };

    const validateSend = () => {
      if (userStore.user.profile_des === "MOZO") {
        showUserConfirm.value = true;
      } else {
        if (!orderStore.orderId) {
          performCreateTableOrder();
        } else {
          performUpdateTableOrder();
        }
      }
    };

    return {
      showModal,
      itemIndex,
      table,
      listType,
      userStore,
      orderStore,
      saleStore,
      handleBack,
      renderLabel,
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
      showConfirm,
      passConfirm,
      performDeleteDetail,
      deleteQuantity,
      maxQuantity,
      genericsStore,
      showUserConfirm,
      userConfirm,
      loadingConfirm,
      validateSend,
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
