import { http } from "@/api";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";

export async function listOrders(filterParams) {
  return await http.get("orders/", {
    params: {
      created__range:
        filterParams.created !== null
          ? `${filterParams.created[0]}, ${filterParams.created[1]}`
          : null,
      take_aways: filterParams.take_aways,
      tables: filterParams.tables,
      deliverys: filterParams.deliverys,
      status: filterParams.status,
    },
  });
}

export async function retrieveOrder(id) {
  return await http.get(`orders/${id}`);
}

export async function listOrdersByPage(filterParams, page, pageSize) {
  if (filterParams) {
    return await http.get("orders/", {
      params: {
        created__range:
          filterParams.created !== null
            ? `${filterParams.created[0]}, ${filterParams.created[1]}`
            : null,
        take_aways: filterParams.take_aways,
        tables: filterParams.tables,
        deliverys: filterParams.deliverys,
        status: filterParams.status,
        page: page,
        page_size: pageSize,
      },
    });
  } else {
    return await http.get("orders/", {
      params: {
        page: page,
        page_size: pageSize,
      },
    });
  }
}

export async function updateOrderStatus(order, payments) {
  return await http.patch(`orders/${order}/`, {
    status: "2",
    payments: payments,
    update_status: true,
  });
}

export async function searchOrders(filterParams, page, pageSize) {
  return await http.get("orders/", {
    params: {
      created__range:
        filterParams.created !== null
          ? `${filterParams.created[0]}, ${filterParams.created[1]}`
          : null,
      take_aways: filterParams.take_aways,
      tables: filterParams.tables,
      deliverys: filterParams.deliverys,
      status: filterParams.status,
      page: page,
      page_size: pageSize,
    },
  });
}

export async function searchOrdersAnulate(filterParams, page, pageSize) {
  return await http.get("orders/canceled_list/", {
    params: {
      created__range:
        filterParams.created !== null
          ? `${filterParams.created}`
          : null,
      take_aways: filterParams.take_aways,
      tables: filterParams.tables,
      deliverys: filterParams.deliverys,
      status: filterParams.status,
      canceled_type: filterParams.canceled_type,
      page: page,
      page_size: pageSize,
    },
  });
}

export async function nullOrder(order, dataAnulate) {
  return await http.post(`orders/${order}/secure_delete/`, {
    ...dataAnulate
  });
}

export async function listOrderDetails(order) {
  return await http.get(`orders/${order}/details/`);
}

export async function takeAwayOrder(order_details, sale_data, user) {
  const businessStore = useBusinessStore();
  const settingsStore = useSettingsStore();
  const tillStore = useTillStore();
  const userStore = useUserStore();
  let details = order_details.map((order) => ({
    product: order.product,
    quantity: order.quantity,
    initial_quantity: order.quantity,
  }));
  let order = {
    till: tillStore.currentTillID,
    order_details: details,
    order_type: sale_data.delivery_info ? "D" : "P",
    delivery_info: sale_data.delivery_info,
    ask_for: sale_data.ask_for,
    user: !user ? null : user,
    status:
      sale_data.delivery_info || userStore.user.role === "MOZO"
        ? "1"
        : settingsStore.business_settings.order.pending_takeaway
        ? "1"
        : "2",
  };
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
    customer: sale_data.customer === 0 ? null : sale_data.customer,
    address: sale_data.address,
    branch_office: !userStore.user.branchoffice
      ? businessStore.currentBranch
      : null,
    discount: sale_data.discount,
    icbper: parseFloat(sale_data.icbper).toFixed(2),
    other_charges: parseFloat(sale_data.other_charges).toFixed(2),
    observations: sale_data.observations,
    sale_details: sale_data.sale_details,
    till: tillStore.currentTillID,
    payments: sale_data.payments,
    do_update: sale_data.do_update,
    is_change: sale_data.is_change,
    taxed_amount: sale_data.taxed_amount.toFixed(2),
    exempt_amount: sale_data.exempt_amount.toFixed(2),
    free_amount: sale_data.free_amount.toFixed(2),
    igv_amount: sale_data.igv_amount.toFixed(2),
  };
  return await http.post("orders/take_away/", {
    order: order,
    sale: sale,
  });
}

export async function retrieveOrderTicket(id) {
  return await http.get(`orders/${id}/order_ticket/`);
}

export async function listProductPreparation() {
  return await http.get("product-preparation/");
}

export async function updateProductPreparation(id, status) {
  return await http.patch(`product-preparation/${id}/`, {
    status: status,
  });
}
