import {http} from "@/api"
import {toTimestamp, toDate} from "@/utils/dates"

export async function getCustomers() {
    return await http.get('customers/')
}

export async function retrieveCustomer(id) {
    return await http.get(`customers/${id}/`, {
        transformResponse: [
            function (data) {
                if (data) {
                    data = JSON.parse(data)
                    data.doc_num = Number(data.doc_num)
                    data.phone = Number(data.phone)
                    data.birthdate = toTimestamp(data.birthdate)
                }
                return data
            }
        ]
    })
}

export async function getCustomersByPageNumber(searchParams, pageLimit, pageOffset) {
    if (searchParams) {
        return await http.get('customers/', {
            params: {
                doc_type: searchParams.doc_type,
                doc_num__icontains: searchParams.doc_num,
                names__icontains: searchParams.names,
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

export async function searchCustomers(searchParams,pageLimit, pageOffset) {
    return await http.get('customers/', {
        params: {
            doc_type: searchParams.doc_type,
            doc_num__icontains: searchParams.doc_num,
            names__icontains: searchParams.names,
            phone__icontains: searchParams.phone,
            limit: pageLimit,
            offset: pageOffset,
        }
    })
}

export async function createCustomer(customer) {
    return await http.post('customers/', {
        names: customer.names,
        doc_type: customer.doc_type,
        doc_num: customer.doc_num,
        gender: customer.gender,
        birthdate: toDate(customer.birthdate),
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses,
    })
}

export async function updateCustomer(idCustomer, customer) {
    return await http.put(`customers/${idCustomer}/`, {
        names: customer.names,
        doc_type: customer.doc_type,
        doc_num: customer.doc_num,
        gender: customer.gender,
        birthdate: toDate(customer.birthdate),
        phone: customer.phone,
        email: customer.email,
    })
}

export async function requestCustomerData(document) {
    return await http.post('customers/request_data/', {
        document: document,
    })
}

export async function getUbigee(){
    return await http.get('customers/ubigee/')
}
