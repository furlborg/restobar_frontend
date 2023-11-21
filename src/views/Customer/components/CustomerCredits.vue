<template>
  <n-drawer-content
    title="Créditos"
    body-content-style="padding: 5px;"
    :native-scrollbar="false"
    closable
  >
    <n-space class="mb-1" align="center" justify="space-between">
      <n-input-group v-if="tillStore.currentTillID && filters.status === 'P'">
        <n-select
          style="max-width: 200px"
          :disabled="loading"
          v-model:value="payment.payment_method"
          :options="saleStore.getPaymentMethodsOptions"
        />
        <n-input-number
          style="max-width: 200px"
          :disabled="loading || filters.status !== 'P'"
          v-model:value="payment.amount"
          placeholder="0.00"
          :show-button="false"
          step="0.5"
          min="0"
          readonly
          @update:value="amountChanged"
        />
        <n-button
          type="success"
          secondary
          :loading="loading"
          :disabled="loading || !payment.amount || filters.status !== 'P'"
          @click="generatePayment"
        >
          Pagar
        </n-button>
      </n-input-group>
      <n-input
        v-if="filters.status === 'C'"
        class="me-1"
        v-model:value="filters.document"
        placeholder="Documento"
        clearable
        @update:value="
          (v) => {
            payment = { payment_method: 1, amount: null };
            debouncedLoadCredits(v);
          }
        "
      />
      <n-select
        class="me-1"
        v-model:value="filters.status"
        placeholder="Estado"
        :options="statusOptions"
        @update:value="
          (v) => {
            payment = { payment_method: 1, amount: null };
            debouncedLoadCredits(v);
          }
        "
      />
    </n-space>
    <n-data-table
      :checked-row-keys="selectedCredits"
      :loading="loading"
      :data="credits"
      :columns="columns"
      :row-key="(row) => row.id"
      @update:checked-row-keys="generateAmountFromChecked"
    />
  </n-drawer-content>
</template>

<script>
import { defineComponent, h, ref, computed, onMounted } from "vue";
import { NTag, useMessage } from "naive-ui";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import { getCustomerCredits, payCustomerCredits } from "@/api/modules/customer";
import { debounce } from "lodash";

export default defineComponent({
  name: "CustomerCredits",
  props: {
    id: {
      type: Number,
    },
  },
  emits: ["success"],
  setup(props, { emit }) {
    const message = useMessage();

    const tillStore = useTillStore();

    const loading = ref(false);

    const credits = ref([]);

    const filters = ref({
      status: "P",
      document: null,
    });

    const columns = computed(() =>
      [
        {
          type: "selection",
          disabled(row) {
            return row.paid_amount > 0;
          },
        },
        {
          key: "codsale",
          title: "Venta",
          width: 125,
        },
        {
          key: "pending_amount",
          title: "Pendiente",
          width: 124,
          render(row) {
            return `S/. ${row.pending_amount.toFixed(2)}`;
          },
        },
        {
          key: "paid_amount",
          title: "Pagado",
          width: 125,
          render(row) {
            return `S/. ${row.paid_amount.toFixed(2)}`;
          },
        },
        {
          key: "amount",
          title: "Total",
          width: 125,
          render(row) {
            return `S/. ${row.amount.toFixed(2)}`;
          },
        },
        {
          key: "status",
          title: "Estado",
          width: 150,
          render(row) {
            return h(
              NTag,
              {
                type:
                  row.status === "A"
                    ? "error"
                    : !row.pending_amount
                    ? "success"
                    : "warning",
              },
              {
                default: () =>
                  row.status === "A"
                    ? "ANULADO"
                    : !row.pending_amount
                    ? "COBRADO"
                    : "PENDIENTE",
              }
            );
          },
        },
        {
          key: "pcodsale",
          title: "Pago",
          width: 125,
          hide: filters.value.status !== "C",
          render(row) {
            return row.payments.at(0)?.document;
          },
        },
        {
          key: "date_sale",
          title: "Fecha",
          width: 200,
          render(row) {
            return filters.value.status === "P"
              ? row.date_sale
              : row.payments.at(0)?.created;
          },
        },
      ].filter((c) => !c.hide)
    );

    const loadCredits = async () => {
      loading.value = true;
      await getCustomerCredits(props.id, filters.value)
        .then((response) => {
          if (response.status === 200) credits.value = response.data;
          credits.value.forEach((credit) => {
            credit.amount = Number(credit.amount);
            if (credit.paid_amount > credit.amount)
              credit.paid_amount = credit.amount;
            if (credit.pending_amount < 0) credit.pending_amount = 0;
            if (credit.payments.length) {
              credit.payments.reduceRight((acc, curVal) => {
                curVal.amount =
                  curVal.amount > credit.amount
                    ? credit.amount
                    : Number(curVal.amount);
                acc += curVal.amount;
                curVal.paid_amount = acc;
                const pending_amount = credit.amount - curVal.paid_amount;
                curVal.pending_amount = pending_amount;
                return acc;
              }, 0);
            } else {
              credit.paid_amount = 0;
              credit.pending_amount = credit.amount;
            }
            // credit.pending_amount = credit.amount - credit.paid_amount;
          });
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const debouncedLoadCredits = debounce(loadCredits, 250);

    const statusOptions = [
      {
        value: "P",
        label: "PENDIENTE",
      },
      {
        value: "C",
        label: "COBRADO",
      },
      {
        value: "A",
        label: "ANULADO",
      },
    ];

    const saleStore = useSaleStore();

    const payment = ref({
      payment_method: 1,
      amount: null,
    });

    const selectedCredits = ref([]);

    const generateAmountFromChecked = (rows) => {
      selectedCredits.value = rows;
      payment.value.amount = credits.value
        .filter((r) => selectedCredits.value.includes(r.id))
        .reduce((acc, curVal) => (acc += curVal.pending_amount), 0);
    };

    const generatePayment = async () => {
      loading.value = true;
      await payCustomerCredits(props.id, {
        ...payment.value,
        sales: selectedCredits.value,
      })
        .then((response) => {
          if (response.status === 201) {
            message.success("Pago efectuado!");
            loadCredits();
            payment.value = {
              payment_method: 1,
              amount: null,
            };
            emit("success", response.data);
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

    const amountChanged = (v) => {
      if (!v) {
        selectedCredits.value = [];
      } else {
        const newS = [];
        credits.value.reduce((c, credit) => {
          if (credit.paid_amount > 0) {
            const remaining_amount = c - credit.pending_amount;
            // console.log(c, credit.pending_amount, remaining_amount);
            if (credit.pending_amount + remaining_amount > 0)
              newS.push(credit.id);
            return remaining_amount;
          } else {
            return c;
          }
        }, v);
        selectedCredits.value = newS;
      }
    };

    onMounted(async () => await loadCredits());

    return {
      tillStore,
      saleStore,
      loading,
      columns,
      credits,
      payment,
      filters,
      statusOptions,
      selectedCredits,
      generateAmountFromChecked,
      debouncedLoadCredits,
      generatePayment,
      amountChanged,
    };
  },
});
</script>

<style lang="scss" scoped></style>
