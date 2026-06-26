<template>
  <div class="page-wrap">
    <n-card size="small" class="mb-12">
      <template #header>
        <div class="card-title">Productos Vendidos</div>
      </template>

      <n-form inline label-width="auto" :show-feedback="false" @submit.prevent>
        <n-form-item label="Rango de fechas">
          <n-date-picker
            v-model:value="range"
            type="daterange"
            clearable
            :is-date-disabled="disableFuture"
            @update:value="onRangeChange"
          />
        </n-form-item>

        <n-form-item label="Producto">
          <n-select
            v-model:value="filters.product"
            :options="productOptions"
            filterable
            clearable
            placeholder="Todos"
            :virtual-scroll="false"
            style="min-width: 250px"
          />
        </n-form-item>

        <n-form-item label="Categoría">
          <n-select
            v-model:value="filters.category"
            :options="categoryOptions"
            filterable
            clearable
            placeholder="Todas"
            :virtual-scroll="false"
            style="min-width: 250px"
          />
        </n-form-item>

        <n-form-item>
          <n-button type="primary" :loading="loading" @click="fetchData">
            Buscar
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-button tertiary :loading="downloading" @click="onDownload">
            Descargar Excel
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card size="small">
      <div class="table-summary">
        Total productos: {{ rows.length }}
      </div>
      <n-data-table :columns="columns" :data="rows" :loading="loading" />
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { NCard, NForm, NFormItem, NButton, NDatePicker, NSelect, NDataTable } from 'naive-ui'
import { getProductsAll, downloadProductsSoldReport, getProductsSold } from '@/api/modules/products'
import { useProductStore } from '@/store/modules/product'

const productStore = useProductStore()
const range = ref(null) // [timestampStart, timestampEnd]
const filters = ref({ date_from: '', date_to: '', product: undefined, category: undefined })
const loading = ref(false)
const downloading = ref(false)

const products = ref([])
const productOptions = computed(() => {
  const items = Array.isArray(products.value?.results) ? products.value.results : products.value
  return (items || []).map(p => ({ label: `${p.code} - ${p.name}`, value: p.id }))
})

const categoryOptions = computed(() => {
  return productStore.categories.map(c => ({ label: c.description, value: c.id }))
})

const columns = [
  { title: 'Código', key: 'code' },
  { title: 'Producto', key: 'name' },
  { title: 'Cantidad', key: 'counter', align: 'right' },
  { title: 'Monto', key: 'total', align: 'right', render: (row) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(row.total || 0) },
]

const rows = ref([])

onMounted(async () => {
  const { data } = await getProductsAll(false)
  products.value = data
  if (productStore.categories.length === 0) {
    productStore.refreshCategories()
  }
})

function toYYYYMMDD(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function onRangeChange(val) {
  if (!val || !Array.isArray(val)) {
    filters.value.date_from = ''
    filters.value.date_to = ''
    return
  }
  filters.value.date_from = toYYYYMMDD(val[0])
  filters.value.date_to = toYYYYMMDD(val[1])
}

function disableFuture(ts) {
  return ts > Date.now()
}

async function fetchData() {
  loading.value = true
  try {
    const { data } = await getProductsSold({
      date_from: filters.value.date_from,
      date_to: filters.value.date_to,
      product: filters.value.product,
      category: filters.value.category,
      ordering: '-counter'
    })
    // Si la API retorna results/pagination, normalizamos
    rows.value = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : [])
  } finally {
    loading.value = false
  }
}

async function onDownload() {
  try {
    downloading.value = true
    const { data, headers } = await downloadProductsSoldReport({
      date_from: filters.value.date_from,
      date_to: filters.value.date_to,
      product: filters.value.product,
      category: filters.value.category,
    })

    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const headerName = headers['content-disposition']?.match(/filename=\"?([^\";]+)\"?/i)?.[1]
    const filename = headerName || `productos_vendidos_${filters.value.date_from}_${filters.value.date_to}.xlsx`

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.page-wrap { display: grid; gap: 12px; }
.mb-12 { margin-bottom: 12px; }
.card-title { font-weight: 600; }
.table-summary { margin-bottom: 8px; font-weight: 500; }
</style>