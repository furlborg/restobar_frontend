import { http } from "@/api"
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";

export async function getPaymentMethods() {
    return await http.get('payment_methods/')
}

export async function createPaymentMethod(payment_method) {
    return await http.post('payment_methods/', {
        description: payment_method.description,
    })
}

export async function updatePaymentMethod(idPayment, payment_method) {
    return await http.put(`payment_methods/${idPayment}/`, {
        description: payment_method.description,
    })
}

export async function createPaymentMethodDesc(description) {
    return await http.post('payment_methods/', {
        description: description,
    })
}

export async function updatePaymentMethodDesc(idPayment, description) {
    return await http.put(`payment_methods/${idPayment}/`, {
        description: description,
    })
}

export async function listSales(branch, till = null) {
    return await http.get('sales/', {
        params: {
            order__till: till,
            branch_office: branch
        }
    })
}

export async function listSalesByPage(filterParams, page, pageSize) {
    if (filterParams) {
        return await http.get('sales/', {
            params: {
                order__till: filterParams.order__till,
                branch_office: filterParams.branch,
                customer__names__icontains: filterParams.customer,
                serie: filterParams.serie,
                number__icontains: filterParams.number,
                payment_method: filterParams.payment_method,
                date_sale__range: filterParams.date_sale !== null ? `${filterParams.date_sale[0]} 00:00:00, ${filterParams.date_sale[1]} 23:59:59` : null,
                status: filterParams.status,
                page: page,
                page_size: pageSize
            }
        })
    } else {
        return await http.get('sales/', {
            params: {
                page: page,
                page_size: pageSize
            }
        })
    }
}

export async function searchSales(filterParams, page, pageSize) {
    return await http.get('sales/', {
        params: {
            order__till: filterParams.order__till,
            branch_office: filterParams.branch,
            customer__names__icontains: filterParams.customer,
            serie: filterParams.serie,
            number__icontains: filterParams.number,
            payment_method: filterParams.payment_method,
            date_sale__range: filterParams.date_sale !== null ? `${filterParams.date_sale[0]} 00:00:00, ${filterParams.date_sale[1]} 23:59:59` : null,
            status: filterParams.status,
            page: page,
            page_size: pageSize
        }
    })
}

export async function retrieveSale(id) {
    return await http.get(`sales/${id}/`)
}

export async function createSale(sale, pass = null) {
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    if (!pass) {
        return await http.post('sales/', {
            order: sale.order,
            serie: sale.serie,
            number: sale.number,
            date_sale: sale.date_sale,
            count: sale.count,
            amount: sale.amount.toFixed(2),
            given_amount: sale.given_amount,
            invoice_type: sale.invoice_type,
            payment_method: sale.payment_method,
            payment_condition: sale.payment_condition,
            customer: sale.customer,
            address: sale.address,
            branch_office: !userStore.user.branchoffice ? businessStore.currentBranch : null,
            discount: sale.discount,
            icbper: parseFloat(sale.icbper).toFixed(2),
            by_consumption: sale.by_consumption,
            observations: sale.observations,
            sale_details: sale.sale_details,
            payments: sale.payments,
        })
    } else {
        return await http.post('sales/', {
            pass: pass,
            order: sale.order,
            serie: sale.serie,
            number: sale.number,
            date_sale: sale.date_sale,
            count: sale.count,
            amount: sale.amount.toFixed(2),
            given_amount: sale.given_amount,
            invoice_type: sale.invoice_type,
            payment_method: sale.payment_method,
            payment_condition: sale.payment_condition,
            customer: sale.customer,
            address: sale.address,
            branch_office: !userStore.user.branchoffice ? businessStore.currentBranch : null,
            discount: sale.discount,
            icbper: parseFloat(sale.icbper).toFixed(2),
            by_consumption: sale.by_consumption,
            observations: sale.observations,
            sale_details: sale.sale_details,
            payments: sale.payments,
        })
    }
}

export async function getSaleNumber(serie) {
    return await http.post('sales/serie_number/', {
        serie: serie
    })
}

export async function sendSale(id) {
    return await http.get(`sales/${id}/send_sale/`)
}

export async function nullSale(id) {
    return await http.delete(`sales/${id}/`)
}
