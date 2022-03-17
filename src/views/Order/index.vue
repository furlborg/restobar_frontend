<template>
  <div id="Order">
    <n-card title="Ventas" :segmented="{ content: 'hard' }">
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
          <n-select
            v-if="!userStore.user.branchoffice"
            class="ps-2"
            v-model:value="filterParams.branch"
            :options="businessStore.branchSelectOptions"
            @update:value="refreshTable"
          ></n-select>
        </div>
      </n-space>
      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid
            responsive="screen"
            cols="6 s:6 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
          >
            <n-form-item-gi label="Cliente" :span="4">
              <n-input
                v-model:value="filterParams.customer"
                placeholder=""
                @keypress="isLetter($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Serie" :span="2">
              <n-select
                v-model:value="filterParams.serie"
                :options="saleStore.getSeriesOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Número" :span="2">
              <n-input
                v-model:value="filterParams.number"
                placeholder=""
                @keypress="isNumber($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-select
                v-model:value="filterParams.payment_method"
                :options="saleStore.getPaymentMethodsOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Estado" :span="2">
              <n-select
                v-model:value="filterParams.status"
                :options="statusOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha" :span="6">
              <n-date-picker
                type="daterange"
                v-model:formatted-value="filterParams.date_sale"
                format="dd/MM/yyyy"
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
        :columns="tableColumns"
        :data="orders"
        :loading="isTableLoading"
        :pagination="orders.length > 20 ? pagination : {}"
        remote
      />
    </n-card>
    <!-- Details Modal -->
    <details-modal
      v-model:show="showModal"
      :id-order="idOrder"
      @update:show="onCloseModal"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage, useDialog } from "naive-ui";
import DetailsModal from "./components/DetailsModal";
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
} from "@/api/modules/orders";

export default defineComponent({
  name: "Order",
  components: {
    DetailsModal,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    const tillStore = useTillStore();
    const isTableLoading = ref(false);
    const showModal = ref(false);
    const orders = ref([]);
    const idOrder = ref(0);
    const showFilters = ref(false);
    const filterParams = ref({
      till: tillStore.currentTillID,
    });
    const pagination = ref({
      pageSearchParams: null,
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize: 20,
      showSizePicker: true,
      pageSizes: [20, 50, 100],
      onChange: (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        listOrdersByPage(
          pagination.value.pageSearchParams,
          pagination.value.page,
          pagination.value.pageSize
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (Number(response.data.count) % pagination.value.pageSize !== 0) {
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
      onPageSizeChange: (pageSize) => {
        isTableLoading.value = true;
        pagination.value.pageSize = pageSize;
        listOrdersByPage(
          pagination.value.pageSearchParams,
          pagination.value.page,
          pagination.value.pageSize
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (Number(response.data.count) % pagination.value.pageSize !== 0) {
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

    const loadOrders = () => {
      isTableLoading.value = true;
      // pagination.value.pageSize = 20;
      listOrders(filterParams.value.till)
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (Number(response.data.count) % pagination.value.pageSize !== 0) {
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

    const performFilter = () => {
      isTableLoading.value = true;
      pagination.value.pageSearchParams = filterParams.value;
      pagination.value.page = 1;
      searchOrders(
        pagination.value.pageSearchParams,
        pagination.value.page,
        pagination.value.pageSize
      )
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (Number(response.data.count) % pagination.value.pageSize !== 0) {
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

    const refreshTable = () => {
      pagination.value.pageSearchParams = null;
      pagination.value.page = 1;
      loadOrders();
    };

    const statusOptions = [
      {
        value: "N",
        label: "NUEVO",
      },
      {
        value: "E",
        label: "ENVIADO",
      },
      {
        value: "A",
        label: "ANULADO",
      },
    ];

    const onCloseModal = () => {
      document.title = "Pedidos | App";
      idOrder.value = 0;
    };

    onMounted(() => {
      document.title = "Pedidos | App";
      loadOrders();
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
      showModal,
      onCloseModal,
      tableColumns: createOrderColumns({
        showDetails(row) {
          idOrder.value = row.id;
          showModal.value = true;
        },
        payDeliver(row) {
          message.success("Pagar delivery");
        },
        nullifyOrder(row) {
          dialog.error({
            title: "Anular venta",
            content: "¿Desea anular venta?",
            positiveText: "Si",
            negativeText: "No",
            onPositiveClick: async () => {
              isTableLoading.value = true;
              await nullOrder(row.id)
                .then((response) => {
                  if (response.status === 204) {
                    message.success("Anulado");
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
      }),
    };
  },
});
</script>

<style>
</style>