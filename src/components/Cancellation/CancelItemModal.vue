<template>
    <!-- Anular un ítem de mesa: mismo diseño que antes de mermas ("Eliminando comanda").
         La credencial depende de Ajustes y todo vuelve a stock. Las mermas se registran en el módulo. -->
    <n-modal :class="modalClass" preset="card" :show="show" title="Eliminando comanda" :mask-closable="false" closable
        @update:show="(value) => !value && close()">
        <n-form>
            <template v-if="authMode === AUTH_MODE_USER_PASS">
                <n-form-item label="Ingrese su usuario">
                    <n-input v-model:value="credentials.username" />
                </n-form-item>
                <n-form-item label="Ingrese su contraseña">
                    <n-input type="password" v-model:value="credentials.password" @keyup.enter="submit" />
                </n-form-item>
            </template>
            <n-form-item v-else-if="authMode === AUTH_MODE_GENERAL_PASS" label="Ingrese la contraseña">
                <n-input type="password" v-model:value="credentials.password" @keyup.enter="submit" />
            </n-form-item>
            <n-form-item label="Cantidad">
                <n-input-number v-model:value="quantity" :min="1" :max="maxQuantity" style="width: 100%" />
            </n-form-item>
            <n-form-item label="Motivo de anulación">
                <n-input v-model:value="reasonText" placeholder="" @keyup.enter="submit" />
            </n-form-item>
        </n-form>
        <template #action>
            <n-space justify="end">
                <n-button type="success" secondary :loading="loading" @click.prevent="submit">Confirmar</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { cancelTableOrder, performDeleteOrderDetail } from "@/api/modules/tables";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import {
    AUTH_MODE_GENERAL_PASS,
    AUTH_MODE_USER_PASS,
    PERMISSION_CANCEL_ORDER,
    authError,
    buildStockCancelPayload,
    cancelAuthMode,
    cancellationErrorMessage,
    stockReasonError,
} from "@/utils/cancellation";

const props = defineProps({
    show: { type: Boolean, default: false },
    tableId: { type: [String, Number], required: true },
    // { id, product_name, quantity }
    detail: { type: Object, default: null },
    // FE-03: true cuando es el último ítem de la comanda. Al anular toda su cantidad
    // se anula la mesa directamente (cancelTableOrder) en vez de remove_detail.
    cancelWholeOrder: { type: Boolean, default: false },
});
const emit = defineEmits(["update:show", "cancelled"]);

const message = useMessage();
const userStore = useUserStore();
const genericsStore = useGenericsStore();
const settingsStore = useSettingsStore();

const credentials = ref({ username: "", password: "" });
const reasonText = ref("");
const quantity = ref(1);
const loading = ref(false);

const saleSettings = computed(() => settingsStore.businessSettings?.sale);
const authMode = computed(() => cancelAuthMode(saleSettings.value));
const maxQuantity = computed(() => Number(props.detail?.quantity) || 1);
const isWholeOrder = computed(() => props.cancelWholeOrder && quantity.value >= maxQuantity.value);
const modalClass = computed(() => ({
    'w-100': genericsStore.device === 'mobile',
    'w-50': genericsStore.device === 'tablet',
    'w-25': genericsStore.device === 'desktop',
}));

watch(
    () => props.show,
    (visible) => {
        if (!visible) return;
        credentials.value = { username: "", password: "" };
        reasonText.value = "";
        quantity.value = maxQuantity.value;
    }
);

const close = () => emit("update:show", false);

const submit = async () => {
    if (loading.value || !props.detail) return;

    const validation = authError(authMode.value, credentials.value) || stockReasonError(saleSettings.value, reasonText.value);
    if (validation) {
        message.warning(validation);
        return;
    }

    // FE-03: anular toda la cantidad del último ítem anula la mesa (misma API que "Anular pedido").
    if (isWholeOrder.value && !userStore.hasPermission(PERMISSION_CANCEL_ORDER) && userStore.user?.role !== "MOZO") {
        message.warning("No tiene permisos para anular la mesa.");
        return;
    }

    const payload = buildStockCancelPayload({
        reasonText: reasonText.value,
        mode: authMode.value,
        credentials: credentials.value,
    });
    loading.value = true;
    try {
        if (isWholeOrder.value) {
            const response = await cancelTableOrder(props.tableId, { ...payload, nullReason: payload.null_reason });
            message.success("Pedido anulado correctamente");
            emit("cancelled", { response, payload, wholeOrder: true });
        } else {
            const response = await performDeleteOrderDetail(props.tableId, props.detail.id, payload, quantity.value);
            message.success("Ítem anulado");
            emit("cancelled", { response, payload, wholeOrder: false });
        }
        close();
    } catch (error) {
        console.error(error);
        // Se conserva lo ingresado (salvo la clave) para corregir y reintentar.
        credentials.value = { ...credentials.value, password: "" };
        message.error(cancellationErrorMessage(error));
    } finally {
        loading.value = false;
    }
};
</script>
