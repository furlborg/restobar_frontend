<template>
  <n-modal
    :show="show"
    preset="card"
    title="Importar productos desde Excel"
    :on-close="handleClose"
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-75': genericsStore.device === 'tablet',
      'w-50': genericsStore.device === 'desktop',
    }"
  >
    <n-space vertical size="large">
      <n-alert type="info" title="Flujo de importación">
        Carga un archivo Excel con las columnas definidas, revisa la vista previa y luego procesa solo las filas válidas.
      </n-alert>

      <n-grid responsive="screen" cols="24" :x-gap="12" :y-gap="12">
        <n-gi :span="24">
          <n-space align="center" justify="space-between" wrap>
            <n-button type="primary" tertiary @click="downloadTemplate">
              Descargar plantilla
            </n-button>

            <n-select
              v-model:value="selectedBranchOffice"
              :options="branchOptions"
              placeholder="Selecciona sucursal destino"
              style="min-width: 260px"
              @update:value="onSelectBranchOffice"
            />
          </n-space>
        </n-gi>

        <n-gi :span="24">
          <n-upload
            :show-file-list="true"
            :max="1"
            accept=".xlsx,.xls"
            list-type="text"
            :default-upload="false"
            :file-list="fileList"
            :on-change="onFileChange"
          >
            <n-button type="info" secondary>Seleccionar Excel</n-button>
          </n-upload>
        </n-gi>

        <n-gi :span="24" v-if="isParsing || isImporting">
          <n-spin :show="isParsing || isImporting">
            <n-progress
              :percentage="progress"
              :show-indicator="true"
              type="line"
            />
          </n-spin>
        </n-gi>

        <n-gi :span="24">
          <n-space vertical size="small">
            <n-text depth="2">Total detectado: {{ importResults.total }}</n-text>
            <n-text depth="2">Válidos: {{ importResults.valid }}</n-text>
            <n-text depth="2">Inválidos: {{ importResults.skipped }}</n-text>
          </n-space>
        </n-gi>

        <n-gi :span="24">
          <n-data-table
            size="small"
            :columns="previewColumns"
            :data="parsedRows"
            :pagination="false"
            :bordered="false"
            striped
          />
        </n-gi>

        <n-gi v-if="invalidRows.length" :span="24">
          <n-collapse>
            <n-collapse-item title="Filas con errores" name="errors">
              <n-list bordered>
                <n-list-item v-for="row in invalidRows" :key="row.rowNumber">
                  <n-space vertical size="small">
                    <n-text strong>Fila {{ row.rowNumber }}</n-text>
                    <n-text depth="3">{{ row.errors.join(" · ") }}</n-text>
                  </n-space>
                </n-list-item>
              </n-list>
            </n-collapse-item>
          </n-collapse>
        </n-gi>

        <n-gi v-if="importResults.details.length" :span="24">
          <n-collapse>
            <n-collapse-item title="Resultado de importación" name="import-result">
              <n-list bordered>
                <n-list-item v-for="item in importResults.details" :key="`${item.rowNumber}-${item.status}`">
                  <n-space align="center" justify="space-between" style="width: 100%;">
                    <n-text>Fila {{ item.rowNumber }}</n-text>
                    <n-text :type="item.status === 'success' ? 'success' : 'error'">
                      {{ item.message }}
                    </n-text>
                  </n-space>
                </n-list-item>
              </n-list>
            </n-collapse-item>
          </n-collapse>
        </n-gi>
      </n-grid>
    </n-space>

    <template #action>
      <n-space justify="end">
        <n-button secondary @click="handleClose" :disabled="isImporting">
          Cerrar
        </n-button>
        <n-button tertiary @click="resetImportState" :disabled="isImporting">
          Limpiar
        </n-button>
        <n-button
          type="primary"
          secondary
          :disabled="!validRows.length || isParsing || isImporting"
          :loading="isImporting"
          @click="handleImport"
        >
          Importar válidos
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, watch } from "vue";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductExcelImport } from "../composables/useProductExcelImport";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:show", "on-success"]);

const genericsStore = useGenericsStore();

const {
  branchOptions,
  selectedBranchOffice,
  fileList,
  importResults,
  invalidRows,
  isImporting,
  isParsing,
  parsedRows,
  progress,
  downloadTemplate,
  ensureReferenceData,
  importRows,
  onFileChange,
  onSelectBranchOffice,
  resetImportState,
  validRows,
} = useProductExcelImport();

const previewColumns = [
  {
    title: "Fila",
    key: "rowNumber",
    width: 70,
  },
  {
    title: "Código",
    key: "code",
    render(row) {
      return row.source.code || "-";
    },
  },
  {
    title: "Nombre",
    key: "name",
    render(row) {
      return row.source.name || "-";
    },
  },
  {
    title: "Estado",
    key: "status",
    width: 180,
    render(row) {
      return row.isValid ? "Lista para importar" : row.errors[0] || "Con errores";
    },
  },
];

const handleImport = async () => {
  const result = await importRows();
  if (result?.success || result?.imported > 0) {
    emit("on-success");
    emit("update:show", false);
    resetImportState();
  }
};

const handleClose = () => {
  emit("update:show", false);
  resetImportState();
};

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      await ensureReferenceData();
    } else {
      resetImportState();
    }
  },
  { immediate: true },
);
</script>