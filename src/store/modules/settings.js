import { defineStore } from "pinia";
import { usePrinterStore } from "@/store/modules/printer";
import { retrieveBusinessSettings } from "@/api/modules/business";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    business_settings: {},
  }),
  getters: {
    businessSettings() {
      return this.business_settings;
    },
  },
  actions: {
    async initializeStore() {
      const printerStore = usePrinterStore();
      await retrieveBusinessSettings()
        .then((response) => {
          this.business_settings = response.data;
          printerStore.initializeStore({
            ...response.data.qz_config,
            printer_name: response.data.sale.printer_name,
          });
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
});
