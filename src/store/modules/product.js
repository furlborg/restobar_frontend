import { defineStore } from "pinia";
import {
  getProductCategories,
  getProductPlaces,
  getProductAffectations,
  getProductFittings,
  getProductCatalog,
} from "@/api/modules/products";
import { usePrinterStore } from "@/store/modules/printer";
import { getDeviceType } from "@/utils";

export const useProductStore = defineStore("product", {
  state: () => ({
    categories: [],
    places: [],
    affectations: [],
    fittings: [],
    catalog: [],
    isCatalogLoaded: false,
    loadingCatalog: false,
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
      // Cargar catálogo ultraligero (< 3 KB comprimido) en segundo plano
      this.loadCatalog().catch(() => {});
    },
    async loadCatalog(force = false) {
      if (this.isCatalogLoaded && !force && this.catalog.length) {
        return this.catalog;
      }
      if (this.loadingCatalog) return this.catalog;
      this.loadingCatalog = true;
      try {
        const response = await getProductCatalog();
        if (response?.data && Array.isArray(response.data)) {
          this.catalog = response.data.filter((p) => p.product_type !== "COMBO");
          this.isCatalogLoaded = true;
        }
      } catch (err) {
        console.error("Error cargando catalogo ultraligero:", err);
      } finally {
        this.loadingCatalog = false;
      }
      return this.catalog;
    },
    searchLocal(query) {
      if (!query || typeof query !== "string") return [];

      const clean = (text) => {
        let s = (text || "")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        // Separar números de letras (ej: 1lt -> 1 lt, 500ml -> 500 ml)
        s = s.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");
        s = s.replace(/([a-zA-Z]+)(\d+)/g, "$1 $2");

        // Preservar fracciones como 1/2, 1/4, 1/8
        s = s.replace(/(\d+)\/(\d+)/g, "$1ZZZFRACTZZZ$2");
        s = s.replace(/[+.,\/#!$%\^&\*;:{}=\-_`~()¿¡?\"'\[\]]/g, " ");
        s = s.replace(/ZZZFRACTZZZ/g, "/");

        // Fracciones en palabras
        s = s.replace(/\b(medio|media)\s+(litro|lt|l)\b/g, "1/2 lt");
        s = s.replace(/\b(cuarto)\s+(litro|lt|l|pollo)\b/g, "1/4 $2");
        s = s.replace(/\bmedio\b|\bmedia\b/g, "1/2");
        s = s.replace(/\bcuarto\b/g, "1/4");
        s = s.replace(/\boctavo\b/g, "1/8");

        // Unidades de volumen: litro, litros, lts, l -> lt
        s = s.replace(/\b(litros?|lts?|l)\b/g, "lt");

        // Kilos y gramos
        s = s.replace(/\b(kilos?|kilogramos?|kgs?)\b/g, "kg");
        s = s.replace(/\b(gramos?|grs?)\b/g, "gr");

        // Tamaños comunes
        s = s.replace(/\b(familiar|familiares)\b/g, "fam");
        s = s.replace(/\b(personal|personales)\b/g, "pers");
        s = s.replace(/\b(mediano|mediana|medianos|medianas)\b/g, "med");

        return s.replace(/\s+/g, " ").trim();
      };

      const phonetic = (text) =>
        clean(text)
          .replace(/v/g, "b")
          .replace(/z/g, "s")
          .replace(/c(?=[ei])/g, "s")
          .replace(/k/g, "c")
          .replace(/qu(?=[ei])/g, "c")
          .replace(/y(?=[aeiou]|$)/g, "ll");

      const levenshtein = (a, b) => {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const matrix = [];
        for (let i = 0; i <= a.length; i++) matrix[i] = [i];
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
          for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + cost
            );
          }
        }
        return matrix[a.length][b.length];
      };

      const wordSimilarity = (w1, w2) => {
        if (w1 === w2) return 1;
        if (w1.startsWith(w2) || w2.startsWith(w1)) return 0.85;
        if (w1.includes(w2) || w2.includes(w1)) return 0.75;
        const maxLen = Math.max(w1.length, w2.length);
        if (maxLen === 0) return 1;
        return 1 - levenshtein(w1, w2) / maxLen;
      };

      const rawTrim = (query || "").trim();
      if (!rawTrim) return [];

      const qClean = clean(query);
      const qPhone = phonetic(query);

      // Si query solo contenía símbolos (ej. '*', '+', '#')
      if (!qClean) {
        const rawUpper = rawTrim.toUpperCase();
        return this.catalog
          .filter(
            (p) =>
              !p.is_disabled &&
              p.product_type !== "COMBO" &&
              (p.name || "").toUpperCase().includes(rawUpper)
          )
          .slice(0, 25);
      }

      const rawUpper = rawTrim.toUpperCase();
      const hasSymbols = /[+*#\-_/.]/.test(rawUpper);

      const stopWords = new Set([
        "de", "del", "la", "las", "el", "los", "con", "y", "en", "a", "para", "al", "o", "un", "una", "por", "es", "+", "-", "/"
      ]);
      const rawTokens = qClean.split(/\s+/).filter(Boolean);
      const phoneTokens = qPhone.split(/\s+/).filter(Boolean);
      let tokens = rawTokens.filter((t) => !stopWords.has(t));
      if (!tokens.length) tokens = rawTokens;

      const stemWord = (w) => {
        if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
        if (w.endsWith("s") && w.length > 3) return w.slice(0, -1);
        return w;
      };

      const matches = [];

      for (const product of this.catalog) {
        if (product.is_disabled || product.product_type === "COMBO") continue;

        const name = clean(product.name);
        const namePhone = phonetic(product.name);
        const cat = clean(this.getCategorieDescription(product.category) || "");
        const code = clean(product.code || "");
        const priceStr = String(product.prices || "");
        const nameWords = name.split(/\s+/).filter(Boolean);
        const namePhoneWords = namePhone.split(/\s+/).filter(Boolean);

        let score = 0;
        let matchedTokens = 0;

        // Bonus si contiene literalmente los caracteres especiales buscados (ej: 'PAN *')
        if (hasSymbols && (product.name || "").toUpperCase().includes(rawUpper)) {
          score += 1500;
        }

        // 1. Coincidencias exactas
        if (name === qClean) {
          matches.push({ score: 2000 + score, product });
          continue;
        }
        if (namePhone === qPhone) {
          matches.push({ score: 1800 + score, product });
          continue;
        }

        // 2. Prefijo o inclusión completa en el nombre
        if (name.startsWith(qClean)) {
          score += 1000;
        } else if (namePhone.startsWith(qPhone)) {
          score += 900;
        } else if (name.includes(qClean)) {
          score += 650;
        } else if (namePhone.includes(qPhone)) {
          score += 600;
        }

        // 3. Alguna palabra del producto empieza con la búsqueda completa (ej: "poll" -> "CHAUFA DE POLLO")
        for (const nw of nameWords) {
          if (nw.startsWith(qClean)) {
            score += 500;
            break;
          }
        }

        // 4. Búsqueda por tokens (palabras clave individuales)
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          const pToken = phoneTokens[i] || token;
          const stem = stemWord(token);
          let tokenScore = 0;

          for (let j = 0; j < nameWords.length; j++) {
            const nw = nameWords[j];
            const npw = namePhoneWords[j] || nw;
            const nwStem = stemWord(nw);

            if (nw === token) {
              tokenScore = Math.max(tokenScore, 300);
            } else if (npw === pToken) {
              tokenScore = Math.max(tokenScore, 280);
            } else if (nw.startsWith(token) || nwStem === stem) {
              tokenScore = Math.max(tokenScore, 220);
            } else if (npw.startsWith(pToken)) {
              tokenScore = Math.max(tokenScore, 200);
            } else if (nw.includes(token) || npw.includes(pToken)) {
              tokenScore = Math.max(tokenScore, 160);
            } else if (token.length >= 4 && (nw.includes(token.slice(0, 4)) || npw.includes(pToken.slice(0, 4)))) {
              // Coincidencia de raíz (ej: "cevich" en "acevichadas")
              tokenScore = Math.max(tokenScore, 140);
            } else {
              // Similitud Levenshtein para tolerancia a errores ortográficos ("arros" -> "arroz", "mostro" -> "mostrito")
              const sim = wordSimilarity(token, nw);
              if (sim >= 0.70) {
                tokenScore = Math.max(tokenScore, Math.round(sim * 180));
              } else {
                const pSim = wordSimilarity(pToken, npw);
                if (pSim >= 0.70) {
                  tokenScore = Math.max(tokenScore, Math.round(pSim * 170));
                }
              }
            }
          }

          // Evaluar categoría
          if (cat.includes(token) || cat.includes(stem)) {
            tokenScore = Math.max(tokenScore, 120);
          } else if (phonetic(cat).includes(pToken)) {
            tokenScore = Math.max(tokenScore, 110);
          }

          // Evaluar código o precio
          if (code && code.includes(token)) {
            tokenScore = Math.max(tokenScore, 150);
          }
          if (priceStr === token) {
            tokenScore = Math.max(tokenScore, 150);
          }

          if (tokenScore > 0) {
            score += tokenScore;
            matchedTokens++;
          }
        }

        // Bonificación si coincidieron todos los tokens
        if (matchedTokens === tokens.length && tokens.length > 0) {
          score += 400;
        }

        // Similitud global de texto para consultas breves con erratas
        if (score === 0 && qClean.length >= 3) {
          const wholeSim = wordSimilarity(qClean, name);
          if (wholeSim >= 0.55) {
            score += Math.round(wholeSim * 220);
          }
        }

        if (score > 0) {
          matches.push({ score, product });
        }
      }

      matches.sort(
        (a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name)
      );
      return matches.slice(0, 25).map((m) => m.product);
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
