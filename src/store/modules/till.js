import { defineStore } from "pinia"
import { getConcepts } from "@/api/modules/tills"

export const useTillStore = defineStore('till', {
    state: () => ({
        concepts: []
    }),
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
        getConceptsOptions(concept_type) {
            return this.concepts.filter(concept => concept.concept_type === concept_type).map(concept => ({ label: concept.description, value: concept.id }))
        }
    }
})