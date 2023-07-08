<template>
  <div id="Order">
    <n-card title="Pedidos" :segmented="{ content: 'hard' }">
      <!-- <template #header-extra>
        <n-button
          type="info"
          secondary
          @click="$router.push({ name: 'TakeOrder' })"
          >Realizar pedido</n-button
        >
      </template> -->
      <n-space justify="space-between">
        <n-button
          type="info"
          text
          @click="
            showFilters === false ? (showFilters = true) : (showFilters = false)
          "
        >
          <v-icon name="md-filteralt-round" />
          {{ showFilters ? "Ocultar Filtros" : "Mostrar filtros" }}
        </n-button>
        <div class="d-flex">
          <n-button type="info" text @click="refreshTable">
            <v-icon name="hi-solid-refresh" />
            Recargar
          </n-button>
        </div>
      </n-space>
      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid
            responsive="screen"
            cols="6 s:6 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
          >
            <n-form-item-gi label="Fecha" :span="6">
              <n-date-picker
                type="datetimerange"
                v-model:formatted-value="filterParams.created"
                format="dd/MM/yyyy HH:mm:ss"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Tipo" :span="4">
              <n-space>
                <n-tag
                  v-model:checked="filterParams.tables"
                  size="small"
                  checkable
                  >EN MESA</n-tag
                >
                <n-tag
                  v-model:checked="filterParams.take_aways"
                  size="small"
                  checkable
                  >PARA LLEVAR</n-tag
                >
                <n-tag
                  v-model:checked="filterParams.deliverys"
                  size="small"
                  checkable
                  >DELIVERY</n-tag
                >
              </n-space>
            </n-form-item-gi>
            <n-form-item-gi label="Estado" :span="4">
              <n-select
                v-model:value="filterParams.status"
                :options="statusOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi :span="5">
              <n-button type="info" secondary @click="performFilter"
                >Buscar</n-button
              >
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table
        class="mt-2"
        :scroll-x="900"
        :columns="tableColumns"
        :data="orders"
        :loading="isTableLoading"
        :pagination="pagination"
        remote
      />
    </n-card>
    <ticket-preview v-model:show="showPreview" :data="ticketData" />
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
      <n-form-item
        v-if="
          addReason ||
          settingsStore.business_settings.order.required_null_reason
        "
        label="Motivo de anulación"
        required
      >
        <n-input v-model:value="nullReason" placeholder="" />
      </n-form-item>
      <n-space v-else justify="end">
        <n-button type="info" text @click="addReason = true"
          >Especificar motivo</n-button
        >
      </n-space>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="isLoading"
            :disabled="
              settingsStore.business_settings.order.required_null_reason ||
              addReason
                ? !passConfirm || isLoading || !nullReason
                : !passConfirm || isLoading
            "
            secondary
            @click.prevent="performNullifyTableOrder"
            >Confirmar</n-button
          >
        </n-space>
      </template>
    </n-modal>
    <!-- Details Modal -->
    <details-modal
      v-model:show="showDetailsModal"
      :id-order="idOrder"
      @update:show="onCloseModal"
    />
    <!-- Details Modal -->
    <delivery-modal
      v-model:show="showDeliveryModal"
      :delivery="delivery"
      @update:show="onCloseModal"
    />
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
      @close="
        (payments = null),
          (paymentsTotal = null),
          (currentOrder.order_id = null),
          (currentOrder.sale_id = null)
      "
    >
      <n-space justify="space-between">
        <n-tag type="info"
          >Total: S/.
          {{ paymentsTotal ? paymentsTotal.toFixed(2) : null }}</n-tag
        >
        <n-tag :type="evalPayments ? 'error' : 'success'"
          >Monto: S/. {{ showPayments ? currentPaymentsAmount : null }}</n-tag
        >
        <n-tag :type="evalPayments ? 'error' : 'warning'"
          >Faltante: S/.
          {{
            showPayments
              ? parseFloat(paymentsTotal - currentPaymentsAmount).toFixed(2)
              : null
          }}</n-tag
        >
      </n-space>
      <n-form-item class="mt-2" label="Pagos">
        <n-dynamic-input
          v-model:value="payments"
          :min="1"
          @create="createPayment"
        >
          <template #default="{ value }">
            <div style="display: flex; align-items: center; width: 100%">
              <n-select
                v-model:value="value.payment_method"
                :options="filteredMethods"
                :disabled="isTableLoading"
              />
              <n-input
                class="ms-2"
                v-model:value="value.amount"
                placeholder=""
                :disabled="isTableLoading"
                @keypress="isDecimal($event)"
              />
            </div>
          </template>
        </n-dynamic-input>
      </n-form-item>
      <n-space justify="end">
        <n-button
          type="success"
          :disabled="
            evalPayments ||
            payments.some((pay) => pay.payment_method === null) ||
            payments.some((pay) => Number(pay.amount) <= 0) ||
            isTableLoading
          "
          :loading="isTableLoading"
          secondary
          @click="performUpdateOrderStatus"
          >Confirmar</n-button
        >
      </n-space>
    </n-modal>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { set, format } from "date-fns";
import DetailsModal from "./components/DetailsModal";
import DeliveryModal from "./components/DeliveryModal";
import TicketPreview from "./components/TicketPreview";
import { createOrderColumns } from "@/utils/constants";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import { useSettingsStore } from "@/store/modules/settings";
import { useGenericsStore } from "@/store/modules/generics";
import { sendSale } from "@/api/modules/sales";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { isNumber, isLetter, isDecimal } from "@/utils";
import {
  listOrders,
  listOrdersByPage,
  searchOrders,
  nullOrder,
  updateOrderStatus,
  retrieveOrder,
} from "@/api/modules/orders";
import { cancelTableOrder } from "@/api/modules/tables";

export default defineComponent({
  name: "Order",
  components: {
    DetailsModal,
    DeliveryModal,
    TicketPreview,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const saleStore = useSaleStore();
    const businessStore = useBusinessStore();
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const userStore = useUserStore();
    const tillStore = useTillStore();
    const isLoading = ref(false);
    const isTableLoading = ref(false);
    const showDetailsModal = ref(false);
    const showDeliveryModal = ref(false);
    const orders = ref([]);
    const idOrder = ref(0);
    const delivery = ref({});
    const showFilters = ref(false);
    const today = set(new Date(Date.now()), {
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    const filterParams = ref({
      created: [
        format(today, "dd/MM/yyyy HH:mm:ss"),
        format(
          set(today, { hours: 23, minutes: 59, seconds: 59 }),
          "dd/MM/yyyy HH:mm:ss"
        ),
      ],
      take_aways: true,
      tables: true,
      deliverys: true,
      status: null,
    });
    const pagination = ref({
      pageSearchParams: {
        created: [
          format(today, "dd/MM/yyyy HH:mm:ss"),
          format(
            set(today, { hours: 23, minutes: 59, seconds: 59 }),
            "dd/MM/yyyy HH:mm:ss"
          ),
        ],
        take_aways: true,
        tables: true,
        deliverys: true,
        status: null,
      },
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize: 20,
      showSizePicker: true,
      pageSizes: [20, 50, 100],
      onChange: async (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        await listOrdersByPage(
          pagination.value.pageSearchParams,
          pagination.value.page,
          pagination.value.pageSize
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
              ++pagination.value.pageCount;
            }
            orders.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isTableLoading.value = false;
          });
      },
      onPageSizeChange: async (pageSize) => {
        isTableLoading.value = true;
        pagination.value.pageSize = pageSize;
        await listOrdersByPage(
          pagination.value.pageSearchParams,
          pagination.value.page,
          pagination.value.pageSize
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
              ++pagination.value.pageCount;
            }
            orders.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isTableLoading.value = false;
          });
      },
    });

    const loadOrders = async () => {
      isTableLoading.value = true;
      // pagination.value.pageSize = 20;
      await listOrders(filterParams.value)
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
          ) {
            ++pagination.value.pageCount;
          }
          orders.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    const performFilter = async () => {
      isTableLoading.value = true;
      pagination.value.pageSearchParams = filterParams.value;
      pagination.value.page = 1;
      await searchOrders(
        pagination.value.pageSearchParams,
        pagination.value.page,
        pagination.value.pageSize
      )
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
          ) {
            ++pagination.value.pageCount;
          }
          orders.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    const refreshTable = async () => {
      filterParams.value.created = [
        format(today, "dd/MM/yyyy HH:mm:ss"),
        format(
          set(today, { hours: 23, minutes: 59, seconds: 59 }),
          "dd/MM/yyyy HH:mm:ss"
        ),
      ];
      filterParams.value.take_aways = true;
      filterParams.value.tables = true;
      filterParams.value.deliverys = true;
      filterParams.value.status = null;
      pagination.value.pageSearchParams = {
        created: [
          format(today, "dd/MM/yyyy HH:mm:ss"),
          format(
            set(today, { hours: 23, minutes: 59, seconds: 59 }),
            "dd/MM/yyyy HH:mm:ss"
          ),
        ],
        take_aways: true,
        tables: true,
        deliverys: true,
        status: null,
      };
      pagination.value.page = 1;
      await loadOrders();
    };

    const statusOptions = [
      {
        value: "1",
        label: "PENDIENTE",
      },
      {
        value: "2",
        label: "COBRADO",
      },
      {
        value: "3",
        label: "ANULADO",
      },
    ];

    const onCloseModal = () => {
      idOrder.value = 0;
      delivery.value = null;
    };

    const showConfirm = ref(false);

    const passConfirm = ref("");

    const deleteTable = ref(null);

    const addReason = ref(false);

    const nullReason = ref(undefined);

    const closeNullModal = () => {
      addReason.value = false;
      passConfirm.value = "";
      nullReason.value = undefined;
    };

    const deleteId = ref(null);

    const performNullifyTableOrder = async () => {
      isLoading.value = true;
      if (!deleteTable.value) {
        await nullOrder(deleteId.value, nullReason.value, passConfirm.value)
          .then((response) => {
            if (response.status === 202) {
              message.success("Pedido anulado correctamente!");
              showConfirm.value = false;
              deleteId.value = null;
              passConfirm.value = "";
              isLoading.value = false;
              pagination.value.onChange(pagination.value.page);
            }
          })
          .catch((error) => {
            if (error.response.status === 409) {
              message.error("Anulación incompleta");
              message.error("Envio manual necesario");
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
            passConfirm.value = "";
            isLoading.value = false;
          });
      } else {
        await cancelTableOrder(
          deleteTable.value,
          passConfirm.value,
          nullReason.value
        )
          .then((response) => {
            if (response.status === 202) {
              message.success("Pedido anulado correctamente!");
              showConfirm.value = false;
              deleteTable.value = null;
              passConfirm.value = "";
              isLoading.value = false;
              pagination.value.onChange(pagination.value.page);
            }
          })
          .catch((error) => {
            if (error.response.status === 409) {
              message.error("Anulación incompleta");
              message.error("Envio manual necesario");
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
            passConfirm.value = "";
            isLoading.value = false;
          });
      }
    };

    onMounted(async () => {
      await loadOrders();
    });

    const currentOrder = ref({
      order_id: null,
      sale_id: null,
    });

    const payments = ref(null);

    const paymentsTotal = ref(null);

    const showPayments = ref(false);

    const createPayment = () => {
      return {
        payment_method: null,
        amount: "0",
      };
    };

    const filteredMethods = computed(() => {
      return saleStore.getPaymentMethodsOptions.map((option) => ({
        value: option.value,
        label: option.label,
        disabled: payments.value.some(
          (pay) => pay.payment_method === option.value
        ),
      }));
    });

    const evalPayments = computed(() => {
      if (payments.value) {
        return (
          payments.value.reduce((acc, val) => {
            return (acc += parseFloat(val.amount));
          }, 0) !== paymentsTotal.value
        );
      } else {
        return true;
      }
    });

    const performUpdateOrderStatus = async () => {
      isTableLoading.value = true;
      await updateOrderStatus(currentOrder.value.order_id, payments.value)
        .then((response) => {
          if (response.status === 202) {
            message.success("¡Pedido cobrado!");
            showPayments.value = false;
            const json = JSON.parse(response.data.json_sale);
            if (
              settingsStore.businessSettings.sale.auto_send &&
              json.codigo_tipo_documento !== "80"
            ) {
              sendSale(currentOrder.value.sale_id)
                .then((response) => {
                  if (response.status === 200) {
                    message.success("Enviado!");
                  }
                })
                .catch((error) => {
                  if (error.response.status === 400) {
                    message.error(error.response.data.error);
                  } else {
                    console.error(error);
                    message.error("Algo salió mal...");
                  }
                });
            }
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          pagination.value.onChange(pagination.value.page);
          // loadOrders();
        });
    };

    const currentPaymentsAmount = computed(() => {
      if (payments.value) {
        let sum = payments.value.reduce((acc, val) => {
          return (acc += parseFloat(val.amount));
        }, 0);
        return isNaN(sum) ? "0.00" : sum.toFixed(2);
      } else {
        return "0.00";
      }
    });

    const showPreview = ref(false);

    const ticketData = ref(null);

    return {
      settingsStore,
      isLetter,
      isNumber,
      isDecimal,
      isTableLoading,
      statusOptions,
      pagination,
      showFilters,
      filterParams,
      refreshTable,
      performFilter,
      businessStore,
      userStore,
      idOrder,
      orders,
      showDetailsModal,
      delivery,
      showDeliveryModal,
      onCloseModal,
      isLoading,
      showConfirm,
      addReason,
      nullReason,
      closeNullModal,
      passConfirm,
      genericsStore,
      performNullifyTableOrder,
      currentOrder,
      payments,
      paymentsTotal,
      showPayments,
      createPayment,
      filteredMethods,
      evalPayments,
      performUpdateOrderStatus,
      currentPaymentsAmount,
      showPreview,
      ticketData,
      tableColumns: createOrderColumns({
        showDetails(row) {
          idOrder.value = row.id;
          showDetailsModal.value = true;
        },
        showDeliveryInfo(row) {
          delivery.value = row.delivery_info;
          showDeliveryModal.value = true;
        },
        payDeliver(row) {
          paymentsTotal.value = parseFloat(row.amount);
          if (
            !settingsStore.business_settings.till.delivery_affects_till &&
            row.order_type === "D"
          ) {
            paymentsTotal.value -= parseFloat(row.delivery_info.amount);
          }
          currentOrder.value.order_id = row.id;
          currentOrder.value.sale_id = row.sale_id;
          payments.value = [
            {
              payment_method: Number(row.payment_method),
              amount: String(paymentsTotal.value.toFixed(2)),
            },
          ];
          showPayments.value = true;
        },
        async printOrder(row) {
          await retrieveOrder(row.id)
            .then((response) => {
              ticketData.value = response.data;
              showPreview.value = true;
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            });
        },
        nullifyOrder(row) {
          showConfirm.value = true;
          if (row.table) {
            deleteTable.value = row.table;
          } else {
            deleteId.value = row.id;
          }
        },
      }),
    };
  },
});
</script>

<style></style>
