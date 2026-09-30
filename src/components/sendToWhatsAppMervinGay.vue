<script setup>

import { ref } from "vue";
import { generateVoucherA4PDF } from "@/hooks/createVoucherA4PDF";
import { useBusinessStore } from "@/store/modules/business";
import { http } from "@/api";
import { useMessage } from "naive-ui";

// eslint-disable-next-line vue/require-valid-default-prop
const props = defineProps({
    dataMessage: { type: Object, required: true },
    dataModal: { type: Object, required: true }
});

const businessStore = useBusinessStore();
const message = useMessage();
const loading = ref(false);

const formValues = ref({
    phone: "",
    message: "",
    prefix: "",
    file: ""
});

const sentFileToWhatsApp = async(info) => {
    loading.value = true;
    try {
        const doc = await generateVoucherA4PDF(info, businessStore, info);
        const pdfBlob = doc.output("blob");
        const formData = new FormData();

        formData.append("file", pdfBlob, "comprobante.pdf");
        formData.append("phone", `51${ formValues.value.phone }`);
        formData.append("message", formValues.value.message);

        const data = await http.post(`sales/${ info.id }/send-file/`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        if (data.status === 200) {
            if (data.data?.fallback_applied) {
                message.warning(
                    data.data.fallback_warning || "Comprobante enviado por servicio de respaldo predeterminado (WhatsApp vinculado desconectado).",
                    { duration: 7000, keepAliveOnHover: true }
                );
            } else {
                message.success("Comprobante A4 enviado con éxito a WhatsApp");
            }
            props.dataModal.show.value = false;
        }
    } catch (err) {
        console.error("Error al enviar el comprobante A4 por WhatsApp:", err);
        message.error("Error al enviar el comprobante por WhatsApp");
    } finally {
        loading.value = false;
    }
};

</script>

<template>
    <n-modal 
        class="flizzy-whatsapp-modal"
        :show="props.dataModal.show.value" 
        @update:show="(val) => props.dataModal.show.value = val"
        @esc="props.dataModal.closeModal" 
        preset="card" 
        style="width: 420px; max-width: 95vw;"
        :mask-closable="false"
        closable
    >
        <template #header>
            <div class="whatsapp-modal-header">
                <div class="whatsapp-icon-circle">
                    <v-icon name="bi-whatsapp" scale="1.3" />
                </div>
                <div class="whatsapp-header-text">
                    <span class="whatsapp-header-title">Enviar Voucher por WhatsApp</span>
                    <span class="whatsapp-header-sub">Comprobante digital directo al cliente</span>
                </div>
            </div>
        </template>

        <div class="whatsapp-form-body">
            <div class="whatsapp-field-group">
                <label class="whatsapp-label">Nro. de Celular del Cliente</label>
                <div class="whatsapp-phone-wrapper">
                    <div class="whatsapp-country-pill">
                        <span>🇵🇪 +51</span>
                    </div>
                    <n-input 
                        class="whatsapp-phone-input"
                        v-model:value="formValues.phone" 
                        maxlength="9" 
                        placeholder="Ej: 987654321"
                        :disabled="loading"
                    />
                </div>
            </div>

            <div class="whatsapp-field-group">
                <label class="whatsapp-label">Mensaje personalizado (opcional)</label>
                <n-input 
                    class="whatsapp-textarea"
                    type="textarea" 
                    v-model:value="formValues.message"
                    placeholder="Estimado cliente, adjuntamos su comprobante de pago. ¡Muchas gracias por su preferencia!"
                    :rows="3"
                    :disabled="loading"
                />
            </div>
        </div>

        <template #action>
            <div class="whatsapp-actions">
                <n-button 
                    class="whatsapp-cancel-btn" 
                    @click="props.dataModal.show.value = false"
                    :disabled="loading"
                >
                    Cancelar
                </n-button>
                <n-button 
                    class="whatsapp-send-btn" 
                    :disabled="loading || formValues.phone.length < 9" 
                    :loading="loading"
                    @click="sentFileToWhatsApp(props.dataMessage)" 
                >
                    <template #icon>
                        <v-icon name="bi-whatsapp" scale="1.1" />
                    </template>
                    Enviar Comprobante
                </n-button>
            </div>
        </template>
    </n-modal>
</template>

<style scoped>
:deep(.flizzy-whatsapp-modal) {
    border-radius: 16px !important;
    box-shadow: 0 12px 36px -4px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(15, 23, 42, 0.08) !important;
}

.whatsapp-modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.whatsapp-icon-circle {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
}

.whatsapp-header-text {
    display: flex;
    flex-direction: column;
}

.whatsapp-header-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
}

.whatsapp-header-sub {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
}

.whatsapp-form-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 0;
}

.whatsapp-field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.whatsapp-label {
    font-size: 11.5px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.02em;
}

.whatsapp-phone-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.whatsapp-country-pill {
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 800;
    color: #15803d;
    white-space: nowrap;
}

.whatsapp-phone-input {
    flex: 1;
}

.whatsapp-phone-input :deep(.n-input) {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    border-radius: 8px;
    --n-border-hover: #25d366 !important;
    --n-border-focus: #128c7e !important;
    --n-box-shadow-focus: 0 0 0 2px rgba(37, 211, 102, 0.25) !important;
}

.whatsapp-textarea :deep(.n-input) {
    border-radius: 8px;
    font-size: 12.5px;
    --n-border-hover: #25d366 !important;
    --n-border-focus: #128c7e !important;
    --n-box-shadow-focus: 0 0 0 2px rgba(37, 211, 102, 0.25) !important;
}

.whatsapp-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.whatsapp-cancel-btn {
    font-weight: 700;
    border-radius: 8px;
    color: #64748b;
}

.whatsapp-send-btn {
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
    color: #ffffff !important;
    font-weight: 800 !important;
    border: none !important;
    border-radius: 9px !important;
    height: 42px !important;
    padding: 0 18px !important;
    box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35) !important;
    transition: all 0.18s ease;
}

.whatsapp-send-btn:not(:disabled):hover {
    background: linear-gradient(135deg, #1ebe5d 0%, #0d6e63 100%) !important;
    box-shadow: 0 6px 18px rgba(37, 211, 102, 0.45) !important;
    transform: translateY(-1px);
}
</style>
