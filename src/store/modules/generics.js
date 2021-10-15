import {defineStore} from "pinia"
import {getDeviceType} from "@/utils"

export const useGenericsStore = defineStore('Generics', {
    state: () => ({
        device: '',
    }),
    actions: {
        initializeStore() {
            this.device = getDeviceType()
        },
        updateDevice() {
            this.device = getDeviceType()
        }
    }
})