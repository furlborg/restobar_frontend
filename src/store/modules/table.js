import { defineStore } from "pinia"
import { getAreasTables } from '@/api/modules/tables'

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
            getAreasTables()
                .then(response => {
                    this.areas = response.data
                }).catch(error => {
                    console.error(error)
                })
        },
        refreshData() {
            return getAreasTables()
                .then(response => {
                    this.areas = response.data
                }).catch(error => {
                    console.error(error)
                })
        }
    }
})