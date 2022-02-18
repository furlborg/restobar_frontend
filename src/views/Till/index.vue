<template>
  <div id="Till">
    <n-grid
      cols="5 s:5 m:10 l:20 xl:20 2xl:20"
      responsive="screen"
      :x-gap="12"
      :y-gap="12"
    >
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon name="md-trendingup-round" scale="2" fill="LimeGreen" />
              <n-text class="fs-5">Ingresos</n-text>
            </n-space>
            <n-button
              type="success"
              tertiary
              circle
              @click="(movementType = '0'), (showModal = true)"
            >
              <v-icon name="bi-pencil-square" scale="1.25" />
            </n-button>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. {{ income.toFixed(2) }}</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon
                name="md-trendingdown-round"
                scale="2"
                fill="red"
                flip="horizontal"
              />
              <n-text class="fs-5">Egresos</n-text>
            </n-space>
            <n-button
              type="error"
              tertiary
              circle
              @click="(movementType = '1'), (showModal = true)"
            >
              <v-icon name="bi-pencil-square" scale="1.25" />
            </n-button>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. -{{ outcome.toFixed(2) }}</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon
                name="md-attachmoney-round"
                scale="2"
                fill="deepskyblue"
              />
              <n-text class="fs-5">Ventas</n-text>
            </n-space>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. {{ sells.toFixed(2) }}</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon name="la-coins-solid" scale="2" fill="orange" />
              <n-text class="fs-5">Total</n-text>
            </n-space>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. {{ total.toFixed(2) }}</n-text>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    <n-card class="mt-2" title="Movimientos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
          type="info"
          secondary
          @click="$router.push({ name: 'TillList' })"
          >Lista de Cajas</n-button
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
            <n-form-item-gi label="Documento" :span="3">
              <n-input
                v-model:value="filterParams.document"
                @keypress="isLetter($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Descripción" :span="3">
              <n-input
                v-model:value="filterParams.description"
                @keypress="isLetter($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Monto" :span="3">
              <n-input-number
                v-model:value="filterParams.amount"
                :show-button="false"
                @keypress="isDecimal($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Tipo Concepto" :span="3">
              <n-select
                v-model:value="filterParams.concept_type"
                :options="conceptTypeOptions"
                @update:value="filterParams.concept = null"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Concepto" :span="3">
              <n-select
                v-model:value="filterParams.concept"
                :options="ConceptOptions"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-select
                v-model:value="filterParams.payment_method"
                :options="saleStore.getPaymentMethodsOptions"
                clearable
              />
            </n-form-item-gi>
            <!-- <n-form-item-gi label="Sucursal" :span="3">
              <n-select clearable />
            </n-form-item-gi> -->
            <n-form-item-gi :span="3">
              <n-button type="info" secondary @click="performFilter"
                >Buscar</n-button
              >
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table
        class="mt-2"
        :columns="tableColumns"
        :data="movements"
        :loading="isLoading"
        :pagination="movements.length > 20 ? pagination : {}"
      />
    </n-card>
    <movement-modal
      v-model:show="showModal"
      :movement-type="movementType"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useMessage, useDialog } from "naive-ui";
import MovementModal from "./components/MovementModal";
import { isDecimal, isLetter, isNumber } from "@/utils";
import { createMovementsColumns } from "@/utils/constants";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import {
  getCurrentTillDetails,
  filterTillDetails,
  nullifyDetail,
} from "@/api/modules/tills";

export default defineComponent({
  name: "Till",
  components: {
    MovementModal,
  },
  setup() {
    const message = useMessage();
    const tillStore = useTillStore();
    const saleStore = useSaleStore();
    const dialog = useDialog();
    const showModal = ref(false);
    const movementType = ref(null);
    const showFilters = ref(false);
    const isLoading = ref(false);
    const movements = ref([]);
    const filterParams = ref({
      document: null,
      description: null,
      amount: null,
      concept_type: null,
      concept: null,
      payment_method: null,
    });
    const pagination = ref({
      filterParams: null,
      pageSize: 20,
    });

    const income = computed(() =>
      movements.value
        .filter((row) => tillStore.getConceptType(row.concept) === "0")
        .reduce((prevValue, row) => prevValue + Number(row.amount), 0)
    );

    const outcome = computed(() =>
      movements.value
        .filter((row) => tillStore.getConceptType(row.concept) === "1")
        .reduce((prevValue, row) => prevValue + Number(row.amount), 0)
    );

    const sells = computed(() =>
      movements.value
        .filter((row) => row.concept === 3)
        .reduce((prevValue, row) => prevValue + Number(row.amount), 0)
    );

    const total = computed(() => income.value - outcome.value);

    const ConceptOptions = computed(() => {
      switch (filterParams.value.concept_type) {
        case "0":
          return tillStore.getIncomeConceptsOptions;
        case "1":
          return tillStore.getOutcomeConceptsOptions;
        default:
          return tillStore.getConceptsOptions;
      }
    });

    const loadMovements = () => {
      isLoading.value = true;
      getCurrentTillDetails(tillStore.currentTillID)
        .then((response) => {
          if (response.status === 200) {
            movements.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    const performFilter = () => {
      isLoading.value = true;
      pagination.value.filterParams = filterParams.value;
      filterTillDetails(tillStore.currentTillID, pagination.value.filterParams)
        .then((response) => {
          movements.value = response.data;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    const refreshTable = () => {
      filterParams.value = {
        document: null,
        description: null,
        amount: null,
        concept_type: null,
        concept: null,
        payment_method: null,
      };
      pagination.value.filterParams = null;
      loadMovements();
    };

    const conceptTypeOptions = [
      {
        label: "Ingreso",
        value: "0",
      },
      {
        label: "Egreso",
        value: "1",
      },
    ];

    onMounted(() => {
      document.title = "Movimientos de Caja | App";
      loadMovements();
    });

    const onCloseModal = () => {
      document.title = "Movimientos de Caja | App";
      // idProduct.value = 0
    };

    const onSuccess = () => {
      showModal.value = false;
      loadMovements();
      onCloseModal();
      // loadProductsData()
    };

    return {
      isDecimal,
      isNumber,
      isLetter,
      pagination,
      isLoading,
      showModal,
      movementType,
      showFilters,
      tillStore,
      saleStore,
      conceptTypeOptions,
      onCloseModal,
      onSuccess,
      movements,
      income,
      outcome,
      sells,
      total,
      filterParams,
      ConceptOptions,
      performFilter,
      refreshTable,
      tableColumns: createMovementsColumns({
        hasSells() {
          return movements.value.some(
            (movement) => movement.concept !== 1 && movement.concept !== 7
          );
        },
        editMovement(rowData) {
          message.info("Ver detalles");
          /* showModal.value = true
              idCustomer.value = rowData.id */
        },
        deleteMovement(rowData) {
          dialog.error({
            title: "Anular",
            content: "¿Está seguro?",
            positiveText: "Sí",
            onPositiveClick: () => {
              isLoading.value = true;
              nullifyDetail(rowData.id)
                .then((response) => {
                  if (response.status === 202) {
                    message.success("Anulación exitosa!");
                    refreshTable();
                  }
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Algo salió mal...");
                  isLoading.value = true;
                });
            },
          });
        },
      }),
    };
  },
});
</script>

<style>
</style>