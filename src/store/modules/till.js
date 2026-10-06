import { defineStore } from "pinia";
import { getConcepts, retrieveCurrentTill } from "@/api/modules/tills";

export const SYSTEM_CONCEPT_IDS = [1, 2, 3, 4, 5, 6, 7];

export const useTillStore = defineStore("till", {
  state: () => ({
    currentTillID: null,
    currentTillOrders: 0,
    concepts: [],
  }),
  getters: {
    getManualIncomeConceptsOptions() {
      return (this.concepts || [])
        .filter(
          (concept) =>
            !concept.is_disabled &&
            !SYSTEM_CONCEPT_IDS.includes(Number(concept.id)) &&
            String(concept.concept_type) === "0"
        )
        .map((concept) => ({ label: concept.description, value: concept.id }));
    },
    getManualOutcomeConceptsOptions() {
      return (this.concepts || [])
        .filter(
          (concept) =>
            !concept.is_disabled &&
            !SYSTEM_CONCEPT_IDS.includes(Number(concept.id)) &&
            String(concept.concept_type) === "1"
        )
        .map((concept) => ({ label: concept.description, value: concept.id }));
    },
    getIncomeConceptsOptions() {
      return (this.concepts || [])
        .filter(
          (concept) =>
            !concept.is_disabled && String(concept.concept_type) === "0"
        )
        .map((concept) => ({ label: concept.description, value: concept.id }));
    },
    getOutcomeConceptsOptions() {
      return (this.concepts || [])
        .filter(
          (concept) =>
            !concept.is_disabled && String(concept.concept_type) === "1"
        )
        .map((concept) => ({ label: concept.description, value: concept.id }));
    },
    getConceptsOptions() {
      return (this.concepts || [])
        .filter((concept) => !concept.is_disabled)
        .map((concept) => ({
          label: concept.description,
          value: concept.id,
        }));
    },
  },
  actions: {
    async initializeStore() {
      await retrieveCurrentTill()
        .then((response) => {
          if (response.status === 200) {
            this.currentTillID = response.data.id;
            this.currentTillOrders = response.data.orders_count;
          }
        })
        .catch((error) => {
          if (error.response.status === 404) {
            this.currentTillID = null;
          }
        });
      await getConcepts()
        .then((response) => {
          this.concepts = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async refreshConcepts() {
      return await getConcepts()
        .then((response) => {
          this.concepts = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getConceptID(description) {
      const concept = this.concepts.find(
        (concept) => concept.description === description,
      );
      if (concept) {
        return concept.id;
      } else {
        return null;
      }
    },
    getConceptDescription(id) {
      const concept = this.concepts.find((concept) => concept.id === id);
      if (concept) {
        return concept.description;
      } else {
        return null;
      }
    },
    getConceptType(id) {
      const concept = this.concepts.find((concept) => concept.id === id);
      if (concept) {
        return concept.concept_type;
      } else {
        return null;
      }
    },
  },
});
