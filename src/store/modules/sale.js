import { defineStore } from "pinia";
import { getPaymentMethods } from '@/api/modules/sales'
import { getDocumentSeries } from '@/api/modules/business'

export const useSaleStore = defineStore('sale', {
    state: () => ({
        payment_methods: [],
        series: []
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
            getDocumentSeries()
                .then(response => {
                    this.series = response.data
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
        },
        getDocumentSeriesOptions(doc_type) {
            return this.series.filter(serie => serie.doc_type === String(doc_type)).map(serie => ({ label: serie.description, key: serie.id }))
        },
        getSerieDescription(id) {
            const serie = this.series.find(serie => serie.id === id)
            return serie ? serie.description : null
        }
    }
})