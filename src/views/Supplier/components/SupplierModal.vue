<template>
    <n-modal
        preset="card"
        :title="items.id ? 'Editar Proveedor' : 'Registrar Proveedor'"
        :show="show"
        style="width: 1000px;"
        :on-close="() => $emit('update:show')"
    >
        <n-form v-model:model="formitem" :rules="rules" ref="formRef">
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Tipo de Documento" :span="6" path="doc_type">
                    <n-select v-model:value="formitem.doc_type" @update:value="changeDoc" placeholder="Seleccione" :options="optionsDocument" />
                </n-form-item-gi>
                <n-form-item-gi label="Documento" :span="6">
                    <n-input v-model:value="formitem.document" @paste.prevent @keypress="onlyNumber" :disabled="disabledInput" :maxlength="total" show-count placeholder="Documento" />
                </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Nombre" :span="6" path="names">
                    <n-input v-model:value="formitem.names" placeholder="Nombres" :maxlength="100" @input="formitem.names = $event.toUpperCase()" />
                </n-form-item-gi>
                <n-form-item-gi label="Representante legal" :span="6" path="representative">
                    <n-input v-model:value="formitem.representative" placeholder="Representante" :maxlength="100" @input="formitem.representative = $event.toUpperCase()" />
                </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Telefono" :span="4">
                    <n-input v-model:value="formitem.phone" placeholder="Telefono" :maxlength="12" />
                </n-form-item-gi>
                <n-form-item-gi label="Corrreo Electrónico" :span="8">
                    <n-input v-model:value="formitem.email" placeholder="Correo@ejemplo.com" :maxlength="100" />
                </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <template
                    v-for="(address, index) in formitem.address"
                    :key="index"
                >
                    <n-form-item-gi label="Dirección" :span="12">
                        <n-input-group>
                            <n-cascader
                                separator=" ⏵ "
                                :options="ubigeeOptions"
                                placeholder="Seleccione Ubigeo"
                                v-model:value="formitem.address[index].ubigeo"
                                check-strategy="child"
                                filterable
                            />
                            <n-input
                                v-model:value="formitem.address[index].address"
                                placeholder=""
                            />
                            <n-popconfirm v-if="index > 0">
                                <template #trigger>
                                    <n-button type="error" secondary>
                                    <v-icon name="md-deletesweep-round" />
                                    </n-button>
                                </template>
                                ¿Está seguro?
                                <template #action>
                                    <n-button
                                    type="error"
                                    size="small"
                                    @click="popAddress(index)"
                                    >
                                    Sí
                                    </n-button>
                                </template>
                            </n-popconfirm>
                        </n-input-group>
                    </n-form-item-gi>
                    <n-form-item-gi v-if="index == 0" :span="12" style="margin-top: -30px">
                        <n-button class="w-100" type="info" dashed @click="addAddress">Agregar dirección</n-button>
                    </n-form-item-gi>
                </template>
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
import { computed, defineComponent, onUpdated, ref, toRefs } from "vue"
import {useGenericsStore} from '@/store/modules/generics'
import { useCustomerStore } from "@/store/modules/customer";
import { useMessage } from "naive-ui";
import { createSupplier, updateSupplier } from "@/api/modules/supplier";

export default  defineComponent({
    name: 'SupplierModal',
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
        const total = ref(8);
        const disabledInput = ref(false);
        const customerStore = useCustomerStore();
        const genericsStore = useGenericsStore();
        const {show} = toRefs(props);
        const ubigeeOptions = computed(() => {
            return customerStore.ubigee;
        });

        const changeDoc = () => {
            if (formitem.value.doc_type == "1") {
                total.value = 8;
                formitem.value.document = "";
                disabledInput.value = false;
            } else if (formitem.value.doc_type == "6") {
                total.value = 11;
                formitem.value.document = "";
                disabledInput.value = false;
            }else{
                formitem.value.document = null;
                disabledInput.value = true;
            }
        };

        const popAddress = (address) => {
            formitem.value.address.splice(address, 1);
        };

        const addAddress = () => {
            formitem.value.address.push({
                ubigeo: null,
                address: ""
            });
        }

        onUpdated (() => {
            if (show.value == true) {
                formitem.value = props.items;
                if (formitem.value.doc_type == "1") {
                    total.value = 8;
                    disabledInput.value = false;
                }else if (formitem.value.doc_type == "6"){
                    total.value = 11;
                    disabledInput.value = false;
                }else{
                    disabledInput.value = true;
                }
            }
        })

        const save = (formitem) => {
            formRef.value.validate(async (errors) => {
                if(formitem.doc_type == "1" && formitem.document.length < 8 || formitem.document == ""){
                    message.warning("Necesitas ingresar DNI.");
                }else if(formitem.doc_type == "6" && formitem.document.length < 11 || formitem.document == ""){
                    message.warning("Necesitas ingresar RUC.");
                }else {
                    if (!errors) {
                        if (formitem.id) {
                            updateSupplier(formitem.id, formitem)
                            .then((response) => {
                                emit("on-success");
                                emit('update:show');
                                message.success("Proveedor editado correctamente.");
                            })
                            .catch((error) => {
                                if ('document' in error.response.data) {
                                    message.warning("El documento existe.");
                                }else if ('email' in error.response.data) {
                                    message.warning("El correo ya existe.");
                                }else if ('phone' in error.response.data) {
                                    message.warning("El telefono ya existe.");
                                }else{
                                    message.error("Algo salió mal...");
                                }
                            });
                        }else{
                            createSupplier(formitem)
                            .then((response) => {
                                emit("on-success");
                                emit('update:show');
                                message.success("Proveedor registrado correctamente.");
                            })
                            .catch((error) => {
                                if ('document' in error.response.data) {
                                    message.warning("El documento existe.");
                                }else if ('email' in error.response.data) {
                                    message.warning("El correo ya existe.");
                                }else if ('phone' in error.response.data) {
                                    message.warning("El telefono ya existe.");
                                }else{
                                    message.error("Algo salió mal...");
                                }
                            });
                        }
                    } else {
                        message.warning("Campos Requeridos");
                    }
                }
            });
        };


        return {
            formitem,
            formRef,
            popAddress,
            addAddress,
            save,
            changeDoc,
            ubigeeOptions,
            total,
            disabledInput,
            genericsStore,
            optionsDocument: [{
                    label: "Sin Documento",
                    value: '0'
                },
                {
                    label: "DNI",
                    value: '1'
                },
                {
                    label: "RUC",
                    value: '6'
                }
            ],
            rules: {
                doc_type: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                names: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                representative: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                }
            },
            onlyNumber: (e) => {
                let keyCode = (e.keyCode ? e.keyCode : e.which);
                if ((keyCode < 48 || keyCode > 57)) {
                    e.preventDefault();
                }
            }
        }
    }
})
</script>

<style>

</style>