<template>
  <div id="CurrentTill">
    <n-grid
      cols="5 xs:5 s:10 m:10 l:20 xl:20 2xl:20"
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
              v-if="userStore.hasPermission('make_income_details')"
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
              v-if="userStore.hasPermission('make_outcome_details')"
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
          v-if="userStore.hasPermission('view_till')"
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
            cols="3 xs:3 s:12 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
            :scroll-x="900"
          >
            <n-form-item-gi label="Documento" :span="3">
              <n-input
                v-model:value="filterParams.document"
                placeholder=""
                @keypress="isLetterOrNumber($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Descripción" :span="3">
              <n-input
                v-model:value="filterParams.description"
                placeholder=""
                @keypress="isLetterOrNumber($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Monto" :span="3">
              <n-input
                v-model:value="filterParams.amount"
                placeholder=""
                @keypress="isDecimal($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Tipo Concepto" :span="3">
              <n-select
                v-model:value="filterParams.concept_type"
                placeholder=""
                :options="conceptTypeOptions"
                @update:value="filterParams.concept = null"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Concepto" :span="3">
              <n-select
                v-model:value="filterParams.concept"
                placeholder=""
                :options="ConceptOptions"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-select
                v-model:value="filterParams.payment_method"
                placeholder=""
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
        :pagination="pagination"
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
import { CreatePdfFile } from "@/hooks/CreatePdfFile";
import { defineComponent, ref, onMounted, computed } from "vue";
import { useMessage, useDialog } from "naive-ui";
import MovementModal from "./components/MovementModal";
import { isDecimal, isLetter, isNumber, isLetterOrNumber } from "@/utils";
import { createMovementsColumns } from "@/utils/constants";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import {
  getCurrentTillDetails,
  filterTillDetails,
  nullifyDetail,
} from "@/api/modules/tills";
import { useUserStore } from "../../store/modules/user";

export default defineComponent({
  name: "CurrentTill",
  components: {
    MovementModal,
  },
  setup() {
    const dateNow = ref(null);
    const urlImg = ref(null);
    const businnessStore = useBusinessStore();
    const userStore = useUserStore();
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

    const sells = computed(() => {
      const sells_income = movements.value
        .filter((row) => row.concept === 3)
        .reduce((prevValue, row) => prevValue + Number(row.amount), 0);
      const sells_outcome = movements.value
        .filter((row) => row.concept === 6)
        .reduce((prevValue, row) => prevValue + Number(row.amount), 0);
      return sells_income - sells_outcome;
    });

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

    const loadMovements = async () => {
      isLoading.value = true;
      await getCurrentTillDetails(tillStore.currentTillID)
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

    const performFilter = async () => {
      isLoading.value = true;
      pagination.value.filterParams = filterParams.value;
      await filterTillDetails(
        tillStore.currentTillID,
        pagination.value.filterParams
      )
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

    const refreshTable = async () => {
      filterParams.value = {
        document: null,
        description: null,
        amount: null,
        concept_type: null,
        concept: null,
        payment_method: null,
      };
      pagination.value.filterParams = null;
      await loadMovements();
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

    onMounted(async () => {
      document.title = "Movimientos de Caja | App";

      await loadMovements();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const onCloseModal = () => {
      document.title = "Movimientos de Caja | App";
      // idProduct.value = 0
    };

    const onSuccess = async () => {
      showModal.value = false;
      await loadMovements();
      onCloseModal();
      // loadProductsData()
    };

    return {
      isDecimal,
      isNumber,
      isLetter,
      isLetterOrNumber,
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
      userStore,
      tableColumns: createMovementsColumns({
        hasSells() {
          return movements.value.some(
            (movement) => movement.concept !== 1 && movement.concept !== 7
          );
        },
        editMovement(rowData) {
          let infoTikect = [];

          let info = {
            /* Usuario: "Usuario", */
            Concepto: tillStore.getConceptDescription(rowData.concept),
            Descripcion: rowData.description,
            "Metodo de Pago": saleStore
              .getPaymentMethodDescription(rowData.payment_method)
              .toUpperCase(),
          };

          for (let i in info) {
            infoTikect.push({
              tittle: i,
              twoPoints: ":",
              cont: info[i],
            });
          }

          let structure = [
            {
              dat: [
                [
                  {
                    content: `RECIBO DE ${
                      tillStore.getConceptType(rowData.concept) === "0"
                        ? "INGRESO"
                        : "EGRESO"
                    }`,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 11,
                    },
                  },
                ],
                [
                  {
                    content: !!rowData.document ? rowData.document : "",
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 9,
                    },
                  },
                ],
              ],
            },
            {
              dat: [
                {
                  tittle: businnessStore.getBranchDescription(
                    !userStore.user.branchoffice
                      ? businnessStore.currentBranch
                      : userStore.user.branchoffice
                  ),
                  cont: dateNow.value,
                },
              ],
            },
            {
              line: true,
              dat: infoTikect,
            },
            {
              line: true,
              dat: [
                [
                  {
                    content: `MONTO: ${rowData.amount}`,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 15,
                    },
                  },
                ],
              ],
            },
          ];

          CreatePdfFile({
            show: true,
            data: structure,
          });

          message.info("Imprimiendo");
        },
        deleteMovement(rowData) {
          dialog.error({
            title: "Anular",
            content: "¿Está seguro?",
            positiveText: "Sí",
            onPositiveClick: async () => {
              isLoading.value = true;
              await nullifyDetail(rowData.id)
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

<style></style>
