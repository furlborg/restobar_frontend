<template>
  <div id="TableOrder">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">{{
            tableStore.getTableByID(table).description
          }}</n-text>
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
              <div v-if="userStore.hasPermission('charge_order')">
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
              <n-grid cols="2" x-gap="12">
                <n-form-item-gi
                  v-if="
                    settingsStore.businessSettings.order.order_customer_name
                  "
                  :span="
                    !settingsStore.businessSettings.order.select_order_user
                      ? 2
                      : 1
                  "
                  label="Cliente"
                >
                  <n-input
                    v-model:value="ask_for"
                    placeholder=""
                    :readonly="userStore.user.role === 'MOZO'"
                    :disabled="userStore.user.role === 'MOZO'"
                  />
                </n-form-item-gi>
                <n-form-item-gi
                  v-if="settingsStore.businessSettings.order.select_order_user"
                  :span="
                    !settingsStore.businessSettings.order.order_customer_name
                      ? 2
                      : 1
                  "
                  label="Mozo"
                >
                  <n-select
                    :options="activeUsersStore.usersOptions"
                    v-model:value="orderUser"
                    placeholder=""
                    filterable
                  />
                </n-form-item-gi>
              </n-grid>
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
              <n-table size="small">
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
                  <template v-for="(order, index) in orderStore.orderList">
                    <tr
                      v-if="order.quantity > 0"
                      :key="index"
                      style="cursor: pointer"
                      @click="
                        itemIndex = index;
                        showModal = true;
                      "
                    >
                      <td>
                        <n-button
                          v-if="!($route.name === 'TablePayment')"
                          type="info"
                          text
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
                          @click.stop
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
                          @click.stop="
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
                  </template>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">
                      <n-button
                        v-if="!($route.name === 'TablePayment')"
                        :type="orderStore.orderId ? 'info' : 'primary'"
                        text
                        block
                        :loading="loading"
                        :disabled="
                          orderStore.orderList.length
                            ? checkState || loading
                            : true
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
              :loading="loading"
              :disabled="!userConfirm || loading"
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
      <ticket-preview
        ref="ticketPreview"
        v-model:show="showPdf"
        :data="pdfData"
        :hidden="true"
        :isUpdate="!!orderStore.orderId"
        @printed="() => $router.push({ name: 'TableHome' })"
        @canceled="() => $router.push({ name: 'TableHome' })"
      />
    </n-card>
  </div>
</template>

<script>
import OrderIndications from "./OrderIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import { defineComponent, ref, computed, onMounted, watchEffect, h } from "vue";
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from "vue-router";
import { isAxiosError } from "axios";
import { NThing, NTag, NSpace, NText, useDialog, useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
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

export default defineComponent({
  name: "TableOrder",
  components: {
    OrderIndications,
    TicketPreview,
  },
  setup() {
    const userStore = useUserStore();
    const activeUsersStore = useActiveUsersStore();
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
    const tableStore = useTableStore();
    const table = route.params.table;
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const listType = ref("grid");
    const showModal = ref(false);
    const itemIndex = ref(null);
    const checkState = ref(false);
    const loading = ref(false);
    const dateNow = ref(null);
    const ask_for = ref(undefined);
    const orderUser = ref(null);

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
            ask_for.value = response.data.ask_for;
            orderStore.orders = response.data.order_details;
            saleStore.order_initial = cloneDeep(orderStore.orderList);
            orderStore.orderId = response.data.id;
            if (settingsStore.businessSettings.order.select_order_user) {
              orderUser.value = response.data.user_id;
            }
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
      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const performCreateTableOrder = async () => {
      loading.value = true;
      await createTableOrder(
        route.params.table,
        orderStore.orderList,
        !orderUser.value ? userConfirm.value : orderUser.value,
        ask_for.value
      )
        .then(async (response) => {
          if (response.status === 201) {
            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);
            checkState.value = true;
          }
        })
        .catch((error) => {
          if (isAxiosError(error)) {
            if (error.response.status === 400) {
              console.error(error);
              for (const value in error.response.data) {
                for (const ser in error.response.data[`${value}`]) {
                  if (
                    Array.isArray(error.response.data[`${value}`][`${ser}`])
                  ) {
                    error.response.data[`${value}`][`${ser}`].forEach((err) => {
                      if (typeof err === "object") {
                        for (const v in err) {
                          message.error(`${err[`${v}`]} (${ser})`);
                        }
                      } else {
                        message.error(`${err}`);
                      }
                    });
                  } else {
                    message.error(error.response.data[`${value}`][`${ser}`]);
                  }
                }
              }
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
        })
        .finally(() => {
          userConfirm.value = "";
          loadingConfirm.value = false;
          showUserConfirm.value = false;
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
        !orderUser.value ? userConfirm.value : orderUser.value,
        ask_for.value
      )
        .then(async (response) => {
          if (response.status === 202) {
            response.data.order_details = evalOrderList(
              response.data.order_details
            );
            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);
            checkState.value = true;
          }
        })
        .catch((error) => {
          if (isAxiosError(error)) {
            if (error.response.status === 400) {
              console.error(error);
              for (const value in error.response.data) {
                for (const ser in error.response.data[`${value}`]) {
                  if (
                    Array.isArray(error.response.data[`${value}`][`${ser}`])
                  ) {
                    error.response.data[`${value}`][`${ser}`].forEach((err) => {
                      if (typeof err === "object") {
                        for (const v in err) {
                          message.error(`${err[`${v}`]} (${ser})`);
                        }
                      } else {
                        message.error(`${err}`);
                      }
                    });
                  } else {
                    message.error(error.response.data[`${value}`][`${ser}`]);
                  }
                }
              }
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
        })
        .finally(() => {
          userConfirm.value = "";
          loadingConfirm.value = false;
          showUserConfirm.value = false;
          loading.value = false;
        });
    };

    const nullifyTableOrder = async () => {
      if (!orderStore.orderList.length && orderStore.orderId) {
        await performNullifyTableOrder();
        /* dialog.error({
          title: "Anular pedido",
          content: "¿Está seguro?",
          positiveText: "Sí",
          negativeText: "No",
          onPositiveClick: async () => {
            await performNullifyTableOrder();
          },
        }); */
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
      if (item.has_supplies) {
        if (item.has_stock) {
          orderStore.addOrder(item);
        }
      }
    };

    const searchProductOption = (v) => {
      const item = products.value.find((product) => product.id === v);
      return item ? item : null;
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
        {},
        {
          default: () => "",
          header: () =>
            h(
              NText,
              {
                delete:
                  !searchProductOption(option.value).has_stock ||
                  !searchProductOption(option.value).has_supplies,
                type: searchProductOption(option.value).has_supplies
                  ? searchProductOption(option.value).has_stock
                    ? "default"
                    : "error"
                  : "error",
              },
              {
                default: () => t[0],
              }
            ),
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
      if (userStore.user.role === "MOZO") {
        showUserConfirm.value = true;
      } else {
        if (!orderStore.orderId) {
          performCreateTableOrder();
        } else {
          performUpdateTableOrder();
        }
      }
    };

    const ticketPreview = ref(null);

    const showPdf = ref(false);

    const pdfData = ref(null);

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
      performNullifyTableOrder,
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
      loading,
      tableStore,
      ask_for,
      activeUsersStore,
      orderUser,
      settingsStore,
      ticketPreview,
      showPdf,
      pdfData,
    };
  },
});
</script>

<style lang="scss">
.slide-enter-active,
.slide-leave-active {
  transition: opacity 1s, transform 1s;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}

.n-form-item .n-form-item-feedback-wrapper {
  min-height: 12px;
}
</style>
