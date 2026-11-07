import {defineStore} from "pinia"
import {getDeviceType} from "@/utils"

export const useGenericsStore = defineStore('Generics', {
    state: () => ({
        device: getDeviceType(),
    }),
    actions: {
        initializeStore() {
            this.device = getDeviceType()
            if (!this._resizeBound) {
                this._resizeBound = true
                window.addEventListener('resize', () => this.updateDevice())
            }
        },
        updateDevice() {
            this.device = getDeviceType()
        }
    }
})