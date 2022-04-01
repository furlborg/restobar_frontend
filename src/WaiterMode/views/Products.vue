<template>
  <div id="WProducts">
    <n-page-header
      class="border-bottom border-2 border-success p-2"
      @back="$router.push({ name: 'WCategories' })"
    >
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
      :product="preOrderList[orderItemIndex]"
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
          :disabled="!(preOrderList.length > 0)"
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
          <n-list-item v-for="(orderItem, index) in preOrderList" :key="index">
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
import { defineComponent, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import ProductIndications from "./ProductIndications";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { getProductsByCategory } from "@/api/modules/products";
import {
  createTableOrder,
  updateTableOrder,
  performDeleteOrderDetail,
} from "@/api/modules/tables";
import { generatePrintCopy } from "./PrintsCopy/printsCopy";

export default defineComponent({
  name: "WProducts",
  components: {
    ProductIndications,
  },
  setup() {
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const tableStore = useTableStore();
    const activeDrawer = ref(false);
    const showModal = ref(false);
    const orderItemIndex = ref(null);
    const products = ref([]);

    const print = (responseData) => {
      message.success("Orden actualizada correctamente");

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

      structure.push({
        dat: [
          {
            tittle: "Fecha",
            twoPoints: ":",
            cont: dateNow.value,
          },
        ],
      });

      generatePrintCopy(structure, lengthData);

      // let myHeaders = new Headers();
      // myHeaders.append("Content-Type", "application/json");

      // let requestOptions = {
      //   method: "POST",

      //   headers: myHeaders,
      //   body: JSON.stringify({
      //     height: lengthData,
      //     structure: structure,
      //     printerName: "POS-80-Series",
      //   }),
      //   redirect: "follow",
      // };

      // fetch(
      //   "http://daa1-2001-1388-782b-5fd3-58e-8a4f-a74e-850e.ngrok.io/printer",
      //   requestOptions
      // )
      //   .then((response) => response.text())
      //   .then((result) => console.log(result))
      //   .catch((error) => console.log("error", error));

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
            router.push({ name: "WHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
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
            print(response.data);
            activeDrawer.value = false;
            tableStore.refreshData();
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

    onMounted(() => {
      loadProducts();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();
      dateNow.value = `${dd}/${mm}/${yy} ${hh}:${msms}`;
    });

    const preOrderList = ref([]);

    const addToPreList = () => {
      products.value.forEach((product) => {
        if (product.quantity > 0) {
          const existence = preOrderList.value.find(
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
            preOrderList.value.push(order);
          }
        }
        product.quantity = 0;
        product.indications = [];
      });
    };

    const addToList = () => {
      preOrderList.value.forEach((product) => {
        orderStore.addOrderItem(product);
      });
    };

    return {
      activeDrawer,
      showModal,
      productStore,
      orderItemIndex,
      products,
      preOrderList,
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
