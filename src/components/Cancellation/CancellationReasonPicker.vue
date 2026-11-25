<template>
    <!-- Motivo + destino + observación de una anulación (FLZ-MER-07/08). -->
    <div class="reason-picker">
        <n-select :value="modelValue.reasonCode" :options="reasonOptions" placeholder="Seleccione un motivo"
            :size="compact ? 'small' : 'medium'" @update:value="update('reasonCode', $event)" />

        <div v-if="reason" class="reason-picker__destination">
            <template v-if="reason.destination === 'CHOICE' && wasteEnabled">
                <n-radio-group :value="modelValue.chosenDestination" :size="compact ? 'small' : 'medium'"
                    @update:value="update('chosenDestination', $event)">
                    <n-radio-button value="STOCK">Vuelve al stock</n-radio-button>
                    <n-radio-button value="WASTE">Merma</n-radio-button>
                </n-radio-group>
            </template>
            <n-tag v-else :type="destination === 'WASTE' ? 'warning' : 'success'" size="small" :bordered="false">
                {{ destination === 'WASTE' ? 'Merma: no vuelve al stock' : 'Vuelve al stock' }}
            </n-tag>
        </div>

        <n-input v-if="reason && (reason.requires_note || !compact)" :value="modelValue.note"
            :size="compact ? 'small' : 'medium'"
            :placeholder="reason.requires_note ? 'Observación (obligatoria)' : 'Observación (opcional)'"
            @update:value="update('note', $event)" />
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useSettingsStore } from "@/store/modules/settings";
import { findReason, resolveDestination, wasteModuleEnabled } from "@/utils/cancellation";

const props = defineProps({
    // { reasonCode, chosenDestination, note }
    modelValue: { type: Object, required: true },
    reasons: { type: Array, default: () => [] },
    compact: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const settingsStore = useSettingsStore();
// Módulo de mermas apagado: "Otro" solo puede volver al stock (el backend ya oculta los motivos de merma).
const wasteEnabled = computed(() => wasteModuleEnabled(settingsStore.businessSettings));

const reasonOptions = computed(() => props.reasons.map((r) => ({ label: r.description, value: r.code })));
const reason = computed(() => findReason(props.reasons, props.modelValue.reasonCode));
const destination = computed(() => resolveDestination(reason.value, props.modelValue.chosenDestination));

const update = (field, value) => {
    const next = { ...props.modelValue, [field]: value };
    // Al cambiar de motivo se descarta el destino elegido para "Otro"
    // (sin módulo de mermas, "Otro" siempre vuelve al stock).
    if (field === "reasonCode") next.chosenDestination = wasteEnabled.value ? null : "STOCK";
    emit("update:modelValue", next);
};
</script>

<style scoped>
.reason-picker {
    display: grid;
    gap: 8px;
    min-width: 0;
}
</style>
