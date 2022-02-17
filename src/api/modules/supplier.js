import { http } from "@/api"

export async function getSupplier(url) {
    return await http.get(url)
}

export async function retrieveSupplier(id) {
    return await http.get(`supplier/${id}/`)
}

export async function createSupplier(supplier) {
    return await http.post('supplier/', {
        names: supplier.names,
        email: supplier.email,
        doc_type: supplier.doc_type,
        document: supplier.document,
        representative: supplier.representative,
        phone: supplier.phone,
        address: supplier.address
    })
}

export async function updateSupplier(id, supplier) {
    return await http.put(`supplier/${id}/`, {
        names: supplier.names,
        email: supplier.email,
        doc_type: supplier.doc_type,
        document: supplier.document,
        representative: supplier.representative,
        phone: supplier.phone,
        address: supplier.address
    })
}

export async function disableSupplier(id) {
    return await http.delete(`supplier/${id}/`)
}
