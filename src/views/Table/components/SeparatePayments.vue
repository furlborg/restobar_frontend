<template>
  <div id="SeparatePayments">
    <n-spin :show="loading">
      <div class="split-container">
        <!-- TOP HEADER: SERIE, DOC TYPE, CONDITION -->
        <div class="split-header-bar">
          <div class="split-header-left">
            <div class="split-badge-pill">
              <v-icon name="fa-coins" class="text-emerald me-2" scale="1.05" />
              <span class="split-badge-title">Dividir Cuenta</span>
            </div>

            <!-- SERIE Y CORRELATIVO -->
            <div class="split-serie-selector">
              <n-dropdown 
                trigger="click" 
                :options="saleStore.getDocumentSeriesOptions(sale.invoice_type)"
                :show-arrow="true" 
                placement="bottom-start" 
                size="large" 
                @select="selectSerie"
              >
                <button type="button" class="serie-pill-btn">
                  <span class="serie-text">{{ `${saleStore.getSerieDescription(sale.serie)}-${sale.number}` }}</span>
                  <v-icon name="md-arrowdropdown-round" scale="1.2" class="ms-1 text-muted" />
                </button>
              </n-dropdown>
            </div>
          </div>

          <div class="split-header-right">
            <!-- TIPO DE COMPROBANTE -->
            <div class="doc-type-pills">
              <button
                type="button"
                class="doc-pill"
                :class="{ active: sale.invoice_type === 1 }"
                :disabled="!settingsStore.businessSettings.sale.enable_invoices"
                @click="sale.invoice_type = 1; changeSerie(1)"
              >
                FACTURA
              </button>
              <button
                type="button"
                class="doc-pill"
                :class="{ active: sale.invoice_type === 3 }"
                :disabled="!settingsStore.businessSettings.sale.enable_invoices"
                @click="sale.invoice_type = 3; changeSerie(3)"
              >
                BOLETA
              </button>
              <button
                type="button"
                class="doc-pill"
                :class="{ active: sale.invoice_type === 80 }"
                @click="sale.invoice_type = 80; changeSerie(80)"
              >
                N. VENTA
              </button>
            </div>

            <!-- CONDICIÓN DE PAGO -->
            <div class="condition-pills" v-if="settingsStore.businessSettings?.sale?.enable_credits === true">
              <button
                type="button"
                class="condition-pill"
                :class="{ active: sale.payment_condition === 1 }"
                @click="sale.payment_condition = 1"
              >
                CONTADO
              </button>
              <button
                type="button"
                class="condition-pill"
                :class="{ active: sale.payment_condition === 2 }"
                @click="sale.payment_condition = 2"
              >
                CRÉDITO
              </button>
            </div>
          </div>
        </div>

        <!-- FILTRADO POR COMENSAL / PERSONA (SI EXISTE) -->
        <div v-if="orderCustomersOptions.length > 0" class="split-person-filter-row">
          <div class="person-filter-tag">
            <v-icon name="hi-user" scale="0.9" class="me-1 text-emerald" />
            <span>Filtrar por comensal:</span>
          </div>
          <n-select 
            size="small"
            v-model:value="selectedOrderCustomer" 
            :options="orderCustomersOptions" 
            placeholder="Seleccionar comensal para auto-asignar cantidades..." 
            clearable 
            @update:value="filterByCustomer" 
            style="max-width: 320px;" 
          />
        </div>

        <!-- FORMULARIO CLIENTE Y CONFIGURACIÓN -->
        <n-form class="split-customer-form" ref="saleForm" :model="sale" :rules="formRules">
          <div class="customer-fields-grid">
            <div class="customer-search-field">
              <n-form-item :show-label="false" :show-require-mark="formRules.customer.required" path="customer" class="mb-0">
                <n-input-group size="small">
                  <n-auto-complete 
                    blur-after-select 
                    :input-props="{ autocomplete: 'disabled' }" 
                    v-model:value="sale.customer_name" 
                    :options="customerOptions" 
                    :get-show="showOptions" 
                    :loading="searching"
                    @update:value="(v) => {
                      !v
                        ? ((sale.customer = null),
                          (sale.address = null),
                          (whatsappNumber = ''),
                          (addressesOptions = []))
                        : null;
                    }" 
                    @select="(value) => {
                      sale.customer = value;
                      sale.address = null;
                      whatsappNumber = '';
                      createAddressesOptions();
                    }" 
                    placeholder="Buscar cliente (RUC, DNI o Nombre)..." 
                    clearable 
                  />
                  <n-button type="info" size="small" @click="showModal = true">
                    <v-icon name="md-add-round" />
                    <span class="d-none d-sm-inline ms-1">Nuevo</span>
                  </n-button>
                </n-input-group>
              </n-form-item>
            </div>

            <div v-if="addressesOptions.length > 0" class="customer-address-field">
              <n-select 
                size="small"
                v-model:value="sale.address" 
                :options="addressesOptions" 
                :disabled="!sale.customer"
                placeholder="Dirección fiscal..." 
              />
            </div>

            <div class="customer-toggles-field">
              <n-checkbox size="small" v-model:checked="sale.by_consumption">Por consumo</n-checkbox>
              <n-button size="small" text type="primary" @click="showObservations = !showObservations">
                <v-icon name="fa-comment-dots" class="me-1" scale="0.9" />
                {{ !showObservations ? "Observaciones" : "Ocultar Obs." }}
              </n-button>
            </div>
          </div>

          <n-collapse-transition :show="showObservations">
            <div class="observations-box mt-2">
              <n-input 
                type="textarea" 
                v-model:value="sale.observations" 
                placeholder="Observaciones o indicaciones adicionales de este comprobante..." 
                :rows="2" 
                size="small" 
              />
            </div>
          </n-collapse-transition>
        </n-form>

        <!-- TABLA DE PRODUCTOS A COBRAR EN ESTA CUENTA -->
        <div class="split-table-card">
          <div class="split-table-title-row">
            <span class="split-table-title">Detalle de Comanda a Cobrar</span>
            <span class="split-table-count">{{ list.length }} producto(s) en este comprobante</span>
          </div>

          <div class="split-table-viewport">
            <table class="split-table">
              <thead>
                <tr>
                  <th v-if="settingsStore.businessSettings.sale.manage_affectations" class="col-afc">Tipo</th>
                  <th class="col-qty">Cantidad</th>
                  <th class="col-desc">Descripción</th>
                  <th class="col-price">P. Unit.</th>
                  <th class="col-discount">Desc.</th>
                  <th class="col-total">Total</th>
                  <th class="col-del"></th>
                </tr>
              </thead>
              <tbody>
                <!-- PRODUCT SETS (COMBOS / MENUS) -->
                <template v-for="(set, index) in sale.product_sets" :key="'set-'+index">
                  <tr v-if="set.quantity > 0" class="row-set">
                    <td v-if="settingsStore.businessSettings.sale.manage_affectations" class="col-afc">
                      <n-tag size="small" type="warning" class="fw-bold">{{ set.from_combo ? 'COMBO' : 'MENÚ' }}</n-tag>
                    </td>
                    <td class="col-qty">
                      <div class="qty-stepper">
                        <n-input-number 
                          size="small" 
                          v-model:value="set.quantity" 
                          :min="1" 
                          :max="set.max" 
                          style="width: 86px;" 
                        />
                        <span class="qty-max-hint">de {{ set.max }}</span>
                      </div>
                    </td>
                    <td class="col-desc">
                      <div class="product-name fw-bold">{{ set.name }}</div>
                    </td>
                    <td class="col-price">
                      S/. {{ formatNumber(set.price) }}
                    </td>
                    <td class="col-discount text-muted">
                      S/. 0.00
                    </td>
                    <td class="col-total fw-bold text-emerald">
                      S/. {{ formatNumber(set.quantity * set.price) }}
                    </td>
                    <td class="col-del">
                      <button 
                        type="button" 
                        class="btn-remove-row" 
                        title="Omitir de este comprobante" 
                        @click="sale.product_sets.splice(index, 1)"
                      >
                        <v-icon name="md-disabledbydefault-round" scale="1.1" />
                      </button>
                    </td>
                  </tr>
                </template>

                <!-- DETALLES DE VENTA INDIVIDUALES -->
                <template v-for="(detail, index) in sale.sale_details" :key="'detail-'+index">
                  <tr v-if="detail.quantity > 0" class="row-detail">
                    <td v-if="settingsStore.businessSettings.sale.manage_affectations" class="col-afc">
                      <n-popselect 
                        size="small" 
                        placement="bottom-start" 
                        v-model:value="detail.product_affectation"
                        :options="productStore.affectationsOptions" 
                        @update:value="() => saleStore.updateDetail(detail)"
                      >
                        <n-tag size="small" :color="getAfcColor(detail.product_affectation)" class="afc-badge">
                          {{ getAfcShort(detail.product_affectation) }}
                        </n-tag>
                      </n-popselect>
                    </td>
                    <td class="col-qty">
                      <div class="qty-stepper">
                        <n-input-number 
                          size="small" 
                          v-model:value="detail.quantity" 
                          :min="1" 
                          :max="detail.max" 
                          style="width: 86px;" 
                        />
                        <span class="qty-max-hint">de {{ detail.max }}</span>
                      </div>
                    </td>
                    <td class="col-desc">
                      <div class="product-name">{{ detail.product_name }}</div>
                    </td>
                    <td class="col-price">
                      S/. {{ formatNumber(detail.price_sale) }}
                    </td>
                    <td class="col-discount">
                      <n-input-number 
                        size="tiny" 
                        v-model:value="detail.discount" 
                        :min="0" 
                        :max="!detail.price_sale ? 0 : Number(detail.price_sale)" 
                        :step="0.1" 
                        :precision="2"
                        :disabled="detail.product_affectation === 21 || Number(sale.discount) > 0" 
                        style="width: 78px;" 
                      />
                    </td>
                    <td class="col-total fw-bold text-emerald">
                      S/. {{ detail.product_affectation === 21 ? "0.00" : formatNumber(detail.quantity * detail.price_sale - detail.discount) }}
                    </td>
                    <td class="col-del">
                      <button 
                        type="button" 
                        class="btn-remove-row" 
                        title="Omitir de este comprobante" 
                        @click="sale.sale_details.splice(index, 1)"
                      >
                        <v-icon name="md-disabledbydefault-round" scale="1.1" />
                      </button>
                    </td>
                  </tr>
                </template>

                <!-- ESTADO VACÍO SI NO HAY ÍTEMS -->
                <tr v-if="!list.length">
                  <td :colspan="settingsStore.businessSettings.sale.manage_affectations ? 7 : 6" class="text-center py-4 text-muted">
                    No hay productos seleccionados para cobrar en este comprobante.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECCIÓN DE CIERRE Y PAGO (2 PANELES SIMÉTRICOS) -->
        <div class="split-checkout-grid">
          <!-- PANEL IZQUIERDO: MÉTODOS DE PAGO, PAGO RECIBIDO Y VUELTO -->
          <div class="split-payment-panel">
            <!-- MÉTODOS DE PAGO EN TILES DE UN SOLO TOQUE -->
            <div class="pm-section">
              <div class="section-label">Método de Pago:</div>
              <div class="split-pm-grid">
                <button
                  v-for="pm in saleStore.getPaymentMethodsOptions"
                  :key="pm.value"
                  type="button"
                  class="pm-tile"
                  :class="{ 'pm-tile-active': sale.payment_method === pm.value, [getMethodClass(pm.label)]: true }"
                  @click="sale.payment_method = pm.value"
                >
                  <payment-brand-icon :method="pm.label" :size="24" class="pm-icon" />
                  <span class="pm-name">{{ pm.label }}</span>
                </button>
              </div>
            </div>

            <!-- FILA DE PAGO RECIBIDO Y VUELTO -->
            <div class="cash-action-row">
              <div class="cash-input-group">
                <span class="field-title">Pago Recibido:</span>
                <n-input-number 
                  class="cash-input" 
                  size="small"
                  v-model:value="paymentInputModel" 
                  :min="0" 
                  :precision="2" 
                  :step="1"
                  :disabled="sale.payment_condition === 2"
                  @click="$event.target?.select?.()"
                >
                  <template #prefix>S/.</template>
                </n-input-number>

                <!-- BOTONES DE BILLETES RÁPIDOS -->
                <div class="quick-cash-chips" v-if="sale.payment_condition !== 2 && quickCashOptions.length > 0">
                  <button 
                    type="button" 
                    class="quick-chip"
                    @click="setQuickCash(total)"
                  >
                    Exacto
                  </button>
                  <button 
                    v-for="chip in quickCashOptions" 
                    :key="chip.value"
                    type="button" 
                    class="quick-chip"
                    @click="setQuickCash(chip.value)"
                  >
                    {{ chip.label }}
                  </button>
                </div>
              </div>

              <!-- BADGE DE VUELTO O FALTANTE -->
              <div class="change-status-card" :class="changeStatusClass">
                <span class="status-label">{{ changeStatusLabel }}</span>
                <span class="status-amount">S/. {{ changeStatusValue }}</span>
              </div>
            </div>

            <!-- OPCIONES ADICIONALES -->
            <div class="aux-options-row">
              <n-checkbox size="small" v-model:checked="isMultiple">
                <span class="fw-semibold">Pago múltiple</span>
              </n-checkbox>
              <n-checkbox size="small" v-model:checked="ticketPreview">
                <span>Previsualizar ticket</span>
              </n-checkbox>
            </div>
          </div>

          <!-- PANEL DERECHO: DESGLOSE TRIBUTARIO, TOTAL ESMERALDA Y BOTÓN COBRAR -->
          <div class="split-summary-panel">
            <div class="financial-card">
              <div class="fin-row">
                <span class="fin-label">Subtotal</span>
                <span class="fin-val">S/. {{ formatNumber(subTotal) }}</span>
              </div>
              <div v-if="Number(totalEXN) > 0" class="fin-row">
                <span class="fin-label">Op. Exoneradas</span>
                <span class="fin-val">S/. {{ formatNumber(totalEXN) }}</span>
              </div>
              <div v-if="Number(totalGRV) > 0" class="fin-row">
                <span class="fin-label">Op. Gravadas</span>
                <span class="fin-val">S/. {{ formatNumber(totalGRV) }}</span>
              </div>
              <div v-if="Number(totalGRT) > 0" class="fin-row">
                <span class="fin-label">Op. Gratuitas</span>
                <span class="fin-val">S/. {{ formatNumber(totalGRT) }}</span>
              </div>
              <div v-if="Number(totalIGV) > 0" class="fin-row">
                <span class="fin-label">IGV</span>
                <span class="fin-val">S/. {{ formatNumber(totalIGV) }}</span>
              </div>
              <div v-if="Number(icbper) > 0" class="fin-row">
                <span class="fin-label">ICBPER</span>
                <span class="fin-val">S/. {{ formatNumber(icbper) }}</span>
              </div>

              <div class="fin-modifiers-grid">
                <div class="fin-mod-box">
                  <span class="fin-mod-label">Descuento</span>
                  <n-input-number 
                    size="tiny" 
                    v-model:value="totalDSCT"
                    :min="0" 
                    :max="discountInputLimit" 
                    :step="0.5" 
                    :precision="2"
                    :disabled="sale.sale_details.some(d => Number(d.discount) > 0) || Number(sale.other_charges) > 0"
                  >
                    <template #prefix>S/.</template>
                  </n-input-number>
                </div>
                <div class="fin-mod-box">
                  <span class="fin-mod-label">Otros Cargos</span>
                  <n-input-number 
                    size="tiny" 
                    v-model:value="sale.other_charges"
                    :min="0" 
                    :step="0.5" 
                    :precision="2"
                    :disabled="Number(totalDSCT) > 0"
                  >
                    <template #prefix>S/.</template>
                  </n-input-number>
                </div>
              </div>
            </div>

            <!-- BANNER DEL TOTAL A COBRAR EN DEEP NAVY FINTECH -->
            <div class="navy-total-box">
              <span class="total-title">TOTAL A COBRAR</span>
              <span class="total-number">S/. {{ total }}</span>
            </div>

            <!-- BOTÓN PRINCIPAL DE COBRAR -->
            <button 
              type="button" 
              class="split-charge-btn" 
              :disabled="!canPay || loading"
              :class="{ 'btn-loading': loading }"
              @click.prevent="isMultiple ? doMultiplePayment() : performCreateSale()"
            >
              <v-icon name="fa-coins" class="me-2 text-amber-coins" scale="1.25" />
              <span>COBRAR S/. {{ total }}</span>
            </button>
          </div>
        </div>
      </div>
    </n-spin>
    <n-modal :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }" preset="card" v-model:show="showPayments" title="Realizar venta" :mask-closable="false" closable
      @close="sale.payments = null">
      <n-space justify="space-between">
        <n-tag type="info">Total: S/. {{ showPayments ? total : null }}</n-tag>
        <n-tag :type="evalPayments ? 'error' : 'success'">Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}
        </n-tag>
        <n-tag :type="evalPayments ? 'error' : 'warning'">Faltante: S/.
          {{
      showPayments
        ? parseFloat(total - currentPaymentsAmount).toFixed(2)
        : null
    }}</n-tag>
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
        <n-button type="success" :disabled="evalPayments ||
      sale.payments.some((pay) => pay.payment_method === null) ||
      sale.payments.some((pay) => Number(pay.amount) <= 0) ||
      loading
      " :loading="loading" secondary @click="performCreateSale">Confirmar</n-button>
      </n-space>
    </n-modal>
    <!-- Customer Modal -->
    <customer-modal v-model:show="showModal" :doc_type="sale.invoice_type === 1 ? '6' : null"
      @update:show="onCloseModal" @on-success="onSuccess" />
    <preview-drawer ref="previewDrawer" v-model:show="showPdf" :data="pdfData" :previewOnly="!ticketPreview"
      @printed="handlePdfFinish" @canceled="handlePdfFinish" />
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  toRefs,
  toRef,
  computed,
  watch,
  onMounted,
} from "vue";
import CustomerModal from "@/views/Customer/components/CustomerModal";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import PaymentBrandIcon from "./PaymentBrandIcon.vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useGenericsStore } from "@/store/modules/generics";
import { saleRules } from "@/utils/constants";
import { cloneDeep, isDecimal } from "@/utils";
import { retrieveOrder } from "@/api/modules/orders";
import {
  searchCustomerByName,
  searchRucCustomer,
} from "@/api/modules/customer";
import {
    createSale,
    getSaleNumber, retrieveSale,
    sendSale
} from "@/api/modules/sales";
import { useDialog, useMessage } from "naive-ui";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import { lighten } from "@/utils";
import { useBusinessStore } from "@/store/modules/business";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "SeparatePayments",
  directives: { autowidth: VueInputAutowidth },
  components: {
    CustomerModal,
    PreviewDrawer,
    PaymentBrandIcon,
  },
  props: {
    data: {
      type: Object,
    },
  },
  emits: ["success", "update:show"],
  setup(props, { emit }) {
    const sale = toRef(props, "data");
    const dateNow = ref(null);
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const message = useMessage();
    const loading = ref(false);
    const dialog = useDialog();
    const showModal = ref(false);
    const ticketPreview = ref(settingsStore.businessSettings.sale.show_preview);
    const payment_amount = ref(parseFloat(0).toFixed(2));
    const saleForm = ref();
    const router = useRouter();
    const wasFullPayment = ref(false);
    const changing = computed(() => {
      return sale.value.given_amount > total.value
        ? total.value - sale.value.given_amount
        : 0.0;
    });

    const count = props.data.sale_details.filter((detail) => !!detail.quantity).length + 
                  (props.data.product_sets ? props.data.product_sets.filter((set) => !!set.quantity).length : 0);

    const list = computed(() => {
      const details = sale.value.sale_details.filter((detail) => !!detail.quantity);
      const sets = (sale.value.product_sets || []).filter((set) => !!set.quantity);
      return [...details, ...sets];
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
      let total = sale.value.sale_details.reduce((acc, curVal) => {
        return Number(curVal.product_affectation) === 10
          ? (acc += (parseFloat(curVal.price_sale) - parseFloat(curVal.igv_tax || 0)) * curVal.quantity)
          : acc;
      }, 0);
      return total;
    });

    const totalEXN = computed(() => {
      let total = sale.value.sale_details.reduce((acc, curVal) => {
        return Number(curVal.product_affectation) === 20
          ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
          : acc;
      }, 0);
      if (sale.value.product_sets) {
        total += sale.value.product_sets.reduce((acc, curVal) => acc + parseFloat(curVal.price) * curVal.quantity, 0);
      }
      return total;
    });

    const totalGRT = computed(() => {
      return sale.value.sale_details.reduce((acc, curVal) => {
        return Number(curVal.product_affectation) === 21
          ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
          : acc;
      }, 0);
    });

    const totalIGV = computed(() => {
      return sale.value.sale_details.reduce((acc, curVal) => {
        return (acc += curVal.igv_tax * curVal.quantity);
      }, 0);
    });

    const totalDSCT = computed({
      get: () => {
        if (
          !sale.value.sale_details.some((detail) => Number(detail.discount) > 0)
        ) {
          return sale.value.sale_details.reduce((acc, curVal) => {
            return (acc += Number(curVal.discount));
          }, 0);
        }
        return sale.value.discount;
      },
      set: (v) => {
        if (
          sale.value.sale_details.some((detail) => Number(detail.discount) > 0)
        ) {
          sale.value.discount = v;
        } else {
          sale.value.discount = sale.value.sale_details.reduce(
            (acc, curVal) => {
              return (acc += Number(curVal.discount));
            },
            0
          );
        }
      },
    });

    const showObservations = ref(false);

    const subTotal = computed(() => {
      let total = sale.value.sale_details.reduce((acc, curVal) => {
        return Number(curVal.product_affectation) === 21
          ? (acc += 0)
          : (acc += parseFloat(curVal.price_sale || 0) * curVal.quantity);
      }, 0);
      if (sale.value.product_sets) {
        total += sale.value.product_sets.reduce((acc, curVal) => acc + parseFloat(curVal.price || 0) * curVal.quantity, 0);
      }
      return total;
    });

    const products_count = computed(() => {
      let total = sale.value.sale_details.reduce((acc, curVal) => acc + curVal.quantity, 0);
      if (sale.value.product_sets) {
        total += sale.value.product_sets.reduce((acc, curVal) => acc + curVal.quantity, 0);
      }
      return total;
    });

    const total = computed(() => {
      return parseFloat(
        subTotal.value -
        parseFloat(sale.value.discount) +
        icbper.value +
        parseFloat(sale.value.other_charges)
      ).toFixed(2);
    });

    const otherCharges = computed(() => {
      const parsed = parseFloat(sale.value.other_charges);
      return Number.isFinite(parsed) ? parsed : 0;
    });

    const discountBaseAmount = computed(() => subTotal.value + icbper.value + otherCharges.value);

    const discountInputLimit = computed(() => {
      if (discountBaseAmount.value <= 0) {
        return 0;
      }
      const capped = discountBaseAmount.value - 0.01;
      return Math.max(Math.round(capped * 100) / 100, 0);
    });

    const discountValidationThreshold = computed(() => Math.round(discountBaseAmount.value * 100) / 100);

    watch(total, () => {
      sale.value.amount =
        total.value > 0 ? total.value : parseFloat(0).toFixed(2);
      sale.value.given_amount =
        total.value > 0 ? total.value : parseFloat(0).toFixed(2);
      sale.value.count = products_count.value;
    });

    const formRules = computed(() => {
      let rules = saleRules;
      if (sale.value.invoice_type !== 1 && sale.value.given_amount <= 699) {
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
              const salePayload = {
                ...sale.value,
                taxed_amount: totalGRV.value,
                exempt_amount: totalEXN.value,
                free_amount: totalGRT.value,
                igv_amount: totalIGV.value,
                discount: totalDSCT.value,
                sale_details: sale.value.sale_details
                  .filter(d => d.quantity > 0)
                  .map(detail => ({
                    ...detail,
                    igv_tax: detail.igv_tax.toFixed(2),
                    price_base: detail.price_base.toFixed(2),
                  })),
                product_sets: sale.value.product_sets 
                  ? sale.value.product_sets.filter(s => s.quantity > 0)
                  : [],
                do_update: (list.value.length === count && !list.value.some((d) => d.quantity < d.max))
              };

              wasFullPayment.value = salePayload.do_update;

              await createSale(salePayload)
                .then(async (response) => {
                  if (response.status === 201) {
                      const dataPrint = async() => {
                          const res = await retrieveSale(response.data?.id);
                          pdfData.value = res.data;
                          return res.data;
                      };
                      await dataPrint();
                    showPdf.value = true;
                    if (settingsStore.business_settings.printer.print_html) {
                      // pdfData.value = response.data;
                      if (!ticketPreview.value) {
                        setTimeout(() => previewDrawer.value.generate(), 250);
                      }
                    } else {
                      await VoucherPrint({
                          data: await dataPrint(),
                          businessStore,
                          changing: changing.value,
                          show: true,
                      });
                      // Removed handlePdfFinish() here so drawer STAYS open until manually closed
                    }

                    if (
                      settingsStore.businessSettings.sale.auto_send &&
                      [1, 3].includes(Number(sale.value.invoice_type))
                    ) {
                      sendSale(response.data.id)
                        .then((response) => {
                          if (response.status === 200) {
                            if (response.data?.warning_message) {
                              message.warning(response.data.warning_message, { duration: 10000 });
                            } else {
                              message.success("Enviado!");
                            }
                          }
                          // if (whatsappNumber.value.length >= 9) {
                          //   sendWhatsapp(
                          //     response.data.id,
                          //     [response.data.serie, response.data.number],
                          //     whatsappNumber.value
                          //   )
                          //     .then((response) => {
                          //       if (response.status === 200)
                          //         window.open(response.data.data.url, "_blank");
                          //     })
                          //     .catch((error) => {
                          //       console.error(error);
                          //     });
                          // }
                        }).catch((error) => {
                          console.error(error);
                      });
                    }
                    // else {
                    //   if (whatsappNumber.value.length >= 9) {
                    //     sendWhatsapp(
                    //       response.data.id,
                    //       [response.data.serie, response.data.number],
                    //       whatsappNumber.value
                    //     )
                    //       .then((response) => {
                    //         if (response.status === 200)
                    //           window.open(response.data.data.url, "_blank");
                    //       })
                    //       .catch((error) => {
                    //         console.error(error);
                    //       });
                    //   }
                    // }
                    retrieveOrder(orderStore.orderId)
                      .then((response) => {
                        if (response.status === 200) {
                          const mappedOrderDetails = response.data.order_details.map(detail => {
                              if (detail.product_set) {
                                  const isCombo = detail.product_set.set_type === 'COMBO';
                                  const isMenu = detail.product_set.set_type === 'MENU';

                                  return {
                                      from_menu: isMenu,
                                      from_combo: isCombo,
                                      product_set_id: detail.product_set.id,
                                      order_detail_id: detail.id,
                                      combo_id: detail.product_set?.combo || null,
                                      name: detail.product_set.menu_name || detail.product_set.name,
                                      set_type: detail.product_set.set_type,
                                      price: parseFloat(detail.product_set.price || detail.product_set.fixed_price || detail.product_set.computed_price || 0),
                                      fixed_price: detail.product_set.fixed_price,
                                      pricing_mode: detail.product_set.pricing_mode,
                                      quantity: detail.quantity ?? detail.product_set.quantity ?? 1,
                                      items: Array.isArray(detail.product_set.items)
                                          ? detail.product_set.items.map(item => ({
                                              id: item.id,
                                              combo_product_id: item.combo_product?.id || item.combo_product_id,
                                              product_phase_id: item.product_phase?.id,
                                              product_id: item.product?.id,
                                              product_name: item.product_name,
                                              phase_name: item.product_phase?.phase_name,
                                              quantity: item.quantity,
                                              kardex_map: item.kardex_map,
                                          }))
                                          : [],
                                      ...(detail.id ? { id: detail.id } : {}),
                                      ...(detail.customer ? { customer: detail.customer } : {}),
                                  }
                              }
                              return detail;
                          });
                          orderStore.orders = mappedOrderDetails;
                          saleStore.order_initial = cloneDeep(
                            orderStore.orderList
                          );
                        }
                      })
                      .catch((error) => {
                        console.error(error);
                        message.error("Algo salió mal...");
                      });
                    message.success("Venta realizada correctamente!");
                    // emit("success");
                  }
                }).catch((error) => {
                  console.error(error);
              })
                .finally(() => {
                  loading.value = false;
                });
            },
          });
        } else {
          if (formRules.value.customer.required) {
            if (sale.value.invoice_type === 1) {
              message.warning("Debes agregar un cliente cuando la venta es con factura");
            } else {
              message.error("Debes agregar un cliente porque la venta es mayor a S/ 699");
            }
          }
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
      sale.value.amount = total.value;
      sale.value.given_amount = total.value;
      sale.value.count = products_count.value;
      sale.value.do_update = false;
      sale.value.is_change = true;
      await obtainSaleNumber();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm}/${yy} ${hh}:${msms}`;
    });

    const onCloseModal = () => { };

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

    const orderCustomers = computed(() => {
      const customersMap = new Map();
      orderStore.orderList.forEach(order => {
        if (order.customer && order.customer.id && order.quantity > 0) {
          customersMap.set(order.customer.id, order.customer);
        }
      });
      return Array.from(customersMap.values());
    });

    const orderCustomersOptions = computed(() => {
      return orderCustomers.value.map(c => ({
        label: c.names || c.name || 'Cliente sin nombre',
        value: c.id
      }));
    });

    const selectedOrderCustomer = ref(null);

    const filterByCustomer = (customerId) => {
      if (!customerId) {
        sale.value.sale_details.forEach(detail => {
          detail.quantity = detail.max || detail.quantity;
        });
        if (sale.value.product_sets) {
          sale.value.product_sets.forEach(set => {
            set.quantity = set.max || set.quantity;
          });
        }
      } else {
        sale.value.sale_details.forEach(detail => {
          if (detail.customer && String(detail.customer) === String(customerId)) {
            detail.quantity = detail.max || detail.quantity;
          } else {
            detail.quantity = 0;
          }
        });
        if (sale.value.product_sets) {
          sale.value.product_sets.forEach(set => {
            if (set.customer && String(set.customer) === String(customerId)) {
              set.quantity = set.max || set.quantity;
            } else {
              set.quantity = 0;
            }
          });
        }
      }
    };

    const createPayment = () => {
      const currentTotal = sale.value.payments ? sale.value.payments.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0) : 0;
      const remaining = Math.max(0, parseFloat(sale.value.amount) - currentTotal);
      return { payment_method: null, amount: remaining > 0 ? remaining.toFixed(2) : "0" };
    };

    const doMultiplePayment = () => {
      sale.value.payments = [
        {
          payment_method: sale.value.payment_method,
          amount: String(total.value),
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
          }, 0) !== Number(total.value)
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

    const dateDisabled = (ts) => {
      return ts > new Date(Date.now());
    };

    const handlePdfFinish = () => {
      emit("success");
      emit("update:show", false);
      if (wasFullPayment.value) {
        router.push({ name: "TableHome" });
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

    const formatNumber = (val) => {
      const num = parseFloat(val);
      return Number.isFinite(num) ? num.toFixed(2) : "0.00";
    };

    const paymentInputModel = computed({
      get: () => parseFloat(sale.value.given_amount) || 0,
      set: (val) => {
        sale.value.given_amount = parseFloat(val || 0).toFixed(2);
      }
    });

    const changeStatusLabel = computed(() => {
      if (sale.value.payment_condition === 2) return "A CRÉDITO";
      if (Number(sale.value.given_amount) >= Number(total.value)) {
        return "VUELTO";
      }
      return "FALTANTE";
    });

    const changeStatusClass = computed(() => {
      if (sale.value.payment_condition === 2) return "status-credit";
      if (Number(sale.value.given_amount) > Number(total.value)) {
        return "status-success";
      }
      if (Number(sale.value.given_amount) === Number(total.value)) {
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
      const bills = [20, 50, 100, 200];
      return bills
        .filter(b => b >= tot && b !== tot)
        .map(b => ({ label: `S/ ${b}`, value: b }));
    });

    const setQuickCash = (val) => {
      sale.value.given_amount = Number(val).toFixed(2);
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

    const canPay = computed(() => {
      if (!list.value.length) return false;
      if (sale.value.payment_condition === 2) return true;
      return Number(sale.value.given_amount) >= Number(total.value);
    });

    return {
      showModal,
      settingsStore,
      productStore,
      orderStore,
      saleStore,
      sale,
      isDecimal,
      loading,
      saleForm,
      formRules,
      showOptions,
      customerOptions,
      searching,
      changing,
      payment_amount,
      subTotal,
      total,
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
      dateDisabled,
      count,
      list,
      getAfcShort,
      getAfcColor,
      totalIGV,
      totalGRV,
      totalEXN,
      totalGRT,
      totalDSCT,
      discountInputLimit,
      whatsappNumber,
      ticketPreview,
      showPdf,
      pdfData,
      previewDrawer,
      orderCustomersOptions,
      selectedOrderCustomer,
      filterByCustomer,
      handlePdfFinish,
      formatNumber,
      paymentInputModel,
      changeStatusLabel,
      changeStatusClass,
      changeStatusValue,
      quickCashOptions,
      setQuickCash,
      getMethodIcon,
      getMethodClass,
      canPay
    };
  },
});
</script>

<style lang="scss" scoped>
.split-container {
  padding: 8px 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.split-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.split-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.split-badge-pill {
  display: flex;
  align-items: center;
  font-weight: 800;
  font-size: 16px;
  color: #1e293b;
}

.split-serie-selector {
  display: flex;
  align-items: center;
}

.serie-pill-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-weight: 700;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #059669;
    background: #ecfdf5;
  }
}

.split-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.doc-type-pills {
  display: inline-flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}

.doc-pill {
  border: none;
  background: transparent;
  padding: 5px 12px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    color: #1e293b;
    background: rgba(255, 255, 255, 0.5);
  }

  &.active {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.condition-pills {
  display: inline-flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}

.condition-pill {
  border: none;
  background: transparent;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s ease;

  &.active {
    background: #0284c7;
    color: #ffffff;
  }
}

.split-person-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 6px 12px;
  border-radius: 8px;
}

.person-filter-tag {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #065f46;
}

.customer-fields-grid {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.customer-search-field {
  flex: 1 1 280px;
}

.customer-address-field {
  flex: 1 1 200px;
}

.customer-toggles-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.observations-box {
  background: #f8fafc;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

/* TABLA DE PRODUCTOS */
.split-table-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.split-table-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.split-table-title {
  font-weight: 700;
  font-size: 12.5px;
  color: #334155;
}

.split-table-count {
  font-size: 11.5px;
  font-weight: 600;
  color: #059669;
}

.split-table-viewport {
  max-height: 250px;
  overflow-y: auto;
}

.split-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;

  thead th {
    position: sticky;
    top: 0;
    background: #f1f5f9;
    z-index: 2;
    padding: 7px 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #475569;
    border-bottom: 1px solid #cbd5e1;
    text-align: left;
  }

  tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  tbody tr:hover {
    background: #f8fafc;
  }
}

.col-afc {
  width: 60px;
  text-align: center;
}

.col-qty {
  width: 140px;
}

.col-desc {
  min-width: 150px;
}

.col-price {
  width: 90px;
  text-align: right;
  white-space: nowrap;
}

.col-discount {
  width: 90px;
  text-align: right;
  white-space: nowrap;
}

.col-total {
  width: 100px;
  text-align: right;
  white-space: nowrap;
}

.col-del {
  width: 40px;
  text-align: center;
}

.qty-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qty-max-hint {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.btn-remove-row {
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: #fee2e2;
    color: #b91c1c;
  }
}

/* CHECKOUT SECTION (2 COLUMNS) */
.split-checkout-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  align-items: start;
}

.split-payment-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #475569;
  margin-bottom: 6px;
}

.split-pm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 6px;
}

.pm-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  transition: all 0.15s ease;
  gap: 2px;

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &.pm-tile-active {
    border-color: #2563eb !important;
    background: #eff6ff !important;
    color: #1d4ed8 !important;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25) !important;
  }

  &.pm-efectivo.pm-tile-active { border-color: #059669 !important; background: #ecfdf5 !important; color: #047857 !important; }
  &.pm-yape.pm-tile-active { border-color: #742284 !important; background: #faf5ff !important; color: #581c87 !important; }
  &.pm-plin.pm-tile-active { border-color: #00b4d8 !important; background: #f0fdfa !important; color: #0e7490 !important; }
  &.pm-tunki.pm-tile-active { border-color: #ff4b2b !important; background: #fff7ed !important; color: #c2410c !important; }
  &.pm-tarjeta.pm-tile-active { border-color: #2563eb !important; background: #eff6ff !important; color: #1d4ed8 !important; }
  &.pm-transfer.pm-tile-active { border-color: #0f172a !important; background: #f8fafc !important; color: #0f172a !important; }
}

.cash-action-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.cash-input-group {
  flex: 1;
}

.field-title {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}

.quick-cash-chips {
  display: flex;
  gap: 4px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.quick-chip {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  cursor: pointer;
  color: #334155;
  transition: all 0.12s ease;

  &:hover {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }
}

.change-status-card {
  min-width: 105px;
  padding: 6px 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.status-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-amount {
  font-size: 16px;
  font-weight: 900;
  margin-top: 2px;
}

.status-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

.status-neutral {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.status-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}

.status-credit {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.aux-options-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 4px;
}

/* SUMMARY PANEL (RIGHT) */
.split-summary-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.financial-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
}

.fin-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 2px 0;
}

.fin-label {
  color: #64748b;
}

.fin-val {
  font-weight: 600;
  color: #1e293b;
}

.fin-modifiers-grid {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
}

.fin-mod-box {
  flex: 1;
}

.fin-mod-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #64748b;
  display: block;
  margin-bottom: 2px;
}

.navy-total-box {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 8px;
  padding: 9px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.total-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #94a3b8;
  text-transform: uppercase;
}

.total-number {
  font-size: 22px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

.split-charge-btn {
  width: 100%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
  }

  &:disabled {
    opacity: 0.55;
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.text-amber-coins {
  color: #fbbf24 !important;
}

.text-emerald {
  color: #059669 !important;
}

@media (max-width: 860px) {
  .split-checkout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
