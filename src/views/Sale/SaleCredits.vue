<template>
  <n-card content-style="padding: 20px;" id="SaleCredits">
    <n-page-header @back="$router.push({ name: 'Sales' })">
      <template #title>
        <n-text class="fs-2">Créditos</n-text>
      </template>
      <!-- <template #extra>
        <n-button type="info" secondary></n-button>
      </template> -->
    </n-page-header>
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
        <n-button type="info" text @click="loadCredits">
          <v-icon name="hi-solid-refresh" />
          Recargar
        </n-button>
      </div>
    </n-space>
    <n-collapse-transition class="my-2" :show="showFilters">
      <n-grid responsive="screen" cols="8" x-gap="6">
        <n-gi span="2">
          <n-input
            v-model:value="filters.search"
            placeholder="Buscar..."
            clearable
            @update:value="debouncedLoadCredits"
          />
        </n-gi>
        <n-gi>
          <n-select
            v-model:value="filters.status"
            placeholder="Estado"
            :options="statusOptions"
            @update:value="loadCredits"
            clearable
          />
        </n-gi>
        <n-gi span="2">
          <n-date-picker
            type="daterange"
            placeholder="Buscar..."
            @update:value="updateDateRange"
            clearable
          />
        </n-gi>
      </n-grid>
    </n-collapse-transition>
    <n-data-table
      :columns="columns"
      :data="credits"
      :loading="loading"
      :pagination="pagination"
      :row-props="
        (row) => ({
          style: {
            cursor: 'pointer',
          },
          onClick: () => onRowClick(row),
        })
      "
      @update:page="updatePage"
      @update:pageSize="updatePageSize"
      remote
    />
    <SaleCreditModal
      v-model:show="show"
      :data="currentRow"
      @success="loadCredits"
    />
  </n-card>
</template>

<script>
import { defineComponent, onMounted, ref, h } from "vue";
import { NTag, useMessage } from "naive-ui";
import { getSaleCredits } from "@/api/modules/sales";
import { debounce } from "lodash";
import format from "date-fns/format";
import SaleCreditModal from "./components/SaleCreditModal";

export default defineComponent({
  name: "SaleCredits",
  components: {
    SaleCreditModal,
  },
  setup() {
    const message = useMessage();

    const pagination = ref({
      page: undefined,
      pageSize: undefined,
      itemCount: 0,
      pageSizes: [10, 20, 50, 100],
      showSizePicker: true,
    });

    const loading = ref(false);

    const show = ref(false);

    const showFilters = ref(false);

    const filters = ref({
      search: undefined,
      status: undefined,
      date_sale_after: undefined,
      date_sale_before: undefined,
    });

    const updateDateRange = (v) => {
      filters.value.date_sale_after = v ? format(v.at(0), "dd/MM/yyyy") : null;
      filters.value.date_sale_before = v ? format(v.at(1), "dd/MM/yyyy") : null;
      loadCredits();
    };

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

    const credits = ref([]);

    const columns = [
      {
        key: "codsale",
        title: "Documento",
        width: 150,
      },
      {
        key: "customer_name",
        title: "Cliente",
        render(row) {
          return `${row.customer_doc} - ${row.customer_name}`;
        },
      },
      {
        key: "pending_amount",
        title: "Monto Pendiente",
        width: 150,
        render(row) {
          return `S/. ${row.pending_amount.toFixed(2)}`;
        },
      },
      {
        key: "paid_amount",
        title: "Monto Pagado",
        width: 150,
        render(row) {
          return `S/. ${row.paid_amount.toFixed(2)}`;
        },
      },
      {
        key: "amount",
        title: "Monto Total",
        width: 150,
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
        key: "date_sale",
        title: "Fecha",
        width: 200,
      },
    ];

    const currentRow = ref(null);

    const onRowClick = (row) => {
      show.value = true;
      currentRow.value = row;
    };

    const loadCredits = async () => {
      try {
        loading.value = true;
        const { status, data } = await getSaleCredits({
          ...filters.value,
          page: pagination.value.page,
          page_size: pagination.value.pageSize,
        });
        if (status === 200) {
          pagination.value.itemCount = data.count;
          credits.value = data.results;
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
        }
      } catch (e) {
        message.error("Algo salió mal...");
        console.error(e);
      } finally {
        loading.value = false;
      }
    };

    const debouncedLoadCredits = debounce(loadCredits, 250);

    const updatePage = async (page) => {
      pagination.value.page = page;
      await loadCredits();
    };

    const updatePageSize = async (pageSize) => {
      pagination.value.pageSize = pageSize;
      pagination.value.page = undefined;
      await loadCredits();
    };

    onMounted(async () => await loadCredits());

    return {
      loading,
      show,
      showFilters,
      filters,
      credits,
      columns,
      pagination,
      loadCredits,
      debouncedLoadCredits,
      statusOptions,
      updatePage,
      updatePageSize,
      updateDateRange,
      onRowClick,
      currentRow,
    };
  },
});
</script>

<style lang="scss" scoped></style>
