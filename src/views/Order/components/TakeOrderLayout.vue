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
          <transition name="mode-fade" mode="out-in">
            <OrderTaking
              v-if="selectProducts"
              :loading="loading"
              :sale="sale"
              :show-observations="showObservations"
              :addresses-options="addressesOptions"
              :customer-options="customerOptions"
              :searching-customer="searchingCustomer"
              :whatsapp-number="whatsappNumber"
              :changing="changing"
              :sub-total="subTotal"
              :total-grv="totalGRV"
              :total-exn="totalEXN"
              :total-grt="totalGRT"
              :total-igv="totalIGV"
              :icbper="icbper"
              :total-dsct="totalDSCT"
              :is-multiple="isMultiple"
              :ticket-preview="ticketPreview"
              @update:sale="(newSale) => Object.assign(sale, newSale)"
              @update:show-observations="showObservations = $event"
              @update:is-multiple="isMultiple = $event"
              @update:ticket-preview="ticketPreview = $event"
              @select-serie="selectSerie"
              @change-serie="changeSerie"
              @change-condition="changeCondition"
              @auto-create-customer="autoCreateCustomer"
              @create-addresses-options="createAddressesOptions"
              @change-address="changeAddress"
              @handle-delivery="handleDelivery"
              @show-customer-modal="showCustomerModal = true"
              @perform-take-away="performTakeAway"
              @do-multiple-payment="doMultiplePayment"
            />
            <div v-else>
            <n-tabs type="line" animated>
              <n-tab-pane name="categories" tab="Categorías">
                <CategoriesList />
              </n-tab-pane>
              <n-tab-pane name="menu" tab="Menú">
                <n-card title="Menú Programado" :bordered="false">
                  <n-list>
                    <n-list-item v-for="menu in scheduledMenus" :key="menu.id" @click="handleOpenMenuModal(menu)" style="cursor: pointer">
                      <n-thing>
                        <n-space vertical>
                          <n-text class="fs-4">{{ menu.menu.name }}</n-text>
                          <n-text class="fs-6" type="info">Price: {{ menu.menu.price}}</n-text>
                        </n-space>
                      </n-thing>
                    </n-list-item>
                  </n-list>
                </n-card>
              </n-tab-pane>
            </n-tabs>
          </div>
          </transition>
        </n-gi>
        <n-gi span="2">
          <PaymentSummary
            :select-products="selectProducts"
            :product-search="productSearch"
            :show-modal="showModal"
            :item-index="itemIndex"
            @update:select-products="selectProducts = $event"
            @update:product-search="productSearch = $event"
            @update:show-modal="showModal = $event"
            @update:item-index="itemIndex = $event"
          />
        </n-gi>
      </n-grid>
    </n-card>
    <n-tabs class="d-lg-none" tab-style="background: #fff;" v-model:value="activeTab" type="segment" animated>
      <n-tab-pane name="main" tab="Tomar pedido">
        <n-card>
          <transition name="mode-fade" mode="out-in">
            <OrderTaking
              v-if="selectProducts"
              :loading="loading"
              :sale="sale"
              :show-observations="showObservations"
              :addresses-options="addressesOptions"
              :customer-options="customerOptions"
              :searching-customer="searchingCustomer"
              :whatsapp-number="whatsappNumber"
              :changing="changing"
              :sub-total="subTotal"
              :total-grv="totalGRV"
              :total-exn="totalEXN"
              :total-grt="totalGRT"
              :total-igv="totalIGV"
              :icbper="icbper"
              :total-dsct="totalDSCT"
              :is-multiple="isMultiple"
              :ticket-preview="ticketPreview"
              @update:sale="(newSale) => Object.assign(sale, newSale)"
              @update:show-observations="showObservations = $event"
              @update:is-multiple="isMultiple = $event"
              @update:ticket-preview="ticketPreview = $event"
              @select-serie="selectSerie"
              @change-serie="changeSerie"
              @change-condition="changeCondition"
              @show-customer-options="showCustomerOptions"
              @auto-create-customer="autoCreateCustomer"
              @create-addresses-options="createAddressesOptions"
              @change-address="changeAddress"
              @handle-delivery="handleDelivery"
              @show-customer-modal="showCustomerModal = true"
              @perform-take-away="performTakeAway"
              @do-multiple-payment="doMultiplePayment"
              @goToFirstTab="goToFirstTab"
            />
            <CategoriesList v-else />
          </transition>
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="menu" tab="Menú" v-if="!selectProducts">
        <n-card title="Menú Programado" :bordered="false">
          <n-list>
            <n-list-item v-for="menu in scheduledMenus" :key="menu.id" @click="handleOpenMenuModal(menu)" style="cursor: pointer">
              <n-thing>
                <n-space vertical>
                  <n-text class="fs-4">{{ menu.menu.name }}</n-text>
                  <n-text class="fs-6" type="info">Price: {{ menu.menu.price}}</n-text>
                </n-space>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="payment" tab="Resumen">
        <PaymentSummary
          :select-products="selectProducts"
          :product-search="productSearch"
          :show-modal="showModal"
          :item-index="itemIndex"
          @update:select-products="(value) => { selectProducts = value; goToFirstTab(); }"
          @update:product-search="productSearch = $event"
          @update:show-modal="showModal = $event"
          @update:item-index="itemIndex = $event"
          @go-to-first-tab="goToFirstTab"
        />
      </n-tab-pane>
    </n-tabs>
    <n-modal :class="getModalClass" preset="card" v-model:show="showConfirm" title="Registrar pedido" :mask-closable="false" closable>
      <n-form-item label="Ingrese código de usuario">
        <n-input type="password" v-model:value="userConfirm" placeholder="" />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button type="success" :loading="loading" :disabled="!userConfirm || loading" secondary @click.prevent="performCreateOrder">
            Confirmar
          </n-button>
        </n-space>
      </template>
    </n-modal>
    <n-modal :class="getModalClass" preset="card" v-model:show="showPayments" title="Realizar venta" :mask-closable="false" closable @close="sale.payments = null">
      <n-space justify="space-between">
        <n-tag type="info">Total: S/. {{ showPayments ? sale.amount : null }}</n-tag>
        <n-tag :type="evalPayments ? 'error' : 'success'">Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}</n-tag>
        <n-tag :type="evalPayments ? 'error' : 'warning'">Faltante: S/. {{ showPayments ? (parseFloat(sale.amount) - currentPaymentsAmount).toFixed(2) : null }}</n-tag>
      </n-space>
      <n-form-item class="mt-2" label="Pagos">
        <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
          <template #default="{ value }">
            <div style="display: flex; align-items: center; width: 100%">
              <n-select v-model:value="value.payment_method" :disabled="loading" :options="filteredMethods" />
              <n-input class="ms-2" v-model:value="value.amount" placeholder="" :disabled="loading" @keypress="isDecimal($event)" />
            </div>
          </template>
        </n-dynamic-input>
      </n-form-item>
      <n-space justify="end">
        <n-button 
          type="success" 
          :disabled="evalPayments || sale.payments?.some(p => p.payment_method === null) || sale.payments?.some(p => Number(p.amount) <= 0) || loading" 
          :loading="loading" 
          secondary 
          @click="performTakeAway"
        >
          Confirmar
        </n-button>
      </n-space>
    </n-modal>
    <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="orderStore.orderList[itemIndex]" @success="showModal = false" />
    <customer-modal v-model:show="showCustomerModal" :id-customer="sale.customer" :document="customerDocument" :doc_type="sale.invoice_type === 1 ? '6' : null" @update:show="onCloseModal" @on-success="onSuccess" />
    <ticket-preview ref="ticketPreviewRef" v-model:show="showPdf" :data="pdfData" :hidden="true" :isUpdate="false" />
    <preview-drawer ref="voucherDrawer" v-model:show="showVoucher" :data="voucherData" :previewOnly="!ticketPreview" @printed="() => $router.push({ name: 'TableHome' })" @canceled="() => $router.push({ name: 'TableHome' })" />
    <MenuProductModal v-if="showMenuModal" :menu="selectedMenu" @close="showMenuModal = false" />
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { getSaleNumber } from "@/api/modules/sales";
import { takeAwayOrder } from "@/api/modules/orders";
import { getMenuToday } from '@/api/modules/products';
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useSettingsStore } from "@/store/modules/settings";
import { useGenericsStore } from "@/store/modules/generics";
import { useUserStore } from "@/store/modules/user";
import { useSaleTotals } from "@/composables/useSaleTotals";
import { useBreakpoint } from 'vooks';
import OrderTaking from "./OrderTaking.vue";
import PaymentSummary from "./PaymentSummary.vue";
import CategoriesList from "./CategoriesList.vue";
import OrderIndications from "./OrderIndications.vue";
import CustomerModal from "@/views/Customer/components/CustomerModal.vue";
import TicketPreview from "@/views/Order/components/TicketPreview.vue";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer.vue";
import MenuProductModal from "@/views/Table/components/MenuProductModal.vue";
import format from "date-fns/format";

export default defineComponent({
  name: "TakeOrderLayout",
  components: {
    OrderTaking,
    PaymentSummary,
    CategoriesList,
    OrderIndications,
    CustomerModal,
    TicketPreview,
    PreviewDrawer,
    MenuProductModal,
  },
  setup() {
    const breakpointRef = useBreakpoint();
    const orderStore = useOrderStore();
    const message = useMessage();
    const dialog = useDialog();
    const genericsStore = useGenericsStore();
    const saleStore = useSaleStore();
    const settingsStore = useSettingsStore();
    const userStore = useUserStore();
    const route = useRoute();
    const router = useRouter();
    const { grandTotal, formattedTotals } = useSaleTotals();

    const loading = ref(false);
    const selectProducts = ref(false);
    const showObservations = ref(false);
    const isMultiple = ref(false);
    const ticketPreview = ref(settingsStore.businessSettings?.sale?.show_preview ?? true);
    const activeTab = ref("main");
    const selectedMenu = ref(null);
    const showModal = ref(false);
    const showConfirm = ref(false);
    const showPayments = ref(false);
    const showCustomerModal = ref(false);
    const showPdf = ref(false);
    const showVoucher = ref(false);
    const showMenuModal = ref(false);
    const scheduledMenus = ref([]);
    const ticketPreviewRef = ref(null);
    const voucherDrawer = ref(null);
    const itemIndex = ref(null);
    const userConfirm = ref("");
    const productSearch = ref("");

    // Usar el total del composable que incluye menús
    const total = computed(() => {
        let cal = grandTotal.value + parseFloat(sale.value.other_charges || 0);
        if (sale.value.delivery_info && sale.value.delivery_info.amount) {
            cal = cal + parseFloat(sale.value.delivery_info.amount);
        }
        return cal.toFixed(2);
    });

    const pdfData = ref(null);
    const voucherData = ref(null);
    const addressesOptions = ref([]);
    const customerOptions = ref([]);
    const searchingCustomer = ref(false);
    const whatsappNumber = ref("");
    const customerDocument = ref("");

    // Computados necesarios para aria branch
    const computeTaxTotals = (affectation) => saleStore.toSale.reduce((acc, curVal) => 
      curVal.product_affectation === affectation ? acc + parseFloat(curVal.price_sale) * curVal.quantity : acc, 0);

    const icbper = computed(() => orderStore.orderList.reduce((acc, curVal) => 
      acc + (curVal.icbper ? curVal.icbper_amount : 0), 0));
    
    const totalGRV = computed(() => computeTaxTotals(10));
    const totalEXN = computed(() => computeTaxTotals(20));
    const totalGRT = computed(() => computeTaxTotals(21));
    
    const totalIGV = computed(() => {
      const igvTotal = saleStore.toSale.reduce((acc, curVal) => 
        acc + parseFloat(curVal.igv_tax || 0) * parseFloat(curVal.quantity || 0), 0);
      return parseFloat(igvTotal.toFixed(2));
    });

    const totalDSCT = computed(() => 
      saleStore.toSale.some(detail => Number(detail.discount) > 0)
        ? saleStore.toSale.reduce((acc, curVal) => acc + Number(curVal.discount), 0)
        : Number(sale.value.discount));

    const subTotal = computed(() => saleStore.toSale.reduce((acc, curVal) => 
      curVal.product_affectation === 21 ? acc : acc + curVal.price_sale * curVal.quantity, 0));

    const changing = computed(() => 
      sale.value.given_amount > total.value ? (sale.value.given_amount - total.value).toFixed(2) : 0.0);

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
      given_amount: parseFloat(0).toFixed(2),
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

    // Watcher combinado que usa useSaleTotals para menús y aria para productos regulares
    watch([total, icbper, totalGRV, totalEXN, totalGRT, totalIGV, totalDSCT, () => saleStore.toSale, grandTotal, () => orderStore.orderList.length], () => {
      // Calcular la cantidad de productos directamente (incluyendo menús)
      const productCount = saleStore.toSale.reduce((acc, curVal) => acc + curVal.quantity, 0);
      const menuCount = (saleStore.salePayload.sale_product_sets || []).reduce((acc, curVal) => acc + curVal.quantity, 0);
      
      Object.assign(sale.value, {
        count: productCount + menuCount,
        amount: total.value,
        icbper: icbper.value,
        taxed_amount: totalGRV.value,
        exempt_amount: totalEXN.value,
        free_amount: totalGRT.value,
        igv_amount: totalIGV.value,
        total_igv: parseFloat(totalIGV.value || 0).toFixed(2),
      });
      
      console.log("TakeOrderLayout - total_igv actualizado:", sale.value.total_igv, "tipo:", typeof sale.value.total_igv);
      console.log("TakeOrderLayout - Total con menús:", total.value, "Grand Total:", grandTotal.value);
      
      // Actualizar el monto dado cuando cambia el total (para contado)
      if (sale.value.payment_condition === 1) {
        const newGivenAmount = total.value > 0 ? total.value : parseFloat(0).toFixed(2);
        if (sale.value.given_amount !== newGivenAmount) {
          sale.value.given_amount = newGivenAmount;
          console.log("TakeOrderLayout - Monto de pago actualizado a:", newGivenAmount);
        }
      }
    });

    const obtainSaleNumber = async () => {
      if (!sale.value.serie) return;
      loading.value = true;
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
        loading.value = false;
      }
    };

    watch(() => sale.value.serie, async (newValue) => {
      if (newValue !== undefined && newValue !== null) await obtainSaleNumber();
    });

    onMounted(async () => {
      console.log('Componente montado, obteniendo número de venta inicial');
      const menuData = await getMenuToday();
      scheduledMenus.value = menuData.data;
      await obtainSaleNumber();
    });

    const handleOpenMenuModal = async (menu) => {
      const menuData = await getMenuToday(menu.id);
      if (menuData?.data?.length) {
        selectedMenu.value = menuData.data[0];
        showMenuModal.value = true;
      }
    };

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

    const goToFirstTab = () => activeTab.value = "main";

    const performTakeAway = () => {
      if (userStore.user.role === "MOZO") {
        showConfirm.value = true;
        return;
      }
      dialog.success({
        closable: false,
        title: "Confirmar pedido",
        content: "¿Realizar pedido?",
        positiveText: "Sí",
        onPositiveClick: async () => {
          loading.value = true;
          try {
            sale.value.sale_details = saleStore.toSale.map(detail => ({
              ...detail,
              igv_tax: typeof detail.igv_tax === "number" ? detail.igv_tax.toFixed(2) : detail.igv_tax,
              price_base: typeof detail.price_base === "number" ? detail.price_base.toFixed(2) : detail.price_base,
            }));
            const igvValue = parseFloat(sale.value.total_igv || sale.value.igv_amount || 0);
            sale.value.total_igv = igvValue.toFixed(2);
            const saleClone = JSON.parse(JSON.stringify(sale.value));
            
            // Obtener el payload completo que incluye sale_product_sets (menús)
            const salePayload = saleStore.salePayload;
            console.log("TakeOrderLayout - enviando orden con menús:", salePayload.sale_product_sets?.length || 0);
            
            const response = await takeAwayOrder(orderStore.orderList, saleClone, userConfirm.value, salePayload);
            if (response.status === 201) {
              checkState.value = true;
              cleanupOrderStore();
              pdfData.value = response.data.order;
              showPdf.value = true;
              setTimeout(() => {
                ticketPreviewRef.value.generate();
                if (settingsStore.businessSettings.printer.print_html) {
                  voucherData.value = response.data.sale;
                  showVoucher.value = true;
                  if (!ticketPreview.value) {
                    setTimeout(() => voucherDrawer.value.generate(), 250);
                  }
                }
              }, 250);
            }
          } catch (error) {
            message.error("Ha ocurrido un error al procesar la venta");
          } finally {
            loading.value = false;
          }
        },
      });
    };

    const doMultiplePayment = () => {
      sale.value.payments = [{ payment_method: sale.value.payment_method, amount: String(sale.value.amount) }];
      showPayments.value = true;
    };

    const evalPayments = computed(() => false);
    const currentPaymentsAmount = computed(() => "0.00");
    const filteredMethods = computed(() => []);

    const showCustomerOptions = () => {};
    const autoCreateCustomer = () => {};
    const createAddressesOptions = () => {};
    const changeAddress = () => {};
    const handleDelivery = () => {};
    const performCreateOrder = () => {
      performTakeAway();
    };
    const createPayment = () => {};
    const onCloseModal = () => {};
    const onSuccess = () => {};
    const isDecimal = () => {};

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
      orderStore.orderList.splice(0);
      saleStore.toSale.splice(0);
    };

    onBeforeRouteLeave((to) => handleRouteGuard(to, true));

    return {
      // Estados
      loading, selectProducts, showObservations, isMultiple, ticketPreview, activeTab,
      showModal, showConfirm, showPayments, showCustomerModal, showPdf, showVoucher,
      showMenuModal, selectedMenu, scheduledMenus,
      // Referencias
      ticketPreviewRef, voucherDrawer, itemIndex, userConfirm, productSearch,
      // Datos
      sale, pdfData, voucherData, addressesOptions, customerOptions,
      searchingCustomer, whatsappNumber, customerDocument,
      // Computados
      changing, subTotal, totalGRV, totalEXN, totalGRT, totalIGV, totalDSCT, icbper,
      getModalClass, evalPayments, currentPaymentsAmount, filteredMethods,
      // Stores
      orderStore,
      // Métodos
      handleOpenMenuModal, selectSerie, changeSerie, changeCondition, showCustomerOptions,
      autoCreateCustomer, createAddressesOptions, changeAddress, handleDelivery,
      performTakeAway, doMultiplePayment, performCreateOrder,
      createPayment, onCloseModal, onSuccess, isDecimal, goToFirstTab,
      checkState, hasUnsavedChanges,
    };
  },
});
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