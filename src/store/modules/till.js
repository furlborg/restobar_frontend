import { defineStore } from "pinia"
import { getConcepts, retrieveCurrentTill } from "@/api/modules/tills"

export const useTillStore = defineStore('till', {
    state: () => ({
        currentTillID: null,
        currentTillOrders: 0,
        concepts: []
    }),
    getters: {
        getIncomeConceptsOptions() {
            return this.concepts
                .filter(concept => concept.concept_type === '0')
                .map(concept => ({ label: concept.description, value: concept.id }))
        },
        getOutcomeConceptsOptions() {
            return this.concepts
                .filter(concept => concept.concept_type === '1')
                .map(concept => ({ label: concept.description, value: concept.id }))
        },
        getConceptsOptions() {
            return this.concepts
                .map(concept => ({ label: concept.description, value: concept.id }))
        },
    },
    actions: {
        async initializeStore() {
            await retrieveCurrentTill()
                .then(response => {
                    if (response.status === 200) {
                        this.currentTillID = response.data.id
                        this.currentTillOrders = response.data.orders_count
                    }
                })
                .catch(error => {
                    if (error.response.status === 404) {
                        this.currentTillID = null
                    }
                })
            await getConcepts()
                .then(response => {
                    this.concepts = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
        async refreshConcepts() {
            return await getConcepts()
                .then(response => {
                    this.concepts = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
        getConceptID(description) {
            const concept = this.concepts.find(concept => concept.description === description)
            if (concept) {
                return concept.id
            } else {
                return null
            }
        },
        getConceptDescription(id) {
            const concept = this.concepts.find(concept => concept.id === id)
            if (concept) {
                return concept.description
            } else {
                return null
            }
        },
        getConceptType(id) {
            const concept = this.concepts.find(concept => concept.id === id)
            if (concept) {
                return concept.concept_type
            } else {
                return null
            }
        }
    }
})