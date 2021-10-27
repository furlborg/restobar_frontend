<template>
  <n-modal
    :class="{ 'w-100': genericsStore.device === 'mobile', 'w-50': genericsStore.device === 'tablet','w-25': genericsStore.device === 'desktop' }"
    preset="card"
    title="Crear nuevo concepto"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-form>
        <n-form-item label="Tipo">
            <n-select />
        </n-form-item>
        <n-form-item label="Descripción">
            <n-input />
        </n-form-item>
    </n-form>
    <template #action>
        <n-space justify="end">
            <n-button type="success">Crear</n-button>
        </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue"
import {useGenericsStore} from '@/store/modules/generics'

export default defineComponent({
    name: "TillConceptModal",
    props: {
        show : {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const genericsStore = useGenericsStore()

        return {
            genericsStore,
        }
    }
})
</script>

<style>

</style>