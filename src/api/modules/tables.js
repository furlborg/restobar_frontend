import { http } from "@/api";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";

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
    let order_details = [];
    let product_sets = [];
    details.forEach(order => {
        if (order.from_menu) {
            // Push to product_sets
            product_sets.push({
                //menu_id: order.menu_id,
                name: "MENU",
                menu_name: order.name,
                price: order.price || order.menu_price,
                quantity: order.quantity,
                items: (order.items || []).map(item => ({
                    product_phase_id: item.product_phase_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    indication: "",
                }))
            });
        } else {
            // Normal order_detail
            order_details.push({
                product: order.product,
                indication: order.indication || [],
                quantity: order.quantity,
                customer: order.customer || null
            });
        }
    });
    const bodyRequest = {
        till: tillStore.currentTillID,
        order_type: "M",
        order_details,
        product_sets,
        ask_for,
        user
    }
    return await http.post(`tables/${idTable}/take_order/`, bodyRequest);
}

export async function updateTableOrder(
    idTable,
    orderId,
    details,
    user,
    ask_for = undefined
) {
    const tillStore = useTillStore();
    // Handle both order_details and product_sets
    let order_details = [];
    let product_sets = [];
    details.forEach(order => {
        if (order.from_menu) {
            // Build product set object and push to product_sets
            const productSet = {
                order_detail_id: order.id,
                menu_id: order.menu_name,
                name: order.name,
                price: order.price || order.menu_price,
                quantity: order.quantity,
                items: (order.items || []).map(item => ({
                    id: item.id,
                    product_phase_id: item.product_phase_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    indication: "",
                }))
            };
            if (order.product_set_id) {
                productSet.id = order.product_set_id;
            }
            product_sets.push(productSet);
        } else {
            // Normal order_detail
            order_details.push({
                id: order.id,
                product: order.product,
                indication: order.indication || [],
                quantity: order.quantity,
                customer: order.customer || null
            });
        }
    });
    // Optionally filter out zero-quantity order_details/product_sets if required (not specified)
    return await http.patch(`tables/${ idTable }/change_order/`, {
        id: orderId,
        till: tillStore.currentTillID,
        order_type: "M",
        order_details: order_details,
        product_sets: product_sets,
        ask_for: ask_for,
        user: user ?? null
    });
}

export async function cancelTableOrder(idTable, dataAnulate) {
    console.log(dataAnulate);
    return http.post(`tables/${ idTable }/cancel_order/`, {
        ...dataAnulate
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
