import { http } from "@/api"
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";

export async function getAreas() {
    return await http.get('areas/')
}

export async function createArea(area) {
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    return await http.post('areas/', {
        description: area.description,
        branch: !userStore.user.branchoffice ? businessStore.currentBranch : null,
    })
}

export async function updateArea(idArea, area) {
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    return await http.put(`areas/${idArea}/`, {
        description: area.description,
        branch: !userStore.user.branchoffice ? businessStore.currentBranch : null,
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
    const tillStore = useTillStore();
    let order_details = details.map(order => ({ product: order.product, indication: order.indication, quantity: order.quantity }))
    return await http.post(`tables/${idTable}/take_order/`, {
        till: tillStore.currentTillID,
        order_details: order_details,
    })
}

export async function updateTableOrder(idTable, orderId, details) {
    const tillStore = useTillStore();
    let order_details = details.map(order => ({ id: order.id, product: order.product, indication: order.indication, quantity: order.quantity }))
    return await http.put(`tables/${idTable}/change_order/`, {
        id: orderId,
        till: tillStore.currentTillID,
        order_details: order_details,
    })
}

export async function performDeleteOrderDetail(idTable, orderId) {
    return await http.post(`tables/${idTable}/remove_detail/`, {
        id: orderId,
    })
}
