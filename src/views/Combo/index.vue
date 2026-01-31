<template>
  <div id="Combo">
    <n-card title="Combos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-space>
          <n-button v-if="canAddCombo" type="success" @click="goCreate">
            <template #icon>
              <v-icon name="md-add-round" />
            </template>
            Crear combo
          </n-button>
        </n-space>
      </template>

      <n-space justify="space-between" class="mb-3">
        <n-button type="info" text @click="toggleFilters">
          <v-icon name="md-filteralt-round" />
          {{ showFilters ? 'Ocultar Filtros' : 'Mostrar filtros' }}
        </n-button>
        <div class="d-flex">
          <n-button type="info" text @click="refreshTable">
            <v-icon name="hi-solid-refresh" />
            Recargar
          </n-button>
        </div>
      </n-space>

      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
            <n-form-item-gi label="Nombre" :span="6">
              <n-input v-model:value="filterParams.search" placeholder="Buscar por nombre" clearable />
            </n-form-item-gi>
            <n-form-item-gi label="Categoría" :span="6">
              <n-select 
                v-model:value="filterParams.category_id" 
                :options="categoryOptions" 
                placeholder="Todas las categorías"
                clearable
                filterable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Modo de precio" :span="5">
              <n-select 
                v-model:value="filterParams.pricing_mode" 
                :options="pricingModeOptions" 
                placeholder="Todos"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi :span="5">
              <n-button type="info" @click="performFilter">Buscar</n-button>
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>

      <n-data-table
        class="mt-3"
        :columns="tableColumns"
        :data="combos"
        :loading="isTableLoading"
        :pagination="pagination"
        :row-key="row => row.id"
        remote
        @update:page="handlePageChange"
      />
    </n-card>

    <!-- Modal Create/Edit -->
    <ComboFormModal
      v-model:show="showFormModal"
      :combo-id="selectedComboId"
      :mode="formMode"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NButton, NSpace, NTag } from 'naive-ui'
import ComboFormModal from './components/ComboFormModal.vue'
import { getCombos, deleteCombo, getCategories } from '@/api/modules/products'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

// State
const showFilters = ref(false)
const showFormModal = ref(false)
const isTableLoading = ref(false)
const combos = ref([])
const categoryOptions = ref([])
const selectedComboId = ref(null)
const formMode = ref('create') // 'create' or 'edit'

const canViewCombo = computed(() => userStore.hasPermission('view_combo'))
const canAddCombo = computed(() => userStore.hasPermission('add_combo'))
const canChangeCombo = computed(() => userStore.hasPermission('change_combo'))
const canDeleteCombo = computed(() => userStore.hasPermission('delete_combo'))

const filterParams = reactive({
  search: '',
  category_id: null,
  pricing_mode: null,
  is_deleted: false,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const pricingModeOptions = [
  { label: 'Precio Fijo', value: 'FIXED' },
  { label: 'Precio Variable', value: 'VARIABLE' },
]

// Table columns
const tableColumns = computed(() => {
  const columns = [
    {
      title: 'ID',
      key: 'id',
      width: 60,
    },
    {
      title: 'Nombre',
      key: 'name',
      ellipsis: {
        tooltip: true
      },
    },
    {
      title: 'Categoría',
      key: 'category_name',
      render(row) {
        return row.combo_category_name || '-'
      },
    },
    {
      title: 'Modo de Precio',
      key: 'pricing_mode',
      width: 140,
      render(row) {
        const typeMap = {
          FIXED: { label: 'Precio Fijo', type: 'success' },
          VARIABLE: { label: 'Precio Variable', type: 'info' },
        }
        const config = typeMap[row.pricing_mode] || { label: row.pricing_mode, type: 'default' }
        return h(NTag, { type: config.type, size: 'small' }, { default: () => config.label })
      },
    },
    {
      title: 'Precio',
      key: 'price',
      width: 100,
      render(row) {
        return `S/ ${parseFloat(row.computed_price || 0).toFixed(2)}`
      },
    },
    {
      title: 'Items',
      key: 'items_count',
      width: 80,
      render(row) {
        return row.items?.length || 0
      },
    },
  ]

  if (canChangeCombo.value || canDeleteCombo.value) {
    columns.push({
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render(row) {
        const actions = []
        if (canChangeCombo.value) {
          actions.push(h(NButton, {
            size: 'small',
            type: 'info',
            secondary: true,
            onClick: () => handleEdit(row.id)
          }, { default: () => 'Editar' }))
        }
        if (canDeleteCombo.value) {
          actions.push(h(NButton, {
            size: 'small',
            type: 'error',
            secondary: true,
            onClick: () => handleDelete(row.id, row.name)
          }, { default: () => 'Eliminar' }))
        }
        return h(NSpace, { justify: 'center' }, { default: () => actions })
      },
    })
  }

  return columns
})

// Methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const goCreate = () => {
  selectedComboId.value = null
  formMode.value = 'create'
  showFormModal.value = true
}

const handleEdit = (comboId) => {
  if (!canChangeCombo.value) {
    message.error('No tienes permisos para editar combos')
    return
  }
  selectedComboId.value = comboId
  formMode.value = 'edit'
  showFormModal.value = true
}

const handleDelete = (comboId, comboName) => {
  if (!canDeleteCombo.value) {
    message.error('No tienes permisos para eliminar combos')
    return
  }
  dialog.warning({
    title: 'Confirmar eliminación',
    content: `¿Estás seguro de eliminar el combo "${comboName}"?`,
    positiveText: 'Eliminar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      try {
        await deleteCombo(comboId)
        message.success('Combo eliminado correctamente')
        await fetchCombos()
      } catch (error) {
        message.error('Error al eliminar combo: ' + (error.response?.data?.message || error.message))
      }
    }
  })
}

const handleFormSuccess = () => {
  showFormModal.value = false
  fetchCombos()
}

const performFilter = () => {
  pagination.page = 1
  fetchCombos()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchCombos()
}

const refreshTable = () => {
  fetchCombos()
}

const fetchCombos = async () => {
  if (!canViewCombo.value) {
    combos.value = []
    pagination.itemCount = 0
    pagination.pageCount = 1
    isTableLoading.value = false
    return
  }
  isTableLoading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      set_type: 'COMBO',
      ...filterParams,
    }
    
    // Remove null/undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })

    const response = await getCombos(params)
    
    combos.value = response.data.results || response.data
    pagination.itemCount = response.data.count || combos.value.length
    pagination.pageCount = Math.ceil(pagination.itemCount / pagination.pageSize)
  } catch (error) {
    message.error('Error al cargar combos: ' + (error.response?.data?.message || error.message))
    combos.value = []
  } finally {
    isTableLoading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await getCategories()
    const categories = response.data.results || response.data
    categoryOptions.value = categories.map(cat => ({
      label: cat.description || cat.name,
      value: cat.id
    }))
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchCombos()
  fetchCategories()
})
</script>

<style scoped>
#Combo {
  padding: 20px;
}

.d-flex {
  display: flex;
  gap: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 12px;
}

.mt-3 {
  margin-top: 16px;
}
</style>
