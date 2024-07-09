<template>
    <div id="Sale">
        <n-card title="Ventas" :segmented="{ content: 'hard' }">
            <template #header-extra>
                <n-space>
                    <n-select
                            v-if="!userStore.user.branchoffice"
                            class="ps-2"
                            v-model:value="filterParams.branch"
                            :options="businessStore.branchSelectOptions"
                            @update:value="refreshTable"
                    />
                    <n-button
                            v-if="settingsStore.businessSettings.sale?.enable_invoices && settingsStore.businessSettings?.sale?.free_sale"
                            type="info"
                            tertiary
                            @click="() => $router.push({ name: 'FreeSale' })"
                    >
                        Venta Libre
                    </n-button>
                    <n-button
                            v-if="userStore.hasPermission('make_excel_report')"
                            type="info"
                            tertiary
                            @click="showReport = true"
                    >
                        Reporte
                    </n-button
                    >
                </n-space>
            </template>
            <n-space justify="space-between">
                <n-button
                        type="info"
                        text
                        @click="
            showFilters === false ? (showFilters = true) : (showFilters = false)
          "
                >
                    <v-icon name="md-filteralt-round"/>
                    {{ showFilters ? "Ocultar Filtros" : "Mostrar filtros" }}
                </n-button>
                <div class="d-flex">
                    <n-button type="info" text @click="refreshTable">
                        <v-icon name="hi-solid-refresh"/>
                        Recargar
                    </n-button>
                </div>
            </n-space>
            <n-collapse-transition class="mt-2" :show="showFilters">
                <n-form>
                    <n-grid
                            responsive="screen"
                            cols="6 s:6 m:12 l:12 xl:24 2xl:24"
                            :x-gap="12"
                    >
                        <n-form-item-gi label="Cliente" :span="4">
                            <n-input
                                    v-model:value="filterParams.customer"
                                    placeholder=""
                                    @keypress="isLetter($event)"
                            />
                        </n-form-item-gi>
                        <n-form-item-gi label="Serie" :span="2">
                            <n-select
                                    v-model:value="filterParams.serie"
                                    :options="saleStore.getSeriesOptions"
                                    placeholder=""
                                    clearable
                            />
                        </n-form-item-gi>
                        <n-form-item-gi label="Número" :span="2">
                            <n-input
                                    v-model:value="filterParams.number"
                                    placeholder=""
                                    @keypress="isNumber($event)"
                            />
                        </n-form-item-gi>
                        <n-form-item-gi label="Método Pago" :span="3">
                            <n-select
                                    v-model:value="filterParams.payment_method"
                                    :options="saleStore.getPaymentMethodsOptions"
                                    placeholder=""
                                    clearable
                            />
                        </n-form-item-gi>
                        <n-form-item-gi label="Estado" :span="2">
                            <n-select
                                    v-model:value="filterParams.status"
                                    :options="statusOptions"
                                    placeholder=""
                                    clearable
                            />
                        </n-form-item-gi>
                        <n-form-item-gi label="Fecha" :span="6">
                            <n-date-picker
                                    type="daterange"
                                    v-model:formatted-value="filterParams.date_sale"
                                    format="dd/MM/yyyy"
                                    clearable
                            />
                        </n-form-item-gi>
                        <n-form-item-gi :span="5">
                            <n-button type="info" secondary @click="performFilter"
                            >Buscar
                            </n-button
                            >
                        </n-form-item-gi>
                    </n-grid>
                </n-form>
            </n-collapse-transition>
            <n-data-table
                    class="mt-2"
                    :scroll-x="900"
                    :columns="tableColumns"
                    :data="sales"
                    :loading="isTableLoading"
                    :pagination="pagination"
                    remote
            />
        </n-card>
        <SaleUpdate
                v-model:sale="saleId"
                @update:sale="onCloseUpdate"
                @on-success="updateSuccess"
        />
        <sale-report-modal v-model:show="showReport"/>
        <preview-drawer v-model:show="showPdf" :data="saleData"/>
        <modal-anulate-sale :data-modal="showConfirm"/>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { createSaleColumns } from "@/utils/constants";
import {
    listSales,
    listSalesByPage,
    searchSales,
    retrieveSale,
    sendSale, nullSale
} from "@/api/modules/sales";
import { useSaleStore } from "@/store/modules/sale";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { isNumber, isLetter } from "@/utils";
import SaleUpdate from "./components/SaleUpdate";
import SaleReportModal from "./components/SaleReportModal";
import PreviewDrawer from "./components/PreviewDrawer";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
import ModalAnulateSale from "@/views/Sale/modalAnulateSale.vue";

export default defineComponent({
    name: "Sale",
    components: {
        ModalAnulateSale,
        SaleUpdate,
        SaleReportModal,
        PreviewDrawer
    },
    setup() {
        const dateNow = ref(null);
        const message = useMessage();
        const genericsStore = useGenericsStore();
        const settingsStore = useSettingsStore();
        const businessStore = useBusinessStore();
        const userStore = useUserStore();
        const saleStore = useSaleStore();
        const isTableLoading = ref(false);
        const sales = ref([]);
        const showFilters = ref(false);
        const filterParams = ref({
            branch: !userStore.user.branchoffice
                ? businessStore.currentBranch
                : userStore.user.branchoffice,
            customer: "",
            serie: null,
            number: "",
            payment_method: null,
            date_sale: null,
            status: null
        });

        const pagination = ref({
            pageSearchParams: null,
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

        const loadSales = async() => {
            isTableLoading.value = true;
            // pagination.value.pageSize = 20;
            await listSales(filterParams.value.branch).then((response) => {
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

        const refreshTable = async() => {
            filterParams.value.customer = "";
            filterParams.value.serie = null;
            filterParams.value.number = "";
            filterParams.value.payment_method = null;
            filterParams.value.date_sale = null;
            filterParams.value.status = null;
            pagination.value.pageSearchParams = null;
            pagination.value.page = 1;
            await loadSales();
        };

        const statusOptions = [
            {
                value: "N",
                label: "NUEVO"
            },
            {
                value: "E",
                label: "ENVIADO"
            },
            {
                value: "A",
                label: "ANULADO"
            }
        ];

        onMounted(async() => {
            await loadSales();

            const fetch = new Date();
            const dd = fetch.getDate();
            const mm = fetch.getMonth();
            const yy = fetch.getFullYear();
            const hh = fetch.getHours();
            const msms = fetch.getMinutes();

            dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
        });

        const showModal = ref(false);

        const saleId = ref(null);

        const onCloseUpdate = async() => {
            saleId.value = null;
            await performFilter();
        };

        const updateSuccess = () => {
            onCloseUpdate();
        };

        const showReport = ref(false);

        const isLoading = ref(false);

        const showConfirm = ref({ show: false, saleId: null });

        const passConfirm = ref("");

        const addReason = ref(false);

        const nullReason = ref("");

        const closeNullModal = () => {
            isLoading.value = false;
            addReason.value = false;
            passConfirm.value = "";
            nullReason.value = undefined;
        };

        const deleteId = ref(null);

        const performNullifySale = async(id, info) => {
            isLoading.value = true;
            await nullSale(id, info).then((response) => {
                if(response.status === 202) {
                    message.success("Anulado");
                    showConfirm.value = { show: false, saleId: null };
                    // deleteId.value = null;
                    // passConfirm.value = "";
                    isLoading.value = false;
                }
            }).catch((error) => {
                console.error(error);
                message.error("Error al anular la venta, contraseña incorrecta y/o usuario inexistente");
            }).finally(() => {
                pagination.value.onChange(pagination.value.page);
            });
        };

        const showPdf = ref(false);

        const saleData = ref(null);

        return {
            showPdf,
            saleData,
            saleStore,
            isLetter,
            isNumber,
            isTableLoading,
            statusOptions,
            pagination,
            showFilters,
            filterParams,
            refreshTable,
            performFilter,
            sales,
            businessStore,
            userStore,
            showModal,
            saleId,
            onCloseUpdate,
            updateSuccess,
            showReport,
            isLoading,
            deleteId,
            showConfirm,
            addReason,
            nullReason,
            closeNullModal,
            passConfirm,
            genericsStore,
            settingsStore,
            performNullifySale,
            tableColumns: createSaleColumns({
                updateSale(row) {
                    showModal.value = true;
                    saleId.value = row.id;
                    /* modal.value = h(SaleUpdate, {
					  show: true,
					  data: row,
					  onUpdateShow: () => (modal.value = null),
					}); */
                },
                printSale(row) {
                    retrieveSale(row.id).then((response) => {
                        if(response.status === 200) {
                            if(settingsStore.business_settings.printer.print_html) {
                                saleData.value = response.data;
                                showPdf.value = true;
                            } else {
                                VoucherPrint({
                                    data: response.data,
                                    businessStore,
                                    saleStore,
                                    show: true
                                });
                            }
                        }
                    }).catch((error) => {
                        console.error(error);
                        message.error("Algo salió mal...");
                    });
                },
                async sendSale(row) {
                    isTableLoading.value = true;
                    await sendSale(row.id).then((response) => {
                        if(response.status === 200) {
                            message.success("Enviado");
                        }
                    }).catch((error) => {
                        if(error.response.status === 400) {
                            message.error(error.response.data.error);
                        } else {
                            console.error(error);
                            message.error("Algo salió mal...");
                        }
                    }).finally(() => {
                        pagination.value.onChange(pagination.value.page);
                    });
                },
                nullifySale(row) {
                    // deleteId.value = row.id;
                    showConfirm.value = { show: true, saleId: row.id, permission: "cancel_sale", loadSales, performNullifySale };
                }
            })
        };
    }
});
</script>

<style></style>
