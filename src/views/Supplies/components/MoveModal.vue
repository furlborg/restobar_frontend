<template>
    <n-modal
        preset="card"
        :title="type==0? 'Registrar Entrada' : 'Registrar Salida'"
        :show="show"
        style="width: 750px;"
        :on-close="() => $emit('update:show')"
    >
        <n-form v-model:model="formitem" :rules="rules" ref="formRef">
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Insumo" :span="8" path="supplie">
                    <n-select v-model:value="formitem.supplie" placeholder="Buscar..."
                        filterable @search="supplieSearch"  :options="optionsSupplies" clearable />
                </n-form-item-gi>
                <n-form-item-gi label="Cantidad" :span="4" path="amount" >
                    <n-input type="number" v-model:value="formitem.amount"  placeholder="" />
                </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Almacen" :span="8" path="branchoffice">
                    <n-select v-model:value="formitem.branchoffice" placeholder="Seleccione" :options="optionsEstablishment" />
                </n-form-item-gi>
            </n-grid>
            
            <n-grid cols="12 100:1 450:12" :x-gap="12">
                <n-form-item-gi label="Motivo" :span="8" path="concept">
                    <n-select v-model:value="formitem.concept" placeholder="Seleccione" :options="optionsConcept" />
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
import {useGenericsStore} from '@/store/modules/generics'
import { useMessage } from "naive-ui";
import { createSupplieMovement, getConcept, getSupplies } from "@/api/modules/supplies";
import { getBranchs } from "@/api/modules/business";

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
        type: {type: Number, default: null}
    },
    setup(props, {emit}) {
        const formitem = ref({});
        const message = useMessage();
        const formRef = ref(null);
        const optionsConcept = ref([]);
        const optionsEstablishment = ref([]);
        const optionsSupplies = ref([]);
        const genericsStore = useGenericsStore();
        const {show, type} = toRefs(props);

        const getApiConcept = async () => {
            getConcept(`?search=${type.value}`)
            .then((response) => {
                const json = response.data.filter(data => {
                    if (data.concept != "STOCK INICIAL" && data.concept != "VENTA" && data.concept != "COMPRA"){
                    return data;
                    }
                })
                optionsConcept.value = json.map((v) => ({
                    label: v.concept,
                    value: v.id,
                }));
            })
            .catch((error) => {
                message.error("Algo salió mal...");
            })
        }

        const supplieSearch = async (search) => {
            getSupplies(`supplies/search/?search=${search}`)
            .then((response) => {
                optionsSupplies.value = response.data.map((v) => ({
                    label: v.name,
                    value: v.id,
                }));
            })
            .catch((error) => {
                message.error("Algo salió mal...");
            })
        }
        supplieSearch('')

        const getEstablishment = async () => {
            getBranchs()
            .then((response) => {
                optionsEstablishment.value = response.data.map((v) => ({
                    label: v.description,
                    value: v.id,
                }));
            })
            .catch((error) => {
                message.error("Algo salió mal...");
            })
        }
        getEstablishment();

        onUpdated (() => {
            if (show.value == true) {
                getApiConcept();
                formitem.value = props.items;
            }
        })

        const save = (formitem) => {
            formRef.value.validate(async (errors) => {
                if (!errors) {
                    if (formitem.amount == "" || parseInt(formitem.amount) <= 0){
                        message.warning("La cantidad debe ser mayor a 0.");
                    }else{
                        createSupplieMovement(formitem)
                        .then((response) => {
                            emit("on-success");
                            emit('update:show');
                            message.success("Insumo registrado correctamente.");
                        })
                        .catch((error) => {
                            if ('amount' in error.response.data) {
                                message.warning("Asegúrese de que no haya más de 3 decimales.");
                            }else if('error' in error.response.data) {
                                message.warning(error.response.data.error);
                            }else{
                                message.error("Algo salió mal...");
                            }
                        });
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
            genericsStore,
            optionsSupplies,
            supplieSearch,
            optionsConcept,
            optionsEstablishment,
            rules: {
                supplie: {
                    type: "number",
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                amount: {
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                branchoffice: {
                    type: "number",
                    required: true,
                    message: "Requerido",
                    trigger: "blur",
                },
                concept: {
                    type: "number",
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