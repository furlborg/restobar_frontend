<template>
  <div id="TillDetails">
    <n-grid
      cols="5 xs:5 s:10 m:10 l:20 xl:20 2xl:20"
      responsive="screen"
      :x-gap="12"
      :y-gap="12"
    >
      <n-gi :span="5">
        <n-card hoverable>
          <n-space align="center">
            <n-space align="center" vertical>
              <v-icon name="md-trendingup-round" scale="2" fill="LimeGreen" />
              <n-text class="fs-5">Ingresos</n-text>
            </n-space>
            <!-- <n-button
              type="success"
              tertiary
              circle
              @click="(movementType = '0'), (showModal = true)"
            >
              <v-icon name="bi-pencil-square" scale="1.25" />
            </n-button> -->
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. {{ income.toFixed(2) }}</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space align="center">
            <n-space align="center" vertical>
              <v-icon
                name="md-trendingdown-round"
                scale="2"
                fill="red"
                flip="horizontal"
              />
              <n-text class="fs-5">Egresos</n-text>
            </n-space>
            <!-- <n-button
              type="error"
              tertiary
              circle
              @click="(movementType = '1'), (showModal = true)"
            >
              <v-icon name="bi-pencil-square" scale="1.25" />
            </n-button> -->
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
    <n-card class="mt-2">
      <n-tabs type="card">
        <n-tab-pane name="movements" tab="Movimientos">
          <!-- <template #header-extra>
        <n-button
          type="info"
          secondary
          @click="$router.push({ name: 'TillList' })"
          >Lista de Cajas</n-button
        >
      </template> -->
          <n-space class="mt-2" justify="space-between">
            <n-button
              type="info"
              text
              @click="
                showFilters === false
                  ? (showFilters = true)
                  : (showFilters = false)
              "
            >
              <v-icon name="md-filteralt-round" />
              {{ showFilters ? "Ocultar Filtros" : "Mostrar filtros" }}
            </n-button>
            <!-- <n-button type="info" tertiary @click="makeReport"
              >Reporte</n-button
            >
            <n-button type="info" tertiary @click="makeSaleReport"
              >Reporte ventas</n-button
            > -->
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
        </n-tab-pane>
        <n-tab-pane name="sales" tab="Ventas">
          <TillSales />
        </n-tab-pane>
        <n-tab-pane name="orders" tab="Pedidos">
          <TillOrders />
        </n-tab-pane>
        <template #suffix>
          <n-dropdown
            trigger="click"
            :options="reportOptions"
            @select="selectReport"
          >
            <n-button type="info" tertiary>
              <!-- <v-icon name="si-simpleanalytics" /> -->
              Reportes
            </n-button>
          </n-dropdown>
        </template>
      </n-tabs>
    </n-card>
    <movement-modal
      v-model:show="showModal"
      :movement-type="movementType"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
    <!-- <iframe id="TillReport" name="TillReport"></iframe> -->
  </div>
</template>

<script>
import jspdf from "jspdf";
import format from "date-fns/format";
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import MovementModal from "./components/MovementModal";
import TillOrders from "./components/TillOrders";
import TillSales from "./components/TillSales";
import { isDecimal, isLetter, isNumber, isLetterOrNumber } from "@/utils";
import { createTillDetailsColumns } from "@/utils/constants";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import {
  getCurrentTillDetails,
  filterTillDetails,
  getTillReport,
  getTillSaleReport,
  getSimpleTillReport,
  getExcelReport,
} from "@/api/modules/tills";
import { useUserStore } from "@/store/modules/user";

export default defineComponent({
  name: "TillDetails",
  components: {
    MovementModal,
    TillOrders,
    TillSales,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const till = route.params.till;
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
      await getCurrentTillDetails(till)
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
      await filterTillDetails(till, pagination.value.filterParams)
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
      document.title = "Reportes de Caja | App";

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

    const makeTillReport = () => {
      getTillReport(till)
        .then((response) => {
          const doc = new jspdf({
            format: [80, 297],
          });
          doc.html(response.data, {
            html2canvas: { scale: "0.25" },
            margin: [0, 2, 0, 2],
            callback: function (doc) {
              /* doc.save(); */
              doc.autoPrint();
              const hiddFrame = document.createElement("iframe");
              hiddFrame.style.position = "fixed";
              hiddFrame.style.width = "1px";
              hiddFrame.style.height = "1px";
              hiddFrame.style.opacity = "0.01";
              hiddFrame.src = doc.output("bloburl");
              document.body.appendChild(hiddFrame);
            },
          });
        })
        .catch((error) => {
          console.error(error);
        });
    };

    const makeSimpleTillReport = () => {
      getSimpleTillReport(till)
        .then((response) => {
          const doc = new jspdf({
            format: [80, 297],
          });
          doc.html(response.data, {
            html2canvas: { scale: "0.25" },
            margin: [0, 2, 0, 2],
            callback: function (doc) {
              /* doc.save(); */
              doc.autoPrint();
              const hiddFrame = document.createElement("iframe");
              hiddFrame.style.position = "fixed";
              hiddFrame.style.width = "1px";
              hiddFrame.style.height = "1px";
              hiddFrame.style.opacity = "0.01";
              hiddFrame.src = doc.output("bloburl");
              document.body.appendChild(hiddFrame);
            },
          });
        })
        .catch((error) => {
          console.error(error);
        });
    };

    const makeSaleReport = () => {
      getTillSaleReport(till)
        .then((response) => {
          const doc = new jspdf({
            format: [80, 297],
          });
          doc.html(response.data, {
            html2canvas: { scale: "0.25" },
            margin: [0, 2, 0, 2],
            callback: function (doc) {
              /* doc.save(); */
              doc.autoPrint();
              const hiddFrame = document.createElement("iframe");
              hiddFrame.style.position = "fixed";
              hiddFrame.style.width = "1px";
              hiddFrame.style.height = "1px";
              hiddFrame.style.opacity = "0.01";
              hiddFrame.src = doc.output("bloburl");
              document.body.appendChild(hiddFrame);
            },
          });
        })
        .catch((error) => {
          console.error(error);
        });
    };

    const reportOptions = [
      {
        label: "Imprimir",
        key: 1,
        children: [
          {
            key: 11,
            label: "Reporte de caja",
          },
          {
            key: 12,
            label: "Reporte simple de caja",
          },
          {
            key: 13,
            label: "Reporte de ventas",
          },
        ]
      },
      {
        label: "Excel",
        key: 2,
        children: [
          {
            key: 21,
            label: 'Caja',
            children: [
              {
                label: "Movimientos",
                key: 211,
              },
              {
                label: "Ingresos",
                key: 212,
              },
              {
                label: "Egresos",
                key: 213,
              },
            ]
          },
          {
            key: 22,
            label: 'Pedidos',
            children: [
              {
                label: "General",
                key: 221,
              },
              {
                label: "Usuarios",
                key: 222,
              },
            ]
          },
          {
            label: "Ventas",
            key: 23,
            children: [
              {
                label: "Ventas",
                key: 231,
              },
              {
                label: "Productos",
                key: 232,
              },
              {
                label: "Categorías",
                key: 233,
              },
            ]
          },
        ]
      }
    ];

    const selectReport = (key) => {
      switch (key) {
        case 11:
          makeTillReport();
          break;
        case 12:
          makeSimpleTillReport();
          break;
        case 13:
          makeSaleReport();
          break;
        case 211:
          requestExcel('details', 'Movimientos');
          break;
        case 212:
          requestExcel('income', 'Ingresos');
          break;
        case 213:
          requestExcel('outcome', 'Egresos');
          break;
        case 221:
          requestExcel('orders', 'Pedidos');
          break;
        case 222:
          requestExcel('users', 'Usuarios');
          break;
        case 231:
          requestExcel('sales', 'Ventas');
          break;
        case 232:
          requestExcel('products', 'Productos');
          break;
        case 233:
          requestExcel('categories', 'Categorías');
          break;
        default:
          console.error("Algo salió mal...");
          break;
      }
    };

    const onSuccess = async () => {
      showModal.value = false;
      await loadMovements();
      onCloseModal();
      // loadProductsData()
    };

    const downloadReport = (data, filename) => {
          const url = window.URL.createObjectURL(new Blob([data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', filename)
          document.body.appendChild(link)
          link.click()
    }

    const requestExcel = async (report, filename) => {
      await getExcelReport(till, report)
        .then(response => {
          downloadReport(response.data, `Reporte ${filename} ${format(new Date(Date.now()), "yyyy-MM-dd")}.xlsx`)
        })
        .catch(error => {
          console.error(error)
          message.error('Algo salió mal')
        })
    }

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
      makeTillReport,
      makeSimpleTillReport,
      makeSaleReport,
      reportOptions,
      selectReport,
      tableColumns: createTillDetailsColumns(),
    };
  },
});
</script>

<style></style>
