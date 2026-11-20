<template>
    <!-- Anulación total con destino por ítem (FLZ-MER-08 + FLZ-SEC-03): por mesa (cancel_order) o por pedido (secure_delete). -->
    <n-modal :show="show" preset="card" title="Anular pedido" :mask-closable="false" closable :class="modalClass"
        @update:show="(value) => !value && close()">
        <n-spin :show="loadingOrder">
            <n-space vertical :size="14">
                <n-form-item label="Motivo general" :show-feedback="false">
                    <CancellationReasonPicker v-model="general" :reasons="reasons" style="width: 100%" />
                </n-form-item>

                <div class="cancel-order__items">
                    <div class="cancel-order__items-title">
                        {{ tableId ? "Ítems de la mesa" : "Ítems del pedido" }}
                        <span class="cancel-order__muted">usan el motivo general salvo que lo cambies</span>
                    </div>
                    <div v-for="item in items" :key="item.id" class="cancel-order__item">
                        <div class="cancel-order__item-head">
                            <span>{{ item.quantity }} × {{ item.product_name }}</span>
                            <n-tag v-if="destinationOf(item)" size="small" :bordered="false"
                                :type="destinationOf(item) === 'WASTE' ? 'warning' : 'success'">
                                {{ destinationOf(item) === 'WASTE' ? 'Merma' : 'Stock' }}
                            </n-tag>
                            <n-button text size="small" type="primary" @click="toggleOverride(item)">
                                {{ item.override ? 'Usar motivo general' : 'Cambiar motivo' }}
                            </n-button>
                        </div>
                        <CancellationReasonPicker v-if="item.override" v-model="item.form" :reasons="reasons" compact />
                    </div>
                    <div v-if="!items.length && !loadingOrder" class="cancel-order__muted">
                        No se encontraron ítems en {{ tableId ? "la mesa" : "el pedido" }}.
                    </div>
                </div>

                <div v-if="hasAllReasons" class="cancel-order__summary">
                    <span><b>{{ summary.stockItems }}</b> ítems · <b>{{ summary.stockUnits }}</b> u. al stock</span>
                    <span :class="{ 'is-waste': summary.wasteUnits }"><b>{{ summary.wasteItems }}</b> ítems ·
                        <b>{{ summary.wasteUnits }}</b> u. a merma</span>
                    <span v-if="summary.wasteUnits && showCost" :class="{ 'is-waste': summary.wasteCostCents }">
                        Valor al costo: <b>S/ {{ (summary.wasteCostCents / 100).toFixed(2) }}</b>
                        <span v-if="hasWasteWithoutCost" class="cancel-order__muted">(hay ítems sin costo registrado)</span>
                    </span>
                </div>

                <CancellationAuth v-if="hasAllReasons" v-model="credentials" :mode="mode" :is-waste="summary.wasteUnits > 0"
                    @submit="submit" />
            </n-space>
        </n-spin>
        <template #action>
            <n-space justify="end">
                <n-button @click="close">Cancelar</n-button>
                <n-button type="error" secondary :loading="loading" :disabled="loadingOrder || !items.length"
                    @click.prevent="submit">
                    Anular pedido
                </n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { cancelTableOrder, retrieveTableOrder } from "@/api/modules/tables";
import { getCancellationUnitCosts, listOrderDetails, nullOrder } from "@/api/modules/orders";
import { useCancellationReasons } from "@/composables/useCancellationReasons";
import { useGenericsStore } from "@/store/modules/generics";
import { useUserStore } from "@/store/modules/user";
import {
    DESTINATION_STOCK,
    DESTINATION_WASTE,
    PERMISSION_CANCEL_ORDER,
    authError,
    authMode,
    buildCancelOrderPayload,
    canSeeWasteCost,
    cancellationErrorMessage,
    findReason,
    itemError,
    resolveDestination,
    summarize,
} from "@/utils/cancellation";
import CancellationAuth from "./CancellationAuth.vue";
import CancellationReasonPicker from "./CancellationReasonPicker.vue";

const props = defineProps({
    show: { type: Boolean, default: false },
    // Uno de los dos: mesa (anula su pedido activo) o pedido puntual (vista Pedidos).
    tableId: { type: [String, Number], default: null },
    orderId: { type: [String, Number], default: null },
});
const emit = defineEmits(["update:show", "cancelled"]);

const message = useMessage();
const userStore = useUserStore();
const genericsStore = useGenericsStore();
const { reasons, load } = useCancellationReasons();

const emptyForm = () => ({ reasonCode: null, chosenDestination: null, note: "" });
const general = ref(emptyForm());
const items = ref([]);
const credentials = ref({ username: "", password: "" });
const loading = ref(false);
const loadingOrder = ref(false);
// Costo unitario por ítem (id -> número). Vacío si el usuario no puede ver costos.
const unitCosts = ref({});
const showCost = computed(() => canSeeWasteCost((permission) => userStore.hasPermission(permission)));

const modalClass = computed(() => ({
    'w-100': genericsStore.device === 'mobile',
    'w-75': genericsStore.device === 'tablet',
    'w-50': genericsStore.device === 'desktop',
}));

/** Motivo/destino/observación efectivos del ítem (propios o el general). */
const formOf = (item) => (item.override ? item.form : general.value);
const destinationOf = (item) => {
    const form = formOf(item);
    return resolveDestination(findReason(reasons.value, form.reasonCode), form.chosenDestination);
};

const hasAllReasons = computed(() => items.value.length > 0 && items.value.every((item) => destinationOf(item)));
const summary = computed(() =>
    summarize(
        items.value.map((item) => ({
            quantity: item.quantity,
            destination: destinationOf(item),
            unitCost: unitCosts.value[item.id] ?? 0,
        }))
    )
);
// Productos con costo 0 o desconocido: la merma sale en S/ 0 (riesgo registrado en el índice).
const hasWasteWithoutCost = computed(() =>
    items.value.some((item) => destinationOf(item) === DESTINATION_WASTE && !(unitCosts.value[item.id] > 0))
);
const mode = computed(() =>
    authMode(
        (permission) => userStore.hasPermission(permission),
        PERMISSION_CANCEL_ORDER,
        summary.value.wasteUnits > 0 ? DESTINATION_WASTE : DESTINATION_STOCK
    )
);

const toggleOverride = (item) => {
    item.override = !item.override;
    // Al personalizar se parte del motivo general para cambiar solo lo necesario.
    item.form = item.override ? { ...general.value } : emptyForm();
};

const loadOrder = async () => {
    loadingOrder.value = true;
    items.value = [];
    unitCosts.value = {};
    try {
        const details = props.orderId
            ? (await listOrderDetails(props.orderId)).data || []
            : (await retrieveTableOrder(props.tableId)).data?.order?.order_details || [];
        items.value = details.map((detail) => ({
            id: detail.id,
            product_name: detail.product_name,
            quantity: detail.quantity,
            override: false,
            form: emptyForm(),
        }));
        loadUnitCosts();
    } catch (error) {
        console.error(error);
        message.error("No se pudo cargar el detalle del pedido.");
    } finally {
        loadingOrder.value = false;
    }
};

const loadUnitCosts = async () => {
    if (!showCost.value || !items.value.length) return;
    try {
        const response = await getCancellationUnitCosts(items.value.map((item) => item.id));
        const costs = response.data?.costs || {};
        unitCosts.value = Object.fromEntries(Object.entries(costs).map(([id, cost]) => [id, Number(cost) || 0]));
    } catch (error) {
        // Sin costo no se bloquea la anulación: solo se omite el valor del resumen.
        console.error(error);
    }
};

watch(
    () => props.show,
    (visible) => {
        if (!visible) return;
        general.value = emptyForm();
        credentials.value = { username: "", password: "" };
        // Se recarga al abrir: el catálogo depende del módulo de mermas en Configuración.
        load(true).catch((error) => {
            console.error(error);
            message.error("No se pudo cargar la lista de motivos de anulación.");
        });
        loadOrder();
    }
);

const close = () => emit("update:show", false);

const submit = async () => {
    if (loading.value || !items.value.length) return;

    for (const item of items.value) {
        const form = formOf(item);
        const error = itemError(findReason(reasons.value, form.reasonCode), form.chosenDestination, form.note);
        if (error) {
            message.warning(item.override ? `${item.product_name}: ${error}` : error);
            return;
        }
    }
    const credentialError = authError(mode.value, credentials.value);
    if (credentialError) {
        message.warning(credentialError);
        return;
    }

    const payload = buildCancelOrderPayload({
        items: items.value.map((item) => ({ id: item.id, ...formOf(item) })),
        reasons: reasons.value,
        generalNote: general.value.note || findReason(reasons.value, general.value.reasonCode)?.description,
        mode: mode.value,
        credentials: credentials.value,
    });

    loading.value = true;
    try {
        const response = props.orderId
            ? await nullOrder(props.orderId, payload)
            : await cancelTableOrder(props.tableId, { ...payload, nullReason: payload.null_reason });
        message.success(
            summary.value.wasteUnits
                ? `Pedido anulado: ${summary.value.stockUnits} u. al stock, ${summary.value.wasteUnits} u. a merma`
                : "Pedido anulado correctamente"
        );
        emit("cancelled", { response, payload });
        close();
    } catch (error) {
        console.error(error);
        if (error.response?.status === 409) {
            // El pedido sí se anuló; lo que quedó pendiente es el comprobante en SUNAT.
            message.warning(error.response.data?.error || "Pedido anulado; el comprobante requiere envío manual.");
            emit("cancelled", { response: error.response, payload });
            close();
            return;
        }
        credentials.value = { ...credentials.value, password: "" };
        message.error(cancellationErrorMessage(error));
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.cancel-order__items {
    display: grid;
    gap: 8px;
    max-height: 45vh;
    overflow-y: auto;
}

.cancel-order__items-title {
    font-weight: 600;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
}

.cancel-order__muted {
    font-size: 12px;
    font-weight: 400;
    opacity: 0.7;
}

.cancel-order__item {
    display: grid;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--n-border-color, #e0e0e6);
    border-radius: 6px;
}

.cancel-order__item-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.cancel-order__item-head > span:first-child {
    flex: 1;
    min-width: 0;
}

.cancel-order__summary {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 14px;
}

.cancel-order__summary .is-waste {
    color: #d03050;
}
</style>
