<template>
  <div id="TakeOrderLayout">
    <n-page-header class="mb-2" @back="$router.push({ name: 'TableHome' })">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">Realizar Pedido</n-text>
        </n-space>
      </template>
    </n-page-header>
    <n-card class="d-none d-md-flex">
      <n-grid responsive="screen" cols="1 xs:1 s:1 m:5 l:5 xl:5 2xl:5" :x-gap="12">
        <!-- Componente Principal de Toma de Orden -->
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
              @update:sale="updateSale"
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
            />
            <CategoriesList v-else />
          </transition>
        </n-gi>

        <n-gi span="2">
          <PaymentSummary
            :select-products="selectProducts"
            :product-search="productSearch"
            :product-options="productOptions"
            :searching="searching"
            :show-modal="showModal"
            :item-index="itemIndex"
            @update:select-products="selectProducts = $event"
            @update:product-search="productSearch = $event"
            @update:show-modal="showModal = $event"
            @update:item-index="itemIndex = $event"
            @show-options="showOptions"
            @select-product="selectProduct"
            @render-label="renderLabel"
          />
        </n-gi>
      </n-grid>
    </n-card>
    <n-tabs class="d-md-none" v-model:value="activeTab" type="segment" animated>
      <n-tab-pane name="main" tab="Principal">
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
              @update:sale="updateSale"
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
      <n-tab-pane name="payment" tab="Resumen">
        <PaymentSummary
          :select-products="selectProducts"
          :product-search="productSearch"
          :product-options="productOptions"
          :searching="searching"
          :show-modal="showModal"
          :item-index="itemIndex"
          @update:select-products="selectProducts = $event"
          @update:product-search="productSearch = $event"
          @update:show-modal="showModal = $event"
          @update:item-index="itemIndex = $event"
          @show-options="showOptions"
          @select-product="selectProduct"
          @render-label="renderLabel"
        />
      </n-tab-pane>
    </n-tabs>

    <!-- Modales -->
    <n-modal
        :class="getModalClass"
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
            >
              Confirmar
            </n-button>
          </n-space>
        </template>
      </n-modal>

      <n-modal
        :class="getModalClass"
        preset="card"
        v-model:show="showPayments"
        title="Realizar venta"
        :mask-closable="false"
        closable
        @close="sale.payments = null"
      >
        <n-space justify="space-between">
          <n-tag type="info">Total: S/. {{ showPayments ? sale.amount : null }}</n-tag>
          <n-tag :type="evalPayments ? 'error' : 'success'">
            Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}
          </n-tag>
          <n-tag :type="evalPayments ? 'error' : 'warning'">
            Faltante: S/. {{ showPayments ? (parseFloat(sale.amount) - currentPaymentsAmount).toFixed(2) : null }}
          </n-tag>
        </n-space>
        <n-form-item class="mt-2" label="Pagos">
          <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
            <template #default="{ value }">
              <div style="display: flex; align-items: center; width: 100%">
                <n-select
                  v-model:value="value.payment_method"
                  :disabled="loading"
                  :options="filteredMethods"
                />
                <n-input
                  class="ms-2"
                  v-model:value="value.amount"
                  placeholder=""
                  :disabled="loading"
                  @keypress="isDecimal($event)"
                />
              </div>
            </template>
          </n-dynamic-input>
        </n-form-item>
        <n-space justify="end">
          <n-button
            type="success"
            :disabled="evalPayments || sale.payments.some(p => p.payment_method === null) || sale.payments.some(p => Number(p.amount) <= 0) || loading"
            :loading="loading"
            secondary
            @click="performTakeAway"
          >
            Confirmar
          </n-button>
        </n-space>
      </n-modal>

      <OrderIndications
        v-model:show="showModal"
        preset="card"
        title="Indicaciones"
        :order="orderStore.orderList[itemIndex]"
        @success="showModal = false"
      />

      <customer-modal
        v-model:show="showCustomerModal"
        :id-customer="sale.customer"
        :document="customerDocument"
        :doc_type="sale.invoice_type === 1 ? '6' : null"
        @update:show="onCloseModal"
        @on-success="onSuccess"
      />

      <ticket-preview
        ref="ticketPreviewRef"
        v-model:show="showPdf"
        :data="pdfData"
        :hidden="true"
        :isUpdate="false"
      />

      <preview-drawer
        ref="voucherDrawer"
        v-model:show="showVoucher"
        :data="voucherData"
        :previewOnly="!ticketPreview"
        @printed="() => $router.push({ name: 'TableHome' })"
        @canceled="() => $router.push({ name: 'TableHome' })"
      />
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { useGenericsStore } from "@/store/modules/generics";
import { useBreakpoint } from 'vooks';

import OrderTaking from "./OrderTaking.vue";
import PaymentSummary from "./PaymentSummary.vue";
import CategoriesList from "./CategoriesList.vue";
import OrderIndications from "./OrderIndications.vue";
import CustomerModal from "@/views/Customer/components/CustomerModal.vue";
import TicketPreview from "@/views/Order/components/TicketPreview.vue";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer.vue";

export default defineComponent({
  name: "TakeOrderLayout",
  components: {
    OrderTaking,
    PaymentSummary,
    CategoriesList,
    OrderIndications,
    CustomerModal,
    TicketPreview,
    PreviewDrawer
  },
  setup() {
    const breakpointRef = useBreakpoint();
    const orderStore = useOrderStore();
    const genericsStore = useGenericsStore();

    // Estados principales
    const loading = ref(false);
    const selectProducts = ref(false);
    const showObservations = ref(false);
    const isMultiple = ref(false);
    const ticketPreview = ref(false);
    const activeTab = ref('main');

    // Estados de modales
    const showModal = ref(false);
    const showConfirm = ref(false);
    const showPayments = ref(false);
    const showCustomerModal = ref(false);
    const showPdf = ref(false);
    const showVoucher = ref(false);

    // Referencias
    const ticketPreviewRef = ref(null);
    const voucherDrawer = ref(null);
    const itemIndex = ref(null);
    const userConfirm = ref("");
    const productSearch = ref("");

    // Datos
    const sale = ref({});
    const pdfData = ref(null);
    const voucherData = ref(null);
    const addressesOptions = ref([]);
    const customerOptions = ref([]);
    const productOptions = ref([]);

    // Estados de búsqueda
    const searchingCustomer = ref(false);
    const searching = ref(false);
    const whatsappNumber = ref("");
    const customerDocument = ref("");

    // Computados para totales
    const changing = computed(() => 0);
    const subTotal = computed(() => 0);
    const totalGRV = computed(() => 0);
    const totalEXN = computed(() => 0);
    const totalGRT = computed(() => 0);
    const totalIGV = computed(() => 0);
    const totalDSCT = computed(() => 0);
    const icbper = computed(() => 0);

    const isMobile = computed(() => ['xs', 's'].includes(breakpointRef.value));

    const getModalClass = computed(() => ({
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }));

    // Métodos que serán implementados por los componentes padres
    const updateSale = (newSale) => {
      sale.value = { ...sale.value, ...newSale };
    };

    const goToFirstTab = () => {
      activeTab.value = 'main'
    }

    // Métodos de placeholder (deberán ser implementados)
    const selectSerie = () => {};
    const changeSerie = () => {};
    const changeCondition = () => {};
    const showCustomerOptions = () => {};
    const autoCreateCustomer = () => {};
    const createAddressesOptions = () => {};
    const changeAddress = () => {};
    const handleDelivery = () => {};
    const performTakeAway = () => {};
    const doMultiplePayment = () => {};
    const showOptions = () => {};
    const selectProduct = () => {};
    const renderLabel = () => {};
    const performCreateOrder = () => {};
    const createPayment = () => {};
    const onCloseModal = () => {};
    const onSuccess = () => {};
    const isDecimal = () => {};

    const evalPayments = computed(() => false);
    const currentPaymentsAmount = computed(() => "0.00");
    const filteredMethods = computed(() => []);

    return {
      // Estados
      loading,
      selectProducts,
      showObservations,
      isMultiple,
      ticketPreview,
      showModal,
      showConfirm,
      showPayments,
      showCustomerModal,
      showPdf,
      showVoucher,
      activeTab,
      
      // Referencias
      ticketPreviewRef,
      voucherDrawer,
      itemIndex,
      userConfirm,
      productSearch,
      
      // Datos
      sale,
      pdfData,
      voucherData,
      addressesOptions,
      customerOptions,
      productOptions,
      searchingCustomer,
      searching,
      whatsappNumber,
      customerDocument,
      
      // Computados
      changing,
      subTotal,
      totalGRV,
      totalEXN,
      totalGRT,
      totalIGV,
      totalDSCT,
      icbper,
      isMobile,
      getModalClass,
      evalPayments,
      currentPaymentsAmount,
      filteredMethods,
      
      // Stores
      orderStore,
      
      // Métodos
      updateSale,
      selectSerie,
      changeSerie,
      changeCondition,
      showCustomerOptions,
      autoCreateCustomer,
      createAddressesOptions,
      changeAddress,
      handleDelivery,
      performTakeAway,
      doMultiplePayment,
      showOptions,
      selectProduct,
      renderLabel,
      performCreateOrder,
      createPayment,
      onCloseModal,
      onSuccess,
      isDecimal,
      goToFirstTab
    };
  }
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