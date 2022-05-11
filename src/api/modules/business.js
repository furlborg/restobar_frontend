import { http } from "@/api";

export async function getBusinessBranchs() {
  return await http.get("business/business_branchs/");
}

export async function getBusiness() {
  return await http.get("business/1/");
}

export async function createBusiness() {
  return await http.post("business/");
}

export async function updateBusiness(business) {
  return await http.put("business/1/", {
    ruc: business.ruc,
    name: business.name,
    commercial_name: business.commercial_name,
    fiscal_address: business.fiscal_address,
    legal_representative: business.legal_representative,
    phone: business.phone,
    email: business.email,
    website: business.website,
  });
}

export async function updateGeneralPass(general_pass, new_pass) {
  return await http.post("business/change_general_pass/", {
    general_pass: general_pass,
    new_pass: new_pass
  });
}

export async function retrieveBusinessSettings() {
  return await http.get("business/business_settings/");
}

export async function updateBusinessSettings(business_settings) {
  return await http.put("business/business_settings/", {
    qz_config: business_settings.qz_config,
    printer: business_settings.printer,
    sale: business_settings.sale
  });
}

export async function getBranchs() {
  return await http.get("branchs/");
}

export async function getBranch(id) {
  return await http.get(`branchs/${id}/`);
}

export async function createBranch(branch) {
  return await http.post("branchs/", {
    business: 1,
    description: branch.description,
    commercial_address: branch.commercial_address,
    ubigeo: branch.ubigeo,
    phone: branch.phone,
    email: branch.email,
    extra_info: branch.extra_info,
  });
}

export async function updateBranch(id, branch) {
  return await http.put(`branchs/${id}/`, {
    business: 1,
    description: branch.description,
    commercial_address: branch.commercial_address,
    ubigeo: branch.ubigeo,
    phone: branch.phone,
    email: branch.email,
    extra_info: branch.extra_info,
  });
}

export async function getDocumentSeries() {
  return await http.get("series/");
}

export async function getDocumentSerie(idSerie) {
  return await http.get(`series/${idSerie}/`);
}

export async function createDocumentSerie(serie) {
  return await http.post("series/", {
    description: serie.description,
    doc_type: serie.doc_type,
    sucursal: serie.sucursal,
  });
}

export async function updateDocumentSerie(idSerie, serie) {
  return await http.put(`series/${idSerie}/`, {
    description: serie.description,
    doc_type: serie.doc_type,
    sucursal: serie.sucursal,
  });
}

export async function deleteDocumentSerie(idSerie) {
  return await http.delete(`series/${idSerie}/`);
}
