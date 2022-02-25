import { http } from "@/api"

export async function getTills() {
    return await http.get('tills/')
}

export async function getTillsByPageNumber(page, filterParams) {
    if (filterParams) {
        return await http.get('tills/', {
            params: {
                opening_responsable__icontains: filterParams.opening_responsable,
                closing_responsable__icontains: filterParams.closing_responsable,
                opening_amount__icontains: filterParams.opening_amount,
                closing_amount__icontains: filterParams.closing_amount,
                created__range: filterParams.created !== null ? `${filterParams.created[0]} 00:00:00, ${filterParams.created[1]} 23:59:59` : null,
                modified__range: filterParams.modified !== null ? `${filterParams.modified[0]} 00:00:00, ${filterParams.modified[1]} 23:59:59` : null,
                page: page
            }
        })
    } else {
        return await http.get('tills/', {
            params: {
                page: page
            }
        })
    }
}

export async function filterTills(page, filterParams) {
    return await http.get('tills/', {
        params: {
            opening_responsable__icontains: filterParams.opening_responsable,
            closing_responsable__icontains: filterParams.closing_responsable,
            opening_amount__icontains: filterParams.opening_amount,
            closing_amount__icontains: filterParams.closing_amount,
            created__range: filterParams.created !== null ? `${filterParams.created[0]} 00:00:00, ${filterParams.created[1]} 23:59:59` : null,
            modified__range: filterParams.modified !== null ? `${filterParams.modified[0]} 00:00:00, ${filterParams.modified[1]} 23:59:59` : null,
            page: page
        }
    })
}

export async function retrieveCurrentTill() {
    return await http.get('tills/current/')
}

export async function getCurrentTillDetails(id) {
    return await http.get(`tills/${id}/details/`)
}

export async function retrieveTill(id) {
    return await http.get(`tills/${id}/`)
}

export async function createTill(till) {
    return await http.post('tills/', {
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

export async function getTillDetails() {
    return await http.get('till_details/')
}

export async function filterTillDetails(id, filterParams) {
    return await http.get(`tills/${id}/details/`, {
        params: {
            document__icontains: filterParams.document,
            description__icontains: filterParams.description,
            amount__icontains: filterParams.amount,
            concept: filterParams.concept,
            concept__concept_type: filterParams.concept_type,
            payment_method: filterParams.payment_method,
        }
    })
}

export async function retrieveTillDetail(id) {
    return await http.get(`till_details/${id}/`)
}

export async function createTillDetails(detail) {
    return await http.post('till_details/', {
        till: detail.till,
        document: detail.document,
        description: detail.description,
        payment_method: detail.payment_method,
        amount: detail.amount,
        concept: detail.concept,
    })
}

export async function updateTillDetails(idTill, till) {
    return await http.patch(`till_details/${idTill}/`, {
        closing_responsable: till.closing_responsable,
        closing_amount: till.closing_amount,
        closing_observations: till.closing_observations,
        status: false,
    })
}

export async function nullifyDetail(idTill) {
    return await http.delete(`till_details/${idTill}`)
}

export async function getConcepts() {
    return await http.get('concepts/')
}

export async function createConcept(concept) {
    return await http.post('concepts/', {
        description: concept.description,
        concept_type: concept.concept_type,
    })
}

export async function updateConcept(idConcept, concept) {
    return await http.put(`concepts/${idConcept}/`, {
        description: concept.description,
        concept_type: concept.concept_type,
    })
}
