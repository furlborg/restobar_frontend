<template>
    <!-- Pantalla "Operaciones gratuitas" (FLZ-REP-06): cortesías, consumo interno e IGV de retiros. -->
    <div class="free-content">
        <div class="panel">
            <h1>Operaciones gratuitas</h1>
            <p class="sub">Cortesías y consumo interno. El IGV de los retiros es referencial: se informa a SUNAT, no entra a caja.</p>

            <div v-if="state === 'forbidden'" class="state">
                <b>Sin permiso</b>Tu rol no tiene acceso al reporte de operaciones gratuitas
                (<code>view_free_operations_report</code>). Pídeselo al administrador.
            </div>

            <template v-else>
                <div class="toolbar">
                    <button class="link" @click="showFilters = !showFilters">
                        {{ showFilters ? "▾ Ocultar filtros" : "▸ Mostrar filtros" }}
                    </button>
                    <div class="toolbar-actions">
                        <button class="btn ghost" :disabled="exporting" @click="exportReport('excel')">Exportar Excel</button>
                        <button class="btn ghost" :disabled="exporting" @click="exportReport('pdf')">Exportar PDF</button>
                        <button class="btn primary" @click="reload">Recargar</button>
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
                    <div><label>Motivo</label>
                        <n-select v-model:value="filters.free_reason" :options="reasonOptions" size="small"
                            @update:value="applyFilters" />
                    </div>
                    <div><label>Afectación</label>
                        <n-select v-model:value="filters.affectation" :options="affectationOptions" size="small"
                            @update:value="applyFilters" />
                    </div>
                    <div><label>Comprobante</label>
                        <n-select v-model:value="filters.invoice_type" :options="invoiceTypeOptions" size="small"
                            @update:value="applyFilters" />
                    </div>
                    <div><label>Autorizó</label>
                        <n-select v-model:value="filters.authorized_by" :options="userOptions" size="small"
                            @update:value="applyFilters" />
                    </div>
                    <div><label>Ítem</label>
                        <n-input v-model:value="filters.search" placeholder="Buscar ítem…" size="small" clearable
                            @keyup.enter="applyFilters" @clear="applyFilters" @blur="applyFilters" />
                    </div>
                </div>

                <div v-if="state === 'error'" class="state">
                    <b>Error al cargar</b>No se pudo obtener el reporte.
                    <button class="link" @click="reload">Reintentar</button>
                </div>

                <template v-else>
                    <div class="kpis">
                        <div class="kpi">
                            <div class="l">Valor referencial</div>
                            <div class="v">{{ money(summary.reference_value) }}</div>
                            <div class="s">{{ summary.records ?? 0 }} ítems gratuitos</div>
                        </div>
                        <div class="kpi alert">
                            <div class="l">IGV de retiros del periodo</div>
                            <div class="v">{{ money(summary.reference_igv) }}</div>
                            <div class="s">Referencial · no pasa por caja</div>
                        </div>
                        <div class="kpi">
                            <div class="l">Operaciones</div>
                            <div class="v">{{ summary.records ?? 0 }}</div>
                            <div class="s">{{ summary.sales ?? 0 }} ventas</div>
                        </div>
                        <div class="kpi">
                            <div class="l">Motivo principal</div>
                            <div class="v" style="font-size: 16px">{{ summary.top_reason?.label || "—" }}</div>
                            <div class="s">
                                <template v-if="summary.top_reason">
                                    {{ summary.top_reason.records }} registros · {{ money(summary.top_reason.reference_value) }}
                                </template>
                            </div>
                        </div>
                    </div>

                    <div v-if="summary.by_document_type?.length" class="docs">
                        <div v-for="doc in summary.by_document_type" :key="doc.type" class="doc">
                            <span class="doc-name">{{ doc.label }}</span>
                            <span class="doc-kind" :class="{ muted: doc.kind === 'NOTE_OF_SALE' }">
                                {{ doc.kind === "NOTE_OF_SALE" ? "No informada" : "Informada a SUNAT" }}
                            </span>
                            <span class="doc-value">{{ money(doc.reference_value) }}</span>
                            <span class="doc-igv">IGV {{ money(doc.reference_igv) }}</span>
                        </div>
                    </div>

                    <div v-if="state === 'loading'" class="tablewrap skeleton">
                        <n-skeleton v-for="n in 6" :key="n" text height="28px" style="margin: 6px 0" />
                    </div>
                    <div v-else-if="!records.length" class="state">
                        <b>Sin operaciones gratuitas en el periodo</b>No hay cortesías ni consumo interno entre las
                        fechas elegidas. Cambia el rango o los filtros.
                    </div>
                    <template v-else>
                        <div class="tablewrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Comprobante</th><th>Fecha</th><th>Ítem</th><th>Cant.</th>
                                        <th class="r">Valor ref.</th><th class="r">IGV ref.</th>
                                        <th>Código</th><th>Motivo</th><th>Autorizó</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in records" :key="row.id">
                                        <td class="l">{{ documentText(row.document) }}</td>
                                        <td>{{ formatDate(row.created) }}</td>
                                        <td class="l">{{ row.item }}</td>
                                        <td>{{ row.quantity }}</td>
                                        <td class="r">{{ money(row.reference_value) }}</td>
                                        <td class="r">{{ money(row.reference_igv) }}</td>
                                        <td>
                                            <span class="pill" :class="{ taxed: row.affectation?.taxed_retirement }">
                                                {{ row.affectation?.id }} · {{ row.affectation?.description }}
                                            </span>
                                        </td>
                                        <td>{{ reasonText(row) }}</td>
                                        <td>{{ row.authorized_by?.username || "—" }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="foot">
                            <span>{{ footerText({ page, pageSize, count, summary }) }}</span>
                            <div class="pager">
                                <button :disabled="page <= 1" @click="goTo(page - 1)">‹</button>
                                <button v-for="n in pageNumbers" :key="n" :class="{ on: n === page }" @click="goTo(n)">{{ n }}</button>
                                <button :disabled="page >= pageCount" @click="goTo(page + 1)">›</button>
                                <select v-model.number="pageSize" @change="applyFilters">
                                    <option v-for="size in [20, 50, 100]" :key="size" :value="size">{{ size }} / página</option>
                                </select>
                            </div>
                        </div>
                    </template>
                </template>
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useMessage } from "naive-ui";
import { format, startOfMonth } from "date-fns";
import { getFreeOperationsOptions, listFreeOperations } from "@/api/modules/freeOperationsReport";
import { useBusinessStore } from "@/store/modules/business";
import {
    buildParams,
    documentText,
    footerText,
    formatDate,
    money,
    reasonText,
} from "@/utils/freeOperationsReport";
import { exportFreeOperationsExcel, exportFreeOperationsPdf } from "./exportFreeOperations";

const message = useMessage();
const businessStore = useBusinessStore();

const today = new Date();
const showFilters = ref(true);
const state = ref("loading"); // loading | ready | error | forbidden
const exporting = ref(false);
const filters = ref({
    start_date: format(startOfMonth(today), "yyyy-MM-dd"),
    end_date: format(today, "yyyy-MM-dd"),
    free_reason: null,
    affectation: null,
    invoice_type: null,
    authorized_by: null,
    search: "",
});
const options = ref({ authorized_by: [], affectations: [], invoice_types: [], reasons: [] });

const records = ref([]);
const summary = ref({});
const count = ref(0);
const page = ref(1);
const pageSize = ref(20);

const pageCount = computed(() => Math.max(Math.ceil(count.value / pageSize.value), 1));
const pageNumbers = computed(() => {
    const start = Math.max(1, Math.min(page.value - 2, pageCount.value - 4));
    return Array.from({ length: Math.min(5, pageCount.value) }, (_, index) => start + index);
});

const ALL = { label: "Todos", value: null };
const reasonOptions = computed(() => [
    ALL,
    ...(options.value.reasons || []).map((reason) => ({ label: reason.label, value: reason.code })),
]);
const affectationOptions = computed(() => [
    ALL,
    ...(options.value.affectations || []).map((row) => ({ label: `${row.id} · ${row.description}`, value: row.id })),
]);
const invoiceTypeOptions = computed(() => [
    ALL,
    ...(options.value.invoice_types || []).map((row) => ({ label: row.description, value: row.id })),
]);
const userOptions = computed(() => [
    ALL,
    ...(options.value.authorized_by || []).map((user) => ({ label: user.username, value: user.id })),
]);

const params = () => buildParams(filters.value);

const handleError = (error) => {
    console.error(error);
    state.value = error?.response?.status === 403 ? "forbidden" : "error";
};

const loadList = async () => {
    state.value = "loading";
    try {
        const response = await listFreeOperations({ ...params(), page: page.value, page_size: pageSize.value });
        records.value = response.data.results || [];
        summary.value = response.data.summary || {};
        count.value = response.data.count || 0;
        state.value = "ready";
    } catch (error) {
        handleError(error);
    }
};

const loadOptions = async () => {
    try {
        options.value = (await getFreeOperationsOptions()).data;
    } catch (error) {
        if (error?.response?.status === 403) state.value = "forbidden";
        else console.error(error);
    }
};

const reload = () => loadList();
const applyFilters = () => {
    page.value = 1;
    loadList();
};
const goTo = (target) => {
    page.value = Math.min(Math.max(target, 1), pageCount.value);
    loadList();
};

const formatRange = (value) => (value ? value.split("-").reverse().join("/") : "");

const exportReport = async (kind) => {
    exporting.value = true;
    try {
        // Mismos filtros, todos los registros: el archivo cuadra con los totales de pantalla.
        const response = await listFreeOperations({ ...params(), all: 1 });
        const branch = businessStore.business?.branchs?.find((item) => item.id === businessStore.currentBranch);
        const header = {
            businessName: businessStore.business?.commercial_name || businessStore.business?.name || "Flizzy",
            branchName: branch?.description,
            range: { start: formatRange(filters.value.start_date), end: formatRange(filters.value.end_date) },
        };
        const payload = {
            records: response.data.results || [],
            summary: response.data.summary || {},
            header,
        };
        if (kind === "excel") await exportFreeOperationsExcel(payload);
        else exportFreeOperationsPdf(payload);
    } catch (error) {
        console.error(error);
        message.error(
            error?.response?.status === 403 ? "Sin permiso para exportar el reporte." : "No se pudo exportar."
        );
    } finally {
        exporting.value = false;
    }
};

onMounted(async () => {
    await loadOptions();
    if (state.value !== "forbidden") loadList();
});
</script>

<style scoped>
.free-content { padding: 18px; color: var(--text); }
.panel { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 18px; }
h1 { margin: 0 0 4px; font-size: 20px; }
.sub { margin: 0 0 14px; color: var(--muted); font-size: 12px; }

.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { border: 1px solid var(--line); background: #fff; padding: 6px 12px; border-radius: 6px; font: inherit; cursor: pointer; }
.btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn.ghost { background: #fff; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.link { border: 0; background: none; color: var(--primary); font: inherit; cursor: pointer; padding: 0; }

.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; background: #f7f8fa; border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin-bottom: 14px; }
.filters label { display: block; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }

.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin-bottom: 12px; }
.kpi { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
.kpi.alert { border-color: #f0c36d; background: #fffaf0; }
.kpi .l { font-size: 11px; text-transform: uppercase; color: var(--muted); font-weight: 700; }
.kpi .v { font-size: 22px; font-weight: 800; margin-top: 2px; }
.kpi .s { font-size: 11px; color: var(--muted); }

.docs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.doc { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; display: flex; gap: 8px; align-items: baseline; font-size: 12px; }
.doc-name { font-weight: 700; }
.doc-kind { color: var(--primary); font-size: 11px; }
.doc-kind.muted { color: var(--muted); }
.doc-value { font-weight: 700; }
.doc-igv { color: var(--muted); }

.tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; min-width: 980px; }
th, td { padding: 8px 10px; border-bottom: 1px solid var(--line); text-align: left; font-size: 12px; vertical-align: middle; }
th { background: #f7f8fa; font-size: 11px; text-transform: uppercase; color: var(--muted); }
td.r, th.r { text-align: right; }
td.l { text-align: left; }
tbody tr:hover { background: #fafbfc; }

.pill { display: inline-block; border-radius: 999px; padding: 2px 8px; background: #eef2ff; color: #3730a3; font-size: 11px; }
.pill.taxed { background: #fff3e0; color: #9a3412; }

.foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
.pager { display: flex; gap: 6px; align-items: center; }
.pager button, .pager select { border: 1px solid var(--line); border-radius: 5px; padding: 3px 9px; background: #fff; font: inherit; color: inherit; cursor: pointer; }
.pager button.on { border-color: var(--primary); color: var(--primary); font-weight: 700; }
.pager button:disabled { opacity: 0.5; cursor: not-allowed; }

.state { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 28px; text-align: center; color: var(--muted); }
.state b { display: block; color: var(--text); font-size: 14px; margin-bottom: 4px; }

@media (max-width: 760px) {
    .free-content { padding: 12px; }
}
</style>
