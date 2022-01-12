import { defineStore } from "pinia";
import { getBusinessBranchs } from '@/api/modules/business'
export const useBusinessStore = defineStore('business', {
    state: () => ({
        business: null,
    }),
    actions: {
        initializeStore() {
            getBusinessBranchs()
                .then(response => {
                    this.business = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
        refreshBusiness() {
            return getBusinessBranchs()
                .then(response => {
                    this.business = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        }
    }
})