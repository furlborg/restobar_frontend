import { http } from "@/api";

export async function getProducts(disabled = false) {
  return await http.get("products/", {
    params: {
      disabled: disabled,
    },
  });
}

export async function getProductsAll(disabled = false) {
  return await http.get("products/all", {
    params: {
      disabled: disabled,
    },
  });
}

export async function getProductSimpleSearch(search) {
  return await http.get("products/simplesearch/" + search);
}

export async function retrieveProduct(id) {
  return await http.get(`products/${id}/`, {
    transformResponse: [
      function (data) {
        if (data) {
          data = JSON.parse(data);
          data.prices = Number(data.prices).toFixed(2);
        }
        return data;
      },
    ],
  });
}

export async function createProduct(product) {
  const form = new FormData();
  form.append("code", product.code ?? "");
  form.append("name", (product.name || "").toUpperCase());
  form.append("description", product.description ?? "");
  form.append("prices", product.prices ?? "");
  form.append("purchase_price", product.purchase_price ?? 0);
  form.append("measure_unit", product.measure_unit ?? 1);
  form.append("control_stock", !!product.control_stock);
  form.append("control_supplie", !!product.control_supplie);
  form.append("stock", product.stock ?? "");
  form.append("icbper", !!product.icbper);
  form.append("number_points", product.number_points ?? "");
  form.append("redeem_points", product.redeem_points ?? "");
  form.append("category", product.category ?? "");
  form.append("preparation_place", product.preparation_place ?? "");
  form.append("branchoffice", product.branchoffice ?? "");
  form.append("quick_indications", product.quick_indications ?? "");
  form.append("affectation", product.affectation ?? "");
  form.append("igv_tax", product.igv_tax ?? 0);
  form.append("fitting", product.fitting ?? "");

  // supplies: enviar como JSON string si es un array
  if (Array.isArray(product.supplies)) {
    form.append("supplies", JSON.stringify(product.supplies));
  }

  // Imagen opcional
  if (product.image instanceof File || product.image instanceof Blob) {
    form.append("image", product.image);
  }

  return await http.post("products/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function updateProduct(idProduct, product) {
  const form = new FormData();
  form.append("code", product.code ?? "");
  form.append("name", (product.name || "").toUpperCase());
  form.append("description", product.description ?? "");
  form.append("prices", product.prices ?? "");
  form.append("purchase_price", product.purchase_price ?? 0);
  form.append("measure_unit", product.measure_unit ?? 1);
  form.append("control_stock", !!product.control_stock);
  form.append("control_supplie", !!product.control_supplie);
  form.append("stock", product.stock ?? "");
  form.append("icbper", !!product.icbper);
  form.append("number_points", product.number_points ?? "");
  form.append("redeem_points", product.redeem_points ?? "");
  form.append("category", product.category ?? "");
  form.append("preparation_place", product.preparation_place ?? "");
  form.append("branchoffice", product.branchoffice ?? "");
  form.append("quick_indications", product.quick_indications ?? "");
  form.append("affectation", product.affectation ?? "");
  form.append("igv_tax", product.igv_tax ?? 0);
  form.append("fitting", product.fitting ?? "");

  if (Array.isArray(product.supplies)) {
    form.append("supplies", JSON.stringify(product.supplies));
  }

  if (product.image instanceof File || product.image instanceof Blob) {
    form.append("image", product.image);
  }

  return await http.put(`products/${idProduct}/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function disableProduct(id) {
  return await http.delete(`products/${id}/`);
}

export async function searchProduct(
  search,
  category,
  disabled = false,
  pageLimit,
  pageOffset
) {
  const params = {
    search: search,
    disabled: disabled,
    limit: pageLimit,
    offset: pageOffset,
  };

  // Solo agregar category si tiene un valor válido
  if (category && category !== false) {
    params.category = category;
  }

  return await http.get("products/", {
    params: params,
  });
}

export async function searchProductByName(search) {
  return await http.get("products/search_products/", {
    params: {
      search: search,
    },
  });
}

export async function searchProductPrice(search) {
  return await http.get("products/search_price/", {
    params: {
      search: search,
    },
  });
}

export async function getProductCategories() {
  return await http.get("product-categories/");
}

export async function getMenuToday(menu_id = null) {
  const params = {};
  if (menu_id) params.menu_id = menu_id;
  return await http.get("menus/today", { params });
}

export async function getProductsByCategory(categoryId) {
  return await http.get(`product-categories/${categoryId}/products/`);
}

export async function createProductCategory(categorie, is_disabled) {
  return await http.post("product-categories/", {
    description: categorie.toUpperCase(),
    is_disabled
  });
}

export async function updateProductCategory(idCategorie, description, is_disabled) {
  return await http.put(`product-categories/${idCategorie}/`, {
    description: description.toUpperCase(),
    is_disabled
  });
}

export async function disableProductCategory(id) {
  return await http.delete(`product-categories/${id}/`);
}

export async function getInventoryConcepts() {
  return await http.get("inventoryconcept/");
}

export async function retrieveInventoryConcept(id) {
  return await http.get(`inventoryconcept/${id}/`);
}

export async function createInventoryConcept(concept) {
  return await http.post("inventoryconcept/", {
    concept: concept.description,
    concept_type: concept.concept_type,
  });
}

export async function updateInventoryConcept(idConcept, concept) {
  return await http.put(`inventoryconcept/${idConcept}/`, {
    concept: concept.description,
    concept_type: concept.concept_type,
  });
}

export async function deleteInventoryConcept(id) {
  return await http.delete(`inventoryconcept/${id}/`);
}

export async function createGuarnition(concept) {
  return await http.post("product-fitting/", {
    ...concept,
    preparation_place: concept.preparation_place_id
  });
}

export async function updateGuarnition(idConcept, concept) {
  return await http.put(`product-fitting/${idConcept}/`, {
    ...concept,
    preparation_place: concept.preparation_place_id
  });
}

export async function deleteGuarnition(id) {
  return await http.delete(`product-fitting/${id}/`);
}

export async function disableInventoryConcepts(id) {
  return await http.delete(`inventoryconcept/${id}/`);
}

export async function getProductPlaces() {
  return await http.get("preparation-places/");
}

export async function createProductPlace(place, printer_name, printer_format) {
  return await http.post("preparation-places/", {
    description: place.toUpperCase(),
    printer_name: printer_name,
    printer_format: printer_format,
  });
}

export async function updateProductPlace(
  idPlace,
  place,
  printer_name,
  printer_format
) {
  return await http.put(`preparation-places/${idPlace}/`, {
    description: place.toUpperCase(),
    printer_name: printer_name,
    printer_format: printer_format,
  });
}

export async function disableProductPlace(id) {
  return await http.delete(`preparation-places/${id}/`);
}

export async function createProductMovement(products) {
  return await http.post("productmovement/", {
    product: products.product,
    type: products.type,
    branchoffice: products.branchoffice,
    concept: products.concept,
    amount: products.amount,
  });
}

export async function getProductAffectations() {
  return await http.get("product-affectation/");
}

export async function getProductFittings() {
  return await http.get("product-fitting/");
}

export async function downloadProductsSoldReport({
  date_from,
  date_to,
  product,
  branch_office,
  category
} = {}) {
  const params = {};
  if (date_from) params.date_from = date_from; // YYYY-MM-DD
  if (date_to) params.date_to = date_to;       // YYYY-MM-DD
  if (product) params.product = product;
  if (branch_office) params.branch_office = branch_office;
  if (category) params.category = category;

  params.format = 'xlsx';

  return await http.get("products-sold/", {
    params,
    responseType: "blob", // XLSX
  });
}

export async function getProductsSold({
  date_from,
  date_to,
  product,
  branch_office,
  category,
  ordering,
} = {}) {
  const params = {};
  if (date_from) params.date_from = date_from; // YYYY-MM-DD
  if (date_to) params.date_to = date_to;       // YYYY-MM-DD
  if (product) params.product = product;
  if (branch_office) params.branch_office = branch_office;
  if (category) params.category = category;
  if (ordering) params.ordering = ordering; // e.g. '-total' or '-counter'
  params.format = 'json'; // fuerza JSON en DRF si está habilitado

  return await http.get('products-sold/', {
    params,
  });
}
