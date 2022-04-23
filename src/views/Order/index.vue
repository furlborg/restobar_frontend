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
    <n-modal
      class="w-25"
      preset="card"
      v-model:show="showConfirm"
      title="Anular pedido"
      :mask-closable="false"
      closable
    >
      <n-form-item label="Ingrese clave de seguridad">
        <n-input type="password" v-model:value="passConfirm" placeholder="" />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="isLoading"
            :disabled="!passConfirm || isLoading"
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
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { set, format } from "date-fns";
import DetailsModal from "./components/DetailsModal";
import DeliveryModal from "./components/DeliveryModal";
import { createOrderColumns } from "@/utils/constants";
import { useBusinessStore } from "@/store/modules/business";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { isNumber, isLetter } from "@/utils";
import {
  listOrders,
  listOrdersByPage,
  searchOrders,
  nullOrder,
  updateOrderStatus,
} from "@/api/modules/orders";
import { cancelTableOrder } from "@/api/modules/tables";

export default defineComponent({
  name: "Order",
  components: {
    DetailsModal,
    DeliveryModal,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const businessStore = useBusinessStore();
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
      till: tillStore.currentTillID,
      created: [
        format(today, "dd/MM/yyyy HH:mm:ss"),
        format(
          set(today, { hours: 23, minutes: 59, seconds: 59 }),
          "dd/MM/yyyy HH:mm:ss"
        ),
      ],
      take_aways: true,
      tables: false,
      deliverys: true,
      status: null,
    });
    const pagination = ref({
      pageSearchParams: {
        till: tillStore.currentTillID,
        created: [
          format(today, "dd/MM/yyyy HH:mm:ss"),
          format(
            set(today, { hours: 23, minutes: 59, seconds: 59 }),
            "dd/MM/yyyy HH:mm:ss"
          ),
        ],
        take_aways: true,
        tables: false,
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
      filterParams.value.till = tillStore.currentTillID;
      filterParams.value.created = [
        format(today, "dd/MM/yyyy HH:mm:ss"),
        format(
          set(today, { hours: 23, minutes: 59, seconds: 59 }),
          "dd/MM/yyyy HH:mm:ss"
        ),
      ];
      filterParams.value.take_aways = true;
      filterParams.value.tables = false;
      filterParams.value.deliverys = true;
      filterParams.value.status = null;
      pagination.value.pageSearchParams = {
        till: tillStore.currentTillID,
        created: [
          format(today, "dd/MM/yyyy HH:mm:ss"),
          format(
            set(today, { hours: 23, minutes: 59, seconds: 59 }),
            "dd/MM/yyyy HH:mm:ss"
          ),
        ],
        take_aways: true,
        tables: false,
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
      document.title = "Pedidos | App";
      idOrder.value = 0;
      delivery.value = null;
    };

    const showConfirm = ref(false);

    const passConfirm = ref("");

    const deleteTable = ref(null);

    const deleteId = ref(null);

    const performNullifyTableOrder = async () => {
      isLoading.value = true;
      if (!deleteTable.value) {
        await nullOrder(deleteId.value, passConfirm.value)
          .then((response) => {
            if (response.status === 202) {
              message.success("Pedido anulado correctamente!");
              showConfirm.value = false;
              deleteId.value = null;
              passConfirm.value = "";
              isLoading.value = false;
              loadOrders();
            }
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
            passConfirm.value = "";
            isLoading.value = false;
          });
      } else {
        await cancelTableOrder(deleteTable.value, passConfirm.value)
          .then((response) => {
            if (response.status === 202) {
              message.success("Pedido anulado correctamente!");
              showConfirm.value = false;
              deleteTable.value = null;
              passConfirm.value = "";
              isLoading.value = false;
              loadOrders();
            }
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
            passConfirm.value = "";
            isLoading.value = false;
          });
      }
    };

    onMounted(async () => {
      document.title = "Pedidos | App";
      await loadOrders();
    });

    return {
      isLetter,
      isNumber,
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
      passConfirm,
      performNullifyTableOrder,
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
          dialog.success({
            title: "Pedido cobrado",
            content: "¿El pedido ya ha sido cobrado?",
            positiveText: "Si",
            negativeText: "No",
            onPositiveClick: async () => {
              isTableLoading.value = true;
              await updateOrderStatus(row.id)
                .then((response) => {
                  if (response.status === 202) {
                    message.success("¡Pedido cobrado!");
                  }
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Algo salió mal...");
                })
                .finally(() => {
                  loadOrders();
                });
            },
            onNegativeClick: () => {},
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

<style>
</style>