<template>
  <div class="page-wrap">
    <!-- Filtros -->
    <n-card size="small" class="mb-12">
      <template #header>
        <div class="card-title">🏆 Récord de Ventas y Productos Más Vendidos</div>
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

        <n-form-item label="Top productos">
          <n-input-number
            v-model:value="filters.top_limit"
            :min="5"
            :max="50"
            :step="5"
            style="width: 100px"
          />
        </n-form-item>

        <n-form-item>
          <n-button 
            type="primary" 
            :loading="loading" 
            :disabled="!filters.start_date || !filters.end_date" 
            @click="fetchData"
          >
            Buscar
          </n-button>
        </n-form-item>
      </n-form>

      <n-alert type="info" :bordered="false" style="margin-top: 12px;">
        Este reporte <strong>NO incluye</strong>: ventas anuladas, ventas al crédito, ni ventas con monto $0
      </n-alert>
    </n-card>

    <!-- Resumen Global -->
    <n-card v-if="reportData" size="small" class="mb-12" title="📊 Resumen Global del Periodo">
      <div class="summary-grid">
        <div class="summary-item primary">
          <div class="label">Total Ventas</div>
          <div class="value large">{{ formatCurrency(reportData.resumen_global.total_ventas) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Días con Ventas</div>
          <div class="value">{{ reportData.resumen_global.cantidad_dias }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Periodo</div>
          <div class="value small">
            {{ formatDate(reportData.periodo.fecha_inicio) }} - {{ formatDate(reportData.periodo.fecha_fin) }}
          </div>
        </div>
      </div>

      <!-- Productos Más Vendidos Global -->
      <n-divider />
      <h4 style="margin-bottom: 16px;">🥇 Productos Más Vendidos (Todo el Periodo)</h4>
      <n-data-table
        :columns="productsColumns"
        :data="reportData.resumen_global.productos_mas_vendidos"
        :pagination="false"
        size="small"
        max-height="400"
      />
    </n-card>

    <!-- Récord por Día -->
    <n-card v-if="reportData && reportData.record_por_dia.length" size="small" title="📆 Récord de Ventas por Día">
      <n-alert type="success" :bordered="false" style="margin-bottom: 16px;">
        🏆 <strong>Mejor Día: {{ formatDate(reportData.record_por_dia[0].fecha) }}</strong> con {{ formatCurrency(reportData.record_por_dia[0].monto_total) }} en {{ reportData.record_por_dia[0].cantidad_ventas }} ventas
      </n-alert>

      <n-collapse>
        <n-collapse-item 
          v-for="(dia, index) in reportData.record_por_dia" 
          :key="dia.fecha"
          :name="dia.fecha"
        >
          <template #header>
            <div class="day-header">
              <n-tag v-if="index === 0" type="success" round size="small">
                🏆 #1
              </n-tag>
              <n-tag v-else-if="index === 1" type="warning" round size="small">
                🥈 #2
              </n-tag>
              <n-tag v-else-if="index === 2" type="info" round size="small">
                🥉 #3
              </n-tag>
              <n-tag v-else type="default" round size="small">
                #{{ index + 1 }}
              </n-tag>
              <span class="day-date">{{ formatDate(dia.fecha) }} ({{ getDayName(dia.fecha) }})</span>
              <span class="day-amount">{{ formatCurrency(dia.monto_total) }}</span>
              <span class="day-count">{{ dia.cantidad_ventas }} ventas</span>
            </div>
          </template>

          <!-- Productos del día -->
          <n-data-table
            :columns="productsColumns"
            :data="dia.productos_top"
            :pagination="false"
            size="small"
            style="margin-top: 12px;"
          />
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <!-- Empty State -->
    <n-empty 
      v-if="!loading && !reportData" 
      description="Selecciona un rango de fechas para ver el reporte"
      style="margin-top: 60px;"
    />
  </div>
</template>

<script setup>
import { ref, h } from 'vue'
import { 
  NCard, NForm, NFormItem, NButton, NDatePicker, NInputNumber, NDataTable, 
  NEmpty, NIcon, NAlert, NTag, NCollapse, NCollapseItem, NDivider, NProgress 
} from 'naive-ui'
import { getSalesRecord } from '@/api/modules/reports'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const range = ref(null)
const filters = ref({ 
  start_date: '', 
  end_date: '',
  top_limit: 10
})
const loading = ref(false)
const reportData = ref(null)

// Columnas para tabla de productos
const productsColumns = [
  {
    title: 'Código',
    key: 'producto_codigo',
    width: 100,
  },
  {
    title: 'Producto',
    key: 'producto_nombre',
    ellipsis: { tooltip: true },
  },
  {
    title: 'Cantidad',
    key: 'cantidad_vendida',
    width: 100,
    align: 'center',
  },
  {
    title: 'Monto Total',
    key: 'monto_total',
    width: 130,
    align: 'right',
    render: (row) => formatCurrency(row.monto_total),
  },
  {
    title: 'Participación',
    key: 'porcentaje',
    width: 200,
    render: (row) => {
      const percentage = Number(row.porcentaje)
      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h(NProgress, {
          type: 'line',
          percentage: percentage,
          showIndicator: false,
          color: getProgressColor(percentage),
          style: 'flex: 1;'
        }),
        h('span', { style: 'font-weight: 600; min-width: 50px; text-align: right;' }, `${percentage.toFixed(2)}%`)
      ])
    }
  }
]

// Helpers
const disableFuture = (ts) => ts > Date.now()

const onRangeChange = (value) => {
  if (value && value.length === 2) {
    filters.value.start_date = format(value[0], 'yyyy-MM-dd')
    filters.value.end_date = format(value[1], 'yyyy-MM-dd')
  } else {
    filters.value.start_date = ''
    filters.value.end_date = ''
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { data } = await getSalesRecord(filters.value)
    reportData.value = data
  } catch (error) {
    console.error('Error fetching sales record:', error)
    window.$message?.error('Error al cargar el reporte')
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es })
}

const getDayName = (dateStr) => {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'EEEE', { locale: es })
}

const getProgressColor = (percentage) => {
  if (percentage >= 15) return '#18a058'
  if (percentage >= 10) return '#2080f0'
  if (percentage >= 5) return '#f0a020'
  return '#d03050'
}
</script>

<style scoped>
.page-wrap {
  padding: 16px;
}

.mb-12 {
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.summary-item.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-item.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.summary-item.danger {
  background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
  color: white;
}

.summary-item .label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 20px;
  font-weight: 700;
}

.summary-item .value.large {
  font-size: 28px;
}

.summary-item .value.small {
  font-size: 14px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.day-date {
  font-weight: 600;
  font-size: 14px;
  text-transform: capitalize;
}

.day-amount {
  color: #18a058;
  font-weight: 700;
  font-size: 16px;
  margin-left: auto;
}

.day-count {
  color: #666;
  font-size: 13px;
}

:deep(.n-collapse-item__header) {
  padding: 16px;
  background: #fafafa;
}

:deep(.n-collapse-item__header:hover) {
  background: #f0f0f0;
}
</style>
