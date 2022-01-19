import { defineStore } from "pinia"
import { getConcepts } from "@/api/modules/tills"

export const useTillStore = defineStore('till', {
    state: () => ({
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
        }
    },
    actions: {
        initializeStore() {
            getConcepts()
                .then(response => {
                    this.concepts = response.data
                })
                .catch(error => {
                    console.error(error)
                })
        },
    }
})