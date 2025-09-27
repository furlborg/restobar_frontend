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
              @update:sale="updateSale"
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
            :product-options="productOptions"
            :searching="searching"
            :show-modal="showModal"
            :item-index="itemIndex"
            @update:select-products="selectProducts = $event;"
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
          :product-options="productOptions"
          :searching="searching"
          :show-modal="showModal"
          :item-index="itemIndex"
          @update:select-products="selectProducts = $event; goToFirstTab();"
          @update:product-search="productSearch = $event"
          @update:show-modal="showModal = $event"
          @update:item-index="itemIndex = $event"
          @go-to-first-tab="goToFirstTab"
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
      <MenuProductModal v-if="showMenuModal" :menu="selectedMenu" @close="showMenuModal = false" />

  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
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
    const { grandTotal, formattedTotals } = useSaleTotals();

    // Estados principales
    const loading = ref(false);
    const selectProducts = ref(false);
    const showObservations = ref(false);
    const isMultiple = ref(false);
    const ticketPreview = ref(false);
    const activeTab = ref('main');
    const selectedMenu = ref(null);


    // Estados de modales
    const showModal = ref(false);
    const showConfirm = ref(false);
    const showPayments = ref(false);
    const showCustomerModal = ref(false);
    const showPdf = ref(false);
    const showVoucher = ref(false);
    const showMenuModal = ref(false);
    const scheduledMenus = ref([]);

    // Referencias
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
    const productOptions = ref([]);

    // Estados de búsqueda
    const searchingCustomer = ref(false);
    const searching = ref(false);
    const whatsappNumber = ref("");
    const customerDocument = ref("");

    // Computados para totales
    const changing = computed(() => {
        return sale.value.given_amount > total.value
               ? (sale.value.given_amount - total.value).toFixed(2)
               : 0.0;
    });

    // Cálculo del ICBPER (Impuesto a las bolsas de plástico)
    const icbper = computed(() => {
        return orderStore.orderList.reduce((acc, curVal) => {
            if (curVal.icbper) {
                return (acc += curVal.icbper_amount);
            }
            return (acc += 0);
        }, 0);
    });

    // Cálculo de importe gravado (afectación 10)
    const totalGRV = computed(() => {
        return saleStore.toSale.reduce((acc, curVal) => {
            return curVal.product_affectation === 10
                  ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
                  : acc;
        }, 0);
    });

    // Cálculo de importe exonerado (afectación 20)
    const totalEXN = computed(() => {
        return saleStore.toSale.reduce((acc, curVal) => {
            return curVal.product_affectation === 20
                  ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
                  : acc;
        }, 0);
    });

    // Cálculo de importe gratuito (afectación 21)
    const totalGRT = computed(() => {
        return saleStore.toSale.reduce((acc, curVal) => {
            return curVal.product_affectation === 21
                  ? (acc += parseFloat(curVal.price_sale) * curVal.quantity)
                  : acc;
        }, 0);
    });

    // Cálculo del IGV total
    const totalIGV = computed(() => {
        // Calcular el IGV total de todos los productos
        const igvTotal = saleStore.toSale.reduce((acc, curVal) => {
            const igvTax = parseFloat(curVal.igv_tax || 0);
            const quantity = parseFloat(curVal.quantity || 0);
            return acc + (igvTax * quantity);
        }, 0);
        
        // Formatear a 2 decimales para que coincida con lo que espera el backend
        return parseFloat(igvTotal.toFixed(2));
    });

    // Cálculo del descuento total
    const totalDSCT = computed(() => {
        if (saleStore.toSale.some((detail) => Number(detail.discount) > 0)) {
            return saleStore.toSale.reduce((acc, curVal) => {
                return (acc += Number(curVal.discount));
            }, 0);
        }
        return Number(sale.value.discount);
    });
    
    // Cálculo del subtotal (sin productos gratuitos)
    const subTotal = computed(() => {
        return saleStore.toSale.reduce((acc, curVal) => {
            return curVal.product_affectation === 21
                  ? (acc += 0)
                  : (acc += curVal.price_sale * curVal.quantity);
        }, 0);
    });

    const isMobile = computed(() => ['xs', 's'].includes(breakpointRef.value));

    const getModalClass = computed(() => ({
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }));

    // Determinar el tipo de factura predeterminado
    const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices 
      ? settingsStore.businessSettings.sale?.default_invoice 
      : 80;
    console.log(`Tipo de factura predeterminado: ${defaultInvoiceType}`);
    
    // Obtener el ID de serie predeterminado para este tipo de factura
    const defaultSerieId = saleStore.getFirstOption(defaultInvoiceType);
    console.log(`ID de serie predeterminado: ${defaultSerieId}, Descripción: ${saleStore.getSerieDescription(defaultSerieId)}`);
    
    const sale = ref({
      serie: defaultSerieId,
      number: "",
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss"),
      count: 0,
      amount: "0.00",
      given_amount: parseFloat(0).toFixed(2),
      invoice_type: settingsStore.businessSettings.sale?.enable_invoices ? settingsStore.businessSettings.sale?.default_invoice : 80,
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
      delivery_info:
          !(route.query.delivery === undefined) && route.query.delivery === "true"
          ? {
                  person: "",
                  address: "",
                  phone: "",
                  deliveryman: "",
                  amount: parseFloat(0).toFixed(2)
              }
          : null,
      payments: null,
      do_update: true,
      is_change: true,
      taxed_amount: 0,
      exempt_amount: 0,
      free_amount: 0,
      igv_amount: 0,
      total_igv: "0.00" // Inicializar como string con formato decimal
    });
    // Observar cambios en la lista de productos
    watch(() => saleStore.toSale, (newVal) => {
      console.log("Productos actualizados:", newVal);
    }, { deep: true });

    // Actualizar los valores calculados en el objeto sale cuando cambien
    watch([total, icbper, totalGRV, totalEXN, totalGRT, totalIGV, totalDSCT, () => saleStore.toSale, grandTotal, () => orderStore.orderList.length], () => {
      // Calcular la cantidad de productos directamente (incluyendo menús)
      const productCount = saleStore.toSale.reduce((acc, curVal) => acc + curVal.quantity, 0);
      const menuCount = (saleStore.salePayload.sale_product_sets || []).reduce((acc, curVal) => acc + curVal.quantity, 0);
      sale.value.count = productCount + menuCount;
      
      sale.value.amount = total.value;
      sale.value.icbper = icbper.value;
      sale.value.taxed_amount = totalGRV.value;
      sale.value.exempt_amount = totalEXN.value;
      sale.value.free_amount = totalGRT.value;
      sale.value.igv_amount = totalIGV.value;
      // Formatear total_igv como string con dos decimales
      const igvValue = parseFloat(totalIGV.value || 0);
      sale.value.total_igv = igvValue.toFixed(2);
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

    const updateSale = (newSale) => {
      sale.value = { ...sale.value, ...newSale };
    };

    const goToFirstTab = () => {
      activeTab.value = 'main'
    }

    const obtainSaleNumber = async() => {
        // Verificar si tenemos un ID de serie válido
        const serieId = sale.value.serie;
        console.log(`Obteniendo número para serie ID: ${serieId}, Descripción: ${saleStore.getSerieDescription(serieId)}`);
        if (!serieId) {
          console.warn("No hay serie seleccionada para obtener número de venta");
          return;
        }
        loading.value = true;
        try {
          console.log(`Llamando a getSaleNumber con serie ID: ${serieId}`);
          const response = await getSaleNumber(serieId);
          console.log("Respuesta completa:", response);
          if (response.status === 200) {
            const newNumber = Number(response.data.number) + 1;
            sale.value.number = newNumber;
            console.log(`Número de venta obtenido: ${newNumber} para serie: ${saleStore.getSerieDescription(serieId)}-${newNumber}`);
          } else {
            console.warn("Respuesta inesperada al obtener número de venta:", response);
            message.warning("No se pudo obtener el número de venta");
          }
        } catch (error) {
          console.error("Error al obtener número de venta:", error);
          message.error("Algo salió mal al obtener el número de venta");
        } finally {
          loading.value = false;
        }
    };

    watch(() => sale.value.serie, async (newValue, oldValue) => {
      console.log('Serie cambiada:', newValue, 'Anterior:', oldValue);
      if (newValue !== undefined && newValue !== null) {
        await obtainSaleNumber();
      } else {
        console.warn("El valor de serie es inválido, no se puede obtener número de venta");
      }
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
      if (serieId !== undefined && serieId !== null) {
        sale.value.serie = serieId;
        console.log("Serie seleccionada (ID):", serieId);
      } else {
        console.warn("Se recibió un ID de serie inválido:", serieId);
      }
    };
    const changeSerie = (v) => {
      const tipoDocumento = v === 1 ? "Factura" : v === 3 ? "Boleta" : v === 80 ? "Nota de Venta" : "Desconocido";
      console.log(`Cambiando serie por tipo de documento: ${tipoDocumento} (${v})`);
      
      let nuevaSerie;
      switch (v) {
        case 1: // Factura
          nuevaSerie = saleStore.getFirstOption(1);
          break;
        case 3: // Boleta
          nuevaSerie = saleStore.getFirstOption(3);
          break;
        case 80: // Nota de Venta
          nuevaSerie = saleStore.getFirstOption(80);
          break;
        default:
          nuevaSerie = saleStore.getFirstOption(80);
      }
      
      if (nuevaSerie !== undefined && nuevaSerie !== null) {
        sale.value.serie = nuevaSerie;
        console.log(`Serie cambiada a: ${nuevaSerie} para ${tipoDocumento}`);
      } else {
        console.warn(`No se encontró serie disponible para el tipo: ${tipoDocumento}`);
      }
    };
    const changeCondition = (v) => {
      switch (v) {
        case 1: // CONTADO
          sale.value.given_amount = sale.value.amount;
          break;
        case 2: // CRÉDITO
          sale.value.given_amount = parseFloat(0).toFixed(2);
          break;
        default:
          sale.value.given_amount = sale.value.amount;
      }
      console.log("Condición de pago cambiada a:", v);
    };

    // Funciones auxiliares básicas
    const showCustomerOptions = () => {};
    const autoCreateCustomer = () => {};
    const createAddressesOptions = () => {};
    const changeAddress = () => {};
    const handleDelivery = () => {};
    const showOptions = () => {};
    const selectProduct = () => {};
    const renderLabel = () => {};
    const performCreateOrder = () => {};
    const createPayment = () => {};
    const onCloseModal = () => {};
    const onSuccess = () => {};
    const isDecimal = () => {};
    
    // Función principal para realizar el pedido y cobrar
    const performTakeAway = () => {
      console.log("Realizando pedido/venta...");
      
      // Validar antes de proceder
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
            // Preparar los detalles de venta con formatos correctos
            sale.value.sale_details = saleStore.toSale.map((detail) => ({
              ...detail,
              igv_tax: typeof detail.igv_tax === 'number' ? detail.igv_tax.toFixed(2) : detail.igv_tax,
              price_base: typeof detail.price_base === 'number' ? detail.price_base.toFixed(2) : detail.price_base
            }));
            
            // Garantizar que total_igv siempre sea un string formateado con dos decimales
            const igvValue = parseFloat(sale.value.total_igv || sale.value.igv_amount || 0);
            sale.value.total_igv = igvValue.toFixed(2);
            
            // Agregar una propiedad independiente también para mayor seguridad
            const saleObj = JSON.parse(JSON.stringify(sale.value));
            saleObj.total_igv_duplicado = sale.value.total_igv;
            
            console.log("Enviando venta con total_igv:", sale.value.total_igv, "tipo:", typeof sale.value.total_igv);
            
            // Clonar el objeto sale para evitar problemas de referencia
            const saleClone = JSON.parse(JSON.stringify(sale.value));
            
            // Añadir el total_igv como parámetro independiente también
            saleClone.total_igv_independiente = saleClone.total_igv;
            
            // Mostrar el objeto completo para depuración
            console.log("Objeto sale completo que se enviará:", saleClone);
            
            // Llamar a la API para realizar la orden
            const response = await takeAwayOrder(
              orderStore.orderList,
              saleClone,
              userConfirm.value
            );
            
            if (response.status === 201) {
              message.success("¡Venta realizada correctamente!");
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
            console.error("Error al realizar la venta:", error);
            message.error("Ha ocurrido un error al procesar la venta");
          } finally {
            loading.value = false;
          }
        }
      });
    };
    
    // Función para pago múltiple
    const doMultiplePayment = () => {
      sale.value.payments = [
        {
          payment_method: sale.value.payment_method,
          amount: String(sale.value.amount)
        }
      ];
      showPayments.value = true;
    };

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
      showMenuModal,
      selectedMenu,
      scheduledMenus,
      handleOpenMenuModal,
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