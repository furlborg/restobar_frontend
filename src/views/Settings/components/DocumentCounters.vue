<template>
  <div id="DocumentCounters">
    <n-space align="center" justify="space-between" class="mb-3">
      <n-h1 class="m-0">
        <n-text>Contadores</n-text>
      </n-h1>
      <n-button secondary :loading="loading" @click="loadCounters">
        <template #icon>
          <v-icon name="md-refresh-round" />
        </template>
        Actualizar
      </n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="(row) => row.id"
      size="small"
      :pagination="{ pageSize: 15 }"
    />
  </div>
</template>

<script setup>
import { h, onMounted, ref } from "vue";
import { NButton, NInputNumber, NTag, useMessage } from "naive-ui";
import {
  getDocumentSeriesCounters,
  updateDocumentSeriesCounter,
} from "@/api/modules/business";

const message = useMessage();
const rows = ref([]);
const loading = ref(false);
const savingId = ref(null);

const docTypeLabels = {
  1: "Factura",
  3: "Boleta",
  80: "Nota de Venta",
};

function normalizeRows(data) {
  return data.map((row) => ({
    ...row,
    draft_next_number: Number(row.effective_next_number || row.next_number || 1),
  }));
}

function minNextNumber(row) {
  return Number(row.max_sale_number || 0) + 1;
}

function isValidNextNumber(row) {
  const value = Number(row.draft_next_number);
  return Number.isInteger(value) && value >= minNextNumber(row);
}

function canSave(row) {
  return isValidNextNumber(row) && Number(row.draft_next_number) !== Number(row.next_number);
}

function errorMessage(error) {
  const data = error.response?.data;
  if (Array.isArray(data?.next_number)) {
    return data.next_number[0];
  }
  if (typeof data?.next_number === "string") {
    return data.next_number;
  }
  return "No se pudo actualizar el contador.";
}

async function loadCounters() {
  loading.value = true;
  try {
    const response = await getDocumentSeriesCounters();
    rows.value = normalizeRows(response.data || []);
  } catch (error) {
    console.error(error);
    message.error("No se pudieron cargar los contadores.");
  } finally {
    loading.value = false;
  }
}

async function saveCounter(row) {
  if (!isValidNextNumber(row)) {
    message.warning(`Debe ser mayor o igual a ${minNextNumber(row)}.`);
    return;
  }

  savingId.value = row.id;
  try {
    await updateDocumentSeriesCounter(row.id, Number(row.draft_next_number));
    message.success("Contador actualizado.");
    await loadCounters();
  } catch (error) {
    console.error(error);
    message.error(errorMessage(error));
  } finally {
    savingId.value = null;
  }
}

const columns = [
  {
    title: "Sucursal",
    key: "sucursal_description",
    minWidth: 160,
  },
  {
    title: "Tipo",
    key: "doc_type",
    width: 140,
    render(row) {
      return h(
        NTag,
        { type: row.doc_type === "1" ? "success" : row.doc_type === "3" ? "info" : "default" },
        { default: () => docTypeLabels[row.doc_type] || row.doc_type_description },
      );
    },
  },
  {
    title: "Serie",
    key: "description",
    width: 110,
  },
  {
    title: "Mayor registrado",
    key: "max_sale_number",
    width: 140,
  },
  {
    title: "Siguiente actual",
    key: "effective_next_number",
    width: 140,
  },
  {
    title: "Nuevo siguiente",
    key: "draft_next_number",
    width: 170,
    render(row) {
      return h(NInputNumber, {
        value: row.draft_next_number,
        min: minNextNumber(row),
        precision: 0,
        showButton: true,
        status: isValidNextNumber(row) ? undefined : "error",
        onUpdateValue(value) {
          row.draft_next_number = value;
        },
      });
    },
  },
  {
    title: "",
    key: "actions",
    width: 130,
    render(row) {
      return h(
        NButton,
        {
          type: "primary",
          secondary: true,
          disabled: !canSave(row),
          loading: savingId.value === row.id,
          onClick: () => saveCounter(row),
        },
        { default: () => "Guardar" },
      );
    },
  },
];

onMounted(loadCounters);
</script>
