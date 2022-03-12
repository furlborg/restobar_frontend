<template>
    <n-modal
        preset="card"
        :title="items.id ? 'Editar Insumo' : 'Registrar Insumo'"
        :show="show"
        style="width: 850px;"
        :on-close="() => $emit('update:show')"
    >
        <n-form v-model:model="formitem" :rules="rules" ref="formRef">
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Nombre" :span="8" path="name">
                    <n-input v-model:value="formitem.name" @input="formitem.name = $event.toUpperCase()" placeholder="Nombres" />
                </n-form-item-gi>
                <n-form-item-gi label="Unidad de medida" :span="4">
                    <n-select v-model:value="formitem.measureunit" placeholder="Seleccione" :options="optionsUND" />
                </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi v-if="!formitem.id" label="Almacen" :span="4">
                    <n-select v-model:value="formitem.branchoffice" placeholder="Seleccione" :options="optionsEstablishment" />
                </n-form-item-gi>
                <n-form-item-gi label="Precio de compra" :span="4" path="purchase_price" >
                    <n-input type="number" v-model:value="formitem.purchase_price" @input="formitem.purchase_price = restrictDecimal(1, formitem.purchase_price)"  placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi v-if="!formitem.id" label="Stock Inicial" :span="4" path="amount">
                    <n-input type="number" v-model:value="formitem.amount" @input="formitem.amount = restrictDecimal(2, formitem.amount)"  placeholder="" />
                </n-form-item-gi>
            </n-grid>
        </n-form>
        <!-- <pre>{{ JSON.stringify(formitem, 0, 2) }}</pre> -->
    <template #action>
        <n-space justify="end">
            <n-button @click="() => $emit('update:show')" ghost>Cancelar</n-button>
            <n-button type="primary" @click="save(formitem)">{{ items.id ? "Guardar" : "Registrar" }}</n-button>
        </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, onUpdated, ref, toRefs } from "vue"
import { useUserStore } from "@/store/modules/user";
import { useMessage } from "naive-ui";
import { createSupplies, updateSupplies, getMeasureUnit } from "@/api/modules/supplies";
import { getBranchs } from "@/api/modules/business";

export default  defineComponent({
    name: 'SuppliesModal',
    emits: [
        'update:show',
        'on-success',
    ],
    props: {
        show : {
            type: Boolean,
            default: false,
        },
        items: {type: Object, default: {}},
    },
    setup(props, {emit}) {
        const formitem = ref({});
        const message = useMessage();
        const formRef = ref(null);
        const optionsUND = ref([]);
        const optionsEstablishment = ref([]);
        const userStore = useUserStore();
        const {show} = toRefs(props);

        const getUND = async () => {
            getMeasureUnit()
            .then((response) => {
                optionsUND.value = response.data.map((v) => ({
                    label: v.description,
                    value: v.id,
                }));
            })
            .catch((error) => {
                message.error("Algo salió mal...");
            })
        }
        getUND();

        const getEstablishment = async () => {
            getBranchs()
            .then((response) => {
                optionsEstablishment.value = [];
                response.data.map((v) => {
                    if (userStore.user.branchoffice == null || userStore.user.profile_des == "ADMINISTRADOR" ) {
                        optionsEstablishment.value.push({
                            label: v.description,
                            value: v.id,
                        })
                    }else{
                        if (userStore.user.branchoffice == v.id) {
                        optionsEstablishment.value.push({
                            label: v.description,
                            value: v.id,
                        })
                        }
                    }
                });
            })
            .catch((error) => {
                message.error("Algo salió mal...");
            })
        }
        getEstablishment();

        onUpdated (() => {
            if (show.value == true) {
                formitem.value = props.items;
                if (optionsEstablishment.value.length > 0) {
                    formitem.value.branchoffice = optionsEstablishment.value[0].value;
                }
            }
        })

        const save = (formitem) => {
            formRef.value.validate(async (errors) => {
                if (!errors) {
                    if (formitem.amount.length > 12) {
                        message.warning("Asegúrese de que no haya más de 12 digitos en el Stock Inicial.");
                    }else{
                        if (formitem.id) {
                            updateSupplies(formitem.id, formitem)
                            .then((response) => {
                                emit("on-success");
                                emit('update:show');
                                message.success("Insumo editado correctamente.");
                            })
                            .catch((error) => {
                                if ('name' in error.response.data) {
                                    message.warning("El nombre ya existe.");
                                }else if ('purchase_price' in error.response.data) {
                                    message.warning("Asegúrese de que no haya más de 12 digitos en Precio.");
                                }else{
                                    message.error("Algo salió mal...");
                                }
                            });
                        }else{
                            createSupplies(formitem)
                            .then((response) => {
                                emit("on-success", response.data);
                                emit('update:show');
                                message.success("Insumo registrado correctamente.");
                            })
                            .catch((error) => {
                                if ('name' in error.response.data) {
                                    message.warning("El nombre ya existe.");
                                }else if ('purchase_price' in error.response.data) {
                                    message.warning("Asegúrese de que no haya más de 12 digitos en Precio.");
                                }else{
                                    message.error("Algo salió mal...");
                                }
                            });
                        }
                    }

                } else {
                    message.warning("Campos Requeridos");
                }
            });
        };


        return {
            formitem,
            formRef,
            save,
            optionsUND,
            optionsEstablishment,
            rules: {
                name: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                purchase_price: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                amount: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                }
            },
            restrictDecimal(option, value) {
                let data;
                if (option == 1) {
                    data = value.match(/^\d+\.?\d{0,2}/);
                }else{
                    data = value.match(/^\d+\.?\d{0,3}/);
                }
                if (data) {
                    return data[0];
                }else{
                    return null
                }
            },
        }
    }
})
</script>

<style>

</style>