<template>
  <div class="p-2">
    <n-space class="pb-2" justify="space-between">
      <div>
        Pagado:
        <n-text type="success">S/. {{ sale.paid_amount.toFixed(2) }}</n-text>
      </div>
      <div>
        Pendiente:
        <n-text type="warning">S/. {{ sale.pending_amount.toFixed(2) }}</n-text>
      </div>
      <div>
        Total:
        <n-text type="info">S/. {{ sale.amount.toFixed(2) }}</n-text>
      </div>
    </n-space>
    <n-input-group v-if="sale.status === 'A' ? false : sale.pending_amount">
      <n-select
        style="max-width: 200px"
        :disabled="loading"
        v-model:value="payment.payment_method"
        :options="saleStore.getPaymentMethodsOptions"
      />
      <n-input-number
        class="w-100"
        :disabled="loading"
        v-model:value="payment.amount"
        placeholder="0.00"
        :show-button="false"
        step="0.5"
        min="0"
        :max="sale.pending_amount"
      />
      <n-button
        type="success"
        secondary
        :loading="loading"
        :disabled="loading || !payment.amount"
        @click="createPayment"
      >
        Pagar
      </n-button>
    </n-input-group>
    <n-data-table
      class="mt-2"
      size="small"
      :columns="columns"
      :data="sale.payments"
      :row-props="rowProps"
    />
    <!-- <n-divider title-placement="left">PAGAR</n-divider> -->
    <sale-credit-drawer
      v-model:show="show"
      :data="sale"
      :payment="selectedPayment"
    />
    <n-modal
      :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }"
      preset="card"
      v-model:show="showConfirm"
      title="Anular pedido"
      :mask-closable="false"
      closable
      @close="closeNullModal"
    >
      <n-form-item label="Ingrese clave de seguridad" required>
        <n-input type="password" v-model:value="passConfirm" placeholder="" />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="isLoading"
            :disabled="!passConfirm || isLoading"
            secondary
            @click.prevent="performNullifySale"
            >Confirmar</n-button
          >
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { defineComponent, ref, h } from "vue";
import { useMessage, NButton } from "naive-ui";
import { renderIcon } from "@/utils";
import { useSaleStore } from "@/store/modules/sale";
import { createSaleCredit } from "@/api/modules/sales";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import { secureNullifyDetail } from "@/api/modules/tills";
import SaleCreditDrawer from "./SaleCreditDrawer";

export default defineComponent({
  name: "SaleCreditPaymentsTab",
  components: {
    SaleCreditDrawer,
  },
  props: {
    data: {
      type: Object,
    },
  },
  emits: ["success"],
  setup(props, { emit }) {
    const saleStore = useSaleStore();

    const genericsStore = useGenericsStore();

    const settingsStore = useSettingsStore();

    const sale = ref({ ...props.data });

    const loading = ref(false);

    const show = ref(false);

    const message = useMessage();

    const deleteId = ref(0);

    const showConfirm = ref(false);

    const columns = [
      {
        key: "amount",
        title: "Monto",
        render(row) {
          return `S/. ${row.amount.toFixed(2)}`;
        },
      },
      {
        key: "paid_amount",
        title: "Pagado",
        render(row) {
          return `S/. ${row.paid_amount.toFixed(2)}`;
        },
      },
      {
        key: "pending_amount",
        title: "Pendiente",
        render(row) {
          return `S/. ${row.pending_amount.toFixed(2)}`;
        },
      },
      {
        key: "created",
        title: "Fecha",
      },
      {
        key: "delete",
        title: "",
        render(row) {
          return h(
            NButton,
            {
              class: "me-2",
              type: "error",
              text: true,
              disabled: true,
              onClick: (e) => {
                e.stopPropagation();
                deleteId.value = row.id;
                showConfirm.value = true;
              },
            },
            renderIcon("md-cancel-twotone")
          );
        },
      },
    ];

    const payment = ref({
      sale: sale.value.id,
      payment_method: 1,
      amount: null,
    });

    const createPayment = async () => {
      try {
        loading.value = true;
        const { status, data } = await createSaleCredit(payment.value);
        if (status === 201) {
          message.success("Pago realizado!");
          data.amount = Number(data.amount);
          data.payments.reduceRight((acc, curVal) => {
            curVal.amount = Number(curVal.amount);
            acc += curVal.amount;
            curVal.paid_amount = acc;
            curVal.pending_amount = data.amount - curVal.paid_amount;
            return acc;
          }, 0);
          sale.value = { ...data };
          payment.value.payment_method = 1;
          payment.value.amount = null;
          selectedPayment.value = 0;
          show.value = true;
          emit("success", data);
        }
      } catch (error) {
        console.error(error);
        message.error("Algo salió mal...");
      } finally {
        loading.value = false;
      }
    };

    const selectedPayment = ref(0);

    const rowProps = (row, index) => ({
      style: { cursor: "pointer" },
      onClick: () => {
        selectedPayment.value = index;
        show.value = true;
      },
    });

    const isLoading = ref(false);

    const passConfirm = ref("");

    const closeNullModal = () => {
      isLoading.value = false;
      passConfirm.value = "";
    };

    const performNullifySale = async () => {
      isLoading.value = true;
      await secureNullifyDetail(deleteId.value, passConfirm.value)
        .then((response) => {
          if (response.status === 202) {
            message.success("Anulado");
            showConfirm.value = false;
            deleteId.value = null;
            passConfirm.value = "";
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    return {
      genericsStore,
      settingsStore,
      loading,
      columns,
      sale,
      saleStore,
      payment,
      createPayment,
      rowProps,
      show,
      selectedPayment,
      showConfirm,
      isLoading,
      passConfirm,
      closeNullModal,
      performNullifySale,
    };
  },
});
</script>

<style lang="scss" scoped></style>
