<template>
  <div id="WProducts">
    <n-page-header class="border-bottom border-2 border-success p-2">
      <template #title>
        <n-text class="fs-4">{{
          productStore.getCategorieDescription($route.params.category)
        }}</n-text>
      </template>
    </n-page-header>

    <n-list class="m-0 px-2">
      <n-list-item v-for="(product, index) in products" :key="product.id">
        <n-space vertical>
          <n-space
            justify="space-between"
            @click="product.quantity ? null : (product.quantity = 1)"
          >
            <n-text>{{ product.name }}</n-text>
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
            v-if="products.some((product) => product.quantity > 0)"
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
import { printPdf } from "@/hooks/PrintPdf.js";
import { useUserStore } from "@/store/modules/user";
import { defineComponent, ref, onMounted } from "vue";
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
import { useSettingsStore } from "@/store/modules/settings";
import {
  createTableOrder,
  updateTableOrder,
  performDeleteOrderDetail,
} from "@/api/modules/tables";

import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "WProducts",
  components: {
    ProductIndications,
  },
  setup() {
    const userStore = useUserStore();
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const tableStore = useTableStore();
    const saleStore = useSaleStore();
    const waiterStore = useWaiterStore();
    const activeDrawer = ref(false);
    const showModal = ref(false);
    const orderItemIndex = ref(null);
    const products = ref([]);
    const table = route.params.table;
    const settingsStore = useSettingsStore();
    const tableName = ref(null);

    const print = (val, update = false) => {
      message.success("Orden actualizada correctamente");

      let arrayDataPrint = [];

      productStore.places.forEach(async (place) => {
        let lengthData = 0;
        const createName = () => {
          if (update) {
            lengthData += 7 * 6.5;
            return `ACTUALIZACION DE MESA: ${
              tableStore.getTableByID(table).description
            }`;
          } else {
            return `MESA: ${tableStore.getTableByID(table).description}`;
          }
        };

        let structure = [
          {
            dat: [
              [
                {
                  content: `ORDEN: ${val.id}`,
                  styles: {
                    fontStyle: "bold",
                    halign: "center",
                    fontSize:
                      settingsStore.business_settings.printer.header_font_size,
                  },
                },
              ],
            ],
          },
          {
            dat: [
              [
                {
                  content: createName(),
                  styles: {
                    fontStyle: "bold",
                    halign: "center",
                    fontSize:
                      settingsStore.business_settings.printer
                        .sub_header_font_size,
                  },
                },
              ],
            ],
          },
        ];

        let thisIndicatesIfEverythingIsToGO = [];

        let info = val.order_details.filter(
          (detail) => detail.preparation_place === place.description
        );

        await info.map((valOrder) => {
          let lC = 0;

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
          if (settingsStore.business_settings.printer.show_cat) {
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
          }

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
                      fontSize:
                        settingsStore.business_settings.printer.body_font_size,
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
                      fontSize:
                        settingsStore.business_settings.printer.body_font_size,
                    },
                  },
                ],
              ],
            },
            ind && {
              dat: [
                [
                  {
                    content: ind.toUpperCase(),
                    styles: {
                      fontStyle: "bold",
                      fontSize:
                        settingsStore.business_settings.printer.body_font_size,
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
                      fontSize:
                        settingsStore.business_settings.printer.body_font_size,
                    },
                  },
                ],
              ],
            }
          );
        });

        if (
          val.order_details.length === thisIndicatesIfEverythingIsToGO.length
        ) {
          structure.splice(1, 0, {
            dat: [
              [
                {
                  content: "PARA LLEVAR",
                  styles: {
                    fontStyle: "bold",
                    halign: "center",
                    fontSize: 10,
                  },
                },
              ],
            ],
          });
        }

        structure.push({
          line: true,

          dat: [
            [
              {
                content: `Fecha : ${dateNow.value /* .replace(" ", "\n") */}`,
                styles: {
                  fontStyle: "bold",
                  fontSize:
                    settingsStore.business_settings.printer.footer_font_size,
                },
              },
            ],
          ],
        });

        if (!!val.username) {
          lengthData += 10;
          structure.push({
            dat: [
              [
                {
                  content: `MOZO: ${val.username}`,
                  styles: {
                    fontStyle: "bold",
                    fontSize:
                      settingsStore.business_settings.printer.footer_font_size,
                  },
                },
              ],
            ],
          });
        }

        if (info.length > 0) {
          arrayDataPrint.push({
            data: structure,
            lengthOfData: lengthData,
            printerName: place.printer_name,
          });
        }
      });

      printPdf(arrayDataPrint);

      router.push({ name: "TableHome" });
    };

    const performCreateTableOrder = () => {
      addToList();
      createTableOrder(route.params.table, orderStore.orderList)
        .then((response) => {
          if (response.status === 201) {
            message.success("Orden creada correctamente");
            print(response.data);

            activeDrawer.value = false;
            tableStore.refreshData();
            waiterStore.preOrderList = [];
            router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
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

    const performUpdateTableOrder = () => {
      addToList();
      updateTableOrder(
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
            print(response.data, true);
            activeDrawer.value = false;
            tableStore.refreshData();
            waiterStore.preOrderList = [];
            router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
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
      products.value.forEach((product) => {
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
      activeDrawer,
      showModal,
      productStore,
      waiterStore,
      orderItemIndex,
      products,
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
