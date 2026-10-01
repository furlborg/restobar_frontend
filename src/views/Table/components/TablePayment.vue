<template>
  <div class="pos-billing-wrapper">
    <n-spin :show="loading">
      <div class="pos-billing-grid">
        
        <!-- ============================================== -->
        <!-- COLUMNA IZQUIERDA: DETALLE DE CUENTA & PEDIDOS -->
        <!-- ============================================== -->
        <section class="pos-panel pos-account-panel">
          <header class="panel-header">
            <div class="panel-header-left">
              <span class="table-badge">Resumen de Pedidos</span>
              <n-tag round type="info" size="small" class="item-count-tag">
                {{ totalProductCount }} {{ totalProductCount === 1 ? 'ítem' : 'ítems' }} en cuenta
              </n-tag>
            </div>
            <div class="panel-header-right">
              <n-button size="small" secondary class="flizzy-add-order-btn" @click="navigateBackToTakeOrder">
                <template #icon>
                  <v-icon name="md-add-round" />
                </template>
                Añadir pedidos
              </n-button>
            </div>
          </header>

          <div class="products-scroll-viewport">
            <ProductTable 
              :sale="sale" 
              :sale-details="saleStore.toSale" 
              :sale-menu-sets="saleStore.salePayload?.sale_product_sets" 
              @update-detail="saleStore.updateDetail" 
            />
          </div>

          <footer class="panel-footer">
            <div class="account-summary-row">
              <span class="text-muted">Total productos: <b>{{ totalProductCount }}</b></span>
              <span class="account-subtotal-label">Subtotal ítems: <b>S/. {{ formatNumber(subTotal) }}</b></span>
            </div>
          </footer>
        </section>

        <!-- ============================================== -->
        <!-- COLUMNA DERECHA: LIQUIDACIÓN Y COMMAND CENTER  -->
        <!-- ============================================== -->
        <section class="pos-panel pos-checkout-panel">
          <!-- CABECERA: COMPROBANTE & CONDICIÓN -->
          <div class="checkout-header-bar">
            <div class="checkout-header-top">
              <div class="d-flex align-items-center gap-2">
                <span class="checkout-title">Comprobante</span>
                <SaleSerieSelector 
                  :sale="sale" 
                  :invoice-type="sale.invoice_type" 
                  @update:serie="handleSerieUpdate"
                  @serie-changed="handleSerieChanged" 
                />
              </div>
              <div class="payment-condition-toggle">
                <n-radio-group
                  v-model:value="sale.payment_condition"
                  name="saleType"
                  size="small"
                  :disabled="!settingsStore.businessSettings?.sale?.enable_credits"
                  @update:value="changeCondition"
                >
                  <n-radio-button :value="1">Contado</n-radio-button>
                  <n-radio-button :value="2">Crédito</n-radio-button>
                </n-radio-group>
              </div>
            </div>

            <!-- SELECTORES TIPO DOCUMENTO -->
            <div class="doc-selectors-row">
              <n-radio-group v-model:value="sale.invoice_type" name="docType" size="small" class="w-100 doc-type-group" @update:value="changeSerie">
                <n-radio-button :disabled="!settingsStore.businessSettings.sale?.enable_invoices" :value="1" class="doc-type-rb">
                  FACTURA
                </n-radio-button>
                <n-radio-button :disabled="!settingsStore.businessSettings.sale?.enable_invoices" :value="3" class="doc-type-rb">
                  BOLETA
                </n-radio-button>
                <n-radio-button :value="80" class="doc-type-rb">
                  NOTA VENTA
                </n-radio-button>
              </n-radio-group>
            </div>
          </div>

          <!-- DATOS DEL CLIENTE Y FECHA -->
          <div class="checkout-client-box">
            <div class="client-header-title">
              <span class="client-label">Cliente / Receptor:</span>
              <span class="client-type-hint">
                {{ sale.invoice_type === 1 ? 'RUC Obligatorio (Factura)' : (sale.invoice_type === 2 ? 'DNI o Varios (Boleta)' : 'Opcional (Nota Venta)') }}
              </span>
            </div>
            <n-form ref="saleForm" :model="sale" :rules="formRules" size="small" :show-label="false">
              <div class="client-input-wrapper">
                <n-form-item path="customer" class="mb-0 w-100">
                  <ClientSelectInput 
                    v-model:customer-name="sale.customer_name" 
                    v-model:customer-id="sale.customer"
                    :invoice-type="sale.invoice_type" 
                    placeholder="Buscar o registrar cliente (RUC, DNI, Nombre)..."
                    @customer-selected="handleCustomerSelected"
                    @customer-cleared="handleCustomerCleared" 
                  />
                </n-form-item>
              </div>

              <!-- Dirección desplegable si el cliente tiene direcciones registradas -->
              <div v-if="addressesOptions.length > 0" class="mt-2">
                <n-select 
                  v-model:value="sale.address" 
                  :options="addressesOptions" 
                  :disabled="!sale.customer"
                  placeholder="Seleccionar dirección..." 
                  size="small"
                />
              </div>

              <!-- Fecha de vencimiento si es crédito -->
              <div v-if="isCredit" class="mt-2">
                <n-form-item label="Fecha de vencimiento" path="expiration_sale" class="mb-0">
                  <n-date-picker 
                    class="w-100" 
                    type="date" 
                    format="dd/MM/yyyy" 
                    value-format="dd/MM/yyyy"
                    :is-date-disabled="isExpirationDateDisabled" 
                    v-model:formatted-value="sale.expiration_sale" 
                    size="small"
                  />
                </n-form-item>
              </div>

              <!-- Observaciones secundarias de la venta -->
              <div class="client-observations-row">
                <n-button class="flizzy-text-btn" text size="tiny" @click="showObservations = !showObservations">
                  <v-icon name="md-notes-round" class="me-1" scale="0.9" />
                  {{ showObservations ? "Ocultar observaciones" : "+ Añadir observaciones" }}
                </n-button>
              </div>

              <n-collapse-transition :show="showObservations">
                <div class="mt-2">
                  <n-input 
                    type="textarea" 
                    v-model:value="sale.observations" 
                    placeholder="Notas o indicaciones de la venta..." 
                    :rows="2" 
                    size="small" 
                  />
                </div>
              </n-collapse-transition>
            </n-form>
          </div>

          <!-- DESGLOSE TRIBUTARIO COMPACTO -->
          <div class="financial-breakdown">
            <div class="financial-row">
              <span class="fin-label">Subtotal</span>
              <span class="fin-val">S/. {{ formatNumber(subTotal) }}</span>
            </div>
            <div v-if="Number(totalEXN) > 0" class="financial-row">
              <span class="fin-label">Op. Exoneradas</span>
              <span class="fin-val">S/. {{ formatNumber(totalEXN) }}</span>
            </div>
            <div v-if="Number(totalGRV) > 0" class="financial-row">
              <span class="fin-label">Op. Gravadas</span>
              <span class="fin-val">S/. {{ formatNumber(totalGRV) }}</span>
            </div>
            <div v-if="Number(totalIGV) > 0" class="financial-row">
              <span class="fin-label">IGV</span>
              <span class="fin-val">S/. {{ formatNumber(totalIGV) }}</span>
            </div>
            <div v-if="Number(icbper) > 0" class="financial-row">
              <span class="fin-label">ICBPER</span>
              <span class="fin-val">S/. {{ formatNumber(icbper) }}</span>
            </div>

            <!-- Modificadores de Descuento y Otros Cargos -->
            <div class="financial-modifiers-grid">
              <div class="mod-item">
                <span class="mod-label">Descuento</span>
                <n-input-number 
                  size="small" 
                  :value="Number(totalDSCT)" 
                  :min="0" 
                  :max="discountInputMax" 
                  :step="0.5" 
                  :precision="2" 
                  :disabled="hasItemDiscount || Number(sale.other_charges) > 0 || !canEditDiscount"
                  @update:value="handleDiscountChange"
                >
                  <template #prefix>S/.</template>
                </n-input-number>
              </div>

              <div class="mod-item">
                <span class="mod-label">Otros Cargos</span>
                <n-input-number 
                  size="small" 
                  :value="Number(sale.other_charges || 0)" 
                  :min="0" 
                  :step="0.5" 
                  :precision="2" 
                  :disabled="Number(totalDSCT) > 0"
                  @update:value="handleChargesChange"
                >
                  <template #prefix>S/.</template>
                </n-input-number>
              </div>
            </div>
          </div>

          <!-- MÉTODO DE PAGO -->
          <div class="payment-methods-card">
            <span class="payment-field-label">Método de Pago:</span>
            <div class="payment-methods-grid">
              <button
                v-for="pm in saleStore.getPaymentMethodsOptions"
                :key="pm.value"
                type="button"
                class="pm-tile"
                :class="{ 'pm-tile-active': sale.payment_method === pm.value, [getMethodClass(pm.label)]: true }"
                @click="sale.payment_method = pm.value"
              >
                <payment-brand-icon :method="pm.label" :size="24" class="pm-brand-icon" />
                <span class="pm-name">{{ pm.label }}</span>
              </button>
            </div>
          </div>

          <!-- BANNER DEL TOTAL A COBRAR (FLIZZY SIGNATURE CARD) -->
          <div class="flizzy-total-card">
            <div class="flizzy-total-info">
              <span class="flizzy-total-badge">TOTAL A COBRAR</span>
              <span class="flizzy-total-sub">{{ isCredit ? 'Venta registrada a crédito' : 'Monto total de la comanda' }}</span>
            </div>
            <div class="flizzy-total-price">
              <span class="flizzy-currency">S/.</span>
              <span class="flizzy-digits">{{ total }}</span>
            </div>
          </div>

          <!-- LIQUIDACIÓN: PAGO RECIBIDO, ATAJOS Y VUELTO -->
          <div class="settlement-control-card">
            <div class="settlement-row">
              <div class="settlement-field-wrapper">
                <span class="settlement-label">Pago Recibido:</span>
                <n-input-number 
                  class="payment-given-input" 
                  size="small"
                  v-model:value="paymentInputModel" 
                  :min="0" 
                  :precision="2" 
                  :step="1"
                  :disabled="sale.payment_condition === 2"
                  @update:value="handlePaymentGivenInput"
                  @click="$event.target?.select?.()"
                >
                  <template #prefix>S/.</template>
                </n-input-number>
              </div>

              <!-- ATAJOS DE BILLETES RÁPIDOS -->
              <div v-if="sale.payment_condition === 1" class="quick-cash-chips-group">
                <button 
                  type="button" 
                  class="quick-cash-chip exact-chip"
                  @click="setQuickCash(Number(total))"
                >
                  Exacto
                </button>
                <button 
                  v-for="opt in quickCashOptions" 
                  :key="opt.value" 
                  type="button" 
                  class="quick-cash-chip"
                  @click="setQuickCash(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- VUELTO / FALTANTE STATE BANNER -->
            <div class="vuelto-state-banner" :class="changeStatusClass">
              <div class="vuelto-label-group">
                <span class="vuelto-title">{{ changeStatusLabel }}</span>
                <span class="vuelto-hint" v-if="changeStatusClass === 'status-success'">A entregar al cliente</span>
                <span class="vuelto-hint" v-else-if="changeStatusClass === 'status-neutral'">Monto completo sin vuelto</span>
                <span class="vuelto-hint" v-else-if="changeStatusClass === 'status-warning'">Monto insuficiente</span>
                <span class="vuelto-hint" v-else>Operación al crédito</span>
              </div>
              <div class="vuelto-value">
                S/. {{ formatNumber(changeStatusValue) }}
              </div>
            </div>
          </div>

          <!-- OPCIONES SECUNDARIAS -->
          <div class="checkout-footer-options">
            <n-checkbox v-model:checked="sale.by_consumption" :disabled="sale.payment_condition === 2" size="small">
              <span class="consumption-label">Por consumo</span>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <v-icon name="md-infooutline-round" class="ms-1 text-muted" style="cursor: help; vertical-align: -2px;" />
                </template>
                Emite el comprobante electrónico con un único ítem "Por consumo" en lugar de desglosar cada plato.
              </n-tooltip>
            </n-checkbox>

            <n-checkbox v-model:checked="ticketPreview" size="small">
              Previsualizar ticket
            </n-checkbox>

            <div v-if="sale.payment_condition === 1" class="d-flex align-items-center gap-2">
              <n-checkbox v-model:checked="isMultiple" size="small">
                Pago múltiple
              </n-checkbox>
              <n-button class="flizzy-text-btn" text size="small" @click="openSeparatePaymentsModal">
                Dividir cuenta
              </n-button>
            </div>
          </div>

          <!-- BOTÓN PRINCIPAL COBRAR -->
          <div class="checkout-submit-wrapper">
            <n-button 
              class="pos-cobrar-btn" 
              type="primary" 
              :disabled="!hasItems || (sale.payment_condition === 1 ? Number(sale.given_amount) < Number(sale.amount) : !(Number(sale.given_amount) < Number(sale.amount)))" 
              :loading="loading"
              block 
              @click.prevent="isMultiple ? doMultiplePayment() : performCreateSale()"
            >
              <template #icon>
                <v-icon name="md-check-round" scale="1.2" />
              </template>
              Cobrar S/. {{ total }}
            </n-button>
          </div>
        </section>

      </div>
    </n-spin>

    <n-modal 
      class="flizzy-payment-modal"
      :style="{ width: genericsStore.device === 'mobile' ? '95%' : '480px' }"
      preset="card" 
      v-model:show="showPayments" 
      title="Liquidación con Pago Múltiple" 
      :mask-closable="false" 
      closable
      @close="sale.payments = null"
    >
      <!-- HEADER METRICS (3 CARDS) -->
      <div class="multi-pay-summary-grid">
        <div class="multi-pay-metric total-metric">
          <span class="metric-label">Total a Pagar</span>
          <span class="metric-value">S/. {{ showPayments ? Number(sale.amount).toFixed(2) : '0.00' }}</span>
        </div>
        <div class="multi-pay-metric assigned-metric">
          <span class="metric-label">Asignado</span>
          <span class="metric-value">S/. {{ showPayments ? Number(currentPaymentsAmount).toFixed(2) : '0.00' }}</span>
        </div>
        <div class="multi-pay-metric" :class="evalPayments ? 'lacking-metric' : 'exact-metric'">
          <span class="metric-label">{{ evalPayments ? 'Faltante' : 'Cuadrado' }}</span>
          <span class="metric-value">S/. {{ showPayments ? Math.abs(parseFloat(sale.amount - currentPaymentsAmount)).toFixed(2) : '0.00' }}</span>
        </div>
      </div>

      <div class="multi-pay-inputs-section">
        <span class="multi-pay-section-title">Desglose de Métodos:</span>
        <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
          <template #default="{ value }">
            <div class="multi-pay-row">
              <n-select 
                class="multi-pay-select"
                v-model:value="value.payment_method" 
                :options="filteredMethods" 
                :disabled="loading" 
                placeholder="Seleccionar medio..."
                size="small"
              />
              <n-input-number 
                class="multi-pay-amount"
                size="small"
                v-model:value="value.amount" 
                placeholder="0.00" 
                :min="0"
                :precision="2"
                :step="1"
                :disabled="loading"
              >
                <template #prefix>S/.</template>
              </n-input-number>
            </div>
          </template>
        </n-dynamic-input>
      </div>

      <template #action>
        <div class="multi-pay-actions">
          <n-button 
            class="multi-pay-cancel-btn" 
            size="medium"
            @click="showPayments = false; sale.payments = null"
          >
            Cancelar
          </n-button>
          <n-button 
            class="pos-cobrar-btn multi-pay-confirm-btn" 
            type="primary" 
            size="medium"
            :disabled="evalPayments || sale.payments.some(p => p.payment_method === null) ||
              sale.payments.some(p => Number(p.amount) <= 0) || loading" 
            :loading="loading"
            @click="performCreateSale"
          >
            <template #icon>
              <v-icon name="md-check-round" scale="1.1" />
            </template>
            Confirmar Pago
          </n-button>
        </div>
      </template>
    </n-modal>
    <separate-payments-modal v-model:show="showSeparateModal" :data="separatePayments"
      @success="obtainSaleNumber" />
    <PreviewDrawer ref="previewDrawer" v-model:show="showPdf" :data="pdfData" :previewOnly="!ticketPreview"
      @printed="$router.push({ name: 'TableHome' })" @canceled="$router.push({ name: 'TableHome' })" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SeparatePaymentsModal from "./SeparatePaymentsModal";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import ClientSelectInput from "@/views/Customer/components/ClientSelectInput.vue";
import PaymentBrandIcon from "./PaymentBrandIcon.vue";
import SaleSerieSelector from "@/views/Order/components/SaleSerieSelector.vue";
import PaymentTotals from "@/views/Order/components/PaymentTotals.vue";
import ProductTable from "@/views/Order/components/ProductTable.vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useRouter, useRoute } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useTableStore } from "@/store/modules/table";
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
import { round2 } from "@/utils/money";


const router = useRouter();
const route = useRoute();
const tableStore = useTableStore();
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
const selectedCustomer = ref(null);
const isManualGivenAmount = ref(false);
const previousTotalAmount = ref(0);

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

// Asegurar que si el usuario editó las afectaciones en toSale, los totales reactivos reflejen exactamente toSale
const totalsFromToSale = computed(() => {
  const toSale = saleStore.toSale || [];
  const menuSets = saleStore.salePayload?.sale_product_sets || [];

  const taxed = toSale
    .filter((d) => Number(d.product_affectation) === 10)
    .reduce((acc, d) => acc + (Number(d.price_sale || 0) - Number(d.igv_tax || 0)) * Number(d.quantity || 0), 0);

  const exemptProducts = toSale
    .filter((d) => Number(d.product_affectation) === 20)
    .reduce((acc, d) => acc + Number(d.price_sale || 0) * Number(d.quantity || 0), 0);

  const menuSum = menuSets.reduce(
    (acc, m) => acc + Number(m.price || 0) * Number(m.quantity || 0),
    0
  );

  const free = toSale
    .filter((d) => Number(d.product_affectation) === 21)
    .reduce((acc, d) => acc + Number(d.price_sale || 0) * Number(d.quantity || 0), 0);

  const igv = toSale.reduce(
    (acc, d) => acc + Number(d.igv_tax || 0) * Number(d.quantity || 0),
    0
  );

  return {
    taxed: round2(taxed),
    exempt: round2(exemptProducts + menuSum),
    free: round2(free),
    igv: round2(igv),
  };
});

const totalGRV = computed(() => totalsFromToSale.value.taxed);
const totalEXN = computed(() => totalsFromToSale.value.exempt);
const totalGRT = computed(() => totalsFromToSale.value.free);
const totalIGV = computed(() => totalsFromToSale.value.igv);
const totalDSCT = computed(() => saleStore.toSale.some((d) => Number(d.discount) > 0)
  ? saleStore.toSale.reduce((acc, cur) => acc + Number(cur.discount), 0)
  : parseFloat(sale.value.discount || 0)
);

const subTotal = computed(() => round2(totalGRV.value + totalEXN.value + totalIGV.value));

const total = computed(() => {
  let cal = parseFloat(
    subTotal.value - parseFloat(totalDSCT.value) + icbper.value + parseFloat(sale.value.other_charges || 0)
  );
  if (sale.value.delivery_info) {
    cal += parseFloat(sale.value.delivery_info.amount || 0);
  }
  return Math.max(0, cal).toFixed(2);
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

const changing = computed(() => {
  const given = Number(sale.value.given_amount) || 0;
  const tot = Number(total.value) || 0;
  return given > tot ? (given - tot).toFixed(2) : "0.00";
});

const paymentTotalsItems = computed(() => {
  const hasItemDiscount = saleStore.toSale.some(d => Number(d.discount) > 0);
  const currentOtherCharges = Number(sale.value.other_charges) || 0;
  const currentDiscount = Number(totalDSCT.value) || 0;

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
      editable: Boolean(settingsStore.businessSettings?.sale?.show_discount_label ?? settingsStore.business_settings?.sale?.show_discount_label ?? true),
      field: "discount",
      step: 0.5,
      disabled: hasItemDiscount || currentOtherCharges > 0,
      max: discountInputMax.value
    },
    {
      label: "OTROS CARGOS",
      value: sale.value.other_charges || 0,
      editable: true,
      field: "other_charges",
      step: 0.5,
      disabled: currentDiscount > 0
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
      const currentGiven = Number(sale.value.given_amount) || 0;
      const currentTotal = Number(total.value) || 0;
      const prevTotal = Number(previousTotalAmount.value) || 0;

      // Sincronizar automáticamente si no se ha digitado manualmente un billete mayor,
      // si el monto anterior era exacto (ej. al cambiar un producto a gratuito), o si el recibido es menor al total
      if (
        !isManualGivenAmount.value ||
        Math.abs(currentGiven - prevTotal) < 0.01 ||
        currentGiven < currentTotal ||
        currentGiven === 0
      ) {
        sale.value.given_amount = currentTotal > 0 ? total.value : parseFloat(0).toFixed(2);
        if (currentGiven < currentTotal) {
          isManualGivenAmount.value = false;
        }
      }
      previousTotalAmount.value = currentTotal;
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

watch(
  () => sale.value.payment_method,
  (newMethod) => {
    if (Number(newMethod) !== 1) {
      isManualGivenAmount.value = false;
      sale.value.given_amount = total.value;
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
  const isInvoice = Number(sale.value.invoice_type) === 1;
  const rules = {
    customer: {
      ...saleRules.customer,
      required: isInvoice || !(
        sale.value.invoice_type !== 1 &&
        sale.value.payment_condition === 1 &&
        sale.value.given_amount <= 699
      ),
      validator(rule, value) {
        if (isInvoice) {
          const customerId = typeof value === 'object' ? value?.id : value;
          if (!customerId || customerId === 1) {
            return new Error("Para emitir Factura es obligatorio un cliente con RUC (11 dígitos).");
          }
          if (selectedCustomer.value) {
            const docType = String(selectedCustomer.value.doc_type || "");
            const docNum = String(selectedCustomer.value.doc_num || "").trim();
            if (docType !== "6" || docNum.length !== 11 || !/^\d{11}$/.test(docNum)) {
              return new Error("El cliente seleccionado debe tener un RUC válido de 11 dígitos.");
            }
          }
        }
        return true;
      },
      trigger: ["blur", "change"],
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
  isManualGivenAmount.value = false;
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
    selectedCustomer.value = null;
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
    const dVal = parseFloat(value) || 0;
    sale.value.discount = dVal;
    if (dVal > 0) {
      sale.value.other_charges = "0.00";
    }
  } else if (field === 'other_charges') {
    const cVal = parseFloat(value) || 0;
    sale.value.other_charges = cVal;
    if (cVal > 0) {
      sale.value.discount = 0;
    }
  }
};

const handlePaymentChange = (value) => {
  sale.value.given_amount = parseFloat(value) || 0;
};

const currentTableName = computed(() => tableStore.getTableByID(route.params.table)?.description || 'Mesa');

const totalProductCount = computed(() => {
  const detailsCount = (saleStore.toSale || []).reduce((acc, d) => acc + Number(d.quantity || 0), 0);
  const menuSetsCount = (saleStore.salePayload?.sale_product_sets || []).reduce((acc, m) => acc + Number(m.quantity || 0), 0);
  return detailsCount + menuSetsCount;
});

const navigateBackToTakeOrder = () => {
  const dest = route.matched.some(r => r.name === 'WaiterMode') ? 'WProductCategories' : 'ProductCategories';
  router.push({ name: dest, params: { table: route.params.table } });
};

const hasItemDiscount = computed(() => saleStore.toSale.some(d => Number(d.discount) > 0));

const canEditDiscount = computed(() => Boolean(settingsStore.businessSettings?.sale?.show_discount_label ?? settingsStore.business_settings?.sale?.show_discount_label ?? true));

const handleDiscountChange = (val) => {
  handleValueChange({ field: 'discount', value: val });
};

const handleChargesChange = (val) => {
  handleValueChange({ field: 'other_charges', value: val });
};

const formatNumber = (val) => {
  const num = parseFloat(val);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
};

const handlePaymentGivenInput = (val) => {
  const num = parseFloat(val || 0);
  const tot = Number(total.value) || 0;
  if (Math.abs(num - tot) < 0.01) {
    isManualGivenAmount.value = false;
  } else {
    isManualGivenAmount.value = true;
  }
  sale.value.given_amount = num.toFixed(2);
};

const paymentInputModel = computed({
  get: () => {
    const val = parseFloat(sale.value.given_amount);
    return Number.isFinite(val) ? val : 0;
  },
  set: (val) => {
    handlePaymentGivenInput(val);
  }
});

const changeStatusLabel = computed(() => {
  if (sale.value.payment_condition === 2) return "A CRÉDITO";
  const given = Number(sale.value.given_amount) || 0;
  const tot = Number(total.value) || 0;
  if (given > tot) {
    return "VUELTO";
  }
  if (given === tot) {
    return "EXACTO";
  }
  return "FALTANTE";
});

const changeStatusClass = computed(() => {
  if (sale.value.payment_condition === 2) return "status-credit";
  const given = Number(sale.value.given_amount) || 0;
  const tot = Number(total.value) || 0;
  if (given > tot) {
    return "status-success";
  }
  if (given === tot) {
    return "status-neutral";
  }
  return "status-warning";
});

const changeStatusValue = computed(() => {
  if (sale.value.payment_condition === 2) return "0.00";
  const given = Number(sale.value.given_amount) || 0;
  const tot = Number(total.value) || 0;
  if (given >= tot) {
    return (given - tot).toFixed(2);
  }
  return (tot - given).toFixed(2);
});

const quickCashOptions = computed(() => {
  const tot = Number(total.value) || 0;
  const standardBills = [20, 50, 100, 200];
  let candidates = [...standardBills];
  if (tot >= 200) {
    const next100 = Math.ceil(tot / 100) * 100;
    candidates.push(next100 === tot ? next100 + 50 : next100);
    candidates.push((next100 === tot ? next100 + 50 : next100) + 50);
  }
  return candidates
    .filter(b => b > tot)
    .slice(0, 3)
    .map(b => ({ label: `S/ ${b}`, value: b }));
});

const setQuickCash = (val) => {
  const numVal = Number(val);
  const tot = Number(total.value) || 0;
  if (Math.abs(numVal - tot) < 0.01) {
    isManualGivenAmount.value = false;
  } else {
    isManualGivenAmount.value = true;
  }
  sale.value.given_amount = numVal.toFixed(2);
};

const getMethodIcon = (label = "") => {
  const up = String(label).toUpperCase();
  if (up.includes("EFECTIVO")) return "bi-cash-coin";
  if (up.includes("YAPE") || up.includes("PLIN")) return "ri-send-plane-fill";
  if (up.includes("TARJETA") || up.includes("POS") || up.includes("VISA") || up.includes("MASTERCARD")) return "bi-credit-card-2-front";
  if (up.includes("TRANSFERENCIA") || up.includes("BANCO") || up.includes("BANCAR") || up.includes("DEPOSIT")) return "bi-bank";
  return "md-pointofsale-twotone";
};

const getMethodClass = (label = "") => {
  const up = String(label).toUpperCase();
  if (up.includes("EFECTIVO")) return "pm-efectivo";
  if (up.includes("YAPE")) return "pm-yape";
  if (up.includes("PLIN")) return "pm-plin";
  if (up.includes("TUNKI")) return "pm-tunki";
  if (up.includes("TARJETA") || up.includes("POS") || up.includes("VISA") || up.includes("MASTERCARD")) return "pm-tarjeta";
  if (up.includes("TRANSFERENCIA") || up.includes("BANCO") || up.includes("BANCAR") || up.includes("DEPOSIT")) return "pm-transfer";
  return "pm-default";
};

const performCreateSale = () => {
  saleForm.value.validate((errors) => {
    if (errors) {
      if (formRules.value.customer.required) {
        const msg = sale.value.invoice_type === 1
          ? "Debes agregar un cliente con RUC válido para emitir Factura"
          : "Debes agregar un cliente porque la venta es mayor a S/ 699";
        message.warning(msg);
      } else {
        message.error("Datos Incorrectos");
      }
      return;
    }

    if (sale.value.invoice_type === 1) {
      const customerId = typeof sale.value.customer === 'object' ? sale.value.customer?.id : sale.value.customer;
      if (!customerId || customerId === 1) {
        message.warning("Para emitir Factura Electrónica es obligatorio seleccionar un cliente con RUC (11 dígitos).");
        return;
      }
      if (selectedCustomer.value) {
        const docType = String(selectedCustomer.value.doc_type || "");
        const docNum = String(selectedCustomer.value.doc_num || "").trim();
        if (docType !== "6" || docNum.length !== 11 || !/^\d{11}$/.test(docNum)) {
          message.warning("El cliente seleccionado no cuenta con un RUC válido (11 dígitos numéricos).");
          return;
        }
      }
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
        sale.value.taxed_amount = totalGRV.value;
        sale.value.exempt_amount = totalEXN.value;
        sale.value.free_amount = totalGRT.value;
        sale.value.igv_amount = totalIGV.value;
        sale.value.amount = total.value;
        sale.value.order = orderStore.orderId;
        sale.value.sale_details = saleStore.toSale.map(detail => ({
          ...detail,
          igv_tax: Number(detail.igv_tax || 0).toFixed(2),
          price_base: Number(detail.price_base || 0).toFixed(2)
        }));
        // Use buildSalePayload to get both arrays
        const payload = saleStore.buildSalePayload();
        sale.value.sale_product_sets = payload.sale_product_sets;
        sale.value.discount = totalDSCT.value;

        // Asegurar que si no es pago múltiple o payments está vacío, se envíe el payment_method seleccionado
        if (!isMultiple.value || !sale.value.payments || !sale.value.payments.length) {
          sale.value.payments = [
            { payment_method: sale.value.payment_method, amount: String(sale.value.amount) }
          ];
        }

        try {
          const response = await createSale(sale.value);
          if (response.status === 201) {
            const res = await retrieveSale(response.data?.id);
            pdfData.value = res.data;
            pdfData.value.original_sale_details = [
              ...sale.value.sale_details, 
              ...(sale.value.sale_product_sets || [])
            ];
            if (sale.value.payments?.length) {
              pdfData.value.payments = normalizePaymentsForTicket(sale.value.payments);
            }

            showPdf.value = true;
            if (settingsStore.business_settings.printer.print_html) {
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
            }

            if (settingsStore.businessSettings.sale.auto_send && String(sale.value.invoice_type) !== "80") {
              try {
                const sendResponse = await sendSale(response.data.id);
                if (sendResponse.status === 200) {
                  if (sendResponse.data?.warning_message) {
                    message.warning(sendResponse.data.warning_message, { duration: 10000 });
                  } else {
                    message.success("Enviado!");
                  }
                }
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
  selectedCustomer.value = customer;
  createAddressesOptions(customer);
};

const handleCustomerCleared = () => {
  selectedCustomer.value = null;
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

<style scoped>
.pos-billing-wrapper {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

:deep(.n-spin-container),
:deep(.n-spin-content) {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

.pos-billing-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(380px, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
  align-items: stretch;
}

.pos-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
  overflow: hidden;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* Columna Izquierda: Cuenta */
.pos-account-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-badge {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.item-count-tag {
  font-weight: 600;
}

.products-scroll-viewport {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.products-scroll-viewport::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

:deep(.n-scrollbar-rail) {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

:deep(.n-scrollbar-container) {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

:deep(.n-scrollbar-container::-webkit-scrollbar) {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

:deep(.product-details-table) {
  font-size: 11.5px;
}

:deep(.product-details-table th) {
  position: sticky;
  top: 0;
  background: #f8fafc !important;
  z-index: 5;
  font-weight: 700;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 6px 8px !important;
}

:deep(.product-details-table td) {
  padding: 5px 6px !important;
  font-size: 11.5px;
  border-bottom: 1px solid #f1f5f9;
  line-height: 1.25;
}

:deep(.product-details-table tr:hover td) {
  background-color: #fff7ed !important;
}

:deep(.product-details-table .custom-input) {
  font-size: 11.5px !important;
  padding: 2px 4px !important;
  color: #1e293b;
}

:deep(.product-details-table .n-tag) {
  height: 20px !important;
  line-height: 18px !important;
  padding: 0 6px !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  border-radius: 5px !important;
}

.panel-footer {
  flex-shrink: 0;
  padding: 8px 14px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.account-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.account-subtotal-label {
  color: #334155;
  font-size: 13px;
}

.pos-checkout-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px 28px 12px;
  gap: 6px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.pos-checkout-panel::-webkit-scrollbar {
  width: 5px;
}
.pos-checkout-panel::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}
.pos-checkout-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.pos-checkout-panel::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.checkout-submit-wrapper {
  margin-top: 2px;
  padding-bottom: 12px;
  flex-shrink: 0;
}

.checkout-header-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.checkout-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkout-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.doc-selectors-row {
  display: flex;
  width: 100%;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 9px;
}

.doc-type-group {
  display: flex;
  width: 100%;
}

.doc-selectors-row :deep(.n-radio-group) {
  display: flex;
  width: 100%;
  background: transparent;
  gap: 3px;
}

.doc-selectors-row :deep(.n-radio-button) {
  flex: 1;
  text-align: center;
  border: none !important;
  background: transparent !important;
  border-radius: 7px !important;
  font-size: 11px;
  font-weight: 700;
  color: #64748b !important;
  padding: 4px 6px;
  box-shadow: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.doc-selectors-row :deep(.n-radio-button::before) {
  display: none !important;
}

.doc-selectors-row :deep(.n-radio-button.n-radio-button--checked) {
  background: #ffffff !important;
  color: #0f172a !important;
  font-weight: 800 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
}

.payment-condition-toggle :deep(.n-radio-group) {
  background: #f1f5f9;
  padding: 2px;
  border-radius: 8px;
  display: flex;
}

.payment-condition-toggle :deep(.n-radio-button) {
  border: none !important;
  background: transparent !important;
  border-radius: 6px !important;
  font-size: 11px;
  font-weight: 700;
  color: #64748b !important;
  padding: 2px 8px;
  box-shadow: none !important;
}

.payment-condition-toggle :deep(.n-radio-button::before) {
  display: none !important;
}

.payment-condition-toggle :deep(.n-radio-button.n-radio-button--checked) {
  background: #ffffff !important;
  color: #ea580c !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08) !important;
}

.checkout-client-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.checkout-client-box :deep(.n-input) {
  --n-border-hover: #fdba74 !important;
  --n-border-focus: #ff6b00 !important;
  --n-box-shadow-focus: 0 0 0 2px rgba(255, 107, 0, 0.2) !important;
  border-radius: 7px;
}

.checkout-client-box :deep(.n-button--info-type) {
  background: #ff6b00 !important;
  border-color: #ff6b00 !important;
  color: #ffffff !important;
}

.checkout-client-box :deep(.n-button--info-type:hover) {
  background: #ea580c !important;
  border-color: #ea580c !important;
}

.doc-options-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 5px;
  padding: 0 4px;
}

.consumption-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.client-observations-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

.financial-breakdown {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 11.5px;
}

.financial-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5px 0;
  color: #64748b;
}

.fin-val {
  font-weight: 600;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}

.financial-modifiers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
}

.mod-item {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}

.mod-item:hover {
  border-color: #ff6b00;
}

.mod-label {
  font-size: 10.5px;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mod-item :deep(.n-input) {
  background: #f8fafc !important;
  font-weight: 700;
  font-size: 12px;
  border-radius: 6px;
}

.mod-item :deep(.n-input__prefix) {
  font-weight: 700;
  color: #64748b;
}

.mod-item :deep(.n-input-number-button) {
  background: #e2e8f0 !important;
  color: #0f172a !important;
  font-weight: 900 !important;
  border-radius: 4px;
}

.mod-item :deep(.n-input-number-button:hover) {
  background: #ff6b00 !important;
  color: #ffffff !important;
}

/* Card de Métodos de Pago */
.payment-methods-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.payment-field-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 6px;
  display: block;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.client-header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.client-label {
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
}

.client-type-hint {
  font-size: 10.5px;
  font-weight: 600;
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 1px 7px;
  border-radius: 6px;
}

.pm-tile {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  padding: 6px 8px;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 42px;
  outline: none;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
}

.pm-tile:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.pm-tile .pm-brand-icon {
  flex-shrink: 0;
}

.pm-tile .pm-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #334155;
}

/* EFECTIVO */
.pm-efectivo.pm-tile-active {
  background: #f0fdf4 !important;
  border: 1.5px solid #16a34a !important;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.15) !important;
}
.pm-efectivo.pm-tile-active .pm-name { color: #15803d !important; font-weight: 800; }

/* YAPE */
.pm-yape.pm-tile-active {
  background: #faf5ff !important;
  border: 1.5px solid #9333ea !important;
  box-shadow: 0 2px 6px rgba(147, 51, 234, 0.15) !important;
}
.pm-yape.pm-tile-active .pm-name { color: #7e22ce !important; font-weight: 800; }

/* PLIN */
.pm-plin.pm-tile-active {
  background: #f0fdfa !important;
  border: 1.5px solid #06b6d4 !important;
  box-shadow: 0 2px 6px rgba(6, 182, 212, 0.15) !important;
}
.pm-plin.pm-tile-active .pm-name { color: #0e7490 !important; font-weight: 800; }

/* TARJETA */
.pm-tarjeta.pm-tile-active {
  background: #eff6ff !important;
  border: 1.5px solid #2563eb !important;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15) !important;
}
.pm-tarjeta.pm-tile-active .pm-name { color: #1d4ed8 !important; font-weight: 800; }

/* TUNKI */
.pm-tunki.pm-tile-active {
  background: #fff7ed !important;
  border: 1.5px solid #ea580c !important;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.15) !important;
}
.pm-tunki.pm-tile-active .pm-name { color: #c2410c !important; font-weight: 800; }

/* BANCO / TRANSFERENCIA */
.pm-transfer.pm-tile-active {
  background: #eef2ff !important;
  border: 1.5px solid #4f46e5 !important;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.15) !important;
}
.pm-transfer.pm-tile-active .pm-name { color: #4338ca !important; font-weight: 800; }

/* Banner del TOTAL - Flizzy Signature Card */
.flizzy-total-card {
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
  border: 1.5px solid #fed7aa;
  border-left: 5px solid #ff6b00;
  border-radius: 12px;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px -2px rgba(255, 107, 0, 0.08);
}

.flizzy-total-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.flizzy-total-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #c2410c;
  text-transform: uppercase;
}

.flizzy-total-sub {
  font-size: 10.5px;
  color: #9a3412;
  font-weight: 500;
  opacity: 0.85;
}

.flizzy-total-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.flizzy-currency {
  font-size: 15px;
  font-weight: 700;
  color: #c2410c;
}

.flizzy-digits {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* Settlement Control Card */
.settlement-control-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.settlement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.settlement-field-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 170px;
}

.settlement-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
}

.payment-given-input {
  flex: 1;
}

.payment-given-input :deep(.n-input) {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  border-radius: 8px;
}

.quick-cash-chips-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-cash-chip {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-cash-chip:hover {
  background: #fff7ed;
  border-color: #fdba74;
  color: #c2410c;
}

.exact-chip {
  background: #fff7ed;
  border-color: #fdba74;
  color: #ea580c;
  font-weight: 800;
}

.exact-chip:hover {
  background: #ffedd5;
  border-color: #fb923c;
}

.vuelto-state-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  border-radius: 9px;
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}

.vuelto-label-group {
  display: flex;
  flex-direction: column;
}

.vuelto-title {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.vuelto-hint {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.85;
}

.vuelto-value {
  font-size: 18px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.status-success {
  background: #f0fdf4;
  border-color: #86efac;
  color: #15803d;
}

.status-neutral {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

.status-warning {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
}

.status-credit {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.checkout-footer-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-top: auto;
  padding-top: 6px;
}

.checkout-submit-wrapper {
  margin-top: 6px;
}

.checkout-footer-options :deep(.n-checkbox.n-checkbox--checked .n-checkbox-box) {
  background-color: #ff6b00 !important;
  border-color: #ff6b00 !important;
}

.flizzy-text-btn {
  color: #ea580c !important;
  font-weight: 700 !important;
  transition: all 0.15s ease;
  font-size: 11px !important;
}

.flizzy-text-btn:hover {
  color: #c2410c !important;
  text-decoration: underline;
}

.flizzy-add-order-btn {
  background: #fff7ed !important;
  border: 1.5px solid #fdba74 !important;
  color: #ea580c !important;
  font-weight: 800 !important;
  border-radius: 8px !important;
  transition: all 0.15s ease;
}

.flizzy-add-order-btn:hover {
  background: #ffedd5 !important;
  border-color: #fb923c !important;
  color: #c2410c !important;
  transform: translateY(-1px);
}

.pos-cobrar-btn {
  height: 48px;
  font-size: 15.5px;
  font-weight: 800;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff6b00 0%, #ea580c 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35) !important;
  letter-spacing: 0.02em;
  transition: all 0.18s ease;
}

.pos-cobrar-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%) !important;
  box-shadow: 0 6px 18px rgba(255, 107, 0, 0.45) !important;
  transform: translateY(-1px);
}

/* ==================================================== */
/* MODAL PAGO MÚLTIPLE FLIZZY                           */
/* ==================================================== */
:deep(.flizzy-payment-modal) {
  border-radius: 16px !important;
  box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.15), 0 4px 12px rgba(15, 23, 42, 0.08) !important;
}
:deep(.flizzy-payment-modal .n-card-header) {
  padding: 16px 20px 12px !important;
  border-bottom: 1px solid #f1f5f9;
}
:deep(.flizzy-payment-modal .n-card-header__main) {
  font-size: 16px !important;
  font-weight: 800 !important;
  color: #0f172a !important;
}
:deep(.flizzy-payment-modal .n-card__content) {
  padding: 16px 20px !important;
}
:deep(.flizzy-payment-modal .n-card__action) {
  padding: 12px 20px !important;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  border-radius: 0 0 16px 16px;
}
.multi-pay-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.multi-pay-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1.5px solid transparent;
}
.multi-pay-metric .metric-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}
.multi-pay-metric .metric-value {
  font-size: 15px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
.total-metric { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.total-metric .metric-label { color: #64748b; }
.assigned-metric { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.assigned-metric .metric-label { color: #16a34a; }
.lacking-metric { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.lacking-metric .metric-label { color: #ea580c; }
.exact-metric { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
.exact-metric .metric-label { color: #059669; }
.multi-pay-section-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 8px;
  display: block;
}
.multi-pay-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.multi-pay-select { flex: 1.2; }
.multi-pay-amount { flex: 1; }
.multi-pay-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
.multi-pay-cancel-btn {
  font-weight: 700;
  border-radius: 9px;
  color: #64748b;
}
.multi-pay-confirm-btn {
  height: 42px !important;
  font-size: 14px !important;
  padding: 0 20px !important;
}

/* ==================================================== */
/* RESPONSIVE PARA DISPOSITIVOS MÓVILES Y TABLETS       */
/* ==================================================== */
@media (max-width: 992px) {
  .pos-billing-wrapper {
    height: auto !important;
    min-height: 100% !important;
    overflow: visible !important;
  }

  .pos-billing-grid {
    grid-template-columns: 1fr;
    height: auto;
    min-height: auto;
  }

  .pos-panel {
    height: auto;
  }

  .products-scroll-viewport {
    max-height: 350px;
  }

  .pos-checkout-panel {
    height: auto !important;
    overflow-y: visible !important;
    padding-bottom: 24px !important;
  }
}
</style>
