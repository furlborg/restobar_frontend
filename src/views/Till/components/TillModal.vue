<template>
  <n-modal
    :class="{ 'w-100': genericsStore.device === 'mobile', 'w-50': genericsStore.device === 'tablet','w-25': genericsStore.device === 'desktop' }"
    preset="card"
    title="Registrar Ingreso"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-form>
        <n-form-item label="Concepto">
            <n-input-group>
                <n-select />
                <n-button type="info" @click="showConceptModal = true">
                    <v-icon name="ri-edit-fill" />
                </n-button>
            </n-input-group>
        </n-form-item>
        <n-form-item label="Método Pago">
            <n-select />
        </n-form-item>
        <n-form-item label="Descripción">
            <n-input />
        </n-form-item>
        <n-form-item label="Monto">
            <n-input />
        </n-form-item>
    </n-form>
    <template #action>
        <n-space justify="end">
            <n-button type="success">Registrar</n-button>
        </n-space>
    </template>
    <till-concept-modal v-model:show="showConceptModal" @update:show="onCloseModal" @on-success="onSuccess" />
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue"
import {useGenericsStore} from '@/store/modules/generics'
import TillConceptModal from "./TillConceptModal"

export default defineComponent({
    name: "TillModal",
    components: {
        TillConceptModal,
    },
    emits: [
        'update:show',
        'on-success',
    ],
    props: {
        show : {
            type: Boolean,
            default: false,
        },
        concept: {
            type: String,
        }
    },
    setup() {
        const genericsStore = useGenericsStore()
        const showConceptModal = ref(false)

        const onCloseModal = () => {
            document.title = 'Registrar ingreso | App'
            // idProduct.value = 0
        }

        const onSuccess = () => {
            showConceptModal.value = false
            onCloseModal()
            // loadProductsData()
        }

        return {
            genericsStore,
            showConceptModal,
            onCloseModal,
            onSuccess,
        }
    }
})
</script>

<style>

</style>