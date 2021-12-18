import { defineStore } from "pinia"

export const useOrderStore = defineStore('order', {
    state: () => ({
        orders: [],
    }),
    actions: {
        initializeStore() {
            return null
        },
    }
})