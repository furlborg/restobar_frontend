import { http } from "@/api"
import { toTimestamp, toDate } from "@/utils/dates"

export async function getCustomers() {
    return await http.get('customers/')
}

export async function retrieveCustomer(id) {
    return await http.get(`customers/${id}/`)
}

export async function retrieveCustomerAddresses(id) {
    return await http.get(`customers/${id}/addresses/`)
}

export async function getCustomersByPageNumber(searchParams, pageLimit, pageOffset) {
    if (searchParams) {
        return await http.get('customers/', {
            params: {
                doc_type: searchParams.doc_type,
                doc_num__icontains: searchParams.doc_num,
                names__icontains: searchParams.names,
                email__icontains: searchParams.email,
                phone__icontains: searchParams.phone,
                limit: pageLimit,
                offset: pageOffset,
            }
        })
    } else {
        return await http.get('customers/', {
            params: {
                limit: pageLimit,
                offset: pageOffset,
            }
        })
    }
}

export async function searchCustomers(searchParams, pageLimit, pageOffset) {
    return await http.get('customers/', {
        params: {
            doc_type: searchParams.doc_type,
            doc_num__icontains: searchParams.doc_num,
            names__icontains: searchParams.names,
            email__icontains: searchParams.email,
            phone__icontains: searchParams.phone,
            limit: pageLimit,
            offset: pageOffset,
        }
    })
}

export async function createCustomer(customer) {
    return await http.post('customers/', {
        names: customer.names.toUpperCase(),
        doc_type: customer.doc_type,
        doc_num: !customer.doc_num ? null : customer.doc_num,
        gender: customer.gender,
        birthdate: customer.birthdate,
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses,
    })
}

export async function updateCustomer(idCustomer, customer) {
    return await http.put(`customers/${idCustomer}/`, {
        names: customer.names.toUpperCase(),
        doc_type: customer.doc_type,
        doc_num: customer.doc_num,
        gender: customer.gender,
        birthdate: customer.birthdate,
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses,
    })
}

export async function disableCustomer(id) {
    return await http.delete(`customers/${id}/`)
}

export async function searchCustomerByName(names) {
    return await http.get('customers/search_customer/', {
        params: {
            search: names
        }
    })
}

export async function searchRucCustomer(names) {
    return await http.get('customers/search_ruc_customers/', {
        params: {
            search: names
        }
    })
}

export async function requestCustomerData(document) {
    return await http.post('customers/request_data/', {
        document: document,
    }, {
        timeout: 10000,
    })
}

export async function getUbigee() {
    return await http.get('customers/ubigee/')
}
