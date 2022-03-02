import { http } from "@/api"

export async function getSuplieKardex(search) {
    return await http.get(`kardexsuplie/${search}`)
}

export async function getProductKardex(search) {
    return await http.get(`kardexproduct/${search}`)
}