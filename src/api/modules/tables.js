import { http } from "@/api";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";
import { buildTableOrderPayload } from "@/services/saleAssembler";

export async function getAreas() {
    return await http.get("areas/");
}

export async function createArea(area) {
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    return await http.post("areas/", {
        description: area.description,
        branch: !userStore.user.branchoffice ? businessStore.currentBranch : null
    });
}

export async function updateArea(idArea, area) {
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    return await http.put(`areas/${ idArea }/`, {
        description: area.description,
        sale_printer: area.sale_printer,
        account_printer: area.account_printer,
        branch: !userStore.user.branchoffice ? businessStore.currentBranch : null
    });
}

export async function disableArea(id) {
    return await http.delete(`areas/${ id }/`);
}

export async function getTables() {
    return await http.get("tables/");
}

export async function createTable(areaID, table) {
    return await http.post("tables/", {
        area: areaID,
        code: table.code,
        description: table.description
    });
}

export async function updateTable(areaID, table) {
    console.log(table);
    return await http.put(`tables/${ table.id }/`, {
        area: areaID,
        code: table.code,
        description: table.description
    });
}

export async function disableTable(id) {
    return await http.delete(`tables/${ id }/`);
}

export async function changeOrderTable(id, table) {
    return await http.post(`tables/${ id }/change_order_table/`, {
        table: table
    });
}

export async function getAreasTables() {
    return await http.get("areas/areas_tables/");
}

export async function retrieveTableOrder(idTable) {
    return await http.get(`tables/${ idTable }/order/`);
}

export async function createTableOrder(
    idTable,
    details,
    user = null,
    ask_for = undefined
) {
    const tillStore = useTillStore();

    // Use centralized assembler instead of inline logic
    const payload = buildTableOrderPayload(details, {
        tillId: tillStore.currentTillID,
        orderType: "M",
        askFor: ask_for,
        user
    });

    console.log("createTableOrder - payload:", payload);

    return await http.post(`tables/${idTable}/take_order/`, payload);
}

export async function updateTableOrder(
    idTable,
    orderId,
    details,
    user,
    ask_for = undefined
) {
    const tillStore = useTillStore();
    
    // Use centralized assembler for updates
    const payload = buildTableOrderPayload(details, {
        tillId: tillStore.currentTillID,
        orderType: "M",
        askFor: ask_for,
        user: user ?? null
    });
    
    // Add update-specific fields
    payload.id = orderId;
    
    return await http.patch(`tables/${idTable}/change_order/`, payload);
}

export async function cancelTableOrder(idTable, dataAnulate) {
    console.log(dataAnulate);
    return http.post(`tables/${ idTable }/cancel_order/`, {
        ...dataAnulate,
        null_reason: dataAnulate.nullReason
    });
}

export async function performDeleteOrderDetail(
    idTable,
    orderId,
    pass,
    quantity
) {
    return await http.post(`tables/${ idTable }/remove_detail/`, {
        id: orderId,
        ...pass,
        quantity: quantity
    });
}
