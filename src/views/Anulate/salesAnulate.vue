<script setup>
import { h, onMounted, ref } from "vue";
import { NButton, NPopover, NTag, useMessage } from "naive-ui";
import { useBusinessStore } from "@/store/modules/business";
import { isNumber, isLetter } from "@/utils";
import { useUserStore } from "@/store/modules/user";
import { listSalesByPage, searchSales, searchSalesAnulate } from "@/api/modules/sales";
import { renderIcon } from "@/utils";
import { useSaleStore } from "@/store/modules/sale";
import ModalAnulateSale from "@/views/Anulate/modalAnulateSale.vue";
import { printTicketSalesAnulate } from "@/views/Anulate/PrintsAnulate/printSaleAnulate";

const dateNow = ref(null);
const message = useMessage();

const businessStore = useBusinessStore();
const userStore = useUserStore();
const saleStore = useSaleStore();
const isTableLoading = ref(false);
const sales = ref([]);
const showFilters = ref(false);
const dataDetailsModal = ref({ show: false, details: {} });

const filterParams = ref({
    branch: !userStore.user.branchoffice ? businessStore.currentBranch : userStore.user.branchoffice,
    customer: "",
    serie: null,
    number: "",
    payment_method: null,
    date_sale: null,
    status: "A"
});

const refreshTable = async() => {
    filterParams.value.customer = "";
    filterParams.value.serie = null;
    filterParams.value.number = "";
    filterParams.value.payment_method = null;
    filterParams.value.date_sale = null;
    filterParams.value.status = "A";
    pagination.value.pageSearchParams = null;
    pagination.value.page = 1;
    await performFilter();
};

const pagination = ref({
    pageSearchParams: {},
    total: 0,
    page: 1,
    pageCount: 1,
    pageSize: 20,
    showSizePicker: true,
    pageSizes: [20, 50, 100],
    onChange: async(page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        await listSalesByPage(
            pagination.value.pageSearchParams,
            pagination.value.page,
            pagination.value.pageSize
        ).then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
                Number(response.data.count) / pagination.value.pageSize
            );
            if(
                Number(response.data.count) % pagination.value.pageSize !== 0 ||
                pagination.value.pageCount === 0
            ) {
                ++pagination.value.pageCount;
            }
            sales.value = response.data.results;
        }).catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
        }).finally(() => {
            isTableLoading.value = false;
        });
    },
    onPageSizeChange: async(pageSize) => {
        isTableLoading.value = true;
        pagination.value.pageSize = pageSize;
        await listSalesByPage(
            pagination.value.pageSearchParams,
            pagination.value.page,
            pagination.value.pageSize
        ).then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
                Number(response.data.count) / pagination.value.pageSize
            );
            if(
                Number(response.data.count) % pagination.value.pageSize !== 0 ||
                pagination.value.pageCount === 0
            ) {
                ++pagination.value.pageCount;
            }
            sales.value = response.data.results;
        }).catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
        }).finally(() => {
            isTableLoading.value = false;
        });
    }
});

const performFilter = async() => {
    isTableLoading.value = true;
    pagination.value.pageSearchParams = filterParams.value;
    pagination.value.page = 1;
    await searchSales(
        pagination.value.pageSearchParams,
        pagination.value.page,
        pagination.value.pageSize
    ).then((response) => {
        pagination.value.total = response.data.count;
        pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
        );
        if(
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
        ) {
            ++pagination.value.pageCount;
        }
        sales.value = response.data.results;
    }).catch((error) => {
        console.error(error);
        message.error("Algo salió mal...");
    }).finally(() => {
        isTableLoading.value = false;
    });
};

onMounted(async() => {
    await performFilter();
    const fetch = new Date();
    const dd = fetch.getDate();
    const mm = fetch.getMonth();
    const yy = fetch.getFullYear();
    const hh = fetch.getHours();
    const msms = fetch.getMinutes();

    dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
});

const columns = [
    { title: "#", key: "id", align: "center", width: 40 },
    { title: "Cliente", key: "customer", width: 140, align: "center" },
    { title: "Documento", align: "center", width: 100, render(row) { return `${row.serie}-${row.number}`; } },
    { title: "Método Pago", align: "center", key: "payment_method", width: 70 },
    { title: "Monto", align: "center", width: 70, render(row) { return `S/. ${row.amount}`; } },
    { title: "Emisión", key: "date_sale", width: 70, align: "center" },
    {
        title: "Estado", align: "center", key: "status", width: 60,
        render(row) {
            return h(
                NPopover,
                {
                    trigger: "hover",
                    disabled: !row.null_reason
                },
                {
                    default: () => row.null_reason,
                    trigger: () =>
                        h(
                            NTag,
                            {
                                size: "small",
                                type: "error",
                                round: true
                            },
                            {
                                default: () => "ANULADO"
                            }
                        )
                }
            );
        }
    },
    {
        title: "",
        key: "actions",
        align: "center",
        width: 30,
        render(row) {
            return h(
                NButton,
                {
                    style: { color: "#3B689F", "margin": "4px" },
                    size: "small", type: "info", secondary: true,
                    onClick: () => { dataDetailsModal.value = { details: row, show: true }; }
                },
                renderIcon("md-feed-round")
            );
        }
    }
];

const getDataForReport = async() => {
    isTableLoading.value = true;
    pagination.value.pageSearchParams = filterParams.value;
    pagination.value.page = 1;
    await searchSalesAnulate(
        pagination.value.pageSearchParams,
        1,
        99999
    ).then((response) => {
        if(response.data.results.length === 0) {
            message.info("No hay resultados para imprimir");
        } else {
            message.success("Reporte generado con éxito");
            const length = response.data.results.map((item) => JSON.parse(item.json_sale)?.items.length).reduce((a, b) => a + b, 0);
            const sizePrint = response.data.results.length * length;
            const print = new printTicketSalesAnulate(response.data.results, sizePrint + 500);
            print.generate(response.data.results);
        }
    }).catch((error) => {
        console.error(error);
        message.error("Algo salió mal...");
    }).finally(() => {
        isTableLoading.value = false;
    });
};

</script>

<template>
    <div>
        <n-space justify="space-between">
            <n-button type="info" text @click="showFilters = !showFilters">
                <v-icon name="md-filteralt-round"/>
                {{ showFilters ? "Ocultar Filtros" : "Mostrar filtros" }}
            </n-button>
            <div class="d-flex gap-2">
                <n-button type="info" @click="getDataForReport" :disabled="isTableLoading" :loading="isTableLoading">
                    Reporte ventas anuladas
                </n-button>
                <n-button type="info" text @click="refreshTable">
                    <v-icon name="hi-solid-refresh"/>
                    Recargar
                </n-button>
            </div>
        </n-space>
        <n-collapse-transition class="mt-2" :show="showFilters">
            <n-form>
                <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
                    <n-form-item-gi label="Cliente" :span="4">
                        <n-input v-model:value="filterParams.customer" placeholder="" @keyup="isLetter($event)"/>
                    </n-form-item-gi>
                    <n-form-item-gi label="Cliente" :span="4">
                        <n-select v-if="!userStore.user.branchoffice" class="ps-2" v-model:value="filterParams.branch"
                                  :options="businessStore.branchSelectOptions" @update:value="refreshTable"/>
                    </n-form-item-gi>

                    <n-form-item-gi label="Serie" :span="2">
                        <n-select v-model:value="filterParams.serie" :options="saleStore.getSeriesOptions" placeholder="" clearable/>
                    </n-form-item-gi>
                    <n-form-item-gi label="Número" :span="2">
                        <n-input v-model:value="filterParams.number" placeholder="" @keyup="isNumber($event)"/>
                    </n-form-item-gi>
                    <n-form-item-gi label="Método Pago" :span="3">
                        <n-select v-model:value="filterParams.payment_method" :options="saleStore.getPaymentMethodsOptions" placeholder=""
                                  clearable/>
                    </n-form-item-gi>
                    <n-form-item-gi label="Fecha" :span="2">
                        <n-date-picker type="daterange" v-model:formatted-value="filterParams.date_sale" format="dd/MM/yyyy" clearable/>
                    </n-form-item-gi>
                    <n-form-item-gi :span="5">
                        <n-button type="info" secondary @click="performFilter">Buscar
                        </n-button>
                    </n-form-item-gi>
                </n-grid>
            </n-form>
        </n-collapse-transition>
        <n-data-table class="mt-2" style="font-size: 13px !important;" size="tiny" striped :single-line="false" :scroll-x="1100"
                      :columns="columns" :data="sales"
                      :loading="isTableLoading" :pagination="pagination" remote max-height="calc(100vh - 350px)"/>
        <modal-anulate-sale :data="dataDetailsModal"/>
    </div>
</template>
