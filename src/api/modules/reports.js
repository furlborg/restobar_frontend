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