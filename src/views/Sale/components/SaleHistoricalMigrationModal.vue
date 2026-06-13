<template>
  <n-modal
    :show="show"
    preset="card"
    title="Ventas históricas"
    :on-close="handleClose"
    class="historical-sales-modal"
    style="width: min(760px, calc(100vw - 32px))"
  >
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="export" tab="Exportar">
        <n-form label-placement="top">
          <n-grid responsive="screen" cols="24" :x-gap="12" :y-gap="12">
            <n-form-item-gi label="Rango de fechas" :span="canSelectBranch ? 12 : 14">
              <n-date-picker
                v-model:formatted-value="exportRange"
                type="daterange"
                value-format="yyyy-MM-dd"
                format="dd/MM/yyyy"
                clearable
                class="full-width"
              />
            </n-form-item-gi>
            <n-form-item-gi v-if="canSelectBranch" label="Sucursal" :span="12">
              <n-select v-model:value="selectedBranch" :options="branchOptions" class="full-width" />
            </n-form-item-gi>
            <n-gi :span="canSelectBranch ? 24 : 10">
              <n-space align="end" justify="end" class="historical-form-actions">
                <n-button type="primary" secondary :disabled="!canExport" :loading="exporting" @click="handleExport">
                  <v-icon name="md-download-round" class="me-1" />
                  Exportar
                </n-button>
              </n-space>
            </n-gi>
          </n-grid>
        </n-form>
      </n-tab-pane>

      <n-tab-pane name="import" tab="Importar">
        <n-form label-placement="top">
          <n-grid responsive="screen" cols="24" :x-gap="12" :y-gap="12">
            <n-form-item-gi v-if="canSelectBranch" label="Sucursal" :span="24">
              <n-select v-model:value="selectedBranch" :options="branchOptions" class="full-width" />
            </n-form-item-gi>
            <n-form-item-gi label="Archivo XLSX" :span="24">
              <n-space align="start" justify="space-between" class="full-width import-file-actions">
                <n-upload
                  :show-file-list="true"
                  :max="1"
                  accept=".xlsx"
                  list-type="text"
                  :default-upload="false"
                  :file-list="fileList"
                  :on-change="onFileChange"
                >
                  <n-button secondary>
                    <v-icon name="md-uploadfile" class="me-1" />
                    Archivo
                  </n-button>
                </n-upload>
                <n-button secondary @click="handleTemplate" :loading="downloadingTemplate">
                  <v-icon name="vi-file-type-excel" class="me-1" />
                  Plantilla
                </n-button>
              </n-space>
            </n-form-item-gi>
          </n-grid>
        </n-form>

        <n-space vertical size="medium">
          <n-progress v-if="job" type="line" :percentage="job.progress || 0" :show-indicator="true" />

          <n-descriptions v-if="job" bordered size="small" :column="3">
            <n-descriptions-item label="Estado">{{ jobStatusLabel }}</n-descriptions-item>
            <n-descriptions-item label="Ventas">{{ job.imported_sales }} / {{ job.total_sales }}</n-descriptions-item>
            <n-descriptions-item label="Items">{{ job.imported_items }} / {{ job.total_items }}</n-descriptions-item>
          </n-descriptions>

          <n-collapse v-if="jobErrors.length">
            <n-collapse-item title="Errores" name="errors">
              <n-list bordered>
                <n-list-item v-for="(error, index) in jobErrors" :key="index">
                  {{ formatJobError(error) }}
                </n-list-item>
              </n-list>
            </n-collapse-item>
          </n-collapse>
        </n-space>
      </n-tab-pane>
    </n-tabs>

    <template #action>
      <n-space justify="end">
        <n-button secondary @click="handleClose">Cerrar</n-button>
        <n-button
          v-if="activeTab === 'import'"
          type="primary"
          secondary
          :disabled="!canImport || importRunning"
          :loading="importRunning"
          @click="handleImport"
        >
          Importar
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import {
  createHistoricalSaleImportJob,
  downloadHistoricalSalesTemplate,
  exportHistoricalSales,
  retrieveHistoricalSaleImportJob,
} from "@/api/modules/sales";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:show", "on-success"]);

const message = useMessage();
const businessStore = useBusinessStore();
const userStore = useUserStore();

const exportRange = ref(null);
const activeTab = ref("export");
const selectedBranch = ref(null);
const fileList = ref([]);
const selectedFile = ref(null);
const job = ref(null);
const pollTimer = ref(null);
const exporting = ref(false);
const importing = ref(false);
const downloadingTemplate = ref(false);

const canSelectBranch = computed(() => !userStore.user.branchoffice);
const branchOptions = computed(() => businessStore.branchSelectOptions || []);
const effectiveBranch = computed(() => userStore.user.branchoffice || selectedBranch.value || businessStore.currentBranch);
const canExport = computed(() => Array.isArray(exportRange.value) && exportRange.value.length === 2 && !!effectiveBranch.value);
const canImport = computed(() => !!effectiveBranch.value && !!selectedFile.value);
const importRunning = computed(() => importing.value || job.value?.status === "PENDING" || job.value?.status === "RUNNING");
const jobErrors = computed(() => job.value?.errors || []);
const jobStatusLabel = computed(() => {
  const labels = {
    PENDING: "Pendiente",
    RUNNING: "En proceso",
    DONE: "Finalizado",
    FAILED: "Fallido",
  };
  return labels[job.value?.status] || "-";
});

function ensureBranch() {
  if (userStore.user.branchoffice) {
    selectedBranch.value = userStore.user.branchoffice;
    return;
  }
  if (!selectedBranch.value) {
    selectedBranch.value = businessStore.currentBranch || branchOptions.value[0]?.value || null;
  }
}

function filenameFromHeaders(headers, fallback) {
  const disposition = headers?.["content-disposition"];
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

function downloadBlob(response, fallbackName) {
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFromHeaders(response.headers, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function handleTemplate() {
  downloadingTemplate.value = true;
  try {
    const response = await downloadHistoricalSalesTemplate();
    downloadBlob(response, "plantilla_ventas_historicas.xlsx");
  } catch (error) {
    console.error(error);
    message.error("No se pudo descargar la plantilla.");
  } finally {
    downloadingTemplate.value = false;
  }
}

async function handleExport() {
  if (!canExport.value) {
    message.warning("Selecciona rango y sucursal.");
    return;
  }
  exporting.value = true;
  try {
    const response = await exportHistoricalSales({
      start_date: exportRange.value[0],
      end_date: exportRange.value[1],
      branch_office: effectiveBranch.value,
    });
    downloadBlob(response, `ventas_historicas_${exportRange.value[0]}_${exportRange.value[1]}.xlsx`);
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.error || "No se pudo exportar.");
  } finally {
    exporting.value = false;
  }
}

function onFileChange({ file, fileList: nextFileList }) {
  fileList.value = nextFileList.slice(0, 1);
  selectedFile.value = file?.file || null;
}

async function handleImport() {
  if (!canImport.value) {
    message.warning("Selecciona sucursal y archivo.");
    return;
  }
  importing.value = true;
  job.value = null;
  try {
    const response = await createHistoricalSaleImportJob({
      file: selectedFile.value,
      branch_office: effectiveBranch.value,
    });
    job.value = response.data;
    startPolling();
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.error || "No se pudo iniciar la importación.");
  } finally {
    importing.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollTimer.value = window.setInterval(pollJob, 1500);
  pollJob();
}

function stopPolling() {
  if (pollTimer.value) {
    window.clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

async function pollJob() {
  if (!job.value?.id) {
    return;
  }
  try {
    const response = await retrieveHistoricalSaleImportJob(job.value.id);
    job.value = response.data;
    if (["DONE", "FAILED"].includes(job.value.status)) {
      stopPolling();
      if (job.value.status === "DONE") {
        message.success("Importación histórica finalizada.");
        emit("on-success");
      } else {
        message.error("Importación histórica rechazada.");
      }
    }
  } catch (error) {
    console.error(error);
    stopPolling();
  }
}

function formatJobError(error) {
  const location = [error.sheet, error.row ? `fila ${error.row}` : null].filter(Boolean).join(" · ");
  return location ? `${location}: ${error.error}` : error.error;
}

function resetLocalState() {
  stopPolling();
  activeTab.value = "export";
  exportRange.value = null;
  fileList.value = [];
  selectedFile.value = null;
  job.value = null;
  exporting.value = false;
  importing.value = false;
  downloadingTemplate.value = false;
}

function handleClose() {
  emit("update:show", false);
  resetLocalState();
}

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      if (!businessStore.business.branchs?.length) {
        await businessStore.initializeStore();
      }
      ensureBranch();
    } else {
      resetLocalState();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped>
.historical-form-actions {
  min-height: 34px;
  padding-top: 25px;
}

.full-width {
  width: 100%;
}

.import-file-actions {
  flex-wrap: nowrap;
}

@media (max-width: 720px) {
  .historical-form-actions {
    padding-top: 0;
  }

  .import-file-actions {
    flex-wrap: wrap;
  }
}
</style>
