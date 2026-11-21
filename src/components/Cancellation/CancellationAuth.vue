<template>
    <!-- Bloque de credencial para anulaciones (FLZ-SEC-03 + configuración del negocio). -->
    <div class="cancellation-auth" :class="{ 'is-supervisor': mode === 'supervisor', 'is-general': mode === 'general_pass' }">
        <div class="cancellation-auth__title">{{ title }}</div>
        <div v-if="hint" class="cancellation-auth__hint">{{ hint }}</div>
        <n-form-item v-if="mode === 'supervisor'" label="Usuario del supervisor" :show-feedback="false">
            <n-input :value="modelValue.username" autocomplete="off" placeholder="usuario"
                @update:value="update('username', $event)" />
        </n-form-item>
        <n-form-item :label="passwordLabel" :show-feedback="false">
            <n-input type="password" show-password-on="click" :value="modelValue.password"
                autocomplete="new-password" @update:value="update('password', $event)"
                @keyup.enter="$emit('submit')" />
        </n-form-item>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useUserStore } from "@/store/modules/user";
import { AUTH_MODE_GENERAL } from "@/utils/cancellation";

const props = defineProps({
    // "own" | "supervisor" | "general_pass" (ver resolveAuthMode en utils/cancellation.js)
    mode: { type: String, required: true },
    // { username, password }
    modelValue: { type: Object, required: true },
    isWaste: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "submit"]);

const userStore = useUserStore();
const currentUsername = computed(() => userStore.user?.username || "su usuario");
const isGeneral = computed(() => props.mode === AUTH_MODE_GENERAL);

const title = computed(() => {
    if (isGeneral.value) return "Clave general del negocio";
    return props.mode === "supervisor" ? "Autorización de supervisor" : "Confirme con su clave";
});

const passwordLabel = computed(() => {
    if (isGeneral.value) return "Clave general";
    return props.mode === "supervisor" ? "Clave del supervisor" : `Clave personal de ${currentUsername.value}`;
});

const hint = computed(() => {
    if (isGeneral.value) {
        return "Clave maestra configurada en Ajustes. Con este modo la anulación no queda asociada a una persona.";
    }
    if (props.mode === "supervisor") {
        return props.isWaste
            ? "Usuario y clave personal de alguien con permiso para autorizar mermas. La clave general del negocio no se acepta."
            : "Usuario y clave personal de alguien con permiso para anular. La clave general del negocio no se acepta.";
    }
    return `Ingrese la clave personal de ${currentUsername.value}. La clave general del negocio no se acepta en este modo.`;
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

.cancellation-auth.is-general {
    border-color: #2080f0;
    background: rgba(32, 128, 240, 0.06);
}
</style>
