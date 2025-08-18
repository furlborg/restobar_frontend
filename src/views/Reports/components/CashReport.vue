<template>
  <div class="page-wrap">
    <n-card size="small" class="mb-12">
      <template #header>
        <div class="card-title">Reporte de Caja</div>
      </template>

      <n-form inline :show-feedback="false" @submit.prevent>
        <n-form-item label="Rango de fechas">
          <n-date-picker
            v-model:value="range"
            type="daterange"
            clearable
            :is-date-disabled="disableFuture"
            @update:value="onRangeChange"
          />
        </n-form-item>

        <n-form-item>
          <n-button type="primary" :loading="loading" @click="fetchData">
            Buscar
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <div class="grid-2">
      <n-card size="small" title="Ingresos por método de pago">
        <n-data-table :columns="cols" :data="incomeRows" :loading="loading" />
      </n-card>

      <n-card size="small" title="Egresos por método de pago">
        <n-data-table :columns="cols" :data="outcomeRows" :loading="loading" />
      </n-card>
    </div>

    <div class="grid-2">
      <n-card size="small" title="Resumen (Ingresos - Egresos)">
        <div class="summary">
          <div><strong>Ingresos:</strong> {{ formatMoney(summary.income_total) }}</div>
          <div><strong>Egresos:</strong> {{ formatMoney(summary.outcome_total) }}</div>
          <div><strong>Neto:</strong> {{ formatMoney(summary.net_total) }}</div>
        </div>
      </n-card>

      <n-card size="small" title="Resumen por método (solo ingresos)">
        <n-data-table :columns="cols" :data="methodSummaryRows" :loading="loading" />
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { NCard, NForm, NFormItem, NButton, NDatePicker, NDataTable } from "naive-ui";
import { getCashFlowReport } from "@/api/modules/reports";

const range = ref(null);
const filters = ref({ date_from: "", date_to: "" });
const loading = ref(false);

const incomeRows = ref([]);
const outcomeRows = ref([]);
const methodSummaryRows = ref([]);
const summary = ref({ income_total: 0, outcome_total: 0, net_total: 0 });

const cols = [
  { title: "Método", key: "name" },
  { title: "Cantidad", key: "counter", align: "right" },
  {
    title: "Monto",
    key: "total",
    align: "right",
    render: (row) => formatMoney(row.total || 0),
  },
];

function toYYYYMMDD(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function onRangeChange(val) {
  if (!val || !Array.isArray(val)) {
    filters.value.date_from = "";
    filters.value.date_to = "";
    return;
  }
  filters.value.date_from = toYYYYMMDD(val[0]);
  filters.value.date_to = toYYYYMMDD(val[1]);
}

function disableFuture(ts) {
  return ts > Date.now();
}

function formatMoney(v) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v || 0);
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getCashFlowReport({
      date_from: filters.value.date_from,
      date_to: filters.value.date_to,
    });
    incomeRows.value = data?.income_by_method || [];
    outcomeRows.value = data?.outcome_by_method || [];
    methodSummaryRows.value = data?.payment_method_summary || [];
    summary.value = data?.summary || { income_total: 0, outcome_total: 0, net_total: 0 };
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-wrap { display: grid; gap: 12px; }
.mb-12 { margin-bottom: 12px; }
.card-title { font-weight: 600; }
.grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
.summary { display: grid; gap: 6px; }
</style>