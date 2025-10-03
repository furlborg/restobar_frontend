<template>
    <div id="TakeOrder">
        <n-page-header class="mb-2" @back="$router.push({ name: 'TableHome' })">
            <template #title>
                <n-space justify="space-between">
                    <n-text class="fs-2">Realizar Pedido</n-text>
                </n-space>
            </template>
        </n-page-header>
        <n-card>
            <n-grid responsive="screen" cols="1 xs:1 s:1 m:5 l:5 xl:5 2xl:5" :x-gap="12">
                <n-gi :span="3">
                    <transition name="mode-fade" mode="out-in">
                        <n-spin v-if="selectProducts" :show="loading">
                            <n-card>
                                <n-space class="mb-2" align="center" justify="space-between">
                                    <div class="d-flex align-items-center">
                                        <n-text class="fs-4">{{
                                                `${ saleStore.getSerieDescription(sale.serie) }-${ sale.number
                                                }`
                                            }}
                                        </n-text>
                                        <n-dropdown trigger="click" :options="saleStore.getDocumentSeriesOptions(sale.invoice_type)
      " :show-arrow="true" placement="bottom-end" size="huge" @select="selectSerie">
                                            <n-button type="info" text>
                                                <v-icon class="p-0" name="md-arrowdropdown-round" scale="1.75"/>
                                            </n-button>
                                        </n-dropdown>
                                    </div>
                                    <n-radio-group v-model:value="sale.invoice_type" name="docType" size="small" @update:value="changeSerie">
                                        <n-radio-button :disabled="!settingsStore.businessSettings.sale.enable_invoices" :value="1" :key="1">FACTURA</n-radio-button>
                                        <n-radio-button :disabled="!settingsStore.businessSettings.sale.enable_invoices" :value="3" :key="3">BOLETA</n-radio-button>
                                        <n-radio-button :value="80" :key="80">N. VENTA</n-radio-button>
                                    </n-radio-group>
                                    <n-radio-group v-model:value="sale.payment_condition" name="saleType" size="small" @update:value="changeCondition" :disabled="!(settingsStore.businessSettings?.sale?.enable_credits === true)">
                                        <n-radio-button :value="1" :key="1">CONTADO</n-radio-button>
                                        <n-radio-button :value="2" :key="2">CRÉDITO</n-radio-button>
                                    </n-radio-group>
                                </n-space>
                                <n-form class="mb-2" ref="saleForm" :model="sale" :rules="formRules">
                                    <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
                                        <n-form-item-gi :span="9" :show-require-mark="formRules.customer.required" label="Cliente"
                                                        :path="formRules.customer.required ? 'customer' : ''">
                                            <n-input-group>
                                                <n-auto-complete blur-after-select :input-props="{
      autocomplete: 'disabled',
    }" v-model:value="sale.customer_name" :options="customerOptions" :get-show="showCustomerOptions"
                                                                 :loading="searchingCustomer"                                                                  @update:value="(v) => { if (!v) { sale.customer = 0; sale.address = null; whatsappNumber = ''; addressesOptions = []; } }" @select="(value) => { sale.customer = value; sale.address = null; whatsappNumber = ''; createAddressesOptions(); }" @keyup.enter="autoCreateCustomer" placeholder="" clearable/>
                                                <n-button v-if="!sale.customer" type="info" @click="sale.customer = 0, showCustomerModal = true">
                                                    <v-icon name="md-add-round"/>
                                                </n-button>
                                                <n-button v-else type="warning" @click="showCustomerModal = true">
                                                    <v-icon name="ri-edit-fill"/>
                                                </n-button>
                                            </n-input-group>
                                        </n-form-item-gi>
                                        <n-form-item-gi :span="3" label="Fecha">
                                            <n-date-picker class="w-100" type="datetime" :is-date-disabled="dateDisabled"
                                                           v-model:formatted-value="sale.date_sale" disabled/>
                                        </n-form-item-gi>
                                        <n-form-item-gi :span="4" label="Dirección">
                                            <n-select v-model:value="sale.address" :options="addressesOptions" :disabled="!sale.customer" placeholder="" @update:value="changeAddress"/>
                                        </n-form-item-gi>
                                        <n-form-item-gi :span="4" label="Método Pago">
                                            <n-select v-model:value="sale.payment_method" :options="saleStore.getPaymentMethodsOptions" filterable/>
                                        </n-form-item-gi>
                                        <n-form-item-gi :span="2" label="Preguntar por">
                                            <n-input v-model:value="sale.ask_for" placeholder="" :disabled="!!sale.delivery_info"/>
                                        </n-form-item-gi>
                                        <n-form-item-gi v-if="$route.query.delivery === undefined" :span="2">
                                            <n-checkbox @update:checked="handleDelivery">Delivery</n-checkbox>
                                        </n-form-item-gi>
                                        <n-form-item-gi :span="2">
                                            <n-button type="info" text @click="showObservations = !showObservations">{{ !showObservations ? "Ver" : "Ocultar" }} Observaciones</n-button>
                                        </n-form-item-gi>
                                        <n-gi :span="12">
                                            <n-collapse-transition :show="showObservations">
                                                <n-form-item label="Observaciones">
                                                    <n-input type="textarea" v-model:value="sale.observations"/>
                                                </n-form-item>
                                            </n-collapse-transition>
                                        </n-gi>
                                        <n-gi :span="12">
                                            <n-collapse-transition :show="!!sale.delivery_info">
                                                <n-text class="fs-5">Información de delivery</n-text>
                                                <n-grid class="mt-2" responsive="screen" cols="12" :x-gap="12">
                                                    <n-form-item-gi label="Nombres" :span="6" path="delivery_info.person">
                                                        <n-input v-model:value="sale.delivery_info.person"
                                                                 @update:value="(v) => (sale.ask_for = v)"
                                                                 placeholder=""/>
                                                    </n-form-item-gi>
                                                    <n-form-item-gi label="Dirección" :span="6" path="delivery_info.address">
                                                        <n-input v-model:value="sale.delivery_info.address" placeholder=""/>
                                                    </n-form-item-gi>
                                                    <n-form-item-gi label="Teléfono" :span="6" path="delivery_info.phone">
                                                        <n-input v-model:value="sale.delivery_info.phone" placeholder=""/>
                                                    </n-form-item-gi>
                                                    <n-form-item-gi label="Repartidor" :span="6">
                                                        <n-input v-model:value="sale.delivery_info.deliveryman" placeholder=""/>
                                                    </n-form-item-gi>
                                                </n-grid>
                                            </n-collapse-transition>
                                        </n-gi>
                                    </n-grid>
                                </n-form>
                                <div class="table-container">
                                    <n-table class="order-details-table" :bordered="false">
                                        <thead>
                                        <tr>
                                            <th v-if="settingsStore.businessSettings.sale.manage_affectations">#</th>
                                            <th>Cantidad</th>
                                            <th>Producto</th>
                                            <th>Precio Unitario</th>
                                            <th>Descuento</th>
                                            <th>Precio Total</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr v-for="(detail, index) in saleStore.toSale" :key="index">
                                            <td v-if="settingsStore.businessSettings.sale.manage_affectations">
                                                <n-popselect size="small" placement="bottom-start" v-model:value="detail.product_affectation" :options="productStore.affectationsOptions" @update:value="(v) => saleStore.updateDetail(detail)">
                                                    <n-tag size="small" :color="getAfcColor(detail.product_affectation)">{{ getAfcShort(detail.product_affectation) }}</n-tag>
                                                </n-popselect>
                                            </td>
                                            <td>{{ detail.quantity }}</td>
                                            <td>
                                                <input class="custom-input product-name-input" v-model="detail.product_name" v-autowidth
                                                       @click="$event.target.select()"/>
                                            </td>
                                            <td>
                                                <div class="currency-input-wrapper">
                                                    <span class="currency-symbol">S/.</span>
                                                    <input class="custom-input price-input" type="number" min="0" step=".5" v-model="detail.price_sale" @input="saleStore.updateDetail(detail), (detail.discount = parseFloat(0).toFixed(2))" v-autowidth @click="$event.target.select()"/>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="currency-input-wrapper">
                                                    <span class="currency-symbol">S/.</span>
                                                    <input class="custom-input discount-input" type="number" min="0" :max="!detail.price_sale ? 0 : detail.price_sale" :disabled="detail.product_affectation === 21 || !!Number(sale.discount)" step=".5" v-model="detail.discount" v-autowidth @click="$event.target.select()"/>
                                                </div>
                                            </td>
                                            <td class="total-cell">{{ detail.product_affectation === 21 ? "0.00" : (detail.quantity * detail.price_sale - detail.discount).toFixed(2) }}</td>
                                        </tr>
                                        </tbody>
                                    </n-table>
                                </div>
                                <n-grid cols="3">
                                    <n-gi :span="2">
                                        <n-space class="h-100" align="center" justify="space-around">
                                            <n-space align="center" vertical>
                                                <span class="fs-4">Pago</span>
                                                <div class="fs-5">
                                                    S/.
                                                    <input class="fs-1 custom-input" type="number" min="0" step=".01"
                                                           v-model="sale.given_amount"
                                                           v-autowidth @click="$event.target.select()"/>
                                                </div>
                                            </n-space>
                                            <n-space align="center" vertical>
                                                <span class="fs-4">Vuelto</span>
                                                <div class="fs-5">
                                                    S/.
                                                    <span class="fs-1">{{ changing.toFixed(2) }}</span>
                                                </div>
                                            </n-space>
                                        </n-space>
                                    </n-gi>
                                    <n-gi>
                                        <n-space class="mt-2 fs-6 fw-bold" align="end" vertical>
                                            <div v-if="subTotal">
                                                SUBTOTAL: <span>S/. {{ subTotal.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="totalGRV">
                                                OP. GRAVADAS: <span>S/. {{ totalGRV.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="totalEXN">
                                                OP. EXONERADAS:
                                                <span>S/. {{ totalEXN.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="totalGRT">
                                                OP. GRATUITAS:
                                                <span>S/. {{ totalGRT.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="totalIGV">
                                                IGV: <span>S/. {{ totalIGV.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="icbper">
                                                ICBPER: <span>S/. {{ icbper.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="!!sale.delivery_info" key="delivery">
                                                DELIVERY:
                                                <span>S/.</span>
                                                <input class="custom-input fw-bold" type="number" min="0" step=".1"
                                                       v-model="sale.delivery_info.amount" v-autowidth @click="$event.target.select()"/>
                                            </div>
                                            <div>
                                                DSCT:
                                                <span>S/.</span>
                                                <input class="custom-input fw-bold" type="number" min="0" step=".5" v-model="totalDSCT" v-autowidth :disabled="saleStore.toSale.some(d => Number(d.discount) > 0)" @click="$event.target.select()"/>
                                            </div>
                                            <div>
                                                OTROS:
                                                <span>S/.</span>
                                                <input class="custom-input fw-bold" type="number" min="0" step=".1"
                                                       v-model="sale.other_charges"
                                                       v-autowidth @click="$event.target.select()"/>
                                            </div>
                                            <div>
                                                TOTAL: <span>S/. {{ sale.amount }}</span>
                                            </div>
                                        </n-space>
                                    </n-gi>
                                </n-grid>
                                <n-checkbox v-if="!sale.delivery_info || sale.payment_condition === 1" v-model:checked="isMultiple" :disabled="settingsStore.businessSettings.order.pending_takeaway">Pago multiple</n-checkbox>
                                <n-divider/>
                                <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
                                    <n-gi class="d-flex align-items-center" :span="3">
                                        <n-checkbox v-model:checked="ticketPreview">Previsualizar ticket</n-checkbox>
                                    </n-gi>
                                </n-grid>
                                <n-button class="mt-2 py-5 fs-1" type="success" :disabled="!saleStore.toSale.length || sale.payment_condition === 1
                                    ? sale.given_amount < sale.amount
                                    : !(sale.given_amount < sale.amount)
                                    " secondary block @click="
                                    userStore.user.role !== 'MOZO'
                                        ? isMultiple
                                        ? doMultiplePayment()
                                        : performTakeAway()
                                        : performTakeAway()
                                    ">
                                    <v-icon class="me-2" name="fa-coins" scale="2"/>
                                    {{ userStore.user.role !== "MOZO" ? "Cobrar" : "Realizar pedido" }}
                                </n-button>
                                <ticket-preview ref="ticketPreviewRef" v-model:show="showPdf" :data="pdfData" :hidden="true"
                                                :isUpdate="false"/>
                                <preview-drawer ref="voucherDrawer" v-model:show="showVoucher" :data="voucherData"
                                                :previewOnly="!ticketPreview" @printed="() => $router.push({ name: 'TableHome' })"
                                                @canceled="() => $router.push({ name: 'TableHome' })"/>
                            </n-card>
                        </n-spin>
                        <CategoriesList v-else/>
                    </transition>
                    <!-- Customer Modal -->
                    <customer-modal v-model:show="showCustomerModal" :id-customer="sale.customer" :document="customerDocument"
                                    :doc_type="sale.invoice_type === 1 ? '6' : null" @update:show="onCloseModal"
                                    @on-success="onSuccess"/>
                </n-gi>
                <n-gi span="2">
                    <n-card class="h-100" :bordered="false" embedded>
                        <template #header>
                            <n-button type="info" secondary @click="selectProducts = !selectProducts">{{ selectProducts ? "Seleccionar productos" : "Cobrar" }}</n-button>
                        </template>
                        <n-input-group>
                            <n-auto-complete :input-props="{
        autocomplete: 'disabled',
      }" v-model:value="productSearch" :options="productOptions" :get-show="showOptions" :loading="searching"
                                             clear-after-select :render-label="renderLabel" placeholder="Buscar producto"
                                             @select="selectProduct"/>
                        </n-input-group>
                        <n-scrollbar :x-scrollable="true" style="max-width: 900px">
                            <n-table class="mt-3">
                                <thead>
                                <tr>
                                    <th width="10%"></th>
                                    <th width="40%">Producto</th>
                                    <th width="25%">Cantidad</th>
                                    <th width="15%">SubTotal</th>
                                    <th width="10%"></th>
                                </tr>
                                </thead>
                                <tbody>
                                                                    <tr v-for="(order, index) in orderStore.orderList" :key="index" style="cursor: pointer" @click="itemIndex = index; showModal = true;">
                                    <td>
                                        <n-button type="info" text>
                                            <v-icon name="md-listalt-round"/>
                                        </n-button>
                                    </td>
                                    <td>
                                        {{ order.product_name }}
                                    </td>
                                    <td>
                                        <n-input-number class="border-top-0" size="small" :min="1" v-model:value="order.quantity" @update:value="saleStore.sale_details = orderStore.orderList" @click.stop/>
                                    </td>
                                    <td>S/. {{ order.subTotal.toFixed(2) }}</td>
                                    <td>
                                        <n-button type="error" text @click.stop="orderStore.orderList.splice(index, 1)">
                                            <v-icon name="md-disabledbydefault-round"/>
                                        </n-button>
                                    </td>
                                </tr>
                                </tbody>
                                <tfoot>
                                <tr>
                                    <td colspan="3">
                                    </td>
                                    <td colspan="2" class="fs-6 fw-bold">
                                        S/. {{ orderStore.orderTotal.toFixed(2) }}
                                    </td>
                                </tr>
                                </tfoot>
                            </n-table>
                        </n-scrollbar>
                    </n-card>
                </n-gi>
            </n-grid>
            <n-modal :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }" preset="card" v-model:show="showConfirm" title="Registrar pedido" :mask-closable="false" closable>
                <n-form-item label="Ingrese código de usuario">
                    <n-input type="password" v-model:value="userConfirm" placeholder=""/>
                </n-form-item>
                <template #action>
                    <n-space justify="end">
                        <n-button type="success" :loading="loading" :disabled="!userConfirm || loading" secondary
                                  @click.prevent="performCreateOrder">Confirmar
                        </n-button>
                    </n-space>
                </template>
            </n-modal>
            <n-modal
                :class="{
                    'w-100': genericsStore.device === 'mobile',
                    'w-50': genericsStore.device === 'tablet',
                    'w-25': genericsStore.device === 'desktop',
                }"
                preset="card"
                v-model:show="showPayments"
                title="Realizar venta"
                :mask-closable="false"
                closable
                @close="sale.payments = null"
            >
                <n-space justify="space-between">
                    <n-tag type="info">Total: S/. {{ showPayments ? sale.amount : null }}</n-tag>
                    <n-tag :type="evalPayments ? 'error' : 'success'">Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}</n-tag>
                    <n-tag :type="evalPayments ? 'error' : 'warning'">Faltante: S/. {{ showPayments ? (parseFloat(sale.amount) - currentPaymentsAmount).toFixed(2) : null }}</n-tag>
                </n-space>
                <n-form-item class="mt-2" label="Pagos">
                    <n-dynamic-input v-model:value="sale.payments" :min="1" @create="createPayment">
                        <template #default="{ value }">
                            <div style="display: flex; align-items: center; width: 100%">
                                <n-select v-model:value="value.payment_method" :disabled="loading" :options="filteredMethods"/>
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
                    <n-button type="success" :disabled="evalPayments || sale.payments.some(p => p.payment_method === null) || sale.payments.some(p => Number(p.amount) <= 0) || loading" :loading="loading" secondary @click="performTakeAway">Confirmar</n-button>
                </n-space>
            </n-modal>
            <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="orderStore.orderList[itemIndex]"
                              @success="showModal = false"/>
        </n-card>
    </div>
</template>

<script>
import CustomerModal from "@/views/Customer/components/CustomerModal";
import OrderIndications from "./OrderIndications";
import CategoriesList from "./CategoriesList";
import {
    defineComponent,
    ref,
    computed,
    toRefs,
    watch,
    onMounted,
    h
} from "vue";
import { NThing, NTag, NSpace, NText, useDialog, useMessage } from "naive-ui";
import { useRoute, useRouter } from "vue-router";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";
import { useUserStore } from "@/store/modules/user";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import { useGenericsStore } from "@/store/modules/generics";
import { searchProductByName } from "@/api/modules/products";
import { takeAwayOrder } from "@/api/modules/orders";
import { sendSale, getSaleNumber } from "@/api/modules/sales";
import { directive as VueInputAutowidth } from "vue-input-autowidth";
import { isDecimal, lighten } from "@/utils";
import { saleRules } from "@/utils/constants";
import {
    searchCustomerByName,
    searchRucCustomer
} from "@/api/modules/customer";
import format from "date-fns/format";
import TicketPreview from "@/views/Order/components/TicketPreview";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";

import printDeliveryInfo from "@/hooks/PrintsTemplates/Ticket/DeliveryInfo.js";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";

const dateNow = ref(null);

export default defineComponent({
    name: "TakeOrder",
    directives: { autowidth: VueInputAutowidth },
    components: {
        OrderIndications,
        CustomerModal,
        CategoriesList,
        TicketPreview,
        PreviewDrawer
    },
    setup() {
        const userStore = useUserStore();
        const dialog = useDialog();
        const message = useMessage();
        const route = useRoute();
        const router = useRouter();
        const saleStore = useSaleStore();
        const orderStore = useOrderStore();
        const genericsStore = useGenericsStore();
        const productStore = useProductStore();
        const settingsStore = useSettingsStore();
        const businessStore = useBusinessStore();
        orderStore.orders = [];
        saleStore.order_initial = [];
        orderStore.orderId = null;

        const ticketPreview = ref(settingsStore.businessSettings.sale?.show_preview);

        const loading = ref(false);
        const payment_amount = ref(parseFloat(0).toFixed(2));

        const changing = computed(() => {
            return sale.value.given_amount > total.value
                   ? total.value - sale.value.given_amount
                   : 0.0;
        });

        const icbper = computed(() => orderStore.orderList.reduce((acc, cur) => cur.icbper ? acc + cur.icbper_amount : acc, 0));

        const totals = computed(() => {
            const toSale = saleStore.toSale;
            console.log(toSale);
            return {
                GRV: toSale.reduce((acc, cur) => cur.product_affectation === 10 ? acc + parseFloat(cur.price_sale - cur.igv_tax) * cur.quantity : acc, 0),
                EXN: toSale.reduce((acc, cur) => cur.product_affectation === 20 ? acc + parseFloat(cur.price_sale) * cur.quantity : acc, 0),
                GRT: toSale.reduce((acc, cur) => cur.product_affectation === 21 ? acc + parseFloat(cur.price_sale) * cur.quantity : acc, 0),
                IGV: toSale.reduce((acc, cur) => acc + cur.igv_tax * cur.quantity, 0),
                DSCT: toSale.some(d => Number(d.discount) > 0) ? toSale.reduce((acc, cur) => acc + Number(cur.discount), 0) : sale.value.discount
            };
        });

        const totalGRV = computed(() => totals.value.GRV);
        const totalEXN = computed(() => totals.value.EXN);
        const totalGRT = computed(() => totals.value.GRT);
        const totalIGV = computed(() => totals.value.IGV);
        const totalDSCT = computed(() => totals.value.DSCT);

        const showObservations = ref(false);

        const subTotal = computed(() => saleStore.toSale.reduce((acc, cur) => cur.product_affectation === 21 ? acc : acc + cur.price_sale * cur.quantity, 0));

        const products_count = computed(() => saleStore.toSale.reduce((acc, cur) => acc + cur.quantity, 0));

        const total = computed(() => {
            let cal = parseFloat(subTotal.value - parseFloat(totalDSCT.value) + icbper.value + parseFloat(sale.value.other_charges));
            if (sale.value.delivery_info) cal += parseFloat(sale.value.delivery_info.amount);
            return cal.toFixed(2);
        });

        const saleForm = ref();
        const sale = ref({
            serie: saleStore.getFirstOption(
                settingsStore.businessSettings.sale?.enable_invoices ? settingsStore.businessSettings.sale?.default_invoice : 80
            ),
            number: "",
            date_sale: format(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss"),
            count: products_count,
            amount: total,
            given_amount: parseFloat(0).toFixed(2),
            invoice_type: settingsStore.businessSettings.sale?.enable_invoices ? settingsStore.businessSettings.sale?.default_invoice : 80,
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
            taxed_amount: totalGRV,
            exempt_amount: totalEXN,
            free_amount: totalGRT,
            igv_amount: totalIGV
        });

        watch(total, () => {
            sale.value.given_amount =
                total.value > 0 ? total.value : parseFloat(0).toFixed(2);
        });

        const formRules = computed(() => {
            const rules = { ...saleRules };
            rules.customer.required = !(sale.value.invoice_type !== 1 && sale.value.payment_condition === 1 && parseFloat(sale.value.given_amount) < 699);
            if (sale.value.delivery_info) {
                rules.delivery_info = {
                    person: { required: true, trigger: ["blur", "input"], message: "Campo requerido" },
                    address: { required: true, trigger: ["blur", "change"], message: "Campo requerido" },
                    phone: { required: true, trigger: ["blur", "change"], message: "Campo requerido" }
                };
            } else {
                rules.delivery_info = null;
            }
            return rules;
        });

        const selectSerie = (v) => {
            sale.value.serie = v;
        };

        const changeCondition = (v) => {
            sale.value.given_amount = v === 1 ? total.value : parseFloat(0).toFixed(2);
        };

        const changeSerie = (v) => {
            if (v === 1) {
                sale.value.customer_name = "";
                sale.value.customer = null;
                sale.value.address = null;
            }
            sale.value.serie = saleStore.getFirstOption(v);
        };

        const showModal = ref(false);
        const itemIndex = ref(null);

        const searching = ref(false);

        const productSearch = ref("");

        const products = ref([]);

        const productOptions = computed(() => products.value.map(product => ({
            value: product.id,
            label: product.name,
            disabled: product.is_disabled,
            category: productStore.getCategorieDescription(product.category)
        })));

        const showOptions = (value) => {
            if (value.length >= 3) {
                searching.value = true;
                searchProductByName(value).then((response) => {
                    if (response.status === 200) products.value = response.data;
                }).catch((error) => {
                    console.error(error);
                    message.error("Algo salió mal...");
                }).finally(() => searching.value = false);
                return true;
            }
            return false;
        };

        const selectProduct = (v) => {
            const item = products.value.find(p => p.id === v);
            if (item?.has_supplies && item?.has_stock) {
                orderStore.addOrder(item);
                saleStore.sale_details = orderStore.orderList;
            }
        };

        const searchProductOption = (v) => {
            const item = products.value.find((product) => product.id === v);
            return item ? item : null;
        };

        const renderLabel = (option) => {
            const t = option.label.split("-");
            let color = "#3B689F";
            let text = "MESA";
            if (t.length > 1) {
                if (t[1].includes("LL")) {
                    color = "#926ED7";
                    text = "PARA LLEVAR";
                } else if (t[1].includes("D")) {
                    color = "#995C4E";
                    text = "DELIVERY";
                }
            }
            return h(
                NThing,
                {},
                {
                    default: () => "",
                    header: () =>
                        h(
                            NText,
                            {
                                delete:
                                    !searchProductOption(option.value).has_stock ||
                                    !searchProductOption(option.value).has_supplies,
                                type: searchProductOption(option.value).has_supplies
                                      ? searchProductOption(option.value).has_stock
                                        ? "default"
                                        : "error"
                                      : "error"
                            },
                            {
                                default: () => t[0]
                            }
                        ),
                    description: () =>
                        h(
                            NSpace,
                            {},
                            {
                                default: () => [
                                    h(
                                        NTag,
                                        {
                                            size: "small",
                                            type: "info"
                                        },
                                        {
                                            default: () =>
                                                option.category.toLowerCase().includes("menu")
                                                ? "MENU"
                                                : option.category.toLowerCase().includes("comb")
                                                  ? "COMBO"
                                                  : "CARTA"
                                        }
                                    ),
                                    h(
                                        NTag,
                                        {
                                            size: "small",
                                            color: {
                                                color: lighten(color, 48),
                                                textColor: color,
                                                borderColor: lighten(color, 24)
                                            }
                                        },
                                        {
                                            default: () => text
                                        }
                                    ),
                                    h(
                                        NTag,
                                        {
                                            size: "small",
                                            type: "info"
                                        },
                                        {
                                            default: () => option.category
                                        }
                                    )
                                ]
                            }
                        )
                }
            );
        };

        const obtainSaleNumber = async() => {
            loading.value = true;
            await getSaleNumber(sale.value.serie).then((response) => {
                if (response.status === 200) sale.value.number = Number(response.data.number) + 1;
            }).catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
            }).finally(() => loading.value = false);
        };

        const showCustomerModal = ref(false);
        const searchingCustomer = ref(false);

        const customerResults = ref([]);

        const customerOptions = computed(() => customerResults.value.map(customer => ({
            value: customer.id,
            label: `${customer.doc_num} - ${customer.names}`,
            disabled: customer.is_disabled
        })));

        const addressesOptions = ref([]);

        const createAddressesOptions = () => {
            const customer = customerResults.value.find(c => c.id === sale.value.customer);
            whatsappNumber.value = customer?.phone || "";
            if (customer) {
                addressesOptions.value = customer.addresses.map(address => ({
                    value: address.id,
                    label: `${address.ubigeo} - ${address.description}`
                }));
                if (addressesOptions.value.length) sale.value.address = addressesOptions.value[0].value;
                if (sale.value.delivery_info) {
                    sale.value.delivery_info.person = customer.names;
                    sale.value.delivery_info.phone = customer.phone;
                    sale.value.delivery_info.address = customer.addresses.length ? customer.addresses[0].description : "";
                }
            }
        };

        const changeAddress = (v, o) => {
            if (sale.value.delivery_info) sale.value.delivery_info.address = o.label.split(" - ")[1];
        };

        const showCustomerOptions = async(value) => {
            if (value.length >= 3 && value.length <= 11) {
                searchingCustomer.value = true;
                const searchFunc = sale.value.invoice_type === 1 ? searchRucCustomer : searchCustomerByName;
                await searchFunc(value).then((response) => {
                    if (response.status === 200) customerResults.value = response.data;
                }).catch((error) => {
                    console.error(error);
                    message.error("Algo salió mal...");
                }).finally(() => searchingCustomer.value = false);
                return true;
            } else {
                customerResults.value = [];
                return false;
            }
        };

        const customerDocument = ref("");

        const autoCreateCustomer = () => {
            if (!searchingCustomer.value && !customerResults.value.length) {
                const name = sale.value.customer_name;
                if (!isNaN(name) && ((name.length === 8 && sale.value.invoice_type !== 1) || name.length === 11)) {
                    showCustomerModal.value = true;
                    customerDocument.value = name;
                }
            }
        };

        const { serie } = toRefs(sale.value);

        watch(serie, async() => {
            await obtainSaleNumber();
        });
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

        const showConfirm = ref(false);

        const userConfirm = ref("");

        const PrintsAfterTakeOrder = (val) => {
            const values = { ...val.order, ...val.sale };
            VoucherPrint({ data: values, businessStore, saleStore, changing: changing.value, show: true });
            if (values.delivery_info && settingsStore.business_settings.printer.print_delivery_ticket) {
                printDeliveryInfo({ data: values, changing: changing.value });
            }
            router.push({ name: "TableHome" });
        };

        const performCreateOrder = async() => {
            loading.value = true;
            sale.value.sale_details = saleStore.toSale.map(detail => ({
                ...detail,
                igv_tax: detail.igv_tax.toFixed(2),
                price_base: detail.price_base.toFixed(2)
            }));
            sale.value.discount = totalDSCT.value;
            await takeAwayOrder(orderStore.orderList, sale.value, userConfirm.value).then((response) => {
                if (response.status === 201) {
                    message.success("Venta realizada correctamente!");
                    pdfData.value = response.data.order;
                    showPdf.value = true;
                    setTimeout(() => {
                        ticketPreviewRef.value.generate();
                        if (settingsStore.business_settings.printer.print_html) {
                            voucherData.value = response.data.sale;
                            showVoucher.value = true;
                            if (!ticketPreview.value) setTimeout(() => voucherDrawer.value.generate(), 250);
                        } else {
                            PrintsAfterTakeOrder(response.data);
                        }
                    }, 250);
                }
            }).catch((error) => console.error(error)).finally(() => {
                userConfirm.value = "";
                showConfirm.value = false;
                loading.value = false;
            });
        };

        const performTakeAway = () => {
            formRules.effect;
            saleForm.value.validate((errors) => {
                if (!errors) {
                    if (userStore.user.role === "MOZO") {
                        showConfirm.value = true;
                    } else {
                        dialog.success({
                            closable: false,
                            title: "Confirmar pedido",
                            content: "Realizar pedido?",
                            positiveText: "Sí",
                            onPositiveClick: async() => {
                                loading.value = true;
                                sale.value.sale_details = saleStore.toSale.map((detail) => ({
                                    ...detail,
                                    igv_tax: detail.igv_tax.toFixed(2),
                                    price_base: detail.price_base.toFixed(2)
                                }));
                                await takeAwayOrder(
                                    orderStore.orderList,
                                    sale.value,
                                    userConfirm.value
                                ).then((response) => {
                                    if (response.status === 201) {
                                        message.success("Venta realizada correctamente!");
                                        pdfData.value = response.data.order;
                                        showPdf.value = true;
                                        setTimeout(() => {
                                            ticketPreviewRef.value.generate();
                                            if (
                                                settingsStore.business_settings.printer.print_html
                                            ) {
                                                voucherData.value = response.data.sale;
                                                showVoucher.value = true;
                                                if (!ticketPreview.value) {
                                                    setTimeout(
                                                        () => voucherDrawer.value.generate(),
                                                        250
                                                    );
                                                }
                                            } else {
                                                PrintsAfterTakeOrder(response.data);
                                            }
                                        }, 250);
                                        if (
                                            settingsStore.businessSettings.sale.auto_send &&
                                            !sale.value.delivery_info &&
                                            response.data.sale.invoice_type !== "80"
                                        ) {
                                            sendSale(response.data.sale.id).then((response) => {
                                                if (response.status === 200) {
                                                    message.success("Enviado!");
                                                }
                                            }).catch((error) => {
                                                console.error(error);
                                                message.error("Algo salió mal...");
                                            });
                                        }
                                    }
                                }).catch((error) => {
                                    console.error(error);
                                }).finally(() => {
                                    loading.value = false;
                                });
                            }
                        });
                    }
                } else {
                    if (formRules.value.customer.required) {
                        if (sale.value.invoice_type === 1) {
                            message.warning("Debes agregar un cliente cuando la venta es con factura");
                        } else {
                            message.error("Debes agregar un cliente porque la venta es mayor a S/ 699");
                        }
                    }
                    message.error("Datos Incorrectos");
                    console.error(errors);
                }
            });
        };

        onMounted(async() => {
            await obtainSaleNumber();
            const fetch = new Date();
            dateNow.value = `${fetch.getDate()}/${fetch.getMonth() + 1}/${fetch.getFullYear()} ${fetch.getHours()}:${fetch.getMinutes()}`;
        });

        const onCloseModal = () => {
        };

        const onSuccess = (customer) => {
            if ((sale.value.invoice_type === 1 && customer.doc_type === "6") || sale.value.invoice_type !== 1) {
                customerResults.value.push(customer);
                sale.value.customer_name = `${customer.doc_num} - ${customer.names}`;
                sale.value.customer = customer.id;
                createAddressesOptions();
            }
            showCustomerModal.value = false;
            onCloseModal();
        };

        const isMultiple = ref(false);

        const selectProducts = ref(false);

        const showPayments = ref(false);

        const createPayment = () => ({ payment_method: null, amount: "0" });

        const doMultiplePayment = () => {
            sale.value.payments = [{ payment_method: sale.value.payment_method, amount: String(sale.value.amount) }];
            showPayments.value = true;
        };

        const filteredMethods = computed(() => saleStore.getPaymentMethodsOptions.map(option => ({
            ...option,
            disabled: sale.value.payments?.some(pay => pay.payment_method === option.value)
        })));

        const evalPayments = computed(() => {
            if (sale.value.payments) {
                const sum = sale.value.payments.reduce((acc, val) => acc + parseFloat(val.amount), 0);
                return sum !== Number(sale.value.amount);
            }
            return true;
        });

        const currentPaymentsAmount = computed(() => {
            if (sale.value.payments) {
                const sum = sale.value.payments.reduce((acc, val) => acc + parseFloat(val.amount), 0);
                return isNaN(sum) ? "0.00" : sum.toFixed(2);
            }
            return "0.00";
        });

        const dateDisabled = (ts) => ts > new Date(Date.now());

        const afcData = {
            10: { short: "GRV", color: "#008B8B" },
            20: { short: "EXN", color: "#9932CC" },
            21: { short: "GRT", color: "#006400" },
            default: { short: "---", color: "#8B0000" }
        };

        function getAfcColor(afc) {
            const data = afcData[afc] || afcData.default;
            return {
                color: lighten(data.color, 48),
                textColor: data.color,
                borderColor: lighten(data.color, 24)
            };
        }

        function getAfcShort(afc) {
            return (afcData[afc] || afcData.default).short;
        }

        const whatsappNumber = ref("");

        const ticketPreviewRef = ref(null);

        const showPdf = ref(false);

        const pdfData = ref(null);

        const voucherDrawer = ref(null);

        const showVoucher = ref(false);

        const voucherData = ref(null);

        return {
            isDecimal,
            loading,
            saleStore,
            orderStore,
            productStore,
            settingsStore,
            showModal,
            itemIndex,
            changing,
            payment_amount,
            subTotal,
            formRules,
            saleForm,
            sale,
            changeCondition,
            changeSerie,
            selectSerie,
            renderLabel,
            searching,
            productSearch,
            productOptions,
            showOptions,
            selectProduct,
            showCustomerModal,
            customerOptions,
            showCustomerOptions,
            customerDocument,
            autoCreateCustomer,
            searchingCustomer,
            createAddressesOptions,
            addressesOptions,
            showObservations,
            performTakeAway,
            changeAddress,
            handleDelivery,
            onCloseModal,
            onSuccess,
            userConfirm,
            showConfirm,
            performCreateOrder,
            userStore,
            genericsStore,
            selectProducts,
            icbper,
            isMultiple,
            showPayments,
            createPayment,
            doMultiplePayment,
            filteredMethods,
            evalPayments,
            currentPaymentsAmount,
            dateDisabled,
            getAfcShort,
            getAfcColor,
            totalIGV,
            totalGRV,
            totalEXN,
            totalGRT,
            totalDSCT,
            whatsappNumber,
            ticketPreview,
            ticketPreviewRef,
            showPdf,
            pdfData,
            voucherDrawer,
            showVoucher,
            voucherData
        };
    }
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
  /* display: none; <- Crashes Chrome on hover */
  -webkit-appearance: none;
  margin: 0;
  /* <-- Apparently some margin are still there even though it's hidden */
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
  /* Firefox */
}

/* Estilos para tabla responsiva */
.table-container {
  width: 100%;
  overflow-x: auto;
  margin: 16px 0;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
}

.order-details-table {
  width: 100%;
  min-width: 800px; /* Ancho mínimo para evitar que se comprima demasiado */
  margin: 0;
  text-align: center;
  font-size: 14px;
  border-collapse: collapse;

  th {
    background-color: #f8fafc;
    border-bottom: 2px solid #e5e7eb;
    padding: 12px 8px;
    font-weight: 600;
    color: #374151;
    white-space: nowrap;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
  }

  tr:hover {
    background-color: #f9fafb;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

/* Estilos para inputs dentro de la tabla */
.currency-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: nowrap;

  .currency-symbol {
    font-weight: 500;
    color: #6b7280;
    font-size: 14px;
  }
}

.custom-input {
  &.product-name-input {
    min-width: 120px;
    max-width: 200px;
    text-align: left;
  }

  &.price-input,
  &.discount-input {
    min-width: 60px;
    max-width: 80px;
    text-align: right;
  }
}

.total-cell {
  font-weight: 600;
  color: #059669;
  white-space: nowrap;
}

/* Responsividad para la tabla */
@media (max-width: 1024px) {
  .order-details-table {
    min-width: 700px;
    font-size: 13px;

    th, td {
      padding: 6px 4px;
    }
  }

  .custom-input {
    &.product-name-input {
      min-width: 100px;
      max-width: 150px;
    }

    &.price-input,
    &.discount-input {
      min-width: 50px;
      max-width: 70px;
      font-size: 12px;
    }
  }
}

@media (max-width: 768px) {
  .order-details-table {
    min-width: 600px;
    font-size: 12px;

    th, td {
      padding: 4px 2px;
    }
  }

  .custom-input {
    &.product-name-input {
      min-width: 80px;
      max-width: 120px;
      font-size: 11px;
    }

    &.price-input,
    &.discount-input {
      min-width: 45px;
      max-width: 60px;
      font-size: 11px;
    }
  }

  .currency-input-wrapper .currency-symbol {
    font-size: 12px;
  }
}

/* Scrollbar personalizado para la tabla */
.table-container::-webkit-scrollbar {
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.2s;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}
</style>
