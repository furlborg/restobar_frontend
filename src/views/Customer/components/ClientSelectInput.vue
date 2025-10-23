<template>
  <n-input-group>
    <n-auto-complete
      blur-after-select
      :input-props="{ autocomplete: 'disabled' }"
      v-model:value="localCustomerName"
      :options="customerOptions"
      :get-show="showOptions"
      :loading="searching"
      @keypress.enter="autoCreateCustomer"
      @update:value="handleCustomerNameChange"
      @select="handleCustomerSelect"
      placeholder=""
      clearable
    />
    <n-button
      :type="!localCustomerId ? 'info' : 'warning'"
      @click="openCustomerModal"
    >
      <v-icon :name="!localCustomerId ? 'md-add-round' : 'ri-edit-fill'" />
    </n-button>
  </n-input-group>

  <customer-modal
    v-model:show="showModal"
    :id-customer="localCustomerId"
    :doc_type="invoiceType === 1 ? '6' : null"
    :document="customerDocument"
    @update:show="onCloseModal"
    @on-success="onCustomerSuccess"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import CustomerModal from "@/views/Customer/components/CustomerModal.vue";
import { searchCustomerByName, searchRucCustomer, searchCustomerByDocument, retrieveCustomer } from "@/api/modules/customer";

// Props
const props = defineProps({
  customerName: {
    type: String,
    default: ''
  },
  customerId: {
    type: [Number, String, null],
    default: null
  },
  invoiceType: {
    type: Number,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:customerName',
  'update:customerId', 
  'customer-selected',
  'customer-cleared'
]);

const message = useMessage();

const localCustomerName = ref(props.customerName);
const localCustomerId = ref(props.customerId);
const searching = ref(false);
const customerResults = ref([]);
const showModal = ref(false);
const customerDocument = ref("");

const customerOptions = computed(() => 
  customerResults.value.map(customer => ({
    value: customer.id,
    label: `${customer.doc_num} - ${customer.names}`,
    disabled: customer.is_disabled,
  }))
);

const showOptions = async (value) => {
  if (value.length < 3 || value.length > 11) {
    customerResults.value = [];
    return false;
  }

  const normalizeResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    return [];
  };

  searching.value = true;
  try {
    let fetchedCustomers = [];

    if (props.invoiceType === 1) {
      const response = await searchRucCustomer(value);
      if (response.status === 200) fetchedCustomers = normalizeResponse(response.data);
    } else {
      const numericQuery = /^\d+$/.test(value);
      const looksLikeDocument = numericQuery && (value.length === 8 || value.length === 11);

      if (looksLikeDocument) {
        const response = await searchCustomerByDocument(value);
        if (response.status === 200) fetchedCustomers = normalizeResponse(response.data);

        if (!fetchedCustomers.length) {
          const fallbackResponse = await searchCustomerByName(value);
          if (fallbackResponse.status === 200) fetchedCustomers = normalizeResponse(fallbackResponse.data);
        }
      } else {
        const response = await searchCustomerByName(value);
        if (response.status === 200) fetchedCustomers = normalizeResponse(response.data);
      }
    }

    customerResults.value = fetchedCustomers;
    return !!customerResults.value.length;
  } catch (error) {
    console.error(error);
    message.error("Algo salio mal...");
    customerResults.value = [];
    return false;
  } finally {
    searching.value = false;
  }
};
const handleCustomerNameChange = (value) => {
  localCustomerName.value = value;

  if (!value) {
    localCustomerId.value = null;
    emit('update:customerName', '');
    emit('update:customerId', null);
    emit('customer-cleared');
  } else {
    emit('update:customerName', value);
  }
};

const handleCustomerSelect = async (customerId) => {
  let selectedCustomer = customerResults.value.find(c => c.id === customerId);

  if (!selectedCustomer) return;

  const needsDetailFetch =
    !Array.isArray(selectedCustomer.addresses) ||
    selectedCustomer.addresses === null ||
    selectedCustomer.phone === undefined;

  if (needsDetailFetch) {
    try {
      const response = await retrieveCustomer(customerId);
      if (response.status === 200) {
        selectedCustomer = response.data;
        const idx = customerResults.value.findIndex(c => c.id === customerId);
        if (idx !== -1) customerResults.value[idx] = selectedCustomer;
      }
    } catch (error) {
      console.error(error);
      message.error("No se pudo obtener la informacion completa del cliente");
    }
  }

  localCustomerId.value = customerId;
  localCustomerName.value = `${selectedCustomer.doc_num} - ${selectedCustomer.names}`;

  emit('update:customerId', customerId);
  emit('update:customerName', localCustomerName.value);
  emit('customer-selected', selectedCustomer);
};

const autoCreateCustomer = () => {
  if (!searching.value && !customerResults.value.length) {
    const value = localCustomerName.value;
    const isValidDoc = !isNaN(value) && 
      ((value.length === 8 && props.invoiceType !== 1) || value.length === 11);

    if (isValidDoc) {
      customerDocument.value = value;
      showModal.value = true;
    }
  }
};

const openCustomerModal = () => {
  customerDocument.value = "";
  showModal.value = true;
};

const onCloseModal = () => {
  showModal.value = false;
};

const onCustomerSuccess = (customer) => {
  const isValidCustomer = (props.invoiceType === 1 && customer.doc_type === "6") || 
                         props.invoiceType !== 1;
  if (isValidCustomer) {
    const existingCustomer = customerResults.value.find(c => c.id === customer.id);
    if (!existingCustomer) {
      customerResults.value.push(customer);
    }

    localCustomerName.value = `${customer.doc_num} - ${customer.names}`;
    localCustomerId.value = customer.id;

    emit('update:customerName', localCustomerName.value);
    emit('update:customerId', customer.id);
    emit('customer-selected', customer);
  }

  showModal.value = false;
};

watch(() => props.customerName, (newVal) => {
  localCustomerName.value = newVal;
});

watch(() => props.customerId, (newVal) => {
  localCustomerId.value = newVal;
});
</script>

<style scoped>
</style>

