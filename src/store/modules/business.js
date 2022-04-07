import { defineStore } from "pinia";
import { getBusinessBranchs } from "@/api/modules/business";
export const useBusinessStore = defineStore("business", {
  state: () => ({
    business: {
      id: null,
      ruc: "",
      name: "",
      commercial_name: "",
      fiscal_address: "",
      legal_representative: "",
      phone: "",
      email: "",
      website: "",
      branchs: [],
    },
    currentBranch: 1,
  }),
  getters: {
    branchOptions() {
      return this.business.branchs.map((branch) => ({
        key: branch.id,
        label: branch.description,
        disabled: this.currentBranch === branch.id,
      }));
    },
    branchSelectOptions() {
      return this.business.branchs.map((branch) => ({
        value: branch.id,
        label: branch.description,
      }));
    },
  },
  actions: {
    async initializeStore() {
      await getBusinessBranchs()
        .then((response) => {
          this.business = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async refreshBusiness() {
      return await getBusinessBranchs()
        .then((response) => {
          this.business = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getBranchDescription(id) {
      const existence = this.business.branchs.find(
        (branch) => branch.id === id
      );
      if (typeof existence !== "undefined") {
        return existence.description;
      } else {
        return "";
      }
    },
  },
});
