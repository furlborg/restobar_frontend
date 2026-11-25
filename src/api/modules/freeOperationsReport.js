import { http } from "@/api";

// Reporte de operaciones gratuitas e IGV de retiros (FLZ-REP-05/06).
// Requiere el permiso view_free_operations_report (403 si no).

export async function listFreeOperations(params) {
  return await http.get("reports/free-operations/", { params });
}

export async function getFreeOperationsOptions() {
  return await http.get("reports/free-operations/options/");
}
