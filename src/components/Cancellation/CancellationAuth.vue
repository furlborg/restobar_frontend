<template>
    <!-- Bloque de credencial para anulaciones (FLZ-SEC-03). Reemplaza la clave general. -->
    <div class="cancellation-auth" :class="{ 'is-supervisor': mode === 'supervisor' }">
        <div class="cancellation-auth__title">
            {{ mode === 'supervisor' ? 'Autorización de supervisor' : 'Confirme con su clave' }}
        </div>
        <div v-if="hint" class="cancellation-auth__hint">{{ hint }}</div>
        <n-form-item v-if="mode === 'supervisor'" label="Usuario del supervisor" :show-feedback="false">
            <n-input :value="modelValue.username" autocomplete="off" placeholder="usuario"
                @update:value="update('username', $event)" />
        </n-form-item>
        <n-form-item :label="mode === 'supervisor' ? 'Clave del supervisor' : 'Su clave'" :show-feedback="false">
            <n-input type="password" show-password-on="click" :value="modelValue.password"
                autocomplete="new-password" @update:value="update('password', $event)"
                @keyup.enter="$emit('submit')" />
        </n-form-item>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    // "own" | "supervisor" (ver authMode en utils/cancellation.js)
    mode: { type: String, required: true },
    // { username, password }
    modelValue: { type: Object, required: true },
    isWaste: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "submit"]);

const hint = computed(() => {
    if (props.mode !== "supervisor") return "";
    return props.isWaste
        ? "La merma la autoriza un usuario con permiso para autorizar mermas."
        : "No tiene permiso para anular: la anulación la autoriza un supervisor.";
});

const update = (field, value) => emit("update:modelValue", { ...props.modelValue, [field]: value });
</script>

<style scoped>
.cancellation-auth {
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--n-border-color, #e0e0e6);
}

.cancellation-auth.is-supervisor {
    border-color: #f0a020;
    background: rgba(240, 160, 32, 0.08);
}

.cancellation-auth__title {
    font-weight: 700;
}

.cancellation-auth__hint {
    font-size: 13px;
    opacity: 0.8;
}
</style>
