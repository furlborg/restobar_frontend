import { http } from "@/api";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { buildTakeawayOrderPayload } from "@/services/saleAssembler";
import { round2 } from "@/utils/money";

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

export async function takeAwayOrder(order_details, sale_product_sets, sale_data, user) {
  const businessStore = useBusinessStore();
  const settingsStore = useSettingsStore();
  const tillStore = useTillStore();
  const userStore = useUserStore();
  
  // Convert legacy parameters to unified order format
  const unifiedOrders = [
    ...order_details.map(detail => ({ ...detail, from_menu: false })),
    ...sale_product_sets.map(set => ({ ...set, from_menu: true }))
  ];
  
  // Use centralized assembler
  const { order, sale } = buildTakeawayOrderPayload(unifiedOrders, sale_data, {
    tillId: tillStore.currentTillID,
    user,
    userRole: userStore.user.role,
    businessSettings: settingsStore.business_settings
  });
  
  // Format monetary values consistently
  const formattedSale = {
    ...sale,
    icbper: round2(sale.icbper || 0).toFixed(2),
    other_charges: round2(sale.other_charges || 0).toFixed(2),
    taxed_amount: round2(sale.taxed_amount || 0).toFixed(2),
    exempt_amount: round2(sale.exempt_amount || 0).toFixed(2),
    free_amount: round2(sale.free_amount || 0).toFixed(2),
    igv_amount: round2(sale.igv_amount || 0).toFixed(2),
    total_igv: round2(sale.total_igv || sale.igv_amount || 0).toFixed(2),
    branch_office: !userStore.user.branchoffice ? businessStore.currentBranch : null,
    till: tillStore.currentTillID
  };
  
  const payload = {
    order,
    sale: formattedSale,
    total_igv: formattedSale.total_igv
  };
  
  return await http.post("orders/take_away/", payload);
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
