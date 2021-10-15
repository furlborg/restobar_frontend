import {defineStore} from "pinia"
import {getTables} from '@/api/modules/tables'

export const useTableStore = defineStore('table', {
    state: () => ({
        areas: []
    }),
    getters: {
        getAreasOptions() {
            return this.areas.map(area => ({
                label: area.description,
                value: area.id
            }))
        }
    },
    actions: {
        initializeStore() {
            getTables()
                .then(response => {
                    this.areas = response.data
                }).catch(error => {
                    console.error(error)
                })
        },
    }
})