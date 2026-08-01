<template>
    <n-modal preset="card" :show="props.dataModal?.show" title="Anular pedido" closable @esc="clearData()"
        @close="clearData()"
        :class="{ 'w-100': genericsStore.device === 'mobile', 'w-50': genericsStore.device === 'tablet', 'w-25': genericsStore.device === 'desktop' }">
        <div v-if="!userStore.hasPermission(props.dataModal?.permission) && userStore.user.role !== 'MOZO'">
            <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                <n-form-item v-if="props.dataModal?.maxQuantity > 1" label="Cantidad a anular">
                    <n-input-number v-model:value="dataAnulate.quantity" :min="1" :max="props.dataModal.maxQuantity" />
                </n-form-item>
                <n-form-item label="Motivo de anulación"
                    :path="settingsStore.businessSettings.sale?.required_null_reason ? 'nullReason' : ''">
                    <n-input v-model:value="dataAnulate.nullReason" placeholder="" />
                </n-form-item>
            </n-form>
        </div>
        <div v-else>
            <div v-if="settingsStore.businessSettings.sale?.require_user_pass_to_null">
                <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                    <n-form-item label="Ingrese su usuario" path="username">
                        <n-input v-model:value="dataAnulate.username" placeholder="" />
                    </n-form-item>
                    <n-form-item label="Ingrese su contraseña" path="pass">
                        <n-input type="password" v-model:value="dataAnulate.pass" placeholder="" />
                    </n-form-item>
                    <n-form-item v-if="props.dataModal?.maxQuantity > 1" label="Cantidad a anular">
                        <n-input-number v-model:value="dataAnulate.quantity" :min="1" :max="props.dataModal.maxQuantity" />
                    </n-form-item>
                    <n-form-item label="Motivo de anulación"
                        :path="settingsStore.businessSettings.sale?.required_null_reason ? 'nullReason' : ''">
                        <n-input v-model:value="dataAnulate.nullReason" placeholder="" />
                    </n-form-item>
                </n-form>
            </div>
            <div v-else-if="settingsStore.businessSettings.sale.require_general_pass_to_null || userStore.user.role === 'MOZO'">
                <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                    <n-form-item label="Ingrese la contraseña general" path="pass">
                        <n-input type="password" v-model:value="dataAnulate.pass" placeholder="Clave de anulación" />
                    </n-form-item>
                    <n-form-item v-if="props.dataModal?.maxQuantity > 1" label="Cantidad a anular">
                        <n-input-number v-model:value="dataAnulate.quantity" :min="1" :max="props.dataModal.maxQuantity" />
                    </n-form-item>
                    <n-form-item label="Motivo de anulación"
                        :path="settingsStore.businessSettings.sale?.required_null_reason ? 'nullReason' : ''">
                        <n-input v-model:value="dataAnulate.nullReason" placeholder="" />
                    </n-form-item>
                </n-form>
            </div>
        </div>
        <div
            v-if="userStore.hasPermission(props.dataModal?.permission) && !settingsStore.businessSettings.sale?.require_user_pass_to_null && !settingsStore.business_settings.sale.require_general_pass_to_null && userStore.user.role !== 'MOZO'">
            <span style="font-weight: 700; font-size: 16px">
                Para poder anular un pedido, primero debe de activar la
                configuración "Requerir clave de usuario para anular" en la sección de configuraciones.
            </span>
        </div>
        <template #action>
            <n-space justify="end">
                <n-button type="info" @click="clearData()">Cancelar</n-button>
                <n-button type="success" :loading="isLoading" @click.prevent="anulateSaleOrOrder()"
                    :disabled="(userStore.hasPermission(props.dataModal?.permission) && !settingsStore.businessSettings.sale?.require_user_pass_to_null && !settingsStore.business_settings.sale.require_general_pass_to_null && userStore.user.role !== 'MOZO') || isLoading">
                    Confirmar
                </n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup>
import { useSettingsStore } from "@/store/modules/settings";
import { ref } from "vue";
import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useMessage } from "naive-ui";

const props = defineProps({
    dataModal: {
        type: Object,
        default: () => { }
    }
});
const settingsStore = useSettingsStore();
const genericsStore = useGenericsStore();
const userStore = useUserStore();
const dataAnulate = ref({ username: "", pass: "", nullReason: "", quantity: 1 });
const formRef = ref();
const isLoading = ref(false);
const message = useMessage();

const clearData = () => {
    dataAnulate.value = { username: "", pass: "", nullReason: "", quantity: 1 };
    isLoading.value = false;
    // eslint-disable-next-line vue/no-mutating-props
    props.dataModal.show = false;
};

const anulateSaleOrOrder = async () => {

    formRef.value.validate(async (errors) => {
        if (!errors) {
            if (props.dataModal?.performNullifySale) {
                props.dataModal?.performNullifySale(props.dataModal?.saleId, dataAnulate.value);
                clearData();
            }
            if (props.dataModal?.performNullifyTableOrder) {
                props.dataModal?.performNullifyTableOrder(props.dataModal?.saleId, dataAnulate.value);
                clearData();
            }
            if (props.dataModal?.performDeleteOrderDetail) {
                props.dataModal?.performDeleteOrderDetail(props.dataModal?.saleId, dataAnulate.value);
                clearData();
            }
        } else {
            message.error("Todos los campos son obligatorios");
        }
    });
};

const rules = {
    username: { required: true, trigger: ["blur", "input"], message: "" },
    pass: { required: true, trigger: ["blur", "input"], message: "" },
    nullReason: { required: true, trigger: ["blur", "input"], message: "" }
};

</script>