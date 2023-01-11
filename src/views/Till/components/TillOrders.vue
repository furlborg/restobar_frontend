<template>
  <div id="TillOrders">
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
import { useRoute, useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { set, format } from "date-fns";
import DetailsModal from "@/views/Order/components/DetailsModal";
import DeliveryModal from "@/views/Order/components/DeliveryModal";
import { createTillOrderColumns } from "@/utils/constants";
import { useBusinessStore } from "@/store/modules/business";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { isNumber, isLetter } from "@/utils";
import {
  listOrders,
  listOrdersByPage,
  searchOrders,
} from "@/api/modules/orders";

export default defineComponent({
  name: "TillOrders",
  components: {
    DetailsModal,
    DeliveryModal,
  },
  setup() {
    const route = useRoute();
    const till = route.params.till;
    const message = useMessage();
    const businessStore = useBusinessStore();
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
    const filterParams = ref({
      till: till,
      created: null,
      take_aways: true,
      tables: true,
      deliverys: true,
      status: null,
    });
    const pagination = ref({
      pageSearchParams: {
        till: till,
        created: null,
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
      filterParams.value.till = till;
      filterParams.value.created = null;
      filterParams.value.take_aways = true;
      filterParams.value.tables = true;
      filterParams.value.deliverys = true;
      filterParams.value.status = null;
      pagination.value.pageSearchParams = {
        till: till,
        created: null,
        take_aways: true,
        tables: true,
        deliverys: true,
        status: null,
      };
      pagination.value.page = 1;
      await loadOrders();
    };

    const onCloseModal = () => {
      idOrder.value = 0;
      delivery.value = null;
    };

    onMounted(async () => {
      await loadOrders();
    });

    return {
      isLetter,
      isNumber,
      isTableLoading,
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
      genericsStore,
      statusOptions,
      tableColumns: createTillOrderColumns({
        showDetails(row) {
          idOrder.value = row.id;
          showDetailsModal.value = true;
        },
        showDeliveryInfo(row) {
          delivery.value = row.delivery_info;
          showDeliveryModal.value = true;
        },
      }),
    };
  },
});
</script>

<style></style>
