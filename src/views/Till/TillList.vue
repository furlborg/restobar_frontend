<template>
  <div id="TillList">
    <n-card title="Aperturas y Cierres" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
          type="success"
          :disabled="
            isTableLoading || tills.some((till) => till.status === true)
          "
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
        <n-button type="info" text @click="refreshTable">
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
            <n-form-item-gi label="Responsable Apertura" :span="3">
              <n-input v-model:value="filterParams.opening_responsable" />
            </n-form-item-gi>
            <n-form-item-gi label="Responsable Cierre" :span="3">
              <n-input v-model:value="filterParams.closing_responsable" />
            </n-form-item-gi>
            <n-form-item-gi label="Saldo inicial" :span="3">
              <n-input-number
                class="w-100"
                v-model:value="filterParams.opening_amount"
                :show-button="false"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Saldo final" :span="3">
              <n-input-number
                class="w-100"
                v-model:value="filterParams.closing_amount"
                :show-button="false"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Apertura" :span="6">
              <n-date-picker
                type="daterange"
                v-model:formatted-value="filterParams.created"
                format="dd/MM/yyyy"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Cierre" :span="6">
              <n-date-picker
                type="daterange"
                v-model:formatted-value="filterParams.modified"
                format="dd/MM/yyyy"
                clearable
              />
            </n-form-item-gi>
            <!-- <n-form-item-gi label="Sucursal" :span="3">
              <n-select />
            </n-form-item-gi> -->
            <n-gi :span="6">
              <n-button type="info" secondary @click="performFilter"
                >Buscar</n-button
              >
            </n-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table
        class="mt-2"
        :columns="tableColumns"
        :data="tills"
        :loading="isTableLoading"
        :pagination="pagination"
        remote
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
import { useMessage } from "naive-ui";
import TillApertureModal from "./components/TillApertureModal";
import TillClosureModal from "./components/TillClosureModal";
import { createTillColumns } from "@/utils/constants";
import {
  getTills,
  getTillsByPageNumber,
  filterTills,
} from "@/api/modules/tills";

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
    const filterParams = ref({
      opening_responsable: null,
      closing_responsable: null,
      opening_amount: null,
      closing_amount: null,
      created: null,
      modified: null,
    });
    const pagination = ref({
      filterParams: null,
      page: 1,
      pageCount: 1,
      pageSize: 20,
      total: 0,
      onChange: (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        getTillsByPageNumber(
          pagination.value.page,
          pagination.value.filterParams
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (Number(response.data.count) % pagination.value.pageSize !== 0) {
              ++pagination.value.pageCount;
            }
            tills.value = response.data.results;
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

    const loadTills = () => {
      isTableLoading.value = true;
      pagination.value.page = 1;
      getTills()
        .then((response) => {
          if (response.status === 200) {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (Number(response.data.count) % pagination.value.pageSize !== 0) {
              ++pagination.value.pageCount;
            }
            tills.value = response.data.results;
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

    const performFilter = () => {
      isTableLoading.value = true;
      pagination.value.filterParams = filterParams.value;
      pagination.value.page = 1;
      filterTills(pagination.value.page, pagination.value.filterParams)
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (Number(response.data.count) % pagination.value.pageSize !== 0) {
            ++pagination.value.pageCount;
          }
          tills.value = response.data.results;
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
      filterParams.value = {
        opening_responsable: null,
        closing_responsable: null,
        opening_amount: null,
        closing_amount: null,
        created: null,
        modified: null,
      };
      pagination.value.filterParams = null;
      loadTills();
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
      filterParams,
      performFilter,
      refreshTable,
      isTableLoading,
      pagination,
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