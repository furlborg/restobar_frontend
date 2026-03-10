<template>
  <n-spin :show="loading">
    <n-card>
      <n-space class="mb-2" align="center" justify="space-between">
        <SaleSerieSelector :sale="sale" :invoice-type="sale.invoice_type" @update:serie="handleSerieUpdate"
          @serie-changed="handleSerieChanged" />

        <n-radio-group v-model:value="localInvoiceType" name="docType" size="small"
          @update:value="handleInvoiceTypeChange">
          <n-radio-button :disabled="!settingsStore.businessSettings.sale.enable_invoices" :value="1" :key="1">
            FACTURA
          </n-radio-button>
          <n-radio-button :disabled="!settingsStore.businessSettings.sale.enable_invoices" :value="3" :key="3">
            BOLETA
          </n-radio-button>
          <n-radio-button :value="80" :key="80">N. VENTA</n-radio-button>
        </n-radio-group>

        <n-radio-group v-model:value="localPaymentCondition" name="saleType" size="small"
          @update:value="handlePaymentConditionChange"
          :disabled="!(settingsStore.businessSettings?.sale?.enable_credits === true)">
          <n-radio-button :value="1" :key="1">CONTADO</n-radio-button>
          <n-radio-button :value="2" :key="2">CRÉDITO</n-radio-button>
        </n-radio-group>
      </n-space>

      <!-- Formulario principal -->
      <n-form class="mb-2" ref="saleForm" :model="sale" :rules="formRules">
        <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
          <!-- Cliente -->
          <n-form-item-gi :span="9" :show-require-mark="formRules.customer?.required" label="Cliente"
            :path="formRules.customer?.required ? 'customer' : ''">
            <ClientSelectInput v-model:customer-name="localCustomerName" :customer-id="sale.customer"
              :invoice-type="sale.invoice_type" @update:customerName="handleCustomerNameInput"
              @customer-selected="handleCustomerSelected" @customer-cleared="handleCustomerCleared" />
          </n-form-item-gi>

          <n-form-item-gi :span="3" label="Fecha">
            <n-date-picker class="w-100" type="datetime" :is-date-disabled="dateDisabled"
              :formatted-value="localDateSale" disabled />
          </n-form-item-gi>

          <n-form-item-gi :span="4" label="Dirección">
            <n-select v-model:value="localAddress" :options="addressesOptions" :disabled="!sale.customer" placeholder=""
              @update:value="handleAddressChange" />
          </n-form-item-gi>

          <n-form-item-gi :span="4" label="Método Pago">
            <n-select v-model:value="localPaymentMethod" :options="saleStore.getPaymentMethodsOptions" filterable
              @update:value="handlePaymentMethodChange" />
          </n-form-item-gi>

          <n-form-item-gi :span="2" label="Preguntar por">
            <n-input v-model:value="localAskFor" placeholder="" :disabled="!!sale.delivery_info"
              @update:value="handleAskForChange" />
          </n-form-item-gi>

          <n-form-item-gi v-if="$route.query.delivery === undefined" :span="2">
            <n-checkbox @update:checked="$emit('handleDelivery', $event)">
              Delivery
            </n-checkbox>
          </n-form-item-gi>

          <n-form-item-gi :span="2">
            <n-button type="info" text @click="$emit('update:showObservations', !showObservations)">
              {{ !showObservations ? "Ver" : "Ocultar" }} Observaciones
            </n-button>
          </n-form-item-gi>

          <n-gi :span="12">
            <n-collapse-transition :show="showObservations">
              <n-form-item label="Observaciones">
                <n-input type="textarea" v-model:value="localObservations" @update:value="handleObservationsChange" />
              </n-form-item>
            </n-collapse-transition>
          </n-gi>

          <n-gi :span="12">
            <n-collapse-transition :show="!!sale.delivery_info">
              <n-text class="fs-5">Información de delivery</n-text>
              <n-grid class="mt-2" responsive="screen" cols="12" :x-gap="12">
                <n-form-item-gi label="Nombres" :span="6" path="delivery_info.person">
                  <n-input v-model:value="localDeliveryInfo.person" @update:value="handleDeliveryPersonChange"
                    placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi label="Dirección" :span="6" path="delivery_info.address">
                  <n-input v-model:value="localDeliveryInfo.address" @update:value="handleDeliveryAddressChange"
                    placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi label="Teléfono" :span="6" path="delivery_info.phone">
                  <n-input v-model:value="localDeliveryInfo.phone" @update:value="handleDeliveryPhoneChange"
                    placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi label="Repartidor" :span="6">
                  <n-input v-model:value="localDeliveryInfo.deliveryman" @update:value="handleDeliverymanChange"
                    placeholder="" />
                </n-form-item-gi>
              </n-grid>
            </n-collapse-transition>
          </n-gi>
        </n-grid>
      </n-form>

      <ProductTable :sale="sale" :sale-details="saleStore.toSale"
        :sale-menu-sets="saleStore.salePayload.sale_product_sets" @update-detail="saleStore.updateDetail" />

      <PaymentTotals :items="paymentTotalsItems" :total-amount="totalAmount" :payment-amount="sale.given_amount"
        :payment-max="sale.payment_condition === 2 ? sale.amount - 0.1 : null" :change-amount="changing"
        @value-changed="handleValueChange" @payment-changed="handlePaymentChange" />

      <n-checkbox v-if="!sale.delivery_info || sale.payment_condition === 1" v-model:checked="localIsMultiple"
        :disabled="settingsStore.businessSettings.order.pending_takeaway" @update:checked="handleIsMultipleChange"
        class="mt-2">
        Pago multiple
      </n-checkbox>

      <n-divider />

      <n-grid responsive="screen" cols="8 xs:1 s:8 m:8 l:12 xl:12 2xl:12" :x-gap="12">
        <n-gi class="d-flex align-items-center" :span="3">
          <n-checkbox v-model:checked="localTicketPreview" @update:checked="handleTicketPreviewChange">
            Previsualizar ticket
          </n-checkbox>
        </n-gi>
      </n-grid>

      <n-button class="mt-2 py-5 fs-1" type="success" :disabled="isPaymentDisabled" secondary block
        @click="handleMainAction">
        <v-icon class="me-2" name="fa-coins" scale="2" />
        {{ userStore.user.role !== "MOZO" ? "Cobrar" : "Realizar pedido" }}
      </n-button>
    </n-card>
  </n-spin>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, toRefs } from "vue";
import { useRoute } from "vue-router";
import { useSaleStore } from "@/store/modules/sale";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import { useSaleTotals } from "@/composables/useSaleTotals";
// import { useMessage } from "naive-ui";
import ProductTable from "./ProductTable.vue";
import PaymentTotals from "./PaymentTotals.vue";
import ClientSelectInput from "@/views/Customer/components/ClientSelectInput.vue";
import SaleSerieSelector from "./SaleSerieSelector.vue";

export default defineComponent({
  name: "OrderTaking",
  components: {
    ProductTable,
    PaymentTotals,
    ClientSelectInput,
    SaleSerieSelector
  },
  props: {
    loading: {
      type: Boolean,
      required: true
    },
    sale: {
      type: Object,
      required: true
    },
    showObservations: {
      type: Boolean,
      required: true
    },
    addressesOptions: {
      type: Array,
      required: true
    },
    customerOptions: {
      type: Array,
      required: true
    },
    searchingCustomer: {
      type: Boolean,
      required: true
    },
    whatsappNumber: {
      type: String,
      required: true
    },
    changing: {
      type: Number,
      required: true
    },
    subTotal: {
      type: Number,
      required: true
    },
    totalGrv: {
      type: Number,
      required: true
    },
    totalExn: {
      type: Number,
      required: true
    },
    totalGrt: {
      type: Number,
      required: true
    },
    totalIgv: {
      type: Number,
      required: true
    },
    icbper: {
      type: Number,
      required: true
    },
    totalDsct: {
      type: Number,
      required: true
    },
    isMultiple: {
      type: Boolean,
      required: true
    },
    ticketPreview: {
      type: Boolean,
      required: true
    }
  },
  emits: [
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
    'doMultiplePayment'
  ],
  setup(props, { emit }) {
    const route = useRoute();
    const saleStore = useSaleStore();
    const settingsStore = useSettingsStore();
    const userStore = useUserStore();
    //const message = useMessage();
    const { grandTotal } = useSaleTotals();

    const saleForm = ref();

    const localInvoiceType = ref(props.sale.invoice_type);
    const localPaymentCondition = ref(props.sale.payment_condition);
    const localCustomerName = ref(props.sale.customer_name);
    const localDateSale = ref(props.sale.date_sale);
    const localAddress = ref(props.sale.address);
    const localPaymentMethod = ref(props.sale.payment_method);
    const localAskFor = ref(props.sale.ask_for);
    const localObservations = ref(props.sale.observations);
    const localDeliveryInfo = ref(props.sale.delivery_info ? { ...props.sale.delivery_info } : null);
    const localIsMultiple = ref(props.isMultiple);
    const localTicketPreview = ref(props.ticketPreview);

    watch(() => props.sale.invoice_type, (newVal) => { localInvoiceType.value = newVal; });
    watch(() => props.sale.payment_condition, (newVal) => { localPaymentCondition.value = newVal; });
    watch(() => props.sale.customer_name, (newVal) => { localCustomerName.value = newVal; });
    watch(() => props.sale.date_sale, (newVal) => { localDateSale.value = newVal; });
    watch(() => props.sale.address, (newVal) => { localAddress.value = newVal; });
    watch(() => props.sale.payment_method, (newVal) => { localPaymentMethod.value = newVal; });
    watch(() => props.sale.ask_for, (newVal) => { localAskFor.value = newVal; });
    watch(() => props.sale.observations, (newVal) => { localObservations.value = newVal; });
    watch(() => props.sale.delivery_info, (newVal) => { localDeliveryInfo.value = newVal ? { ...newVal } : null; }, { deep: true });
    watch(() => props.isMultiple, (newVal) => { localIsMultiple.value = newVal; });
    watch(() => props.ticketPreview, (newVal) => { localTicketPreview.value = newVal; });

    watch(() => saleStore.series, (newSeries) => {
      if (newSeries.length > 0 && !props.sale.serie) {
        const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices
          ? settingsStore.businessSettings.sale.default_invoice : 80;
        const newSerie = saleStore.getFirstOption(defaultInvoiceType);
        if (newSerie) {
          const updatedSale = { ...props.sale, serie: newSerie };
          emit('update:sale', updatedSale);
          emit('selectSerie', newSerie);
        }
      }
    }, { immediate: true });

    onMounted(() => {
      if (!props.sale.serie && saleStore.series.length > 0) {
        const defaultInvoiceType = settingsStore.businessSettings.sale?.enable_invoices
          ? settingsStore.businessSettings.sale.default_invoice : 80;
        const newSerie = saleStore.getFirstOption(defaultInvoiceType);
        if (newSerie) {
          const updatedSale = { ...props.sale, serie: newSerie };
          emit('update:sale', updatedSale);
          emit('selectSerie', newSerie);
        }
      }
    });

    const formRules = computed(() => {
      const rules = {
        customer: {
          required: !(props.sale.invoice_type !== 1 && props.sale.payment_condition === 1 && parseFloat(props.sale.given_amount) < 699),
          trigger: ["blur", "input"],
          message: "Campo requerido"
        }
      };

      if (props.sale.delivery_info) {
        rules.delivery_info = {
          person: { required: true, trigger: ["blur", "input"], message: "Campo requerido" },
          address: { required: true, trigger: ["blur", "change"], message: "Campo requerido" },
          phone: { required: true, trigger: ["blur", "change"], message: "Campo requerido" }
        };
      }
      return rules;
    });

    const isPaymentDisabled = computed(() => {
      // Verificar si hay productos regulares o menús
      const hasRegularProducts = saleStore.toSale.length > 0;
      const hasMenuSets = saleStore.salePayload.sale_product_sets && saleStore.salePayload.sale_product_sets.length > 0;
      const hasAnyItems = hasRegularProducts || hasMenuSets;

      const givenAmount = Number(props.sale.given_amount) || 0;
      const totalAmountValue = Number(props.sale.amount) || 0;
      const isCashPayment = props.sale.payment_condition === 1;
      const disable =
        !hasAnyItems ||
        (isCashPayment
          ? givenAmount < totalAmountValue
          : !(givenAmount < totalAmountValue));

      return disable;
    });

    const dateDisabled = (ts) => ts > new Date(Date.now());

    // Handlers para el componente ClientSelectInput
    const handleCustomerSelected = (customer) => {
      console.log('CUSTOMER SELECCIONADO: ', customer)
      localCustomerName.value = `${customer.doc_num} - ${customer.names}`;
      const updatedSale = { ...props.sale };
      updatedSale.customer = customer.id;
      updatedSale.customer_name = localCustomerName.value;
      updatedSale.addresses = customer.addresses.length > 0 ? customer.addresses : null;
      localDeliveryInfo.value.person = customer.names;
      localDeliveryInfo.value.phone = customer.phone;
      localDeliveryInfo.value.address = customer.addresses.length > 0 ? customer.addresses[0].description : null;
      updatedSale.delivery_info = { ...localDeliveryInfo.value };
      emit('update:sale', updatedSale);
      emit('createAddressesOptions', customer);
    };

    const handleCustomerCleared = () => {
      localCustomerName.value = '';
      const updatedSale = { ...props.sale };
      updatedSale.customer = 0;
      updatedSale.customer_name = '';
      updatedSale.address = null;
      emit('update:sale', updatedSale);
      emit('createAddressesOptions', null);
    };

    const handleCustomerNameInput = (value) => {
      // Mantener sincronizado el nombre mientras escribe
      localCustomerName.value = value;
      const updatedSale = { ...props.sale, customer_name: value };
      if (!value) {
        updatedSale.customer = 0;
        updatedSale.address = null;
      }
      emit('update:sale', updatedSale);
    };

    // Métodos para manejar los eventos del SaleSerieSelector
    const handleSerieUpdate = (newSerie) => {
      if (!newSerie) {
        return;
      }
      const updatedSale = { ...props.sale, serie: newSerie };
      emit('update:sale', updatedSale);
      emit('selectSerie', newSerie);
    };

    const handleSerieChanged = () => { };

    const handleInvoiceTypeChange = (value) => {
      localInvoiceType.value = value;
      const updatedSale = { ...props.sale, invoice_type: value };
      emit('update:sale', updatedSale);
      emit('changeSerie', value);
    };

    const handlePaymentConditionChange = (value) => {
      localPaymentCondition.value = value;
      const updatedSale = { ...props.sale, payment_condition: value };
      emit('update:sale', updatedSale);
      emit('changeCondition', value);
    };

    const handleAddressChange = (value, option) => {
      localAddress.value = value;
      const updatedSale = { ...props.sale, address: value };
      emit('update:sale', updatedSale);
      emit('changeAddress', value, option);
    };

    const handlePaymentMethodChange = (value) => {
      localPaymentMethod.value = value;
      const updatedSale = { ...props.sale, payment_method: value };
      emit('update:sale', updatedSale);
    };

    const handleAskForChange = (value) => {
      localAskFor.value = value;
      const updatedSale = { ...props.sale, ask_for: value };
      emit('update:sale', updatedSale);
    };

    const handleObservationsChange = (value) => {
      localObservations.value = value;
      const updatedSale = { ...props.sale, observations: value };
      emit('update:sale', updatedSale);
    };

    const handleDeliveryPersonChange = (value) => {
      localDeliveryInfo.value.person = value;
      const updatedSale = { ...props.sale };
      updatedSale.delivery_info = { ...localDeliveryInfo.value };
      updatedSale.ask_for = value;
      emit('update:sale', updatedSale);
    };

    const handleDeliveryAddressChange = (value) => {
      localDeliveryInfo.value.address = value;
      const updatedSale = { ...props.sale };
      updatedSale.delivery_info = { ...localDeliveryInfo.value };
      emit('update:sale', updatedSale);
    };

    const handleDeliveryPhoneChange = (value) => {
      localDeliveryInfo.value.phone = value;
      const updatedSale = { ...props.sale };
      updatedSale.delivery_info = { ...localDeliveryInfo.value };
      emit('update:sale', updatedSale);
    };

    const handleDeliverymanChange = (value) => {
      localDeliveryInfo.value.deliveryman = value;
      const updatedSale = { ...props.sale };
      updatedSale.delivery_info = { ...localDeliveryInfo.value };
      emit('update:sale', updatedSale);
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
      if (userStore.user.role !== "MOZO") {
        if (props.isMultiple) {
          emit('doMultiplePayment');
        } else {
          emit('performTakeAway');
        }
      } else {
        emit('performTakeAway');
      }
    };

    const updateSale = (updates) => {
      emit('update:sale', updates);
    };
    const parsedOtherCharges = computed(() => {
      const parsed = parseFloat(props.sale.other_charges);
      return Number.isFinite(parsed) ? parsed : 0;
    });

    const discountBaseAmount = computed(() => {
      const subTotalNumber = Number(props.subTotal) || 0;
      const icbperNumber = Number(props.icbper) || 0;
      return subTotalNumber + icbperNumber + parsedOtherCharges.value;
    });

    const discountInputLimit = computed(() => {
      if (discountBaseAmount.value <= 0) {
        return 0;
      }
      const capped = discountBaseAmount.value - 0.01;
      return Math.max(Math.round(capped * 100) / 100, 0);
    });

    // Crear los items para PaymentTotals
    const paymentTotalsItems = computed(() => {
      return [
        { label: "SUBTOTAL", value: props.subTotal, editable: false, alwaysShow: true },
        { label: "OP. GRAVADAS", value: props.totalGrv, editable: false, alwaysShow: true },
        { label: "OP. EXONERADAS", value: props.totalExn, editable: false, alwaysShow: false },
        { label: "OP. GRATUITAS", value: props.totalGrt, editable: false, alwaysShow: false },
        { label: "IGV", value: props.totalIgv, editable: false, alwaysShow: true },
        { label: "ICBPER", value: props.icbper, editable: false, alwaysShow: false },
        {
          label: "DSCT",
          value: props.totalDsct,
          editable: true,
          field: "discount",
          step: 0.5,
          disabled: false,
          max: discountInputLimit.value
        },
        {
          label: "OTROS CARGOS",
          value: props.sale.other_charges || 0,
          editable: true,
          field: "other_charges",
          step: 0.5,
          disabled: false
        }
      ];
    });

    const totalAmount = computed(() => {
      return grandTotal.value || props.sale.amount || 0;
    });
    // Watcher para actualizar automáticamente el campo de pago y amount cuando cambie el total
    watch(totalAmount, (newTotal) => {
      if (newTotal > 0) {
        const updates = { ...props.sale };
        updates.amount = newTotal;

        // Solo actualizar given_amount si está vacío o es 0
        if (!props.sale.given_amount || props.sale.given_amount === 0) {
          updates.given_amount = newTotal;
        }

        emit('update:sale', updates);
      }
    }, { immediate: true });


    // Manejar cambios en los valores editables
    const handleValueChange = ({ field, value }) => {
      if (field && value !== undefined) {
        const updates = { ...props.sale };
        updates[field] = value;
        // Actualizar el amount con el total calculado
        updates.amount = totalAmount.value;
        emit('update:sale', updates);
      }
    };

    // Manejar cambios en el monto de pago
    const handlePaymentChange = (value) => {
      const updates = { ...props.sale, given_amount: value };
      emit('update:sale', updates);
    };

    const propsRefs = toRefs(props);

    return {
      route,
      saleStore,
      settingsStore,
      userStore,
      saleForm,
      localInvoiceType,
      localPaymentCondition,
      localCustomerName,
      localDateSale,
      localAddress,
      localPaymentMethod,
      localAskFor,
      localObservations,
      localDeliveryInfo,
      localIsMultiple,
      localTicketPreview,
      formRules,
      isPaymentDisabled,
      dateDisabled,
      paymentTotalsItems,
      totalAmount,
      handleValueChange,
      handlePaymentChange,
      handleCustomerNameInput,
      handleCustomerSelected,
      handleCustomerCleared,
      handleSerieUpdate,
      handleSerieChanged,
      handleInvoiceTypeChange,
      handlePaymentConditionChange,
      handleAddressChange,
      handlePaymentMethodChange,
      handleAskForChange,
      handleObservationsChange,
      handleDeliveryPersonChange,
      handleDeliveryAddressChange,
      handleDeliveryPhoneChange,
      handleDeliverymanChange,
      handleIsMultipleChange,
      handleTicketPreviewChange,
      handleMainAction,
      updateSale,
      ...propsRefs
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
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
