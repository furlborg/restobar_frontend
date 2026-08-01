<template>
    <n-card :bordered="false" :segmented="{ content: 'hard' }" class="h-100" content-class="overflow-auto" :content-style="genericsStore.device === 'mobile' ? 'padding-bottom: 25px !important;' : ''">
        <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; flex-wrap: wrap;">
                <!-- Título y Selector (Crecen para llenar el espacio) -->
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                    <span style="white-space: nowrap;">Mesas</span>
                    <n-select v-if="isWaiterModeView" v-model:value="selectedAreaId" :options="areaOptions" clearable placeholder="Cambiar de sucursal" style="flex: 1; min-width: 120px;" />
                </div>
                
                <!-- Botones Extras (Alineados a la derecha) -->
                <n-space v-if="tillStore.currentTillID" align="center" item-style="display: flex; align-items: center;" :wrap="false">
                    <n-tooltip>
                        <template #trigger>
                            <v-icon name="fa-circle" scale="0.75" :color="tableStore.wsConnected ? 'green' : 'red'"
                                :animation="tableStore.wsConnected ? undefined : 'flash'" style="margin-right: 5px;" />
                        </template>
                        {{ tableStore.wsConnected ? 'WebSocket conectado' : 'WebSocket desconectado' }}
                    </n-tooltip>
                    <n-button type="info" text @click="refreshData">
                        <v-icon name="hi-solid-refresh" />
                        <span v-if="genericsStore.device !== 'mobile'" class="ms-1">Recargar</span>
                    </n-button>
                    <template v-if="settingsStore.business_settings?.order?.divide_delivery_takeaway">
                        <n-button v-if="userStore.hasPermission('take_away_order') && userStore.user.role !== 'MOZO'" type="info" secondary
                            @click="$router.push({ name: 'TakeOrder', query: { delivery: true } })">
                            Delivery
                        </n-button>
                        <n-button v-if="userStore.hasPermission('take_away_order') && userStore.user.role !== 'MOZO'" type="info" secondary
                            @click="$router.push({ name: 'TakeOrder', query: { delivery: false } })">
                            {{ settingsStore.business_settings.order?.fast_sale_format ? "Venta Rápida" : "Para llevar" }}
                        </n-button>
                    </template>
                    <template v-else>
                        <n-button v-if="userStore.hasPermission('take_away_order') && userStore.user.role !== 'MOZO'" type="info" secondary
                            @click="$router.push({ name: 'TakeOrder' })">
                            {{ settingsStore.business_settings.order?.fast_sale_format ? "Venta Rápida" : "Para llevar" }} /
                            Delivery
                        </n-button>
                    </template>
                </n-space>
            </div>
        </template>
        <n-spin v-if="tillStore.currentTillID" :show="isLoading">
            <n-card class="my-2" v-for="area in filteredAreas" :key="area.id" :title="area.description"
                :embedded="genericsStore.device !== 'mobile'"
                :bordered="genericsStore.device !== 'mobile'"
                :content-style="genericsStore.device === 'mobile' ? 'padding: 4px 2px;' : ''"
                :header-style="genericsStore.device === 'mobile' ? 'padding: 6px 8px; font-size: 1.15rem; font-weight: bold;' : ''">
                <n-grid responsive="screen" cols="6 xs:6 s:12 m:15 l:18 xl:24 2xl:30" :x-gap="12" :y-gap="12">
                    <n-gi v-for="table in area.tables.filter(dt => !dt?.is_disabled)" :key="table.id" span="2 xs:2 s:3 m:3 l:3 xl:3 2xl:3">
                        <n-card :id="`table-${table.id}`" class="overflow-hidden position-relative rounded-3"
                            :class="getTableBackgroundClass(table)" :style="{
                                borderLeft: `6px solid ${getTableColor(table)}`,
                                borderRight: `6px solid ${getTableColor(table)}`
                            }" size="small" :content-style="genericsStore.device === 'mobile' ? 'padding: 4px;' : ''" @click="handleTableClick(table)" style="cursor: pointer">
                            <n-checkbox v-if="groupMode" :checked="currentGroup.some((t) => t.id === table.id)"
                                :disabled="tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
                                    currentTableGrouping === table.id
                                    " size="large" class="top-0 m-2 position-absolute start-0" />
                            <div class="text-center position-absolute start-50 translate-middle-x d-flex align-items-center justify-content-center"
                                :style="{
                                    top: genericsStore.device === 'mobile' ? (table?.order_amount !== '' ? '25%' : '50%') : (table?.order_amount !== '' ? '33%' : '50%'),
                                    transform: 'translate(-50%, -50%)',
                                    width: '92%',
                                    zIndex: 2,
                                    wordBreak: genericsStore.device === 'mobile' ? 'normal' : 'break-word',
                                    whiteSpace: genericsStore.device === 'mobile' ? 'nowrap' : 'normal',
                                    overflow: genericsStore.device === 'mobile' ? 'hidden' : 'visible',
                                    textOverflow: genericsStore.device === 'mobile' ? 'ellipsis' : 'clip'
                                }"
                                :class="{
                                    'fs-alt': table.description.length <= 3,
                                    'fs-4':
                                        table.description.length > 3 &&
                                        table.description.length <= 15 && genericsStore.device !== 'mobile',
                                    'fs-6': (table.description.length > 15) || (genericsStore.device === 'mobile' && table.description.length > 3),
                                }">
                                {{ table.description }}
                            </div>
                            <div class="text-center position-absolute start-50 translate-middle-x"
                                style="bottom: 35px; font-size: 13px; left: 50%; color: #e31414; font-weight: 900 !important; width: 100%;"
                                v-if="table?.order_amount !== '' && genericsStore.device !== 'mobile'">
                                Ult. Pedido:
                            </div>
                            <div class="text-center position-absolute start-50 translate-middle-x"
                                style="bottom: 20px; font-size: 13px; left: 50%; color: #e31414; font-weight: 900 !important; width: 100%;"
                                v-if="table?.order_amount !== '' && genericsStore.device !== 'mobile'">
                                {{ table.modified }}
                            </div>
                            <n-button v-if="
                                table.order_amount !== '' &&
                                settingsStore.business_settings?.order?.table_order_total
                            " class="bottom-0 text-center position-absolute start-50 translate-middle-x fw-bolder"
                                :class="genericsStore.device === 'mobile' ? 'fs-6' : 'fs-5'"
                                :style="genericsStore.device === 'mobile' ? 'bottom: 2px !important; z-index: 2;' : ''"
                                color="#901E00" text>
                                S/. {{ (Number(table?.order_amount) || 0).toFixed(2) }}
                            </n-button>
                            <n-button v-if="genericsStore.device !== 'mobile'" @click.stop="openOptions.push(table.id)" class="top-0 position-absolute end-0"
                                quaternary size="small">
                                <v-icon name="bi-three-dots-vertical" />
                            </n-button>
                            <v-icon v-if="
                                groupMode === true &&
                                tableGroups.some((g) => g.some((t) => t.id === table.id))
                            " class="position-absolute top-50 start-50 translate-middle fs-4" name="ri-forbid-line"
                                scale="8" fill="#FA8072" />
                            <n-space justify="center" align="center" :style="genericsStore.device === 'mobile' ? 'min-height: 80px; display: flex;' : 'min-height: 155px; display: flex;'">
                                <img draggable="false" src="~@/assets/images/default-table.png" alt="" class="table-bg-img" :style="genericsStore.device === 'mobile' ? 'max-height: 55px; width: 55px; opacity: 0.65;' : ''" />
                            </n-space>

                            <n-drawer :show="groupMode
                                ? ((openOptions = []), false)
                                : openOptions.some((t) => t === table.id)
                                " height="100%" placement="top" :to="`#table-${table.id}`" @maskClick.stop>
                                <n-drawer-content :native-scrollbar="false" @click.stop>
                                    <n-space vertical align="center">
                                        <n-button type="error" size="small" tertiary circle @click="
                                            openOptions.splice(
                                                openOptions.findIndex((i) => i === table.id),
                                                1
                                            )
                                            ">
                                            <v-icon name="md-close-round" />
                                        </n-button>
                                    </n-space>
                                    <n-button v-if="userStore.hasPermission('charge_order')" class="mb-1" type="success"
                                        size="small" block secondary :disabled="table.status === '1'" @click="
                                            $router.push({
                                                name: 'TablePayment',
                                                params: { table: table.id },
                                            })
                                            ">
                                        Cobrar pedido
                                    </n-button>
                                    <n-button class="mb-1" type="info" size="small" block secondary
                                        :disabled="table.status === '1'" @click="performRetrieveTableOrder(table.id)">
                                        Pre-cuenta
                                    </n-button>
                                    <n-button class="mb-1" type="warning" size="small" block secondary
                                        :disabled="table.status === '1'" @click="
                                            openOptions.splice(
                                                openOptions.findIndex((i) => i === table.id),
                                                1
                                            );
                                        fromTable = table.id;
                                        currentArea = area.id;
                                        changeTable = true;
                                        ">
                                        Cambiar mesa
                                    </n-button>
                                    <n-button v-if="userStore.hasPermission('null_orders') || userStore.user.role === 'MOZO'" class="mb-1" type="error"
                                        size="small" block secondary :disabled="table.status === '1'" @click="
                                            openOptions.splice(
                                                openOptions.findIndex((i) => i === table.id),
                                                1
                                            ),
                                            nullifyTableOrder(table.id)
                                            ">
                                        Anular pedido
                                    </n-button>
                                </n-drawer-content>
                            </n-drawer>
                        </n-card>
                    </n-gi>
                </n-grid>
            </n-card>
        </n-spin>
        <div v-else>
            <n-space align="center" vertical>
                <v-icon label="No Open Till" scale="6">
                    <v-icon name="md-pointofsale-twotone" />
                    <v-icon name="md-notinterested-round" scale="2" fill="#fC644d" />
                </v-icon>
                <n-text class="fs-3">NO SE HA APERTURADO CAJA</n-text>
            </n-space>
        </div>
        <n-modal :class="{
            'w-100': genericsStore.device === 'mobile',
            'w-50': genericsStore.device === 'tablet',
            'w-25': genericsStore.device === 'desktop',
        }" preset="card" v-model:show="changeTable" title="Cambiar mesa" :mask-closable="false" closable>
            <n-form-item label="Mesa actual">
                <n-select :value="fromTable" disabled :options="tableStore.getAreaTablesOptions(currentArea)"
                    placeholder="" />
            </n-form-item>
            <n-form-item label="Area">
                <n-select v-model:value="currentArea" :options="tableStore.getAreasOptions" placeholder="" />
            </n-form-item>
            <n-form-item label="Mesa">
                <n-select v-model:value="toTable" :options="tableStore.getAreaTablesOptions(currentArea)" placeholder=""
                    filterable />
            </n-form-item>
            <template #action>
                <n-space justify="end">
                    <n-button type="success" :loading="isLoading" :disabled="!toTable || isLoading" secondary
                        @click.prevent="performChangeTable">Confirmar
                    </n-button>
                </n-space>
            </template>
        </n-modal>
        <PreviewDrawer ref="previewDrawer" v-model:show="showPreview" :data="previewData" :preVoucher="true"
            :previewOnly="true" />
        <modal-anulate-sale :data-modal="showConfirm" />
    </n-card>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useGenericsStore } from "@/store/modules/generics";
import { useTableStore } from "@/store/modules/table";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import {
    cancelTableOrder,
    retrieveTableOrder,
    changeOrderTable
} from "@/api/modules/tables";
import { cloneDeep } from "@/utils";
import { useBusinessStore } from "@/store/modules/business";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import ModalAnulateSale from "@/views/Sale/modalAnulateSale.vue";
import { useTableLock } from "@/composables/useTableLock";
import { useRouter, useRoute } from 'vue-router';
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher";


const groupMode = ref(false);
const isLoading = ref(false);
const message = useMessage();
const router = useRouter();
const route = useRoute();
const openOptions = ref([]);
const tableGroups = ref([]);
const currentTableGrouping = ref(null);
const currentGroup = ref([]);
const settingsStore = useSettingsStore();
const genericsStore = useGenericsStore();
const tillStore = useTillStore();
const tableStore = useTableStore();
const userStore = useUserStore();
const businessStore = useBusinessStore();

const isWaiterModeView = computed(() => userStore.user?.role === 'MOZO' || route.matched.some(r => r.name === 'WaiterMode'));

const selectedAreaId = ref(null);

const areaOptions = computed(() => {
    return tableStore.branch_table_Areas.map(a => ({
        label: a.description,
        value: a.id
    }));
});

const filteredAreas = computed(() => {
    if (!selectedAreaId.value) return tableStore.branch_table_Areas;
    return tableStore.branch_table_Areas.filter(a => a.id === selectedAreaId.value);
});

const { connectLockWebSocket, lockSocketConnected } = useTableLock();

/**
 * Verifica si una mesa está bloqueada usando el store (fuente de verdad global)
 */
const isTableBlocked = (table) => {
    // Primero verificar el estado del store (WebSocket global)
    const wsLockInfo = tableStore.lockedTables[table.id];

    if (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) {
        return {
            blocked: true,
            username: wsLockInfo.username,
            remaining: null
        };
    }

    // Si los sockets están activos y la mesa NO está en lockedTables, confiamos en el WebSocket en tiempo real
    if (tableStore.wsConnected || lockSocketConnected.value) {
        return { blocked: false };
    }

    // Luego verificar lock_info de la API (solo como fallback si los sockets están desconectados)
    if (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me) {
        return {
            blocked: true,
            username: table.lock_info.username,
            remaining: table.lock_info.remaining_minutes
        };
    }

    return { blocked: false };
};

/**
 * Obtiene el color de la mesa según su estado
 */
const getTableColor = (table) => {
    const blockStatus = isTableBlocked(table);
    if (blockStatus.blocked) {
        return '#ffc107'; // Amarillo - Bloqueada
    }
    if (table.status === '3') {
        return '#f44336'; // Rojo - Ocupada
    }
    return '#4caf50'; // Verde - Libre
};

/**
 * Obtiene la clase de fondo de la mesa
 */
const getTableBackgroundClass = (table) => {
    const blockStatus = isTableBlocked(table);
    if (blockStatus.blocked) {
        return 'bg-locked';
    }
    if (table.status === '3') {
        return 'bg-occuped';
    }
    return 'bg-free';
};

// Computed para forzar reactividad cuando cambian los locks
computed(() => tableStore.lockedTables);

/**
 * Maneja el click en una mesa
 * Valida el lock_info antes de navegar
 */
const handleTableClick = (table) => {
    if (groupMode.value) {
        // Modo de agrupación
        if (currentTableGrouping.value === table.id ||
            tableGroups.value.some((g) => g.some((t) => t.id === table.id))) {
            return;
        }

        if (!currentGroup.value.some((t) => t.id === table.id)) {
            addToGroup(table);
        } else {
            removeFromGroup(table);
        }
    } else {
        const blockStatus = isTableBlocked(table);

        console.log('🔍 handleTableClick - Mesa:', table.description, 'Bloqueada:', blockStatus.blocked);

        if (blockStatus.blocked) {
            console.log('❌ Mesa bloqueada por:', blockStatus.username);

            const remainingMsg = blockStatus.remaining
                ? `Disponible en ${blockStatus.remaining} minutos.`
                : '';

            message.warning(
                `Mesa bloqueada por ${blockStatus.username}. ${remainingMsg}`,
                { duration: 4000 }
            );
            return;
        }

        const isWaiterMode = route.matched.some(r => r.name === 'WaiterMode');
        const targetRouteName = (userStore.user?.role === 'MOZO' || genericsStore.device === 'mobile' || isWaiterMode) ? 'WOrder' : 'TableOrder';
        console.log(`✅ Permitiendo navegación a la mesa (${targetRouteName})`);
        router.push({
            name: targetRouteName,
            params: { table: table.id }
        });
    }
};

const dateNow = ref(null);

const loadTablesData = async () => {
    isLoading.value = true;
    await tableStore.refreshData().then(() => {
        isLoading.value = false;
    });
};

// Watch para forzar re-render cuando cambian los locks
watch(() => tableStore.lockedTables, () => {
    console.log('[TableHome] 🔄 lockedTables cambió:', tableStore.lockedTables);
}, { deep: true });

const performRetrieveTableOrder = async (table) => {
    await retrieveTableOrder(table).then((response) => {
        if (response.status === 200) {
            if (settingsStore.business_settings.printer.print_html) {
                previewData.value = response.data.order;
                showPreview.value = true;
                setTimeout(() => previewDrawer.value.generate(), 250);
            } else {
                VoucherPrint({
                    data: response.data.order,
                    businessStore,
                    prePayment: true,
                    auto: true,
                    show: false
                });
            }
        }
    }).catch((error) => {
        console.error(error);
    });
};

const showConfirm = ref({ show: false, saleId: null });
const passConfirm = ref("");
const deleteId = ref(null);

const nullifyTableOrder = (id) => {
    deleteId.value = id;
    showConfirm.value = { show: true, saleId: id, permission: "cancel_order", loadTablesData, performNullifyTableOrder };
};


const performNullifyTableOrder = async (id, dataAnulate) => {
    isLoading.value = true;
    await cancelTableOrder(id, dataAnulate).then((response) => {
        if (response.status === 202) {
            message.success("Pedido anulado correctamente!");
            showConfirm.value = { show: false, saleId: null };
            deleteId.value = null;
            passConfirm.value = "";
            loadTablesData();
        }
    }).catch((error) => {
        console.error(error);
        message.error("Error al anular pedido...");
        passConfirm.value = "";
        isLoading.value = false;
    });
};

const addToGroup = (table) => {
    currentGroup.value.push(cloneDeep(table));
};

const removeFromGroup = (table) => {
    let index = currentGroup.value.findIndex((t) => t?.id === table.id);
    currentGroup.value.splice(index, 1);
};

const refreshData = async () => {
    isLoading.value = true;
    await tableStore.refreshData();
    isLoading.value = false;
};

onMounted(() => {
    loadTablesData();

    const fetch = new Date();
    const dd = fetch.getDate();
    const mm = fetch.getMonth();
    const yy = fetch.getFullYear();
    const hh = fetch.getHours();
    const msms = fetch.getMinutes();

    dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;

    // Conectar WebSocket de mesas (table store)
    tableStore.connectWebSocket();

    // Conectar WebSocket de locks (composable global)
    connectLockWebSocket();
});

const changeTable = ref(false);

const fromTable = ref(null);

const currentArea = ref(null);

const toTable = ref(null);

const performChangeTable = async () => {
    isLoading.value = true;
    await changeOrderTable(fromTable.value, toTable.value).then((response) => {
        if (response.status === 200) {
            message.success("Mesa cambiada!");
            changeTable.value = false;
            fromTable.value = null;
            currentArea.value = null;
            toTable.value = null;
            loadTablesData();
        }
    }).catch((error) => {
        if (error.response.status === 400) {
            for (const value in error.response.data) {
                if (Array.isArray(error.response.data[`${value}`])) {
                    error.response.data[`${value}`].forEach((err) => {
                        if (typeof err === "object") {
                            for (const v in err) {
                                message.error(`${err[`${v}`]}`);
                            }
                        } else {
                            message.error(`${err}`);
                        }
                    });
                } else {
                    message.error(error.response.data[`${value}`]);
                }
            }
        } else {
            console.error(error);
        }
        isLoading.value = false;
    });
};

const previewDrawer = ref(null);

const showPreview = ref(false);

const previewData = ref(null);

</script>

<style lang="scss" scoped>
.bg-free {
    background-color: rgba(76, 175, 80, 0.1);
}

.bg-locked {
    background-color: rgba(255, 193, 7, 0.15);
}

.bg-occuped {
    background-color: rgb(255, 162, 162);
}

.fs-alt {
    font-size: clamp(1.3rem, 4.2vw, 2.6rem);
    font-weight: bold;
    line-height: 1.1;
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.85);
}

.table-bg-img {
    width: clamp(64px, 15vw, 128px);
    height: auto;
    max-height: 128px;
    opacity: 0.85;
}

.black-outline {
    -webkit-text-stroke: 0.75px black;
    color: Gainsboro;
    -webkit-font-smoothing: antialiased;
    font-weight: bold;
}
</style>
