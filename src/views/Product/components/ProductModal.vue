<template>
    <n-modal
    :class="{ 'w-100': genericsStore.device === 'mobile', 'w-75': genericsStore.device === 'tablet','w-50': genericsStore.device === 'desktop' }"
    preset="card"
    title="Registrar Producto"
    :show="show"
    :on-close="() => $emit('update:show')"
    >
        <n-spin :show="isLoadingData">
            <n-form>
                <n-grid responsive="screen" cols="6 s:6 m:12 l:24 xl:24 2xl:24" :x-gap="12">
                    <n-form-item-gi label="Nombre" :span="12">
                        <n-input />
                    </n-form-item-gi>
                    <n-form-item-gi label="Description" :span="12">
                        <n-input />
                    </n-form-item-gi>
                    <n-form-item-gi label="Categoría" :span="12">
                        <n-select />
                    </n-form-item-gi>
                    <n-form-item-gi label="Precio" :span="6">
                        <n-input-number />
                    </n-form-item-gi>
                    <n-form-item-gi label="Stock" :span="6">
                        <n-input-number />
                    </n-form-item-gi>
                    <n-form-item-gi label="Lugar Preparación" :span="12">
                        <n-select />
                    </n-form-item-gi>
                    <n-form-item-gi label="ICBPER" :span="6">
                        <n-input />
                    </n-form-item-gi>
                    <n-form-item-gi label="Código de barras" :span="6">
                        <n-input />
                    </n-form-item-gi>
                    <n-form-item-gi label="Nº Puntos" :span="6">
                        <n-input-number />
                    </n-form-item-gi>
                    <n-form-item-gi label="Puntos de canje" :span="6">
                        <n-input-number />
                    </n-form-item-gi>
                    <n-form-item-gi label="Imagen" :span="6">
                        <n-upload list-type="image" ref="uploadRef">
                            <n-button>Select File</n-button>
                        </n-upload>
                    </n-form-item-gi>
                </n-grid>
            </n-form>
        </n-spin>
        <template #action>
            <n-space justify="end">
                <n-button type="primary">Registrar</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs } from "vue"
import {useGenericsStore} from '@/store/modules/generics'

export default defineComponent({
    name: "ProductModal",
    emits: [
        'update:show',
        'on-success',
    ],
    props: {
        show : {
            type: Boolean,
            default: false,
        },
        idProduct: {
            type: Number,
            default: 0,
        },
    },
    setup(props, {emit}) {
        const isLoadingData = ref(false)
        const genericsStore = useGenericsStore()
        const {idProduct, show} = toRefs(props)
        const uploadRef = ref(null)

        return {
            genericsStore,
            isLoadingData,
            uploadRef,
        }
    }
})
</script>

<style>

</style>