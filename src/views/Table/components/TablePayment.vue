<template>
  <n-card :bordered="false" class="h-100" content-class="p-0 overflow-auto">
    <n-scrollbar>
      <div id="TablePayment">
        <n-spin :show="loading">
          <n-card :bordered="false" content-class="p-0">
            <n-space class="mb-2" align="center" justify="space-between">
              <div class="d-flex align-items-center">
                <n-text class="fs-4">{{ `${saleStore.getSerieDescription(sale.serie)}-${sale.number}` }}</n-text>
                <n-dropdown trigger="click" :options="saleStore.getDocumentSeriesOptions(sale.invoice_type)"
                  :show-arrow="true" placement="bottom-end" size="huge" @select="sale.serie = $event">
                  <n-button type="info" text>
                    <v-icon class="p-0" name="md-arrowdropdown-round" scale="1.75" />
                  </n-button>
                </n-dropdown>
              </div>
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
                  <n-date-picker class="w-100" type="datetime" :is-date-disabled="ts => ts > new Date()"
                    disabled v-model:formatted-value="sale.date_sale" />
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
              <n-table class="m-auto text-center fs-6 mb-3" :bordered="false">
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
                  <tr v-for="(detail, index) in saleStore.toSale.filter(d => d.quantity > 0)" :key="index">
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
            <div class="payment-section d-block d-md-none mt-3">
              <n-card class="mb-3" size="small">
                <template #header>
                  <span class="fw-bold">Resumen de Venta</span>
                </template>
                <div class="mobile-totals">
                  <div v-if="subTotal" class="total-row">
                    <span class="label">SUBTOTAL:</span>
                    <span class="amount">S/. {{ subTotal.toFixed(2) }}</span>
                  </div>
                  <div v-if="totalGRV" class="total-row">
                    <span class="label">OP. GRAVADAS:</span>
                    <span class="amount">S/. {{ totalGRV.toFixed(2) }}</span>
                  </div>
                  <div v-if="totalEXN" class="total-row">
                    <span class="label">OP. EXONERADAS:</span>
                    <span class="amount">S/. {{ totalEXN.toFixed(2) }}</span>
                  </div>
                  <div v-if="totalGRT" class="total-row">
                    <span class="label">OP. GRATUITAS:</span>
                    <span class="amount">S/. {{ totalGRT.toFixed(2) }}</span>
                  </div>
                  <div v-if="totalIGV" class="total-row">
                    <span class="label">IGV:</span>
                    <span class="amount">S/. {{ totalIGV.toFixed(2) }}</span>
                  </div>
                  <div v-if="!settingsStore.business_settings.sale?.show_discount_label" class="total-row">
                    <span class="label">DSCT:</span>
                    <div class="input-group">
                      <span>S/.</span>
                      <input class="custom-input fw-bold discount-input" type="number" min="0" step=".5" 
                        v-model="totalDSCT" :disabled="saleStore.toSale.some(d => Number(d.discount) > 0)"
                        @click="$event.target.select()" />
                    </div>
                  </div>
                  <div v-if="icbper" class="total-row">
                    <span class="label">ICBPER:</span>
                    <span class="amount">S/. {{ icbper.toFixed(2) }}</span>
                  </div>
                  <div class="total-row">
                    <span class="label">OTROS:</span>
                    <div class="input-group">
                      <span>S/.</span>
                      <input class="custom-input fw-bold others-input" type="number" min="0" step=".5"
                        v-model="sale.other_charges" @click="$event.target.select()" />
                    </div>
                  </div>
                </div>
                <n-divider />
                <div class="total-final">
                  <span class="label-total">TOTAL:</span>
                  <span class="amount-total">S/. {{ sale.amount }}</span>
                </div>
              </n-card>
              <n-grid cols="2" :x-gap="12">
                <n-gi>
                  <n-card size="small" class="payment-card">
                    <div class="payment-section-mobile">
                      <span class="payment-label">Pago</span>
                      <div class="payment-input-container">
                        <span class="currency">S/.</span>
                        <input class="payment-input" type="number" min="0" step=".01"
                          v-model="sale.given_amount" @click="$event.target.select()" />
                      </div>
                    </div>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small" class="payment-card">
                    <div class="payment-section-mobile">
                      <span class="payment-label">Vuelto</span>
                      <div class="payment-amount-display">
                        <span class="currency">S/.</span>
                        <span class="payment-amount">{{ changing.toFixed(2) }}</span>
                      </div>
                    </div>
                  </n-card>
                </n-gi>
              </n-grid>
            </div>

            <div class="payment-section d-none d-md-block">
              <n-card class="mb-3 totals-card-desktop">
                <template #header>
                  <span class="totals-header">Resumen de Venta</span>
                </template>
                <n-grid cols="3" :x-gap="16">
                  <n-gi>
                    <div class="desktop-totals-column">
                      <div v-if="subTotal" class="total-row-desktop">
                        <span class="label-desktop">SUBTOTAL:</span>
                        <span class="amount-desktop">S/. {{ subTotal.toFixed(2) }}</span>
                      </div>
                      <div v-if="totalGRV" class="total-row-desktop">
                        <span class="label-desktop">OP. GRAVADAS:</span>
                        <span class="amount-desktop">S/. {{ totalGRV.toFixed(2) }}</span>
                      </div>
                      <div v-if="totalEXN" class="total-row-desktop">
                        <span class="label-desktop">OP. EXONERADAS:</span>
                        <span class="amount-desktop">S/. {{ totalEXN.toFixed(2) }}</span>
                      </div>
                    </div>
                  </n-gi>
                  <n-gi>
                    <div class="desktop-totals-column">
                      <div v-if="totalGRT" class="total-row-desktop">
                        <span class="label-desktop">OP. GRATUITAS:</span>
                        <span class="amount-desktop">S/. {{ totalGRT.toFixed(2) }}</span>
                      </div>
                      <div v-if="totalIGV" class="total-row-desktop">
                        <span class="label-desktop">IGV:</span>
                        <span class="amount-desktop">S/. {{ totalIGV.toFixed(2) }}</span>
                      </div>
                      <div v-if="icbper" class="total-row-desktop">
                        <span class="label-desktop">ICBPER:</span>
                        <span class="amount-desktop">S/. {{ icbper.toFixed(2) }}</span>
                      </div>
                    </div>
                  </n-gi>
                  <n-gi>
                    <div class="desktop-totals-column">
                      <div v-if="!settingsStore.business_settings.sale?.show_discount_label" class="total-row-desktop">
                        <span class="label-desktop">DSCT:</span>
                        <div class="input-group-desktop">
                          <span>S/.</span>
                          <input class="custom-input fw-bold discount-input-desktop" type="number" min="0" step=".5"
                            v-model="totalDSCT" :disabled="saleStore.toSale.some(d => Number(d.discount) > 0)"
                            @click="$event.target.select()" />
                        </div>
                      </div>
                      <div class="total-row-desktop">
                        <span class="label-desktop">OTROS:</span>
                        <div class="input-group-desktop">
                          <span>S/.</span>
                          <input class="custom-input fw-bold others-input-desktop" type="number" min="0" step=".5"
                            v-model="sale.other_charges" @click="$event.target.select()" />
                        </div>
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
                <n-divider />
                <div class="total-final-desktop">
                  <span class="label-total-desktop">TOTAL:</span>
                  <span class="amount-total-desktop">S/. {{ sale.amount }}</span>
                </div>
              </n-card>
              <n-grid cols="2" :x-gap="16">
                <n-gi>
                  <n-card class="payment-card-desktop">
                    <div class="payment-section-desktop">
                      <span class="payment-label-desktop">Pago</span>
                      <div class="payment-input-container-desktop">
                        <span class="currency-desktop">S/.</span>
                        <input class="payment-input-desktop" type="number" min="0" step=".01"
                          v-model="sale.given_amount" @click="$event.target.select()" />
                      </div>
                    </div>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card class="payment-card-desktop">
                    <div class="payment-section-desktop">
                      <span class="payment-label-desktop">Vuelto</span>
                      <div class="payment-amount-display-desktop">
                        <span class="currency-desktop">S/.</span>
                        <span class="payment-amount-desktop">{{ changing.toFixed(2) }}</span>
                      </div>
                    </div>
                  </n-card>
                </n-gi>
              </n-grid>
            </div>
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
import { defineComponent, ref, computed, watch, onMounted } from "vue";
import SeparatePaymentsModal from "./SeparatePaymentsModal";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import ClientSelectInput from "@/views/Customer/components/ClientSelectInput.vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useRouter } from "vue-router";
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
  components: { SeparatePaymentsModal, PreviewDrawer, ClientSelectInput },
  setup() {
    const router = useRouter();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const userStore = useUserStore();
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

    const changing = computed(() => sale.value.given_amount > total.value ? total.value - sale.value.given_amount : 0.0);

    const icbper = computed(() => orderStore.orderList.reduce((acc, curVal) =>
      curVal.icbper ? acc + curVal.icbper_amount : acc, 0));

    const precision = 10000;
    const calculateTotal = (affectation) => {
      const totalScaled = saleStore.toSale.reduce((acc, curVal) => {
        if (curVal.product_affectation === affectation) {
          const value = Math.round(parseFloat(curVal.price_sale) * curVal.quantity * precision);
          return acc + value;
        }
        return acc;
      }, 0);
      return totalScaled / precision;
    };

    const totalGRV = computed(() => calculateTotal(10));
    const totalEXN = computed(() => calculateTotal(20));
    const totalGRT = computed(() => calculateTotal(21));

    const totalIGV = computed(() => {
      const totalScaled = saleStore.toSale.reduce((acc, curVal) => {
        const value = Math.round(curVal.igv_tax * curVal.quantity * precision);
        return acc + value;
      }, 0);
      return totalScaled / precision;
    });

    const totalDSCT = computed({
      get: () => saleStore.toSale.some(detail => Number(detail.discount) > 0)
        ? saleStore.toSale.reduce((acc, curVal) => acc + Number(curVal.discount), 0)
        : sale.value.discount,
      set: (v) => {
        if (!saleStore.toSale.some(detail => Number(detail.discount) > 0)) {
          sale.value.discount = v;
        } else {
          sale.value.discount = saleStore.toSale.reduce((acc, curVal) => acc + Number(curVal.discount), 0);
        }
      },
    });

    const subTotal = computed(() => saleStore.toSale.reduce((acc, curVal) =>
      curVal.product_affectation === 21 ? acc : acc + (curVal.price_sale * curVal.quantity), 0));

    const products_count = computed(() => saleStore.toSale.reduce((acc, curVal) => acc + curVal.quantity, 0));

    const total = computed(() => parseFloat(
      totalIGV.value + totalGRV.value + totalEXN.value - parseFloat(totalDSCT.value) +
      icbper.value + parseFloat(sale.value.other_charges)
    ).toFixed(2));

    const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices
      ? settingsStore.businessSettings.sale.default_invoice : 80;

    const sale = ref({
      order: null,
      serie: saleStore.getFirstOption(defaultInvoiceType),
      number: "",
      date_sale: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
      count: products_count,
      amount: total,
      given_amount: parseFloat(0).toFixed(2),
      invoice_type: defaultInvoiceType,
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
      sale.value.serie = saleStore.getFirstOption(v);
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
      loading.value = true;
      try {
        const response = await getSaleNumber(sale.value.serie);
        if (response.status === 200) {
          sale.value.number = Number(response.data.number) + 1;
        }
      } catch (error) {
        console.error(error);
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

    // Handlers para el componente ClientSelectInput
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

    watch(total, () => {
      sale.value.given_amount = total.value > 0 ? total.value : parseFloat("0").toFixed(2);
    });

    watch(() => sale.value.serie, obtainSaleNumber);

    onMounted(async () => {
      sale.value.given_amount = total.value;
      await obtainSaleNumber();
    });

    return {
      userStore, saleStore, orderStore, productStore, settingsStore, sale, isDecimal,
      loading, saleForm, formRules, handleCustomerSelected, handleCustomerCleared,
      changing, subTotal, changeCondition, changeSerie, showObservations, performCreateSale,
      addressesOptions, createAddressesOptions, genericsStore,
      icbper, isMultiple, showPayments, createPayment, doMultiplePayment, filteredMethods,
      evalPayments, currentPaymentsAmount, openSeparatePaymentsModal, 
      closeSeparatePaymentsModal: () => {}, successSeparatePaymentsModal: obtainSaleNumber,
      separatePayments, showSeparateModal, getAfcShort, getAfcColor, totalIGV, totalGRV,
      totalEXN, totalGRT, totalDSCT, whatsappNumber, ticketPreview, previewDrawer, showPdf,
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
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.mobile-totals {
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 14px;
    .label {
      font-weight: 500;
      color: #666;
      white-space: nowrap;
      min-width: 100px;
    }
    .amount {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      text-align: right;
    }
    .input-group {
      display: flex;
      align-items: center;
      gap: 4px;
      span {
        font-weight: 600;
        color: #333;
      }
      .discount-input, .others-input {
        width: 50px;
        padding: 2px 4px;
        text-align: right;
        font-size: 13px;
        border: 1px solid #ddd;
        border-radius: 4px;
        &:focus {
          border-color: #409eff;
          outline: none;
        }
      }
    }
  }
}

.total-final {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  .label-total {
    font-size: 16px;
    font-weight: 700;
    color: #333;
  }
  .amount-total {
    font-size: 18px;
    font-weight: 700;
    color: #52c41a;
  }
}

.payment-card {
  min-width: 0;
  flex: 1;
  .payment-section-mobile {
    text-align: center;
    padding: 8px;
    .payment-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }
    .payment-input-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      white-space: nowrap;
      min-width: fit-content;
      .currency {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        flex-shrink: 0;
      }
      .payment-input {
        width: 80px;
        min-width: 80px;
        padding: 4px 8px;
        font-size: 16px;
        font-weight: 600;
        text-align: center;
        border: 1px solid #ddd;
        border-radius: 4px;
        flex-shrink: 0;
        &:focus {
          border-color: #409eff;
          outline: none;
        }
      }
    }
    .payment-amount-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      white-space: nowrap;
      min-width: fit-content;
      .currency {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        flex-shrink: 0;
      }
      .payment-amount {
        font-size: 16px;
        font-weight: 700;
        color: #409eff;
        flex-shrink: 0;
      }
    }
  }
}

.payment-card-desktop {
  .payment-section-desktop {
    text-align: center;
    padding: 20px 16px;
    .payment-label-desktop {
      display: block;
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .payment-input-container-desktop {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      .currency-desktop {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }
      .payment-input-desktop {
        width: 120px;
        padding: 8px 12px;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        border: 2px solid #ddd;
        border-radius: 6px;
        &:focus {
          border-color: #409eff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }
    }
    .payment-amount-display-desktop {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      .currency-desktop {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }
      .payment-amount-desktop {
        font-size: 20px;
        font-weight: 700;
        color: #409eff;
      }
    }
  }
}

.totals-card-desktop {
  .totals-header {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
}

.desktop-totals-column {
  .total-row-desktop {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 14px;
    .label-desktop {
      font-weight: 500;
      color: #666;
      white-space: nowrap;
      min-width: 100px;
    }
    .amount-desktop {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      text-align: right;
    }
    .input-group-desktop {
      display: flex;
      align-items: center;
      gap: 4px;
      span {
        font-weight: 600;
        color: #333;
      }
      .discount-input-desktop, .others-input-desktop {
        width: 60px;
        padding: 4px 6px;
        text-align: right;
        font-size: 13px;
        border: 1px solid #ddd;
        border-radius: 4px;
        &:focus {
          border-color: #409eff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
        }
      }
    }
  }
}

.total-final-desktop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  .label-total-desktop {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }
  .amount-total-desktop {
    font-size: 22px;
    font-weight: 700;
    color: #52c41a;
  }
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
