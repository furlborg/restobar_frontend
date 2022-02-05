import { http } from "@/api"
import { MdDetails } from "oh-vue-icons/icons"

export async function getAreas() {
    return await http.get('areas/')
}

export async function createArea(area) {
    return await http.post('areas/', {
        description: area.description,
        branch: 1,
    })
}

export async function updateArea(idArea, area) {
    return await http.put(`areas/${idArea}/`, {
        description: area.description,
        branch: 1,
    })
}

export async function getTables() {
    return await http.get('tables/')
}

export async function createTable(areaID, table) {
    return await http.post('tables/', {
        area: areaID,
        code: table.code,
        description: table.description,
    })
}

export async function updateTable(areaID, table) {
    return await http.put(`tables/${table.id}/`, {
        area: areaID,
        code: table.code,
        description: table.description,
        is_disabled: table.is_disabled,
    })
}

export async function disableTable(id) {
    return await http.delete(`tables/${id}/`)
}

export async function getAreasTables() {
    return await http.get('areas/areas_tables/')
}

export async function retrieveTableOrder(idTable) {
    return await http.get(`tables/${idTable}/order/`)
}

export async function createTableOrder(idTable, details) {
    let order_details = details.map(order => ({ product: order.product, indication: order.indication, quantity: order.quantity }))
    return await http.post(`tables/${idTable}/take_order/`, {
        order_details: order_details,
    })
}

export async function updateTableOrder(idTable, orderId, details) {
    let order_details = details.map(order => ({ id: order.id, product: order.product, indication: order.indication, quantity: order.quantity }))
    return await http.put(`tables/${idTable}/change_order/`, {
        id: orderId,
        order_details: order_details,
    })
}

export async function performDeleteOrderDetail(idTable, orderId) {
    return await http.post(`tables/${idTable}/remove_detail/`, {
        id: orderId,
    })
}
