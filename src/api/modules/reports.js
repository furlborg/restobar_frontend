import { http } from "@/api";

export async function getCashFlowReport({
  date_from,
  date_to,
  branch_office
} = {}) {
  const params = {};
  if (date_from) params.date_from = date_from;
  if (date_to) params.date_to = date_to;
  if (branch_office) params.branch_office = branch_office;
  params.format = "json";

  return await http.get("cashflow/", { params });
}

/**
 * Obtener reporte de ventas por fecha (JSON)
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.start_date - Fecha inicial YYYY-MM-DD
 * @param {string} params.end_date - Fecha final YYYY-MM-DD
 * @param {number} [params.branch_office] - ID de sucursal (opcional)
 * @param {boolean} [params.include_cancelled] - Incluir ventas anuladas (default: true)
 */
export async function getSalesByDate(params) {
  return await http.get("sales-by-date/", { params });
}

/**
 * Descargar reporte de ventas por fecha en Excel
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.start_date - Fecha inicial YYYY-MM-DD
 * @param {string} params.end_date - Fecha final YYYY-MM-DD
 * @param {number} [params.branch_office] - ID de sucursal (opcional)
 * @param {boolean} [params.include_cancelled] - Incluir ventas anuladas (default: true)
 */
export async function downloadSalesByDateReport(params) {
  const queryParams = { ...params, format: 'xlsx' };
  return await http.get("sales-by-date/", {
    params: queryParams,
    responseType: "blob",
  });
}

/**
 * Obtener reporte de ventas detalladas (JSON)
 * @param {Object} params - Parámetros de consulta
 * @param {string} [params.start_date] - Fecha inicial YYYY-MM-DD
 * @param {string} [params.end_date] - Fecha final YYYY-MM-DD
 * @param {number} [params.sale_id] - ID de venta específica
 * @param {number} [params.branch_office] - ID de sucursal (opcional)
 * @param {boolean} [params.include_cancelled] - Incluir ventas anuladas (default: false)
 */
export async function getSalesDetailed(params) {
  return await http.get("sales-detailed/", { params });
}

/**
 * Descargar reporte de ventas detalladas en Excel
 * @param {Object} params - Parámetros de consulta
 * @param {string} [params.start_date] - Fecha inicial YYYY-MM-DD
 * @param {string} [params.end_date] - Fecha final YYYY-MM-DD
 * @param {number} [params.sale_id] - ID de venta específica
 * @param {number} [params.branch_office] - ID de sucursal (opcional)
 * @param {boolean} [params.include_cancelled] - Incluir ventas anuladas (default: false)
 */
export async function downloadSalesDetailedReport(params) {
  const queryParams = { ...params, format: 'xlsx' };
  return await http.get("sales-detailed/", {
    params: queryParams,
    responseType: "blob",
  });
}

/**
 * Obtener reporte de récord de ventas con productos más vendidos
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.start_date - Fecha inicial YYYY-MM-DD (requerido)
 * @param {string} params.end_date - Fecha final YYYY-MM-DD (requerido)
 * @param {number} [params.branch_office] - ID de sucursal (opcional)
 * @param {number} [params.top_limit] - Número de productos top (default: 10)
 */
export async function getSalesRecord(params) {
  return await http.get("sales-record/", { params });
}

/**
 * Obtener estadísticas para el dashboard
 * @param {Object} params - Parámetros de consulta
 * @param {string} [params.start_date] - Fecha inicial YYYY-MM-DD (opcional, default: inicio del mes)
 * @param {string} [params.end_date] - Fecha final YYYY-MM-DD (opcional, default: hoy)
 * @param {number} [params.branch_office] - ID de sucursal (opcional)
 * @returns {Promise} Estadísticas completas del dashboard
 */
export async function getDashboardStats(params) {
  return await http.get("/sales-record/dashboard-stats/", { params });
}
