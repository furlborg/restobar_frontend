<template>
  <div id="TillList">
    <n-card title="Aperturas y Cierres" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
          v-if="userStore.hasPermission('add_till')"
          type="success"
          :disabled="
            userStore.user.branchoffice
              ? isTableLoading || tills.some((till) => till.status === true)
              : isTableLoading ||
                tills.some((till) => till.status === true) ||
                !(
                  !userStore.user.branchoffice &&
                  businessStore.currentBranch === filterParams.branch
                )
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
        <div class="d-flex">
          <n-button type="info" text @click="refreshTable">
            <v-icon name="hi-solid-refresh" />
            Recargar
          </n-button>
          <n-select
            v-if="!userStore.user.branchoffice"
            class="ps-2"
            v-model:value="filterParams.branch"
            :options="businessStore.branchSelectOptions"
            @update:value="refreshTable"
          ></n-select>
        </div>
      </n-space>
      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid
            responsive="screen"
            cols="3 xs:3 s:12 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
          >
            <n-form-item-gi label="Responsable Apertura" :span="3">
              <n-input
                v-model:value="filterParams.opening_responsable"
                placeholder=""
                @keypress="isLetter($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Responsable Cierre" :span="3">
              <n-input
                v-model:value="filterParams.closing_responsable"
                placeholder=""
                @keypress="isLetter($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Saldo inicial" :span="3">
              <n-input
                v-model:value="filterParams.opening_amount"
                placeholder=""
                @keypress="isDecimal($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Saldo final" :span="3">
              <n-input
                v-model:value="filterParams.closing_amount"
                placeholder=""
                @keypress="isDecimal($event)"
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
import format from "date-fns/format";
import { defineComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDialog, useMessage } from "naive-ui";
import jspdf from "jspdf";
import TillApertureModal from "./components/TillApertureModal";
import TillClosureModal from "./components/TillClosureModal";
import { createTillColumns } from "@/utils/constants";
import { isDecimal, isLetter, isNumber } from "@/utils";
import {
  getTills,
  getTillsByPageNumber,
  filterTills,
  getTillReport,
  getTillSaleReport,
  getSimpleTillReport,
  getExcelReport,
} from "@/api/modules/tills";
import { useTillStore } from "@/store/modules/till";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";

export default defineComponent({
  name: "TillList",
  components: {
    TillApertureModal,
    TillClosureModal,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const router = useRouter();
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    const tillStore = useTillStore();
    const isTableLoading = ref(false);
    const showApertureModal = ref(false);
    const showClosureModal = ref(false);
    const showFilters = ref(false);
    const idTill = ref(0);
    const tills = ref([]);
    const filterParams = ref({
      branch: !userStore.user.branchoffice
        ? businessStore.currentBranch
        : userStore.user.branchoffice,
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
      onChange: async (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        await getTillsByPageNumber(
          pagination.value.page,
          pagination.value.filterParams
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
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

    const loadTills = async () => {
      isTableLoading.value = true;
      pagination.value.page = 1;
      await getTills(filterParams.value.branch)
        .then((response) => {
          if (response.status === 200) {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
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

    const performFilter = async () => {
      isTableLoading.value = true;
      pagination.value.filterParams = filterParams.value;
      pagination.value.page = 1;
      await filterTills(pagination.value.page, pagination.value.filterParams)
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
          ) {
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

    const refreshTable = async () => {
      filterParams.value.opening_responsable = null;
      filterParams.value.closing_responsable = null;
      filterParams.value.opening_amount = null;
      filterParams.value.closing_amount = null;
      filterParams.value.created = null;
      filterParams.value.modified = null;
      pagination.value.filterParams = null;
      await loadTills();
    };

    onMounted(async () => {
      document.title = "Aperturas y Cierres | App";
      await loadTills();
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

    const onClosureSuccess = async () => {
      showClosureModal.value = false;
      onCloseModal();
      await loadTills();
      // loadProductsData()
    };

    const downloadReport = (data, filename) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
    };

    return {
      isDecimal,
      isNumber,
      isLetter,
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
      businessStore,
      userStore,
      tableColumns: createTillColumns({
        viewDetails(row) {
          router.push({
            name: "TillDetails",
            params: {
              till: row.id,
            },
          });
        },
        makeTillReport(row) {
          getTillReport(row.id)
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
        },
        makeSimpleTillReport(row) {
          getSimpleTillReport(row.id)
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
        },
        makeSaleReport(row) {
          getTillSaleReport(row.id)
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
        },
        requestExcel(till, report, filename) {
          getExcelReport(till, report)
            .then((response) => {
              downloadReport(
                response.data,
                `Reporte ${filename} ${format(
                  new Date(Date.now()),
                  "yyyy-MM-dd"
                )}.xlsx`
              );
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal");
            });
        },
        closeTill(row) {
          if (tillStore.currentTillOrders) {
            message.error("Aún hay pedidos pendientes");
          } else {
            idTill.value = row.id;
            showClosureModal.value = true;
          }
        },
      }),
    };
  },
});
</script>

<style>
</style>