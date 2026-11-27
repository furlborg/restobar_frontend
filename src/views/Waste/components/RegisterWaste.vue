<template>
    <!-- Registrar merma: una sola vía elegida desde WasteView (Vía A desde mesa/orden, Vía B directa). -->
    <div class="register-waste">
        <!-- Caja cerrada: registro bloqueado (mismo estado que el mockup HTML). -->
        <div v-if="blocked" class="state blocked">
            <b>Caja cerrada</b>Registro de mermas bloqueado. Abra caja para poder registrar mermas.
        </div>

        <template v-else>
            <!-- Éxito (Vía B): el formulario queda limpio para registrar otra. -->
            <div v-if="lastCode" class="success">
                <b>Merma registrada</b>
                <span class="code">{{ lastCode }}</span>
            </div>

            <!-- VÍA A -->
            <div v-if="via === 'A'" class="via-a">
                <section class="step">
                    <h3 class="step__title">Mesa</h3>
                    <n-select v-model:value="selectedOrderId" :options="orderOptions"
                        placeholder="Buscar mesa u orden…" filterable :loading="loadingOrders"
                        @update:value="onSelectOrder" />
                </section>

                <section class="step">
                    <h3 class="step__title">Plato o pedido</h3>

                    <div v-if="!selectedOrder" class="empty short">
                        Elija una mesa para ver sus platos
                    </div>

                    <template v-else>
                        <div class="order-line">
                            {{ tableName(selectedOrder.table) }} · Orden #{{ selectedOrder.id }} ·
                            Mozo {{ selectedOrder.user || '—' }} · Hora {{ hourOf(selectedOrder.created) }}
                        </div>

                        <div v-if="!selectedOrderItems.length && !loadingItems" class="empty short">
                            Esta orden no tiene ítems para mermar.
                        </div>

                        <div v-else class="items" role="radiogroup">
                            <button type="button" class="item-row item-row--whole" :class="{ on: target === WHOLE }"
                                role="radio" :aria-checked="target === WHOLE" @click="selectTarget(WHOLE)">
                                <span class="item-row__radio" aria-hidden="true"></span>
                                <span class="item-row__info">
                                    <span class="item-row__name">Toda la orden ({{ selectedOrderItems.length }} {{ selectedOrderItems.length === 1 ? 'plato' : 'platos' }})</span>
                                    <span class="item-row__meta">Ej.: el cliente se fue sin pagar. La mesa queda libre.</span>
                                </span>
                            </button>
                            <div v-if="selectedOrderItems.length > ITEM_FILTER_FROM" class="items__filter">
                                <n-input v-model:value="itemFilter" size="small" clearable placeholder="Buscar plato…" />
                            </div>
                            <div class="items__scroll">
                                <button v-for="item in visibleItems" :key="item.id" type="button" class="item-row"
                                    :class="{ on: target === item.id }" role="radio" :aria-checked="target === item.id"
                                    @click="selectTarget(item.id)">
                                    <span class="item-row__radio" aria-hidden="true"></span>
                                    <span class="item-row__info">
                                        <span class="item-row__name">{{ item.product_name }}</span>
                                        <span class="item-row__meta">{{ item.quantity }} × {{ itemPrice(item) }}</span>
                                    </span>
                                </button>
                                <div v-if="!visibleItems.length" class="items__none">Ningún plato coincide.</div>
                            </div>
                        </div>

                        <div v-if="targetItem && targetItem.quantity > 1" class="field qty-field">
                            <label>Cantidad perdida</label>
                            <n-input-number v-model:value="orderQuantity" :min="1" :max="targetItem.quantity"
                                :precision="0" class="qty-input">
                                <template #suffix>de {{ targetItem.quantity }}</template>
                            </n-input-number>
                        </div>
                    </template>
                </section>

                <template v-if="target">
                    <section class="step">
                        <h3 class="step__title">Motivo</h3>
                        <n-select v-model:value="orderReasonCode" :options="reasonOptions"
                            placeholder="Seleccione un motivo" />
                        <div class="field">
                            <div class="label-row">
                                <label>Observación</label>
                                <span class="counter">{{ orderNote.length }} / 10 mínimo</span>
                            </div>
                            <n-input v-model:value="orderNote" type="textarea" :rows="2"
                                placeholder="Explique brevemente qué ocurrió…" />
                        </div>
                    </section>

                    <section v-if="target !== WHOLE" class="step">
                        <h3 class="step__title">¿Qué pasó con el plato?</h3>
                        <n-radio-group v-model:value="orderReplacement" class="type-group">
                            <n-radio-button :value="false">Se descartó</n-radio-button>
                            <n-radio-button :value="true">Regresó a cocina</n-radio-button>
                        </n-radio-group>
                    </section>

                    <section class="summary-box">
                        <p class="summary-box__note">
                            {{ target === WHOLE || isLastItemFull
                                ? 'Toda la orden sale de la cuenta y la mesa queda libre.'
                                : 'El ítem sale de la cuenta.' }}
                            No se imprime comanda. Si el cliente quiere otro, agréguelo de nuevo en la mesa.
                        </p>
                        <button type="button" class="btn primary submit-btn" :disabled="!canSubmitOrder"
                            @click="submitOrderWaste">
                            Registrar merma
                        </button>
                        <p v-if="!canSubmitOrder && !orderSubmitting" class="submit-tip">{{ orderHint }}</p>
                    </section>
                </template>
            </div>

            <!-- VÍA B -->
            <div v-else class="via-b">
                <section class="step">
                    <h3 class="step__title">Producto o insumo</h3>
                    <n-radio-group v-model:value="type" size="medium" class="type-group"
                        @update:value="resetItem">
                        <n-radio-button value="PRODUCT">Producto</n-radio-button>
                        <n-radio-button value="SUPPLY">Insumo</n-radio-button>
                    </n-radio-group>
                    <n-select v-model:value="selectedItemId"
                        :options="type === 'PRODUCT' ? productOptions : supplyOptions"
                        :placeholder="type === 'PRODUCT' ? 'Buscar producto…' : 'Buscar insumo…'" filterable
                        remote :loading="searching" @search="searchItems" @update:value="selectItem" />
                </section>

                <section class="step">
                    <h3 class="step__title">Cantidad</h3>
                    <n-input-number v-model:value="quantity" :min="0.001"
                        :step="type === 'PRODUCT' ? 1 : 0.1" :precision="type === 'PRODUCT' ? 0 : 3"
                        class="qty-input">
                        <template #suffix>{{ unit || 'und' }}</template>
                    </n-input-number>
                </section>

                <section class="step">
                    <h3 class="step__title">Motivo</h3>
                    <n-select v-model:value="reasonCode" :options="reasonOptions"
                        placeholder="Seleccione un motivo" />
                    <div class="field">
                        <div class="label-row">
                            <label>Observación</label>
                            <span class="counter">{{ note.length }} / 10 mínimo</span>
                        </div>
                        <n-input v-model:value="note" type="textarea" :rows="2"
                            placeholder="Explique brevemente qué ocurrió…" />
                    </div>
                </section>

                <section class="step">
                    <h3 class="step__title">Precio de venta (opcional)</h3>
                    <div class="price-row">
                        <n-input-number v-model:value="referencePrice" :min="0" :precision="2"
                            class="price-input" placeholder="Vacío si no aplica" />
                        <button type="button" class="link" @click="omitPrice">Omitir</button>
                    </div>
                    <p class="help">Solo como referencia; no afecta la caja.</p>
                </section>

                <section class="summary-box">
                    <div class="summary-box__row">
                        <span>Ítem</span>
                        <b>{{ selectedItem?.label || 'Sin ítem' }}</b>
                    </div>
                    <div class="summary-box__row">
                        <span>Costo unitario{{ costSourceLabel }}</span>
                        <b>{{ money(unitCost) }}</b>
                    </div>
                    <div v-if="selectedItem && costSource === 'NONE'" class="summary-box__warn">
                        Este ítem no tiene precio de compra ni receta con costo: la merma se registrará sin costo.
                    </div>
                    <div class="summary-box__row">
                        <span>Cantidad</span>
                        <b>{{ quantity }}</b>
                    </div>
                    <div class="summary-box__row summary-box__row--total">
                        <span>Costo total</span>
                        <b>{{ money(totalCost) }}</b>
                    </div>
                    <div class="summary-box__row">
                        <span>Subtotal referencial</span>
                        <b>{{ subtotal }}</b>
                    </div>

                    <button type="button" class="btn primary submit-btn" :disabled="!canSubmit || submitting"
                        @click="submit">
                        Registrar merma
                    </button>
                    <p v-if="!canSubmit" class="submit-tip">{{ submitHint }}</p>
                </section>
            </div>
        </template>

    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useMessage } from "naive-ui";
import { listOrders, listOrderDetails } from "@/api/modules/orders";
import { searchProductByName } from "@/api/modules/products";
import { getSupplies } from "@/api/modules/supplies";
import { getWasteUnitCost, registerDirectWaste } from "@/api/modules/wasteReport";
import { useCancellationReasons } from "@/composables/useCancellationReasons";
import { useTableStore } from "@/store/modules/table";
import { useTillStore } from "@/store/modules/till";
import { cancelTableOrder, performDeleteOrderDetail } from "@/api/modules/tables";
import {
    MODE_WASTE,
    WASTE_NOTE_MIN,
    buildCancelOrderPayload,
    buildRemoveDetailPayload,
    cancellationErrorMessage,
    findReason,
    reasonsForMode,
} from "@/utils/cancellation";

defineProps({
    via: { type: String, required: true },
});

const emit = defineEmits(["registered"]);

const message = useMessage();
const tableStore = useTableStore();
const tillStore = useTillStore();
const { reasons: allReasons, load: loadReasons } = useCancellationReasons();

const money = (value) => `S/ ${(Number(value) || 0).toFixed(2)}`;

// Estado general
const blocked = ref(false);

// Vía A
const loadingOrders = ref(false);
const orders = ref([]);
const selectedOrderId = ref(null);
const loadingItems = ref(false);
const selectedOrderItems = ref([]);
// Qué se perdió: id del ítem o WHOLE (toda la orden).
const WHOLE = "WHOLE";
const target = ref(null);
const orderQuantity = ref(1);
const orderReasonCode = ref(null);
const orderNote = ref("");
const orderReplacement = ref(false);
const orderSubmitting = ref(false);

// Vía B
const type = ref("PRODUCT");
const productOptions = ref([]);
const supplyOptions = ref([]);
const searching = ref(false);
const selectedItemId = ref(null);
const selectedItem = ref(null);
const unitCost = ref(0);
const costSource = ref(null);
const unit = ref("und");
const quantity = ref(1);
const referencePrice = ref(null);
const reasonCode = ref(null);
const note = ref("");
const submitting = ref(false);
const lastCode = ref(null);

const reasons = computed(() => reasonsForMode(allReasons.value, MODE_WASTE));
const reasonOptions = computed(() => reasons.value.map((r) => ({ label: r.description, value: r.code })));

const selectedOrder = computed(() => orders.value.find((order) => order.id === selectedOrderId.value) || null);
const orderOptions = computed(() =>
    orders.value.map((order) => ({
        label: `${tableName(order.table)} · Orden #${order.id}`,
        value: order.id,
    }))
);

const canSubmit = computed(
    () =>
        selectedItem.value &&
        Number(quantity.value) > 0 &&
        reasonCode.value &&
        note.value.trim().length >= 10 &&
        !submitting.value
);

const totalCost = computed(() => Number(unitCost.value || 0) * Number(quantity.value || 0));
const subtotal = computed(() =>
    referencePrice.value != null ? money(Number(quantity.value || 0) * Number(referencePrice.value || 0)) : "—"
);
const costSourceLabel = computed(() => {
    if (costSource.value === "RECIPE") return " (receta)";
    if (costSource.value === "PURCHASE_PRICE") return " (compra)";
    return "";
});
const submitHint = computed(() => {
    const missing = [];
    if (!selectedItem.value) missing.push("Seleccione un ítem.");
    if (!reasonCode.value) missing.push("Seleccione un motivo.");
    if (note.value.trim().length < 10) missing.push("Observación de al menos 10 caracteres.");
    return missing.join(" ") || "Revise los datos.";
});

const tableName = (tableId) => {
    if (!tableId) return "—";
    const table = tableStore.getTableByID(tableId);
    const name = table?.description || `#${tableId}`;
    // Evita "Mesa MESA 1" cuando el nombre de la mesa ya dice "Mesa".
    return /^mesa\b/i.test(name) ? name : `Mesa ${name}`;
};

const hourOf = (value) => {
    if (!value) return "—";
    const text = String(value);
    const match = text.match(/(\d{2}:\d{2})/);
    return match ? match[1] : text;
};

const itemPrice = (item) => {
    const price = Number(item?.price);
    return price > 0 ? money(price) : "—";
};

const loadOrders = async () => {
    loadingOrders.value = true;
    try {
        const response = await listOrders({ status: "1", tables: true, take_aways: false, deliverys: false });
        orders.value = response.data?.results || [];
    } catch (error) {
        console.error(error);
        message.error("No se pudieron cargar los pedidos abiertos.");
    } finally {
        loadingOrders.value = false;
    }
};

const onSelectOrder = async (orderId) => {
    selectedOrderId.value = orderId;
    selectedOrderItems.value = [];
    resetOrderForm();
    if (!orderId) return;
    loadingItems.value = true;
    try {
        const response = await listOrderDetails(orderId);
        selectedOrderItems.value = (response.data || []).map((item) => ({
            id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price ?? item.product_set?.computed_price ?? item.product_set?.price,
        }));
    } catch (error) {
        console.error(error);
        message.error("No se pudo cargar el detalle del pedido.");
    } finally {
        loadingItems.value = false;
    }
};

// Con muchos platos se muestra un buscador y la lista tiene scroll propio.
const ITEM_FILTER_FROM = 8;
const itemFilter = ref("");
const visibleItems = computed(() => {
    const query = itemFilter.value.trim().toLowerCase();
    if (!query) return selectedOrderItems.value;
    return selectedOrderItems.value.filter(
        (item) => item.id === target.value || String(item.product_name || "").toLowerCase().includes(query)
    );
});

const targetItem = computed(() =>
    target.value && target.value !== WHOLE ? selectedOrderItems.value.find((item) => item.id === target.value) : null
);
// El backend no deja vaciar la comanda ítem por ítem: el último ítem completo se registra como toda la orden.
const isLastItemFull = computed(
    () => !!targetItem.value && selectedOrderItems.value.length === 1 && orderQuantity.value >= targetItem.value.quantity
);
const canSubmitOrder = computed(
    () =>
        !!target.value &&
        !!orderReasonCode.value &&
        orderNote.value.trim().length >= WASTE_NOTE_MIN &&
        !orderSubmitting.value
);
const orderHint = computed(() => {
    const missing = [];
    if (!orderReasonCode.value) missing.push("Seleccione un motivo.");
    if (orderNote.value.trim().length < WASTE_NOTE_MIN) missing.push(`Observación de al menos ${WASTE_NOTE_MIN} caracteres.`);
    return missing.join(" ");
});

const resetOrderForm = () => {
    target.value = null;
    itemFilter.value = "";
    orderQuantity.value = 1;
    orderReasonCode.value = null;
    orderNote.value = "";
    orderReplacement.value = false;
};

const selectTarget = (value) => {
    target.value = value;
    const item = selectedOrderItems.value.find((row) => row.id === value);
    orderQuantity.value = item ? Number(item.quantity) || 1 : 1;
    if (value === WHOLE) orderReplacement.value = false;
};

const submitOrderWaste = async () => {
    if (!canSubmitOrder.value || !selectedOrder.value) return;
    const tableId = selectedOrder.value.table;
    const wholeOrder = target.value === WHOLE || isLastItemFull.value;
    const reason = findReason(reasons.value, orderReasonCode.value);

    orderSubmitting.value = true;
    try {
        if (wholeOrder) {
            const payload = buildCancelOrderPayload({
                reasonCode: orderReasonCode.value,
                reasons: reasons.value,
                note: orderNote.value,
                cancelMode: MODE_WASTE,
                replacement: target.value !== WHOLE && orderReplacement.value,
            });
            await cancelTableOrder(tableId, { ...payload, nullReason: payload.null_reason });
            message.success("Orden registrada como merma");
            selectedOrderId.value = null;
            selectedOrderItems.value = [];
            resetOrderForm();
            await loadOrders();
        } else {
            const payload = buildRemoveDetailPayload({
                detailId: targetItem.value.id,
                quantity: orderQuantity.value,
                reason,
                chosenDestination: null,
                note: orderNote.value,
                replacement: orderReplacement.value,
                cancelMode: MODE_WASTE,
            });
            await performDeleteOrderDetail(tableId, targetItem.value.id, payload, orderQuantity.value);
            message.success("Merma registrada");
            resetOrderForm();
            await loadOrders();
            await onSelectOrder(selectedOrderId.value);
        }
        emit("registered");
    } catch (error) {
        console.error(error);
        message.error(cancellationErrorMessage(error));
    } finally {
        orderSubmitting.value = false;
    }
};

// Vía B: búsqueda remota
const searchItems = async (query) => {
    searching.value = true;
    try {
        if (type.value === "PRODUCT") {
            const response = await searchProductByName(query);
            productOptions.value = (response.data || []).map((p) => ({
                label: p.name,
                value: p.id,
                prices: p.prices,
                purchase_price: p.purchase_price,
            }));
        } else {
            const response = await getSupplies("supplies", { search: query });
            supplyOptions.value = (response.data?.results || []).map((s) => ({
                label: s.name,
                value: s.id,
                purchase_price: s.purchase_price,
                unit: s.measureunit_des,
            }));
        }
    } catch (error) {
        console.error(error);
    } finally {
        searching.value = false;
    }
};

const resetItem = () => {
    selectedItemId.value = null;
    selectedItem.value = null;
    unitCost.value = 0;
    costSource.value = null;
    unit.value = "und";
    referencePrice.value = null;
};

const selectItem = (value, option) => {
    selectedItem.value = option || null;
    if (!option) {
        unitCost.value = 0;
        costSource.value = null;
        unit.value = "und";
        referencePrice.value = null;
        return;
    }
    unitCost.value = Number(option.purchase_price) || 0;
    costSource.value = null;
    loadUnitCost(option.value);
    unit.value = type.value === "PRODUCT" ? "und" : option.unit || "und";
    // Precio de carta prellenado para producto; vacío para insumo.
    referencePrice.value = type.value === "PRODUCT" && option.prices != null ? Number(option.prices) : null;
};

// El costo lo calcula el backend con el mismo criterio que congela al registrar.
const loadUnitCost = async (itemId) => {
    const key = type.value === "PRODUCT" ? "product" : "supplie";
    try {
        const response = await getWasteUnitCost({ [key]: itemId });
        if (selectedItem.value?.value !== itemId) return;
        unitCost.value = Number(response.data?.unit_cost) || 0;
        costSource.value = response.data?.source || null;
    } catch (error) {
        console.error(error);
    }
};

const omitPrice = () => {
    referencePrice.value = null;
};

const submit = async () => {
    if (submitting.value) return;
    if (!selectedItem.value) {
        message.warning("Seleccione un ítem.");
        return;
    }
    if (note.value.trim().length < 10) {
        message.warning("La observación debe tener al menos 10 caracteres.");
        return;
    }

    const payload = {
        [type.value === "PRODUCT" ? "product" : "supplie"]: selectedItem.value.value,
        quantity: String(quantity.value),
        reason: reasonCode.value,
        note: note.value.trim(),
        reference_price: referencePrice.value != null ? String(referencePrice.value) : null,
    };

    submitting.value = true;
    try {
        const response = await registerDirectWaste(payload);
        lastCode.value = response.data?.code || null;
        message.success("Merma registrada");
        // Limpiar formulario (conserva la vía para registrar otra).
        selectedItemId.value = null;
        selectedItem.value = null;
        unitCost.value = 0;
        costSource.value = null;
        unit.value = "und";
        quantity.value = 1;
        referencePrice.value = null;
        reasonCode.value = null;
        note.value = "";
        emit("registered");
    } catch (error) {
        console.error(error);
        const data = error?.response?.data || {};
        if (String(data.error || "").includes("No hay caja abierta")) {
            blocked.value = true;
            return;
        }
        message.error(data.error || "No se pudo registrar la merma.");
    } finally {
        submitting.value = false;
    }
};

onMounted(async () => {
    await loadReasons(true).catch(() => {});
    await loadOrders();
    await tableStore.initializeStore().catch(() => {});
    await tillStore.initializeStore().catch(() => {});
    // Sin caja abierta, el registro de mermas queda bloqueado (Vía B lo exige).
    if (!tillStore.currentTillID) blocked.value = true;
});
</script>

<style scoped>
.register-waste {
    display: grid;
    gap: 16px;
    max-width: 1180px;
    color: var(--text);
    font-size: 13px;
}

.state {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 28px;
    text-align: center;
    color: var(--muted);
}

.state b {
    display: block;
    color: var(--text);
    font-size: 14px;
    margin-bottom: 4px;
}

.state.blocked {
    border-color: #f5c2bd;
    background: var(--red-soft);
    color: var(--red);
}

/* Éxito (Vía B): aviso arriba para registrar otra. */
.success {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    border: 1px solid #b7e4c2;
    background: #eefbf1;
    border-radius: 8px;
    padding: 10px 12px;
}

.success .code {
    font-family: monospace;
    font-weight: 800;
    font-size: 15px;
    color: var(--primary);
}

/* Columnas de pasos (una sola columna) */
.via-a,
.via-b {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.step {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

.step__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field label {
    font-size: 13px;
    color: var(--text);
    font-weight: 500;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
}

.counter {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
}

/* Vía A */
.order-line {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.5;
}

.items {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
}

.item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.item-row:hover {
    background: #f7f9fc;
}

.item-row.on {
    background: var(--primary-soft, #e8f0fe);
}

.item-row--whole {
    background: #fafbfc;
}

.items__filter {
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    background: #fff;
}

/* La lista de platos no empuja el resto del formulario: scroll propio. */
.items__scroll {
    max-height: 320px;
    overflow-y: auto;
}

.items__scroll .item-row:last-child {
    border-bottom: 0;
}

.items__none {
    padding: 14px;
    text-align: center;
    color: var(--muted);
    font-size: 12px;
}

.item-row__radio {
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    background: #fff;
}

.item-row.on .item-row__radio {
    border-color: var(--primary, #1f6feb);
    box-shadow: inset 0 0 0 3px #fff;
    background: var(--primary, #1f6feb);
}

.item-row:last-child {
    border-bottom: 0;
}

.item-row__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.item-row__name {
    color: var(--text);
    font-weight: 600;
}

.item-row__meta {
    color: var(--muted);
    font-size: 12px;
}

.qty-field {
    margin-top: 4px;
}

.summary-box__note {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.45;
}

.help {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--muted);
}

.empty {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 28px;
    text-align: center;
    color: var(--muted);
}

.empty.short {
    padding: 18px;
}

/* Vía B */
.type-group {
    display: inline-flex;
    flex-wrap: wrap;
    width: fit-content;
    max-width: 100%;
}

.qty-input {
    width: 200px;
    max-width: 100%;
}

.price-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.price-input {
    flex: 1 1 200px;
}

/* Caja de resumen */
.summary-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #fafbfc;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 16px;
}

.summary-box__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    font-size: 13px;
}

.summary-box__row > span {
    color: var(--muted);
}

.summary-box__row > b {
    text-align: right;
    word-break: break-word;
}

.summary-box__row--total {
    padding-top: 12px;
    border-top: 1px solid var(--line);
}

.summary-box__row--total > span {
    color: var(--text);
    font-weight: 700;
}

.summary-box__row--total > b {
    font-size: 18px;
    font-weight: 800;
}

.summary-box__warn {
    font-size: 12px;
    color: var(--amber);
}

.submit-tip {
    margin: -4px 0 0;
    font-size: 12px;
    color: var(--muted);
}

/* Botones */
.btn {
    border: 0;
    border-radius: 6px;
    padding: 8px 14px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn.primary {
    background: var(--primary);
    color: #fff;
}

.btn.ghost {
    background: #fff;
    border: 1px solid var(--line);
    color: var(--text);
}

.btn.sm {
    padding: 5px 10px;
    font-size: 12px;
    white-space: nowrap;
}

.btn.submit-btn {
    width: 100%;
    padding: 10px 14px;
}

.link {
    color: var(--primary);
    font-weight: 700;
    cursor: pointer;
    background: none;
    border: 0;
    font: inherit;
    font-size: 12px;
    white-space: nowrap;
}

@media (max-width: 360px) {
    .qty-input {
        width: 100%;
    }

    .price-row {
        align-items: stretch;
    }
}
</style>
