<template>
  <div id="TablePayment">
    <n-spin :show="loading">
      <n-card>
        <n-space class="mb-2" align="center" justify="space-between">
          <div class="d-flex align-items-center">
            <n-text class="fs-4">{{
              `${saleStore.getSerieDescription(sale.serie)}-${sale.number}`
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
        <n-form class="mb-2" ref="saleForm" :model="sale" :rules="formRules">
          <n-grid
            responsive="screen"
            cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12"
            :x-gap="12"
          >
            <n-form-item-gi
              :span="9"
              label="Cliente"
              :show-require-mark="formRules.customer.required"
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
                  :get-show="showOptions"
                  :loading="searching"
                  @keypress.enter="autoCreateCustomer"
                  @update:value="
                    (v) => {
                      !v
                        ? ((sale.customer = null),
                          (sale.address = null),
                          (whatsappNumber = ''),
                          (addressesOptions = []))
                        : null;
                    }
                  "
                  @select="
                    (value) => {
                      sale.customer = value;
                      sale.address = null;
                      whatsappNumber = '';
                      createAddressesOptions();
                    }
                  "
                  placeholder=""
                  clearable
                />
                <n-button type="info" secondary @click="showModal = true">
                  <v-icon name="md-add-round" />
                </n-button>
              </n-input-group>
            </n-form-item-gi>
            <n-form-item-gi :span="3" label="Fecha">
              <n-date-picker
                class="w-100"
                type="datetime"
                :is-date-disabled="dateDisabled"
                v-model:formatted-value="sale.date_sale"
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
        <n-scrollbar :x-scrollable="true" style="max-width: 1000px">
          <n-table class="fs-6 m-auto text-center" :bordered="false">
            <thead>
              <tr>
                <th
                  v-if="settingsStore.businessSettings.sale.manage_affectations"
                >
                  #
                </th>
                <th>Cantidad</th>
                <th>Producto</th>
                <th>Precio Unitario</th>
                <th>Descuento</th>
                <th>Precio Total</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(detail, index) in saleStore.toSale">
                <tr v-if="detail.quantity > 0" :key="index">
                  <td
                    v-if="
                      settingsStore.businessSettings.sale.manage_affectations
                    "
                  >
                    <n-popselect
                      size="small"
                      placement="bottom-start"
                      v-model:value="detail.product_affectation"
                      :disabled="
                        !userStore.hasPermission('change_product_affectation')
                      "
                      :options="productStore.affectationsOptions"
                      @update:value="(v) => saleStore.updateDetail(detail)"
                    >
                      <n-tag
                        size="small"
                        :color="getAfcColor(detail.product_affectation)"
                        >{{ getAfcShort(detail.product_affectation) }}</n-tag
                      >
                    </n-popselect>
                  </td>
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
                      step=".5"
                      v-model="detail.price_sale"
                      @input="
                        (v) => (
                          saleStore.updateDetail(detail),
                          (detail.discount = parseFloat(0).toFixed(2))
                        )
                      "
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
                      :max="!detail.price_sale ? 0 : detail.price_sale"
                      :disabled="!!Number(sale.discount)"
                      step=".5"
                      v-model="detail.discount"
                      v-autowidth
                      @click="$event.target.select()"
                    />
                  </td>
                  <td>
                    {{
                      parseFloat(
                        detail.quantity * detail.price_sale - detail.discount
                      ).toFixed(2)
                    }}
                  </td>
                </tr>
              </template>
            </tbody>
          </n-table>
        </n-scrollbar>
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
                    v-model="sale.given_amount"
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
              <div v-if="subTotal">
                SUBTOTAL: <span>S/. {{ subTotal.toFixed(2) }}</span>
              </div>
              <div v-if="totalGRV">
                OP. GRAVADAS: <span>S/. {{ totalGRV.toFixed(2) }}</span>
              </div>
              <div v-if="totalEXN">
                OP. EXONERADAS: <span>S/. {{ totalEXN.toFixed(2) }}</span>
              </div>
              <div v-if="totalGRT">
                OP. GRATUITAS: <span>S/. {{ totalGRT.toFixed(2) }}</span>
              </div>
              <div v-if="totalIGV">
                IGV: <span>S/. {{ totalIGV.toFixed(2) }}</span>
              </div>
              <div>
                DSCT:
                <span>S/.</span>
                <input
                  class="custom-input fw-bold"
                  type="number"
                  min="0"
                  step=".5"
                  v-model="totalDSCT"
                  v-autowidth
                  :disabled="
                    saleStore.toSale.some(
                      (detail) => Number(detail.discount) > 0
                    )
                  "
                  @click="$event.target.select()"
                />
              </div>
              <div v-if="icbper">
                ICBPER: <span>S/. {{ icbper.toFixed(2) }}</span>
              </div>
              <div>
                OTROS:
                <span>S/.</span>
                <input
                  class="custom-input fw-bold"
                  type="number"
                  min="0"
                  step=".5"
                  v-model="sale.other_charges"
                  v-autowidth
                  @click="$event.target.select()"
                />
              </div>
              <div>
                TOTAL: <span>S/. {{ sale.amount }}</span>
              </div>
            </n-space>
          </n-gi>
        </n-grid>
        <!-- <n-button
          class="fs-1 py-5 mt-2"
          type="success"
          :disabled="
            !saleStore.toSale.length || sale.given_amount < sale.amount
          "
          secondary
          block
          @click.prevent="performCreateSale"
          ><v-icon class="me-2" name="fa-coins" scale="2" />Cobrar</n-button
        > -->
        <n-space justify="space-between">
          <n-checkbox v-model:checked="isMultiple">Pago multiple</n-checkbox>
          <n-button type="info" text @click="openSeparatePaymentsModal"
            >Nueva cuenta</n-button
          >
        </n-space>
        <n-divider />
        <n-grid
          responsive="screen"
          cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12"
          :x-gap="12"
        >
          <n-gi :span="4">
            <n-input-group>
              <n-button
                type="success"
                :disabled="!(whatsappNumber.length >= 9)"
                secondary
              >
                <v-icon name="bi-whatsapp" />
              </n-button>
              <n-input placeholder="" v-model:value="whatsappNumber" />
            </n-input-group>
          </n-gi>
          <n-gi class="d-flex align-items-center" :span="3">
            <n-checkbox v-model:checked="ticketPreview"
              >Previsualizar ticket</n-checkbox
            >
          </n-gi>
        </n-grid>
        <n-button
          class="fs-1 py-5 mt-2"
          type="success"
          :disabled="
            !saleStore.toSale.filter((detail) => !!detail.quantity).length ||
            sale.given_amount < sale.amount
          "
          secondary
          block
          @click.prevent="
            isMultiple ? doMultiplePayment() : performCreateSale()
          "
        >
          <v-icon class="me-2" name="fa-coins" scale="2" />Cobrar
        </n-button>
      </n-card>
    </n-spin>
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
          >Total: S/. {{ showPayments ? sale.amount : null }}</n-tag
        >
        <n-tag :type="evalPayments ? 'error' : 'success'"
          >Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}
        </n-tag>
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
            sale.payments.some((pay) => pay.payment_method === null) ||
            sale.payments.some((pay) => Number(pay.amount) <= 0)
          "
          secondary
          @click="performCreateSale"
          >Confirmar</n-button
        >
      </n-space>
    </n-modal>
    <!-- Customer Modal -->
    <customer-modal
      v-model:show="showModal"
      :doc_type="sale.invoice_type === 1 ? '6' : null"
      :document="customerDocument"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
    <separate-payments-modal
      v-model:show="showSeparateModal"
      :data="separatePayments"
      :on-close="closeSeparatePaymentsModal"
      @success="successSeparatePaymentsModal"
    />
    <preview-drawer
      ref="previewDrawer"
      v-model:show="showPdf"
      :data="pdfData"
      :previewOnly="!ticketPreview"
      @printed="() => $router.push({ name: 'TableHome' })"
      @canceled="() => $router.push({ name: 'TableHome' })"
    />
  </div>
</template>

<script>
import { defineComponent, ref, toRefs, computed, watch, onMounted } from "vue";
import { isAxiosError } from "axios";
import CustomerModal from "@/views/Customer/components/CustomerModal";
import SeparatePaymentsModal from "./SeparatePaymentsModal";
import { useSettingsStore } from "@/store/modules/settings";
import { useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useProductStore } from "@/store/modules/product";
import { useSaleStore } from "@/store/modules/sale";
import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { saleRules } from "@/utils/constants";
import { cloneDeep, isDecimal } from "@/utils";
import {
  searchCustomerByName,
  searchRucCustomer,
} from "@/api/modules/customer";
import {
  createSale,
  getSaleNumber,
  sendSale,
  sendWhatsapp,
} from "@/api/modules/sales";
import { useDialog, useMessage } from "naive-ui";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import format from "date-fns/format";
import { lighten } from "@/utils";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import { useBusinessStore } from "@/store/modules/business";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";

export default defineComponent({
  name: "TablePayment",
  directives: { autowidth: VueInputAutowidth },
  components: {
    CustomerModal,
    SeparatePaymentsModal,
    PreviewDrawer,
  },
  setup() {
    const dateNow = ref(null);
    const router = useRouter();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const userStore = useUserStore();
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const message = useMessage();
    const loading = ref(false);
    const dialog = useDialog();
    const showModal = ref(false);
    const payment_amount = ref(parseFloat(0).toFixed(2));
    const saleForm = ref();
    const ticketPreview = ref(settingsStore.businessSettings.sale.show_preview);
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

    const totalGRV = computed(() => {
      return saleStore.toSale.reduce((acc, curVal) => {
        return curVal.product_affectation === 10
          ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
          : acc;
      }, 0);
    });

    const totalEXN = computed(() => {
      return saleStore.toSale.reduce((acc, curVal) => {
        return curVal.product_affectation === 20
          ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
          : acc;
      }, 0);
    });

    const totalGRT = computed(() => {
      return saleStore.toSale.reduce((acc, curVal) => {
        return curVal.product_affectation === 21
          ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
          : acc;
      }, 0);
    });

    const totalIGV = computed(() => {
      return saleStore.toSale.reduce((acc, curVal) => {
        return (acc += curVal.igv_tax * curVal.quantity);
      }, 0);
    });

    const totalDSCT = computed({
      get: () => {
        if (saleStore.toSale.some((detail) => Number(detail.discount) > 0)) {
          return saleStore.toSale.reduce((acc, curVal) => {
            return (acc += Number(curVal.discount));
          }, 0);
        }
        return sale.value.discount;
      },
      set: (v) => {
        if (!saleStore.toSale.some((detail) => Number(detail.discount) > 0)) {
          sale.value.discount = v;
        } else {
          sale.value.discount = saleStore.toSale.reduce((acc, curVal) => {
            return (acc += Number(curVal.discount));
          }, 0);
        }
      },
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
      return parseFloat(
        totalIGV.value +
          totalGRV.value +
          totalEXN.value -
          totalGRT.value -
          parseFloat(totalDSCT.value) +
          icbper.value +
          parseFloat(sale.value.other_charges)
      ).toFixed(2);
    });

    const sale = ref({
      order: null,
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
      other_charges: "0.00",
      observations: "",
      by_consumption: false,
      sale_details: [],
      payments: null,
      do_update: true,
      is_change: true,
      taxed_amount: totalGRV,
      exempt_amount: totalEXN,
      free_amount: totalGRT,
      igv_amount: totalIGV,
    });

    watch(total, () => {
      sale.value.given_amount =
        total.value > 0 ? total.value : parseFloat(0).toFixed(2);
    });

    const formRules = computed(() => {
      let rules = saleRules;
      if (sale.value.invoice_type !== 1) {
        rules.customer.required = false;
      } else {
        rules.customer.required = true;
      }
      return rules;
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

    const businessStore = useBusinessStore();

    const performCreateSale = () => {
      saleForm.value.validate((errors) => {
        if (!errors) {
          dialog.success({
            closable: false,
            title: "Venta",
            content: "Realizar venta?",
            positiveText: "Sí",
            onPositiveClick: async () => {
              loading.value = true;
              sale.value.order = orderStore.orderId;
              sale.value.sale_details = saleStore.toSale.map((detail) => ({
                ...detail,
                igv_tax: detail.igv_tax.toFixed(2),
                price_base: detail.price_base.toFixed(2),
              }));
              sale.value.discount = totalDSCT.value;
              await createSale(sale.value)
                .then((response) => {
                  if (response.status === 201) {
                    if (settingsStore.business_settings.printer.print_html) {
                      pdfData.value = response.data;
                      showPdf.value = true;
                      if (!ticketPreview.value) {
                        setTimeout(() => previewDrawer.value.generate(), 250);
                      }
                    } else {
                      VoucherPrint({
                        data: response.data,
                        businessStore,
                        saleStore,
                        changing: changing.value,
                        show: true,
                      });
                      router.push({ name: "TableHome" });
                    }

                    if (
                      settingsStore.businessSettings.sale.auto_send &&
                      response.data.invoice_type !== "80"
                    ) {
                      sendSale(response.data.id)
                        .then((response) => {
                          if (response.status === 200) {
                            const sale = response.data;
                            message.success("Enviado!");
                            if (whatsappNumber.value.length >= 9) {
                              sendWhatsapp(
                                sale.id,
                                sale.codsale.split("-"),
                                whatsappNumber.value
                              )
                                .then((response) => {
                                  console.log(response);
                                })
                                .catch((error) => {
                                  console.error(error);
                                });
                            }
                          }
                        })
                        .catch((error) => {
                          if (isAxiosError(error)) {
                            if (error.response.status === 400) {
                              console.error(error);
                              for (const value in error.response.data) {
                                error.response.data[`${value}`].forEach(
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
                            } else {
                              console.error(error);
                              message.error("Algo salió mal...");
                            }
                          } else {
                            console.error(error);
                            message.error("Algo salió mal...");
                          }
                        });
                    } else {
                      if (whatsappNumber.value.length >= 9) {
                        sendWhatsapp(
                          response.data.id,
                          response.data.codsale.split("-"),
                          whatsappNumber.value
                        )
                          .then((response) => {
                            console.log(response);
                          })
                          .catch((error) => {
                            console.error(error);
                          });
                      }
                    }
                    message.success("Venta realizada correctamente!");
                    // router.push({ name: "TableHome" });
                  }
                })
                .catch((error) => {
                  if (isAxiosError(error)) {
                    if (error.response.status === 400) {
                      console.error(error);
                      for (const value in error.response.data) {
                        error.response.data[`${value}`].forEach((err) => {
                          if (typeof err === "object") {
                            for (const v in err) {
                              message.error(`${err[`${v}`]}`);
                            }
                          } else {
                            message.error(`${err}`);
                          }
                        });
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
      whatsappNumber.value = !customer.phone ? "" : customer.phone;
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

    watch(serie, async () => {
      await obtainSaleNumber();
    });

    onMounted(async () => {
      sale.value.given_amount = total.value;
      await obtainSaleNumber();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm}/${yy} ${hh}:${msms}`;
    });

    const onCloseModal = () => {};

    const onSuccess = (customer) => {
      if (sale.value.invoice_type === 1 && customer.doc_type === "6") {
        customerResults.value.push(customer);
        sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
        sale.value.customer = customer.id;
        whatsappNumber.value = !customer.phone ? "" : customer.phone;
        createAddressesOptions();
      } else if (sale.value.invoice_type !== 1) {
        customerResults.value.push(customer);
        sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
        sale.value.customer = customer.id;
        createAddressesOptions();
      }
      showModal.value = false;
      onCloseModal();
    };

    const isMultiple = ref(false);

    const showPayments = ref(false);

    const createPayment = () => {
      return {
        payment_method: null,
        amount: "0",
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
          }, 0) !== Number(sale.value.amount)
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

    const separatePayments = ref({});

    const showSeparateModal = ref(false);

    const openSeparatePaymentsModal = () => {
      separatePayments.value = cloneDeep(sale.value);
      separatePayments.value.order = cloneDeep(orderStore.orderId);
      separatePayments.value.sale_details = cloneDeep(saleStore.toSale);
      separatePayments.value.sale_details.forEach(
        (detail) => (detail.max = detail.quantity)
      );
      showSeparateModal.value = true;
    };

    const closeSeparatePaymentsModal = () => {
      // console.log(separatePayments.value);
    };

    const successSeparatePaymentsModal = () => {
      obtainSaleNumber();
    };

    const dateDisabled = (ts) => {
      return ts > new Date(Date.now());
    };

    const customerDocument = ref("");

    const autoCreateCustomer = () => {
      if (!searching.value && !customerResults.value.length) {
        if (
          !isNaN(sale.value.customer_name) &&
          ((sale.value.customer_name.length === 8 &&
            sale.value.invoice_type !== 1) ||
            sale.value.customer_name.length === 11)
        ) {
          customerDocument.value = sale.value.customer_name;
          showModal.value = true;
        }
      }
    };

    function getAfcColor(afc) {
      switch (afc) {
        case 10:
          return {
            color: lighten("#008B8B", 48),
            textColor: "#008B8B",
            borderColor: lighten("#008B8B", 24),
          };
        case 20:
          return {
            color: lighten("#9932CC", 48),
            textColor: "#9932CC",
            borderColor: lighten("#9932CC", 24),
          };
        case 21:
          return {
            color: lighten("#006400", 48),
            textColor: "#006400",
            borderColor: lighten("#006400", 24),
          };
        default:
          return {
            color: lighten("#8B0000", 48),
            textColor: "#8B0000",
            borderColor: lighten("#8B0000", 24),
          };
      }
    }

    function getAfcShort(afc) {
      switch (afc) {
        case 10:
          return "GRV";
        case 20:
          return "EXN";
        case 21:
          return "GRT";
        default:
          console.error("Afectación inválida");
          return "---";
      }
    }

    const whatsappNumber = ref("");

    const showPdf = ref(false);

    const previewDrawer = ref(null);

    const pdfData = ref(null);

    return {
      showModal,
      userStore,
      saleStore,
      orderStore,
      productStore,
      settingsStore,
      sale,
      isDecimal,
      loading,
      saleForm,
      formRules,
      showOptions,
      customerOptions,
      autoCreateCustomer,
      customerDocument,
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
      genericsStore,
      icbper,
      isMultiple,
      showPayments,
      createPayment,
      doMultiplePayment,
      filteredMethods,
      evalPayments,
      currentPaymentsAmount,
      openSeparatePaymentsModal,
      closeSeparatePaymentsModal,
      successSeparatePaymentsModal,
      separatePayments,
      showSeparateModal,
      dateDisabled,
      getAfcShort,
      getAfcColor,
      totalIGV,
      totalGRV,
      totalEXN,
      totalGRT,
      totalDSCT,
      whatsappNumber,
      ticketPreview,
      previewDrawer,
      showPdf,
      pdfData,
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
  margin: 0;
  /* <-- Apparently some margin are still there even though it's hidden */
}

input[type="number"] {
  -moz-appearance: textfield;
  /* Firefox */
}
</style>
