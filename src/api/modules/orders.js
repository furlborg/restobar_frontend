import { http } from "@/api"

export async function listOrders(till) {
    return await http.get('orders/', {
        params: {
            till: till
        }
    })
}

export async function listOrdersByPage(filterParams, page, pageSize) {
    if (filterParams) {
        return await http.get('orders/', {
            params: {
                till: filterParams.till,
                page: page,
                page_size: pageSize
            }
        })
    } else {
        return await http.get('sales/', {
            params: {
                page: page,
                page_size: pageSize
            }
        })
    }
}

export async function searchOrders(filterParams, page, pageSize) {
    return await http.get('orders/', {
        params: {
            till: filterParams.till,
            page: page,
            page_size: pageSize
        }
    })
}

export async function nullOrder(order) {
    return await http.delete(`orders/${order}/`)
}

export async function listOrderDetails(order) {
    return await http.get(`orders/${order}/details/`)
}
