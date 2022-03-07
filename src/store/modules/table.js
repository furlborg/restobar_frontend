import { defineStore } from "pinia"
import { getAreasTables } from '@/api/modules/tables'
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
const businessStore = useBusinessStore();
const userStore = useUserStore();

export const useTableStore = defineStore('table', {
    state: () => ({
        areas: []
    }),
    getters: {
        getAreasOptions() {
            let areas = this.areas
            if (!userStore.user.branchoffice) {
                areas = areas.filter(area => area.branch === businessStore.currentBranch)
            } else {
                areas = areas.filter(area => area.branch === userStore.user.branchoffice)
            }
            return areas.map(area => ({
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
        },
        getAreaByID(id) {
            let area = this.areas.find(area => area.id === id)
            return area ? area.description : null
        }
    }
})