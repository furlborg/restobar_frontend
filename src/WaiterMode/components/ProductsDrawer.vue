<template>
  <n-drawer
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="top"
    height="100%"
  >
    <n-drawer-content
      title="Productos"
      footer-style="padding: 0; height: 50px"
      closable
    >
      <n-auto-complete
        :input-props="{
          autocomplete: 'disabled',
        }"
        v-model:value="productSearch"
        :options="productOptions"
        :get-show="showOptions"
        :loading="searchingProduct"
        placeholder="Buscar..."
        clear-after-select
        :render-label="renderLabel"
        @select="selectProduct"
      />
      <n-list>
        <n-list-item
          v-for="(orderItem, index) in waiterStore.preOrderList"
          :key="index"
        >
          <n-thing>
            <template #header>
              <n-text
                class="fs-5"
                type="info"
                text
                @click="
                  orderItemIndex = index;
                  showModal = true;
                "
                >{{ orderItem.product_name }}</n-text
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
      <ProductIndications
        v-model:show="showModal"
        preset="card"
        title="Indicaciones"
        :product="waiterStore.preOrderList[orderItemIndex]"
        @success="showModal = false"
      ></ProductIndications>
      <template #footer>
        <n-button
          class="h-100 fs-4"
          type="info"
          secondary
          :disabled="!waiterStore.preOrderList.length || loading"
          :loading="loading"
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
      <ticket-preview
        ref="ticketPreview"
        v-model:show="showPdf"
        :data="pdfData"
        :hidden="true"
        :isUpdate="!!orderStore.orderId"
        @printed="() => $router.push({ name: 'WHome' })"
        @canceled="() => $router.push({ name: 'WHome' })"
      />
    </n-drawer-content>
  </n-drawer>
</template>

<script>
import printOrderTicket from "@/hooks/PrintsTemplates/Ticket/OrderTicket.js";
import printWEBADASDEBRASEROS from "@/hooks/PrintsTemplates/Ticket/WEBADASDEBRASEROS.js";
import ProductIndications from "../views/ProductIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import { h, defineComponent, ref, computed } from "vue";
import { NThing, NTag, NSpace, NText, useMessage, useDialog } from "naive-ui";
import { createTableOrder, updateTableOrder } from "@/api/modules/tables";
import { searchProductByName } from "@/api/modules/products";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { useWaiterStore } from "@/store/modules/waiter";
import { useOrderStore } from "@/store/modules/order";
import { useTableStore } from "@/store/modules/table";
import { useSaleStore } from "@/store/modules/sale";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { cloneDeep, lighten } from "@/utils";

export default defineComponent({
  name: "ProductsDrawer",
  components: {
    ProductIndications,
    TicketPreview,
  },
  props: {
    show: {
      type: Boolean,
    },
  },
  emits: ["update:show"],
  setup(props, { emit }) {
    const settingsStore = useSettingsStore();
    const productStore = useProductStore();
    const waiterStore = useWaiterStore();
    const orderStore = useOrderStore();
    const tableStore = useTableStore();
    const saleStore = useSaleStore();
    const router = useRouter();
    const route = useRoute();
    const table = route.params.table;

    const loading = ref(false);
    const orderItemIndex = ref(null);
    const showModal = ref(false);

    const message = useMessage();
    const dialog = useDialog();

    const searchingProduct = ref(false);

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
        searchingProduct.value = true;
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
            searchingProduct.value = false;
          });
        return true;
      }
      return false;
    };

    const selectProduct = (v) => {
      const item = products.value.find((product) => product.id === v);
      if (item.has_supplies) {
        if (item.has_stock) {
          addToPreList(item);
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

    const addToPreList = (product) => {
      const existence = waiterStore.preOrderList.find(
        (order) => order.id === product.id
      );
      if (typeof existence !== "undefined") {
        existence.quantity += 1;
      } else {
        let order = {
          id: product.id,
          product_name: product.name,
          price: product.prices,
          quantity: 1,
          indication: [],
        };
        waiterStore.preOrderList.push(order);
      }
      product.indications = [];
    };

    const performCreateTableOrder = () => {
      dialog.info({
        title: "¿Realizar pedido?",
        loading: loading.value,
        positiveText: "Si",
        negativeText: "No",
        onPositiveClick: async () => {
          addToList();
          loading.value = true;
          await createTableOrder(
            route.params.table,
            orderStore.orderList,
            undefined,
            !ask_for.value ? undefined : ask_for.value
          )
            .then((response) => {
              if (response.status === 201) {
                message.success("Orden creada correctamente");

                // printOrderTicket({
                //   data: response.data,
                //   table,
                // });

                // pdfData.value = response.data;
                // showPdf.value = true;
                // setTimeout(() => ticketPreview.value.generate(), 250);

                emit("update:show", false);
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
        },
        onNegativeClick: () => {},
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
      dialog.info({
        title: "¿Actualizar pedido?",
        positiveText: "Si",
        negativeText: "No",
        loading: loading.value,
        onPositiveClick: async () => {
          addToList();
          loading.value = true;
          await updateTableOrder(
            route.params.table,
            orderStore.orderId,
            orderStore.orderList,
            undefined,
            !ask_for.value ? undefined : ask_for.value
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

                // pdfData.value = response.data;
                // showPdf.value = true;
                // setTimeout(() => ticketPreview.value.generate(), 250);

                emit("update:show", false);
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
        },
        onNegativeClick: () => {},
      });
    };

    const addToList = () => {
      waiterStore.preOrderList.forEach((product) => {
        orderStore.addOrderItem(product);
      });
    };

    const showAskFor = ref(false);

    const ask_for = ref(null);

    const ticketPreview = ref(null);

    const showPdf = ref(false);

    const pdfData = ref(null);

    return {
      performCreateTableOrder,
      performUpdateTableOrder,
      waiterStore,
      orderStore,
      loading,
      searchingProduct,
      productSearch,
      productOptions,
      showOptions,
      selectProduct,
      renderLabel,
      orderItemIndex,
      showModal,
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

<style></style>
