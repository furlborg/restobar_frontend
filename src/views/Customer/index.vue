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
              <n-select v-model:value="searchParams.doc_type" :options="documentOptions" placeholder="" clearable />
            </n-form-item-gi>
            <n-form-item-gi label="Nº Documento" :span="3">
              <n-input-number v-model:value="searchParams.doc_num" :show-button="false" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Nombre" :span="6">
              <n-input v-model:value="searchParams.names" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Dirección" :span="6">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Celular" :span="3">
              <n-input-number v-model:value="searchParams.phone" :show-button="false" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha" :span="3">
              <n-date-picker  type="date" placeholder="" clearable />
            </n-form-item-gi>
            <n-gi :span="6">
              <n-button type="primary" @click="performSearch">Buscar</n-button>
            </n-gi>
          </n-grid>
        </n-form>
      </n-collapse-item>
    </n-collapse>
    <n-space class="mb-2" justify="end">
      <n-button type="info" @click="refreshTable">
        <v-icon name="hi-solid-refresh" />
      </n-button>
    </n-space>
    <!-- Customer Data Table -->
    <n-data-table :columns="tableColumns" :data="customers" :pagination="pagination" :loading="isTableLoading" remote />
    <!-- Customer Modal -->
    <customer-modal v-model:show="showModal" :id-customer="idCustomer" @update:show="idCustomer=0" />
  </n-card>
</template>

<script>
import {defineComponent, onMounted, ref, h} from "vue"
import {documentOptions, createCustomerColumns} from "@/utils/constants"
import {useMessage, NButton} from "naive-ui"
import {getCustomers, getCustomersByPageNumber, searchCustomers} from "@/api/modules/customer"
import CustomerModal from "./components/CustomerModal"

export default defineComponent({
  name: "Customer",
  components: {
    CustomerModal,
  },
  setup() {
    const message = useMessage()
    const isTableLoading = ref(false)
    const showModal = ref(false)
    const idCustomer = ref(0)
    const customers = ref([])
    const searchParams = ref({
      doc_type: null,
      doc_num: null,
      names: null,
      address: null,
      phone: null
    })
    const pagination = ref({
      pageSearchParams: null,
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
            text: true,
          },
          () => 'Siguiente'
          )
      },
      prev: () => {
        return h(
          NButton,
          {
            text: true,
          },
          () => 'Anterior'
          )
      },
      onChange: (page) => {
        isTableLoading.value = !isTableLoading.value
        pagination.value.page = page
        pagination.value.offset = --page * pagination.value.pageSize
        getCustomersByPageNumber(pagination.value.pageSearchParams, pagination.value.pageSize, pagination.value.offset)
          .then(response => {
            pagination.value.pageCount = Math.trunc(Number(response.data.count) / pagination.value.pageSize)
            if  (Number(response.data.count) % pagination.value.pageSize !== 0 ) {
              ++pagination.value.pageCount
            }
            customers.value = response.data.results
          })
          .catch(error => {
            console.error(error)
          })
          .finally(() => {
            isTableLoading.value = !isTableLoading.value
          })
      },
      onPageSizeChange: (pageSize) => {
        isTableLoading.value = !isTableLoading.value
        pagination.value.offset = 0
        pagination.value.page = 1
        pagination.value.pageSize = pageSize
        getCustomersByPageNumber(pagination.value.pageSearchParams, pageSize, pagination.value.offset)
          .then(response => {
            pagination.value.pageCount = Math.trunc(Number(response.data.count) / pagination.value.pageSize)
            if  (Number(response.data.count) % pagination.value.pageSize !== 0 ) {
              ++pagination.value.pageCount
            }
            customers.value = response.data.results
          })
          .catch(error => {
            console.error(error)
          })
          .finally(() => {
            isTableLoading.value = !isTableLoading.value
          })
      }
    })

    const loadCustomersData = () => {
      isTableLoading.value = !isTableLoading.value
      pagination.value.offset = 0
      pagination.value.page = 1
      getCustomers()
        .then(response => {
          pagination.value.pageCount = Math.trunc(Number(response.data.count) / pagination.value.pageSize)
          if  (Number(response.data.count) % pagination.value.pageSize !== 0 ) {
            ++pagination.value.pageCount
          }
          customers.value = response.data.results
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => {
          isTableLoading.value = !isTableLoading.value
        })
    }

    const performSearch = () => {
      isTableLoading.value = !isTableLoading.value
      pagination.value.pageSearchParams = searchParams.value
      pagination.value.offset = 0
      pagination.value.page = 1
      searchCustomers(pagination.value.pageSearchParams, pagination.value.pageSize, pagination.value.offset)
        .then(response => {
          pagination.value.pageCount = Math.trunc(Number(response.data.count) / pagination.value.pageSize)
          if  (Number(response.data.count) % pagination.value.pageSize !== 0 ) {
            ++pagination.value.pageCount
          }
          customers.value = response.data.results
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => {
          isTableLoading.value = !isTableLoading.value
        })
    }

    const refreshTable = () => {
      pagination.value.pageSearchParams = null
      loadCustomersData()
    }

    onMounted(() => {
      document.title = 'Clientes | App'
      loadCustomersData()
    })

    return {
      isTableLoading,
      showModal,
      pagination,
      customers,
      searchParams,
      idCustomer,
      performSearch,
      refreshTable,
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