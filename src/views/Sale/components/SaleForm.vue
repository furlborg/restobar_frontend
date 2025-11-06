<template>
  <n-form
    id="SaleForm"
    ref="saleForm"
    :model="sale"
    :rules="rules"
    :disabled="loading"
  >
    <n-alert
      v-if="recoveryInfo"
      type="info"
      class="mb-3"
      title="Canje registrado"
    >
      <n-space vertical size="4">
        <n-text>
          {{
            recoveryInfo.isRecovery
              ? `Este comprobante reemplaza ${recoveryInfo.document}`
              : `Este comprobante fue reemplazado por ${recoveryInfo.document}`
          }}
        </n-text>
        <n-text v-if="recoveryInfo.reference" depth="3">
          {{ recoveryInfo.reference }}
        </n-text>
      </n-space>
    </n-alert>
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
          :min="0.0005"
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
      <n-form-item-gi :span="4" label="Condición de pago">
        <n-select
          placeholder=""
          :options="paymentConditionOptions"
          v-model:value="sale.payment_condition"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="6" label="Fecha">
        <n-date-picker
          class="w-100"
          v-model:formatted-value="sale.date_sale"
          type="datetime"
        />
      </n-form-item-gi>
      <n-form-item-gi
        v-if="isCredit"
        :span="4"
        label="Fecha de vencimiento"
        path="expiration_sale"
      >
        <n-date-picker
          class="w-100"
          v-model:formatted-value="sale.expiration_sale"
          type="date"
          format="dd/MM/yyyy"
          value-format="dd/MM/yyyy"
          :is-date-disabled="disableExpirationDate"
        />
      </n-form-item-gi>
      <n-form-item-gi :span="4">
        <n-checkbox
          placeholder=""
          v-model:checked="sale.by_consumption"
          :disabled="isCredit"
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
      :doc_type="sale.invoice_type === '1' ? '6' : null"
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
      title="¿Desea editar la venta?"
      :mask-closable="false"
      closable
    >
            <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="loading"
            :disabled="loading"
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
import { useSettingsStore } from "@/store/modules/settings";
import CustomerModal from "@/views/Customer/components/CustomerModal";
import { retrieveCustomerAddresses } from "@/api/modules/customer";
import { useSaleStore } from "@/store/modules/sale";
import { recoverySale, getSaleNumber, sendSale } from "@/api/modules/sales";
import { saleRules } from "@/utils/constants";
import {
  searchCustomerByName,
  searchRucCustomer,
} from "@/api/modules/customer";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfDay from "date-fns/startOfDay";
export default defineComponent({
  name: "SaleForm",
  components: {
    CustomerModal,
  },
  props: {
    id: {
      type: Number,
    },
    data: {
      type: Object,
    },
  },
  emits: ["on-success"],
  setup(props, { emit }) {
    const genericsStore = useGenericsStore();
    const settingsStore = useSettingsStore();
    const saleStore = useSaleStore();
    const message = useMessage();
    const normalizePaymentCondition = (value) => {
      const parsed = Number(value);
      return parsed === 2 ? 2 : 1;
    };

    const sale = reactive({
      ...props.data,
      number: null,
      do_update: false,
      is_change: false,
      date_sale: format(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss"),
    });

    sale.payment_condition =
      typeof sale.payment_condition === "undefined" ||
      sale.payment_condition === null
        ? 1
        : normalizePaymentCondition(sale.payment_condition);
    if (sale.payment_condition === 2) {
      sale.expiration_sale = sale.expiration_sale ?? null;
    } else {
      sale.expiration_sale = null;
    }

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

    const paymentConditionOptions = [
      {
        value: 1,
        label: "CONTADO",
      },
      {
        value: 2,
        label: "CRÉDITO",
      },
    ];

    const loading = ref(false);

    const saleForm = ref(null);
    const showCustomerModal = ref(false);
    const searchingCustomer = ref(false);
    const showConfirm = ref(false);

    const customerResults = ref([]);

    const customerOptions = computed(() => {
      return customerResults.value.map((customer) => ({
        value: customer.id,
        label: `${customer.doc_num} - ${customer.names}`,
        disabled: customer.is_disabled,
      }));
    });

    const addressesOptions = ref([]);

    const isCredit = computed(() => Number(sale.payment_condition) === 2);

    const expirationMinDate = computed(() => {
      const saleDate = sale.date_sale;
      if (!saleDate) {
        return null;
      }
      try {
        const pattern = saleDate.includes(" ") ? "dd/MM/yyyy HH:mm:ss" : "dd/MM/yyyy";
        const parsedDate = parse(saleDate, pattern, new Date());
        return startOfDay(parsedDate).getTime();
      } catch {
        return null;
      }
    });

    const disableExpirationDate = (ts) => {
      const limit = expirationMinDate.value;
      if (limit === null) {
        return false;
      }
      return ts <= limit;
    };

    const recoveryInfo = computed(() => {
      const document =
        sale.recovery_of_document ??
        (sale.recovery_of ? `Venta #${sale.recovery_of}` : null);
      if (!document) {
        return null;
      }
      return {
        isRecovery: Boolean(sale.is_recovery),
        document,
        reference: sale.recovery_of
          ? `ID original: #${sale.recovery_of}`
          : null,
      };
    });

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
      saleRules.customer.required = sale.invoice_type === "1";
      return saleRules;
    });

    watch(
      () => sale.payment_condition,
      (value) => {
        const normalized = normalizePaymentCondition(value);
        if (normalized !== value) {
          sale.payment_condition = normalized;
          return;
        }
        if (normalized !== 2) {
          sale.expiration_sale = null;
        } else if (!sale.expiration_sale) {
          sale.expiration_sale = null;
        }
      }
    );

    const showCustomerOptions = async (value) => {
      if (value.length >= 3 && value.length <= 11) {
        searchingCustomer.value = true;
        if (sale.invoice_type === "1") {
          await searchRucCustomer(value)
            .then((response) => {
              if (response.status === 200) {
                customerResults.value = response.data;
              }
            })
            .catch((error) => {
              console.error(error);
              
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
          
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const { serie } = toRefs(sale);

    watch(serie, async () => {
      await obtainSaleNumber();
    });

    const onCloseModal = () => {};

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

    const ensureCreditExpiration = () => {
      if (isCredit.value && !sale.expiration_sale) {
        message.error("Debe ingresar la fecha de vencimiento para ventas al crédito.");
        return false;
      }
      return true;
    };

    const validateSale = () => {
      saleForm.value.validate((errors) => {
        if (!errors) {
          if (!ensureCreditExpiration()) {
            return;
          }
          showConfirm.value = true;
        } else {
          console.error(errors);
          
        }
      });
    };

    const peformCreateSale = async () => {
      if (!ensureCreditExpiration()) {
        showConfirm.value = false;
        return;
      }
      loading.value = true;
      if (Array.isArray(sale.sale_details)) {
        sale.sale_details.forEach((detail) => {
          delete detail.id;
        });
      }
      await recoverySale(props.id, sale)
        .then((response) => {
          if (response.status === 201) {
            message.success("Se ha generado la venta...");
            emit("on-success");
            showConfirm.value = false;
            const json = JSON.parse(response.data.json_sale);
            if (
              settingsStore.businessSettings.sale.auto_send &&
              json.codigo_tipo_documento !== "80"
            ) {
              sendSale(response.data.id)
                .then((response) => {
                  if (response.status === 200) {
                    message.success("Enviado!");
                  }
                })
                .catch((error) => {
                  if (error.response.status === 400) {
                    message.error(error.response.data);
                  } else {
                    console.error(error);
                    
                  }
                });
            }
          }
        })
        .catch((error) => {
          console.error(error);
          
        })
        .finally(() => {
          loading.value = false;
        });
    };

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
      paymentConditionOptions,
      showCustomerModal,
      customerOptions,
      showCustomerOptions,
      searchingCustomer,
      createAddressesOptions,
      addressesOptions,
      isCredit,
      recoveryInfo,
      settingsStore,
      onCloseModal,
      onSuccess,
      changeSerie,
      peformCreateSale,
      validateSale,
      showConfirm,
      disableExpirationDate,

    };
  },
});
</script>

<style></style>
