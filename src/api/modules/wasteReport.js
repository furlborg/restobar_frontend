import { http } from "@/api";

// Reporte de mermas (FLZ-REP-01/02). Requiere el permiso view_waste_report (403 si no).

export async function listWaste(params) {
  return await http.get("waste-report/", { params });
}

export async function getWasteSummary(params) {
  return await http.get("waste-report/summary/", { params });
}

export async function retrieveWaste(id) {
  return await http.get(`waste-report/${id}/`);
}

export async function getWasteFilterOptions() {
  return await http.get("waste-report/options/");
}

export async function reprintWasteTicket(id) {
  return await http.post(`waste-report/${id}/reprint/`);
}
