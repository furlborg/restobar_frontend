import { http } from "@/api"

export async function getProducts() {
    return await http.get('products/')
}

export async function retrieveProduct(id) {
    return await http.get(`products/${id}/`, {
        transformResponse: [
            function (data) {
                if (data) {
                    data = JSON.parse(data)
                    data.prices = Number(data.prices).toFixed(2)
                }
                return data
            }
        ]
    })
}

export async function createProduct(product) {
    return await http.post('products/', {
        name: product.name,
        description: product.description,
        prices: product.prices,
        measure_unit: product.measure_unit,
        control_stock: product.control_stock,
        stock: product.stock,
        icbper: product.icbper,
        number_points: product.number_points,
        redeem_points: product.redeem_points,
        category_product: product.category_product,
        preparation_place: product.preparation_place,
    })
}

export async function updateProduct(idProduct, product) {
    return await http.put(`products/${idProduct}/`, {
        name: product.name,
        description: product.description,
        prices: product.prices,
        measure_unit: product.measure_unit,
        control_stock: product.control_stock,
        stock: product.stock,
        icbper: product.icbper,
        number_points: product.number_points,
        redeem_points: product.redeem_points,
        category_product: product.category_product,
        preparation_place: product.preparation_place,
    })
}

export async function disableProduct(id) {
    return await http.delete(`products/${id}/`)
}

/* export async function searchProductByPageNumber(search, pageLimit, pageOffset) {
    return await http.get('api/v1/products/', {
        params: {
            search: search,
            limit: pageLimit,
            offset: pageOffset,
        }
    })
} */

export async function searchProduct(search, pageLimit, pageOffset) {
    return await http.get('products/', {
        params: {
            search: search,
            limit: pageLimit,
            offset: pageOffset,
        }
    })
}

export async function getProductCategories() {
    return await http.get('products-categories/')
}

export async function createProductCategory(categorie) {
    return await http.post('products-categories/', {
        description: categorie.description,
    })
}

export async function updateProductCategory(idCategorie, description) {
    return await http.put(`products-categories/${idCategorie}/`, {
        description: description,
    })
}

export async function disableProductCategory(id) {
    return await http.delete(`products-categories/${id}/`)
}

export async function getProductPlaces() {
    return await http.get('preparation-places/')
}

export async function createProductPlace(place) {
    return await http.post('preparation-places/', {
        description: place.description,
    })
}

export async function updateProductPlace(idPlace, place) {
    return await http.put(`preparation-places/${idPlace}/`, {
        description: place.description,
    })
}

export async function disableProductPlace(id) {
    return await http.delete(`preparation-places/${id}/`)
}
