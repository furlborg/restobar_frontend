<template>
  <div id="TakeOrder">
    <n-page-header class="mb-2" @back="$router.push({ name: 'TableHome' })">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">Realizar Pedido</n-text>
        </n-space>
      </template>
    </n-page-header>
    <n-card>
      <n-grid
        responsive="screen"
        cols="1 xs:1 s:1 m:5 l:5 xl:5 2xl:5"
        :x-gap="12"
      >
        <n-gi :span="3">
          <transition name="mode-fade" mode="out-in">
            <n-spin v-if="selectProducts" :show="loading">
              <n-card>
                <n-space class="mb-2" align="center" justify="space-between">
                  <div class="d-flex align-items-center">
                    <n-text class="fs-4">{{
                      `${saleStore.getSerieDescription(sale.serie)}-${
                        sale.number
                      }`
                    }}</n-text>
                    <n-dropdown
                      trigger="click"
                      :options="
                        saleStore.getDocumentSeriesOptions(sale.invoice_type)
                      "
                      :show-arrow="true"
                      placement="bottom-end"
                      size="huge"
                      @select="selectSerie"
                    >
                      <n-button type="info" text>
                        <v-icon
                          class="p-0"
                          name="md-arrowdropdown-round"
                          scale="1.75"
                        />
                      </n-button>
                    </n-dropdown>
                  </div>
                  <n-radio-group
                    v-model:value="sale.invoice_type"
                    name="docType"
                    size="small"
                    @update:value="changeSerie"
                  >
                    <n-radio-button :value="1" :key="1">FACTURA</n-radio-button>
                    <n-radio-button :value="3" :key="3">BOLETA</n-radio-button>
                    <n-radio-button :value="80" :key="80"
                      >N. VENTA</n-radio-button
                    >
                  </n-radio-group>
                  <n-radio-group
                    v-model:value="sale.payment_condition"
                    name="saleType"
                    size="small"
                  >
                    <n-radio-button :value="1" :key="1">CONTADO</n-radio-button>
                    <n-radio-button :value="2" :key="2">CRÉDITO</n-radio-button>
                  </n-radio-group>
                </n-space>
                <n-form
                  class="mb-2"
                  ref="saleForm"
                  :model="sale"
                  :rules="rules"
                >
                  <n-grid
                    responsive="screen"
                    cols="12 s:12 m:12 l:12 xl:12 2xl:12"
                    :x-gap="12"
                  >
                    <n-form-item-gi
                      :span="9"
                      label="Cliente"
                      :show-require-mark="rules.customer.required"
                      path="customer"
                    >
                      <n-input-group>
                        <n-auto-complete
                          blur-after-select
                          :input-props="{
                            autocomplete: 'disabled',
                          }"
                          v-model:value="sale.customer_name"
                          :options="customerOptions"
                          :get-show="showCustomerOptions"
                          :loading="searchingCustomer"
                          @update:value="
                            (v) => {
                              !v
                                ? ((sale.customer = null),
                                  (sale.address = null),
                                  (addressesOptions = []))
                                : null;
                            }
                          "
                          @select="
                            (value) => {
                              sale.customer = value;
                              sale.address = null;
                              createAddressesOptions();
                            }
                          "
                          placeholder=""
                          clearable
                        />
                        <n-button type="info" @click="showCustomerModal = true">
                          <v-icon name="md-add-round" />
                        </n-button>
                      </n-input-group>
                    </n-form-item-gi>
                    <n-form-item-gi :span="3" label="Fecha">
                      <n-date-picker
                        class="w-100"
                        v-model:formatted-value="sale.date_sale"
                        type="datetime"
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="6" label="Dirección">
                      <n-select
                        v-model:value="sale.address"
                        :options="addressesOptions"
                        :disabled="!sale.customer"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="2" label="Método Pago">
                      <n-select
                        v-model:value="sale.payment_method"
                        :options="saleStore.getPaymentMethodsOptions"
                        filterable
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="2">
                      <n-checkbox @update:checked="handleDelivery">
                        Delivery
                      </n-checkbox>
                    </n-form-item-gi>
                    <n-form-item-gi :span="2">
                      <n-button
                        type="info"
                        text
                        @click="showObservations = !showObservations"
                        >{{
                          !showObservations ? "Ver" : "Ocultar"
                        }}
                        Observaciones</n-button
                      >
                    </n-form-item-gi>
                    <n-gi :span="12">
                      <n-collapse-transition :show="showObservations">
                        <n-form-item label="Observaciones">
                          <n-input type="textarea" />
                        </n-form-item>
                      </n-collapse-transition>
                    </n-gi>
                    <n-gi :span="12">
                      <n-collapse-transition :show="!!sale.delivery_info">
                        <n-text class="fs-5">Información de delivery</n-text>
                        <n-grid
                          class="mt-2"
                          responsive="screen"
                          cols="12"
                          :x-gap="12"
                        >
                          <n-form-item-gi
                            label="Nombres"
                            :span="6"
                            path="delivery_info.person"
                          >
                            <n-input
                              v-model:value="sale.delivery_info.person"
                              placeholder=""
                            />
                          </n-form-item-gi>
                          <n-form-item-gi
                            label="Dirección"
                            :span="6"
                            path="delivery_info.address"
                          >
                            <n-input
                              v-model:value="sale.delivery_info.address"
                              placeholder=""
                            />
                          </n-form-item-gi>
                          <n-form-item-gi
                            label="Teléfono"
                            :span="6"
                            path="delivery_info.phone"
                          >
                            <n-input
                              v-model:value="sale.delivery_info.phone"
                              placeholder=""
                            />
                          </n-form-item-gi>
                          <n-form-item-gi label="Repartidor" :span="6">
                            <n-input
                              v-model:value="sale.delivery_info.deliveryman"
                              placeholder=""
                            />
                          </n-form-item-gi>
                        </n-grid>
                      </n-collapse-transition>
                    </n-gi>
                  </n-grid>
                </n-form>
                <n-table class="fs-6 m-auto text-center" :bordered="false">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cantidad</th>
                      <th>Producto</th>
                      <th>Precio Unitario</th>
                      <th>Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(detail, index) in saleStore.toSale"
                      :key="index"
                    >
                      <td>{{ index + 1 }}</td>
                      <td>{{ detail.quantity }}</td>
                      <td>
                        <input
                          class="custom-input"
                          v-model="detail.product_name"
                          v-autowidth
                          @click="$event.target.select()"
                        />
                      </td>
                      <td>
                        S/.
                        <input
                          class="custom-input"
                          type="number"
                          min="0"
                          step=".01"
                          v-model="detail.price_sale"
                          v-autowidth
                          @click="$event.target.select()"
                        />
                      </td>
                      <td>
                        {{
                          parseFloat(
                            detail.quantity * detail.price_sale
                          ).toFixed(2)
                        }}
                      </td>
                    </tr>
                  </tbody>
                </n-table>
                <n-grid cols="3">
                  <n-gi :span="2">
                    <n-space
                      class="h-100"
                      align="center"
                      justify="space-around"
                    >
                      <n-space align="center" vertical>
                        <span class="fs-4">Pago</span>
                        <div class="fs-5">
                          S/.
                          <input
                            class="fs-1 custom-input"
                            type="number"
                            min="0"
                            step=".01"
                            v-model="sale.given_amount"
                            v-autowidth
                            @click="$event.target.select()"
                          />
                        </div>
                      </n-space>
                      <n-space align="center" vertical>
                        <span class="fs-4">Vuelto</span>
                        <div class="fs-5">
                          S/.
                          <span class="fs-1">{{ changing.toFixed(2) }}</span>
                        </div>
                      </n-space>
                    </n-space>
                  </n-gi>
                  <n-gi>
                    <n-space class="mt-2 fs-6 fw-bold" align="end" vertical>
                      <div>
                        SUBTOTAL: <span>S/. {{ subTotal.toFixed(2) }}</span>
                      </div>
                      <div v-if="!!sale.delivery_info">
                        DELIVERY:
                        <span>S/.</span>
                        <input
                          class="custom-input fw-bold"
                          type="number"
                          min="0"
                          step=".1"
                          v-model="sale.delivery_info.amount"
                          v-autowidth
                          @click="$event.target.select()"
                        />
                      </div>
                      <div>
                        ICBPER: <span>S/. {{ icbper.toFixed(2) }}</span>
                      </div>
                      <div>IGV: <span>S/. 0.00</span></div>
                      <div>
                        DSCT:
                        <span>S/.</span>
                        <input
                          class="custom-input fw-bold"
                          type="number"
                          min="0"
                          :max="subTotal"
                          step=".1"
                          v-model="sale.discount"
                          v-autowidth
                          @click="$event.target.select()"
                        />
                      </div>
                      <div>
                        TOTAL: <span>S/. {{ sale.amount.toFixed(2) }}</span>
                      </div>
                    </n-space>
                  </n-gi>
                </n-grid>
                <n-button
                  class="fs-1 py-5 mt-2"
                  type="success"
                  :disabled="
                    !saleStore.toSale.length || sale.given_amount < sale.amount
                  "
                  secondary
                  block
                  @click.prevent="performTakeAway"
                  ><v-icon class="me-2" name="fa-coins" scale="2" />{{
                    userStore.user.profile_des !== "MOZO"
                      ? "Cobrar"
                      : "Realizar pedido"
                  }}</n-button
                >
              </n-card>
            </n-spin>
            <CategoriesList v-else />
          </transition>
          <!-- Customer Modal -->
          <customer-modal
            v-model:show="showCustomerModal"
            @update:show="onCloseModal"
            @on-success="onSuccess"
          />
        </n-gi>
        <n-gi span="2">
          <n-card class="h-100" :bordered="false" embedded>
            <template #header>
              <n-button
                type="info"
                text
                @click="selectProducts = !selectProducts"
                >{{
                  selectProducts ? "Seleccionar productos" : "Cobrar"
                }}</n-button
              >
            </template>
            <n-input-group>
              <n-auto-complete
                :input-props="{
                  autocomplete: 'disabled',
                }"
                v-model:value="productSearch"
                :options="productOptions"
                :get-show="showOptions"
                :loading="searching"
                clear-after-select
                :render-label="renderLabel"
                placeholder="Buscar producto"
                @select="selectProduct"
              />
            </n-input-group>
            <n-scrollbar :x-scrollable="true" style="max-width: 900px">
              <n-table class="mt-3">
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
                        size="small"
                        :min="1"
                        v-model:value="order.quantity"
                        @update:value="
                          saleStore.sale_details = orderStore.orderList
                        "
                      />
                    </td>
                    <td>S/. {{ order.subTotal.toFixed(2) }}</td>
                    <td>
                      <n-button
                        type="error"
                        text
                        @click="orderStore.orderList.splice(index, 1)"
                      >
                        <v-icon name="md-disabledbydefault-round" />
                      </n-button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">
                      <!-- <n-button
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
                    </n-button> -->
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
        v-model:show="showConfirm"
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
              @click.prevent="performCreateOrder"
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
import CustomerModal from "@/views/Customer/components/CustomerModal";
import OrderIndications from "./OrderIndications";
import CategoriesList from "./CategoriesList";
import {
  defineComponent,
  ref,
  computed,
  toRefs,
  watch,
  onMounted,
  h,
} from "vue";
import { numeroALetras } from "./Prints/numberText.js";
import { NThing, NTag, NSpace, useDialog, useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";
import { useUserStore } from "@/store/modules/user";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import { useGenericsStore } from "@/store/modules/generics";
import { searchProductByName } from "@/api/modules/products";
import { takeAwayOrder } from "@/api/modules/orders";
import { createSale, getSaleNumber } from "@/api/modules/sales";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import { isDecimal, isNumber, isLetter, lighten } from "@/utils";
import { saleRules } from "@/utils/constants";
import {
  searchCustomerByName,
  searchRucCustomer,
} from "@/api/modules/customer";
import format from "date-fns/format";

import { generatePrint } from "./Prints/prints";
import { generatePrintCopy } from "./PrintsCopy/printsCopy";
import { generatePrintCopyCopy } from "./PrintsCopyCopy/printsCopyCopy";
import { generatePrint58 } from "./PrintsCopy58/printsCopy58";

const dateNow = ref(null);

export default defineComponent({
  name: "TakeOrder",
  directives: { autowidth: VueInputAutowidth },
  components: {
    OrderIndications,
    CustomerModal,
    CategoriesList,
  },
  setup() {
    const userStore = useUserStore();
    const dialog = useDialog();
    const message = useMessage();
    const router = useRouter();
    const saleStore = useSaleStore();
    const orderStore = useOrderStore();
    const genericsStore = useGenericsStore();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const businessStore = useBusinessStore();
    orderStore.orders = [];
    saleStore.order_initial = [];
    orderStore.orderId = null;

    const loading = ref(false);
    const payment_amount = ref(parseFloat(0).toFixed(2));

    const changing = computed(() => {
      return sale.value.given_amount > total.value
        ? total.value - sale.value.given_amount
        : 0.0;
    });

    const icbper = computed(() => {
      return orderStore.orderList.reduce((acc, curVal) => {
        if (curVal.icbper) {
          return (acc += curVal.icbper_amount);
        }
        return (acc += 0);
      }, 0);
    });

    const showObservations = ref(false);

    const subTotal = computed(() => {
      return saleStore.toSale.reduce((acc, curVal) => {
        return (acc += curVal.price_sale * curVal.quantity);
      }, 0);
    });

    const products_count = computed(() => {
      return saleStore.toSale.reduce((acc, curVal) => {
        return (acc += curVal.quantity);
      }, 0);
    });

    const total = computed(() => {
      let cal = parseFloat(subTotal.value - sale.value.discount + icbper.value);
      if (sale.value.delivery_info) {
        cal = cal + parseFloat(sale.value.delivery_info.amount);
      }
      return cal;
    });

    const saleForm = ref();
    const sale = ref({
      serie: saleStore.getFirstOption(
        settingsStore.businessSettings.sale.default_invoice
      ),
      number: "",
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy hh:mm:ss"),
      count: products_count,
      amount: total,
      given_amount: parseFloat(0).toFixed(2),
      invoice_type: settingsStore.businessSettings.sale.default_invoice,
      payment_method: 1,
      payment_condition: 1,
      customer_name: "",
      customer: null,
      address: null,
      discount: "0.00",
      icbper: icbper,
      observations: "",
      by_consumption: false,
      sale_details: [],
      delivery_info: null,
    });

    const rules = computed(() => {
      if (sale.value.invoice_type !== 1) {
        saleRules.customer.required = false;
      } else {
        saleRules.customer.required = true;
      }
      if (sale.value.delivery_info) {
        saleRules.delivery_info = {
          person: {
            required: true,
            trigger: ["blur", "input"],
            message: "Campo requerido",
          },
          address: {
            required: true,
            trigger: ["blur", "change"],
            message: "Campo requerido",
          },
          phone: {
            required: true,
            trigger: ["blur", "change"],
            message: "Campo requerido",
          },
        };
      } else {
        saleRules.delivery_info = null;
      }
      return saleRules;
    });

    const selectSerie = (v) => {
      sale.value.serie = v;
    };

    const changeSerie = (v) => {
      switch (v) {
        case 1:
          sale.value.customer_name = "";
          sale.value.customer = null;
          sale.value.address = null;
          sale.value.serie = saleStore.getFirstOption(v);
          break;
        case 3:
          sale.value.serie = saleStore.getFirstOption(v);
          break;
        case 80:
          sale.value.serie = saleStore.getFirstOption(v);
          break;
        default:
          break;
      }
    };

    const showModal = ref(false);
    const itemIndex = ref(null);

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
        /* switch (t[1]) {
          case " LL":
            color = "#926ED7";
            text = "PARA LLEVAR";
            break;
          case " D":
            color = "#995C4E";
            text = "DELIVERY";
            break;
          default:
            console.error(t[1]);
            break;
        } */
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

    const selectProduct = (v) => {
      const item = products.value.find((product) => product.id === v);
      orderStore.addOrder(item);
      saleStore.sale_details = orderStore.orderList;
    };

    const obtainSaleNumber = async () => {
      loading.value = true;
      await getSaleNumber(sale.value.serie)
        .then((response) => {
          if (response.status === 200) {
            sale.value.number = Number(response.data.number) + 1;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const showCustomerModal = ref(false);
    const searchingCustomer = ref(false);

    const customerResults = ref([]);

    const customerOptions = computed(() => {
      return customerResults.value.map((customer) => ({
        value: customer.id,
        label: `${customer.doc_num} - ${customer.names}`,
        disabled: customer.is_disabled,
      }));
    });

    const addressesOptions = ref([]);

    const createAddressesOptions = () => {
      const customer = customerResults.value.find(
        (customer) => customer.id === sale.value.customer
      );
      if (typeof customer !== "undefined") {
        addressesOptions.value = customer.addresses.map((address) => ({
          value: address.id,
          label: `${address.ubigeo} - ${address.description}`,
        }));
      }
      if (addressesOptions.value.length) {
        sale.value.address = addressesOptions.value[0].value;
      }
    };

    const showCustomerOptions = async (value) => {
      if (value.length >= 3 && value.length <= 11) {
        searchingCustomer.value = true;
        if (sale.value.invoice_type === 1) {
          await searchRucCustomer(value)
            .then((response) => {
              if (response.status === 200) {
                customerResults.value = response.data;
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              searchingCustomer.value = false;
            });
          return true;
        } else {
          await searchCustomerByName(value)
            .then((response) => {
              if (response.status === 200) {
                customerResults.value = response.data;
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              searchingCustomer.value = false;
            });
          return true;
        }
      } else {
        customerResults.value = [];
        return false;
      }
    };

    const { serie } = toRefs(sale.value);

    watch(serie, async () => {
      await obtainSaleNumber();
    });
    const handleDelivery = (v) => {
      v
        ? (sale.value.delivery_info = {
            person: "",
            address: "",
            phone: "",
            deliveryman: "",
            amount: parseFloat(0).toFixed(2),
          })
        : (sale.value.delivery_info = null);
    };

    const printSale = (val) => {
      let height = 0;
      let structureDelivery = null;

      let totalProdSum = 0;

      let values = { ...val.order, ...val.sale };

      let dataForPrint = JSON.parse(values.json_sale);

      let typeDoc = dataForPrint.serie_documento.split("");

      let data = `${businessStore.business.ruc}|${dataForPrint.serie_documento}|${dataForPrint.totales.total_igv}|${dataForPrint.hora_de_EMISIÓN}|${dataForPrint.datos_del_cliente_o_receptor.numero_documento}|${dataForPrint.numero_documento}|${dataForPrint.totales.total_venta}|${dataForPrint.datos_del_cliente_o_receptor.codigo_tipo_documento_identidad}|`;

      let NoNoteSale = false;

      if (typeDoc[0] === "F") {
        typeDoc = "FACTURA ELECTRONICA";
        NoNoteSale = true;
      }

      if (typeDoc[0] === "B") {
        typeDoc = "BOLETA ELECTRONICA";
        NoNoteSale = true;
      }

      if (typeDoc[0] === "N") {
        typeDoc = "NOTA DE VENTA";
        NoNoteSale = false;
      }

      let datTotals = [];

      let subTo = 0;

      dataForPrint.items.map((val) => {
        subTo += val.cantidad * parseFloat(val.precio_unitario);
      });

      let newTotal = NoNoteSale
        ? {
            SUBTOTAL: subTo.toFixed("2"),
            EFECTIVO: val.given_amount,
            VUELTO: changing.value.toFixed(2),
            "OP.GRAVADA":
              dataForPrint.totales.total_operaciones_gravadas.toFixed("2"),
            "OP.EXONERADA":
              dataForPrint.totales.total_operaciones_exoneradas.toFixed("2"),
            "OP.GRATUITAS":
              dataForPrint.totales.total_operaciones_gratuitas.toFixed("2"),
            "IGV(18%)": dataForPrint.totales.total_igv.toFixed("2"),
            DESCUENTOS: !!val.discount
              ? parseFloat(val.discount).toFixed("2")
              : "0.00",
            "IMPORTE TOTAL": dataForPrint.totales.total_venta.toFixed("2"),
          }
        : {
            "IMPORTE TOTAL": dataForPrint.totales.total_venta.toFixed("2"),
          };
      for (let i in newTotal) {
        if (!!parseFloat(newTotal[i])) {
          height += 7;
          datTotals.push({
            tittle: i,
            twoPoints: ":",
            cont: newTotal[i],
          });
        }

        if (i === "IGV(18%)") {
          height += 7;
          datTotals.push({
            tittle: i,
            twoPoints: ":",
            cont: newTotal[i],
          });
        }
      }

      let structure = [
        {
          dat: [
            [
              {
                content: businessStore.business.commercial_name,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 10,
                },
              },
            ],
            [
              {
                content: businessStore.business.ruc,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 10,
                },
              },
            ],
            [
              {
                content: businessStore.business.fiscal_address,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],
            [
              {
                content: businessStore.business.phone,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 7,
                },
              },
            ],
            [
              {
                content: typeDoc,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],

            [
              {
                content: `${dataForPrint.serie_documento}-${dataForPrint.numero_documento}`,
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
              tittle: "CLIENTE",
              twoPoints: ":",
              cont: dataForPrint.datos_del_cliente_o_receptor
                .apellidos_y_nombres_o_razon_social,
            },

            {
              tittle: typeDoc[0] === "F" ? "RUC" : "DOCUMENTO",
              twoPoints: ":",
              cont: dataForPrint.datos_del_cliente_o_receptor.numero_documento,
            },

            {
              tittle: "DIRECCION",
              twoPoints: ":",
              cont: dataForPrint.datos_del_cliente_o_receptor.direccion,
            },

            {
              tittle: "F.EMISIÓN",
              twoPoints: ":",
              cont: `${dataForPrint.fecha_de_emision} ${dataForPrint.hora_de_emision}`,
            },
          ],
          line: true,
        },
        {
          col: [
            {
              header: "CANT.",
              dataKey: "amount",
            },

            {
              header: "DESCRIPCIÓN",
              dataKey: "description",
            },
            !val.by_consumption && {
              header: "P.U",
              dataKey: "price",
            },

            {
              header: "TOTAL",
              dataKey: "total",
            },
          ],
          dat: !val.by_consumption
            ? dataForPrint.items.map((val) => {
                totalProdSum += val.cantidad * parseFloat(val.precio_unitario);
                height += 7;
                return {
                  amount: val.cantidad,
                  description: val.descripcion,
                  price: parseFloat(val.precio_unitario).toFixed("2"),
                  total: parseFloat(val.total_item).toFixed("2"),
                };
              })
            : [
                {
                  amount: 1,
                  description: "POR CONSUMO DE ALIMENTOS",
                  total: dataForPrint.totales.total_venta.toFixed("2"),
                },
              ],
          line: true,
        },
        {
          dat: datTotals,
          line: true,
        },

        NoNoteSale && {
          line: true,
          dat: [
            [
              {
                content:
                  "SON:" +
                  numeroALetras(
                    dataForPrint.totales.total_venta.toFixed("2"),
                    "SOLES"
                  ),
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],
            [
              {
                content: "Representacion impresa del comprobante electronico",
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],
            !!businessStore.business.website && [
              {
                content: `Puede verificarla usando su clave sol o ingresando a la pagina web: ${businessStore.business.website}`,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],
            !!businessStore.business.email && [
              {
                content: businessStore.business.email,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],
            [
              {
                content:
                  "BIENES TRANSFERIDOS / SERVICIOS PRESTADOS EN LA AMAZONIA PARA SER CONSUMIDOS EN LA MISMA",
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 8,
                },
              },
            ],
          ],
        },

        {
          line: true,
          dat: [
            {
              tittle: "USUARIO",
              twoPoints: ":",
              cont: values.username,
            },
            {
              tittle: "TIPO DE PAGO",
              twoPoints: ":",
              cont: saleStore.getPaymentMethodDescription(
                val.sale.payment_method
              ),
            },
          ],
        },
      ];
      generatePrint(data, structure, NoNoteSale, height + 7 * 16);

      message.success("Imprimir");

      if (!!sale.value.delivery_info) {
        // let newTotals = [];

        let lengthData = 0;

        // let totals = {
        //   SUBTOTAL: totalProdSum.toFixed("2"),
        //   "IGV(18%)": dataForPrint.totales.total_igv.toFixed("2"),
        //   DESCUENTOS: !!val.discount
        //     ? parseFloat(val.discount).toFixed("2")
        //     : "0.00",
        //   TOTAL: dataForPrint.totales.total_venta.toFixed("2"),
        // };

        // for (let i in totals) {
        //   if (!!parseFloat(totals[i]) || i === "IGV(18%)") {
        //     lengthData += 5 * 6.5;
        //     datTotals.push({
        //       tittle: i,
        //       twoPoints: ":",
        //       cont: totals[i],
        //     });
        //   }
        // }

        let vuleto = changing.value;
        vuleto -= vuleto * 2;

        let heightD = 0;

        structureDelivery = [
          {
            dat: [
              [
                {
                  content: `DELIVERY ${dataForPrint.serie_documento}-${dataForPrint.numero_documento}`,
                  styles: {
                    fontStyle: "bold",
                    halign: "center",
                    fontSize: 12,
                  },
                },
              ],
            ],
          },
          {
            line: true,
            dat: [
              {
                tittle: "CLIENTE",
                twoPoints: ":",
                cont: dataForPrint.datos_del_cliente_o_receptor
                  .apellidos_y_nombres_o_razon_social,
              },
              {
                tittle: "PREGUNTAR POR",
                twoPoints: ":",
                cont: values.delivery_info.person,
              },

              {
                tittle: "TELEFONO",
                twoPoints: ":",
                cont: values.delivery_info.phone,
              },

              {
                tittle: "DIRECCION",
                twoPoints: ":",
                cont: values.delivery_info.address,
              },

              {
                tittle: "F.EMISIÓN",
                twoPoints: ":",
                cont: `${dataForPrint.fecha_de_emision} ${dataForPrint.hora_de_emision}`,
              },
              {
                tittle: "PAGARA CON",
                twoPoints: ":",
                cont: values.given_amount,
              },
              {
                tittle: "VUELTO",
                twoPoints: ":",
                cont: vuleto.toFixed("2"),
              },
            ],
          },
          {
            line: true,
            col: [
              {
                header: "CANT.",
                dataKey: "amount",
              },
              {
                header: "U.M",
                dataKey: "unit",
              },

              {
                header: "DESCRIPCIÓN",
                dataKey: "description",
              },
              {
                header: "P.U",
                dataKey: "price",
              },

              {
                header: "TOTAL",
                dataKey: "total",
              },
            ],
            dat: !val.by_consumption
              ? dataForPrint.items.map((val) => {
                  heightD += 7;
                  return {
                    amount: val.cantidad,
                    unit: val.unidad_de_medida,
                    description: val.descripcion,
                    price: parseFloat(val.precio_unitario).toFixed("2"),
                    total: parseFloat(val.total_item).toFixed("2"),
                  };
                })
              : [
                  {
                    amount: 1,
                    description: "POR CONSUMO DE ALIMENTOS",
                    total: dataForPrint.totales.total_venta.toFixed("2"),
                  },
                ],
          },
          {
            dat: [
              {
                tittle: "TOTAL",
                twoPoints: ":",
                cont: dataForPrint.totales.total_venta.toFixed("2"),
              },
            ],
            line: true,
          },
          {
            dat: [
              [
                {
                  content: `REPARTIDOR: ${values.delivery_info.deliveryman}`,
                  styles: {
                    fontStyle: "bold",
                    halign: "center",
                    fontSize: 12,
                  },
                },
              ],
            ],
          },
        ];
        generatePrintCopyCopy(structureDelivery, lengthData + heightD + 7 * 16);
      }

      print(values);

      message.success("Imprimir");
    };

    const print = (responseData) => {
      let lengthData = 0;

      let structure = [
        {
          dat: [
            [
              {
                content: `ORDEN: ${responseData.order}`,
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 11,
                },
              },
            ],
          ],
        },

        {
          dat: [
            [
              {
                content: !!sale.value.delivery_info
                  ? "DELIVERY"
                  : "PARA LLEVAR",
                styles: {
                  fontStyle: "bold",
                  halign: "center",
                  fontSize: 11,
                },
              },
            ],
          ],
        },
      ];

      let roscareresunamierda = responseData.order_details.find(
        (v) => !!v.preparation_place
      );

      responseData.order_details.map((val) => {
        if (!!val.preparation_place) {
          let ind = "";

          val.indication.map((v, i) => {
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

              ind = `${ind}${i + 1}-${cadenaConCaracteres}\n`;
            }
          });

          let prodDetail = !!val.product_description
            ? val.product_description.split(",")
            : val.product_description;

          let newNameProd = val.product_name;

          let heightForNmae = 10;

          let verifyNameCombo = "";

          if (
            (val.product_category.toLowerCase().includes("combo") ||
              val.product_category.toLowerCase().includes("menu") ||
              val.product_category.toLowerCase().includes("menus") ||
              val.product_category.toLowerCase().includes("combos")) &&
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
              val.product_category.toLowerCase().includes("menu") ||
              val.product_category.toLowerCase().includes("menus")
            ) {
              newNameProd = `[MENU] ${newNameProd}`;
            } else if (
              (!!val.product_category.toLowerCase().includes("menu") ===
                false ||
                !!val.product_category.toLowerCase().includes("menus") ===
                  false) &&
              (!!val.product_category.toLowerCase().includes("combo") ===
                false ||
                !!val.product_category.toLowerCase().includes("combo") ===
                  false)
            ) {
              newNameProd = `[CARTA] ${newNameProd}`;
            }
            lengthData += 10 * heightForNmae;
          }

          structure.push(
            {
              line: true,
              dat: [
                [
                  {
                    content: `*${newNameProd}`,
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
                      fontSize: process.env.VUE_APP_PRODUCT_SIZE,
                    },
                  },
                ],
              ],
            },
            !!ind && {
              dat: [
                [
                  {
                    content: ind.toUpperCase(),
                    styles: {
                      fontStyle: "bold",
                      fontSize: process.env.VUE_APP_PRODUCT_SIZE,
                    },
                  },
                ],
              ],
            },
            {
              dat: [
                [
                  {
                    content: `Cant.: ${val.quantity}`,
                    styles: {
                      fontStyle: "bold",
                      fontSize: process.env.VUE_APP_PRODUCT_SIZE,
                    },
                  },
                ],
              ],
            }
          );
        }
      });

      structure.push({
        line: true,

        dat: [
          [
            {
              content: `Fecha : ${dateNow.value}`,
              styles: {
                fontStyle: "bold",
                halign: "right",
                fontSize: 8,
              },
            },
          ],
        ],
      });
      if (!!responseData.username) {
        structure.push({
          dat: [
            [
              {
                content: `MOZO: ${responseData.username}`,
                styles: {
                  fontStyle: "bold",
                  halign: "right",
                  fontSize: 8,
                },
              },
            ],
          ],
        });
      }

      const a = responseData.order_details.filter(
        (valOrd) => !!valOrd.preparation_place
      );

      if (a.length > 0) {
        if (
          settingsStore.business_settings.printer.kitchen_printer_format === 58
        ) {
          generatePrint58(
            structure,
            lengthData,
            roscareresunamierda.preparation_place
          );
        } else {
          generatePrintCopy(
            structure,
            lengthData,
            roscareresunamierda.preparation_place
          );
        }
      }
    };

    const showConfirm = ref(false);

    const userConfirm = ref("");

    const performCreateOrder = async () => {
      loading.value = true;
      sale.value.sale_details = saleStore.toSale;
      await takeAwayOrder(orderStore.orderList, sale.value, userConfirm.value)
        .then((response) => {
          if (response.status === 201) {
            printSale(response.data);
            message.success("Venta realizada correctamente!");
            router.push({ name: "TableHome" });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          userConfirm.value = "";
          showConfirm.value = false;
          loading.value = false;
        });
    };

    const performTakeAway = () => {
      saleForm.value.validate((errors) => {
        if (!errors) {
          if (userStore.user.profile_des === "MOZO") {
            showConfirm.value = true;
          } else {
            dialog.success({
              title: "Confirmar pedido",
              content: "Realizar pedido?",
              positiveText: "Sí",
              onPositiveClick: async () => {
                loading.value = true;
                sale.value.sale_details = saleStore.toSale;
                await takeAwayOrder(
                  orderStore.orderList,
                  sale.value,
                  userConfirm.value
                )
                  .then((response) => {
                    if (response.status === 201) {
                      printSale(response.data);
                      message.success("Venta realizada correctamente!");
                      router.push({ name: "TableHome" });
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
            });
          }
        } else {
          console.error(errors);
          message.error("Datos Incorrectos");
        }
      });
    };

    onMounted(async () => {
      document.title = "Realizar Pedido | App";
      await obtainSaleNumber();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const onCloseModal = () => {
      document.title = "Realizar Pedido | App";
    };

    const onSuccess = (customer) => {
      if (sale.value.invoice_type === 1 && customer.doc_type === "6") {
        customerResults.value.push(customer);
        sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
        sale.value.customer = customer.id;
        createAddressesOptions();
      } else if (sale.value.invoice_type !== 1) {
        customerResults.value.push(customer);
        sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
        sale.value.customer = customer.id;
        createAddressesOptions();
      }
      showCustomerModal.value = false;
      onCloseModal();
    };

    const selectProducts = ref(false);

    return {
      loading,
      saleStore,
      orderStore,
      showModal,
      itemIndex,
      changing,
      payment_amount,
      subTotal,
      rules,
      saleForm,
      sale,
      changeSerie,
      selectSerie,
      renderLabel,
      searching,
      productSearch,
      productOptions,
      showOptions,
      showCustomerModal,
      selectProduct,
      customerOptions,
      showCustomerOptions,
      searchingCustomer,
      createAddressesOptions,
      addressesOptions,
      showObservations,
      performTakeAway,
      handleDelivery,
      onCloseModal,
      onSuccess,
      userConfirm,
      showConfirm,
      performCreateOrder,
      userStore,
      genericsStore,
      selectProducts,
      icbper,
    };
  },
});
</script>

<style lang="scss" scoped>
.custom-input {
  border: none;
  outline: none;
}

.custom-input:hover {
  border-radius: 5px;
  outline: LightBlue solid 2px;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  /* display: none; <- Crashes Chrome on hover */
  -webkit-appearance: none;
  margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type="number"] {
  -moz-appearance: textfield; /* Firefox */
}

.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}
</style>
