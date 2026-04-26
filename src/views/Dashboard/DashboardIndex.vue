<template>
  <div id="Dashboard">
    <!-- Header con comparativa y filtro de fecha -->
    <n-card :bordered="false" class="dashboard-header mb-3">
      <n-space align="center" justify="space-between" style="flex-wrap: wrap;">
        <!-- Comparativa de crecimiento -->
        <div class="growth-section">
          <n-text strong style="font-size: 16px; margin-bottom: 4px;">Gráfico por cantidad de ventas</n-text>
          <n-space align="center" :size="16" style="margin-top: 8px;">
            <n-space align="center" :size="4">
              <span
                style="width: 12px; height: 12px; background: #5470c6; border-radius: 50%; display: inline-block;"></span>
              <n-text>
                Esta semana:
                <span
                  :style="{ color: dashboardData.comparativa_semanal?.crecimiento_porcentaje >= 0 ? '#18a058' : '#d03050', fontWeight: 'bold' }">
                  {{ dashboardData.comparativa_semanal?.crecimiento_porcentaje >= 0 ? '+' : '' }}{{
                    dashboardData.comparativa_semanal?.crecimiento_porcentaje || 0 }}%
                </span>
              </n-text>
            </n-space>
            <n-space align="center" :size="4">
              <span
                style="width: 12px; height: 12px; background: #91cc75; border-radius: 50%; display: inline-block;"></span>
              <n-text>
                Semana pasada:
                <span style="color: #d03050; font-weight: bold;">
                  1%
                </span>
              </n-text>
            </n-space>
          </n-space>
        </div>

        <!-- Total de ventas y filtro de fecha -->
        <n-space align="center" :size="24" style="flex-wrap: wrap;">
          <div class="total-ventas-section">
            <n-space vertical :size="0">
              <n-text depth="3" style="font-size: 12px;">💰 TOTAL DE VENTAS</n-text>
              <n-text strong style="font-size: 28px; color: #18a058;">
                S/{{ formatMoney(dashboardData.graficos?.total_ventas || 0) }}
              </n-text>
            </n-space>
          </div>

          <n-date-picker v-model:value="dateRange" type="daterange" :shortcuts="dateShortcuts" clearable
            @update:value="loadDashboardData" style="min-width: 280px;" />
        </n-space>
      </n-space>
    </n-card>

    <!-- Grid principal de estadísticas -->
    <n-grid cols="2 xs:1 s:2" responsive="screen" :x-gap="12" :y-gap="12" class="mb-3">
      <!-- Columna izquierda -->
      <n-gi>
        <n-space vertical :size="12">
          <!-- Ventas en efectivo -->
          <n-card :bordered="false" size="small" class="stat-card">
            <n-space align="center" justify="space-between">
              <n-space vertical :size="4">
                <n-space align="center" :size="8">
                  <n-icon size="20" color="#5470c6">
                    <v-icon name="bi-cash-coin" />
                  </n-icon>
                  <n-text depth="3">Ventas en efectivo</n-text>
                </n-space>
                <n-text strong style="font-size: 22px;">
                  S/ {{ formatMoney(dashboardData.graficos?.ventas_efectivo || 0) }}
                </n-text>
              </n-space>
              <div class="mini-chart">
                <v-chart :option="getMiniChartOption(dashboardData.ventas_por_dia || [])"
                  style="height: 60px; width: 120px;" autoresize />
              </div>
            </n-space>
            <n-progress type="line"
              :percentage="calculatePercentage(dashboardData.graficos?.ventas_efectivo, dashboardData.graficos?.total_ventas)"
              :show-indicator="false" color="#5470c6" rail-color="#f0f0f0" style="margin-top: 8px;" />
            <n-text depth="3" style="font-size: 11px; margin-top: 4px;">
              Redondeado: S/ {{ Math.round(dashboardData.graficos?.ventas_efectivo || 0) }}
            </n-text>
          </n-card>

          <!-- Ventas con tarjeta -->
          <n-card :bordered="false" size="small" class="stat-card">
            <n-space align="center" justify="space-between">
              <n-space vertical :size="4">
                <n-space align="center" :size="8">
                  <n-icon size="20" color="#91cc75">
                    <v-icon name="bi-credit-card-2-front" />
                  </n-icon>
                  <n-text depth="3">Ventas con tarjeta</n-text>
                </n-space>
                <n-text strong style="font-size: 22px;">
                  S/ {{ formatMoney(dashboardData.graficos?.ventas_tarjeta || 0) }}
                </n-text>
              </n-space>
              <div class="mini-chart">
                <v-chart :option="getMiniChartOption(dashboardData.ventas_por_dia || [])"
                  style="height: 60px; width: 120px;" autoresize />
              </div>
            </n-space>
          </n-card>

          <!-- Total de descuentos -->
          <n-card :bordered="false" size="small" class="stat-card">
            <n-space align="center" justify="space-between">
              <n-space vertical :size="4">
                <n-space align="center" :size="8">
                  <n-icon size="20" color="#fac858">
                    <v-icon name="bi-tag" />
                  </n-icon>
                  <n-text depth="3">Total de descuentos</n-text>
                </n-space>
                <n-text strong style="font-size: 22px;">
                  S/ {{ formatMoney(dashboardData.descuentos?.total_descuentos || 0) }}
                </n-text>
              </n-space>
              <div class="mini-chart">
                <v-chart :option="getMiniChartOption(dashboardData.ventas_por_dia || [])"
                  style="height: 60px; width: 120px;" autoresize />
              </div>
            </n-space>
          </n-card>
        </n-space>
      </n-gi>

      <!-- Columna derecha -->
      <n-gi>
        <n-space vertical :size="12">
          <!-- Total de egresos de caja -->
          <n-card :bordered="false" size="small" class="stat-card">
            <n-space align="center" justify="space-between">
              <n-space vertical :size="4">
                <n-space align="center" :size="8">
                  <n-icon size="20" color="#ee6666">
                    <v-icon name="bi-cash-stack" />
                  </n-icon>
                  <n-text depth="3">Total de egresos de caja</n-text>
                </n-space>
                <n-text strong style="font-size: 22px;">
                  S/ {{ formatMoney(dashboardData.egresos?.total_egresos || 0) }}
                </n-text>
              </n-space>
              <div class="mini-chart">
                <v-chart :option="getMiniChartOption(dashboardData.ventas_por_dia || [], true)"
                  style="height: 60px; width: 120px;" autoresize />
              </div>
            </n-space>
          </n-card>

          <!-- Ventas al crédito -->
          <n-card :bordered="false" size="small" class="stat-card">
            <n-space align="center" justify="space-between">
              <n-space vertical :size="4">
                <n-space align="center" :size="8">
                  <n-icon size="20" color="#73c0de">
                    <v-icon name="bi-journal-text" />
                  </n-icon>
                  <n-text depth="3">Ventas al crédito</n-text>
                </n-space>
                <n-text strong style="font-size: 22px;">
                  S/ {{ formatMoney(dashboardData.graficos?.ventas_credito || 0) }}
                </n-text>
              </n-space>
              <div class="mini-chart">
                <v-chart :option="getMiniChartOption(dashboardData.ventas_por_dia || [])"
                  style="height: 60px; width: 120px;" autoresize />
              </div>
            </n-space>
          </n-card>
        </n-space>
      </n-gi>
    </n-grid>

    <!-- Órdenes -->
    <n-card :bordered="false" class="mb-3">
      <n-grid cols="4 xs:2 s:2 m:4" responsive="screen" :x-gap="12" :y-gap="12">
        <n-gi>
          <n-space vertical align="center" :size="8" class="order-stat">
            <n-icon size="40" color="#909399">
              <v-icon name="bi-clock-history" />
            </n-icon>
            <n-text depth="3" style="font-size: 13px;">Ordenes pendientes</n-text>
            <n-text strong style="font-size: 32px;">{{ dashboardData.ordenes?.pendientes || 0 }}</n-text>
          </n-space>
        </n-gi>
        <n-gi>
          <n-space vertical align="center" :size="8" class="order-stat">
            <n-icon size="40" color="#303133">
              <v-icon name="io-fast-food" />
            </n-icon>
            <n-text depth="3" style="font-size: 13px;">Ordenes completas</n-text>
            <n-text strong style="font-size: 32px;">{{ dashboardData.ordenes?.completas || 0 }}</n-text>
          </n-space>
        </n-gi>
        <n-gi>
          <n-space vertical align="center" :size="8" class="order-stat">
            <n-icon size="40" color="#303133">
              <v-icon name="md-deliverydining" />
            </n-icon>
            <n-text depth="3" style="font-size: 13px;">Ordenes de entrega</n-text>
            <n-text strong style="font-size: 32px;">{{ dashboardData.ordenes?.delivery || 0 }}</n-text>
          </n-space>
        </n-gi>
        <n-gi>
          <n-space vertical align="center" :size="8" class="order-stat">
            <n-icon size="40" color="#303133">
              <v-icon name="ri-shopping-bag-2-fill" />
            </n-icon>
            <n-text depth="3" style="font-size: 13px;">Ordenes para llevar</n-text>
            <n-text strong style="font-size: 32px;">{{ dashboardData.ordenes?.llevar || 0 }}</n-text>
          </n-space>
        </n-gi>
      </n-grid>
    </n-card>

    <!-- Tipo de pago -->
    <n-card :bordered="false" class="mb-3">
      <template #header>
        <n-text strong>Tipo de pago</n-text>
      </template>
      <n-grid cols="3 xs:1 s:3" responsive="screen" :x-gap="12" :y-gap="12">
        <n-gi>
          <n-card :bordered="false" class="payment-card">
            <n-space vertical :size="8">
              <n-space align="center" :size="8">
                <n-icon size="24" color="#5470c6">
                  <v-icon name="bi-cash-coin" />
                </n-icon>
                <n-text strong style="color: #5470c6;">Efectivo</n-text>
              </n-space>
              <n-text depth="3" style="font-size: 12px;">Efectivo</n-text>
              <n-text strong style="font-size: 18px;">
                S/ {{ formatMoney(dashboardData.tipo_pago?.efectivo || 0) }}
              </n-text>
              <n-text depth="3" style="font-size: 11px;">
                {{ calculatePercentage(dashboardData.tipo_pago?.efectivo, dashboardData.graficos?.total_ventas) }}%
              </n-text>
              <n-progress type="line"
                :percentage="calculatePercentage(dashboardData.tipo_pago?.efectivo, dashboardData.graficos?.total_ventas)"
                :show-indicator="false" color="#5470c6" />
            </n-space>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card :bordered="false" class="payment-card">
            <n-space vertical :size="8">
              <n-space align="center" :size="8">
                <n-icon size="24" color="#91cc75">
                  <v-icon name="bi-bank" />
                </n-icon>
                <n-text strong style="color: #91cc75;">En Deposito</n-text>
              </n-space>
              <n-text depth="3" style="font-size: 12px;">deposito</n-text>
              <n-text strong style="font-size: 18px;">
                S/ {{ formatMoney(dashboardData.tipo_pago?.deposito || 0) }}
              </n-text>
              <n-text depth="3" style="font-size: 11px;">
                {{ calculatePercentage(dashboardData.tipo_pago?.deposito, dashboardData.graficos?.total_ventas) }}%
              </n-text>
            </n-space>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card :bordered="false" class="payment-card">
            <n-space vertical :size="8">
              <n-space align="center" :size="8">
                <n-icon size="24" color="#fac858">
                  <v-icon name="bi-credit-card-2-front" />
                </n-icon>
                <n-text strong style="color: #fac858;">En Tarjeta</n-text>
              </n-space>
              <div style="max-height: 120px; overflow-y: auto;">
                <n-space vertical :size="4" v-if="dashboardData.tipo_pago?.tarjetas?.length > 0">
                  <div v-for="tarjeta in dashboardData.tipo_pago.tarjetas" :key="tarjeta.metodo"
                    style="display: flex; justify-content: space-between;">
                    <n-text depth="3" style="font-size: 12px;">{{ tarjeta.metodo }}</n-text>
                    <n-space align="center" :size="8">
                      <n-text strong style="font-size: 14px;">S/ {{ formatMoney(tarjeta.total) }}</n-text>
                      <n-text depth="3" style="font-size: 11px;">
                        {{ calculatePercentage(tarjeta.total, dashboardData.graficos?.total_ventas) }}%
                      </n-text>
                    </n-space>
                  </div>
                </n-space>
                <n-empty v-else description="Sin datos" size="small" />
              </div>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>

    <!-- Gráfico de ventas por día (Imagen 2) -->
    <n-card :bordered="false" class="mb-3">
      <template #header>
        <n-space align="center" justify="space-between">
          <n-text strong>Total ventas por comprobante | Ventas por días en S/</n-text>
          <n-space>
            <n-button text @click="chartView = 'day'">
              <n-text :type="chartView === 'day' ? 'primary' : 'default'">Ventas por día</n-text>
            </n-button>
            <n-divider vertical />
            <n-button text @click="chartView = 'month'">
              <n-text :type="chartView === 'month' ? 'primary' : 'default'">Total por mes</n-text>
            </n-button>
          </n-space>
        </n-space>
      </template>
      <div style="height: 400px;">
        <v-chart :option="getMainChartOption()" style="height: 100%;" autoresize />
      </div>
    </n-card>

    <!-- Canal de venta -->
    <n-card :bordered="false" class="mb-3">
      <template #header>
        <n-text strong>Canal de venta</n-text>
      </template>
      <n-grid cols="4 xs:1 s:2 m:4" responsive="screen" :x-gap="12" :y-gap="12">
        <n-gi>
          <n-card :bordered="false" class="channel-card">
            <n-space vertical align="center" :size="8">
              <n-icon size="32" color="#5470c6">
                <v-icon name="md-tablechart" />
              </n-icon>
              <n-text strong style="color: #5470c6; font-size: 16px;">Salones</n-text>
              <n-space vertical :size="0" align="center">
                <n-text depth="3" style="font-size: 12px;">Total</n-text>
                <n-text strong style="font-size: 20px;">S/ {{ formatMoney(dashboardData.canal_venta?.salones?.total ||
                  0)
                  }}</n-text>
              </n-space>
              <n-space vertical :size="0" align="center">
                <n-text depth="3" style="font-size: 12px;">N° de venta</n-text>
                <n-text strong style="font-size: 18px;">{{ dashboardData.canal_venta?.salones?.cantidad || 0 }}</n-text>
              </n-space>
            </n-space>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card :bordered="false" class="channel-card">
            <n-space vertical align="center" :size="8">
              <n-icon size="32" color="#91cc75">
                <v-icon name="ri-speed-fill" />
              </n-icon>
              <n-text strong style="color: #91cc75; font-size: 16px;">V. rápidas</n-text>
              <n-space vertical :size="0" align="center">
                <n-text depth="3" style="font-size: 12px;">Total</n-text>
                <n-text strong style="font-size: 20px;">S/ {{ formatMoney(dashboardData.canal_venta?.llevar?.total || 0)
                  }}</n-text>
              </n-space>
              <n-space vertical :size="0" align="center">
                <n-text depth="3" style="font-size: 12px;">N° de venta</n-text>
                <n-text strong style="font-size: 18px;">{{ dashboardData.canal_venta?.llevar?.cantidad || 0 }}</n-text>
              </n-space>
            </n-space>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card :bordered="false" class="channel-card">
            <n-space vertical align="center" :size="8">
              <n-icon size="32" color="#fac858">
                <v-icon name="md-deliverydining" />
              </n-icon>
              <n-text strong style="color: #fac858; font-size: 16px;">Delivery</n-text>
              <n-space vertical :size="0" align="center">
                <n-text depth="3" style="font-size: 12px;">Total</n-text>
                <n-text strong style="font-size: 20px;">S/ {{ formatMoney(dashboardData.canal_venta?.delivery?.total ||
                  0)
                  }}</n-text>
              </n-space>
              <n-space vertical :size="0" align="center">
                <n-text depth="3" style="font-size: 12px;">N° de venta</n-text>
                <n-text strong style="font-size: 18px;">{{ dashboardData.canal_venta?.delivery?.cantidad || 0
                  }}</n-text>
              </n-space>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>

    <!-- Top productos -->
    <n-card :bordered="false">
      <template #header>
        <n-text strong>Top productos</n-text>
      </template>
      <n-table v-if="dashboardData.top_productos?.length > 0" :bordered="false" :single-line="false" size="small"
        striped>
        <thead>
          <tr>
            <th style="text-align: center;">#</th>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Monto Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(producto, index) in dashboardData.top_productos" :key="producto.producto_id">
            <td style="text-align: center;">
              <n-tag v-if="index < 3" :type="['success', 'warning', 'info'][index]" size="small">
                {{ index + 1 }}
              </n-tag>
              <span v-else>{{ index + 1 }}</span>
            </td>
            <td>{{ producto.codigo }}</td>
            <td>{{ producto.nombre }}</td>
            <td style="text-align: center;">
              <n-tag type="info" size="small">{{ producto.cantidad_vendida }}</n-tag>
            </td>
            <td style="text-align: right;">
              <n-text strong>S/ {{ formatMoney(producto.monto_total) }}</n-text>
            </td>
          </tr>
        </tbody>
      </n-table>
      <n-empty v-else description="Sin productos vendidos" />
    </n-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { getDashboardStats } from "@/api/modules/reports";
import { useBusinessStore } from "@/store/modules/business";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from "echarts/components";

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
]);

const message = useMessage();
const businessStore = useBusinessStore();
const isLoading = ref(false);
const dateRange = ref(null);
const chartView = ref('day');
const dashboardData = ref({
  periodo: {},
  graficos: {},
  egresos: {},
  descuentos: {},
  tipo_pago: {},
  ordenes: {},
  ventas_por_dia: [],
  ventas_por_mes: [],
  canal_venta: {},
  top_productos: [],
  comparativa_semanal: {}
});

// Shortcuts para el date picker
const dateShortcuts = {
  'Hoy': () => {
    const now = new Date();
    return [now.getTime(), now.getTime()];
  },
  'Esta semana': () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return [start.getTime(), now.getTime()];
  },
  'Este mes': () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return [start.getTime(), now.getTime()];
  },
  'Últimos 7 días': () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return [start.getTime(), now.getTime()];
  },
  'Últimos 30 días': () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return [start.getTime(), now.getTime()];
  }
};

const loadDashboardData = async () => {
  isLoading.value = true;
  try {
    const params = {};

    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value;
      params.start_date = new Date(start).toISOString().split('T')[0];
      params.end_date = new Date(end).toISOString().split('T')[0];
    }

    if (businessStore.currentBranch) {
      params.branch_office = businessStore.currentBranch;
    }

    const { data } = await getDashboardStats(params);
    dashboardData.value = data;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    message.error('Error al cargar datos del dashboard');
  } finally {
    isLoading.value = false;
  }
};

const formatMoney = (value) => {
  if (!value) return '0.00';
  return parseFloat(value).toFixed(2);
};

const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
};

// Mini chart para las cards de estadísticas
const getMiniChartOption = (data, isNegative = false) => {
  const values = data.map(d => d.total || 0);
  return {
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    xAxis: {
      type: 'category',
      show: false,
      data: data.map((d, i) => i)
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: isNegative ? '#ee6666' : '#5470c6',
        width: 2
      },
      areaStyle: {
        color: isNegative ? 'rgba(238, 102, 102, 0.2)' : 'rgba(84, 112, 198, 0.2)'
      }
    }]
  };
};

// Gráfico principal de ventas por día/mes
const getMainChartOption = () => {
  if (chartView.value === 'day') {
    // Gráfico de ventas por día con tipos de comprobante (datos reales del backend)
    const dates = [];
    const boletas_data = {};
    const facturas_data = {};
    const notas_data = {};

    // Procesar datos por tipo de comprobante
    dashboardData.value.ventas_por_dia_tipo?.forEach(item => {
      const fecha = formatDate(item.fecha);
      if (!dates.includes(fecha)) {
        dates.push(fecha);
        boletas_data[fecha] = 0;
        facturas_data[fecha] = 0;
        notas_data[fecha] = 0;
      }

      const tipo = item.tipo_comprobante || '';
      if (tipo.toUpperCase().includes('BOLETA')) {
        boletas_data[fecha] += item.total || 0;
      } else if (tipo.toUpperCase().includes('FACTURA')) {
        facturas_data[fecha] += item.total || 0;
      } else if (tipo.toUpperCase().includes('NOTA')) {
        notas_data[fecha] += item.total || 0;
      }
    });

    const boletas = dates.map(d => boletas_data[d] || 0);
    const facturas = dates.map(d => facturas_data[d] || 0);
    const notas = dates.map(d => notas_data[d] || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['Boleta de Venta S/', 'FACTURA ELECTRONICA S/', 'NOTA DE VENTA S/'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '60',
        top: '40',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: {
        type: 'value'
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          name: 'Boleta de Venta S/',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: '#5470c6'
          },
          emphasis: {
            focus: 'series'
          },
          data: boletas
        },
        {
          name: 'FACTURA ELECTRONICA S/',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: '#91cc75'
          },
          emphasis: {
            focus: 'series'
          },
          data: facturas
        },
        {
          name: 'NOTA DE VENTA S/',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: '#ee6666'
          },
          emphasis: {
            focus: 'series'
          },
          data: notas
        }
      ]
    };
  } else {
    // Gráfico de ventas por mes (datos reales del backend)
    const months = [];
    const boletas_data = {};
    const facturas_data = {};
    const notas_data = {};

    // Procesar datos por tipo de comprobante
    dashboardData.value.ventas_por_mes_tipo?.forEach(item => {
      const key = `${getMonthName(item.mes).substring(0, 3)} ${item.anio}`;
      if (!months.includes(key)) {
        months.push(key);
        boletas_data[key] = 0;
        facturas_data[key] = 0;
        notas_data[key] = 0;
      }

      const tipo = item.tipo_comprobante || '';
      if (tipo.toUpperCase().includes('BOLETA')) {
        boletas_data[key] += item.total || 0;
      } else if (tipo.toUpperCase().includes('FACTURA')) {
        facturas_data[key] += item.total || 0;
      } else if (tipo.toUpperCase().includes('NOTA')) {
        notas_data[key] += item.total || 0;
      }
    });

    const boletas = months.map(m => boletas_data[m] || 0);
    const facturas = months.map(m => facturas_data[m] || 0);
    const notas = months.map(m => notas_data[m] || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['BOLETA DE VENTA ELECTRONICA S/', 'FACTURA ELECTRONICA S/', 'NOTA DE VENTA S/'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '60',
        top: '40',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'BOLETA DE VENTA ELECTRONICA S/',
          type: 'bar',
          stack: 'total',
          data: boletas,
          itemStyle: {
            color: '#ee6666'
          }
        },
        {
          name: 'FACTURA ELECTRONICA S/',
          type: 'bar',
          stack: 'total',
          data: facturas,
          itemStyle: {
            color: '#91cc75'
          }
        },
        {
          name: 'NOTA DE VENTA S/',
          type: 'bar',
          stack: 'total',
          data: notas,
          itemStyle: {
            color: '#73c0de'
          }
        }
      ]
    };
  }
};

onMounted(() => {
  // Establecer rango por defecto (este mes)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  dateRange.value = [start.getTime(), now.getTime()];

  loadDashboardData();
});
</script>

<style lang="scss" scoped>
#Dashboard {
  padding: 16px;
  background: #f5f7fa;
}

.mb-3 {
  margin-bottom: 16px;
}

.dashboard-header {
  background: white;
}

.stat-card {
  background: white;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.payment-card {
  background: #f8f9fa;
  min-height: 180px;
}

.channel-card {
  background: white;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.order-stat {
  padding: 16px;
  text-align: center;
}

.mini-chart {
  flex-shrink: 0;
}
</style>
