<template>
  <div id="Menu">
    <n-card title="Menús" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-space>
          <n-button type="info" tertiary @click="goCreate">Crear menú</n-button>
          <n-button type="info" tertiary @click="goSchedule">Programar menú del día</n-button>
        </n-space>
      </template>

      <n-space justify="space-between">
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
              <n-input v-model:value="filterParams.name" placeholder="Buscar por nombre" />
            </n-form-item-gi>
            <n-form-item-gi label="Estado" :span="4">
              <n-select v-model:value="filterParams.active" :options="activeOptions" placeholder="" clearable />
            </n-form-item-gi>
            <n-form-item-gi :span="5">
              <n-button type="info" secondary @click="performFilter">Buscar</n-button>
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>

      <n-data-table
        class="mt-2"
        :columns="tableColumns"
        :data="menus"
        :loading="isTableLoading"
        :pagination="pagination"
        remote
      />
    </n-card>
    <MenuCreateModal
      v-model:show="showCreateModal"
      :mode="modalMode"
      :menu-id="editingId"
      @success="handleCreated"
      @cancel="handleCancel"
    />
    <MenuProgramation
      v-model:show="showProgramationModal"
      :menu-id="selectedMenuId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useMessage, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { getMenus } from '@/api/modules/menu'
import MenuCreateModal from './components/MenuCreateModal.vue'
import MenuProgramation from './components/MenuProgramation.vue'


const router = useRouter()
const message = useMessage()

const isTableLoading = ref(false)
const menus = ref([])
const showFilters = ref(false)

const filterParams = ref({
  name: '',
  active: null
})

const activeOptions = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' }
]

const pagination = ref({
  pageSearchParams: null,
  total: 0,
  page: 1,
  pageCount: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  async onChange(page) {
    isTableLoading.value = true
    pagination.value.page = page
    await fetchMenus(pagination.value.pageSearchParams, pagination.value.page, pagination.value.pageSize)
    isTableLoading.value = false
  },
  async onPageSizeChange(pageSize) {
    isTableLoading.value = true
    pagination.value.pageSize = pageSize
    await fetchMenus(pagination.value.pageSearchParams, pagination.value.page, pagination.value.pageSize)
    isTableLoading.value = false
  }
})

async function fetchMenus(params = null, page = 1, pageSize = 20) {
  try {
    const response = await getMenus({ search: params?.name, active: params?.active, page, page_size: pageSize })
    const data = response.data
    if (Array.isArray(data)) {
      // sin paginación DRF (fallback)
      menus.value = data
      pagination.value.total = data.length
      pagination.value.pageCount = 1
    } else {
      // con paginación DRF
      menus.value = data.results || []
      const total = Number(data.count || menus.value.length)
      pagination.value.total = total
      let pc = Math.trunc(total / pageSize)
      if (total % pageSize !== 0 || pc === 0) pc += 1
      pagination.value.pageCount = pc
    }
  } catch (error) {
    console.error(error)
    message.error('Error al cargar los menús')
  }
}

async function load() {
  isTableLoading.value = true
  await fetchMenus(null, pagination.value.page, pagination.value.pageSize)
  isTableLoading.value = false
}

function toggleFilters() {
  showFilters.value = !showFilters.value
}

async function performFilter() {
  isTableLoading.value = true
  pagination.value.pageSearchParams = { ...filterParams.value }
  pagination.value.page = 1
  await fetchMenus(pagination.value.pageSearchParams, pagination.value.page, pagination.value.pageSize)
  isTableLoading.value = false
}

async function refreshTable() {
  filterParams.value.name = ''
  filterParams.value.active = null
  pagination.value.pageSearchParams = null
  pagination.value.page = 1
  await load()
}

const showCreateModal = ref(false)
const showProgramationModal = ref(false)


const modalMode = ref('create')
const editingId = ref(null)
const selectedMenuId = ref(null)


function goCreate() {
  modalMode.value = 'create'
  editingId.value = null
  showCreateModal.value = true
}

function goSchedule() {
  message.info('Ir a programar menú del día (pendiente de ruta)')
  // router.push({ name: 'MenuSchedule' })
}

function onSchedule(row) {
  selectedMenuId.value = row.id
  showProgramationModal.value = true
}

function handleCreated(menu) {
  refreshTable()
}
function handleCancel() {
  // no-op for now
}

const tableColumns = [
  { title: 'Nombre', key: 'name' },
  { title: 'Fases', key: 'phases_count', render: (row) => String(row.phases_count ?? 0) },
  { title: 'Precio', key: 'price', render: (row) => {
      const p = Number(row.price ?? 0)
      return `$${p.toFixed(2)}`
    }
  },
  { title: 'Estado', key: 'active', render: (row) => (row.active ? 'Activo' : 'Inactivo') },
  {
    title: 'Opciones', key: 'actions', render: (row) => h('div', { style: 'display:flex; gap:8px;' }, [
      //h(NButton, { size: 'small', text: true, onClick: () => onView(row) }, { default: () => 'Ver' }),
      h(NButton, { size: 'small', text: true, onClick: () => onEdit(row) }, { default: () => 'Editar' }),
      h(NButton, { size: 'small', text: true, onClick: () => onDelete(row) }, { default: () => 'Eliminar' }),
      h(NButton, { size: 'small', text: true, onClick: () => onSchedule(row) }, { default: () => 'Programar' })
    ])
  }
]

function onView(row) { router.push({ name: 'MenuEdit', params: { id: row.id } }) }
function onEdit(row) {
  modalMode.value = 'edit'
  editingId.value = row.id
  showCreateModal.value = true
}
function onDelete(row) { message.info(`Eliminar menú: ${row.name}`) }

onMounted(load)
</script>

<style scoped></style>