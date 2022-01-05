import { defineStore } from "pinia"
import { cloneDeep } from "@/utils";

export const useOrderStore = defineStore('order', {
    state: () => ({
        orders: [],
    }),
    getters: {
        orderList(state) {
            state.orders.forEach(order => order.subTotal = order.quantity * order.price.toFixed(2))
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
            const existence = this.orders.find(order => order.id === product.id)
            if (typeof existence !== "undefined") {
                existence.quantity++
            } else {
                let order = cloneDeep(product)
                order.quantity++
                this.orders.push(order)
            }
        }
    }
})