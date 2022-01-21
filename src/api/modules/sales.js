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
