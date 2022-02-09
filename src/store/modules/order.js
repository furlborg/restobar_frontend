import { defineStore } from "pinia"

export const useOrderStore = defineStore('order', {
    state: () => ({
        orderId: null,
        orders: [],
    }),
    getters: {
        orderList(state) {
            state.orders.forEach(order => (order.subTotal = Number(order.quantity) * parseFloat(order.price).toFixed(2)))
            return state.orders
        },
        orderTotal(state) {
            return state.orders.reduce((acc, curVal) => {
                return acc += curVal.price * curVal.quantity
            }, 0)
        },
        orderToSale(state) {
            return state.orders.map(order => ({
                product: order.product,
                product_name: order.product_name,
                price_sale: parseFloat(order.price).toFixed(2),
                quantity: Number(order.quantity)
            }))
        }
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
                    indication: []
                }
                this.orders.push(order)
            }
        }
    }
})