<template>
  <n-card title="Clientes" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <n-button type="primary" @click="">
        <template #icon>
          <n-icon>
            <v-icon name="la-user-plus-solid" />
          </n-icon>
        </template>
        Nuevo
      </n-button>
    </template>
    <n-collapse class="mb-3" arrow-placement="right">
      <n-collapse-item title="Búsqueda" name="1">
        <!-- Search Customer Form -->
        <n-form>
          <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
            <n-form-item-gi label="Tipo Documento" :span="3">
              <n-select :options="documentOptions" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Documento" :span="3">
              <n-input-number :show-button="false" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Nombre" :span="6">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Dirección" :span="6">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Celular" :span="3">
              <n-input-number :show-button="false" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha" :span="3">
              <n-date-picker  type="date" placeholder="" clearable />
            </n-form-item-gi>
            <n-gi :span="6">
              <n-button type="primary">Buscar</n-button>
            </n-gi>
          </n-grid>
        </n-form>
      </n-collapse-item>
    </n-collapse>
    <!-- Customer Data Table -->
    <n-data-table :columns="tableColumns" :data="costumers" :pagination="pagination" :loading="costumerStore.isTableLoading" />
  </n-card>
  <customer-modal :show="showCustomerModal" :customer-id="customerID" />
</template>

<script>
import {defineComponent, onMounted, ref} from "vue"
import {documentOptions, createCostumerColumns} from "@/utils/constants"
import {useMessage} from "naive-ui"
import {http} from '@/api'
import {useCostumerStore} from "@/store/modules/costumer"

export default defineComponent({
  name: "Customer",
  setup() {
    const message = useMessage()
    const costumerStore = useCostumerStore()
    const idCostumer = ref(0)
    const costumers = ref([])

    onMounted(() => {
      document.title = 'Clientes | App'
      getCostumers()
    })

    const getCostumers = () => {
      costumerStore.toggleLoadingTable()
      http.get('customers/')
          .then(response => {
            costumers.value = response.data.results
          })
          .catch(error => {
            console.error(error)
          })
          .finally(() => {
            costumerStore.toggleLoadingTable()
          })
    }

    return {
      costumers,
      costumerStore,
      documentOptions,
      tableColumns: createCostumerColumns({
        editCustomer(rowData) {
          idCostumer.value = rowData.id
          // openCustomerModal()
        },
        deleteCustomer(rowData) {
          message.error('Eliminando cliente ' + rowData.names)
        }
      }),
    }
  }
})
</script>

<style scoped>

</style>