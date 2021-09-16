import {defineStore} from "pinia";

export const useCustomerStore = defineStore('customer', {
    state: () => ({
        isTableLoading: false,
    }),
    getters: {
    },
    actions: {
        toggleLoadingTable() {
            this.isTableLoading = !(this.isTableLoading)
        }
    }
})