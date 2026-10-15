<template>
    <div class="table-home-view-wrapper">
        <!-- BARRA SUPERIOR ELEGANTE Y ALINEADA 1:1 CON LAS TARJETAS -->
        <header class="table-home-header-card">
            <div class="table-home-header-bar">
                <!-- Título y Filtros por Áreas -->
                <div class="header-left-col">
                    <div class="header-title-badge">
                        <button 
                            v-if="genericsStore.device === 'mobile' && userStore.user?.role !== 'MOZO'"
                            type="button" 
                            class="mobile-menu-trigger-btn"
                            @click="openMobileMenu"
                            title="Abrir menú de módulos"
                        >
                            <v-icon name="md-menu-round" scale="1.2" />
                        </button>
                        <div class="header-title-icon-box">
                            <v-icon name="gi-table" scale="1.35" />
                        </div>
                        <span class="header-title-text">Mesas</span>
                    </div>

                    <!-- Barra de Pastillas / Filtros por Áreas -->
                    <div class="area-filters-container">
                        <button 
                            type="button" 
                            class="area-filter-btn"
                            :class="{ active: selectedAreaId === null }"
                            @click="selectedAreaId = null"
                        >
                            <span>Todas</span>
                            <span class="filter-count-badge">{{ totalTablesCount }}</span>
                            <span v-if="totalOccupiedCount > 0" class="filter-occupied-pill" title="Total mesas ocupadas">
                                {{ totalOccupiedCount }}
                            </span>
                        </button>

                        <button 
                            v-for="area in tableStore.branch_table_Areas" 
                            :key="'filter-area-' + area.id"
                            type="button" 
                            class="area-filter-btn"
                            :class="{ active: selectedAreaId === area.id }"
                            @click="selectedAreaId = area.id"
                        >
                            <span>{{ area.description }}</span>
                            <span class="filter-count-badge">{{ getAreaTableCount(area) }}</span>
                            <span v-if="getAreaOccupiedCount(area) > 0" class="filter-occupied-pill" :title="`${getAreaOccupiedCount(area)} ocupada(s)`">
                                {{ getAreaOccupiedCount(area) }}
                            </span>
                        </button>
                    </div>

                    <!-- Filtro por Estado: Todas, Libres, Ocupadas -->
                    <div class="status-filters-container">
                        <span class="filter-divider"></span>
                        <button 
                            type="button" 
                            class="status-filter-btn"
                            :class="{ active: selectedStatus === 'all' }"
                            @click="selectedStatus = 'all'"
                        >
                            <span>Todas</span>
                        </button>
                        <button 
                            type="button" 
                            class="status-filter-btn btn-state-free"
                            :class="{ active: selectedStatus === 'free' }"
                            @click="selectedStatus = 'free'"
                        >
                            <span class="status-dot dot-free"></span>
                            <span>Libres</span>
                            <span class="status-chip-count">{{ totalFreeCount }}</span>
                        </button>
                        <button 
                            type="button" 
                            class="status-filter-btn btn-state-occupied"
                            :class="{ active: selectedStatus === 'occupied' }"
                            @click="selectedStatus = 'occupied'"
                        >
                            <span class="status-dot dot-occupied"></span>
                            <span>Ocupadas</span>
                            <span class="status-chip-count">{{ totalOccupiedCount }}</span>
                        </button>
                        <button 
                            v-if="totalLockedCount > 0"
                            type="button" 
                            class="status-filter-btn btn-state-locked"
                            :class="{ active: selectedStatus === 'locked' }"
                            @click="selectedStatus = 'locked'"
                        >
                            <span class="status-dot dot-locked"></span>
                            <span>Bloqueadas</span>
                            <span class="status-chip-count">{{ totalLockedCount }}</span>
                        </button>
                    </div>
                </div>
                
                <!-- Acciones Rápidas (Alineadas a la derecha) -->
                <div class="quick-actions-bar" v-if="tillStore.currentTillID">
                    <!-- Estado WebSocket y Recargar -->
                    <div class="status-connection-pill">
                        <n-tooltip>
                            <template #trigger>
                                <div class="ws-indicator-wrap">
                                    <span class="ws-dot" :class="tableStore.wsConnected ? 'connected' : 'disconnected'"></span>
                                </div>
                            </template>
                            {{ tableStore.wsConnected ? 'WebSocket conectado' : 'WebSocket desconectado' }}
                        </n-tooltip>
                        <button type="button" class="btn-quick-refresh" @click="refreshData" title="Recargar estado de mesas">
                            <v-icon name="hi-solid-refresh" scale="0.9" />
                            <span v-if="genericsStore.device !== 'mobile'">Recargar</span>
                        </button>
                    </div>

                    <!-- Botones Delivery y Para Llevar Rediseñados -->
                    <div class="pos-actions-cluster">
                        <template v-if="settingsStore.business_settings?.order?.divide_delivery_takeaway">
                            <button 
                                v-if="userStore.hasPermission('take_away_order') && userStore.user.role !== 'MOZO'" 
                                type="button" 
                                class="flizzy-pos-btn btn-delivery"
                                @click="$router.push({ name: 'TakeOrder', query: { delivery: true } })"
                            >
                                <div class="pos-btn-icon icon-delivery">
                                    <v-icon name="md-deliverydining" scale="1.15" />
                                </div>
                                <span class="pos-btn-text">Delivery</span>
                            </button>

                            <button 
                                v-if="userStore.hasPermission('take_away_order') && userStore.user.role !== 'MOZO'" 
                                type="button" 
                                class="flizzy-pos-btn btn-takeaway"
                                @click="$router.push({ name: 'TakeOrder', query: { delivery: false } })"
                            >
                                <div class="pos-btn-icon icon-takeaway">
                                    <v-icon name="ri-shopping-bag-2-fill" scale="1.0" />
                                </div>
                                <span class="pos-btn-text">
                                    {{ settingsStore.business_settings.order?.fast_sale_format ? "Venta Rápida" : "Para llevar" }}
                                </span>
                            </button>
                        </template>
                        <template v-else>
                            <button 
                                v-if="userStore.hasPermission('take_away_order') && userStore.user.role !== 'MOZO'" 
                                type="button" 
                                class="flizzy-pos-btn btn-combined"
                                @click="$router.push({ name: 'TakeOrder' })"
                            >
                                <div class="pos-btn-icon icon-delivery">
                                    <v-icon name="md-deliverydining" scale="1.1" />
                                </div>
                                <span class="pos-btn-text">
                                    {{ settingsStore.business_settings.order?.fast_sale_format ? "Venta Rápida" : "Para llevar" }} / Delivery
                                </span>
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </header>

        <n-spin v-if="tillStore.currentTillID" :show="isLoading">
            <div class="area-section-card" v-for="area in filteredAreas" :key="area.id">
                <div class="area-section-header">
                    <div class="area-title-wrap">
                        <span class="area-dot-accent"></span>
                        <h2 class="area-title-text">{{ area.description }}</h2>
                    </div>
                    <div class="area-stats-badge">
                        <span class="stat-pill-free">
                            {{ getAreaFreeCount(area) }} libre{{ getAreaFreeCount(area) === 1 ? '' : 's' }}
                        </span>
                        <span class="stat-pill-occupied" :class="{ 'is-zero': getAreaOccupiedCount(area) === 0 }">
                            {{ getAreaOccupiedCount(area) }} ocupada{{ getAreaOccupiedCount(area) === 1 ? '' : 's' }}
                        </span>
                        <span v-if="getAreaLockedCount(area) > 0" class="stat-pill-locked">
                            {{ getAreaLockedCount(area) }} bloqueada{{ getAreaLockedCount(area) === 1 ? '' : 's' }}
                        </span>
                    </div>
                </div>
                <n-grid responsive="screen" cols="2 xs:2 s:3 m:4 l:6 xl:8 2xl:8" :x-gap="12" :y-gap="12">
                    <n-gi v-for="table in getFilteredTables(area)" :key="table.id" span="1">
                        <n-card :id="`table-${table.id}`" class="overflow-hidden position-relative rounded-3 table-card h-100"
                            :style="{
                                borderTop: `5px solid ${getTableColor(table)}`,
                                background: getTableBackgroundStyle(table),
                                minHeight: genericsStore.device === 'mobile' ? '135px' : '175px'
                            }" size="small" :content-style="genericsStore.device === 'mobile' ? 'padding: 6px;' : 'padding: 8px 8px; height: 100%; display: flex; flex-direction: column;'" @click="handleTableClick(table)" style="cursor: pointer">
                            <div class="d-flex flex-column justify-content-between h-100">
                                <!-- Top Row: Nombre / Número de mesa + Estado + Opciones -->
                                <div class="d-flex align-items-center justify-content-between w-100">
                                    <div class="d-flex align-items-center gap-1 overflow-hidden me-1">
                                        <n-checkbox v-if="groupMode" :checked="currentGroup.some((t) => t.id === table.id)"
                                            :disabled="tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
                                                currentTableGrouping === table.id"
                                            size="small" class="me-1" />
                                        <span v-if="tableLabelPosition === 'top_left'" class="table-name-badge" :style="{ fontSize: `${tableLabelSize}px` }" :title="table.description">
                                            {{ table.description }}
                                        </span>
                                    </div>
                                    <div v-if="tableLabelPosition === 'top_center'" class="text-center flex-grow-1 overflow-hidden mx-1">
                                        <span class="table-name-badge text-center" :style="{ fontSize: `${tableLabelSize}px` }" :title="table.description">
                                            {{ table.description }}
                                        </span>
                                    </div>
                                    <div class="d-flex align-items-center gap-1 flex-shrink-0" :class="{ 'ms-auto': tableLabelPosition === 'center' || tableLabelPosition === 'bottom_center' || !tableLabelPosition }">
                                        <span class="status-badge" :class="getStatusClass(table)" :style="getStatusBadgeStyle(table)">
                                            {{ getStatusText(table) }}
                                        </span>
                                        <n-button v-if="genericsStore.device !== 'mobile'" @click.stop="openOptions.push(table.id)"
                                            quaternary size="tiny" class="p-0">
                                            <v-icon name="bi-three-dots-vertical" scale="0.85" />
                                        </n-button>
                                    </div>
                                </div>

                                <!-- Center: Ícono de mesa -->
                                <div class="d-flex align-items-center justify-content-center position-relative flex-grow-1 my-1" style="min-height: 100px;">
                                    <v-icon v-if="groupMode === true && tableGroups.some((g) => g.some((t) => t.id === table.id))"
                                        class="position-absolute top-50 start-50 translate-middle fs-4" name="ri-forbid-line"
                                        scale="5" fill="#FA8072" style="z-index: 3;" />
                                    <img draggable="false" src="~@/assets/images/default-table.png" alt="" class="table-card-img" />
                                    <!-- Posición Centro de la Mesa (Predeterminado) -->
                                    <span v-if="tableLabelPosition === 'center' || !tableLabelPosition" class="table-name-badge table-name-center" :style="{ fontSize: `${tableLabelSize}px` }" :title="table.description">
                                        {{ table.description }}
                                    </span>
                                </div>

                                <!-- Posición Abajo al Centro -->
                                <div v-if="tableLabelPosition === 'bottom_center'" class="text-center my-1 overflow-hidden">
                                    <span class="table-name-badge text-center" :style="{ fontSize: `${tableLabelSize}px` }" :title="table.description">
                                        {{ table.description }}
                                    </span>
                                </div>

                                <!-- Bottom Row: Monto y/o Hora -->
                                <div class="table-card-footer mt-auto">
                                    <div v-if="table?.order_amount !== '' && table?.order_amount !== null && table?.order_amount !== undefined && settingsStore.business_settings?.order?.table_order_total"
                                        class="d-flex align-items-center justify-content-between table-order-pill"
                                        :title="table.modified ? `Último pedido: ${table.modified}` : ''">
                                        <span class="table-order-amount">
                                            S/. {{ (Number(table?.order_amount) || 0).toFixed(2) }}
                                        </span>
                                        <span v-if="table.modified && genericsStore.device !== 'mobile'" class="table-order-time">
                                            <v-icon name="md-access-time-round" scale="0.75" class="me-1 flex-shrink-0" />
                                            {{ formatTableTime(table.modified) }}
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
            </div>
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
    </div>
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

const tableLabelPosition = computed(() => {
    return settingsStore.business_settings?.order?.table_label_position || 'center';
});

const tableLabelSize = computed(() => {
    const size = Number(settingsStore.business_settings?.order?.table_label_size);
    return size && size >= 10 && size <= 48 ? size : 15;
});

const selectedAreaId = ref(null);
const selectedStatus = ref('all'); // 'all' | 'free' | 'occupied' | 'locked'

const areaOptions = computed(() => {
    return tableStore.branch_table_Areas.map(a => ({
        label: a.description,
        value: a.id
    }));
});

const isTableLocked = (table) => {
    const wsLockInfo = tableStore.lockedTables[table.id];
    return Boolean((wsLockInfo && wsLockInfo.user_id !== userStore.user.id) ||
        (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me));
};

const isTableOccupied = (table) => {
    return !isTableLocked(table) && String(table?.status) === '3';
};

const isTableFree = (table) => {
    return !isTableLocked(table) && String(table?.status) !== '3';
};

const getAreaTableCount = (area) => {
    return (area.tables || []).filter(t => !t?.is_disabled).length;
};

const getAreaFreeCount = (area) => {
    return (area.tables || []).filter(t => !t?.is_disabled && isTableFree(t)).length;
};

const getAreaOccupiedCount = (area) => {
    return (area.tables || []).filter(t => !t?.is_disabled && isTableOccupied(t)).length;
};

const getAreaLockedCount = (area) => {
    return (area.tables || []).filter(t => !t?.is_disabled && isTableLocked(t)).length;
};

const totalTablesCount = computed(() => {
    return (tableStore.branch_table_Areas || []).reduce((acc, a) => acc + getAreaTableCount(a), 0);
});

const totalFreeCount = computed(() => {
    return (tableStore.branch_table_Areas || []).reduce((acc, a) => acc + getAreaFreeCount(a), 0);
});

const totalOccupiedCount = computed(() => {
    return (tableStore.branch_table_Areas || []).reduce((acc, a) => acc + getAreaOccupiedCount(a), 0);
});

const totalLockedCount = computed(() => {
    return (tableStore.branch_table_Areas || []).reduce((acc, a) => acc + getAreaLockedCount(a), 0);
});

const getFilteredTables = (area) => {
    const tables = (area.tables || []).filter(dt => !dt?.is_disabled);
    if (selectedStatus.value === 'free') {
        return tables.filter(t => isTableFree(t));
    }
    if (selectedStatus.value === 'occupied') {
        return tables.filter(t => isTableOccupied(t));
    }
    if (selectedStatus.value === 'locked') {
        return tables.filter(t => isTableLocked(t));
    }
    return tables;
};

const filteredAreas = computed(() => {
    const areas = tableStore.branch_table_Areas || [];
    let list = selectedAreaId.value 
        ? areas.filter(a => a.id === selectedAreaId.value)
        : areas;

    if (selectedStatus.value !== 'all') {
        list = list.filter(a => getFilteredTables(a).length > 0);
    }
    return list;
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

const tableColors = computed(() => {
    const order = settingsStore.business_settings?.order || {};
    const intensityVal = order.table_gradient_intensity;
    return {
        free: order.table_color_free || '#4caf50',
        occupied: order.table_color_occupied || '#f44336',
        locked: order.table_color_locked || '#ffc107',
        intensity: (intensityVal !== undefined && intensityVal !== null && intensityVal !== '') ? Number(intensityVal) : 5
    };
});

const hexToRgba = (hex, alphaPercent = 5) => {
    if (!hex) return 'rgba(255, 255, 255, 1)';
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(x => x + x).join('');
    }
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    const a = Math.max(0.01, Math.min(0.9, (alphaPercent ?? 5) / 100));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * Obtiene el color de la mesa según su estado
 */
const getTableColor = (table) => {
    const wsLockInfo = tableStore.lockedTables[table.id];
    const isLockedByOther = (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) ||
        (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me);

    if (isLockedByOther) {
        return tableColors.value.locked;
    }
    if (table.status === '3') {
        return tableColors.value.occupied;
    }
    return tableColors.value.free;
};

/**
 * Genera el fondo dinámico degradado para la tarjeta de la mesa
 */
const getTableBackgroundStyle = (table) => {
    const color = getTableColor(table);
    const rgba = hexToRgba(color, tableColors.value.intensity);
    return `linear-gradient(180deg, ${rgba} 0%, #ffffff 100%)`;
};

/**
 * Genera el estilo del badge de estado según el color dinámico
 */
const getStatusBadgeStyle = (table) => {
    const color = getTableColor(table);
    const bg = hexToRgba(color, 18);
    return {
        backgroundColor: bg,
        color: color
    };
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
 * Extrae solo la hora del timestamp para mantener la tarjeta compacta y alineada
 */
const formatTableTime = (datetime) => {
    if (!datetime) return '';
    const str = String(datetime).trim();
    const parts = str.split(' ');
    return parts.length > 1 ? parts[1] : str;
};

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
        const targetRouteName = (userStore.user?.role === 'MOZO' || isWaiterMode) ? 'WOrder' : 'TableOrder';
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

const openMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-module-menu'));
};

onMounted(() => {
    if (route.name === 'WHome' && userStore.user?.role && userStore.user.role !== 'MOZO' && !route.query.waiter_mode) {
        router.replace({ name: 'TableHome' });
        return;
    }

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
.table-home-view-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

/* 1. BARRA SUPERIOR: EXACTAMENTE MISMO ANCHO, BORDES Y RADIOS QUE LAS ÁREAS */
.table-home-header-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 10px 14px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    box-sizing: border-box;
    width: 100%;
}

.table-home-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
    flex-wrap: wrap;
}

.header-left-col {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
}

/* Ícono de Mesas agrandado y perfectamente centrado */
.header-title-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.mobile-menu-trigger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    padding: 0;

    &:active {
        background: #059669;
        color: #ffffff;
        transform: scale(0.95);
        border-color: #059669;
    }
}

.header-title-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    color: #059669;
    border: 1.5px solid #a7f3d0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(5, 150, 105, 0.12);
}

.header-title-text {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1;
}

/* Barra de Filtros por Áreas */
.area-filters-container {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    max-width: 100%;
    padding: 2px 0;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}

.area-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: nowrap;

    &:hover {
        background: #f8fafc;
        color: #1e293b;
        border-color: #cbd5e1;
    }

    &.active {
        background: #0284c7;
        color: #ffffff;
        border-color: #0284c7;
        box-shadow: 0 2px 8px rgba(2, 132, 199, 0.28);

        .filter-count-badge {
            background: rgba(255, 255, 255, 0.25);
            color: #ffffff;
        }
    }
}

.filter-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10.5px;
    font-weight: 700;
    background: #f1f5f9;
    color: #64748b;
}

.filter-occupied-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    line-height: 1;
}

.area-filter-btn.active .filter-occupied-pill {
    background: #ffffff;
    color: #dc2626;
    border-color: #ffffff;
}

/* Divisor sutil y Filtros de Estado */
.filter-divider {
    width: 1px;
    height: 18px;
    background: #cbd5e1;
    margin: 0 4px;
    display: inline-block;
    flex-shrink: 0;
}

.status-filters-container {
    display: flex;
    align-items: center;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}

.status-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: nowrap;

    &:hover {
        background: #f1f5f9;
        color: #1e293b;
        border-color: #cbd5e1;
    }

    &.active {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;

        .status-chip-count {
            background: rgba(255, 255, 255, 0.25);
            color: #ffffff;
        }
    }

    &.btn-state-free.active {
        background: #059669;
        border-color: #059669;
        color: #ffffff;
    }

    &.btn-state-occupied.active {
        background: #dc2626;
        border-color: #dc2626;
        color: #ffffff;
    }

    &.btn-state-locked.active {
        background: #d97706;
        border-color: #d97706;
        color: #ffffff;
    }
}

.status-dot {
    width: 6.5px;
    height: 6.5px;
    border-radius: 50%;
    display: inline-block;

    &.dot-free {
        background: #10b981;
    }
    &.dot-occupied {
        background: #ef4444;
    }
    &.dot-locked {
        background: #f59e0b;
    }
}

.status-chip-count {
    font-size: 10px;
    font-weight: 700;
    padding: 0 4px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
    line-height: 1.3;
}

/* 2. ACCIONES RÁPIDAS (RECARGAR, WS, DELIVERY, PARA LLEVAR) */
.quick-actions-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
}

.status-connection-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 3px 8px;
    border-radius: 9px;
    height: 36px;
    box-sizing: border-box;
}

.ws-indicator-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.ws-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;

    &.connected {
        background: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
    }

    &.disconnected {
        background: #ef4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
    }
}

.btn-quick-refresh {
    border: none;
    background: transparent;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        color: #0284c7;
        background: #f1f5f9;
    }
}

.pos-actions-cluster {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* BOTONES REDISEÑADOS PARA DELIVERY Y PARA LLEVAR */
.flizzy-pos-btn {
    height: 36px;
    padding: 0 13px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    outline: none;
    box-sizing: border-box;

    &:active {
        transform: scale(0.97);
    }
}

.pos-btn-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* Delivery: Estilo Esmeralda / Teal gastronómico fresco */
.btn-delivery {
    background: #f0fdfa;
    border: 1.5px solid #99f6e4;
    color: #0f766e;
    box-shadow: 0 1px 3px rgba(15, 118, 110, 0.06);

    .icon-delivery {
        background: #ccfbf1;
        color: #0d9488;
    }

    &:hover {
        background: #ccfbf1;
        border-color: #5eead4;
        color: #115e59;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(13, 148, 136, 0.16);
    }
}

/* Para Llevar: Estilo Azul Cobalto elegante */
.btn-takeaway {
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    color: #1d4ed8;
    box-shadow: 0 1px 3px rgba(29, 78, 216, 0.06);

    .icon-takeaway {
        background: #dbeafe;
        color: #2563eb;
    }

    &:hover {
        background: #dbeafe;
        border-color: #93c5fd;
        color: #1e40af;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.16);
    }
}

/* Combinado */
.btn-combined {
    background: #f0fdf4;
    border: 1.5px solid #bbf7d0;
    color: #15803d;
    box-shadow: 0 1px 3px rgba(21, 128, 61, 0.06);

    &:hover {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.16);
    }
}

/* Áreas contenedoras con padding optimizado para aprovechar pantalla */
.area-section-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px 14px;
    margin-bottom: 12px;
    box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.04);
    box-sizing: border-box;
    width: 100%;
}

.area-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
}

.area-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.area-dot-accent {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.area-title-text {
    font-size: 13.5px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0;
}

.area-stats-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11.5px;
    font-weight: 600;
}

.stat-pill-free {
    color: #166534;
    background: #ecfdf5;
    padding: 2px 9px;
    border-radius: 6px;
    border: 1px solid #bbf7d0;
}

.stat-pill-occupied {
    color: #991b1b;
    background: #fef2f2;
    padding: 2px 9px;
    border-radius: 6px;
    border: 1px solid #fecaca;

    &.is-zero {
        color: #64748b;
        background: #f8fafc;
        border-color: #e2e8f0;
    }
}

.stat-pill-locked {
    color: #92400e;
    background: #fef3c7;
    padding: 2px 9px;
    border-radius: 6px;
    border: 1px solid #fde68a;
}

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
    font-size: 0.95rem;
    max-width: 85px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;

    &.table-name-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: 800;
        color: #1f2937;
        text-align: center;
        max-width: 88px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        pointer-events: none;
        background: transparent;
        white-space: normal;
        word-break: break-word;
    }
}

.table-card-img {
    max-height: 102px;
    max-width: 102px;
    width: auto;
    height: auto;
    object-fit: contain;
    opacity: 0.88;
    transition: opacity 0.2s ease, transform 0.2s ease;

    @media (max-width: 640px) {
        max-height: 76px;
        max-width: 76px;
    }
}

.table-card:hover .table-card-img {
    opacity: 1;
    transform: scale(1.05);
}

.table-card-footer {
    min-height: 28px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.table-order-pill {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 3px 6px;
    gap: 4px;
    min-height: 28px;
    box-sizing: border-box;
}

.table-order-amount {
    font-size: 0.88rem;
    font-weight: 800;
    color: #b91c1c;
    white-space: nowrap;
    line-height: 1;
}

.table-order-time {
    font-size: 10.5px;
    color: #6b7280;
    font-weight: 500;
    display: flex;
    align-items: center;
    white-space: nowrap;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.table-free-hint {
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #9ca3af;
    font-weight: 500;
    box-sizing: border-box;
}

/* ==================================================== */
/* OPTIMIZACIÓN RESPONSIVA MÓVIL (<= 768px y <= 480px)  */
/* Mantiene el diseño intacto y lo adapta a pantallas móviles */
/* ==================================================== */
@media (max-width: 768px) {
    .table-home-header-card {
        padding: 9px 10px;
        margin-bottom: 8px;
        border-radius: 12px;
    }

    .table-home-header-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .header-left-col {
        flex-direction: column;
        align-items: stretch;
        gap: 7px;
        width: 100%;
    }

    .header-title-badge {
        gap: 8px;
    }

    .header-title-icon-box {
        width: 32px;
        height: 32px;
        border-radius: 8px;
    }

    .header-title-text {
        font-size: 15px;
    }

    .area-filters-container {
        width: 100%;
        gap: 5px;
        padding-bottom: 2px;
        -webkit-overflow-scrolling: touch;
    }

    .area-filter-btn {
        padding: 4px 10px;
        font-size: 11px;
        gap: 4px;
    }

    .filter-count-badge {
        font-size: 9.5px;
        padding: 1px 5px;
    }

    .filter-occupied-pill {
        font-size: 9px;
        padding: 1px 4px;
    }

    .filter-divider {
        display: none;
    }

    .status-filters-container {
        width: 100%;
        gap: 4px;
        padding-bottom: 2px;
        -webkit-overflow-scrolling: touch;
    }

    .status-filter-btn {
        padding: 3px 8px;
        font-size: 11px;
        gap: 4px;
    }

    .status-chip-count {
        font-size: 9px;
        padding: 0 3px;
    }

    .quick-actions-bar {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: space-between;
    }

    .status-connection-pill {
        height: 34px;
        padding: 2px 7px;
        border-radius: 8px;
        flex-shrink: 0;
    }

    .pos-actions-cluster {
        flex: 1;
        display: flex;
        gap: 6px;
        min-width: 0;
    }

    .flizzy-pos-btn {
        flex: 1;
        height: 34px;
        padding: 0 8px;
        font-size: 11.5px;
        justify-content: center;
        border-radius: 8px;
        gap: 5px;
    }

    .pos-btn-icon {
        width: 20px;
        height: 20px;
    }

    .area-section-card {
        padding: 9px 10px;
        margin-bottom: 8px;
        border-radius: 12px;
    }

    .area-section-header {
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
        padding-bottom: 6px;
    }

    .area-title-text {
        font-size: 12.5px;
    }

    .area-stats-badge {
        font-size: 10.5px;
        gap: 5px;
    }

    .stat-pill-free,
    .stat-pill-occupied,
    .stat-pill-locked {
        padding: 1px 6px;
        border-radius: 5px;
    }
}

@media (max-width: 480px) {
    .table-home-header-card {
        padding: 8px;
    }

    .area-section-card {
        padding: 8px;
    }

    .flizzy-pos-btn {
        font-size: 11px;
        padding: 0 6px;
    }

    .table-card {
        border-radius: 10px !important;
    }
}
</style>
