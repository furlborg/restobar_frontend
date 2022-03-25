import { defineStore } from "pinia"
import { getProductCategories, getProductPlaces } from '@/api/modules/products'

export const useProductStore = defineStore('product', {
    state: () => ({
        categories: [],
        places: [],
    }),
    actions: {
        async initializeStore() {
            await getProductCategories()
                .then(response => {
                    this.categories = response.data
                })
                .catch(error => {
                    console.error(error)
                })
            await getProductPlaces()
                .then(response => {
                    this.places = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
        async refreshCategories() {
            return await getProductCategories()
                .then(response => {
                    this.categories = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
        async refreshPlaces() {
            return await getProductPlaces()
                .then(response => {
                    this.places = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
        getCategorieID(description) {
            const categorie = this.categories.find(categorie => categorie.description === description)
            if (categorie) {
                return categorie.id
            } else {
                return null
            }
        },
        getCategorieDescription(id) {
            const categorie = this.categories.find(categorie => categorie.id === Number(id))
            if (categorie) {
                return categorie.description
            } else {
                return null
            }
        },
    }
})
