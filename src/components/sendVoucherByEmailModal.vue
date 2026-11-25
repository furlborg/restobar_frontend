<script setup>

import { computed, reactive, ref, watch } from "vue";
import { generateVoucherA4PDF } from "@/hooks/createVoucherA4PDF";
import { useBusinessStore } from "@/store/modules/business";
import { http } from "@/api";
import { useMessage } from "naive-ui";

const props = defineProps({
    dataMessage: { type: Object, required: true },
    dataModal: { type: Object, required: true }
});

const businessStore = useBusinessStore();
const message = useMessage();
const loading = ref(false);
const MAX_PDF_BYTES = 3 * 1024 * 1024;

const form = reactive({
    email: "",
    message: ""
});

const emailError = computed(() => {
    if (!form.email) return false;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
});

const canSend = computed(() => Boolean(form.email.trim()) && !emailError.value && !loading.value);

const clearForm = () => {
    form.email = "";
    form.message = "";
};

const resetForm = () => {
    form.email = props.dataMessage?.customer_email || "";
    form.message = "";
};

watch(
    () => props.dataModal.show.value,
    (visible) => {
        if (visible) resetForm();
    }
);

const closeModal = () => {
    if (loading.value) return;
    clearForm();
    props.dataModal.closeModal?.();
};

const errorMessageFor = (error) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.error;
    if (status === 400) return detail || "Revisa el correo y el archivo antes de enviar.";
    if (status === 403) return "No tienes permiso para enviar comprobantes por correo.";
    if (status === 409) return "El comprobante está anulado y no se puede enviar.";
    if (status === 429) return "Se alcanzó el límite de envíos. Inténtalo más tarde.";
    if (status === 502) return "El servicio de correo no respondió. Inténtalo nuevamente.";
    return "No se pudo enviar el correo. Revisa tu conexión e inténtalo de nuevo.";
};

const sendEmail = async () => {
    if (!canSend.value) return;

    loading.value = true;
    try {
        const doc = await generateVoucherA4PDF(props.dataMessage, businessStore, props.dataMessage);
        const pdfBlob = doc.output("blob");
        if (pdfBlob.size > MAX_PDF_BYTES) {
            message.warning("El PDF supera los 3 MB y no puede enviarse por correo.");
            return;
        }

        const formData = new FormData();
        formData.append("file", pdfBlob, "comprobante.pdf");
        formData.append("email", form.email.trim());
        formData.append("message", form.message.trim());

        const response = await http.post(`sales/${props.dataMessage.id}/send-email/`, formData);

        if (response.status === 200) {
            message.success(`Comprobante enviado a ${form.email.trim()}`);
            clearForm();
            props.dataModal.closeModal?.();
        }
    } catch (error) {
        message.error(errorMessageFor(error));
    } finally {
        loading.value = false;
    }
};

</script>

<template>
    <n-modal
        class="flizzy-email-modal"
        :show="props.dataModal.show.value"
        @update:show="(val) => { if (!val) closeModal(); }"
        @esc="closeModal"
        preset="card"
        style="width: 460px; max-width: 95vw;"
        :mask-closable="false"
        closable
    >
        <template #header>
            <div class="email-modal-header">
                <div class="email-icon-circle">
                    <v-icon name="md-outgoingmail" scale="1.2" />
                </div>
                <div class="email-header-text">
                    <span class="email-header-title">Enviar comprobante por correo</span>
                    <span class="email-header-sub">PDF A4 del comprobante</span>
                </div>
            </div>
        </template>

        <div class="email-form-body">
            <div class="email-field-group">
                <label class="email-label">Correo del cliente</label>
                <n-input
                    v-model:value="form.email"
                    placeholder="cliente@correo.com"
                    :status="emailError ? 'error' : undefined"
                    :disabled="loading"
                    maxlength="254"
                />
                <span v-if="emailError" class="email-error">Ingresa un correo válido.</span>
            </div>

            <div class="email-field-group">
                <label class="email-label">Mensaje (opcional)</label>
                <n-input
                    type="textarea"
                    v-model:value="form.message"
                    placeholder="Estimado cliente, adjuntamos su comprobante de pago."
                    :rows="3"
                    maxlength="500"
                    show-count
                    :disabled="loading"
                />
            </div>
        </div>

        <template #action>
            <div class="email-actions">
                <n-button :disabled="loading" @click="closeModal">Cancelar</n-button>
                <n-button type="info" :disabled="!canSend" :loading="loading" @click="sendEmail">
                    <template #icon><v-icon name="md-outgoingmail" /></template>
                    Enviar comprobante
                </n-button>
            </div>
        </template>
    </n-modal>
</template>

<style scoped>
:deep(.flizzy-email-modal) {
    border-radius: 16px !important;
    box-shadow: 0 12px 36px -4px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(15, 23, 42, 0.08) !important;
}

.email-modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.email-icon-circle {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
}

.email-header-text {
    display: flex;
    flex-direction: column;
}

.email-header-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
}

.email-header-sub {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
}

.email-form-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 0;
}

.email-field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.email-label {
    font-size: 11.5px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.02em;
}

.email-error {
    font-size: 11.5px;
    color: #d03050;
}

.email-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
