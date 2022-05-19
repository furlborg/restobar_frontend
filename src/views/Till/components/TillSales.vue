<template>
  <div id="TillSales">
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
      :scroll-x="900"
      :columns="tableColumns"
      :data="sales"
      :loading="isTableLoading"
      :pagination="pagination"
      remote
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { createTillSalesColumns } from "@/utils/constants";
import { listSales, listSalesByPage, searchSales } from "@/api/modules/sales";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { isNumber, isLetter } from "@/utils";

export default defineComponent({
  name: "TillSales",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const till = route.params.till;
    const dateNow = ref(null);
    const message = useMessage();
    const dialog = useDialog();
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    const saleStore = useSaleStore();
    const isTableLoading = ref(false);
    const sales = ref([]);
    const showFilters = ref(false);
    const filterParams = ref({
      order__till: till,
      branch: !userStore.user.branchoffice
        ? businessStore.currentBranch
        : userStore.user.branchoffice,
      customer: "",
      serie: null,
      number: "",
      payment_method: null,
      date_sale: null,
    });

    const pagination = ref({
      pageSearchParams: {
        order__till: till,
        branch: !userStore.user.branchoffice
          ? businessStore.currentBranch
          : userStore.user.branchoffice,
        customer: "",
        serie: null,
        number: "",
        payment_method: null,
        date_sale: null,
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
        await listSalesByPage(
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
            sales.value = response.data.results;
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
        await listSalesByPage(
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
            sales.value = response.data.results;
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

    const loadSales = async () => {
      isTableLoading.value = true;
      // pagination.value.pageSize = 20;
      await listSales(filterParams.value.branch, till)
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
          sales.value = response.data.results;
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
      await searchSales(
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
          sales.value = response.data.results;
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
      filterParams.value.customer = "";
      filterParams.value.serie = null;
      filterParams.value.number = "";
      filterParams.value.payment_method = null;
      filterParams.value.date_sale = null;
      pagination.value.pageSearchParams = {
        order__till: till,
        branch: !userStore.user.branchoffice
          ? businessStore.currentBranch
          : userStore.user.branchoffice,
        customer: "",
        serie: null,
        number: "",
        payment_method: null,
        date_sale: null,
      };
      pagination.value.page = 1;
      await loadSales();
    };

    onMounted(async () => {
      document.title = "Ventas | App";
      await loadSales();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    return {
      saleStore,
      isLetter,
      isNumber,
      isTableLoading,
      pagination,
      showFilters,
      filterParams,
      refreshTable,
      performFilter,
      sales,
      businessStore,
      userStore,
      tableColumns: createTillSalesColumns(),
    };
  },
});
</script>

<style></style>
