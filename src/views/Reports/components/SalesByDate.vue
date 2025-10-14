<template>
  <div class="page-wrap">
    <n-card size="small" class="mb-12">
      <template #header>
        <div class="card-title">📅 Reporte de Ventas por Fechas</div>
      </template>

      <n-form inline label-width="auto" :show-feedback="false" @submit.prevent>
        <n-form-item label="Rango de fechas" required>
          <n-date-picker
            v-model:value="range"
            type="daterange"
            clearable
            :is-date-disabled="disableFuture"
            @update:value="onRangeChange"
          />
        </n-form-item>

        <n-form-item label="Incluir anuladas">
          <n-switch v-model:value="filters.include_cancelled" />
        </n-form-item>

        <n-form-item>
          <n-button type="primary" :loading="loading" :disabled="!filters.start_date || !filters.end_date" @click="fetchData">
            Buscar
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-button tertiary :loading="downloading" :disabled="!filters.start_date || !filters.end_date" @click="onDownload">
            📥 Descargar Excel
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- Resumen -->
    <n-card v-if="summary" size="small" class="mb-12">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">Total Ventas</div>
          <div class="value">{{ formatCurrency(summary.total_ventas) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Subtotal</div>
          <div class="value">{{ formatCurrency(summary.total_subtotal) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">IGV</div>
          <div class="value">{{ formatCurrency(summary.total_igv) }}</div>
        </div>
        <div class="summary-item success">
          <div class="label">Ventas Activas</div>
          <div class="value">{{ summary.cantidad_activas }}</div>
        </div>
        <div class="summary-item danger">
          <div class="label">Ventas Anuladas</div>
          <div class="value">{{ summary.cantidad_anuladas }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Documentos</div>
          <div class="value">{{ summary.cantidad_total }}</div>
        </div>
      </div>
    </n-card>

    <!-- Tabla de ventas -->
    <n-card size="small">
      <div class="table-summary">
        Mostrando {{ rows.length }} ventas
      </div>
      <n-data-table 
        :columns="columns" 
        :data="rows" 
        :loading="loading"
        :row-class-name="getRowClassName"
        :pagination="{ pageSize: 50 }"
        size="small"
      />
    </n-card>
  </div>
</template>

<script setup>
import { ref, h } from 'vue'
import { NCard, NForm, NFormItem, NButton, NDatePicker, NSwitch, NDataTable, NTag } from 'naive-ui'
import { getSalesByDate, downloadSalesByDateReport } from '@/api/modules/reports'

const range = ref(null)
const filters = ref({ 
  start_date: '', 
  end_date: '', 
  include_cancelled: true 
})
const loading = ref(false)
const downloading = ref(false)
const rows = ref([])
const summary = ref(null)

const columns = [
  { 
    title: 'ID', 
    key: 'id', 
    width: 70,
    align: 'center'
  },
  { 
    title: 'Fecha', 
    key: 'fecha', 
    width: 110,
    align: 'center'
  },
  { 
    title: 'Hora', 
    key: 'hora', 
    width: 90,
    align: 'center'
  },
  { 
    title: 'Documento', 
    key: 'numero_documento', 
    width: 180,
    align: 'center'
  },
  { 
    title: 'Tipo', 
    key: 'tipo_comprobante',
    width: 100,
    align: 'center'
  },
  { 
    title: 'Cliente', 
    key: 'cliente',
    ellipsis: {
      tooltip: true
    }
  },
  { 
    title: 'Usuario', 
    key: 'usuario',
    width: 150,
    ellipsis: {
      tooltip: true
    }
  },
  { 
    title: 'Subtotal', 
    key: 'subtotal', 
    align: 'right',
    width: 110,
    render: (row) => formatCurrency(row.subtotal)
  },
  { 
    title: 'IGV', 
    key: 'igv', 
    align: 'right',
    width: 100,
    render: (row) => formatCurrency(row.igv)
  },
  { 
    title: 'Total', 
    key: 'total', 
    align: 'right',
    width: 110,
    render: (row) => h('span', { 
      style: { fontWeight: '600' } 
    }, formatCurrency(row.total))
  },
  { 
    title: 'Estado', 
    key: 'estado',
    width: 120,
    align: 'center',
    render: (row) => {
      const isAnulado = row.is_anulado || row.estado === 'ANULADO' || row.estado?.includes('ANULADO')
      return h(NTag, {
        type: isAnulado ? 'error' : 'success',
        size: 'small',
        bordered: false
      }, { default: () => row.estado })
    }
  },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('es-PE', { 
    style: 'currency', 
    currency: 'PEN' 
  }).format(value || 0)
}

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
    filters.value.start_date = ''
    filters.value.end_date = ''
    return
  }
  filters.value.start_date = toYYYYMMDD(val[0])
  filters.value.end_date = toYYYYMMDD(val[1])
}

function disableFuture(ts) {
  return ts > Date.now()
}

function getRowClassName(row) {
  // Aplicar clase CSS para ventas anuladas
  if (row.is_anulado || row.estado === 'ANULADO' || row.estado?.includes('ANULADO')) {
    return 'cancelled-row'
  }
  return ''
}

async function fetchData() {
  if (!filters.value.start_date || !filters.value.end_date) {
    return
  }

  loading.value = true
  try {
    const { data } = await getSalesByDate({
      start_date: filters.value.start_date,
      end_date: filters.value.end_date,
      include_cancelled: filters.value.include_cancelled,
    })
    
    // La respuesta tiene formato: { ventas: [...], resumen: {...} }
    rows.value = data.ventas || []
    summary.value = data.resumen || null
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    rows.value = []
    summary.value = null
  } finally {
    loading.value = false
  }
}

async function onDownload() {
  if (!filters.value.start_date || !filters.value.end_date) {
    return
  }

  try {
    downloading.value = true
    const { data, headers } = await downloadSalesByDateReport({
      start_date: filters.value.start_date,
      end_date: filters.value.end_date,
      include_cancelled: filters.value.include_cancelled,
    })

    const blob = new Blob([data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const headerName = headers['content-disposition']?.match(/filename=\"?([^\";]+)\"?/i)?.[1]
    const filename = headerName || `ventas_por_fecha_${filters.value.start_date}_${filters.value.end_date}.xlsx`

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('Error al descargar Excel:', error)
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.page-wrap { 
  display: grid; 
  gap: 12px; 
}

.mb-12 { 
  margin-bottom: 12px; 
}

.card-title { 
  font-weight: 600; 
  font-size: 1.1rem;
}

.table-summary { 
  margin-bottom: 8px; 
  font-weight: 500; 
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #18a058;
}

.summary-item.success {
  border-left-color: #18a058;
  background: #f0f9ff;
}

.summary-item.danger {
  border-left-color: #d03050;
  background: #fff1f0;
}

.summary-item .label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.summary-item .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

/* Estilo para filas anuladas */
:deep(.cancelled-row) {
  background-color: #ffe4e6 !important;
}

:deep(.cancelled-row:hover) {
  background-color: #ffd4d6 !important;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
