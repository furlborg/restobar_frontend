<template>
  <div id="TablePayment">
    <n-spin :show="loading">
      <n-card>
        <n-form ref="saleForm" :model="sale" :rules="saleRules">
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
            <n-form-item-gi :span="6" label="Cliente" path="customer_name">
              <n-input-group>
                <n-auto-complete
                  :input-props="{
                    autocomplete: 'disabled',
                  }"
                  v-model:value="sale.customer_name"
                  :options="customerOptions"
                  :get-show="showOptions"
                  :loading="searching"
                  @select="
                    (value) => {
                      sale.customer = value;
                    }
                  "
                />
                <n-button type="info">
                  <v-icon name="md-add-round" />
                </n-button>
              </n-input-group>
            </n-form-item-gi>
            <n-form-item-gi :span="3" label="Método Pago" path="payment_method">
              <n-select
                v-model:value="sale.payment_method"
                :options="saleStore.getPaymentMethodsOptions"
                filterable
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi :span="3" label="Fecha" path="date_sale">
              <n-date-picker
                class="w-100"
                v-model:formatted-value="sale.date_sale"
                type="datetime"
                format="dd/M/yyyy hh:mm:ss"
              />
            </n-form-item-gi>
            <n-form-item-gi :span="10" label="Dirección">
              <n-input v-model="sale.address" />
            </n-form-item-gi>
            <n-form-item-gi>
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
            <tr v-for="(detail, index) in sale.sale_details" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ detail.quantity }}</td>
              <td>{{ detail.product_name }}</td>
              <td>S/. {{ detail.price_sale }}</td>
              <td>
                S/.
                {{ parseFloat(detail.quantity * detail.price_sale).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </n-table>
        <n-space align="center" justify="space-between">
          <n-space align="center" vertical>
            <span class="fs-4">Pago</span>
            <div class="fs-5">
              S/.
              <input
                class="fs-1 currency-input"
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
                class="currency-input fw-bold"
                type="number"
                min="0"
                step=".01"
                v-model="sale.discount"
                v-autowidth
                @click="$event.target.select()"
              />
            </div>
            <div>
              TOTAL: <span>S/. {{ sale.amount.toFixed(2) }}</span>
            </div>
          </n-space>
        </n-space>
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
  </div>
</template>

<script>
import { defineComponent, ref, toRefs, computed, watch, onMounted } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { saleRules } from "@/utils/constants";
import { isDecimal, isNumber, isLetter } from "@/utils";
import { searchCustomerByName } from "@/api/modules/customer";
import { createSale, getSaleNumber } from "@/api/modules/sales";
import { useMessage } from "naive-ui";
import { directive as VueInputAutowidth } from "vue-input-autowidth";

export default defineComponent({
  name: "TablePayment",
  directives: { autowidth: VueInputAutowidth },
  setup() {
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const message = useMessage();
    const loading = ref(false);
    const payment_amount = ref("0.00");
    const saleForm = ref();
    const changing = computed(() => {
      return total.value - payment_amount.value;
    });

    const showObservations = ref(false);

    const subTotal = computed(() => {
      return sale.value.sale_details.reduce((acc, curVal) => {
        return (acc += curVal.price_sale * curVal.quantity);
      }, 0);
    });

    const products_count = computed(() => {
      return sale.value.sale_details.reduce((acc, curVal) => {
        return (acc += curVal.quantity);
      }, 0);
    });

    const total = computed(() => {
      return parseFloat(subTotal.value - sale.value.discount);
    });

    const sale = ref({
      order: orderStore.orderId,
      serie: 2,
      number: "",
      date_sale: null,
      count: products_count,
      amount: total,
      invoice_type: 3,
      payment_method: null,
      payment_condition: 1,
      customer: null,
      customer_name: "",
      address: "",
      branch_office: 1,
      discount: "0.00",
      observations: "",
      sale_details: orderStore.orderToSale,
    });

    const customerOptions = ref([]);

    const searching = ref(false);

    const selectSerie = (v) => {
      sale.value.serie = v;
    };

    const changeSerie = (v) => {
      switch (v) {
        case 1:
          sale.value.serie = 1;
          break;
        case 3:
          sale.value.serie = 2;
          break;
        case 80:
          sale.value.serie = 3;
          break;
        default:
          break;
      }
    };

    const performCreateSale = () => {
      saleForm.value.validate((errors) => {
        if (!errors) {
          createSale(sale.value)
            .then((response) => {
              if (response.status === 201) {
                console.log(response.data);
              }
            })
            .catch((error) => {
              console.error(error.response.data);
              message.error("Algo salió mal...");
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
            sale.value.number = response.data.number;
          }
        })
        .catch((error) => {
          console.log(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const showOptions = (value) => {
      if (value.length >= 3) {
        searching.value = true;
        searchCustomerByName(value)
          .then((response) => {
            if (response.status === 200) {
              customerOptions.value = response.data.map((customer) => ({
                value: customer.id,
                label: customer.names,
                disabled: customer.is_disabled,
              }));
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

    const { serie } = toRefs(sale.value);

    watch(serie, () => {
      console.log(new Date(Date.now()).toLocaleString("es-PE"));
      obtainSaleNumber();
    });

    onMounted(() => {
      sale.value.date_sale = new Date(Date.now()).toLocaleString();
      obtainSaleNumber();
    });

    return {
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
    };
  },
});
</script>

<style lang="scss" scoped>
.currency-input {
  border: none;
  outline: none;
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