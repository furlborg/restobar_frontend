import {http} from "@/api"
import {toTimestamp} from "@/utils/dates"

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

export async function getCustomersByPageNumber(pageLimit, pageOffset) {
    return await http.get('customers/', {
        params: {
            limit: pageLimit,
            offset: pageOffset,
        }
    })
}