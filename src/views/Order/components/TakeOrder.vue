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
                    cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12"
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
                <n-checkbox
                  v-if="!sale.delivery_info"
                  v-model:checked="isMultiple"
                  >Pago multiple</n-checkbox
                >
                <n-button
                  class="fs-1 py-5 mt-2"
                  type="success"
                  :disabled="
                    !saleStore.toSale.length || sale.given_amount < sale.amount
                  "
                  secondary
                  block
                  @click.prevent="
                    userStore.user.profile_des !== 'MOZO'
                      ? isMultiple
                        ? doMultiplePayment()
                        : performTakeAway()
                      : performTakeAway()
                  "
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
            :doc_type="sale.invoice_type === 1 ? '6' : null"
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
      <n-modal
        :class="{
          'w-100': genericsStore.device === 'mobile',
          'w-50': genericsStore.device === 'tablet',
          'w-25': genericsStore.device === 'desktop',
        }"
        preset="card"
        v-model:show="showPayments"
        title="Realizar venta"
        :mask-closable="false"
        closable
        @close="sale.payments = null"
      >
        <n-space justify="space-between">
          <n-tag type="info"
            >Total: S/.
            {{ showPayments ? sale.amount.toFixed(2) : null }}</n-tag
          >
          <n-tag :type="evalPayments ? 'error' : 'success'"
            >Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}</n-tag
          >
          <n-tag :type="evalPayments ? 'error' : 'warning'"
            >Faltante: S/.
            {{
              showPayments
                ? parseFloat(sale.amount - currentPaymentsAmount).toFixed(2)
                : null
            }}</n-tag
          >
        </n-space>
        <n-form-item class="mt-2" label="Pagos">
          <n-dynamic-input
            v-model:value="sale.payments"
            :min="1"
            @create="createPayment"
          >
            <template #default="{ value }">
              <div style="display: flex; align-items: center; width: 100%">
                <n-select
                  v-model:value="value.payment_method"
                  :options="filteredMethods"
                />
                <n-input
                  class="ms-2"
                  v-model:value="value.amount"
                  placeholder=""
                  @keypress="isDecimal($event)"
                />
              </div>
            </template>
          </n-dynamic-input>
        </n-form-item>
        <n-space justify="end">
          <n-button
            type="success"
            :disabled="
              evalPayments ||
              sale.payments.some((pay) => pay.payment_method === null)
            "
            secondary
            @click="performTakeAway"
            >Confirmar</n-button
          >
        </n-space>
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
import printOrderTicket from "@/hooks/PrintsTemplates/Ticket/OrderTicket.js";
import printDeliveryInfo from "@/hooks/PrintsTemplates/Ticket/DeliveryInfo.js";
import printWEBADASDEBRASEROS from "@/hooks/PrintsTemplates/Ticket/WEBADASDEBRASEROS.js";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
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
import { isAxiosError } from "axios";
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
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss"),
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
      payments: null,
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

    const PrintsAfterTakeOrder = (val) => {
      let values = { ...val.order, ...val.sale };

      VoucherPrint({
        data: values,
        businessStore,
        saleStore,
        changing: changing.value,
      });

      if (
        !!values.delivery_info &&
        settingsStore.business_settings.printer.print_delivery_ticket
      ) {
        printDeliveryInfo({ data: values, changing: changing.value });
      }

      switch (settingsStore.business_settings.printer.kitchen_ticket_format) {
        case 1:
          printOrderTicket({ data: values, saleInf: sale.value });
          break;
        case 2:
          printWEBADASDEBRASEROS({
            data: values,
            saleInf: sale.value,
            changing: changing.value,
          });
          break;

        default:
          message.error("No se encontro el formato de impresion");
      }

      // if (settingsStore.business_settings.printer.print_delivery_ticket) {
      //   console.log("asdasdasdasd");
      // }
      message.success("Imprimir");
    };

    const showConfirm = ref(false);

    const userConfirm = ref("");

    /* const errorLabel = (field) => {
      switch (field) {
        case "names":
          return "Nombres";
        case "doc_type":
          return "Tipo Documento";
        case "doc_num":
          return "N° Documento";
        case "birthdate":
          return "Fecha de Nacimiento";
        case "email":
          return "Correo";
        case "phone":
          return "Teléfono";
        case "gender":
          return "Género";
        default:
          return null;
      }
    }; */

    const performCreateOrder = async () => {
      loading.value = true;
      sale.value.sale_details = saleStore.toSale;
      await takeAwayOrder(orderStore.orderList, sale.value, userConfirm.value)
        .then((response) => {
          if (response.status === 201) {
            PrintsAfterTakeOrder(response.data);

            message.success("Venta realizada correctamente!");

            router.push({ name: "TableHome" });
          }
        })
        .catch((error) => {
          if (isAxiosError(error)) {
            if (error.response.status === 400) {
              for (const value in error.response.data) {
                for (const ser in error.response.data[`${value}`]) {
                  error.response.data[`${value}`][`${ser}`].forEach((err) => {
                    if (typeof err === "object") {
                      for (const v in err) {
                        message.error(`${err[`${v}`]}`);
                      }
                    } else {
                      message.error(`${err}`);
                    }
                  });
                }
              }
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
          }
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
                      PrintsAfterTakeOrder(response.data);
                      message.success("Venta realizada correctamente!");
                      router.push({ name: "TableHome" });
                    }
                  })
                  .catch((error) => {
                    if (isAxiosError(error)) {
                      if (error.response.status === 400) {
                        for (const value in error.response.data) {
                          for (const ser in error.response.data[`${value}`]) {
                            error.response.data[`${value}`][`${ser}`].forEach(
                              (err) => {
                                if (typeof err === "object") {
                                  for (const v in err) {
                                    message.error(`${err[`${v}`]}`);
                                  }
                                } else {
                                  message.error(`${err}`);
                                }
                              }
                            );
                          }
                        }
                      } else {
                        console.error(error);
                        message.error("Algo salió mal...");
                      }
                    }
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

    const isMultiple = ref(false);

    const selectProducts = ref(false);

    const showPayments = ref(false);

    const createPayment = () => {
      return {
        payment_method: null,
        amount: "",
      };
    };

    const doMultiplePayment = () => {
      sale.value.payments = [
        {
          payment_method: sale.value.payment_method,
          amount: String(sale.value.amount),
        },
      ];
      showPayments.value = true;
    };

    const filteredMethods = computed(() => {
      return saleStore.getPaymentMethodsOptions.map((option) => ({
        value: option.value,
        label: option.label,
        disabled: sale.value.payments.some(
          (pay) => pay.payment_method === option.value
        ),
      }));
    });

    const evalPayments = computed(() => {
      if (sale.value.payments) {
        return (
          sale.value.payments.reduce((acc, val) => {
            return (acc += parseFloat(val.amount));
          }, 0) !== sale.value.amount
        );
      } else {
        return true;
      }
    });

    const currentPaymentsAmount = computed(() => {
      if (sale.value.payments) {
        let sum = sale.value.payments.reduce((acc, val) => {
          return (acc += parseFloat(val.amount));
        }, 0);
        return isNaN(sum) ? "0.00" : sum.toFixed(2);
      } else {
        return "0.00";
      }
    });

    return {
      isDecimal,
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
      selectProduct,
      showCustomerModal,
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
      isMultiple,
      showPayments,
      createPayment,
      doMultiplePayment,
      filteredMethods,
      evalPayments,
      currentPaymentsAmount,
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
