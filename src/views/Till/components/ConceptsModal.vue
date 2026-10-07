<template>
  <n-drawer
    v-model:show="showModal"
    placement="right"
    :width="genericsStore.device === 'mobile' ? '100%' : '520px'"
    :mask-closable="true"
    @after-leave="resetForm"
  >
    <n-drawer-content
      title="Conceptos de Caja"
      closable
      :native-scrollbar="false"
      body-content-style="padding: 16px;"
    >
      <template #header-extra>
        <n-space align="center" :size="8">
          <n-button
            type="primary"
            size="small"
            secondary
            @click="openCreateModal"
            title="Crear nuevo concepto de caja"
          >
            <template #icon>
              <v-icon name="md-add-round" />
            </template>
            Nuevo Concepto
          </n-button>
          <n-badge :value="filteredConcepts.length" type="info" />
        </n-space>
      </template>

      <n-spin :show="isLoading">
        <!-- Filtros rápidos -->
        <n-space vertical :size="10" class="mb-3">
          <n-input
            v-model:value="searchQuery"
            placeholder="Buscar concepto..."
            clearable
            size="small"
          >
            <template #prefix>
              <v-icon name="md-search-round" />
            </template>
          </n-input>

          <n-radio-group v-model:value="filterType" size="small" class="w-100 d-flex">
            <n-radio-button value="all" class="flex-grow-1 text-center">Todos</n-radio-button>
            <n-radio-button value="0" class="flex-grow-1 text-center">Ingresos</n-radio-button>
            <n-radio-button value="1" class="flex-grow-1 text-center">Egresos</n-radio-button>
          </n-radio-group>

          <div class="d-flex justify-content-between align-items-center px-1">
            <n-text depth="3" class="text-xs">
              {{ showInactiveConcepts ? "Mostrando conceptos inactivos / ocultos" : "Mostrando conceptos activos" }}
            </n-text>
            <n-checkbox v-model:checked="showInactiveConcepts" size="small">
              <span class="text-xs">Ver ocultos</span>
            </n-checkbox>
          </div>
        </n-space>

        <!-- Lista scrolleable de conceptos -->
        <div class="concepts-scroll-list">
          <n-empty
            v-if="!filteredConcepts.length"
            description="No hay conceptos encontrados"
            class="py-4"
          />
          <n-list v-else hoverable>
            <n-list-item
              v-for="item in filteredConcepts"
              :key="item.id"
              class="concept-item"
            >
              <div class="d-flex justify-content-between align-items-center w-100 py-1">
                <n-text strong class="fs-6">
                  {{ item.description }}
                </n-text>
                <div class="d-flex align-items-center gap-2">
                  <n-tag
                    :type="item.concept_type === '0' ? 'success' : 'error'"
                    size="small"
                    round
                  >
                    {{ item.concept_type === "0" ? "Ingreso" : "Egreso" }}
                  </n-tag>

                  <template v-if="!item.is_disabled">
                    <n-button
                      type="info"
                      secondary
                      circle
                      size="small"
                      @click.stop="openEditModal(item)"
                      title="Editar concepto"
                    >
                      <v-icon name="ri-edit-fill" scale="1.05" />
                    </n-button>

                    <n-button
                      type="error"
                      secondary
                      circle
                      size="small"
                      @click.stop="confirmDelete(item)"
                      title="Ocultar / Deshabilitar concepto"
                    >
                      <v-icon name="ri-delete-bin-2-fill" scale="1.05" />
                    </n-button>
                  </template>

                  <template v-else>
                    <n-tag size="small" type="warning" round>
                      Oculto
                    </n-tag>
                    <n-button
                      type="success"
                      secondary
                      circle
                      size="small"
                      @click.stop="reactivateConcept(item)"
                      title="Habilitar / Mostrar concepto nuevamente"
                    >
                      <v-icon name="hi-solid-refresh" scale="1.05" />
                    </n-button>
                  </template>
                </div>
              </div>
            </n-list-item>
          </n-list>
        </div>
      </n-spin>
    </n-drawer-content>
  </n-drawer>

  <!-- Modal para Crear / Editar Concepto -->
  <n-modal
    v-model:show="showEditModal"
    preset="card"
    :title="selectedConcept ? 'Editar Concepto de Caja' : 'Crear Concepto de Caja'"
    :style="{ maxWidth: '420px', width: '92%' }"
    :mask-closable="true"
    closable
  >
    <n-form label-placement="top" class="mt-2">
      <n-form-item label="Tipo de Movimiento" required>
        <n-select
          v-model:value="conceptForm.concept_type"
          :options="conceptTypeOptions"
          :disabled="!!selectedConcept"
          placeholder="Selecciona tipo de movimiento"
        />
        <template #feedback v-if="selectedConcept">
          <span class="text-xs text-muted">El tipo de movimiento no se puede modificar para preservar el historial de caja.</span>
        </template>
      </n-form-item>

      <n-form-item label="Descripción del Concepto" required>
        <n-input
          v-model:value="conceptForm.description"
          placeholder="Descripción del concepto..."
          maxlength="100"
          show-count
          clearable
          @keydown.enter.prevent="submitForm"
        />
      </n-form-item>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <n-button secondary @click="showEditModal = false" :disabled="isSubmitting">
          Cancelar
        </n-button>
        <n-button
          type="primary"
          :loading="isSubmitting"
          :disabled="!isValidForm"
          strong
          @click="submitForm"
        >
          <template #icon>
            <v-icon name="md-save-round" />
          </template>
          {{ selectedConcept ? "Guardar Cambios" : "Crear Concepto" }}
        </n-button>
      </div>
    </n-form>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { useTillStore } from "@/store/modules/till";
import { useGenericsStore } from "@/store/modules/generics";
import { createConcept, updateConcept, deleteConcept } from "@/api/modules/tills";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:show"]);

const message = useMessage();
const dialog = useDialog();
const tillStore = useTillStore();
const genericsStore = useGenericsStore();

const showModal = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

const isLoading = ref(false);
const isSubmitting = ref(false);
const searchQuery = ref("");
const filterType = ref("all");
const showInactiveConcepts = ref(false);

const showEditModal = ref(false);
const selectedConcept = ref(null);

const conceptForm = ref({
  description: "",
  concept_type: null,
});

const conceptTypeOptions = [
  { label: "Ingreso", value: "0" },
  { label: "Egreso", value: "1" },
];

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      refreshList();
    } else {
      resetForm();
    }
  }
);

const filteredConcepts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const type = filterType.value;
  return (tillStore.concepts || [])
    .filter((item) => (showInactiveConcepts.value ? item.is_disabled : !item.is_disabled))
    .filter((item) => {
      const matchesQuery = !query || item.description?.toLowerCase().includes(query);
      const matchesType = type === "all" || String(item.concept_type) === String(type);
      return matchesQuery && matchesType;
    });
});

const isValidForm = computed(() => {
  return (
    conceptForm.value.description?.trim().length > 0 &&
    (conceptForm.value.concept_type === "0" || conceptForm.value.concept_type === "1")
  );
});

const openCreateModal = () => {
  selectedConcept.value = null;
  conceptForm.value = {
    description: "",
    concept_type: filterType.value === "1" ? "1" : "0",
  };
  showEditModal.value = true;
};

const openEditModal = (item) => {
  selectedConcept.value = item;
  conceptForm.value = {
    description: item.description,
    concept_type: String(item.concept_type),
  };
  showEditModal.value = true;
};

const resetForm = () => {
  selectedConcept.value = null;
  showEditModal.value = false;
  conceptForm.value = {
    description: "",
    concept_type: null,
  };
};

const refreshList = async () => {
  isLoading.value = true;
  try {
    await tillStore.refreshConcepts();
  } catch (error) {
    console.error("Error refreshing concepts:", error);
  } finally {
    isLoading.value = false;
  }
};

const submitForm = async () => {
  if (!isValidForm.value || isSubmitting.value) return;

  const payload = {
    description: conceptForm.value.description.trim().toUpperCase(),
    concept_type: conceptForm.value.concept_type,
  };

  isSubmitting.value = true;
  try {
    let response;
    if (selectedConcept.value) {
      response = await updateConcept(selectedConcept.value.id, payload);
    } else {
      response = await createConcept(payload);
    }

    if (response.status === 202 || response.status === 201 || response.status === 200) {
      message.success(
        selectedConcept.value
          ? "Concepto actualizado exitosamente"
          : "Concepto creado exitosamente"
      );
      await tillStore.refreshConcepts();
      showEditModal.value = false;
      resetForm();
    }
  } catch (error) {
    console.error("Error saving concept:", error);
    message.error(
      error.response?.data?.error ||
        error.response?.data?.description?.[0] ||
        "Error al guardar los cambios"
    );
  } finally {
    isSubmitting.value = false;
  }
};

const reactivateConcept = async (item) => {
  if (!item) return;
  isLoading.value = true;
  try {
    const response = await updateConcept(item.id, {
      description: item.description,
      concept_type: item.concept_type,
      is_disabled: false,
    });
    if (response.status === 202 || response.status === 200) {
      message.success(`Concepto "${item.description}" habilitado nuevamente`);
      await tillStore.refreshConcepts();
    }
  } catch (error) {
    console.error("Error reactivating concept:", error);
    message.error(error.response?.data?.error || "No se pudo habilitar el concepto");
  } finally {
    isLoading.value = false;
  }
};

const confirmDelete = (item) => {
  if (!item) return;
  dialog.warning({
    title: "Ocultar Concepto de Caja",
    content: `¿Está seguro de ocultar/deshabilitar el concepto "${item.description}"? Ya no aparecerá en las opciones de ingreso/egreso.`,
    positiveText: "Ocultar",
    negativeText: "Cancelar",
    onPositiveClick: async () => {
      isLoading.value = true;
      try {
        const response = await deleteConcept(item.id);
        if (response.status === 202 || response.status === 204 || response.status === 200) {
          message.success("Concepto ocultado/deshabilitado");
          if (selectedConcept.value?.id === item.id) {
            resetForm();
          }
          await tillStore.refreshConcepts();
        }
      } catch (error) {
        console.error("Error deleting concept:", error);
        message.error(error.response?.data?.error || "No se pudo deshabilitar el concepto");
      } finally {
        isLoading.value = false;
      }
    },
  });
};
</script>

<style scoped>
.concepts-scroll-list {
  max-height: calc(100vh - 180px);
  min-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.concept-item {
  transition: background-color 0.2s ease;
  border-radius: 6px;
  padding: 6px 8px;
}

.concept-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.helper-hint {
  background-color: #f7f9fa;
  border-left: 3px solid #18a058;
  border-radius: 4px;
}

.d-flex {
  display: flex;
}

.flex-grow-1 {
  flex-grow: 1;
}

.gap-2 {
  gap: 8px;
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.p-2 {
  padding: 8px;
}

.text-xs {
  font-size: 12px;
}

.justify-content-between {
  justify-content: space-between;
}

.justify-content-end {
  justify-content: flex-end;
}

.align-items-center {
  align-items: center;
}
</style>
