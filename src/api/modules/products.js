import { http } from "@/api";

export async function getProducts(disabled = false) {
  return await http.get("products/", {
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
  return await http.post("products/", {
    code: product.code,
    name: product.name.toUpperCase(),
    description: product.description,
    prices: product.prices,
    purchase_price: product.purchase_price,
    measure_unit: product.measure_unit,
    control_stock: product.control_stock,
    control_supplie: product.control_supplie,
    stock: product.stock,
    icbper: product.icbper,
    number_points: product.number_points,
    redeem_points: product.redeem_points,
    category: product.category,
    preparation_place: product.preparation_place,
    branchoffice: product.branchoffice,
    supplies: product.supplies,
    quick_indications: product.quick_indications,
    affectation: product.affectation,
    igv_tax: product.igv_tax,
  });
}

export async function updateProduct(idProduct, product) {
  return await http.put(`products/${idProduct}/`, {
    code: product.code,
    name: product.name.toUpperCase(),
    description: product.description,
    prices: product.prices,
    purchase_price: product.purchase_price,
    measure_unit: product.measure_unit,
    control_stock: product.control_stock,
    control_supplie: product.control_supplie,
    stock: product.stock,
    icbper: product.icbper,
    number_points: product.number_points,
    redeem_points: product.redeem_points,
    category: product.category,
    preparation_place: product.preparation_place,
    branchoffice: product.branchoffice,
    supplies: product.supplies,
    quick_indications: product.quick_indications,
    affectation: product.affectation,
    igv_tax: product.igv_tax,
  });
}

export async function disableProduct(id) {
  return await http.delete(`products/${id}/`);
}

export async function searchProduct(
  search,
  disabled = false,
  pageLimit,
  pageOffset
) {
  return await http.get("products/", {
    params: {
      search: search,
      disabled: disabled,
      limit: pageLimit,
      offset: pageOffset,
    },
  });
}

export async function searchProductByName(search) {
  return await http.get("products/search_products/", {
    params: {
      search: search,
    },
  });
}

export async function getProductCategories() {
  return await http.get("product-categories/");
}

export async function getProductsByCategory(categoryId) {
  return await http.get(`product-categories/${categoryId}/products/`);
}

export async function createProductCategory(categorie) {
  return await http.post("product-categories/", {
    description: categorie.toUpperCase(),
  });
}

export async function updateProductCategory(idCategorie, description) {
  return await http.put(`product-categories/${idCategorie}/`, {
    description: description.toUpperCase(),
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
