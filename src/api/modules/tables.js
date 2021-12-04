import { http } from "@/api"

export async function getAreasTables() {
    return await http.get('api/v1/areas-tables/')
}

export async function getTables() {
    return await http.get('api/v1/tables/')
}

export async function createTable(areaID, table) {
    return await http.post('api/v1/tables/', {
        area: areaID,
        code: table.code,
        description: table.description,
    })
}

export async function updateTable(areaID, table) {
    return await http.put(`api/v1/tables/${table.id}`, {
        area: areaID,
        code: table.code,
        description: table.description,
        is_disabled: table.is_disabled,
    })
}

export async function disableTable(id) {
    return await http.delete(`api/v1/tables/${id}`)
}