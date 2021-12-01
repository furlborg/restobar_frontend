import { http } from "@/api"

export async function getBusiness() {
    return await http.get('api/v1/business/')
}

export async function updateBusiness() {
    return await http.put('api/v1/business/1/')
}