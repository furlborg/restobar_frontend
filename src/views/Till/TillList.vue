<template>
  <div id="TillList">
    <n-card title="Aperturas y Cierres" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
          type="success"
          :disabled="tills.some((till) => till.status === true)"
          secondary
          @click="showApertureModal = true"
          >Aperturar</n-button
        >
      </template>
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
        <n-button type="info" text>
          <v-icon name="hi-solid-refresh" />
          Recargar
        </n-button>
      </n-space>
      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid
            responsive="screen"
            cols="6 s:6 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
          >
            <n-form-item-gi label="Usuario" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha" :span="6">
              <n-date-picker type="daterange" clearable />
            </n-form-item-gi>
            <n-form-item-gi label="Sucursal" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-input />
            </n-form-item-gi>
            <n-form-item-gi label="Sucursal" :span="3">
              <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="6">
              <n-button type="info" secondary>Buscar</n-button>
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table
        class="mt-2"
        :columns="tableColumns"
        :data="tills"
        :loading="isTableLoading"
      />
    </n-card>
    <till-aperture-modal
      v-model:show="showApertureModal"
      concept="ingress"
      @update:show="onCloseModal"
      @on-success="onApertureSuccess"
    />
    <till-closure-modal
      v-model:show="showClosureModal"
      concept="ingress"
      :id-till="idTill"
      @update:show="onCloseModal"
      @on-success="onClosureSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import TillApertureModal from "./components/TillApertureModal";
import TillClosureModal from "./components/TillClosureModal";
import { createTillColumns } from "@/utils/constants";
import { getTills } from "@/api/modules/tills";
import { useMessage } from "naive-ui";

export default defineComponent({
  name: "TillList",
  components: {
    TillApertureModal,
    TillClosureModal,
  },
  setup() {
    const message = useMessage();
    const router = useRouter();
    const isTableLoading = ref(false);
    const showApertureModal = ref(false);
    const showClosureModal = ref(false);
    const showFilters = ref(false);
    const idTill = ref(0);
    const tills = ref([]);

    const loadTills = () => {
      isTableLoading.value = true;
      getTills()
        .then((response) => {
          if (response.status === 200) {
            tills.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    onMounted(() => {
      document.title = "Aperturas y Cierres | App";
      loadTills();
    });

    const onCloseModal = () => {
      document.title = "Aperturas y Cierres | App";
      // idProduct.value = 0
    };

    const onApertureSuccess = () => {
      showApertureModal.value = false;
      router.push({ name: "Till" });
      // loadProductsData()
    };

    const onClosureSuccess = () => {
      showClosureModal.value = false;
      onCloseModal();
      loadTills();
      // loadProductsData()
    };

    return {
      onCloseModal,
      showApertureModal,
      showClosureModal,
      onApertureSuccess,
      onClosureSuccess,
      showFilters,
      isTableLoading,
      tills,
      idTill,
      tableColumns: createTillColumns({
        generateReport() {
          message.success("Opcion 1!");
        },
        deleteMovement(row) {
          idTill.value = row.id;
          showClosureModal.value = true;
        },
      }),
    };
  },
});
</script>

<style>
</style>