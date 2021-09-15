import {defineStore} from "pinia";

export const useCostumerStore = defineStore('customer', {
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