import { http } from "@/api"

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

export async function createSale(sale) {
    return await http.post('sales/', {
        order: sale.order,
        serie: sale.serie,
        number: sale.number,
        date_sale: sale.date_sale,
        count: sale.count,
        amount: sale.amount,
        invoice_type: sale.invoice_type,
        payment_method: sale.payment_method,
        payment_condition: sale.payment_condition,
        customer: sale.customer,
        address: sale.address,
        branch_office: sale.branch_office,
        discount: sale.discount,
        observations: sale.observations,
        sale_details: sale.sale_details,
    })
}

export async function getSaleNumber(serie) {
    return await http.post('sales/serie_number/', {
        number: serie
    })
}
