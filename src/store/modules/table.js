import { defineStore } from "pinia";
import { getAreasTables } from "@/api/modules/tables";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
const businessStore = useBusinessStore();
const userStore = useUserStore();

export const useTableStore = defineStore("table", {
  state: () => ({
    areas: [],
  }),
  getters: {
    getAreasOptions() {
      let areas = this.areas;
      if (!userStore.user.branchoffice) {
        areas = areas.filter(
          (area) => area.branch === businessStore.currentBranch
        );
      } else {
        areas = areas.filter(
          (area) => area.branch === userStore.user.branchoffice
        );
      }
      return areas.map((area) => ({
        label: area.description,
        value: area.id,
      }));
    },
    branchAreas() {
      if (!userStore.user.branchoffice) {
        return this.areas.filter(
          (area) => area.branch === businessStore.currentBranch
        );
      } else {
        return this.areas.filter(
          (area) => area.branch === userStore.user.branchoffice
        );
      }
    },
  },
  actions: {
    async initializeStore() {
      await getAreasTables()
        .then((response) => {
          this.areas = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async refreshData() {
      return await getAreasTables()
        .then((response) => {
          this.areas = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getAreaByID(id) {
      let area = this.areas.find((area) => area.id === id);
      return area ? area.description : null;
    },
    getTableByID(id) {
      let table = null;
      this.areas.forEach((area) => {
        let t = area.tables.find((table) => table.id === id);
        if (typeof t !== "undefined") {
          table = t;
        }
      });
      return table;
    },
  },
});
