import { http } from "@/api";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";

export async function getPaymentMethods() {
  return await http.get("payment_methods/");
}

export async function createPaymentMethod(payment_method) {
  return await http.post("payment_methods/", {
    description: payment_method.description,
  });
}

export async function updatePaymentMethod(idPayment, payment_method) {
  return await http.put(`payment_methods/${idPayment}/`, {
    description: payment_method.description,
  });
}

export async function createPaymentMethodDesc(description) {
  return await http.post("payment_methods/", {
    description: description,
  });
}

export async function updatePaymentMethodDesc(idPayment, description) {
  return await http.put(`payment_methods/${idPayment}/`, {
    description: description,
  });
}

export async function listSales(branch, till = null) {
  return await http.get("sales/", {
    params: {
      order__till: till,
      branch_office: branch,
    },
  });
}

export async function listSalesByPage(filterParams, page, pageSize) {
  if (filterParams) {
    return await http.get("sales/", {
      params: {
        order__till: filterParams.order__till,
        branch_office: filterParams.branch,
        customer__names__icontains: filterParams.customer,
        serie: filterParams.serie,
        number__icontains: filterParams.number,
        payment_method: filterParams.payment_method,
        date_sale__range:
          filterParams.date_sale !== null
            ? `${filterParams.date_sale[0]} 00:00:00, ${filterParams.date_sale[1]} 23:59:59`
            : null,
        status: filterParams.status,
        page: page,
        page_size: pageSize,
      },
    });
  } else {
    return await http.get("sales/", {
      params: {
        page: page,
        page_size: pageSize,
      },
    });
  }
}

export async function searchSales(filterParams, page, pageSize) {
  return await http.get("sales/", {
    params: {
      order__till: filterParams.order__till,
      branch_office: filterParams.branch,
      customer__names__icontains: filterParams.customer,
      serie: filterParams.serie,
      number__icontains: filterParams.number,
      payment_method: filterParams.payment_method,
      date_sale__range:
        filterParams.date_sale !== null
          ? `${filterParams.date_sale[0]} 00:00:00, ${filterParams.date_sale[1]} 23:59:59`
          : null,
      status: filterParams.status,
      page: page,
      page_size: pageSize,
    },
  });
}

export async function retrieveSale(id) {
  return await http.get(`sales/${id}/`);
}

export async function createSale(sale, pass = null) {
  const businessStore = useBusinessStore();
  const userStore = useUserStore();
  const tillStore = useTillStore();
  if (!pass) {
    return await http.post("sales/", {
      order: sale.order,
      serie: sale.serie,
      number: sale.number,
      date_sale: sale.date_sale,
      count: sale.count,
      amount: sale.amount,
      given_amount: sale.given_amount,
      invoice_type: sale.invoice_type,
      payment_method: sale.payment_method,
      payment_condition: sale.payment_condition,
      customer: sale.customer === 0 ? null : sale.customer,
      address: sale.address,
      branch_office: !userStore.user.branchoffice
        ? businessStore.currentBranch
        : null,
      discount: sale.discount,
      icbper: parseFloat(sale.icbper).toFixed(2),
      other_charges: parseFloat(sale.other_charges).toFixed(2),
      by_consumption: sale.by_consumption,
      observations: sale.observations,
      sale_details: sale.sale_details.filter((detail) => detail.quantity > 0),
      payments: sale.payments,
      till: tillStore.currentTillID,
      do_update: sale.do_update,
      is_change: sale.is_change,
      taxed_amount: parseFloat(sale.taxed_amount).toFixed(2),
      exempt_amount: parseFloat(sale.exempt_amount).toFixed(2),
      free_amount: parseFloat(sale.free_amount).toFixed(2),
      igv_amount: parseFloat(sale.igv_amount).toFixed(2),
    });
  } else {
    return await http.post("sales/", {
      pass: pass,
      order: sale.order,
      serie: sale.serie,
      number: sale.number,
      date_sale: sale.date_sale,
      count: sale.count,
      amount: sale.amount,
      given_amount: sale.given_amount,
      invoice_type: sale.invoice_type,
      payment_method: sale.payment_method,
      payment_condition: sale.payment_condition,
      customer: sale.customer === 0 ? null : sale.customer,
      address: sale.address,
      branch_office: !userStore.user.branchoffice
        ? businessStore.currentBranch
        : null,
      discount: sale.discount,
      icbper: parseFloat(sale.icbper).toFixed(2),
      other_charges: parseFloat(sale.other_charges).toFixed(2),
      by_consumption: sale.by_consumption,
      observations: sale.observations,
      sale_details: sale.sale_details.filter((detail) => detail.quantity > 0),
      payments: sale.payments,
      till: tillStore.currentTillID,
      do_update: sale.do_update,
      is_change: sale.is_change,
      taxed_amount: parseFloat(sale.taxed_amount).toFixed(2),
      exempt_amount: parseFloat(sale.exempt_amount).toFixed(2),
      free_amount: parseFloat(sale.free_amount).toFixed(2),
      igv_amount: parseFloat(sale.igv_amount).toFixed(2),
    });
  }
}

export async function getSaleNumber(serie) {
  return await http.post("sales/serie_number/", {
    serie: serie,
  });
}

export async function sendSale(id) {
  return await http.get(`sales/${id}/send_sale/`);
}

export async function nullSale(id, pass, nullReason = undefined) {
  return await http.post(`sales/${id}/secure_delete/`, {
    pass: pass,
    null_reason: nullReason,
  });
}

export async function recoverySale(id, sale, pass) {
  const businessStore = useBusinessStore();
  const userStore = useUserStore();
  const tillStore = useTillStore();
  return await http.post(`sales/${id}/recovery/`, {
    pass: pass,
    order: sale.order,
    serie: sale.serie,
    number: sale.number,
    date_sale: sale.date_sale,
    count: sale.count,
    amount: sale.amount,
    given_amount: sale.given_amount,
    invoice_type: sale.invoice_type,
    payment_method: sale.payment_method,
    payment_condition: sale.payment_condition,
    customer: sale.customer === 0 ? null : sale.customer,
    address: sale.address,
    branch_office: !userStore.user.branchoffice
      ? businessStore.currentBranch
      : null,
    discount: sale.discount,
    icbper: parseFloat(sale.icbper).toFixed(2),
    other_charges: parseFloat(sale.other_charges).toFixed(2),
    by_consumption: sale.by_consumption,
    observations: sale.observations,
    sale_details: sale.sale_details.filter((detail) => detail.quantity > 0),
    payments: sale.payments,
    till: tillStore.currentTillID,
    do_update: sale.do_update,
    is_change: sale.is_change,
    taxed_amount: parseFloat(sale.taxed_amount).toFixed(2),
    exempt_amount: parseFloat(sale.exempt_amount).toFixed(2),
    free_amount: parseFloat(sale.free_amount).toFixed(2),
    igv_amount: parseFloat(sale.igv_amount).toFixed(2),
  });
}

export async function sendWhatsapp(id, [serie, number], phone) {
  const businessStore = useBusinessStore();
  const saleStore = useSaleStore();
  return await http.post(
    "/wsp",
    {
      serie: saleStore.getSerieDescription(serie),
      number: number.toString(),
      countryCode: "+51",
      phoneNumber: phone,
      pdf: "", // `${process.env.VUE_APP_API_URL}/api/v1/sales/${id}/voucher`,
    },
    {
      baseURL: `${businessStore.business.api_url}/`,
      headers: {
        Authorization: `Bearer ${businessStore.business.api_token}`,
      },
    }
  );
}
