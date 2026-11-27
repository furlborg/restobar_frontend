<template>
    <!-- Anular pedido (Mesas y Pedidos): mismo diseño que antes de mermas (modalAnulateSale).
         La credencial depende de Ajustes y todo vuelve a stock. Por mesa usa cancel_order y
         por pedido secure_delete. Las mermas se registran en el módulo "Anulaciones y mermas". -->
    <n-modal preset="card" :show="show" title="Anular pedido" closable :class="modalClass"
        @update:show="(value) => !value && close()" @esc="close">
        <n-form>
            <template v-if="authMode === AUTH_MODE_USER_PASS">
                <n-form-item label="Ingrese su usuario">
                    <n-input v-model:value="credentials.username" placeholder="" />
                </n-form-item>
                <n-form-item label="Ingrese su contraseña">
                    <n-input type="password" v-model:value="credentials.password" placeholder="" @keyup.enter="submit" />
                </n-form-item>
            </template>
            <n-form-item v-else-if="authMode === AUTH_MODE_GENERAL_PASS" label="Ingrese la contraseña general">
                <n-input type="password" v-model:value="credentials.password" placeholder="Clave de anulación"
                    @keyup.enter="submit" />
            </n-form-item>
            <n-form-item label="Motivo de anulación">
                <n-input v-model:value="reasonText" placeholder="" @keyup.enter="submit" />
            </n-form-item>
        </n-form>
        <template #action>
            <n-space justify="end">
                <n-button type="info" @click="close">Cancelar</n-button>
                <n-button type="success" :loading="loading" @click.prevent="submit">Confirmar</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { cancelTableOrder } from "@/api/modules/tables";
import { nullOrder } from "@/api/modules/orders";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import {
    AUTH_MODE_GENERAL_PASS,
    AUTH_MODE_USER_PASS,
    authError,
    buildStockCancelPayload,
    cancelAuthMode,
    cancellationErrorMessage,
    stockReasonError,
} from "@/utils/cancellation";

const props = defineProps({
    show: { type: Boolean, default: false },
    // Uno de los dos: mesa (anula su pedido activo) o pedido puntual (vista Pedidos).
    tableId: { type: [String, Number], default: null },
    orderId: { type: [String, Number], default: null },
});
const emit = defineEmits(["update:show", "cancelled"]);

const message = useMessage();
const genericsStore = useGenericsStore();
const settingsStore = useSettingsStore();

const credentials = ref({ username: "", password: "" });
const reasonText = ref("");
const loading = ref(false);

const saleSettings = computed(() => settingsStore.businessSettings?.sale);
const authMode = computed(() => cancelAuthMode(saleSettings.value));
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
    }
);

const close = () => emit("update:show", false);

const submit = async () => {
    if (loading.value) return;

    const validation = authError(authMode.value, credentials.value) || stockReasonError(saleSettings.value, reasonText.value);
    if (validation) {
        message.warning(validation);
        return;
    }

    const payload = buildStockCancelPayload({
        reasonText: reasonText.value,
        mode: authMode.value,
        credentials: credentials.value,
    });

    loading.value = true;
    try {
        const response = props.orderId
            ? await nullOrder(props.orderId, payload)
            : await cancelTableOrder(props.tableId, { ...payload, nullReason: payload.null_reason });
        message.success("Pedido anulado correctamente");
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
