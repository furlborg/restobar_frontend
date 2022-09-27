import { defineStore } from "pinia";
import { getUbigee } from "@/api/modules/customer";

export const useCustomerStore = defineStore("customer", {
  state: () => ({
    countries: [],
    ubigee: [],
  }),
  getters: {},
  actions: {
    async initializeStore() {
      if (
        localStorage.getItem("ubigee") &&
        localStorage.getItem("ubigee").length > 0
      ) {
        this.ubigee = JSON.parse(localStorage.getItem("ubigee"));
      } else {
        await getUbigee()
          .then((response) => {
            this.ubigee = response.data.map((department) => ({
              label: department.description,
              value: department.id,
              children: department.provinces.map((province) => ({
                label: province.description,
                value: province.id,
                children: province.districts.map((district) => ({
                  label: district.description,
                  value: district.id,
                })),
              })),
            }));
            localStorage.setItem("ubigee", JSON.stringify(this.ubigee));
          })
          .catch((error) => {
            console.error(error);
          });
      }
    },
  },
});
