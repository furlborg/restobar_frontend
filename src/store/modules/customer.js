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
                    this.countries = response.data.ubigee.countries.map(country => ({
                        label: country.description,
                        value: country.id,
                      }))
                    this.ubigee = response.data.ubigee.departments.map(department => ({
                        label: department.description,
                        value: department.id,
                        children: response.data.ubigee.provinces.filter(province => (
                            province.departament == department.id
                        )).map(province => ({
                            label: province.description,
                            value: province.id,
                            children: response.data.ubigee.districts.filter(district => (
                                district.province == province.id
                            )).map(district => ({
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