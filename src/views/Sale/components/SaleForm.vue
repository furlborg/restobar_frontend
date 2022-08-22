<template>
  <n-form
    id="SaleForm"
    ref="saleForm"
    :model="sale"
    :rules="rules"
    :disabled="loading"
  >
    <n-grid responsive="screen" cols="6 s:6 m:24 l:24 xl:24 2xl:24" :x-gap="12">
      <n-form-item-gi :span="3" label="Serie">
        <n-select
          placeholder=""
          :options="saleStore.getDocumentSeriesOptions(sale.invoice_type)"
          v-model:value="sale.serie"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="3" label="Número">
        <n-input-number
          placeholder=""
          v-model:value="sale.number"
          disabled
          :show-button="false"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="4" label="Tipo documento">
        <n-select
          placeholder=""
          :options="invoiceOptions"
          v-model:value="sale.invoice_type"
          @update:value="changeSerie"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="4" label="Método de pago">
        <n-select
          placeholder=""
          :options="saleStore.getPaymentMethodsOptions"
          v-model:value="sale.payment_method"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="6" label="Fecha">
        <n-date-picker
          class="w-100"
          v-model:formatted-value="sale.date_sale"
          type="datetime"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="4">
        <n-checkbox placeholder="" v-model:checked="sale.by_consumption"
          >Por consumo</n-checkbox
        >
      </n-form-item-gi>
      <n-form-item-gi
        :span="10"
        label="Cliente"
        :show-require-mark="rules.customer.required"
        path="customer"
      >
        <n-input-group>
          <n-auto-complete
            blur-after-select
            :input-props="{
              autocomplete: 'disabled',
            }"
            v-model:value="sale.customer_name"
            :options="customerOptions"
            :get-show="showCustomerOptions"
            :loading="searchingCustomer"
            @update:value="
              (v) => {
                !v
                  ? ((sale.customer = null),
                    (sale.address = null),
                    (addressesOptions = []))
                  : null;
              }
            "
            @select="
              (value) => {
                sale.customer = value;
                sale.address = null;
                createAddressesOptions();
              }
            "
            placeholder=""
            clearable
          />
          <n-button type="info" @click="showCustomerModal = true">
            <v-icon name="md-add-round" />
          </n-button>
        </n-input-group>
      </n-form-item-gi>
      <n-form-item-gi :span="10" label="Dirección">
        <n-select
          v-model:value="sale.address"
          :options="addressesOptions"
          :disabled="!sale.customer"
          placeholder=""
          clearable
        />
      </n-form-item-gi>
    </n-grid>
    <n-space justify="end">
      <n-button
        type="info"
        secondary
        :loading="loading"
        :disabled="loading"
        @click="validateSale"
        >Guardar</n-button
      >
    </n-space>
    <!-- Customer Modal -->
    <CustomerModal
      v-model:show="showCustomerModal"
      @update:show="onCloseModal"
      :doc_type="sale.invoice_type === 1 ? '6' : null"
      @on-success="onSuccess"
    />
    <n-modal
      :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }"
      preset="card"
      v-model:show="showConfirm"
      title="Contraseña de seguridad"
      :mask-closable="false"
      closable
    >
      <n-form-item label="Ingrese contraseña de seguridad">
        <n-input type="password" v-model:value="userConfirm" placeholder="" />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="loading"
            :disabled="!userConfirm || loading"
            secondary
            @click.prevent="peformCreateSale"
            >Confirmar</n-button
          >
        </n-space>
      </template>
    </n-modal>
  </n-form>
</template>

<script>
import {
  defineComponent,
  reactive,
  ref,
  computed,
  watch,
  toRefs,
  onMounted,
} from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import CustomerModal from "@/views/Customer/components/CustomerModal";
import { retrieveCustomerAddresses } from "@/api/modules/customer";
import { useSaleStore } from "@/store/modules/sale";
import { createSale, getSaleNumber } from "@/api/modules/sales";
import { saleRules } from "@/utils/constants";
import {
  searchCustomerByName,
  searchRucCustomer,
} from "@/api/modules/customer";
import format from "date-fns/format";
export default defineComponent({
  name: "SaleForm",
  components: {
    CustomerModal,
  },
  props: {
    data: {
      type: Object,
    },
  },
  emits: ["on-success"],
  setup(props, { emit }) {
    const genericsStore = useGenericsStore();
    const saleStore = useSaleStore();
    const message = useMessage();
    const sale = reactive({
      ...props.data,
      number: null,
      do_update: false,
      is_change: false,
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss"),
    });

    const invoiceOptions = [
      {
        value: "1",
        label: "FACTURA",
      },
      {
        value: "3",
        label: "BOLETA",
      },
      {
        value: "80",
        label: "N. VENTA",
      },
    ];

    const loading = ref(false);

    const saleForm = ref(null);
    const showCustomerModal = ref(false);
    const searchingCustomer = ref(false);

    const customerResults = ref([]);

    const customerOptions = computed(() => {
      return customerResults.value.map((customer) => ({
        value: customer.id,
        label: `${customer.doc_num} - ${customer.names}`,
        disabled: customer.is_disabled,
      }));
    });

    const addressesOptions = ref([]);

    const loadCustomerAddresses = async () => {
      await retrieveCustomerAddresses(sale.customer)
        .then((response) => {
          if (response.status === 200) {
            addressesOptions.value = response.data.map((address) => ({
              value: address.id,
              label: `${address.ubigeo} - ${address.description}`,
            }));
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const createAddressesOptions = () => {
      const customer = customerResults.value.find(
        (customer) => customer.id === sale.customer
      );
      if (typeof customer !== "undefined") {
        addressesOptions.value = customer.addresses.map((address) => ({
          value: address.id,
          label: `${address.ubigeo} - ${address.description}`,
        }));
      }
      if (addressesOptions.value.length) {
        sale.address = addressesOptions.value[0].value;
      }
    };

    const rules = computed(() => {
      if (sale.invoice_type !== "1") {
        saleRules.customer.required = false;
      } else {
        saleRules.customer.required = true;
      }
      return saleRules;
    });

    const showCustomerOptions = async (value) => {
      if (value.length >= 3 && value.length <= 11) {
        searchingCustomer.value = true;
        if (sale.invoice_type === 1) {
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
              searchingCustomer.value = false;
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
              searchingCustomer.value = false;
            });
          return true;
        }
      } else {
        customerResults.value = [];
        return false;
      }
    };

    const changeSerie = (v) => {
      switch (v) {
        case "1":
          sale.customer_name = "";
          sale.customer = null;
          sale.address = null;
          sale.serie = saleStore.getFirstOption(v);
          break;
        case "3":
          sale.serie = saleStore.getFirstOption(v);
          break;
        case "80":
          sale.serie = saleStore.getFirstOption(v);
          break;
        default:
          break;
      }
    };

    const obtainSaleNumber = async () => {
      loading.value = true;
      await getSaleNumber(sale.serie)
        .then((response) => {
          if (response.status === 200) {
            sale.number = Number(response.data.number) + 1;
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

    const { serie } = toRefs(sale);

    watch(serie, async () => {
      await obtainSaleNumber();
    });

    const onCloseModal = () => {
      document.title = "Generar Venta | App";
    };

    const onSuccess = (customer) => {
      if (sale.invoice_type === 1 && customer.doc_type === "6") {
        customerResults.value.push(customer);
        sale.customer_name = `${customer.doc_num} - ${customer.names}`;
        sale.customer = customer.id;
        createAddressesOptions();
      } else if (sale.invoice_type !== 1) {
        customerResults.value.push(customer);
        sale.customer_name = `${customer.doc_num} - ${customer.names}`;
        sale.customer = customer.id;
        createAddressesOptions();
      }
      showCustomerModal.value = false;
      onCloseModal();
    };

    const validateSale = () => {
      saleForm.value.validate((errors) => {
        if (!errors) {
          showConfirm.value = true;
        } else {
          console.error(errors);
          message.error("Algo salió mal...");
        }
      });
    };

    const peformCreateSale = async () => {
      loading.value = true;
      sale.sale_details.forEach((detail) => {
        delete detail.id;
      });
      await createSale(sale, userConfirm.value)
        .then((response) => {
          if (response.status === 201) {
            message.success("Se ha generado la venta...");
            emit("on-success");
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
          userConfirm.value = "";
          loading.value = false;
        });
    };

    const showConfirm = ref(false);

    const userConfirm = ref("");

    onMounted(async () => {
      await loadCustomerAddresses();
      await obtainSaleNumber();
    });

    return {
      genericsStore,
      loading,
      rules,
      sale,
      saleForm,
      saleStore,
      invoiceOptions,
      showCustomerModal,
      customerOptions,
      showCustomerOptions,
      searchingCustomer,
      createAddressesOptions,
      addressesOptions,
      onCloseModal,
      onSuccess,
      changeSerie,
      peformCreateSale,
      validateSale,
      showConfirm,
      userConfirm,
    };
  },
});
</script>

<style>
</style>