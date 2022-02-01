import { defineStore } from "pinia"
import { cloneDeep } from "@/utils";

export const useOrderStore = defineStore('order', {
    state: () => ({
        orders: [],
    }),
    getters: {
        orderList(state) {
            state.orders.forEach(order => (order.subTotal = order.quantity * parseFloat(order.price).toFixed(2), order.indications = []))
            return state.orders
        },
        orderTotal(state) {
            return state.orders.reduce((acc, curVal) => {
                return acc += curVal.price * curVal.quantity
            }, 0)
        },
    },
    actions: {
        initializeStore() {
            return null
        },
        addOrder(product) {
            const existence = this.orders.find(order => order.product === product.id)
            if (typeof existence !== "undefined") {
                existence.quantity++
            } else {
                let order = {
                    product: product.id,
                    product_name: product.name,
                    price: product.prices,
                    quantity: 1,
                }
                this.orders.push(order)
            }
        }
    }
})