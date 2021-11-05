<template>
  <n-modal
  :class="{ 'w-100': genericsStore.device === 'mobile', 'w-75': genericsStore.device === 'tablet','w-50': genericsStore.device === 'desktop' }"
  preset="card"
  title="Registrar Proveedor"
  :show="show"
  :on-close="() => $emit('update:show')"
  >
    <n-form>
        <n-grid responsive="screen" cols="10 s:10 m:10 l:10 xl:10 2xl:10" :x-gap="12">
            <n-form-item-gi :span="6" label="Nombres">
                <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="4" label="RUC">
                <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="6" label="Representante">
                <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="4" label="Dirección">
                <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="4" label="Teléfono">
                <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="4" label="Email">
                <n-input />
            </n-form-item-gi>
        </n-grid>
    </n-form>
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
        idSupplier: {
            type: Number,
            default: 0,
        },
    },
    setup(props, {emit}) {
        const isLoadingData = ref(false)
        const genericsStore = useGenericsStore()
        const {idProduct, show} = toRefs(props)

        return {
            isLoadingData,
            genericsStore,
        }
    }
})
</script>

<style>

</style>