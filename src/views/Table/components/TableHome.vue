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
                <n-grid responsive="screen" cols="2 xs:2 s:3 m:4 l:5 xl:6 2xl:7" :x-gap="12" :y-gap="12">
                    <n-gi v-for="table in area.tables.filter(dt => !dt?.is_disabled)" :key="table.id" span="1">
                        <n-card :id="`table-${table.id}`" class="overflow-hidden position-relative rounded-3 table-card"
                            :class="getTableBackgroundClass(table)" :style="{
                                borderTop: `5px solid ${getTableColor(table)}`,
                                minHeight: genericsStore.device === 'mobile' ? '135px' : '175px'
                            }" size="small" :content-style="genericsStore.device === 'mobile' ? 'padding: 6px;' : 'padding: 8px 10px;'" @click="handleTableClick(table)" style="cursor: pointer">
                            <div class="d-flex flex-column justify-content-between h-100">
                                <!-- Top Row: Nombre / Número de mesa + Estado + Opciones -->
                                <div class="d-flex align-items-center justify-content-between w-100">
                                    <div class="d-flex align-items-center gap-1 overflow-hidden me-1">
                                        <n-checkbox v-if="groupMode" :checked="currentGroup.some((t) => t.id === table.id)"
                                            :disabled="tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
                                                currentTableGrouping === table.id"
                                            size="small" class="me-1" />
                                        <span class="table-name-badge" :title="table.description">
                                            {{ table.description }}
                                        </span>
                                    </div>
                                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                        <span class="status-badge" :class="getStatusClass(table)">
                                            {{ getStatusText(table) }}
                                        </span>
                                        <n-button v-if="genericsStore.device !== 'mobile'" @click.stop="openOptions.push(table.id)"
                                            quaternary size="tiny" class="p-1">
                                            <v-icon name="bi-three-dots-vertical" scale="0.9" />
                                        </n-button>
                                    </div>
                                </div>

                                <!-- Center: Ícono de mesa -->
                                <div class="d-flex align-items-center justify-content-center position-relative flex-grow-1 my-1" style="min-height: 95px;">
                                    <v-icon v-if="groupMode === true && tableGroups.some((g) => g.some((t) => t.id === table.id))"
                                        class="position-absolute top-50 start-50 translate-middle fs-4" name="ri-forbid-line"
                                        scale="5" fill="#FA8072" style="z-index: 3;" />
                                    <img draggable="false" src="~@/assets/images/default-table.png" alt="" class="table-card-img" />
                                </div>

                                <!-- Bottom Row: Monto y/o Hora -->
                                <div class="table-card-footer mt-auto">
                                    <div v-if="table?.order_amount !== '' && table?.order_amount !== null && table?.order_amount !== undefined && settingsStore.business_settings?.order?.table_order_total"
                                        class="d-flex align-items-center justify-content-between table-order-pill">
                                        <span class="table-order-amount">
                                            S/. {{ (Number(table?.order_amount) || 0).toFixed(2) }}
                                        </span>
                                        <span v-if="table.modified && genericsStore.device !== 'mobile'" class="table-order-time" :title="`Último pedido: ${table.modified}`">
                                            <v-icon name="md-access-time-round" scale="0.75" class="me-1" />
                                            {{ table.modified }}
                                        </span>
                                    </div>
                                    <div v-else class="text-center table-free-hint">
                                        <span class="text-muted" style="font-size: 11px;">Disponible</span>
                                    </div>
                                </div>
                            </div>

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
                                    <n-button v-if="userStore.user.role === 'ADMINISTRADOR' && (tableStore.lockedTables[table.id] || (table.lock_info && table.lock_info.is_active))" class="mb-1" type="warning"
                                        size="small" block secondary @click="
                                            openOptions.splice(
                                                openOptions.findIndex((i) => i === table.id),
                                                1
                                            ),
                                            forceUnlockTable(table.id)
                                            ">
                                        Liberar bloqueo
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

const { connectLockWebSocket, lockSocketConnected, wsUnlockTable } = useTableLock();

const forceUnlockTable = (tableId) => {
    wsUnlockTable(tableId);
    message.success("Bloqueo de mesa liberado");
};

/**
 * Verifica si una mesa está bloqueada para impedir acceso a usuarios sin privilegios
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

    // Luego verificar lock_info de la API (respaldo de base de datos)
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
    const wsLockInfo = tableStore.lockedTables[table.id];
    const isLockedByOther = (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) ||
        (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me);

    if (isLockedByOther) {
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
    const wsLockInfo = tableStore.lockedTables[table.id];
    const isLockedByOther = (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) ||
        (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me);

    if (isLockedByOther) {
        return 'bg-locked';
    }
    if (table.status === '3') {
        return 'bg-occuped';
    }
    return 'bg-free';
};

/**
 * Obtiene la clase CSS para el badge de estado
 */
const getStatusClass = (table) => {
    const wsLockInfo = tableStore.lockedTables[table.id];
    const isLockedByOther = (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) ||
        (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me);

    if (isLockedByOther) return 'status-locked';
    if (table.status === '3') return 'status-occupied';
    return 'status-free';
};

/**
 * Obtiene el texto amigable para el badge de estado
 */
const getStatusText = (table) => {
    const wsLockInfo = tableStore.lockedTables[table.id];
    const isLockedByOther = (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) ||
        (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me);

    if (isLockedByOther) return 'Bloqueada';
    if (table.status === '3') return 'Ocupada';
    return 'Libre';
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
.table-card {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    cursor: pointer;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
}

.bg-free {
    background: linear-gradient(180deg, #f7fbf8 0%, #ffffff 100%) !important;
}

.bg-locked {
    background: linear-gradient(180deg, #fffdf5 0%, #ffffff 100%) !important;
}

.bg-occuped {
    background: linear-gradient(180deg, #fff9f9 0%, #ffffff 100%) !important;
}

.status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    letter-spacing: 0.3px;
    display: inline-flex;
    align-items: center;

    &.status-free {
        background-color: #e8f7ee;
        color: #166534;
    }

    &.status-occupied {
        background-color: #fee2e2;
        color: #991b1b;
    }

    &.status-locked {
        background-color: #fef3c7;
        color: #92400e;
    }
}

.table-name-badge {
    font-weight: 700;
    color: #1f2937;
    font-size: 1.05rem;
    max-width: 105px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
}

.table-card-img {
    max-height: 92px;
    max-width: 92px;
    width: auto;
    height: auto;
    object-fit: contain;
    opacity: 0.88;
    transition: opacity 0.2s ease, transform 0.2s ease;

    @media (max-width: 640px) {
        max-height: 72px;
        max-width: 72px;
    }
}

.table-card:hover .table-card-img {
    opacity: 1;
    transform: scale(1.05);
}

.table-order-pill {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 3px 8px;
}

.table-order-amount {
    font-size: 0.95rem;
    font-weight: 800;
    color: #b91c1c;
}

.table-order-time {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    display: flex;
    align-items: center;
}

.table-free-hint {
    padding: 3px 0;
    font-size: 11px;
    color: #9ca3af;
    font-weight: 500;
}
</style>
