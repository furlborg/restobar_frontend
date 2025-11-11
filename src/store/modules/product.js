import { defineStore } from "pinia";
import {
  getProductCategories,
  getProductPlaces,
  getProductAffectations,
  getProductFittings,
} from "@/api/modules/products";
import { usePrinterStore } from "@/store/modules/printer";
import { getDeviceType } from "@/utils";

export const useProductStore = defineStore("product", {
  state: () => ({
    categories: [],
    places: [],
    affectations: [],
    fittings: [],
  }),
  getters: {
    affectationsOptions() {
      return this.affectations.map((affectation) => ({
        value: affectation.id,
        label: affectation.description,
      }));
    },
    getPlacesPrinters() {
      return this.places.map((place) => place.printer_name);
    },
    getFittingsOptions() {
      return this.fittings.map((fitting) => ({
        value: fitting.id,
        label: fitting.name,
        ...fitting
      }));
    },
  },
  actions: {
    async initializeStore() {
      await getProductCategories()
        .then((response) => {
          this.categories = response.data.filter(cat =>!cat.is_disabled);
        })
        .catch((error) => {
          console.error(error);
        });
      await getProductPlaces()
        .then((response) => {
          const printerStore = usePrinterStore();
          this.places = response.data;
          printerStore.managedPrinters = [
            printerStore.managedPrinters[0],
            ...this.getPlacesPrinters,
          ];
          if (
            getDeviceType() === "desktop" &&
            printerStore.qz.websocket.isActive()
          )
            printerStore.startListeningPrinters();
        })
        .catch((error) => {
          console.error(error);
        });
      await getProductAffectations()
        .then((response) => {
          this.affectations = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
      await getProductFittings()
        .then((response) => {
          this.fittings = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async refreshCategories() {
      return await getProductCategories()
        .then((response) => {
          this.categories = response.data.filter(cat =>!cat.is_disabled);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async tableCategories() {

      try {
        const response = await getProductCategories();

        if (response?.data) {
          this.categories = response.data.filter((cat) => {
            const isEnabled = !cat.is_disabled;
            const hasProducts = cat.has_products === true;
            return isEnabled && hasProducts;
          })
          // Ordenar las categorías por descripción
          // .sort((a, b) =>
          //   a.description.toLowerCase().localeCompare(b.description.toLowerCase())
          // )
          ;
        } else {
          console.warn("⚠️ No hay response.data o está vacío");
        }
      } catch (error) {
        console.error("❌ Error en tableCategories:", error);
      }
    },
    async refreshPlaces() {
      return await getProductPlaces()
        .then((response) => {
          const printerStore = usePrinterStore();
          this.places = response.data;
          printerStore.managedPrinters = [
            printerStore.managedPrinters[0],
            ...this.getPlacesPrinters,
          ];
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getCategorieID(description) {
      const categorie = this.categories.find(
        (categorie) => categorie.description === description
      );
      if (categorie) {
        return categorie.id;
      } else {
        return null;
      }
    },
    getCategorieDescription(id) {
      const categorie = this.categories.find(
        (categorie) => categorie.id === Number(id)
      );
      if (categorie) {
        return categorie.description;
      } else {
        return null;
      }
    },
    getPlacePrinterName(description) {
      const place = this.places.find(
        (place) => place.description === description
      );
      if (place) {
        return place.printer_name;
      } else {
        return null;
      }
    },
    getPlacePrinterPlace(printer) {
      const place = this.places.find((place) => place.printer_name === printer);
      if (place) {
        return place.description;
      } else {
        return null;
      }
    },
    getPlacePrinterFormat(description) {
      const place = this.places.find(
        (place) => place.description === description
      );
      if (place) {
        return place.printer_format;
      } else {
        return null;
      }
    },
  },
});
