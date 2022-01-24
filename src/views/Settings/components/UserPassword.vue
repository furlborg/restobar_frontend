<template>
    <n-modal
        preset="card"
        :show="show"
        :on-close="closeModal"
        :title="items.names"
        style="width: 650px;"
    >
        <n-form v-model:model="formitem" :rules="rules" ref="formRef">
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Contraseña" :span="6" path="password">
                    <n-input type="password" v-model:value="formitem.password" :maxlength="10" show-password-on="click" placeholder="Contraseña" />
                </n-form-item-gi>
                <n-form-item-gi label="Confirmar Contraseña" :span="6" path="confirmPass">
                    <n-input type="password" v-model:value="formitem.confirmPass" :maxlength="10" show-password-on="click" placeholder="Confirmar contraseña" />
                </n-form-item-gi>
            </n-grid>
        </n-form>
        <!-- <pre>{{  JSON.stringify(formitem, 0, 2) }}</pre> -->
        <template #action>
            <n-space justify="end">
                <n-button type="primary" @click="save(formitem)">Guardar</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script>
import { defineComponent, onMounted, onUpdated, ref, toRefs } from "vue"
import { useMessage } from "naive-ui";
import { updatePassword } from "@/api/modules/users";

export default defineComponent({
    name: "UserSettingsModal",
    emits: [
        'update:show',
        'on-success',
    ],
    props: {
        items: {type: Object, default: {}},
        show : {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const {show} = toRefs(props);
        const formitem = ref({});
        const formRef = ref(null);
        const message = useMessage();

        onUpdated (() => {
            if (show.value == true) {
                formitem.value = props.items;
            }
        })

        const closeModal = () => {
            emit("update:show");
        };

        const save = (formitem) => {
            formRef.value.validate(async (errors) => {
                if (!errors) {
                    if(formitem.password !== formitem.confirmPass){
                        message.warning("Las contraseñas no son iguales.");
                    }else{
                        updatePassword(formitem.id, formitem.password)
                        .then((response) => {
                            emit("on-success");
                            closeModal();
                            message.success("Contraseña editada correctamente.");
                        })
                        .catch((error) => {
                            message.error("Algo salió mal...");
                        });
                    }
                } else {
                    message.warning("Campos Requeridos");
                }
            });
        };

        return {
            closeModal,
            formitem,
            formRef,
            save,
            rules: {
                password: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                confirmPass: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
            }
        }
    }
})
</script>

<style lang="scss" scoped>

</style>