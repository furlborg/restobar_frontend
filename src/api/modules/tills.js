import { http } from "@/api"

export async function getTills() {
    return await http.get('tills/')
}

export async function retrieveTill(id) {
    return await http.get(`tills/${id}/`)
}

export async function createTill(till) {
    return await http.post('tills/', {
        branch: 1,
        opening_responsable: till.opening_responsable,
        closing_responsable: '',
        opening_amount: till.opening_amount,
        closing_amount: '',
        opening_observations: till.opening_observations,
        closing_observations: '',
        status: true,
    })
}

export async function updateTill(idTill, till) {
    return await http.patch(`tills/${idTill}/`, {
        closing_responsable: till.closing_responsable,
        closing_amount: till.closing_amount,
        closing_observations: till.closing_observations,
        status: false,
    })
}

export async function getConcepts() {
    return await http.get('concepts/')
}
