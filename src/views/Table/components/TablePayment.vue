<template>
  <div id="TablePayment">
    <n-spin :show="loading">
      <n-card>
        <n-form class="mb-2" ref="saleForm" :model="sale" :rules="saleRules">
          <n-space class="mb-2" align="center" justify="space-between">
            <div class="d-flex align-items-center">
              <n-text class="fs-4">{{
                saleStore.getSerieDescription(sale.serie) + sale.number
              }}</n-text>
              <n-dropdown
                trigger="click"
                :options="saleStore.getDocumentSeriesOptions(sale.invoice_type)"
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
              <n-radio-button :value="80" :key="80">N. VENTA</n-radio-button>
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

          <n-grid
            responsive="screen"
            cols="12 s:12 m:12 l:12 xl:12 2xl:12"
            :x-gap="12"
          >
            <n-form-item-gi :span="9" label="Cliente" path="customer">
              <n-input-group>
                <n-auto-complete
                  blur-after-select
                  :input-props="{
                    autocomplete: 'disabled',
                  }"
                  v-model:value="sale.customer_name"
                  :options="customerOptions"
                  :get-show="showOptions"
                  :loading="searching"
                  @update:value="
                    (v) => {
                      !v
                        ? ((sale.customer = null), createAddressesOptions())
                        : null;
                    }
                  "
                  @select="
                    (value) => {
                      sale.customer = value;
                      sale.address = null;
                      createAddressesOptions();
                      sale.invoice_type === 1
                        ? (sale.address = addressesOptions[0].value)
                        : null;
                    }
                  "
                  placeholder=""
                  clearable
                />
                <n-button type="info" @click="showModal = true">
                  <v-icon name="md-add-round" />
                </n-button>
              </n-input-group>
            </n-form-item-gi>
            <n-form-item-gi :span="3" label="Fecha" path="date_sale">
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
            <n-form-item-gi :span="2" label="Método Pago" path="payment_method">
              <n-select
                v-model:value="sale.payment_method"
                :options="saleStore.getPaymentMethodsOptions"
                filterable
              />
            </n-form-item-gi>
            <n-form-item-gi :span="2">
              <n-checkbox v-model:checked="sale.by_consumption"
                >Por consumo</n-checkbox
              >
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
            <tr v-for="(detail, index) in saleStore.toSale" :key="index">
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
                {{ parseFloat(detail.quantity * detail.price_sale).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </n-table>
        <n-grid cols="3">
          <n-gi :span="2">
            <n-space class="h-100" align="center" justify="space-around">
              <n-space align="center" vertical>
                <span class="fs-4">Pago</span>
                <div class="fs-5">
                  S/.
                  <input
                    class="fs-1 custom-input"
                    type="number"
                    min="0"
                    step=".01"
                    v-model="payment_amount"
                    v-autowidth
                    @click="$event.target.select()"
                  />
                </div>
              </n-space>
              <n-space align="center" vertical>
                <span class="fs-4">Vuelto</span>
                <div class="fs-5">
                  S/. <span class="fs-1">{{ changing.toFixed(2) }}</span>
                </div>
              </n-space>
            </n-space>
          </n-gi>
          <n-gi>
            <n-space class="mt-2 fs-6 fw-bold" align="end" vertical>
              <div>
                SUBTOTAL: <span>S/. {{ subTotal.toFixed(2) }}</span>
              </div>
              <div>ICBPER: <span>S/. 0.00</span></div>
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
          :disabled="changing > 0"
          secondary
          block
          @click.prevent="performCreateSale"
          ><v-icon class="me-2" name="fa-coins" scale="2" />Cobrar</n-button
        >
      </n-card>
    </n-spin>
    <!-- Customer Modal -->
    <customer-modal
      v-model:show="showModal"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, toRefs, computed, watch, onMounted } from "vue";
import CustomerModal from "@/views/Customer/components/CustomerModal";
import { useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { saleRules } from "@/utils/constants";
import { isDecimal, isNumber, isLetter } from "@/utils";
import {
  searchCustomerByName,
  searchRucCustomer,
} from "@/api/modules/customer";
import { createSale, getSaleNumber } from "@/api/modules/sales";
import { useDialog, useMessage } from "naive-ui";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import format from "date-fns/format";

export default defineComponent({
  name: "TablePayment",
  directives: { autowidth: VueInputAutowidth },
  components: {
    CustomerModal,
  },
  setup() {
    const router = useRouter();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const message = useMessage();
    const loading = ref(false);
    const dialog = useDialog();
    const showModal = ref(false);
    const payment_amount = ref(parseFloat(0).toFixed(2));
    const saleForm = ref();
    const changing = computed(() => {
      return payment_amount.value > total.value
        ? total.value - payment_amount.value
        : 0.0;
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
      return parseFloat(subTotal.value - sale.value.discount);
    });

    const sale = ref({
      order: null,
      serie: saleStore.getFirstOption(3),
      number: "",
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy hh:mm:ss"),
      count: products_count,
      amount: total,
      invoice_type: 3,
      payment_method: 1,
      payment_condition: 1,
      customer_name: "",
      customer: null,
      address: null,
      discount: "0.00",
      observations: "",
      by_consumption: false,
      sale_details: [],
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

    const performCreateSale = () => {
      saleForm.value.validate((errors) => {
        if (!errors) {
          dialog.success({
            title: "Venta",
            content: "Realizar venta?",
            positiveText: "Sí",
            onPositiveClick: () => {
              loading.value = true;
              sale.value.order = orderStore.orderId;
              sale.value.sale_details = saleStore.toSale;
              createSale(sale.value)
                .then((response) => {
                  if (response.status === 201) {
                    message.success("Venta realizada correctamente!");
                    router.push({ name: "TableHome" });
                  }
                })
                .catch((error) => {
                  console.error(error.response.data);
                  message.error("Algo salió mal...");
                })
                .finally(() => {
                  loading.value = false;
                });
            },
          });
        } else {
          console.error(errors);
          message.error("Datos Incorrectos");
        }
      });
    };

    const obtainSaleNumber = () => {
      loading.value = true;
      getSaleNumber(sale.value.serie)
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

    const searching = ref(false);

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
    };

    const showOptions = async (value) => {
      if (value.length >= 3 && value.length <= 11) {
        searching.value = true;
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
              searching.value = false;
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
              searching.value = false;
            });
          return true;
        }
      } else {
        customerResults.value = [];
        return false;
      }
    };

    const { serie } = toRefs(sale.value);

    watch(serie, () => {
      obtainSaleNumber();
    });

    onMounted(() => {
      document.title = "Venta | App";
      obtainSaleNumber();
    });

    const onCloseModal = () => {
      document.title = "Venta | App";
    };

    const onSuccess = (customer) => {
      customerResults.value.push(customer);
      sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
      sale.value.customer = customer.id;
      createAddressesOptions();
      showModal.value = false;
      onCloseModal();
    };

    return {
      showModal,
      orderStore,
      saleStore,
      sale,
      isDecimal,
      loading,
      saleForm,
      saleRules,
      showOptions,
      customerOptions,
      searching,
      changing,
      payment_amount,
      subTotal,
      selectSerie,
      changeSerie,
      showObservations,
      performCreateSale,
      addressesOptions,
      createAddressesOptions,
      onCloseModal,
      onSuccess,
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
</style>