import {defineStore} from "pinia";
import {getUbigee} from '@/api/modules/customer'

export const useCustomerStore = defineStore('customer', {
    state: () => ({
        countries: [],
        ubigee: []
    }),
    getters: {},
    actions: {
        initializeStore() {
            getUbigee()
                .then(response => {
                    /* this.countries = response.data.ubigee.countries.map(country => ({
                        label: country.description,
                        value: country.id,
                      })) */
                    this.ubigee = response.data.map(department => ({
                        label: department.description,
                        value: department.id,
                        children: department.provinces.map(province => ({
                            label: province.description,
                            value: province.id,
                            children: province.districts.map(district => ({
                                label: district.description,
                                value: district.id,
                            })),
                        })),
                    }))
                })
                .catch(error => {
                    console.error(error)
                })
        }
    }
})