<template>
  <div id="Supplier">
      <n-card title="Proveedores">
          <template #header-extra>
            <n-button type="info" @click=" showModal=true">Agregar</n-button>
          </template>
          <n-form>
            <n-input-group class="w-25">
                <n-input />
                <n-button type="info">
                    <v-icon name="md-search-round" />
                </n-button>
            </n-input-group>
          </n-form>
          <n-data-table class="mt-2" :columns="columns" :data="suppliers" :pagination="pagination" />
      </n-card>
      <supplier-modal v-model:show="showModal" @update:show="onCloseModal" @on-success="onSuccess" />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue"
import {createSuppliersColumns} from "@/utils/constants"
import SupplierModal from "./components/SupplierModal"

export default defineComponent({
    name: 'Supplier',
    components: {
        SupplierModal,
    },
    setup() {
        const showModal = ref(false)
        const suppliers = ref([
            {
                code: 'PROV001',
                ruc: '20533695532',
                names: 'INVERSIONES KIARA DEXTRE S.R.L.',
                legal_representative: 'YESICA BAZAN VERDE DE DEXTRE',
                address: 'ANCASH/HUARAZ/INDEPENDENCIA',
                email: 'kiaradextresrl@gmail.com',
                phone: '043428359',
                status: true,
            }
        ])
        const pagination = ref({
            page: 1,
        })

        const onCloseModal = () => {
            document.title = 'Productos | App'
            // idProduct.value = 0
        }

        const onSuccess = () => {
            showModal.value = false
            onCloseModal()
            // loadProductsData()
        }

        onMounted(() => {
            document.title = 'Proveedores | App'
        })

        return {
            showModal,
            onCloseModal,
            onSuccess,
            suppliers,
            pagination,
            columns: createSuppliersColumns({
                editSupplier(rowData) {
                    console.log(rowData)
                    /* showModal.value = true
                    idCustomer.value = rowData.id */
                },
                deleteSupplier(rowData) {
                    console.log(rowData)
                    /* dialog.error({
                        title: 'Deshabilitando cliente',
                        content: '¿Está seguro?',
                        positiveText: 'Sí',
                        onPositiveClick: () => {
                        performDisableCustomer(rowData.id)
                        }
                    }) */
                }
            }),
        }
    }
})
</script>

<style>

</style>