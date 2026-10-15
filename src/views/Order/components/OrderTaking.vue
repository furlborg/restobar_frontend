<template>
  <div class="pos-billing-wrapper">
    <n-spin :show="loading">
      <div 
        class="pos-billing-grid"
        :class="{
          'layout-checkout-left': billingLayoutPosition === 'checkout_left',
          'layout-checkout-right': billingLayoutPosition === 'checkout_right'
        }"
      >
        
        <!-- ============================================== -->
        <!-- COLUMNA IZQUIERDA: DETALLE DE CUENTA & PEDIDOS -->
        <!-- ============================================== -->
        <section class="pos-panel pos-account-panel">
          <header class="panel-header">
            <div class="panel-header-left">
              <span class="table-badge">Resumen de Pedidos</span>
              <n-tag round type="info" size="small" class="item-count-tag">
                {{ totalProductCount }} {{ totalProductCount === 1 ? 'ítem' : 'ítems' }}
              </n-tag>
            </div>
            <div class="panel-header-right">
              <n-button size="small" secondary class="flizzy-add-order-btn" @click="$emit('go-back-to-products')">
                <template #icon>
                  <v-icon name="md-arrowback-round" />
                </template>
                Añadir productos
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
        <!-- COLUMNA DERECHA: POS CHECKOUT & LIQUIDACIÓN   -->
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
                  v-model:value="localPaymentCondition"
                  name="saleType"
                  size="small"
                  :disabled="!settingsStore.businessSettings?.sale?.enable_credits"
                  @update:value="handlePaymentConditionChange"
                >
                  <n-radio-button :value="1">Contado</n-radio-button>
                  <n-radio-button :value="2">Crédito</n-radio-button>
                </n-radio-group>
              </div>
            </div>

            <!-- SELECTORES TIPO DOCUMENTO -->
            <div class="doc-selectors-row">
              <n-radio-group
                v-model:value="localInvoiceType"
                name="docType"
                size="small"
                class="w-100 doc-type-group"
                @update:value="handleInvoiceTypeChange"
              >
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

          <!-- CLIENTE / RECEPTOR -->
          <div class="checkout-client-box">
            <div class="client-header-title">
              <span class="client-label">Cliente / Receptor:</span>
              <span class="client-type-hint">
                {{ localInvoiceType === 1 ? 'RUC Obligatorio (Factura)' : (localInvoiceType === 3 ? 'DNI o Varios (Boleta)' : 'Opcional (Nota Venta)') }}
              </span>
            </div>
            <n-form ref="saleForm" :model="sale" :rules="formRules" size="small" :show-label="false">
              <div class="client-input-wrapper">
                <n-form-item path="customer" class="mb-0 w-100">
                  <ClientSelectInput 
                    v-model:customer-name="localCustomerName" 
                    :customer-id="sale.customer"
                    :invoice-type="sale.invoice_type" 
                    placeholder="Buscar o registrar cliente (RUC, DNI, Nombre)..."
                    @update:customerName="handleCustomerNameInput"
                    @customer-selected="handleCustomerSelected" 
                    @customer-cleared="handleCustomerCleared" 
                  />
                </n-form-item>
              </div>

              <!-- Dirección desplegable si el cliente tiene direcciones registradas -->
              <div v-if="addressesOptions.length > 0" class="mt-2">
                <n-select 
                  v-model:value="localAddress" 
                  :options="addressesOptions" 
                  :disabled="!sale.customer"
                  placeholder="Seleccionar dirección registrada..." 
                  size="small"
                  @update:value="handleAddressChange"
                />
              </div>

              <!-- Observaciones secundarias -->
              <div class="client-observations-row">
                <n-button class="flizzy-text-btn" text size="tiny" @click="$emit('update:showObservations', !showObservations)">
                  <v-icon name="md-notes-round" class="me-1" scale="0.9" />
                  {{ showObservations ? "Ocultar observaciones" : "+ Añadir observaciones" }}
                </n-button>
              </div>

              <n-collapse-transition :show="showObservations">
                <div class="mt-2">
                  <n-input 
                    type="textarea" 
                    v-model:value="localObservations" 
                    placeholder="Notas o indicaciones del pedido..." 
                    :rows="2" 
                    size="small"
                    @update:value="handleObservationsChange" 
                  />
                </div>
              </n-collapse-transition>
            </n-form>
          </div>

          <!-- ============================================== -->
          <!-- SECCIÓN DELIVERY / PARA LLEVAR (UNIFICADA)     -->
          <!-- ============================================== -->
          <div class="delivery-control-card">
            <!-- Caso 1: Delivery y Para Llevar JUNTAS (divide_delivery_takeaway = false) -->
            <div v-if="showDeliveryCheckbox" class="delivery-toggle-row">
              <div class="delivery-toggle-info">
                <div class="delivery-icon-pill" :class="{ 'is-active': isDeliveryActive }">
                  <v-icon name="md-deliverydining" scale="1.15" />
                </div>
                <div>
                  <span class="delivery-mode-title">Tipo de Entrega</span>
                  <span class="delivery-mode-sub">
                    {{ isDeliveryActive ? 'Envío a Domicilio (Delivery)' : 'Para Llevar / Recojo en Tienda' }}
                  </span>
                </div>
              </div>
              <n-switch 
                :value="isDeliveryActive" 
                size="medium"
                @update:value="toggleDeliveryMode"
              >
                <template #checked>Delivery</template>
                <template #unchecked>Para Llevar</template>
              </n-switch>
            </div>

            <!-- Caso 2: Separadas (divide_delivery_takeaway = true) -->
            <div v-else class="delivery-mode-badge-row">
              <div class="d-flex align-items-center gap-2">
                <div class="delivery-icon-pill is-active">
                  <v-icon :name="forceDelivery ? 'md-deliverydining' : 'ri-shopping-bag-2-fill'" scale="1.15" />
                </div>
                <div>
                  <span class="delivery-mode-title">{{ forceDelivery ? 'Pedido para Delivery' : 'Pedido Para Llevar' }}</span>
                  <span class="delivery-mode-sub">{{ forceDelivery ? 'Envío con motorizado' : 'Entrega directa en mostrador' }}</span>
                </div>
              </div>
            </div>

            <!-- Campos de Información de Delivery cuando Delivery está ACTIVO -->
            <n-collapse-transition :show="isDeliveryActive">
              <div class="delivery-fields-wrapper">
                <div class="delivery-grid-form">
                  <div class="form-field-item">
                    <span class="field-label">Nombre Contacto *</span>
                    <n-input 
                      v-model:value="localDeliveryInfo.person" 
                      placeholder="Persona que recibe..." 
                      size="small"
                      @update:value="handleDeliveryPersonChange" 
                    />
                  </div>
                  <div class="form-field-item">
                    <span class="field-label">Teléfono *</span>
                    <n-input 
                      v-model:value="localDeliveryInfo.phone" 
                      placeholder="N° Teléfono..." 
                      size="small"
                      maxlength="15"
                      @update:value="handleDeliveryPhoneChange" 
                    />
                  </div>
                  <div class="form-field-item span-full">
                    <span class="field-label">Dirección de Entrega *</span>
                    <n-input 
                      v-model:value="localDeliveryInfo.address" 
                      placeholder="Calle, número, urbanización, referencia..." 
                      size="small"
                      @update:value="handleDeliveryAddressChange" 
                    />
                  </div>
                  <div class="form-field-item span-full">
                    <span class="field-label">Repartidor / Motorizado</span>
                    <n-input 
                      v-model:value="localDeliveryInfo.deliveryman" 
                      placeholder="Asignar repartidor..." 
                      size="small"
                      @update:value="handleDeliverymanChange" 
                    />
                  </div>
                </div>
              </div>
            </n-collapse-transition>
          </div>

          <!-- MÉTODO DE PAGO (TILES VISUALES FLIZZY) -->
          <div class="payment-methods-card">
            <span class="payment-field-label">Método de Pago:</span>
            <div class="payment-methods-grid">
              <button
                v-for="pm in saleStore.getPaymentMethodsOptions"
                :key="pm.value"
                type="button"
                class="pm-tile"
                :class="{ 'pm-tile-active': localPaymentMethod === pm.value, [getMethodClass(pm.label)]: true }"
                @click="selectPaymentMethod(pm.value)"
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
              <span class="flizzy-total-sub">
                {{ localPaymentCondition === 2 ? 'Venta registrada a crédito' : 'Monto total del pedido' }}
              </span>
            </div>
            <div class="flizzy-total-price">
              <span class="flizzy-currency">S/.</span>
              <span class="flizzy-digits">{{ formatNumber(totalAmount) }}</span>
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
                  :value="Number(sale.given_amount || 0)" 
                  :min="0" 
                  :precision="2" 
                  :step="1"
                  :disabled="localPaymentCondition === 2"
                  @update:value="handlePaymentInput"
                  @click="$event.target?.select?.()"
                >
                  <template #prefix>S/.</template>
                </n-input-number>
              </div>

              <!-- ATAJOS DE BILLETES RÁPIDOS -->
              <div v-if="localPaymentCondition === 1" class="quick-cash-chips-group">
                <button 
                  type="button" 
                  class="quick-cash-chip exact-chip"
                  @click="setQuickCash(Number(totalAmount))"
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
                <span class="vuelto-hint" v-else-if="changeStatusClass === 'status-neutral'">Monto exacto sin vuelto</span>
                <span class="vuelto-hint" v-else-if="changeStatusClass === 'status-warning'">Monto insuficiente</span>
                <span class="vuelto-hint" v-else>Operación al crédito</span>
              </div>
              <div class="vuelto-value">
                S/. {{ formatNumber(changeStatusValue) }}
              </div>
            </div>
          </div>

          <!-- DESGLOSE TRIBUTARIO / FINANCIERO -->
          <div class="financial-breakdown">
            <div class="financial-row">
              <span class="fin-label">Subtotal</span>
              <span class="fin-val">S/. {{ formatNumber(subTotal) }}</span>
            </div>
            <div v-if="Number(totalExn) > 0" class="financial-row">
              <span class="fin-label">Op. Exoneradas</span>
              <span class="fin-val">S/. {{ formatNumber(totalExn) }}</span>
            </div>
            <div v-if="Number(totalGrv) > 0" class="financial-row">
              <span class="fin-label">Op. Gravadas</span>
              <span class="fin-val">S/. {{ formatNumber(totalGrv) }}</span>
            </div>
            <div v-if="Number(totalIgv) > 0" class="financial-row">
              <span class="fin-label">IGV</span>
              <span class="fin-val">S/. {{ formatNumber(totalIgv) }}</span>
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
                  :value="Number(totalDsct || 0)" 
                  :min="0" 
                  :max="discountInputLimit" 
                  :step="0.5" 
                  :precision="2" 
                  :disabled="hasItemDiscount || Number(sale.other_charges) > 0"
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
                  :disabled="Number(totalDsct) > 0"
                  @update:value="handleChargesChange"
                >
                  <template #prefix>S/.</template>
                </n-input-number>
              </div>
            </div>
          </div>

          <!-- OPCIONES SECUNDARIAS -->
          <div class="checkout-footer-options">
            <n-checkbox v-model:checked="localTicketPreview" size="small" @update:checked="handleTicketPreviewChange">
              Previsualizar ticket
            </n-checkbox>

            <div v-if="localPaymentCondition === 1" class="d-flex align-items-center gap-2">
              <n-checkbox 
                v-model:checked="localIsMultiple" 
                :disabled="settingsStore.businessSettings.order?.pending_takeaway"
                size="small" 
                @update:checked="handleIsMultipleChange"
              >
                Pago múltiple
              </n-checkbox>
            </div>
          </div>

          <!-- BOTÓN PRINCIPAL COBRAR -->
          <div class="checkout-submit-wrapper">
            <n-button 
              class="pos-cobrar-btn" 
              type="primary" 
              :disabled="isPaymentDisabled" 
              :loading="loading"
              block 
              @click.prevent="handleMainAction"
            >
              <template #icon>
                <v-icon name="md-check-round" scale="1.2" />
              </template>
              {{ userStore.user.role !== "MOZO" ? `Cobrar S/. ${formatNumber(totalAmount)}` : 'Realizar pedido' }}
            </n-button>
          </div>

        </section>

      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useSaleStore } from "@/store/modules/sale";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import { useMessage } from "naive-ui";
import { useSaleTotals } from "@/composables/useSaleTotals";
import ProductTable from "./ProductTable.vue";
import ClientSelectInput from "@/views/Customer/components/ClientSelectInput.vue";
import SaleSerieSelector from "./SaleSerieSelector.vue";
import PaymentBrandIcon from "@/views/Table/components/PaymentBrandIcon.vue";
import { useRoute } from "vue-router";

const props = defineProps({
  loading: { type: Boolean, required: true },
  sale: { type: Object, required: true },
  showObservations: { type: Boolean, required: true },
  addressesOptions: { type: Array, required: true },
  customerOptions: { type: Array, required: true },
  searchingCustomer: { type: Boolean, required: true },
  whatsappNumber: { type: String, required: true },
  changing: { type: Number, required: true },
  subTotal: { type: Number, required: true },
  totalGrv: { type: Number, required: true },
  totalExn: { type: Number, required: true },
  totalGrt: { type: Number, required: true },
  totalIgv: { type: Number, required: true },
  icbper: { type: Number, required: true },
  totalDsct: { type: Number, required: true },
  isMultiple: { type: Boolean, required: true },
  ticketPreview: { type: Boolean, required: true }
});

const emit = defineEmits([
  'update:sale',
  'update:showObservations',
  'update:isMultiple',
  'update:ticketPreview',
  'selectSerie',
  'changeSerie',
  'changeCondition',
  'autoCreateCustomer',
  'createAddressesOptions',
  'changeAddress',
  'handleDelivery',
  'showCustomerModal',
  'performTakeAway',
  'doMultiplePayment',
  'go-back-to-products'
]);

const route = useRoute();
const saleStore = useSaleStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { grandTotal } = useSaleTotals();
const message = useMessage();

const billingLayoutPosition = computed(() => {
  return settingsStore.businessSettings?.sale?.billing_layout_position || 'checkout_left';
});

const saleForm = ref();

const localInvoiceType = ref(props.sale.invoice_type || 80);
const localPaymentCondition = ref(props.sale.payment_condition || 1);
const localCustomerName = ref(props.sale.customer_name || "");
const localAddress = ref(props.sale.address || null);
const localPaymentMethod = ref(props.sale.payment_method || 1);
const localAskFor = ref(props.sale.ask_for || "");
const localObservations = ref(props.sale.observations || "");
const localDeliveryInfo = ref(props.sale.delivery_info ? { ...props.sale.delivery_info } : { person: "", address: "", phone: "", deliveryman: "" });
const localIsMultiple = ref(props.isMultiple);
const localTicketPreview = ref(props.ticketPreview);
const isManualGivenAmount = ref(false);

const forceDelivery = computed(() => route.query.delivery === "true" || route.query.delivery === true);
const showDeliveryCheckbox = computed(() => !settingsStore.business_settings?.order?.divide_delivery_takeaway);
const isDeliveryActive = computed(() => forceDelivery.value || !!props.sale.delivery_info);

const formatNumber = (val) => (isNaN(val) ? "0.00" : Number(val).toFixed(2));

const totalProductCount = computed(() => {
  const items = saleStore.toSale || [];
  const menus = saleStore.salePayload?.sale_product_sets || [];
  const itemsQty = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const menusQty = menus.reduce((sum, menu) => sum + Number(menu.quantity || 1), 0);
  return itemsQty + menusQty;
});

const hasItemDiscount = computed(() => saleStore.toSale.some(d => Number(d.discount) > 0));

watch(() => props.sale.invoice_type, (newVal) => { localInvoiceType.value = newVal; });
watch(() => props.sale.payment_condition, (newVal) => { localPaymentCondition.value = newVal; });
watch(() => props.sale.customer_name, (newVal) => { localCustomerName.value = newVal; });
watch(() => props.sale.address, (newVal) => { localAddress.value = newVal; });
watch(() => props.sale.payment_method, (newVal) => { localPaymentMethod.value = newVal; });
watch(() => props.sale.ask_for, (newVal) => { localAskFor.value = newVal; });
watch(() => props.sale.observations, (newVal) => { localObservations.value = newVal; });
watch(() => props.sale.delivery_info, (newVal) => {
  if (newVal) {
    localDeliveryInfo.value = { ...newVal };
  }
}, { deep: true });
watch(() => props.isMultiple, (newVal) => { localIsMultiple.value = newVal; });
watch(() => props.ticketPreview, (newVal) => { localTicketPreview.value = newVal; });

onMounted(() => {
  if (!props.sale.serie && saleStore.series.length > 0) {
    const defaultInvoiceType = settingsStore.businessSettings?.sale?.enable_invoices
      ? settingsStore.businessSettings.sale.default_invoice : 80;
    const newSerie = saleStore.getFirstOption(defaultInvoiceType);
    if (newSerie) {
      const updatedSale = { ...props.sale, serie: newSerie };
      emit('update:sale', updatedSale);
      emit('selectSerie', newSerie);
    }
  }

  if (forceDelivery.value && !props.sale.delivery_info) {
    emit('handleDelivery', true);
  }
});

const formRules = computed(() => {
  const isInvoice = Number(props.sale.invoice_type) === 1;
  const rules = {
    customer: {
      type: "any",
      required: isInvoice || !(props.sale.invoice_type !== 1 && props.sale.payment_condition === 1 && parseFloat(props.sale.given_amount) < 699),
      validator: (_, value) => {
        if (isInvoice) {
          const customerId = typeof value === 'object' ? value?.id : value;
          if (!customerId || customerId === 1) {
            return new Error("Para emitir Factura es obligatorio seleccionar un cliente con RUC (11 dígitos)");
          }
          const customerObj = typeof value === 'object' ? value : null;
          if (customerObj) {
            const docType = String(customerObj.doc_type || "");
            const docNum = String(customerObj.doc_num || "").trim();
            if (docType !== "6" || docNum.length !== 11 || !/^\d{11}$/.test(docNum)) {
              return new Error("El cliente seleccionado debe tener un RUC válido de 11 dígitos");
            }
          }
        }
        return true;
      },
      trigger: ["blur", "input", "change"],
      message: "Para emitir Factura es obligatorio un cliente con RUC válido."
    }
  };

  if (isDeliveryActive.value) {
    rules.delivery_info = {
      person: { required: true, trigger: ["blur", "input"], message: "Campo requerido" },
      address: { required: true, trigger: ["blur", "change"], message: "Campo requerido" },
      phone: { required: true, trigger: ["blur", "change"], message: "Campo requerido" }
    };
  }
  return rules;
});

const totalAmount = computed(() => {
  const icbperVal = Number(props.icbper || 0);
  const result = Number(props.subTotal || 0) + icbperVal + Number(props.sale.other_charges || 0) - Number(props.totalDsct || 0);
  return Math.max(0, result);
});

// Watcher para sincronizar amount y given_amount
watch(totalAmount, (newTotal, oldTotal) => {
  if (newTotal > 0) {
    const updates = { ...props.sale, amount: parseFloat(newTotal).toFixed(2) };
    const currentGiven = Number(props.sale.given_amount || 0);
    const prevTotal = Number(oldTotal || 0);
    const numNewTotal = Number(newTotal);

    if (
      !isManualGivenAmount.value ||
      !props.sale.given_amount ||
      currentGiven === 0 ||
      Math.abs(currentGiven - prevTotal) < 0.01 ||
      currentGiven < numNewTotal
    ) {
      updates.given_amount = parseFloat(newTotal).toFixed(2);
      if (currentGiven < numNewTotal) {
        isManualGivenAmount.value = false;
      }
    }
    emit('update:sale', updates);
  }
}, { immediate: true });

const isPaymentDisabled = computed(() => {
  const hasRegularProducts = (saleStore.toSale || []).length > 0;
  const hasMenuSets = (saleStore.salePayload?.sale_product_sets || []).length > 0;
  const hasAnyItems = hasRegularProducts || hasMenuSets;

  const givenAmount = Number(props.sale.given_amount) || 0;
  const totalAmountValue = Number(totalAmount.value) || 0;
  const isCashPayment = props.sale.payment_condition === 1;

  if (!hasAnyItems) return true;
  if (isCashPayment && givenAmount < totalAmountValue) return true;
  if (!isCashPayment && !(givenAmount < totalAmountValue)) return true;
  return false;
});

// Handlers cliente
const handleCustomerSelected = (customer) => {
  localCustomerName.value = `${customer.doc_num} - ${customer.names}`;
  const updatedSale = { ...props.sale };
  updatedSale.customer = customer;
  updatedSale.customer_name = localCustomerName.value;
  updatedSale.addresses = customer.addresses?.length > 0 ? customer.addresses : null;
  if (isDeliveryActive.value) {
    localDeliveryInfo.value.person = customer.names || "";
    localDeliveryInfo.value.phone = customer.phone || "";
    localDeliveryInfo.value.address = customer.addresses?.length > 0 ? customer.addresses[0].description : "";
    updatedSale.delivery_info = { ...localDeliveryInfo.value };
  }
  emit('update:sale', updatedSale);
  emit('createAddressesOptions', customer);
};

const handleCustomerCleared = () => {
  localCustomerName.value = "";
  const updatedSale = { ...props.sale, customer: 0, customer_name: "", address: null };
  emit('createAddressesOptions', null);
  emit('update:sale', updatedSale);
};

const handleCustomerNameInput = (value) => {
  localCustomerName.value = value;
  const updatedSale = { ...props.sale, customer_name: value };
  if (!value) {
    updatedSale.customer = 0;
    updatedSale.address = null;
  }
  emit('update:sale', updatedSale);
};

// Handlers serie y documento
const handleSerieUpdate = (newSerie) => {
  if (!newSerie) return;
  emit('update:sale', { ...props.sale, serie: newSerie });
  emit('selectSerie', newSerie);
};

const handleSerieChanged = () => {};

const handleInvoiceTypeChange = (value) => {
  localInvoiceType.value = value;
  emit('update:sale', { ...props.sale, invoice_type: value });
  emit('changeSerie', value);
};

const handlePaymentConditionChange = (value) => {
  localPaymentCondition.value = value;
  emit('update:sale', { ...props.sale, payment_condition: value });
  emit('changeCondition', value);
};

const handleAddressChange = (value, option) => {
  localAddress.value = value;
  emit('update:sale', { ...props.sale, address: value });
  emit('changeAddress', value, option);
};

const handleObservationsChange = (value) => {
  localObservations.value = value;
  emit('update:sale', { ...props.sale, observations: value });
};

// Handlers delivery
const toggleDeliveryMode = (value) => {
  emit('handleDelivery', value);
  if (value && !props.sale.delivery_info) {
    localDeliveryInfo.value = {
      person: localCustomerName.value || "",
      address: localAddress.value || "",
      phone: props.sale.customer?.phone || "",
      deliveryman: ""
    };
    emit('update:sale', { ...props.sale, delivery_info: { ...localDeliveryInfo.value } });
  }
};

const handleDeliveryPersonChange = (value) => {
  localDeliveryInfo.value.person = value;
  emit('update:sale', { ...props.sale, delivery_info: { ...localDeliveryInfo.value }, ask_for: value });
};

const handleDeliveryAddressChange = (value) => {
  localDeliveryInfo.value.address = value;
  emit('update:sale', { ...props.sale, delivery_info: { ...localDeliveryInfo.value } });
};

const handleDeliveryPhoneChange = (value) => {
  localDeliveryInfo.value.phone = value;
  emit('update:sale', { ...props.sale, delivery_info: { ...localDeliveryInfo.value } });
};

const handleDeliverymanChange = (value) => {
  localDeliveryInfo.value.deliveryman = value;
  emit('update:sale', { ...props.sale, delivery_info: { ...localDeliveryInfo.value } });
};

// Métodos de pago
const selectPaymentMethod = (value) => {
  localPaymentMethod.value = value;
  const updates = { ...props.sale, payment_method: value };
  if (value !== 1) {
    isManualGivenAmount.value = false;
    updates.given_amount = parseFloat(totalAmount.value).toFixed(2);
  }
  emit('update:sale', updates);
};

const getMethodClass = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("efectivo") || n.includes("cash")) return "pm-efectivo";
  if (n.includes("yape")) return "pm-yape";
  if (n.includes("plin")) return "pm-plin";
  if (n.includes("tarjeta") || n.includes("card") || n.includes("pos")) return "pm-tarjeta";
  if (n.includes("deposito") || n.includes("transfer")) return "pm-deposito";
  return "pm-otro";
};

// Atajos de pago rápido
const quickCashOptions = [
  { label: "+10", value: 10 },
  { label: "+20", value: 20 },
  { label: "+50", value: 50 },
  { label: "+100", value: 100 },
];

const setQuickCash = (amount) => {
  const tot = Number(totalAmount.value);
  if (amount === tot) {
    isManualGivenAmount.value = false;
    handlePaymentInput(tot);
  } else {
    isManualGivenAmount.value = true;
    const current = Number(props.sale.given_amount || 0);
    handlePaymentInput(current + amount);
  }
};

const handlePaymentInput = (val) => {
  const parsed = parseFloat(val || 0).toFixed(2);
  const tot = Number(totalAmount.value);
  if (Math.abs(Number(parsed) - tot) < 0.01) {
    isManualGivenAmount.value = false;
  } else {
    isManualGivenAmount.value = true;
  }
  emit('update:sale', { ...props.sale, given_amount: parsed });
};

// Vuelto banner
const changeStatusClass = computed(() => {
  if (props.sale.payment_condition === 2) return "status-credit";
  const given = Number(props.sale.given_amount || 0);
  const total = Number(totalAmount.value);
  if (given > total) return "status-success";
  if (given === total && total > 0) return "status-neutral";
  return "status-warning";
});

const changeStatusLabel = computed(() => {
  if (props.sale.payment_condition === 2) return "Crédito Pendiente";
  const given = Number(props.sale.given_amount || 0);
  const total = Number(totalAmount.value);
  if (given > total) return "Vuelto a entregar:";
  if (given === total && total > 0) return "Pago exacto:";
  return "Monto faltante:";
});

const changeStatusValue = computed(() => {
  if (props.sale.payment_condition === 2) return totalAmount.value;
  const given = Number(props.sale.given_amount || 0);
  const total = Number(totalAmount.value);
  return Math.abs(given - total);
});

// Modificadores descuento y cargos
const discountInputLimit = computed(() => {
  const base = Number(props.subTotal || 0) + Number(props.icbper || 0) + Number(props.sale.other_charges || 0);
  return Math.max(0, base - 0.01);
});

const handleDiscountChange = (val) => {
  const numVal = Number(val || 0);
  const updates = { ...props.sale, discount: parseFloat(numVal).toFixed(2) };
  if (numVal > 0) updates.other_charges = 0;
  emit('update:sale', updates);
};

const handleChargesChange = (val) => {
  const numVal = Number(val || 0);
  const updates = { ...props.sale, other_charges: parseFloat(numVal).toFixed(2) };
  if (numVal > 0) updates.discount = "0.00";
  emit('update:sale', updates);
};

const handleIsMultipleChange = (value) => {
  localIsMultiple.value = value;
  emit('update:isMultiple', value);
};

const handleTicketPreviewChange = (value) => {
  localTicketPreview.value = value;
  emit('update:ticketPreview', value);
};

const handleMainAction = () => {
  saleForm.value?.validate((errors) => {
    if (!errors) {
      if (props.sale.invoice_type === 1) {
        const customerVal = props.sale.customer;
        const customerId = typeof customerVal === 'object' ? customerVal?.id : customerVal;
        if (!customerId || customerId === 1) {
          message.warning("Para emitir Factura Electrónica es obligatorio seleccionar un cliente con RUC (11 dígitos).");
          return;
        }
        const customerObj = typeof customerVal === 'object' ? customerVal : null;
        if (customerObj) {
          const docType = String(customerObj.doc_type || "");
          const docNum = String(customerObj.doc_num || "").trim();
          if (docType !== "6" || docNum.length !== 11 || !/^\d{11}$/.test(docNum)) {
            message.warning("El cliente seleccionado no cuenta con un RUC válido (11 dígitos numéricos).");
            return;
          }
        }
      }

      if (isDeliveryActive.value) {
        if (!localDeliveryInfo.value.person || !localDeliveryInfo.value.address || !localDeliveryInfo.value.phone) {
          message.warning("Por favor complete los datos obligatorios de Delivery (Nombre, Dirección y Teléfono).");
          return;
        }
      }

      if (userStore.user.role !== "MOZO") {
        if (props.isMultiple) {
          emit('doMultiplePayment');
        } else {
          emit('performTakeAway');
        }
      } else {
        emit('performTakeAway');
      }
    } else {
      message.error("Por favor complete los campos obligatorios");
    }
  }).catch(() => {});
};
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
  grid-template-columns: minmax(0, 1.55fr) minmax(380px, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
  align-items: stretch;
}

@media (min-width: 1440px) {
  .pos-billing-grid {
    grid-template-columns: minmax(0, 1.65fr) minmax(400px, 1fr);
  }
}

/* Modo Predeterminado: Lista a la derecha y Panel de cobro a la izquierda */
.pos-billing-grid.layout-checkout-left {
  grid-template-columns: minmax(380px, 1fr) minmax(0, 1.55fr);
}

@media (min-width: 1440px) {
  .pos-billing-grid.layout-checkout-left {
    grid-template-columns: minmax(400px, 1fr) minmax(0, 1.65fr);
  }
}

.pos-billing-grid.layout-checkout-left .pos-checkout-panel {
  order: 1;
}

.pos-billing-grid.layout-checkout-left .pos-account-panel {
  order: 2;
}

/* Modo Alternativo: Panel a la derecha y Lista a la izquierda */
.pos-billing-grid.layout-checkout-right {
  grid-template-columns: minmax(0, 1.55fr) minmax(380px, 1fr);
}

@media (min-width: 1440px) {
  .pos-billing-grid.layout-checkout-right {
    grid-template-columns: minmax(0, 1.65fr) minmax(400px, 1fr);
  }
}

.pos-billing-grid.layout-checkout-right .pos-account-panel {
  order: 1;
}

.pos-billing-grid.layout-checkout-right .pos-checkout-panel {
  order: 2;
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
  padding: 12px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-badge {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.item-count-tag {
  font-weight: 600;
  font-size: 12.5px;
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

.products-scroll-viewport {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.panel-footer {
  flex-shrink: 0;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.account-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
}

.account-subtotal-label {
  color: #1e293b;
  font-size: 14px;
}

.account-subtotal-label b {
  font-size: 15px;
  color: #0f172a;
}

/* Columna Derecha: Checkout */
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

.client-header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.client-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
}

.client-type-hint {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
}

.client-observations-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
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

/* Delivery Card */
.delivery-control-card {
  background: #ffffff;
  border: 1.5px solid #fed7aa;
  border-radius: 10px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #fffaf5 0%, #ffffff 100%);
}

.delivery-toggle-row,
.delivery-mode-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.delivery-toggle-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delivery-icon-pill {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.delivery-icon-pill.is-active {
  background: #ffedd5;
  color: #ea580c;
  border: 1px solid #fdba74;
}

.delivery-mode-title {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
  display: block;
  line-height: 1.2;
}

.delivery-mode-sub {
  font-size: 10.5px;
  color: #64748b;
}

.delivery-fields-wrapper {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #fed7aa;
}

.delivery-grid-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.form-field-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-field-item.span-full {
  grid-column: span 2;
}

.field-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #475569;
}

/* Métodos de Pago */
.payment-methods-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-field-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.pm-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 5px 3px;
  min-height: 48px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.pm-tile:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.pm-tile .pm-name {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #334155;
}

.pm-efectivo.pm-tile-active {
  background: #f0fdf4 !important;
  border: 1.5px solid #16a34a !important;
}
.pm-efectivo.pm-tile-active .pm-name { color: #15803d !important; font-weight: 800; }

.pm-yape.pm-tile-active {
  background: #faf5ff !important;
  border: 1.5px solid #9333ea !important;
}
.pm-yape.pm-tile-active .pm-name { color: #7e22ce !important; font-weight: 800; }

.pm-plin.pm-tile-active {
  background: #f0fdfa !important;
  border: 1.5px solid #06b6d4 !important;
}
.pm-plin.pm-tile-active .pm-name { color: #0e7490 !important; font-weight: 800; }

.pm-tarjeta.pm-tile-active {
  background: #eff6ff !important;
  border: 1.5px solid #2563eb !important;
}
.pm-tarjeta.pm-tile-active .pm-name { color: #1d4ed8 !important; font-weight: 800; }

.pm-deposito.pm-tile-active {
  background: #f8fafc !important;
  border: 1.5px solid #475569 !important;
}
.pm-deposito.pm-tile-active .pm-name { color: #1e293b !important; font-weight: 800; }

/* Flizzy Total Card */
.flizzy-total-card {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1.5px solid #fed7aa;
  border-left: 5px solid #ff6b00;
  border-radius: 10px;
  padding: 7px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 6px rgba(255, 107, 0, 0.08);
}

.flizzy-total-info {
  display: flex;
  flex-direction: column;
}

.flizzy-total-badge {
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.05em;
  color: #ea580c;
  text-transform: uppercase;
}

.flizzy-total-sub {
  font-size: 10px;
  color: #9a3412;
  font-weight: 600;
}

.flizzy-total-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.flizzy-currency {
  font-size: 14px;
  font-weight: 800;
  color: #ea580c;
}

.flizzy-digits {
  font-size: 24px;
  font-weight: 900;
  color: #9a3412;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* Settlement Card */
.settlement-control-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settlement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.settlement-field-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 160px;
}

.settlement-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
}

.payment-given-input {
  flex: 1;
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
  border-color: #ff6b00;
  color: #ea580c;
}

.exact-chip {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.vuelto-state-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid transparent;
}

.vuelto-title {
  font-size: 11px;
  font-weight: 800;
}

.vuelto-hint {
  font-size: 9.5px;
  margin-left: 5px;
}

.vuelto-value {
  font-size: 13.5px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.status-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.status-neutral {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0369a1;
}

.status-warning {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #ea580c;
}

.status-credit {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

/* Desglose Financiero */
.financial-breakdown {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 11px;
}

.financial-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1px 0;
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
  margin-top: 5px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.mod-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mod-label {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
}

/* Checkbox Footer & Botón Cobrar */
.checkout-footer-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
}

.checkout-submit-wrapper {
  margin-top: 2px;
  padding-bottom: 12px;
  flex-shrink: 0;
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

@media (max-width: 992px) {
  .pos-billing-wrapper {
    height: auto !important;
    min-height: 100% !important;
    overflow: visible !important;
  }

  .pos-billing-grid {
    grid-template-columns: 1fr !important;
    height: auto;
    min-height: auto;
  }

  .pos-billing-grid .pos-account-panel {
    order: 1 !important;
  }

  .pos-billing-grid .pos-checkout-panel {
    order: 2 !important;
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

  .settlement-row {
    flex-wrap: wrap;
    gap: 6px;
  }

  .settlement-field-wrapper {
    width: 100%;
    min-width: 0;
  }

  .quick-cash-chips-group {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
