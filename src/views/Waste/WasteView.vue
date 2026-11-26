<template>
    <!-- Vista "Mermas" (FLZ-REP-03/04), embebida en el módulo "Anulaciones y mermas". -->
    <div class="waste-content">
        <div class="panel">
            <!-- Sin permiso (view_waste_report) -->
            <div v-if="state === 'forbidden'" class="state">
                <b>Sin permiso</b>Tu rol no tiene acceso al reporte de mermas (<code>view_waste_report</code>).
                Pídeselo al administrador.
            </div>

            <template v-else>
                <!-- Conmutador Lista | Resumen -->
                <div class="mode-toggle">
                    <button :class="{ on: mode === 'list' }" @click="openList">Lista</button>
                    <button :class="{ on: mode === 'summary' }" @click="openSummary">Resumen por {{ groupLabel.toLowerCase() }}</button>
                </div>

                <div class="toolbar">
                    <button class="link" @click="showFilters = !showFilters">
                        {{ showFilters ? '▾ Ocultar filtros' : '▸ Mostrar filtros' }}
                    </button>
                    <div class="toolbar-actions">
                        <n-popover v-if="canRegister" v-model:show="showViaMenu" trigger="click"
                            placement="bottom-end" :show-arrow="false" raw>
                            <template #trigger>
                                <button class="btn primary" type="button">Registrar merma ▾</button>
                            </template>
                            <div class="via-menu" role="menu">
                                <button v-for="option in REGISTER_VIAS" :key="option.key" type="button"
                                    class="via-menu__item" role="menuitem" @click="onSelectVia(option.key)">
                                    <span class="via-menu__badge">{{ option.key }}</span>
                                    <span class="via-menu__text">
                                        <span class="via-menu__title">{{ option.title }}</span>
                                        <span class="via-menu__sub">{{ option.sub }}</span>
                                    </span>
                                </button>
                            </div>
                        </n-popover>
                        <button v-if="canManageReasons" class="btn ghost" @click="showReasons = true">Motivos</button>
                        <button class="btn ghost" :disabled="exporting" @click="exportReport('excel')">Exportar Excel</button>
                        <button class="btn ghost" :disabled="exporting" @click="exportReport('pdf')">Exportar PDF</button>
                        <button class="btn ghost" @click="reload">Recargar</button>
                    </div>
                </div>

                <div v-show="showFilters" class="filters">
                    <div><label>Desde</label>
                        <n-date-picker v-model:formatted-value="filters.start_date" type="date" value-format="yyyy-MM-dd"
                            format="dd/MM/yyyy" size="small" @update:formatted-value="applyFilters" />
                    </div>
                    <div><label>Hasta</label>
                        <n-date-picker v-model:formatted-value="filters.end_date" type="date" value-format="yyyy-MM-dd"
                            format="dd/MM/yyyy" size="small" @update:formatted-value="applyFilters" />
                    </div>
                    <div><label>Caja / turno</label>
                        <n-select v-model:value="filters.till" :options="tillOptions" size="small" @update:value="applyFilters" />
                    </div>
                    <div><label>Tipo</label>
                        <n-select v-model:value="filters.item_type" :options="typeOptions" size="small" @update:value="applyFilters" />
                    </div>
                    <div><label>Vía</label>
                        <n-select v-model:value="filters.via" :options="viaOptions" size="small" @update:value="applyFilters" />
                    </div>
                    <div><label>Motivo</label>
                        <n-select v-model:value="filters.reason" :options="reasonOptions" size="small" @update:value="applyFilters" />
                    </div>
                    <div><label>Producto</label>
                        <n-input v-model:value="filters.search" placeholder="Buscar producto…" size="small" clearable
                            @keyup.enter="applyFilters" @clear="applyFilters" @blur="applyFilters" />
                    </div>
                    <div><label>Solicitó</label>
                        <n-select v-model:value="filters.requested_by" :options="userOptions('requested_by')" size="small"
                            @update:value="applyFilters" />
                    </div>
                    <div><label>Autorizó</label>
                        <n-select v-model:value="filters.authorized_by" :options="userOptions('authorized_by')" size="small"
                            @update:value="applyFilters" />
                    </div>
                </div>

                <!-- Error con reintento -->
                <div v-if="state === 'error'" class="state">
                    <b>Error al cargar</b>No se pudo obtener el reporte.
                    <button class="link" @click="reload">Reintentar</button>
                </div>

                <!-- LISTA -->
                <section v-if="mode === 'list'">
                    <div class="kpis">
                        <div class="kpi alert">
                            <div class="l">Merma valorizada (costo)</div>
                            <div class="v">{{ money(summary.total_cost) }}</div>
                            <div class="s">{{ variationText(summary) }}</div>
                        </div>
                        <div class="kpi">
                            <div class="l">Registros</div>
                            <div class="v">{{ summary.records ?? 0 }}</div>
                            <div class="s">{{ summary.units ?? 0 }} unidades</div>
                        </div>
                        <div class="kpi">
                            <div class="l">Valor de venta perdido</div>
                            <div class="v">{{ money(summary.lost_sale) }}</div>
                            <div class="s">Referencial (precio de carta)</div>
                        </div>
                        <div class="kpi">
                            <div class="l">Motivo principal</div>
                            <div class="v" style="font-size: 16px">{{ summary.top_reason?.description || '—' }}</div>
                            <div class="s">
                                <template v-if="summary.top_reason">
                                    {{ summary.top_reason.records }} registros · {{ money(summary.top_reason.total_cost) }}
                                </template>
                            </div>
                        </div>
                        <div class="kpi">
                            <div class="l">Sin costo cargado</div>
                            <div class="v warn">{{ summary.no_cost ?? 0 }}</div>
                            <div class="s">Productos con costo S/ 0.00</div>
                        </div>
                    </div>

                    <!-- Cargando: esqueleto de tabla -->
                    <div v-if="state === 'loading'" class="tablewrap skeleton">
                        <n-skeleton v-for="n in 6" :key="n" text height="28px" style="margin: 6px 0" />
                    </div>
                    <div v-else-if="!records.length" class="state">
                        <b>Sin mermas en el periodo</b>No hay mermas entre las fechas elegidas. Cambia el rango o los filtros.
                    </div>
                    <template v-else>
                        <div class="tablewrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th><th>Fecha</th><th>Producto / combo / menú</th><th>Cant.</th>
                                        <th class="r">Costo unit.</th><th class="r">Costo total</th>
                                        <th>Motivo</th><th>Origen</th><th>Vía</th><th>Solicitó</th><th>Autorizó</th><th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in records" :key="row.id">
                                        <td>{{ row.id }}</td>
                                        <td>{{ formatDate(row.created) }}</td>
                                        <td class="l">{{ row.item_name }}<span class="tag">{{ ITEM_TYPE_LABELS[row.item_type] }}</span></td>
                                        <td>{{ quantityText(row) }}</td>
                                        <td class="r">
                                            <span v-if="row.no_cost" class="warn">Sin costo</span>
                                            <template v-else>{{ money(row.unit_cost) }}</template>
                                        </td>
                                        <td class="r"><b>{{ money(row.total_cost) }}</b></td>
                                        <td><span class="pill" :class="reasonPill(row.reason_code)">{{ row.reason_description || '—' }}</span></td>
                                        <td>{{ originText(row.origin) }}</td>
                                        <td>{{ viaText(row.via) }}<span v-if="row.replacement" class="tag amber">Regresó a cocina</span></td>
                                        <td>{{ row.requested_by?.username || '—' }}</td>
                                        <td>{{ row.authorized_by?.username || '—' }}</td>
                                        <td><button class="iconbtn" title="Ver detalle" @click="openDetail(row)">›</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="foot">
                            <span>{{ footerText({ page, pageSize, count, shown: records.length, summary }) }}</span>
                            <div class="pager">
                                <button :disabled="page <= 1" @click="goTo(page - 1)">‹</button>
                                <button v-for="n in pageNumbers" :key="n" :class="{ on: n === page }" @click="goTo(n)">{{ n }}</button>
                                <button :disabled="page >= pageCount" @click="goTo(page + 1)">›</button>
                                <select v-model.number="pageSize" @change="goTo(1)">
                                    <option v-for="size in [20, 50, 100]" :key="size" :value="size">{{ size }} / página</option>
                                </select>
                            </div>
                        </div>
                    </template>
                </section>

                <!-- RESUMEN -->
                <section v-else>
                    <div class="summary-toolbar">
                        <label>Agrupar por</label>
                        <n-select v-model:value="groupBy" :options="GROUP_BY_OPTIONS" size="small" style="width: 180px"
                            @update:value="loadSummary" />
                    </div>
                    <div v-if="state === 'loading'" class="tablewrap skeleton">
                        <n-skeleton v-for="n in 4" :key="n" text height="28px" style="margin: 6px 0" />
                    </div>
                    <div v-else-if="!grouped?.rows?.length" class="state">
                        <b>Sin mermas en el periodo</b>No hay mermas entre las fechas elegidas. Cambia el rango o los filtros.
                    </div>
                    <div v-else class="tablewrap">
                        <table style="min-width: 640px">
                            <thead>
                                <tr><th>{{ groupLabel }}</th><th>Registros</th><th>Unidades</th><th class="r">Costo total</th><th class="r">% del total</th></tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in grouped.rows" :key="row.key ?? row.label">
                                    <td class="l">{{ row.label }}</td><td>{{ row.records }}</td><td>{{ row.units }}</td>
                                    <td class="r">{{ money(row.total_cost) }}</td><td class="r">{{ row.pct }} %</td>
                                </tr>
                                <tr>
                                    <td class="l"><b>Total</b></td><td><b>{{ grouped.totals.records }}</b></td>
                                    <td><b>{{ grouped.totals.units }}</b></td>
                                    <td class="r"><b>{{ money(grouped.totals.total_cost) }}</b></td><td class="r"><b>100 %</b></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </template>
        </div>

        <!-- DETALLE (panel lateral) -->
        <n-drawer v-model:show="showDetail" :width="drawerWidth" placement="right">
            <div class="drawer">
                <div class="dh">
                    <h2>Merma #{{ detail?.id }}</h2>
                    <button class="btn ghost" @click="showDetail = false">Cerrar</button>
                </div>
                <div class="db">
                    <n-spin :show="loadingDetail">
                        <template v-if="detail">
                            <div class="grid2">
                                <div><div class="k">Producto</div><div class="val">{{ detail.item_name }} <span class="tag">{{ ITEM_TYPE_LABELS[detail.item_type] }}</span></div></div>
                                <div><div class="k">Fecha</div><div class="val">{{ formatDate(detail.created) }}</div></div>
                                <div><div class="k">Cantidad</div><div class="val">{{ detail.quantity }}</div></div>
                                <div><div class="k">Costo total</div><div class="val">{{ money(detail.total_cost) }}</div></div>
                                <div><div class="k">Motivo</div><div class="val"><span class="pill" :class="reasonPill(detail.reason_code)">{{ detail.reason_description || '—' }}</span></div></div>
                                <div><div class="k">Origen</div><div class="val">{{ originText(detail.origin) }}</div></div>
                                <div><div class="k">Vía</div><div class="val">{{ viaText(detail.via) }}</div></div>
                                <div><div class="k">Solicitó</div><div class="val">{{ detail.requested_by?.username || '—' }}</div></div>
                                <div><div class="k">Autorizó (supervisor)</div><div class="val">{{ detail.authorized_by?.username || '—' }}</div></div>
                            </div>
                            <div class="sec">Observación</div>
                            <div class="note">{{ detail.note || '—' }}</div>
                            <div class="sec">Movimientos de kardex generados</div>
                            <table class="mini">
                                <thead><tr><th>Concepto</th><th>Producto</th><th>Ingreso</th><th>Salida</th><th>Doc.</th></tr></thead>
                                <tbody>
                                    <tr v-for="move in detail.movements || []" :key="`${move.kind}-${move.id}`">
                                        <td>{{ move.concept }}</td><td>{{ move.name }}</td>
                                        <td>{{ isQty(move.ingress) ? move.ingress : '—' }}</td>
                                        <td>{{ isQty(move.egress) ? move.egress : '—' }}</td>
                                        <td>{{ move.document }}</td>
                                    </tr>
                                    <tr v-if="!(detail.movements || []).length"><td colspan="5">Sin movimientos de kardex (los menús no descuentan stock).</td></tr>
                                </tbody>
                            </table>
                            <p class="mini-note">El saldo de stock no cambia: la "VENTA" de la comanda se revierte y se registra como "MERMA" (FLZ-MER-04).</p>
                            <div class="sec">Acciones</div>
                            <div class="actions">
                                <button v-if="detail?.origin?.order_id" class="btn ghost" @click="viewOrder">Ver pedido</button>
                                <button class="btn ghost" :disabled="!kardexTarget" @click="viewKardex">Ver en kardex</button>
                            </div>
                        </template>
                    </n-spin>
                </div>
            </div>
        </n-drawer>

        <!-- REGISTRAR MERMA (panel lateral, ancho según la vía) -->
        <n-drawer v-model:show="showRegister" :width="registerDrawerWidth" placement="right"
            @after-leave="registerVia = null">
            <n-drawer-content :title="registerTitle" closable>
                <div class="register-drawer">
                    <RegisterWaste v-if="registerVia" :key="registerVia" :via="registerVia"
                        @registered="onRegistered" />
                </div>
            </n-drawer-content>
        </n-drawer>

        <!-- MOTIVOS (modal mediano) -->
        <WasteReasons v-model:show="showReasons" />

        <details-modal v-model:show="showOrder" :id-order="orderId" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { format, startOfMonth } from "date-fns";
import DetailsModal from "@/views/Order/components/DetailsModal.vue";
import RegisterWaste from "./components/RegisterWaste.vue";
import WasteReasons from "./components/WasteReasons.vue";
import { getWasteFilterOptions, getWasteSummary, listWaste, retrieveWaste } from "@/api/modules/wasteReport";
import { useBusinessStore } from "@/store/modules/business";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import {
    GROUP_BY_OPTIONS,
    ITEM_TYPE_LABELS,
    buildParams,
    footerText,
    formatDate,
    money,
    originText,
    quantityText,
    reasonPill,
    variationText,
    viaText,
} from "@/utils/wasteReport";
import { exportWasteExcel, exportWastePdf } from "./exportWaste";

const router = useRouter();
const message = useMessage();
const businessStore = useBusinessStore();
const genericsStore = useGenericsStore();
const tillStore = useTillStore();
const userStore = useUserStore();

const today = new Date();
const mode = ref("list"); // list | summary
const showFilters = ref(true);
const state = ref("loading"); // loading | ready | error | forbidden
const exporting = ref(false);
const showRegister = ref(false);
const showReasons = ref(false);
const filters = ref({
    start_date: format(startOfMonth(today), "yyyy-MM-dd"),
    end_date: format(today, "yyyy-MM-dd"),
    till: null,
    item_type: null,
    via: null,
    reason: null,
    search: "",
    requested_by: null,
    authorized_by: null,
});
const options = ref({ tills: [], requested_by: [], authorized_by: [], reasons: [] });

const records = ref([]);
const summary = ref({});
const count = ref(0);
const page = ref(1);
const pageSize = ref(20);
const groupBy = ref("reason");
const grouped = ref(null);

const showDetail = ref(false);
const loadingDetail = ref(false);
const detail = ref(null);
const showOrder = ref(false);
const orderId = ref(0);

const registerVia = ref(null); // 'A' | 'B' | null
const registerDrawerWidth = computed(() =>
    registerVia.value === "A" ? "min(900px, 95vw)" : "min(640px, 95vw)"
);
const registerTitle = computed(() =>
    registerVia.value === "A"
        ? "Registrar merma · Vía A — Desde mesa / orden"
        : "Registrar merma · Vía B — Merma directa"
);
// Menú "Registrar merma ▾": cada vía abre su propio formulario.
const REGISTER_VIAS = [
    { key: "A", title: "Desde mesa / orden", sub: "Un plato o toda la orden de una mesa abierta" },
    { key: "B", title: "Merma directa", sub: "Sin mesa: cocina, barra o almacén" },
];
const showViaMenu = ref(false);
const drawerWidth = computed(() => (genericsStore.device === "mobile" ? "100%" : 460));
const groupLabel = computed(() => GROUP_BY_OPTIONS.find((option) => option.value === groupBy.value)?.label || "Motivo");
const pageCount = computed(() => Math.max(Math.ceil(count.value / pageSize.value), 1));
const pageNumbers = computed(() => {
    const start = Math.max(1, Math.min(page.value - 2, pageCount.value - 4));
    return Array.from({ length: Math.min(5, pageCount.value) }, (_, index) => start + index);
});

const ALL = { label: "Todos", value: null };
const typeOptions = [ALL, { label: "Producto", value: "PRODUCT" }, { label: "Combo", value: "COMBO" }, { label: "Menú", value: "MENU" }, { label: "Insumo", value: "SUPPLY" }];
const viaOptions = [ALL, { label: "A · Mesa/Orden", value: "ORDER" }, { label: "B · Directa", value: "DIRECT" }];
// FE-01: "Crear merma" solo para quien puede autorizar mermas.
const canRegister = computed(() => userStore.hasPermission("authorize_waste"));
const canManageReasons = computed(() => userStore.hasPermission("manage_waste_reasons"));
const tillOptions = computed(() => [
    { label: "Todas", value: null },
    ...options.value.tills.map((till) => ({
        label: till.id === tillStore.currentTillID ? `${till.label} (actual)` : till.label,
        value: till.id,
    })),
]);
const reasonOptions = computed(() => [ALL, ...options.value.reasons.map((reason) => ({ label: reason.description, value: reason.code }))]);
const userOptions = (field) => [ALL, ...(options.value[field] || []).map((user) => ({ label: user.username, value: user.id }))];

const params = () => buildParams(filters.value);
const isQty = (value) => value !== null && value !== undefined && value !== "-" && String(value).trim() !== "";

const handleError = (error) => {
    console.error(error);
    state.value = error?.response?.status === 403 ? "forbidden" : "error";
};

const loadList = async () => {
    state.value = "loading";
    try {
        const response = await listWaste({ ...params(), page: page.value, page_size: pageSize.value });
        records.value = response.data.results || [];
        summary.value = response.data.summary || {};
        count.value = response.data.count || 0;
        state.value = "ready";
    } catch (error) {
        handleError(error);
    }
};

const loadSummary = async () => {
    state.value = "loading";
    try {
        const response = await getWasteSummary({ ...params(), group_by: groupBy.value });
        grouped.value = response.data;
        state.value = "ready";
    } catch (error) {
        handleError(error);
    }
};

const loadOptions = async () => {
    try {
        options.value = (await getWasteFilterOptions()).data;
    } catch (error) {
        if (error?.response?.status === 403) state.value = "forbidden";
        else console.error(error);
    }
};

const reload = () => (mode.value === "list" ? loadList() : loadSummary());
const applyFilters = () => {
    page.value = 1;
    reload();
};
const goTo = (target) => {
    page.value = Math.min(Math.max(target, 1), pageCount.value);
    loadList();
};
const openList = () => {
    mode.value = "list";
    loadList();
};

const openSummary = () => {
    mode.value = "summary";
    loadSummary();
};

const openDetail = async (row) => {
    detail.value = { ...row };
    showDetail.value = true;
    loadingDetail.value = true;
    try {
        detail.value = (await retrieveWaste(row.id)).data;
    } catch (error) {
        console.error(error);
        message.error("No se pudo cargar el detalle de la merma.");
    } finally {
        loadingDetail.value = false;
    }
};

const viewOrder = () => {
    orderId.value = detail.value?.origin?.order_id || 0;
    showOrder.value = true;
};

// Producto del ítem; en combos, el primer componente con movimiento.
const kardexTarget = computed(() => {
    if (!detail.value) return null;
    if (detail.value.product_id) return { id: detail.value.product_id, name: detail.value.item_name };
    const move = (detail.value.movements || []).find((item) => item.kind === "PRODUCT" && item.item_id);
    return move ? { id: move.item_id, name: move.name } : null;
});

const viewKardex = () => {
    if (!kardexTarget.value) return;
    router.push({
        name: "KardexHome",
        query: { product: kardexTarget.value.id, name: kardexTarget.value.name, concept: "MERMA,DEVOLUCIÓN POR ANULACIÓN" },
    });
};

const onSelectVia = (key) => {
    showViaMenu.value = false;
    registerVia.value = key;
    showRegister.value = true;
};

const onRegistered = () => reload();

const exportReport = async (kind) => {
    exporting.value = true;
    try {
        // Mismos filtros, todos los registros: el archivo cuadra con los totales de pantalla.
        const [list, groupedResponse] = await Promise.all([
            listWaste({ ...params(), all: 1 }),
            getWasteSummary({ ...params(), group_by: groupBy.value }),
        ]);
        const branch = businessStore.business?.branchs?.find((item) => item.id === businessStore.currentBranch);
        const header = {
            businessName: businessStore.business?.commercial_name || businessStore.business?.name || "Flizzy",
            branchName: branch?.description,
            range: { start: formatRange(filters.value.start_date), end: formatRange(filters.value.end_date) },
            groupLabel: groupLabel.value,
        };
        const payload = {
            records: list.data.results || [],
            summary: list.data.summary || {},
            grouped: groupedResponse.data,
            header,
        };
        if (kind === "excel") await exportWasteExcel(payload);
        else exportWastePdf(payload);
    } catch (error) {
        console.error(error);
        message.error(error?.response?.status === 403 ? "Sin permiso para exportar el reporte." : "No se pudo exportar.");
    } finally {
        exporting.value = false;
    }
};

const formatRange = (value) => (value ? value.split("-").reverse().join("/") : "");

onMounted(async () => {
    await loadOptions();
    if (state.value === "forbidden") return;
    loadList();
});
</script>

<style scoped>
/* Tokens y medidas del mockup (mockup-lista-mermas.html). */
/* Los paneles laterales se montan fuera (teleport): también necesitan los tokens. */
.waste-content,
.drawer,
.register-drawer {
    --line: #e6e9ef;
    --text: #1f2937;
    --muted: #6b7280;
    --primary: #1f6feb;
    --primary-soft: #e8f0fe;
    --red: #d93025;
    --red-soft: #fdecea;
    --amber: #b26a00;
    --amber-soft: #fff4e0;
    --violet: #6b3fa0;
    --violet-soft: #f1e9fb;
}

.waste-content {
    padding: 20px;
    min-width: 0;
    color: var(--text);
    font-size: 13px;
}

.panel {
    background: #fff;
    border-radius: 10px;
    padding: 18px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Conmutador Lista | Resumen */
.mode-toggle {
    display: inline-flex;
    gap: 4px;
    background: #f1f3f5;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 12px;
}

.mode-toggle button {
    background: none;
    border: 0;
    padding: 6px 12px;
    font: inherit;
    color: var(--muted);
    cursor: pointer;
    border-radius: 6px;
    white-space: nowrap;
}

.mode-toggle button.on {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
}

.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.link { color: var(--primary); font-weight: 700; cursor: pointer; background: none; border: 0; font: inherit; }
.btn { border: 0; border-radius: 6px; padding: 8px 14px; font: inherit; font-weight: 700; cursor: pointer; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.primary { background: var(--primary); color: #fff; }
.btn.ghost { background: #fff; border: 1px solid var(--line); color: var(--text); }

.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; background: #fafbfc; border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin-bottom: 14px; }
.filters label, .summary-toolbar label { display: block; font-size: 11px; color: var(--muted); margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
.summary-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.summary-toolbar label { margin: 0; }

.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 14px; }
.kpi { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; }
.kpi .l { font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; }
.kpi .v { font-size: 22px; font-weight: 800; margin-top: 4px; }
.kpi .s { font-size: 11px; color: var(--muted); margin-top: 2px; }
.kpi.alert { border-color: #f5c2bd; background: var(--red-soft); }
.kpi.alert .v { color: var(--red); }

.tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
.tablewrap.skeleton { padding: 10px; }
table { width: 100%; border-collapse: collapse; min-width: 1050px; }
th { background: #f7f8fa; font-size: 12px; font-weight: 700; text-align: center; padding: 10px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td { padding: 9px 8px; border-bottom: 1px solid var(--line); text-align: center; vertical-align: middle; }
td.l { text-align: left; }
td.r, th.r { text-align: right; }
tr:hover td { background: #fafcff; }

.pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; border: 1px solid transparent; white-space: nowrap; }
.p-red { background: var(--red-soft); color: var(--red); border-color: #f5c2bd; }
.p-amber { background: var(--amber-soft); color: var(--amber); border-color: #f3d9a6; }
.p-violet { background: var(--violet-soft); color: var(--violet); border-color: #dccbf1; }
.p-gray { background: #f1f3f5; color: #4b5563; border-color: #e5e7eb; }
.tag { font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; background: #eef2f7; color: #475569; margin-left: 6px; }
.tag.amber { background: var(--amber-soft); color: var(--amber); }
.warn { color: var(--amber); font-weight: 700; }
.iconbtn { background: var(--primary-soft); color: var(--primary); border: 0; border-radius: 6px; width: 30px; height: 28px; cursor: pointer; font-weight: 900; }

.foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
.pager { display: flex; gap: 6px; align-items: center; }
.pager button, .pager select { border: 1px solid var(--line); border-radius: 5px; padding: 3px 9px; background: #fff; font: inherit; color: inherit; cursor: pointer; }
.pager button.on { border-color: var(--primary); color: var(--primary); font-weight: 700; }
.pager button:disabled { opacity: 0.5; cursor: not-allowed; }

.state { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 28px; text-align: center; color: var(--muted); }
.state b { display: block; color: var(--text); font-size: 14px; margin-bottom: 4px; }

/* Panel lateral (detalle) */
.drawer { display: flex; flex-direction: column; height: 100%; color: var(--text); font-size: 13px; }
.dh { padding: 16px 18px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }
.dh h2 { margin: 0; font-size: 16px; }
.db { padding: 16px 18px; overflow: auto; flex: 1; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-bottom: 16px; }
.grid2 .k { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
.grid2 .val { font-weight: 700; margin-top: 2px; }
.sec { font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin: 16px 0 8px; letter-spacing: 0.3px; }
.mini { width: 100%; border-collapse: collapse; min-width: 0; font-size: 12px; }
.mini th, .mini td { padding: 6px; border-bottom: 1px solid var(--line); }
.mini-note { font-size: 11px; color: var(--muted); }
.note { background: #f7f8fa; border-radius: 6px; padding: 10px; font-size: 12px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Panel lateral (registrar merma) */
.register-drawer { padding: 4px; }

@media (max-width: 760px) {
    .waste-content { padding: 12px; }
}
</style>

<style>
/* Menú "Registrar merma ▾" (el popover se teleporta fuera del scope). */
.via-menu {
    display: grid;
    gap: 4px;
    width: 300px;
    max-width: calc(100vw - 32px);
    padding: 6px;
    background: #fff;
    border: 1px solid #e6e9ef;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.via-menu__item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px;
    border: 0;
    border-radius: 8px;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.via-menu__item:hover,
.via-menu__item:focus-visible {
    background: #e8f0fe;
    outline: none;
}

.via-menu__badge {
    flex: 0 0 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #e8f0fe;
    color: #1f6feb;
    font-weight: 800;
    font-size: 14px;
}

.via-menu__item:hover .via-menu__badge {
    background: #1f6feb;
    color: #fff;
}

.via-menu__text {
    display: grid;
    gap: 2px;
    min-width: 0;
}

.via-menu__title {
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
}

.via-menu__sub {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.35;
}
</style>
