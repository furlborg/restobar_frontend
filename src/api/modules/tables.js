import {http} from "@/api"

export async function getTables() {
    return await http.get('tables/')
}

export async function createTable(table) {
    return await http.post('tables/', {
        area: table.area,
        isDisabled: table.isDisabled
    })
}

export async function updateTable(table) {
    return await http.put(`tables/${table.id}`, {
        area: table.area,
        isDisabled: table.isDisabled,
    })
}

export async function disableTable(id) {
    return await http.delete(`tables/${id}`)
} 