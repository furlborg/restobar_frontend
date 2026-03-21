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
      console.log("Initializing customer store...");
      const ubigeeData = localStorage.getItem("ubigee");

      if (ubigeeData) {
        try {
          const parsed = JSON.parse(ubigeeData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.ubigee = parsed;
            console.log("Ubigee loaded from localStorage", this.ubigee);
            return;
          } else {
            console.warn(
              "Ubigee data in localStorage is not a valid array",
              parsed,
            );
            localStorage.removeItem("ubigee");
          }
        } catch (error) {
          console.error("Error parsing ubigee data from localStorage", error);
          localStorage.removeItem("ubigee");
        }
      }

      try {
        const response = await getUbigee();
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
      } catch (error) {
        console.error("Error fetching ubigee:", error);
        this.ubigee = [];
      }
    },
  },
});
