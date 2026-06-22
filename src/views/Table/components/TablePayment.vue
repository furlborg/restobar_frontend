<template>
  <n-card :bordered="false" class="h-100" content-class="p-0 overflow-auto">
    <n-scrollbar>
      <div id="TablePayment">
        <n-spin :show="loading">
          <n-card :bordered="false" content-class="p-0">
            <n-space class="mb-2" align="center" justify="space-between">
              <SaleSerieSelector :sale="sale" :invoice-type="sale.invoice_type" @update:serie="handleSerieUpdate"
                @serie-changed="handleSerieChanged" />
              <n-radio-group v-model:value="sale.invoice_type" name="docType" size="small" @update:value="changeSerie">
                <n-radio-button :disabled="!settingsStore.businessSettings.sale?.enable_invoices"
                  :value="1">FACTURA</n-radio-button>
                <n-radio-button :disabled="!settingsStore.businessSettings.sale?.enable_invoices"
                  :value="3">BOLETA</n-radio-button>
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
                <n-form-item-gi :span="9" label="Cliente" :show-require-mark="formRules.customer.required"
                  path="customer">
                  <ClientSelectInput v-model:customer-name="sale.customer_name" v-model:customer-id="sale.customer"
                    :invoice-type="sale.invoice_type" @customer-selected="handleCustomerSelected"
                    @customer-cleared="handleCustomerCleared" />
                </n-form-item-gi>
                <n-form-item-gi :span="3" label="Fecha">
                  <n-date-picker class="w-100" type="datetime" :is-date-disabled="ts => ts > new Date()" disabled
                    v-model:formatted-value="sale.date_sale" />
                </n-form-item-gi>
                <n-form-item-gi v-if="isCredit" :span="3" label="Fecha de vencimiento" path="expiration_sale">
                  <n-date-picker class="w-100" type="date" format="dd/MM/yyyy" value-format="dd/MM/yyyy"
                    :is-date-disabled="isExpirationDateDisabled" v-model:formatted-value="sale.expiration_sale" />
                </n-form-item-gi>
                <n-form-item-gi :span="5" label="Dirección">
                  <n-select v-model:value="sale.address" :options="addressesOptions" :disabled="!sale.customer"
                    placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="3" label="Método Pago">
                  <n-select v-model:value="sale.payment_method" :options="saleStore.getPaymentMethodsOptions"
                    filterable />
                </n-form-item-gi>
                <n-form-item-gi :span="2">
                  <n-checkbox v-model:checked="sale.by_consumption" :disabled="sale.payment_condition === 2">Por
                    consumo</n-checkbox>
                </n-form-item-gi>
                <n-form-item-gi :span="2">
                  <n-button type="info" text @click="showObservations = !showObservations">
                    {{ showObservations ? "Ocultar" : "Ver" }} Observaciones
                  </n-button>
                </n-form-item-gi>
                <n-gi :span="12">
                  <n-collapse-transition :show="showObservations">
                    <n-form-item label="Observaciones">
                      <n-input type="textarea" v-model:value="sale.observations" />
                    </n-form-item>
                  </n-collapse-transition>
                </n-gi>
              </n-grid>
            </n-form>
            <ProductTable :sale="sale" :sale-details="saleStore.toSale" :sale-menu-sets="saleStore.salePayload.sale_product_sets" @update-detail="saleStore.updateDetail" />

            <PaymentTotals :items="paymentTotalsItems" :total-amount="sale.amount" :payment-amount="sale.given_amount"
              :change-amount="changing" :payment-max="sale.payment_condition === 2 ? sale.amount - 0.1 : null"
              @value-changed="handleValueChange" @payment-changed="handlePaymentChange" />
            <n-space v-if="sale.payment_condition === 1" justify="space-between" class="mt-2">
              <n-checkbox v-model:checked="isMultiple">Pago multiple</n-checkbox>
              <n-button type="info" text @click="openSeparatePaymentsModal">Nueva cuenta</n-button>
            </n-space>
            <n-divider />
            <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
              <n-gi class="d-flex align-items-center" :span="3">
                <n-checkbox v-model:checked="ticketPreview">Previsualizar ticket</n-checkbox>
              </n-gi>
            </n-grid>
            <n-button class="fs-1 py-5 mt-2" type="success" :disabled="!hasItems ||
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
        }" preset="card" v-model:show="showPayments" title="Realizar venta" :mask-closable="false" closable
          @close="sale.payments = null">
          <n-space justify="space-between">
            <n-tag type="info">Total: S/. {{ showPayments ? sale.amount : null }}</n-tag>
            <n-tag :type="evalPayments ? 'error' : 'success'">Monto: S/. {{ showPayments ? currentPaymentsAmount : null
            }}</n-tag>
            <n-tag :type="evalPayments ? 'error' : 'warning'">
              Faltante: S/. {{ showPayments ? parseFloat(sale.amount - currentPaymentsAmount).toFixed(2) : null }}
            </n-tag>
          </n-space>
          <n-form-item class="mt-2" label="Pagos">
            <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
              <template #default="{ value }">
                <div style="display: flex; align-items: center; width: 100%">
                  <n-select v-model:value="value.payment_method" :options="filteredMethods" :disabled="loading" />
                  <n-input class="ms-2" v-model:value="value.amount" placeholder="" :disabled="loading"
                    @keypress="isDecimal($event)" />
                </div>
              </template>
            </n-dynamic-input>
          </n-form-item>
          <n-space justify="end">
            <n-button type="success" :disabled="evalPayments || sale.payments.some(p => p.payment_method === null) ||
              sale.payments.some(p => Number(p.amount) <= 0) || loading" secondary :loading="loading"
              @click="performCreateSale">
              Confirmar
            </n-button>
          </n-space>
        </n-modal>
        <separate-payments-modal v-model:show="showSeparateModal" :data="separatePayments"
          @success="obtainSaleNumber" />
        <PreviewDrawer ref="previewDrawer" v-model:show="showPdf" :data="pdfData" :previewOnly="!ticketPreview"
          @printed="$router.push({ name: 'TableHome' })" @canceled="$router.push({ name: 'TableHome' })" />
      </div>
    </n-scrollbar>
  </n-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SeparatePaymentsModal from "./SeparatePaymentsModal";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import ClientSelectInput from "@/views/Customer/components/ClientSelectInput.vue";
import SaleSerieSelector from "@/views/Order/components/SaleSerieSelector.vue";
import PaymentTotals from "@/views/Order/components/PaymentTotals.vue";
import ProductTable from "@/views/Order/components/ProductTable.vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useGenericsStore } from "@/store/modules/generics";
import { saleRules } from "@/utils/constants";
import { cloneDeep, isDecimal } from "@/utils";
import { useDialog, useMessage } from "naive-ui";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfDay from "date-fns/startOfDay";
import { useBusinessStore } from "@/store/modules/business";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
import { createSale, getSaleNumber, retrieveSale, sendSale } from "@/api/modules/sales";
import { useSaleTotals } from "@/composables/useSaleTotals";


const router = useRouter();
const orderStore = useOrderStore();
const saleStore = useSaleStore();
const settingsStore = useSettingsStore();
const genericsStore = useGenericsStore();
const businessStore = useBusinessStore();
const message = useMessage();
const dialog = useDialog();

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
  expiration_sale: null,
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

const { taxBreakdown, productTotal, menuTotal, hasItems } = useSaleTotals();

const totalGRV = computed(() => taxBreakdown.value.taxed);
const totalEXN = computed(() => taxBreakdown.value.exempt);
const totalGRT = computed(() => taxBreakdown.value.free);
const totalIGV = computed(() => taxBreakdown.value.igv);
const totalDSCT = computed(() => saleStore.toSale.some((d) => Number(d.discount) > 0)
  ? saleStore.toSale.reduce((acc, cur) => acc + Number(cur.discount), 0)
  : parseFloat(sale.value.discount)
);

const subTotal = computed(() => productTotal.value + menuTotal.value - taxBreakdown.value.free);

// const products_count = computed(() =>
//   saleStore.toSale.reduce((acc, cur) => acc + cur.quantity, 0)
// );

const total = computed(() => {
  let cal = parseFloat(
    subTotal.value - parseFloat(totalDSCT.value) + icbper.value + parseFloat(sale.value.other_charges)
  );
  if (sale.value.delivery_info) {
    cal += parseFloat(sale.value.delivery_info.amount);
  }
  return cal.toFixed(2);
});

const icbper = computed(() => taxBreakdown.value.icbper);

const otherCharges = computed(() => {
  const parsed = parseFloat(sale.value.other_charges);
  return Number.isFinite(parsed) ? parsed : 0;
});

const discountBaseAmount = computed(
  () => subTotal.value + icbper.value + otherCharges.value
);

const discountInputMax = computed(() => {
  if (discountBaseAmount.value <= 0) {
    return 0;
  }
  const capped = discountBaseAmount.value - 0.01;
  return Math.max(Math.round(capped * 100) / 100, 0);
});

const discountValidationThreshold = computed(
  () => Math.round(discountBaseAmount.value * 100) / 100
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
      step: 0.5,
      disabled: saleStore.toSale.some(d => Number(d.discount) > 0),
      max: discountInputMax.value
    },
    {
      label: "OTROS",
      value: sale.value.other_charges || 0,
      editable: true,
      field: "other_charges",
      step: 0.5,
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
  },
  { immediate: true, deep: true }
);

watch(
  () => sale.value.payment_condition,
  (condition) => {
    if (Number(condition) !== 2) {
      sale.value.expiration_sale = null;
    }
  }
);

const expirationMinDate = computed(() => {
  const saleDate = sale.value.date_sale;
  if (!saleDate) {
    return null;
  }
  try {
    const parsedDate = parse(saleDate, "dd/MM/yyyy HH:mm:ss", new Date());
    return startOfDay(parsedDate).getTime();
  } catch {
    return null;
  }
});

const isExpirationDateDisabled = (ts) => {
  const limit = expirationMinDate.value;
  if (limit === null) {
    return false;
  }
  return ts <= limit;
};

const isCredit = computed(() => Number(sale.value.payment_condition) === 2);

const formRules = computed(() => {
  const rules = {
    customer: {
      ...saleRules.customer,
      required: !(
        sale.value.invoice_type !== 1 &&
        sale.value.payment_condition === 1 &&
        sale.value.given_amount <= 699
      ),
    },
  };
  if (isCredit.value) {
    rules.expiration_sale = {
      validator(rule, value) {
        if (!value) {
          return new Error("Debe ingresar la fecha de vencimiento para ventas al credito.");
        }
        return true;
      },
      trigger: ["blur", "change"],
    };
  }
  return rules;
});

const changeCondition = (v) => {
  sale.value.given_amount = v === 1 ? total.value : parseFloat("0").toFixed(2);
  if (v !== 2) {
    sale.value.expiration_sale = null;
  }
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

    const currentDiscount = Math.round((parseFloat(totalDSCT.value) || 0) * 100) / 100;
    const maxAllowedDiscount = discountValidationThreshold.value;
    if (maxAllowedDiscount > 0 && currentDiscount >= maxAllowedDiscount) {
      message.warning("El descuento no puede ser 100%. Debe cambiar a operacion gratuita.");
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
        // Use buildSalePayload to get both arrays
        const payload = saleStore.buildSalePayload();
        sale.value.sale_product_sets = payload.sale_product_sets;
        sale.value.discount = totalDSCT.value;

        try {
          const response = await createSale(sale.value);
          if (response.status === 201) {
            const res = await retrieveSale(response.data?.id);
            pdfData.value = res.data;
            pdfData.value.original_sale_details = sale.value.sale_details;
            if (sale.value.payments?.length) {
              pdfData.value.payments = normalizePaymentsForTicket(sale.value.payments);
            }

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

            if (settingsStore.businessSettings.sale.auto_send && String(sale.value.invoice_type) !== "80") {
              try {
                const sendResponse = await sendSale(response.data.id);
                if (sendResponse.status === 200) message.success("Enviado!");
              } catch (error) {
                console.error(error);
              }
            }
            message.success("Venta realizada correctamente!");
          }
        } catch (error) {
          console.error(error);
        } finally {
          loading.value = false;
        }
      }
    });
  }).catch(() => {});
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
    console.log(error);
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

const createPayment = () => {
  const currentTotal = sale.value.payments ? sale.value.payments.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0) : 0;
  const remaining = Math.max(0, parseFloat(sale.value.amount) - currentTotal);
  return { payment_method: null, amount: remaining > 0 ? remaining.toFixed(2) : "0" };
};

const doMultiplePayment = () => {
  sale.value.payments = [{ payment_method: sale.value.payment_method, amount: String(sale.value.amount) }];
  showPayments.value = true;
};

const filteredMethods = computed(() => saleStore.getPaymentMethodsOptions.map(option => ({
  ...option,
  disabled: sale.value.payments?.some(pay => pay.payment_method === option.value) || false,
})));

const normalizePaymentAmount = (value) => {
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
};

const evalPayments = computed(() => {
  if (!sale.value.payments?.length) return true;
  const totalAmount = Number(sale.value.amount);
  const totalPayments = sale.value.payments.reduce((acc, payment) => {
    const amount = normalizePaymentAmount(payment.amount);
    return Math.round((acc + amount) * 100) / 100;
  }, 0);
  return totalPayments !== totalAmount;
});

const currentPaymentsAmount = computed(() => {
  if (!sale.value.payments) return "0.00";
  const sum = sale.value.payments.reduce((acc, val) => acc + normalizePaymentAmount(val.amount), 0);
  return Number.isFinite(sum) ? sum.toFixed(2) : "0.00";
});

const normalizePaymentsForTicket = (payments = []) =>
  payments.map(payment => ({
    payment_method: saleStore.getPaymentMethodDescription(payment.payment_method) || payment.payment_method,
    description: saleStore.getPaymentMethodDescription(payment.payment_method) || payment.payment_method,
    amount: normalizePaymentAmount(payment.amount),
  }));

const openSeparatePaymentsModal = () => {
  separatePayments.value = cloneDeep(sale.value);
  separatePayments.value.order = cloneDeep(orderStore.orderId);
  separatePayments.value.sale_details = cloneDeep(saleStore.toSale);
  const payload = saleStore.buildSalePayload();
  separatePayments.value.product_sets = cloneDeep(payload.sale_product_sets);
  separatePayments.value.sale_details.forEach(detail => detail.max = detail.quantity);
  if (separatePayments.value.product_sets) {
    separatePayments.value.product_sets.forEach(set => set.max = set.quantity);
  }
  showSeparateModal.value = true;
};

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
  if (sale.value.serie) {
    await obtainSaleNumber();
  }
});

//     return {
//       userStore, saleStore, orderStore, settingsStore, sale,
//       loading, saleForm, formRules, handleCustomerSelected, handleCustomerCleared,
//       changing, subTotal, changeCondition, changeSerie, handleSerieUpdate, handleSerieChanged,
//       showObservations, performCreateSale,
//       addressesOptions, createAddressesOptions, genericsStore,
//       icbper, isMultiple, showPayments, createPayment, doMultiplePayment, filteredMethods,
//       evalPayments, currentPaymentsAmount, openSeparatePaymentsModal,
//       closeSeparatePaymentsModal: () => { }, successSeparatePaymentsModal: obtainSaleNumber,
//       separatePayments, showSeparateModal, totalIGV, totalGRV,
//       totalEXN, totalGRT, totalDSCT, whatsappNumber, ticketPreview, previewDrawer, showPdf,
//       pdfData, paymentTotalsItems, handleValueChange, handlePaymentChange, isCredit, isExpirationDateDisabled,
//     };
//   },
// });
</script>
