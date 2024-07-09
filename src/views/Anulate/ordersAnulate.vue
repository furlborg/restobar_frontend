<script setup>
import { h, onMounted, ref } from "vue";
import { listOrdersByPage, searchOrdersAnulate } from "@/api/modules/orders";
import { format } from "date-fns";
import { NButton, NTag, useMessage } from "naive-ui";
import { lighten, renderIcon } from "@/utils";
import { useTableStore } from "@/store/modules/table";
import DetailsModal from "@/views/Order/components/DetailsModal.vue";
import { http } from "@/api";
import { printTicketOrderAnulate } from "@/views/Anulate/PrintsAnulate/printOrders";

const tableStore = useTableStore();

const isTableLoading = ref(false);
const showDetailsModal = ref(false);
const showFilters = ref(false);
const idOrder = ref(0);
const delivery = ref({});
const today = new Date(Date.now());
const filterParams = ref({
    created: [
        format(today, "dd/MM/yyyy"),
        format(today, "dd/MM/yyyy")
    ],
    take_aways: true,
    tables: true,
    deliverys: true,
    canceled_type: null
});

const message = useMessage();
const orders = ref([]);

const typeCancellation = ref([
    { label: "A. Total", value: "T" },
    { label: "A. Parcial", value: "P" }
]);

const pagination = ref({
    pageSearchParams: {
        created: [
            format(today, "dd/MM/yyyy HH:mm:ss"),
            format(today, "dd/MM/yyyy HH:mm:ss")
        ],
        take_aways: true,
        tables: true,
        deliverys: true
    },
    total: 0,
    page: 1,
    pageCount: 1,
    pageSize: 20,
    onChange: async(page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        await listOrdersByPage(
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
            orders.value = response.data.results;
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
    pagination.value.pageSearchParams = { ...filterParams.value, created: `${filterParams.value.created[0]} 00:00:00, ${filterParams.value.created[1]} 23:59:59` };
    pagination.value.page = 1;
    await searchOrdersAnulate(
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
        orders.value = response.data.results;
    }).catch((error) => {
        console.error(error);
        message.error("Algo salió mal...");
    }).finally(() => {
        isTableLoading.value = false;
    });
};

onMounted(async() => {
    await performFilter();
});

const columns = [
    { title: "#", key: "id", align: "center", width: 70 },
    // { title: "Cliente", key: "sale_customer", align: "center", width: 200 },
    { title: "Usuario", key: "username", align: "center", width: 200 },
    { title: "Monto", align: "center", width: 100, render(row) { return `S/. ${parseFloat(row?.["initial_amount"]).toFixed(2)}`; } },
    { title: "Fecha", key: "created", align: "center", width: 120 },
    {
        title: "Mesa", align: "center", width: 130,
        render(row) {
            switch(row.order_type) {
                case "M":
                    return tableStore.getTableByID(row.table).description;
                case "P":
                    return "-";
                case "D":
                    return "-";
                default:
                    return "¡ERROR!";
            }
        }
    },
    {
        title: "Tipo", align: "center", width: 120,
        render(row) {
            let color, text;
            switch(row.order_type) {
                case "M":
                    color = "#3B689F";
                    text = "EN MESA";
                    break;
                case "P":
                    color = "#926ED7";
                    text = "PARA LLEVAR";
                    break;
                case "D":
                    color = "#995C4E";
                    text = "DELIVERY";
                    break;
                default:
                    color = "#D03050";
                    text = "ERROR";
                    break;
            }

            return h(
                NTag,
                {
                    size: "small",
                    color: { color: lighten(color, 48), textColor: color, borderColor: lighten(color, 24) },
                    round: false
                },
                {
                    default: () => text
                }
            );
        }
    },
    {
        title: "Estado", align: "center", width: 90,
        render(row) {
            return h(
                NTag,
                { size: "small", type: "error", round: true },
                { default: () => `ANULADO ${row?.["canceled_type_description"]}` }
            );
        }
    },
    {
        title: "", key: "actions", width: 50, align: "center",
        render(row) {
            return h(
                NButton,
                {
                    style: { color: "#3B689F", "margin": "4px" },
                    size: "small", type: "info", secondary: true,
                    onClick: () => {
                        idOrder.value = row.id;
                        showDetailsModal.value = true;
                    }
                },
                renderIcon("md-feed-round")
            );
        }
    }
];

const onCloseModal = () => {
    idOrder.value = 0;
    delivery.value = null;
};

const getDataPrintOrder = async(type = String) => {
    const response = await http.get(`orders/canceled_list/`, {
        params: { ...filterParams.value, created: `${filterParams.value.created[0]} 00:00:00, ${filterParams.value.created[1]} 23:59:59`, canceled_type: type }
    });
    if(response.data.results.length === 0) {
        message.info("No hay resultados para imprimir");
    } else {
        message.success("Reporte generado con éxito");
        const print = new printTicketOrderAnulate();
        await print.generate(response.data.results, type);
    }
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
                <n-button type="info" @click="getDataPrintOrder('P')">
                    Reporte orden parcial
                </n-button>
                <n-button type="info" @click="getDataPrintOrder('T')">
                    Reporte orden total
                </n-button>
                <!--                <n-button type="info" text @click="">-->
                <!--                    <v-icon name="hi-solid-refresh"/>-->
                <!--                    Recargar-->
                <!--                </n-button>-->
            </div>
        </n-space>

        <n-collapse-transition class="mt-4" :show="showFilters">
            <n-form>
                <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
                    <n-form-item-gi label="Fecha Desde" :span="2">
                        <n-date-picker type="date" v-model:formatted-value="filterParams.created[0]" format="dd/MM/yyyy" clearable/>
                    </n-form-item-gi>
                    <n-form-item-gi label="Fecha Hasta" :span="2">
                        <n-date-picker type="date" v-model:formatted-value="filterParams.created[1]" format="dd/MM/yyyy" clearable/>
                    </n-form-item-gi>
                    <n-form-item-gi label="T. de Anulación" :span="2">
                        <n-select :options="typeCancellation" v-model:value="filterParams.canceled_type" clearable/>
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                        <n-button type="info" secondary @click="performFilter">Buscar
                        </n-button>
                    </n-form-item-gi>
                </n-grid>
            </n-form>
        </n-collapse-transition>

        <n-data-table size="tiny" :data="orders" :columns="columns" :pagination="pagination" :single-line="false" :loading="isTableLoading"
                      class="mt-2" scroll-x="1100px" striped max-height="calc(100vh - 350px)" remote style="font-size: 13px !important;"/>
        <details-modal v-model:show="showDetailsModal" :id-order="idOrder" @update:show="onCloseModal"/>
    </div>
</template>
