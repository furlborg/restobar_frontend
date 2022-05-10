import { defineStore } from "pinia";
import { retrieveBusinessSettings } from "@/api/modules/business";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        business_settings: {},
    }),
    getters: {
        businessSettings() {
            return this.business_settings
        },
    },
    actions: {
        async initializeStore() {
            await retrieveBusinessSettings()
                .then((response) => {
                    this.business_settings = response.data;
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    },
});
