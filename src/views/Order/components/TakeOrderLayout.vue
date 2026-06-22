<template>
  <div id="TakeOrderLayout">
    <n-page-header class="mb-2" @back="$router.push({ name: 'TableHome' })">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">Realizar Pedido</n-text>
        </n-space>
      </template>
    </n-page-header>
    <n-card class="d-none d-lg-flex">
      <n-grid responsive="screen" cols="1 xs:1 s:1 m:5 l:5 xl:5 2xl:5" :x-gap="12">
        <n-gi :span="3">
          <transition v-if="ui.selectProducts" name="mode-fade" mode="out-in">
            <OrderTaking :loading="ui.loading" :sale="sale" :show-observations="ui.showObservations"
              :addresses-options="addressesOptions" :customer-options="customerOptions"
              :searching-customer="searchingCustomer" :whatsapp-number="whatsappNumber" :changing="changing"
              :sub-total="subTotal" :total-grv="totalGRV" :total-exn="totalEXN" :total-grt="totalGRT"
              :total-igv="totalIGV" :icbper="icbper" :total-dsct="totalDSCT" :is-multiple="ui.isMultiple"
              :ticket-preview="ui.isTicketPreview" @update:sale="(newSale) => Object.assign(sale, newSale)"
              @update:show-observations="ui.showObservations = $event" @update:is-multiple="ui.isMultiple = $event"
              @update:ticket-preview="ui.isTicketPreview = $event" @select-serie="selectSerie" @change-serie="changeSerie"
              @change-condition="changeCondition" @auto-create-customer="autoCreateCustomer"
              @create-addresses-options="createAddressesOptions" @change-address="changeAddress"
              @handle-delivery="handleDelivery" @show-customer-modal="ui.showCustomerModal = true"
              @perform-take-away="performTakeAway" @do-multiple-payment="doMultiplePayment" />
          </transition>
          <div v-else>
            <router-view v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
          </div>
        </n-gi>
        <n-gi span="2">
          <PaymentSummary :select-products="ui.selectProducts" :product-search="ui.productSearch"
            :show-modal="ui.showModal" :item-index="ui.itemIndex" :total-amount="sale.amount"
            :discount="totalDSCT" :other-charges="sale.other_charges"
            @update:select-products="ui.selectProducts = $event"
            @update:product-search="ui.productSearch = $event" @update:show-modal="ui.showModal = $event"
            @update:item-index="ui.itemIndex = $event" />
        </n-gi>
      </n-grid>
    </n-card>
    <n-tabs class="d-lg-none" tab-style="background: #fff;" v-model:value="ui.activeTab" type="segment" animated>
      <n-tab-pane name="main" tab="Tomar pedido">
        <n-card>
          <transition name="mode-fade" mode="out-in">
            <OrderTaking v-if="ui.selectProducts" :loading="ui.loading" :sale="sale"
              :show-observations="ui.showObservations" :addresses-options="addressesOptions"
              :customer-options="customerOptions" :searching-customer="searchingCustomer"
              :whatsapp-number="whatsappNumber" :changing="changing" :sub-total="subTotal" :total-grv="totalGRV"
              :total-exn="totalEXN" :total-grt="totalGRT" :total-igv="totalIGV" :icbper="icbper" :total-dsct="totalDSCT"
              :is-multiple="ui.isMultiple" :ticket-preview="ui.isTicketPreview"
              @update:sale="(newSale) => Object.assign(sale, newSale)"
              @update:show-observations="ui.showObservations = $event" @update:is-multiple="ui.isMultiple = $event"
              @update:ticket-preview="ui.isTicketPreview = $event" @select-serie="selectSerie" @change-serie="changeSerie"
              @change-condition="changeCondition" @show-customer-options="showCustomerOptions"
              @auto-create-customer="autoCreateCustomer" @create-addresses-options="createAddressesOptions"
              @change-address="changeAddress" @handle-delivery="handleDelivery"
              @show-customer-modal="ui.showCustomerModal = true" @perform-take-away="performTakeAway"
              @do-multiple-payment="doMultiplePayment" @goToFirstTab="goToFirstTab" />
            <CategoriesList v-else />
          </transition>
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="payment" tab="Resumen">
        <PaymentSummary :select-products="ui.selectProducts" :product-search="ui.productSearch"
          :show-modal="ui.showModal" :item-index="ui.itemIndex" :total-amount="sale.amount"
          :discount="totalDSCT" :other-charges="sale.other_charges"
          @update:select-products="
            (value) => {
              ui.selectProducts = value;
              goToFirstTab();
            }
          " @update:product-search="ui.productSearch = $event" @update:show-modal="ui.showModal = $event"
          @update:item-index="ui.itemIndex = $event" @go-to-first-tab="goToFirstTab" />
      </n-tab-pane>
    </n-tabs>
    <n-modal :class="getModalClass" preset="card" v-model:show="ui.showConfirm" title="Registrar pedido"
      :mask-closable="false" closable>
      <n-form-item label="Ingrese código de usuario">
        <n-input type="password" v-model:value="ui.userConfirm" placeholder="" />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button type="success" :loading="ui.loading" :disabled="!ui.userConfirm || ui.loading" secondary
            @click.prevent="performCreateOrder">
            Confirmar
          </n-button>
        </n-space>
      </template>
    </n-modal>
    <n-modal :class="getModalClass" preset="card" v-model:show="ui.showPayments" title="Realizar venta"
      :mask-closable="false" closable @close="sale.payments = null">
      <n-space justify="space-between">
        <n-tag type="info">Total: S/. {{ ui.showPayments ? sale.amount : null }}</n-tag>
        <n-tag :type="evalPayments ? 'error' : 'success'">
          Monto: S/. {{ ui.showPayments ? currentPaymentsAmount : null }}
        </n-tag>
        <n-tag :type="evalPayments ? 'error' : 'warning'">Faltante: S/.
          {{
            ui.showPayments
              ? (parseFloat(sale.amount) - currentPaymentsAmount).toFixed(2)
              : null
          }}</n-tag>
      </n-space>
      <n-form-item class="mt-2" label="Pagos">
        <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
          <template #default="{ value }">
            <div style="display: flex; align-items: center; width: 100%">
              <n-select v-model:value="value.payment_method" :disabled="ui.loading" :options="filteredMethods" />
              <n-input class="ms-2" v-model:value="value.amount" placeholder="" :disabled="ui.loading" @keypress="isDecimal($event)" />
            </div>
          </template>
        </n-dynamic-input>
      </n-form-item>
      <n-space justify="end">
        <n-button type="success" :disabled="evalPayments ||
          sale.payments?.some((p) => p.payment_method === null) ||
          sale.payments?.some((p) => Number(p.amount) <= 0) ||
          ui.loading
          " :loading="ui.loading" secondary @click="performTakeAway">
          Confirmar
        </n-button>
      </n-space>
    </n-modal>

    <OrderIndications v-model:show="ui.showModal" preset="card" title="Indicaciones"
      :order="orderStore.orderList[ui.itemIndex]" @success="ui.showModal = false" />
    <customer-modal v-model:show="ui.showCustomerModal" :id-customer="sale.customer" :document="customerDocument"
      :doc_type="sale.invoice_type === 1 ? '6' : null" @update:show="onCloseModal" @on-success="onSuccess" />
    <TicketPreview :ref="(el) => ui.ticketPreviewRef = el" v-model:show="ui.showPdf" :data="pdfData" :hidden="true" :isUpdate="false" />
    <PreviewDrawer :ref="(el) => ui.voucherDrawer = el" v-model:show="ui.showVoucher" :data="voucherData"
      :previewOnly="!ui.isTicketPreview" @printed="() => $router.push({ name: 'TableHome' })"
      @canceled="() => $router.push({ name: 'TableHome' })" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, reactive, defineAsyncComponent } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { getSaleNumber } from "@/api/modules/sales";
import { searchCustomerByName, searchRucCustomer } from "@/api/modules/customer";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useSettingsStore } from "@/store/modules/settings";
import { useGenericsStore } from "@/store/modules/generics";
import { useUserStore } from "@/store/modules/user";
import { useSaleTotals } from "@/composables/useSaleTotals";
import { useOrderProcessing } from "@/composables/useOrderProcessing";
import OrderTaking from "./OrderTaking.vue";
import PaymentSummary from "./PaymentSummary.vue";
import CategoriesList from "./CategoriesList.vue";
const OrderIndications = defineAsyncComponent(() => import("./OrderIndications.vue"));
const CustomerModal = defineAsyncComponent(() => import("@/views/Customer/components/CustomerModal.vue"));
const TicketPreview = defineAsyncComponent(() => import("@/views/Order/components/TicketPreview.vue"));
const PreviewDrawer = defineAsyncComponent(() => import("@/views/Sale/components/PreviewDrawer.vue"));
import format from "date-fns/format";
import { isDecimal } from "@/utils";
const orderStore = useOrderStore();
const message = useMessage();
const dialog = useDialog();
const genericsStore = useGenericsStore();
const saleStore = useSaleStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { grandTotal, taxBreakdown, summary, menuTotal } = useSaleTotals();
const { processTakeAwayOrder, processCreateOrder } = useOrderProcessing();

// Estado UI agrupado en objeto reactivo para mejor organización
const ui = reactive({
  loading: false,
  selectProducts: false,
  showObservations: false,
  isMultiple: false,
  isTicketPreview: settingsStore.businessSettings?.sale?.show_preview ?? true,
  activeTab: "main",
  showModal: false,
  showConfirm: false,
  showPayments: false,
  showCustomerModal: false,
  showPdf: false,
  showVoucher: false,
  ticketPreviewRef: null,
  voucherDrawer: null,
  itemIndex: null,
  userConfirm: "",
  productSearch: "",
});

const pdfData = ref(null);
const voucherData = ref(null);
const addressesOptions = ref([]);
const customerOptions = ref([]);
const customerResults = ref([]);
const searchingCustomer = ref(false);
const whatsappNumber = ref("");
const customerDocument = ref("");

// Usar el composable para obtener los totales correctos incluyendo menús
const subTotal = computed(() => summary.value.subtotal);
const icbper = computed(() => taxBreakdown.value.icbper);
const totalGRV = computed(() => taxBreakdown.value.taxed);
const totalEXN = computed(() => taxBreakdown.value.exempt + menuTotal.value);
const totalGRT = computed(() => taxBreakdown.value.free);
const totalIGV = computed(() => taxBreakdown.value.igv);

const totalDSCT = computed(() =>
  saleStore.toSale.some(detail => Number(detail.discount) > 0)
    ? saleStore.toSale.reduce((acc, curVal) => acc + Number(curVal.discount), 0)
    : Number(sale.value.discount));

const changing = computed(() =>
  sale.value.given_amount > grandTotal.value ? (sale.value.given_amount - grandTotal.value).toFixed(2) : 0.0);

const saleItemQuantity = computed(() =>
  saleStore.toSale.reduce((acc, curVal) => acc + curVal.quantity, 0)
);

const menuItemQuantity = computed(() =>
  (saleStore.salePayload.sale_product_sets || []).reduce((acc, curVal) => acc + curVal.quantity, 0)
);

const saleItemCount = computed(() => saleItemQuantity.value + menuItemQuantity.value);

const getModalClass = computed(() => ({
  "w-100": genericsStore.device === "mobile",
  "w-50": genericsStore.device === "tablet",
  "w-25": genericsStore.device === "desktop",
}));

const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices
  ? settingsStore.businessSettings.sale?.default_invoice
  : 80;
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
  delivery_info: !(route.query.delivery === undefined) && route.query.delivery === "true"
    ? { person: "", address: "", phone: "", deliveryman: "", amount: parseFloat(0).toFixed(2) }
    : null,
  payments: null,
  do_update: true,
  is_change: true,
  taxed_amount: 0,
  exempt_amount: 0,
  free_amount: 0,
  igv_amount: 0,
  total_igv: "0.00",
});

// Sincroniza los totales del objeto sale con los cálculos de useSaleTotals
const syncSaleTotals = () => {
  const dsct = parseFloat(totalDSCT.value) || 0;
  const others = parseFloat(sale.value.other_charges) || 0;
  const calculatedAmount = Math.max(0, grandTotal.value + others - dsct);

  Object.assign(sale.value, {
    amount: calculatedAmount.toFixed(2),
    icbper: icbper.value,
    taxed_amount: totalGRV.value,
    exempt_amount: totalEXN.value,
    free_amount: totalGRT.value,
    igv_amount: totalIGV.value,
    total_igv: parseFloat(totalIGV.value || 0).toFixed(2),
  });
};

watch([grandTotal, icbper, totalGRV, totalEXN, totalGRT, totalIGV, totalDSCT, () => sale.value.other_charges], syncSaleTotals, {
  immediate: true,
});

// Sincroniza la cantidad total de líneas de pedido y menús
watch(saleItemCount, (count) => {
  sale.value.count = count;
}, {
  immediate: true,
});

// Ajusta el monto entregado cuando el cliente elige contado
watch([
  () => sale.value.payment_condition,
  () => sale.value.amount,
], ([paymentCondition, total]) => {
  if (paymentCondition === 1) {
    const parsedTotal = parseFloat(total);
    const newGivenAmount = parsedTotal > 0 ? parsedTotal.toFixed(2) : parseFloat(0).toFixed(2);
    if (sale.value.given_amount !== newGivenAmount) {
      sale.value.given_amount = newGivenAmount;
    }
  }
}, {
  immediate: true,
});

const obtainSaleNumber = async () => {
  if (!sale.value.serie) return;
  ui.loading = true;
  try {
    const response = await getSaleNumber(sale.value.serie);
    if (response.status === 200) {
      sale.value.number = Number(response.data.number) + 1;
    } else {
      message.warning("No se pudo obtener el número de venta");
    }
  } catch (error) {
    message.error("Algo salió mal al obtener el número de venta");
  } finally {
    ui.loading = false;
  }
};

watch(
  () => sale.value.serie,
  async (newValue) => {
    if (newValue !== undefined && newValue !== null) await obtainSaleNumber();
  }
);

onMounted(async () => {
  console.log('Componente montado, obteniendo número de venta inicial');
  await obtainSaleNumber();
});

const selectSerie = (serieId) => {
  if (serieId !== undefined && serieId !== null) sale.value.serie = serieId;
};

const changeSerie = (v) => {
  const serieMap = { 1: 1, 3: 3, 80: 80 };
  const nuevaSerie = saleStore.getFirstOption(serieMap[v] || 80);
  if (nuevaSerie !== undefined && nuevaSerie !== null) sale.value.serie = nuevaSerie;
};

const changeCondition = (v) => {
  sale.value.given_amount = v === 1 ? sale.value.amount : parseFloat(0).toFixed(2);
};

const goToFirstTab = () => ui.activeTab = "main";

const performTakeAway = async () => {
  if (userStore.user.role === "MOZO") {
    ui.showConfirm = true;
    return;
  }
  dialog.success({
    closable: false,
    title: "Confirmar pedido",
    content: "¿Realizar pedido?",
    positiveText: "Sí",
    onPositiveClick: async () => {
      const result = await processTakeAwayOrder(sale, ui, showAndGenerateTicket, cleanupOrderStore);
      if (result.success) {
        checkState.value = true;
      }
    },
  });
};

const doMultiplePayment = () => {
  sale.value.payments = [
    { payment_method: sale.value.payment_method, amount: String(sale.value.amount) },
  ];
  ui.showPayments = true;
};

const normalizePaymentAmount = (value) => {
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
};

const evalPayments = computed(() => {
  if (sale.value.payments) {
    const sum = sale.value.payments.reduce(
      (acc, val) => acc + normalizePaymentAmount(val.amount),
      0
    );
    return sum !== Number(sale.value.amount);
  }
  return true;
});

const currentPaymentsAmount = computed(() => {
  if (sale.value.payments) {
    const sum = sale.value.payments.reduce((acc, val) => acc + normalizePaymentAmount(val.amount), 0);
    return Number.isFinite(sum) ? sum.toFixed(2) : "0.00";
  }
  return "0.00";
});

const filteredMethods = computed(() => saleStore.getPaymentMethodsOptions.map(option => ({
  ...option,
  disabled: sale.value.payments?.some(pay => pay.payment_method === option.value)
})));

const showCustomerOptions = async (value) => {
  if (value.length >= 3 && value.length <= 11) {
    searchingCustomer.value = true;
    try {
      const searchFunc = sale.value.invoice_type === 1 ? searchRucCustomer : searchCustomerByName;
      const response = await searchFunc(value);
      if (response.status === 200) {
        customerResults.value = response.data;
        customerOptions.value = response.data.map(customer => ({
          value: customer.id,
          label: `${customer.doc_num} - ${customer.names}`,
          disabled: customer.is_disabled
        }));
      }
    } catch (error) {
      console.error(error);
      message.error("Algo salió mal...");
    } finally {
      searchingCustomer.value = false;
    }
    return true;
  } else {
    customerResults.value = [];
    customerOptions.value = [];
    return false;
  }
};

const autoCreateCustomer = () => {
  if (!searchingCustomer.value && !customerResults.value.length) {
    const name = sale.value.customer_name;
    if (!isNaN(name) && ((name.length === 8 && sale.value.invoice_type !== 1) || name.length === 11)) {
      ui.showCustomerModal = true;
      customerDocument.value = name;
    }
  }
};

const createAddressesOptions = () => {
  console.info("si llega a crear las opciones de dirección, cliente seleccionado:", sale.value.customer?.id);

  const customer = sale.value.customer;
  sale.value.customer = customer.id;
  whatsappNumber.value = customer?.phone || "";
  if (customer) {
    console.info("Direcciones del cliente:", customer.addresses);
    addressesOptions.value = customer.addresses.map(address => ({
      value: address.id,
      label: `${address.ubigeo} - ${address.description}`
    }));
    if (addressesOptions.value.length) {
      sale.value.address = addressesOptions.value[0].value;
    }
    if (sale.value.delivery_info) {
      sale.value.delivery_info.person = customer.names;
      sale.value.delivery_info.phone = customer.phone;
      sale.value.delivery_info.address = customer.addresses.length ? customer.addresses[0].description : "";
    }
  }
};

const changeAddress = (v, o) => {
  if (sale.value.delivery_info && o?.label) {
    sale.value.delivery_info.address = o.label.split(" - ")[1];
  }
};

const handleDelivery = (v) => {
  sale.value.delivery_info = v ? {
    person: "",
    address: "",
    phone: "",
    deliveryman: "",
    amount: parseFloat(0).toFixed(2)
  } : null;
  if (v) sale.value.ask_for = "";
};

const performCreateOrder = async () => {
  const result = await processCreateOrder(sale, ui, showAndGenerateTicket, cleanupOrderStore);
  if (result.success) {
    checkState.value = true;
  }
};

const showAndGenerateTicket = async (voucherDataValue, shouldGenerate = true) => {
  voucherData.value = voucherDataValue;
  ui.showVoucher = true;
  if (shouldGenerate && ui.isTicketPreview) {
    await nextTick();
    if (ui.voucherDrawer && typeof ui.voucherDrawer.generate === 'function') {
      await ui.voucherDrawer.generate();
    } else {
      console.warn('voucherDrawer no disponible o sin generate');
    }
  }
};

const createPayment = () => {
  const currentTotal = sale.value.payments ? sale.value.payments.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0) : 0;
  const remaining = Math.max(0, parseFloat(sale.value.amount) - currentTotal);
  return { payment_method: null, amount: remaining > 0 ? remaining.toFixed(2) : "0" };
};

const onCloseModal = () => {
  ui.showCustomerModal = false;
};

const onSuccess = (customer) => {
  if ((sale.value.invoice_type === 1 && customer.doc_type === "6") || sale.value.invoice_type !== 1) {
    customerResults.value.push(customer);
    sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
    sale.value.customer = customer.id;
    createAddressesOptions();
  }
  ui.showCustomerModal = false;
  onCloseModal();
};

const checkState = ref(false);
const hasUnsavedChanges = computed(() => orderStore.orderList.length > 0 && !checkState.value);

const handleRouteGuard = (to, isLeave = false) => {
  if (!hasUnsavedChanges.value) {
    cleanupOrderStore();
    return;
  }

  const config = {
    title: "Pedido sin procesar",
    content: "¿Salir sin procesar el pedido?",
    positiveText: "Sí",
    onPositiveClick: () => {
      checkState.value = true;
      cleanupOrderStore();
      router.push(to);
    },
    ...(isLeave ? {} : { negativeText: "No" }),
    closable: !isLeave
  };

  dialog.error(config);
  return false;
};

const cleanupOrderStore = () => {
  orderStore.orders = [];
  orderStore.orderList.splice(0);
  saleStore.toSale.splice(0);
  orderStore.clearNewOrders();
};

onBeforeRouteLeave((to) => handleRouteGuard(to, true));

</script>

<style lang="scss" scoped>
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}
</style>
