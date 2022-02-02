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

export async function createTableOrder(idTable, details) {
    return await http.post(`tables/${idTable}/take_order/`, {
        order_details: {
            product: details.product,
            indication: details.indication,
            quantity: details.quantity
        },
    })
}
