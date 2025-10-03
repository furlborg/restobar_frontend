<template>
  <n-card :bordered="false" class="h-100" content-class="p-0 overflow-auto">
    <n-scrollbar>
      <div id="TablePayment">
        <n-spin :show="loading">
          <n-card :bordered="false" content-class="p-0">
            <n-space class="mb-2" align="center" justify="space-between">
              <SaleSerieSelector
                :sale="sale"
                :invoice-type="sale.invoice_type"
                @update:serie="handleSerieUpdate"
                @serie-changed="handleSerieChanged"
              />
              <n-radio-group v-model:value="sale.invoice_type" name="docType" size="small" @update:value="changeSerie">
                <n-radio-button :disabled="!settingsStore.businessSettings.sale?.enable_invoices" :value="1">FACTURA</n-radio-button>
                <n-radio-button :disabled="!settingsStore.businessSettings.sale?.enable_invoices" :value="3">BOLETA</n-radio-button>
                <n-radio-button :value="80">N. VENTA</n-radio-button>
              </n-radio-group>
              <n-radio-group v-model:value="sale.payment_condition" name="saleType" size="small"
                :disabled="!settingsStore.businessSettings?.sale?.enable_credits" @update:value="changeCondition">
                <n-radio-button :value="1">CONTADO</n-radio-button>
                <n-radio-button :value="2">CRÉDITO</n-radio-button>
              </n-radio-group>
            </n-space>
            <n-form class="mb-2" ref="saleForm" :model="sale" :rules="formRules">
              <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
                <n-form-item-gi :span="9" label="Cliente" :show-require-mark="formRules.customer.required" path="customer">
                  <ClientSelectInput
                    v-model:customer-name="sale.customer_name"
                    v-model:customer-id="sale.customer"
                    :invoice-type="sale.invoice_type"
                    @customer-selected="handleCustomerSelected"
                    @customer-cleared="handleCustomerCleared"
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="3" label="Fecha">
                  <n-date-picker
                    class="w-100"
                    type="datetime"
                    :is-date-disabled="disablePastDates"
                    :is-time-disabled="disablePastTimes"
                    :disabled="sale.payment_condition !== 2"
                    v-model:formatted-value="sale.date_sale"
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="5" label="Dirección">
                  <n-select v-model:value="sale.address" :options="addressesOptions"
                    :disabled="!sale.customer" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="3" label="Método Pago">
                  <n-select v-model:value="sale.payment_method" :options="saleStore.getPaymentMethodsOptions" filterable />
                </n-form-item-gi>
                <n-form-item-gi :span="2">
                  <n-checkbox v-model:checked="sale.by_consumption" :disabled="sale.payment_condition === 2">Por consumo</n-checkbox>
                </n-form-item-gi>
                <n-form-item-gi :span="2">
                  <n-button type="info" text @click="showObservations = !showObservations">
                    {{ showObservations ? "Ocultar" : "Ver" }} Observaciones
                  </n-button>
                </n-form-item-gi>
                <n-gi :span="12">
                  <n-collapse-transition :show="showObservations">
                    <n-form-item label="Observaciones">
                      <n-input type="textarea" v-model:value="sale.observations"/>
                    </n-form-item>
                  </n-collapse-transition>
                </n-gi>
              </n-grid>
            </n-form>
            <n-scrollbar>
              <n-table v-if="!shouldShowCustomerMode" class="m-auto text-center fs-6 mb-3" :bordered="false">
                <thead>
                  <tr>
                    <th v-if="settingsStore.businessSettings.sale?.manage_affectations">#</th>
                    <th>Cantidad</th>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th v-if="settingsStore.business_settings.sale?.show_discount_label">Descuento</th>
                    <th>Precio Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(detail, index) in saleStore.toSale" :key="index">
                    <td v-if="settingsStore.businessSettings.sale?.manage_affectations">
                      <n-popselect size="small" placement="bottom-start" v-model:value="detail.product_affectation"
                        :disabled="!userStore.hasPermission('change_product_affectation')"
                        :options="productStore.affectationsOptions" @update:value="saleStore.updateDetail(detail)">
                        <n-tag size="small" :color="getAfcColor(detail.product_affectation)">
                          {{ getAfcShort(detail.product_affectation) }}
                        </n-tag>
                      </n-popselect>
                    </td>
                    <td>{{ detail.quantity }}</td>
                    <td><input class="custom-input" v-model="detail.product_name" v-autowidth @click="$event.target.select()"/></td>
                    <td>
                      S/. <input class="custom-input" type="number" :min="detail.product_affectation === 20 ? 1 : 0"
                        step=".5" v-model="detail.price_sale" v-autowidth @click="$event.target.select()"
                        :disabled="!settingsStore.business_settings.sale?.show_discount_label"
                        @input="saleStore.updateDetail(detail), detail.discount = '0.00'"/>
                    </td>
                    <td v-if="settingsStore.business_settings.sale?.show_discount_label">
                      S/. <input class="custom-input" type="number" min="0" :max="detail.price_sale || 0" step=".5"
                        :disabled="detail.product_affectation === 21 || !!Number(sale.discount)"
                        v-model="detail.discount" v-autowidth @click="$event.target.select()"/>
                    </td>
                    <td>{{ detail.product_affectation === 21 ? "0.00" : (detail.quantity * detail.price_sale - detail.discount).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </n-table>
              <n-space v-else vertical>
                <n-card v-for="customer in customers" :key="customer.id">
                  <template #header>
                    <n-text class="fs-5">{{ customer.name }}</n-text>
                  </template>
                    <n-scrollbar>
                      <n-table :bordered="false">
                          <thead>
                            <tr>
                              <th v-if="settingsStore.businessSettings.sale?.manage_affectations">#</th>
                              <th>Cantidad</th>
                              <th>Producto</th>
                              <th>Precio Unitario</th>
                              <th v-if="settingsStore.business_settings.sale?.show_discount_label">Descuento</th>
                              <th>Precio Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(detail, index) in saleStore.toSale.filter(d => d.quantity > 0 && d.customer.id === customer.id)" :key="index">
                              <td v-if="settingsStore.businessSettings.sale?.manage_affectations">
                                <n-popselect size="small" placement="bottom-start" v-model:value="detail.product_affectation"
                                  :disabled="!userStore.hasPermission('change_product_affectation')"
                                  :options="productStore.affectationsOptions" @update:value="saleStore.updateDetail(detail)">
                                  <n-tag size="small" :color="getAfcColor(detail.product_affectation)">
                                    {{ getAfcShort(detail.product_affectation) }}
                                  </n-tag>
                                </n-popselect>
                              </td>
                              <td>{{ detail.quantity }}</td>
                              <td><input class="custom-input" v-model="detail.product_name" v-autowidth @click="$event.target.select()"/></td>
                              <td>
                                S/. <input class="custom-input" type="number" :min="detail.product_affectation === 20 ? 1 : 0"
                                  step=".5" v-model="detail.price_sale" v-autowidth @click="$event.target.select()"
                                  :disabled="!settingsStore.business_settings.sale?.show_discount_label"
                                  @input="saleStore.updateDetail(detail), detail.discount = '0.00'"/>
                              </td>
                              <td v-if="settingsStore.business_settings.sale?.show_discount_label">
                                S/. <input class="custom-input" type="number" min="0" :max="detail.price_sale || 0" step=".5"
                                  :disabled="detail.product_affectation === 21 || !!Number(sale.discount)"
                                  v-model="detail.discount" v-autowidth @click="$event.target.select()"/>
                              </td>
                              <td>{{ detail.product_affectation === 21 ? "0.00" : (detail.quantity * detail.price_sale - detail.discount).toFixed(2) }}</td>
                            </tr>
                          </tbody>
                      </n-table>
                    </n-scrollbar>
                </n-card>
              </n-space>
            </n-scrollbar>
            <PaymentTotals
              :items="paymentTotalsItems"
              :total-amount="sale.amount"
              :payment-amount="sale.given_amount"
              :change-amount="changing"
              @value-changed="handleValueChange"
              @payment-changed="handlePaymentChange"
            />
            <n-space v-if="sale.payment_condition === 1" justify="space-between">
              <n-checkbox v-model:checked="isMultiple">Pago multiple</n-checkbox>
              <n-button type="info" text @click="openSeparatePaymentsModal">Nueva cuenta</n-button>
            </n-space>
            <n-divider />
            <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
              <n-gi class="d-flex align-items-center" :span="3">
                <n-checkbox v-model:checked="ticketPreview">Previsualizar ticket</n-checkbox>
              </n-gi>
            </n-grid>
            <n-button class="fs-1 py-5 mt-2" type="success"
              :disabled="!saleStore.toSale.filter(d => !!d.quantity).length ||
                (sale.payment_condition === 1 ? sale.given_amount < sale.amount : !(sale.given_amount < sale.amount))"
              secondary block @click.prevent="isMultiple ? doMultiplePayment() : performCreateSale()">
              <v-icon class="me-2" name="fa-coins" scale="2" />Cobrar
            </n-button>
          </n-card>
        </n-spin>
        <n-modal :class="{
          'w-100': genericsStore.device === 'mobile',
          'w-50': genericsStore.device === 'tablet',
          'w-25': genericsStore.device === 'desktop',
        }" preset="card" v-model:show="showPayments" title="Realizar venta" :mask-closable="false"
          closable @close="sale.payments = null">
          <n-space justify="space-between">
            <n-tag type="info">Total: S/. {{ showPayments ? sale.amount : null }}</n-tag>
            <n-tag :type="evalPayments ? 'error' : 'success'">Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}</n-tag>
            <n-tag :type="evalPayments ? 'error' : 'warning'">
              Faltante: S/. {{ showPayments ? parseFloat(sale.amount - currentPaymentsAmount).toFixed(2) : null }}
            </n-tag>
          </n-space>
          <n-form-item class="mt-2" label="Pagos">
            <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
              <template #default="{ value }">
                <div style="display: flex; align-items: center; width: 100%">
                  <n-select v-model:value="value.payment_method" :options="filteredMethods" :disabled="loading" />
                  <n-input class="ms-2" v-model:value="value.amount" placeholder="" :disabled="loading" @keypress="isDecimal($event)" />
                </div>
              </template>
            </n-dynamic-input>
          </n-form-item>
          <n-space justify="end">
            <n-button type="success" :disabled="evalPayments || sale.payments.some(p => p.payment_method === null) ||
              sale.payments.some(p => Number(p.amount) <= 0) || loading" secondary :loading="loading" @click="performCreateSale">
              Confirmar
            </n-button>
          </n-space>
        </n-modal>
        <separate-payments-modal v-model:show="showSeparateModal" :data="separatePayments"
          :on-close="closeSeparatePaymentsModal" @success="successSeparatePaymentsModal" />
        <preview-drawer ref="previewDrawer" v-model:show="showPdf" :data="pdfData" :previewOnly="!ticketPreview"
          @printed="$router.push({ name: 'TableHome' })" @canceled="$router.push({ name: 'TableHome' })" />
      </div>
    </n-scrollbar>
  </n-card>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, inject } from "vue";
import SeparatePaymentsModal from "./SeparatePaymentsModal";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import ClientSelectInput from "@/views/Customer/components/ClientSelectInput.vue";
import SaleSerieSelector from "@/views/Order/components/SaleSerieSelector.vue";
import PaymentTotals from "@/views/Order/components/PaymentTotals.vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useRoute, useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useProductStore } from "@/store/modules/product";
import { useSaleStore } from "@/store/modules/sale";
import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { saleRules } from "@/utils/constants";
import { cloneDeep, isDecimal } from "@/utils";
import { useDialog, useMessage } from "naive-ui";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import format from "date-fns/format";
import { lighten } from "@/utils";
import { useBusinessStore } from "@/store/modules/business";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
import { createSale, getSaleNumber, retrieveSale, sendSale } from "@/api/modules/sales";

export default defineComponent({
  name: "TablePayment",
  directives: { autowidth: VueInputAutowidth },
  components: { SeparatePaymentsModal, PreviewDrawer, ClientSelectInput, SaleSerieSelector, PaymentTotals },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const userStore = useUserStore();
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const businessStore = useBusinessStore();
    const message = useMessage();
    const dialog = useDialog();

    const customers = inject('customers', ref([]));
    const shouldShowCustomerMode = inject('shouldShowCustomerMode', ref(false));

    const loading = ref(false);
    const saleForm = ref();
    const ticketPreview = ref(settingsStore.businessSettings?.sale?.show_preview ?? true);
    const showObservations = ref(false);
    const addressesOptions = ref([]);
    const isMultiple = ref(false);
    const showPayments = ref(false);
    const separatePayments = ref({});
    const showSeparateModal = ref(false);
    const whatsappNumber = ref("");
    const showPdf = ref(false);
    const previewDrawer = ref(null);
    const pdfData = ref(null);

    const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices
      ? settingsStore.businessSettings.sale.default_invoice : 80;

    const defaultSerieId = saleStore.getFirstOption(defaultInvoiceType);

    const sale = ref({
      serie: defaultSerieId,
      number: "",
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss"),
      count: 0,
      amount: "0.00",
      given_amount: Number(0).toFixed(2),
      invoice_type: defaultInvoiceType,
      payment_method: 1,
      payment_condition: 1,
      customer_name: "",
      customer: null,
      address: null,
      discount: "0.00",
      icbper: 0,
      other_charges: "0.00",
      observations: "",
      by_consumption: false,
      sale_details: [],
      ask_for: "",
      payments: null,
      do_update: true,
      is_change: true,
      taxed_amount: 0,
      exempt_amount: 0,
      free_amount: 0,
      igv_amount: 0,
      total_igv: "0.00",
    });

    const totals = computed(() => {
      const toSale = saleStore.toSale;
      console.log(toSale);
      return {
        GRV: toSale.reduce(
          (acc, cur) =>
            cur.product_affectation === 10
              ? acc + parseFloat(cur.price_sale - cur.igv_tax) * cur.quantity
              : acc,
          0
        ),
        EXN: toSale.reduce(
          (acc, cur) =>
            cur.product_affectation === 20
              ? acc + parseFloat(cur.price_sale) * cur.quantity
              : acc,
          0
        ),
        GRT: toSale.reduce(
          (acc, cur) =>
            cur.product_affectation === 21
              ? acc + parseFloat(cur.price_sale) * cur.quantity
              : acc,
          0
        ),
        IGV: toSale.reduce((acc, cur) => acc + cur.igv_tax * cur.quantity, 0),
        DSCT: toSale.some((d) => Number(d.discount) > 0)
          ? toSale.reduce((acc, cur) => acc + Number(cur.discount), 0)
          : parseFloat(sale.value.discount),
      };
    });

    const totalGRV = computed(() => totals.value.GRV);
    const totalEXN = computed(() => totals.value.EXN);
    const totalGRT = computed(() => totals.value.GRT);
    const totalIGV = computed(() => totals.value.IGV);
    const totalDSCT = computed(() => totals.value.DSCT);

    const subTotal = computed(() =>
      saleStore.toSale.reduce(
        (acc, cur) =>
          cur.product_affectation === 21 ? acc : acc + cur.price_sale * cur.quantity,
        0
      )
    );

    const products_count = computed(() =>
      saleStore.toSale.reduce((acc, cur) => acc + cur.quantity, 0)
    );

    const total = computed(() => {
      let cal = parseFloat(subTotal.value - parseFloat(totalDSCT.value) + icbper.value + parseFloat(sale.value.other_charges));
      if (sale.value.delivery_info) {
        cal += parseFloat(sale.value.delivery_info.amount)
      };
      return cal.toFixed(2);
    });

    const icbper = computed(() =>
      orderStore.orderList.reduce(
        (acc, curVal) => acc + (curVal.icbper ? curVal.icbper_amount : 0),
        0
      )
    );

    const changing = computed(() =>
      sale.value.given_amount > total.value
        ? (sale.value.given_amount - total.value).toFixed(2)
        : 0.0
    );

    const paymentTotalsItems = computed(() => {
      return [
        { label: "SUBTOTAL", value: subTotal.value, editable: false },
        { label: "OP. GRAVADAS", value: totalGRV.value, editable: false },
        { label: "OP. EXONERADAS", value: totalEXN.value, editable: false, alwaysShow: false },
        { label: "OP. GRATUITAS", value: totalGRT.value, editable: false, alwaysShow: false },
        { label: "IGV", value: totalIGV.value, editable: false },
        { label: "ICBPER", value: icbper.value, editable: false, alwaysShow: false },
        {
          label: "DSCT",
          value: totalDSCT.value,
          editable: !settingsStore.business_settings.sale?.show_discount_label,
          field: "discount",
          disabled: saleStore.toSale.some(d => Number(d.discount) > 0)
        },
        {
          label: "OTROS",
          value: sale.value.other_charges || 0,
          editable: true,
          field: "other_charges",
          disabled: false
        }
      ];
    });

    watch(
      [
        total,
        icbper,
        totalGRV,
        totalEXN,
        totalGRT,
        totalIGV,
        totalDSCT,
        () => saleStore.toSale,
        () => orderStore.orderList.length,
      ],
      () => {
        const productCount = saleStore.toSale.reduce(
          (acc, curVal) => acc + curVal.quantity,
          0
        );
        Object.assign(sale.value, {
          count: productCount,
          amount: total.value,
          icbper: icbper.value,
          taxed_amount: totalGRV.value,
          exempt_amount: totalEXN.value,
          free_amount: totalGRT.value,
          igv_amount: totalIGV.value,
          total_igv: parseFloat(totalIGV.value || 0).toFixed(2),
        });

        if (sale.value.payment_condition === 1) {
          const newGivenAmount = total.value > 0 ? total.value : parseFloat(0).toFixed(2);
          if (sale.value.given_amount !== newGivenAmount) {
            sale.value.given_amount = newGivenAmount;
          }
        }
      }
    );

    const formRules = computed(() => {
      let rules = saleRules;
      rules.customer.required = !(sale.value.invoice_type !== 1 && sale.value.payment_condition === 1 && sale.value.given_amount <= 699);
      return rules;
    });

    const changeCondition = (v) => {
      sale.value.given_amount = v === 1 ? total.value : parseFloat('0').toFixed(2);
    };

    const changeSerie = (v) => {
      if (v === 1) {
        sale.value.customer_name = "";
        sale.value.customer = null;
        sale.value.address = null;
      }
      const newSerie = saleStore.getFirstOption(v);
      sale.value.serie = newSerie;
    };

    const handleSerieUpdate = (newSerie) => {
      if (!newSerie) {
        return;
      }
      sale.value.serie = newSerie;
    };

    const handleSerieChanged = () => {
      obtainSaleNumber();
    };

    // Handlers para PaymentTotals
    const handleValueChange = ({ field, value }) => {
      if (field === 'discount') {
        sale.value.discount = parseFloat(value) || 0;
      } else if (field === 'other_charges') {
        sale.value.other_charges = parseFloat(value) || 0;
      }
    };

    const handlePaymentChange = (value) => {
      sale.value.given_amount = parseFloat(value) || 0;
    };

    const performCreateSale = () => {
      saleForm.value.validate((errors) => {
        if (errors) {
          if (formRules.value.customer.required) {
            const msg = sale.value.invoice_type === 1
              ? "Debes agregar un cliente cuando la venta es con factura"
              : "Debes agregar un cliente porque la venta es mayor a S/ 699";
            message.warning(msg);
          }
          message.error("Datos Incorrectos");
          return;
        }

        dialog.success({
          closable: false,
          title: "Venta",
          content: "Realizar venta?",
          positiveText: "Sí",
          onPositiveClick: async () => {
            loading.value = true;
            sale.value.order = orderStore.orderId;
            sale.value.sale_details = saleStore.toSale.map(detail => ({
              ...detail,
              igv_tax: detail.igv_tax.toFixed(2),
              price_base: detail.price_base.toFixed(2)
            }));
            sale.value.discount = totalDSCT.value;

            try {
              const response = await createSale(sale.value);
              if (response.status === 201) {
                const res = await retrieveSale(response.data?.id);
                pdfData.value = res.data;
                pdfData.value.original_sale_details = sale.value.sale_details;

                if (settingsStore.business_settings.printer.print_html) {
                  showPdf.value = true;
                  if (!ticketPreview.value) {
                    setTimeout(() => previewDrawer.value.generate(), 250);
                  }
                } else {
                  await VoucherPrint({
                    data: res.data,
                    businessStore,
                    saleStore,
                    changing: changing.value,
                    show: true
                  });
                  await router.push({ name: "TableHome" });
                }

                if (settingsStore.businessSettings.sale.auto_send && response.data?.['invoiceType'] !== "80") {
                  try {
                    const sendResponse = await sendSale(response.data.id);
                    if (sendResponse.status === 200) message.success("Enviado!");
                  } catch (error) {
                    console.error(error);
                    message.error("Algo salió mal...");
                  }
                }
                message.success("Venta realizada correctamente!");
              }
            } catch (error) {
              console.error(error);
              message.error("Algo salió mal...");
            } finally {
              loading.value = false;
            }
          }
        });
      });
    };

    const obtainSaleNumber = async () => {
      if (!sale.value.serie) {
        return;
      }
      loading.value = true;
      try {
        const response = await getSaleNumber(sale.value.serie);
        if (response.status === 200) {
          const newNumber = Number(response.data.number) + 1;
          sale.value.number = newNumber;
        }
      } catch (error) {
        message.error("Algo salió mal...");
      } finally {
        loading.value = false;
      }
    };

    const createAddressesOptions = (customer) => {
      whatsappNumber.value = customer?.phone || "";
      if (customer) {
        addressesOptions.value = customer.addresses.map(address => ({
          value: address.id,
          label: `${address.ubigeo} - ${address.description}`,
        }));
        if (addressesOptions.value.length) {
          sale.value.address = addressesOptions.value[0].value;
        }
      }
    };

    const handleCustomerSelected = (customer) => {
      createAddressesOptions(customer);
    };

    const handleCustomerCleared = () => {
      sale.value.address = null;
      whatsappNumber.value = '';
      addressesOptions.value = [];
    };

    const createPayment = () => ({ payment_method: null, amount: "0" });

    const doMultiplePayment = () => {
      sale.value.payments = [{ payment_method: sale.value.payment_method, amount: String(sale.value.amount) }];
      showPayments.value = true;
    };

    const filteredMethods = computed(() => saleStore.getPaymentMethodsOptions.map(option => ({
      ...option,
      disabled: sale.value.payments?.some(pay => pay.payment_method === option.value) || false,
    })));

    const evalPayments = computed(() => {
      if (!sale.value.payments?.length) return true;
      const totalAmount = Number(sale.value.amount);
      const totalPayments = sale.value.payments.reduce((acc, payment) => {
        const amount = parseFloat(payment.amount || '0');
        return Math.round((acc + amount) * 100) / 100;
      }, 0);
      return totalPayments !== totalAmount;
    });

    const currentPaymentsAmount = computed(() => {
      if (!sale.value.payments) return "0.00";
      const sum = sale.value.payments.reduce((acc, val) => acc + parseFloat(val.amount), 0);
      return isNaN(sum) ? "0.00" : sum.toFixed(2);
    });

    const openSeparatePaymentsModal = () => {
      separatePayments.value = cloneDeep(sale.value);
      separatePayments.value.order = cloneDeep(orderStore.orderId);
      separatePayments.value.sale_details = cloneDeep(saleStore.toSale);
      separatePayments.value.sale_details.forEach(detail => detail.max = detail.quantity);
      showSeparateModal.value = true;
    };

    const getAfcColor = (afc) => {
      const colors = {
        10: { color: lighten("#008B8B", 48), textColor: "#008B8B", borderColor: lighten("#008B8B", 24) },
        20: { color: lighten("#9932CC", 48), textColor: "#9932CC", borderColor: lighten("#9932CC", 24) },
        21: { color: lighten("#006400", 48), textColor: "#006400", borderColor: lighten("#006400", 24) }
      };
      return colors[afc] || { color: lighten("#8B0000", 48), textColor: "#8B0000", borderColor: lighten("#8B0000", 24) };
    };

    const getAfcShort = (afc) => ({ 10: "GRV", 20: "EXN", 21: "GRT" }[afc] || "---");

    const disablePastDates = (timestamp) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return timestamp < todayStart;
    };

    function disablePastTimes(ts) {
      const now = new Date();
      const selected = new Date(ts);

      const isToday =
        selected.getFullYear() === now.getFullYear() &&
        selected.getMonth() === now.getMonth() &&
        selected.getDate() === now.getDate();

      if (!isToday) {
        return {};
      }

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();

      return {
        isHourDisabled: (hour) => hour < currentHour,
        isMinuteDisabled: (minute, hour) => {
          if (hour === currentHour) return minute < currentMinute;
          return false;
        },
        isSecondDisabled: (second, minute, hour) => {
          if (hour === currentHour && minute === currentMinute) {
            return second < currentSecond;
          }
          return false;
        }
      };
    }

    watch(total, () => {
      sale.value.given_amount = total.value > 0 ? total.value : parseFloat("0").toFixed(2);
    });

    // Watcher específico para sale.serie solamente
    watch(() => sale.value.serie, (newSerie, oldSerie) => {
      if (newSerie && newSerie !== oldSerie) {
        obtainSaleNumber();
      }
    });

    // Watcher para cuando el store se hidrate y tengamos series disponibles
    watch(() => saleStore.series, (newSeries) => {
      if (newSeries.length > 0 && !sale.value.serie) {
        const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices
          ? settingsStore.businessSettings.sale.default_invoice : 80;
        const newSerie = saleStore.getFirstOption(defaultInvoiceType);
        if (newSerie) {
          sale.value.serie = newSerie;
        }
      }
    }, { immediate: true });

    onMounted(async () => {
      sale.value.given_amount = total.value;
      if (sale.value.serie) {
        await obtainSaleNumber();
      }
    });

    return {
      customers, shouldShowCustomerMode,
      userStore, saleStore, orderStore, productStore, settingsStore, sale, isDecimal,
      loading, saleForm, formRules, handleCustomerSelected, handleCustomerCleared,
      changing, subTotal, changeCondition, changeSerie, handleSerieUpdate, handleSerieChanged,
      showObservations, performCreateSale,
      addressesOptions, createAddressesOptions, genericsStore,
      icbper, isMultiple, showPayments, createPayment, doMultiplePayment, filteredMethods,
      evalPayments, currentPaymentsAmount, openSeparatePaymentsModal,
      closeSeparatePaymentsModal: () => {}, successSeparatePaymentsModal: obtainSaleNumber,
      separatePayments, showSeparateModal, getAfcShort, getAfcColor, totalIGV, totalGRV,
      totalEXN, totalGRT, totalDSCT, whatsappNumber, ticketPreview, previewDrawer, showPdf,
      pdfData, paymentTotalsItems, handleValueChange, handlePaymentChange, disablePastDates,
      disablePastTimes
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
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
  appearance: textfield;
  -moz-appearance: textfield;
}

@media (max-width: 768px) {
  .payment-section .payment-inputs {
    justify-content: flex-start !important;
    flex-direction: column;
  }
  .payment-section .totals {
    align-items: flex-start !important;
  }
}
</style>
