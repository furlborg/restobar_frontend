import { defineStore } from "pinia";
import { usePrinterStore } from "@/store/modules/printer";
import { retrieveBusinessSettings } from "@/api/modules/business";

let settingsSocket = null;

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
      try {
        const response = await retrieveBusinessSettings();
        this.business_settings = response.data;
        printerStore.initializeStore({
          ...response.data.qz_config,
          printer_name: response.data.sale.printer_name,
        });

        if (!settingsSocket) {
          const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, "");
          const socketUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${apiUrl}/ws/settings/`;
          settingsSocket = new WebSocket(socketUrl);

          settingsSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === "settings_updated") {
              this.initializeStore();
            }
          };

          settingsSocket.onclose = () => {
            settingsSocket = null;
          };
        }
      } catch (error) {
        console.error("Error in initializeStore:", error);
      }
    },
  },
});
