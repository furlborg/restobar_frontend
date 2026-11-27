import { http } from "@/api";

// Reporte de mermas (FLZ-REP-01/02). Requiere el permiso view_waste_report (403 si no).

export async function listWaste(params) {
  return await http.get("reports/waste/", { params });
}

export async function getWasteSummary(params) {
  return await http.get("reports/waste/summary/", { params });
}

export async function retrieveWaste(id) {
  return await http.get(`reports/waste/${id}/`);
}

export async function getWasteFilterOptions() {
  return await http.get("reports/waste/options/");
}

// Merma directa (Vía B, FLZ-MER-13): POST /order/waste/direct/ bajo /api/v1/.
export async function registerDirectWaste(payload) {
  return await http.post("order/waste/direct/", payload);
}

// Costo unitario que se congelará al registrar (receta o precio de compra).
export async function getWasteUnitCost(params) {
  return await http.get("order/waste/unit-cost/", { params });
}
