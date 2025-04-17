<script setup>

import { ref } from "vue";
import { generateVoucherPDF } from "@/hooks/createTicketOscarPuta";
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
    phone: "989260750",
    message: "HOLA TE MANDAMOS A LA VERGA JUNTO CON TU COMPROBANTE DE NO SE QUE",
    prefix: "",
    file: ""
});

const sentFileToWhatsApp = async(info) => {
    loading.value = true;
    const pdfBlob = await generateVoucherPDF(JSON.parse(info.json_sale), businessStore, info);
    const formData = new FormData();

    formData.append("file", pdfBlob, "voucher.pdf");
    formData.append("phone", `51${ formValues.value.phone }`);
    formData.append("message", formValues.value.message);

    try {
        const data = await http.post(`sales/${ info.id }/send-file/`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        if (data.status === 200) {
            message.success("Enviado con éxito");
            props.dataModal.show.value = false;
            console.log("Enviado con éxito:", data);
            loading.value = false;

        }
    } catch (err) {
        console.error("Error al enviar el archivo:", err);
        loading.value = false;
    }
};

</script>

<template>
    <n-modal title="Enviar Voucher a WhatsApp" :show="props.dataModal.show.value" @update:show="(val) => props.dataModal.show.value = val"
             @esc="props.dataModal.closeModal" preset="card" style="width: 350px">
        <n-grid cols="12">
            <n-form-item-gi label="Nro. Celular" span="12">
                <n-input-group>
                    <n-input value="51" disabled style="width: 50px"/>
                    <n-input v-model:value="formValues.phone" maxlength="9"/>
                </n-input-group>
            </n-form-item-gi>
            <n-form-item-gi label="Mensaje" span="12">
                <n-input type="textarea" v-model:value="formValues.message"/>
            </n-form-item-gi>
            <n-form-item-gi :show-label="false" span="12">
                <n-button :disabled="loading" @click="sentFileToWhatsApp(props.dataMessage)" type="success" style="width: 100%">
                    Enviar Voucher a WhatsApp
                    <template #icon>
                        <v-icon name="bi-whatsapp"/>
                    </template>
                </n-button>
            </n-form-item-gi>
        </n-grid>
    </n-modal>
</template>
