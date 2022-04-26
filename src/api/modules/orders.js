import { http } from "@/api"
import { useBusinessStore } from "@/store/modules/business";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";

export async function listOrders(filterParams) {
    return await http.get('orders/', {
        params: {
            till: filterParams.till,
            created__range: filterParams.created !== null ? `${filterParams.created[0]}, ${filterParams.created[1]}` : null,
            take_aways: filterParams.take_aways,
            tables: filterParams.tables,
            deliverys: filterParams.deliverys,
            status: filterParams.status,
        }
    })
}

export async function listOrdersByPage(filterParams, page, pageSize) {
    if (filterParams) {
        return await http.get('orders/', {
            params: {
                till: filterParams.till,
                created__range: filterParams.created !== null ? `${filterParams.created[0]}, ${filterParams.created[1]}` : null,
                take_aways: filterParams.take_aways,
                tables: filterParams.tables,
                deliverys: filterParams.deliverys,
                status: filterParams.status,
                page: page,
                page_size: pageSize,
            }
        })
    } else {
        return await http.get('orders/', {
            params: {
                page: page,
                page_size: pageSize
            }
        })
    }
}

export async function updateOrderStatus(order) {
    return await http.patch(`orders/${order}/`, {
        status: '2'
    })
}

export async function searchOrders(filterParams, page, pageSize) {
    return await http.get('orders/', {
        params: {
            till: filterParams.till,
            created__range: filterParams.created !== null ? `${filterParams.created[0]}, ${filterParams.created[1]}` : null,
            take_aways: filterParams.take_aways,
            tables: filterParams.tables,
            deliverys: filterParams.deliverys,
            status: filterParams.status,
            page: page,
            page_size: pageSize,
        }
    })
}

export async function nullOrder(order, pass) {
    return await http.post(`orders/${order}/secure_delete/`, {
        pass: pass
    })
}

export async function listOrderDetails(order) {
    return await http.get(`orders/${order}/details/`)
}

export async function takeAwayOrder(order_details, sale_data, user) {
    const businessStore = useBusinessStore();
    const tillStore = useTillStore();
    const userStore = useUserStore();
    let details = order_details.map(order => ({ product: order.product, indication: order.indication, quantity: order.quantity }))
    let order = {
        till: tillStore.currentTillID,
        order_details: details,
        order_type: sale_data.delivery_info ? 'D' : 'P',
        delivery_info: sale_data.delivery_info,
        user: !user ? null : user
    }
    let sale = {
        order: sale_data.order,
        serie: sale_data.serie,
        number: sale_data.number,
        date_sale: sale_data.date_sale,
        count: sale_data.count,
        amount: sale_data.amount,
        given_amount: sale_data.given_amount,
        invoice_type: sale_data.invoice_type,
        payment_method: sale_data.payment_method,
        payment_condition: sale_data.payment_condition,
        customer: sale_data.customer,
        address: sale_data.address,
        branch_office: !userStore.user.branchoffice ? businessStore.currentBranch : null,
        discount: sale_data.discount,
        observations: sale_data.observations,
        sale_details: sale_data.sale_details
    }
    return await http.post('orders/take_away/', {
        order: order,
        sale: sale
    })
}
