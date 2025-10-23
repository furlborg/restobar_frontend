<template>
    <div class="page-wrap">
        <n-card size="small" class="mb-12">
            <template #header>
                <div class="card-title">📋 Reporte de Ventas Detalladas</div>
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
                    <div class="label">Ventas Encontradas</div>
                    <div class="value">{{ summary.cantidad_ventas }}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Items Totales</div>
                    <div class="value">{{ summary.total_items }}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Monto Total</div>
                    <div class="value">{{ formatCurrency(summary.total_monto) }}</div>
                </div>
            </div>
        </n-card>

        <!-- Lista de ventas con items expandibles -->
        <div v-if="rows.length > 0" class="sales-list">
            <n-card
                    v-for="sale in rows"
                    :key="sale.id"
                    size="small"
                    class="sale-card mb-12"
            >
                <template #header>
                    <div class="sale-header">
                        <div class="sale-info">
                            <span class="sale-number">#{{ sale.numero_documento }}</span>
                            <n-tag
                                    :type="sale.estado === 'ACTIVO' ? 'success' : 'error'"
                                    size="small"
                                    class="ml-8"
                            >
                                {{ sale.estado }}
                            </n-tag>
                        </div>
                        <div class="sale-meta">
                            <span>{{ sale.fecha_hora }}</span>
                            <span class="separator">•</span>
                            <span>{{ sale.cliente_nombre }}</span>
                            <span class="separator">•</span>
                            <span class="sale-total">{{ formatCurrency(sale.total) }}</span>
                        </div>
                    </div>
                </template>

                <!-- Información adicional de la venta -->
                <div class="sale-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Usuario:</span>
                        <span class="detail-value">{{ sale.usuario }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tipo:</span>
                        <span class="detail-value">{{ sale.tipo_comprobante }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Forma de Pago:</span>
                        <span class="detail-value">{{ sale.forma_pago }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cliente Doc.:</span>
                        <span class="detail-value">{{ sale.cliente_documento }}</span>
                    </div>
                </div>

                <!-- Tabla de items -->
                <n-divider style="margin: 12px 0" />
                <div class="items-header">
                    <strong>Items de la venta ({{ sale.cantidad_items }})</strong>
                </div>
                <n-data-table
                        :columns="itemColumns"
                        :data="sale.items"
                        size="small"
                        :pagination="false"
                        :row-class-name="getItemRowClassName"
                />

                <!-- Totales de la venta -->
                <div class="sale-totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>{{ formatCurrency(sale.subtotal) }}</span>
                    </div>
                    <div class="total-row">
                        <span>IGV:</span>
                        <span>{{ formatCurrency(sale.igv) }}</span>
                    </div>
                    <div v-if="sale.descuento_total > 0" class="total-row">
                        <span>Descuento:</span>
                        <span class="text-danger">-{{ formatCurrency(sale.descuento_total) }}</span>
                    </div>
                    <div class="total-row final">
                        <span>TOTAL:</span>
                        <span>{{ formatCurrency(sale.total) }}</span>
                    </div>
                </div>
            </n-card>
        </div>

        <!-- Estado vacío -->
        <n-card v-else-if="!loading" size="small">
            <n-empty description="No se encontraron ventas en el rango seleccionado" />
        </n-card>

        <!-- Loading -->
        <n-card v-if="loading" size="small">
            <div style="display: flex; justify-content: center; padding: 40px;">
                <n-spin size="large" />
            </div>
        </n-card>
    </div>
</template>

<script setup>
import { ref, h } from 'vue'
import { NCard, NForm, NFormItem, NButton, NDatePicker, NSwitch, NDataTable, NTag, NDivider, NEmpty, NSpin } from 'naive-ui'
import { getSalesDetailed, downloadSalesDetailedReport } from '@/api/modules/reports'

const range = ref(null)
const filters = ref({
    start_date: '',
    end_date: '',
    include_cancelled: false
})
const loading = ref(false)
const downloading = ref(false)
const rows = ref([])
const summary = ref(null)

// Columnas para los items de cada venta
const itemColumns = [
    {
        title: 'Producto',
        key: 'producto',
        ellipsis: {
            tooltip: true
        }
    },
    {
        title: 'Tipo',
        key: 'tipo_item',
        width: 100,
        align: 'center',
        render: (row) => {
            const typeColors = {
                'PRODUCTO': 'default',
                'MENU': 'info',
                'COMBO': 'warning'
            }
            return h(NTag, {
                type: typeColors[row.tipo_item] || 'default',
                size: 'small',
                bordered: false
            }, { default: () => row.tipo_item })
        }
    },
    {
        title: 'Cantidad',
        key: 'cantidad',
        align: 'center',
        width: 90,
        render: (row) => Number(row.cantidad).toFixed(2)
    },
    {
        title: 'P. Unit.',
        key: 'precio_unitario',
        align: 'right',
        width: 100,
        render: (row) => formatCurrency(row.precio_unitario)
    },
    {
        title: 'Subtotal',
        key: 'subtotal',
        align: 'right',
        width: 100,
        render: (row) => formatCurrency(row.subtotal)
    },
    {
        title: 'IGV',
        key: 'igv_item',
        align: 'right',
        width: 90,
        render: (row) => formatCurrency(row.igv_item)
    },
    {
        title: 'Total',
        key: 'total_item',
        align: 'right',
        width: 100,
        render: (row) => h('span', {
            style: { fontWeight: '600' }
        }, formatCurrency(row.total_item))
    },
    {
        title: 'Indicaciones',
        key: 'indicaciones',
        width: 150,
        ellipsis: {
            tooltip: true
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

function getItemRowClassName(row) {
    // Resaltar combos y menús
    if (row.tipo_item === 'COMBO') {
        return 'combo-row'
    }
    if (row.tipo_item === 'MENU') {
        return 'menu-row'
    }
    return ''
}

async function fetchData() {
    if (!filters.value.start_date || !filters.value.end_date) {
        return
    }

    loading.value = true
    try {
        const { data } = await getSalesDetailed({
            start_date: filters.value.start_date,
            end_date: filters.value.end_date,
            include_cancelled: filters.value.include_cancelled,
        })

        // La respuesta tiene formato: { ventas: [...], resumen: {...} }
        rows.value = data.ventas || []
        summary.value = data.resumen || null
    } catch (error) {
        console.error('Error al obtener ventas detalladas:', error)
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
        const { data, headers } = await downloadSalesDetailedReport({
            start_date: filters.value.start_date,
            end_date: filters.value.end_date,
            include_cancelled: filters.value.include_cancelled,
        })

        const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const headerName = headers['content-disposition']?.match(/filename=\"?([^\";]+)\"?/i)?.[1]
        const filename = headerName || `ventas_detalladas_${filters.value.start_date}_${filters.value.end_date}.xlsx`

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

.ml-8 {
    margin-left: 8px;
}

.card-title {
    font-weight: 600;
    font-size: 1.1rem;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.sales-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.sale-card {
    border: 1px solid #e0e0e6;
    transition: box-shadow 0.2s;
}

.sale-card:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.sale-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sale-info {
    display: flex;
    align-items: center;
}

.sale-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: #18a058;
}

.sale-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #666;
}

.separator {
    color: #ccc;
}

.sale-total {
    font-weight: 700;
    color: #333;
    font-size: 1rem;
}

.sale-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
    margin-bottom: 8px;
}

.detail-item {
    display: flex;
    gap: 8px;
}

.detail-label {
    font-weight: 600;
    color: #666;
}

.detail-value {
    color: #333;
}

.items-header {
    margin-bottom: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
}

.sale-totals {
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
}

.total-row.final {
    font-size: 1.1rem;
    font-weight: 700;
    padding-top: 8px;
    border-top: 2px solid #ddd;
    color: #18a058;
}

.text-danger {
    color: #d03050;
}

/* Estilos para diferentes tipos de items */
:deep(.combo-row) {
    background-color: #fff7e6 !important;
}

:deep(.combo-row:hover) {
    background-color: #ffe7ba !important;
}

:deep(.menu-row) {
    background-color: #e6f7ff !important;
}

:deep(.menu-row:hover) {
    background-color: #bae7ff !important;
}

@media (max-width: 768px) {
    .sale-meta {
        flex-wrap: wrap;
    }

    .sale-details-grid {
        grid-template-columns: 1fr;
    }
}
</style>
