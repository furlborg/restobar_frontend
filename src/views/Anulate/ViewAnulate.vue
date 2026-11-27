<template>
    <!-- Módulo unificado "Anulaciones y mermas" (absorbe la antigua pantalla Mermas). -->
    <div class="anulate-view">
        <div class="anulate-header">
            <h1>Anulaciones y mermas</h1>
            <div class="anulate-switcher">
                <button v-for="view in availableViews" :key="view.key" :class="{ on: activeView === view.key }"
                    @click="selectView(view.key)">
                    {{ view.label }}
                </button>
            </div>
        </div>

        <WasteView v-if="activeView === 'waste'" />
        <div v-else class="anulate-panel">
            <SalesAnulate v-if="activeView === 'sales'" />
            <OrdersAnulate v-else />
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import { resolveAnulate } from "@/utils/wasteReport";
import WasteView from "@/views/Waste/WasteView.vue";
import SalesAnulate from "./salesAnulate.vue";
import OrdersAnulate from "./ordersAnulate.vue";

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const VIEW_LABELS = {
    waste: "Mermas",
    sales: "Ventas anuladas",
    orders: "Órdenes anuladas",
};

const resolved = computed(() =>
    resolveAnulate({
        showWaste: settingsStore.business_settings?.modules?.show_waste,
        viewWasteReport: userStore.hasPermission("view_waste_report"),
        showAnulates: settingsStore.business_settings?.modules?.show_anulates,
        requested: route.query.view,
    })
);

const availableViews = computed(() => resolved.value.views.map((key) => ({ key, label: VIEW_LABELS[key] })));

// Derivada de la URL y de los permisos/módulos: respeta ?view= y reacciona a cambios.
const activeView = computed(() => {
    const requested = route.query.view;
    return resolved.value.views.includes(requested) ? requested : resolved.value.initial;
});

const selectView = (key) => {
    router.replace({ query: { ...route.query, view: key } });
};
</script>

<style scoped>
.anulate-view {
    --line: #e6e9ef;
    --text: #1f2937;
    --muted: #6b7280;
    --primary: #1f6feb;
    --primary-soft: #e8f0fe;
    min-width: 0;
    color: var(--text);
    font-size: 13px;
}

.anulate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 20px 20px 0;
}

.anulate-header h1 {
    font-size: 20px;
    margin: 0;
    font-weight: 700;
}

/* Selector flotante segmentado (tipo "pills"). */
.anulate-switcher {
    display: flex;
    gap: 4px;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    padding: 4px;
    max-width: 100%;
    overflow-x: auto;
}

.anulate-switcher button {
    border: 0;
    background: none;
    padding: 7px 14px;
    border-radius: 8px;
    font: inherit;
    color: var(--muted);
    cursor: pointer;
    white-space: nowrap;
}

.anulate-switcher button.on {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
}

/* Ventas/Órdenes anuladas dentro del mismo contenedor visual (sin n-card + h2 duplicados). */
.anulate-panel {
    padding: 20px;
}
</style>
