import { http } from "@/api"

export async function getSupplies(url) {
    return await http.get(url)
}

export async function retrieveSupplies(id) {
    return await http.get(`supplies/${id}/`)
}

export async function createSupplies(supplies) {
    return await http.post('supplies/', {
        name: supplies.name,
        purchase_price: supplies.purchase_price,
        measureunit: supplies.measureunit,
        branchoffice: supplies.branchoffice,
        amount: supplies.amount
    })
}

export async function updateSupplies(id, supplies) {
    return await http.put(`supplies/${id}/`, {
        name: supplies.name,
        purchase_price: supplies.purchase_price,
        measureunit: supplies.measureunit,
        branchoffice: supplies.branchoffice,
        amount: supplies.amount
    })
}

export async function disableSupplies(id) {
    return await http.delete(`supplies/${id}/`)
}


export async function createSupplieMovement(supplies) {
    return await http.post('suppliemovement/', {
        supplie: supplies.supplie,
        type: supplies.type,
        branchoffice: supplies.branchoffice,
        concept: supplies.concept,
        amount: supplies.amount
    })
}

export async function getMeasureUnit() {
    return await http.get('measureunit')
}
export async function getConcept(search) {
    return await http.get(`inventoryconcept/${search}`)
}