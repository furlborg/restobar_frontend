<template>
  <n-card title="Clientes" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <n-button type="primary" @click="showModal=!showModal">
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
            <n-form-item-gi label="Nº Documento" :span="3">
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
    <n-data-table :columns="tableColumns" :data="customers" :pagination="pagination" :loading="customerStore.isTableLoading" remote />
    <!-- Customer Modal -->
    <customer-modal v-model:show="showModal" :id-customer="idCustomer" @update:show="idCustomer=0" />
  </n-card>
</template>

<script>
import {defineComponent, onMounted, ref, h} from "vue"
import {documentOptions, createCustomerColumns} from "@/utils/constants"
import {useMessage, NButton} from "naive-ui"
import {getCustomers, getCustomersByPageNumber} from "@/api/modules/customer"
import {useCustomerStore} from "@/store/modules/customer"
import CustomerModal from "./components/CustomerModal"

export default defineComponent({
  name: "Customer",
  components: {
    CustomerModal,
  },
  setup() {
    const message = useMessage()
    const customerStore = useCustomerStore()
    const idCustomer = ref(0)
    const customers = ref([])
    const showModal = ref(false)
    const pagination = ref({
      previusPage: null,
      offset: 0,
      page: 1,
      pageCount: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 25, 50, 100],
      next: () => {
        return h(
          NButton,
          {
            bordered: false,
          },
          () => 'Siguiente'
          )
      },
      prev: () => {
        return h(
          NButton,
          {
            bordered: false,
          },
          () => 'Anterior'
          )
      },
      onChange: (page) => {
        customerStore.toggleLoadingTable()
        pagination.value.page = page
        pagination.value.offset = --page * pagination.value.pageSize
        getCustomersByPageNumber(pagination.value.pageSize, pagination.value.offset)
          .then(response => {
            pagination.value.pageCount = Number(response.data.count) / pagination.value.pageSize
            customers.value = response.data.results
          })
          .catch(error => {
            console.error(error)
          })
          .finally(() => {
            customerStore.toggleLoadingTable()
          })
      },
      onPageSizeChange: (pageSize) => {
        customerStore.toggleLoadingTable()
        pagination.value.offset = 0
        pagination.value.page = 1
        pagination.value.pageSize = pageSize
        getCustomersByPageNumber(pageSize, pagination.value.offset)
          .then(response => {
            pagination.value.pageCount = Number(response.data.count) / pagination.value.pageSize
            customers.value = response.data.results
          })
          .catch(error => {
            console.error(error)
          })
          .finally(() => {
            customerStore.toggleLoadingTable()
          })
      }
    })

    onMounted(() => {
      document.title = 'Clientes | App'
      customerStore.toggleLoadingTable()
      pagination.value.offset = 0
      getCustomers()
        .then(response => {
          pagination.value.pageCount = Number(response.data.count) / pagination.value.pageSize
          customers.value = response.data.results
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => {
          customerStore.toggleLoadingTable()
        })
    })
    return {
      showModal,
      pagination,
      customers,
      idCustomer,
      customerStore,
      documentOptions,
      tableColumns: createCustomerColumns({
        editCustomer(rowData) {
          idCustomer.value = rowData.id
          showModal.value = true
        },
        deleteCustomer(rowData) {
          message.error('Eliminando cliente ' + rowData.names)
        }
      }),
    }
  }
})
</script>

<style lang="scss" scoped>

</style>