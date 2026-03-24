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
        ...fitting,
      }));
    },
  },
  actions: {
    normalizeCategoriesPayload(payload) {
      if (Array.isArray(payload?.results)) {
        return payload.results;
      }
      return payload;
    },
    async initializeStore() {
      await getProductCategories()
        .then((response) => {
          const categories = this.normalizeCategoriesPayload(response.data);
          this.categories = Array.isArray(categories)
            ? categories.filter((cat) => !cat.is_disabled)
            : [];
        })
        .catch((error) => {
          console.error(error);
        });
      await getProductPlaces()
        .then((response) => {
          const printerStore = usePrinterStore();
          this.places = response.data.filter((place) => !place.is_disabled);
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
          const categories = this.normalizeCategoriesPayload(response.data);
          this.categories = Array.isArray(categories)
            ? categories.filter((cat) => !cat.is_disabled)
            : [];
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async tableCategories() {
      try {
        const response = await getProductCategories();

        if (response?.data) {
          const categories = this.normalizeCategoriesPayload(response.data);
          if (!Array.isArray(categories)) {
            console.warn("Categorias invalidas para mesa");
            return;
          }

          const enabled = categories.filter((cat) => !cat.is_disabled);
          const withProducts = enabled.filter(
            (cat) => cat.has_products !== false,
          );

          this.categories = withProducts.length ? withProducts : enabled;
        } else {
          console.warn("No hay response.data o esta vacio");
        }
      } catch (error) {
        console.error("Error en tableCategories:", error);
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
        (categorie) => categorie.description === description,
      );
      if (categorie) {
        return categorie.id;
      } else {
        return null;
      }
    },
    getCategorieDescription(id) {
      const categorie = this.categories.find(
        (categorie) => categorie.id === Number(id),
      );
      if (categorie) {
        return categorie.description;
      } else {
        return null;
      }
    },
    getPlacePrinterName(description) {
      const place = this.places.find(
        (place) => place.description === description,
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
        (place) => place.description === description,
      );
      if (place) {
        return place.printer_format;
      } else {
        return null;
      }
    },
  },
});
