<template>
    <!-- Anulación parcial de un ítem de mesa (FLZ-MER-07 + FLZ-SEC-03). -->
    <n-modal :show="show" preset="card" title="Anular ítem" :mask-closable="false" closable :class="modalClass"
        @update:show="(value) => !value && close()">
        <n-space vertical :size="12">
            <div v-if="detail" class="cancel-item__name">{{ detail.product_name }}</div>
            <n-form-item v-if="maxQuantity > 1" label="Cantidad a anular" :show-feedback="false">
                <n-input-number v-model:value="quantity" :min="1" :max="maxQuantity" style="width: 100%" />
            </n-form-item>
            <n-form-item label="Motivo" :show-feedback="false">
                <CancellationReasonPicker v-model="form" :reasons="reasons" style="width: 100%" />
            </n-form-item>
            <CancellationAuth v-if="reason" v-model="credentials" :mode="mode" :is-waste="destination === 'WASTE'"
                @submit="submit" />
        </n-space>
        <template #action>
            <n-space justify="end">
                <n-button @click="close">Cancelar</n-button>
                <n-button :type="destination === 'WASTE' ? 'warning' : 'success'" secondary :loading="loading"
                    @click.prevent="submit">
                    {{ destination === 'WASTE' ? 'Registrar merma' : 'Confirmar' }}
                </n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { performDeleteOrderDetail } from "@/api/modules/tables";
import { useCancellationReasons } from "@/composables/useCancellationReasons";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import {
    PERMISSION_CANCEL_DETAIL,
    authError,
    buildRemoveDetailPayload,
    cancellationErrorMessage,
    findReason,
    itemError,
    resolveAuthMode,
    resolveDestination,
} from "@/utils/cancellation";
import CancellationAuth from "./CancellationAuth.vue";
import CancellationReasonPicker from "./CancellationReasonPicker.vue";

const props = defineProps({
    show: { type: Boolean, default: false },
    tableId: { type: [String, Number], required: true },
    // { id, product_name, quantity }
    detail: { type: Object, default: null },
    // Último ítem de la comanda: no se permite anular toda su cantidad (se usa "Anular pedido").
    forbidFullQuantity: { type: Boolean, default: false },
});
const emit = defineEmits(["update:show", "cancelled"]);

const message = useMessage();
const userStore = useUserStore();
const genericsStore = useGenericsStore();
const settingsStore = useSettingsStore();
const { reasons, load } = useCancellationReasons();

const emptyForm = () => ({ reasonCode: null, chosenDestination: null, note: "" });
const form = ref(emptyForm());
const credentials = ref({ username: "", password: "" });
const quantity = ref(1);
const loading = ref(false);

const maxQuantity = computed(() => Number(props.detail?.quantity) || 1);
const reason = computed(() => findReason(reasons.value, form.value.reasonCode));
const destination = computed(() => resolveDestination(reason.value, form.value.chosenDestination));
const mode = computed(() =>
    resolveAuthMode({
        settings: settingsStore.businessSettings?.sale,
        hasPermission: (permission) => userStore.hasPermission(permission),
        scopePermission: PERMISSION_CANCEL_DETAIL,
        destination: destination.value,
    })
);
const modalClass = computed(() => ({
    'w-100': genericsStore.device === 'mobile',
    'w-50': genericsStore.device === 'tablet',
    'w-25': genericsStore.device === 'desktop',
}));

watch(
    () => props.show,
    (visible) => {
        if (!visible) return;
        form.value = emptyForm();
        credentials.value = { username: "", password: "" };
        quantity.value = maxQuantity.value;
        // Se recarga al abrir: el catálogo depende del módulo de mermas en Configuración.
        load(true).catch((error) => {
            console.error(error);
            message.error("No se pudo cargar la lista de motivos de anulación.");
        });
    }
);

const close = () => emit("update:show", false);

const submit = async () => {
    if (loading.value || !props.detail) return;
    if (props.forbidFullQuantity && quantity.value >= maxQuantity.value) {
        message.warning("No es posible anular todos los ítems de la comanda. Para cancelar la mesa completa, utilice la opción Anular pedido.");
        return;
    }
    const validation = itemError(reason.value, form.value.chosenDestination, form.value.note)
        || authError(mode.value, credentials.value);
    if (validation) {
        message.warning(validation);
        return;
    }

    const payload = buildRemoveDetailPayload({
        detailId: props.detail.id,
        quantity: quantity.value,
        reason: reason.value,
        chosenDestination: form.value.chosenDestination,
        note: form.value.note,
        mode: mode.value,
        credentials: credentials.value,
    });

    loading.value = true;
    try {
        const response = await performDeleteOrderDetail(props.tableId, props.detail.id, payload, quantity.value);
        message.success(payload.destination === 'WASTE' ? "Merma registrada" : "Ítem anulado");
        emit("cancelled", { response, payload });
        close();
    } catch (error) {
        console.error(error);
        // Se conserva lo ingresado (salvo la clave) para corregir y reintentar.
        credentials.value = { ...credentials.value, password: "" };
        message.error(cancellationErrorMessage(error, mode.value));
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.cancel-item__name {
    font-weight: 600;
}
</style>
