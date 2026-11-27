<template>
    <!-- Motivos de merma: crear, renombrar y activar/desactivar (no se borran). -->
    <n-modal :show="show" preset="card" title="Motivos de merma" :mask-closable="!saving" closable
        style="width: min(560px, 95vw)" @update:show="(value) => !value && close()">
        <p class="reasons__intro">
            Son las opciones que aparecen al registrar una merma. Toda merma exige una observación.
            Los motivos no se borran: desactiva los que ya no uses.
        </p>

        <form class="reasons__add" @submit.prevent="create">
            <n-input v-model:value="newName" placeholder="Nuevo motivo (ej.: Cortesía de la casa)" maxlength="120"
                :disabled="saving" />
            <n-button type="primary" attr-type="submit" :loading="creating" :disabled="!canCreate">
                Agregar
            </n-button>
        </form>

        <n-spin :show="loading">
            <div v-if="!rows.length && !loading" class="reasons__empty">No hay motivos de merma.</div>
            <ul v-else class="reasons__list">
                <li v-for="reason in rows" :key="reason.id" class="reason" :class="{ 'is-off': !reason.is_active }">
                    <div class="reason__main">
                        <template v-if="editingId === reason.id">
                            <n-input v-model:value="editingName" size="small" maxlength="120" autofocus
                                @keyup.enter="saveName(reason)" @keyup.esc="cancelEdit" />
                            <div class="reason__edit-actions">
                                <n-button size="small" type="primary" :loading="saving" @click="saveName(reason)">Guardar</n-button>
                                <n-button size="small" quaternary @click="cancelEdit">Cancelar</n-button>
                            </div>
                        </template>
                        <template v-else>
                            <span class="reason__name">{{ reason.description }}</span>
                            <span class="reason__meta">
                                {{ usesText(reason.uses) }}
                                <template v-if="reason.protected"> · Fijo: se usa cuando ningún motivo encaja</template>
                                <template v-else-if="!reason.is_active"> · Inactivo</template>
                            </span>
                        </template>
                    </div>

                    <div v-if="editingId !== reason.id && !reason.protected" class="reason__actions">
                        <n-button size="small" quaternary type="primary" :disabled="saving"
                            @click="startEdit(reason)">Renombrar</n-button>
                        <n-switch :value="reason.is_active" :disabled="saving"
                            @update:value="(value) => saveActive(reason, value)" />
                    </div>
                </li>
            </ul>
        </n-spin>

        <template #action>
            <n-space justify="end">
                <n-button :disabled="saving" @click="close">Cerrar</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { createReason, listManageReasons, updateReason } from "@/api/modules/orders";
import { useCancellationReasons } from "@/composables/useCancellationReasons";

const props = defineProps({
    show: { type: Boolean, default: false },
});
const emit = defineEmits(["update:show"]);

const message = useMessage();
const { load: loadReasons } = useCancellationReasons();

const rows = ref([]);
const loading = ref(false);
const saving = ref(false);
const creating = ref(false);
const newName = ref("");
const editingId = ref(null);
const editingName = ref("");

const canCreate = computed(() => newName.value.trim().length >= 3 && !saving.value);
const usesText = (uses) => (uses === 1 ? "Usado 1 vez" : `Usado ${uses || 0} veces`);

const cancelEdit = () => {
    editingId.value = null;
    editingName.value = "";
};

const close = () => {
    cancelEdit();
    emit("update:show", false);
};

// Activos primero (en su orden de catálogo) y "Otro" al final de los activos.
const sortRows = (list) =>
    [...list].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        if (a.protected !== b.protected) return a.protected ? 1 : -1;
        return (a.order ?? 0) - (b.order ?? 0) || a.id - b.id;
    });

const load = async () => {
    loading.value = true;
    try {
        const response = await listManageReasons();
        rows.value = sortRows(response.data || []);
    } catch (error) {
        console.error(error);
        message.error("No se pudieron cargar los motivos.");
    } finally {
        loading.value = false;
    }
};

// Refresca el catálogo activo que usan las pantallas de registro (useCancellationReasons).
const refreshCatalog = () => loadReasons(true).catch(() => {});

const persist = async (id, payload, successText) => {
    saving.value = true;
    try {
        await updateReason(id, payload);
        await Promise.all([refreshCatalog(), load()]);
        message.success(successText);
        return true;
    } catch (error) {
        console.error(error);
        message.error(error?.response?.data?.error || "No se pudo guardar el motivo.");
        return false;
    } finally {
        saving.value = false;
    }
};

const startEdit = (reason) => {
    editingId.value = reason.id;
    editingName.value = reason.description;
};

const saveName = async (reason) => {
    const description = editingName.value.trim();
    if (description === reason.description) {
        cancelEdit();
        return;
    }
    if (description.length < 3) {
        message.warning("El nombre debe tener al menos 3 caracteres.");
        return;
    }
    if (await persist(reason.id, { description }, "Motivo renombrado")) cancelEdit();
};

const saveActive = (reason, isActive) =>
    persist(reason.id, { is_active: isActive }, isActive ? "Motivo activado" : "Motivo desactivado");

const create = async () => {
    if (!canCreate.value) return;
    saving.value = true;
    creating.value = true;
    try {
        await createReason({ description: newName.value.trim() });
        newName.value = "";
        await Promise.all([refreshCatalog(), load()]);
        message.success("Motivo agregado");
    } catch (error) {
        console.error(error);
        message.error(error?.response?.data?.error || "No se pudo crear el motivo.");
    } finally {
        saving.value = false;
        creating.value = false;
    }
};

watch(
    () => props.show,
    (visible) => {
        if (visible) load();
    },
    { immediate: true }
);
</script>

<style scoped>
.reasons__intro {
    margin: 0 0 14px;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.45;
}

.reasons__add {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
}

.reasons__add .n-input {
    flex: 1 1 auto;
}

.reasons__empty {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    color: #6b7280;
}

.reasons__list {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid #e6e9ef;
    border-radius: 8px;
    max-height: 52vh;
    overflow-y: auto;
}

.reason {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid #eef0f4;
}

.reason:last-child {
    border-bottom: 0;
}

.reason__main {
    display: grid;
    gap: 2px;
    min-width: 0;
    flex: 1 1 auto;
}

.reason__name {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    overflow-wrap: anywhere;
}

.reason__meta {
    font-size: 12px;
    color: #6b7280;
}

.reason.is-off .reason__name {
    color: #9ca3af;
    font-weight: 500;
}

.reason__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
}

.reason__edit-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
}
</style>
