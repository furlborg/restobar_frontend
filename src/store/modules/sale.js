import { defineStore } from "pinia";
import { getPaymentMethods } from '@/api/modules/sales'

export const useSaleStore = defineStore('sale', {
    state: () => ({
        payment_methods: [],
    }),
    getters: {
        getPaymentMethodsOptions() {
            return this.payment_methods.map(payment_method => ({
                label: payment_method.description,
                value: payment_method.id
            }))
        }
    },
    actions: {
        initializeStore() {
            getPaymentMethods()
                .then(response => {
                    this.payment_methods = response.data
                }).catch(error => {
                    console.error(error)
                })
        },
        refreshPaymentMethods() {
            return getPaymentMethods()
                .then(response => {
                    this.payment_methods = response.data
                }).catch(error => {
                    console.error(error)
                })
        },
        getPaymentMethodID(description) {
            const payment = this.payment_methods.find(payment => payment.description === description)
            if (payment) {
                return payment.id
            } else {
                return null
            }
        },
        getPaymentMethodDescription(id) {
            const payment = this.payment_methods.find(payment => payment.id === id)
            if (payment) {
                return payment.description
            } else {
                return null
            }
        }
    }
})