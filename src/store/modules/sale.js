import { defineStore } from "pinia";
import { getPaymentMethods } from "@/api/modules/sales";
import { getDocumentSeries } from "@/api/modules/business";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useOrderStore } from "@/store/modules/order";
import { useSettingsStore } from "./settings";
const businessStore = useBusinessStore();
const userStore = useUserStore();
const orderStore = useOrderStore();

export const useSaleStore = defineStore("sale", {
  state: () => ({
    payment_methods: [],
    series: [],
    sale_details: [],
    order_initial: [],
  }),
  getters: {
    getPaymentMethodsOptions(state) {
      return state.payment_methods.filter(it => !it.is_disabled).map((payment_method) => ({
        label: payment_method.description,
        value: payment_method.id,
      }));
    },
    getSeriesOptions(state) {
      let series = state.series;
      if (!userStore.user.branchoffice) {
        series = series.filter(
          (serie) => serie.sucursal === businessStore.currentBranch
        );
      } else {
        series = series.filter(
          (serie) => serie.sucursal === userStore.user.branchoffice
        );
      }
      return series.map((serie) => ({
        label: serie.description,
        value: serie.id,
      }));
    },
      toSale(state) {
          // 1️⃣ Mapea orderList a detalles de venta
          const saleDetails = orderStore.orderList.map((order) => {
              const detail = {
                  product: order.product,
                  product_name: order.product_name,
                  product_affectation: order.product_affectation,
                  product_igv: order.product_igv,
                  price_base: parseFloat(order.price).toFixed(2),
                  igv_tax: 0,
                  discount: parseFloat(0).toFixed(2),
                  price_sale: parseFloat(order.price).toFixed(2),
                  quantity: Number(order.quantity),
                  icbper: parseFloat(order.icbper_amount || 0).toFixed(2),
              };
              this.updateDetail(detail);
              return detail;
          });

          const map = new Map();

          for (const item of saleDetails) {
              const key = item.product;

              if (!map.has(key)) {
                  // clonamos para no mutar el original
                  map.set(key, { ...item });
              } else {
                  const existing = map.get(key);
                  existing.quantity += item.quantity;
                  existing.price_sale = (parseFloat(existing.price_sale) + parseFloat(item.price_sale)).toFixed(2);
                  existing.icbper = (parseFloat(existing.icbper) + parseFloat(item.icbper)).toFixed(2);
              }
          }

          // 3️⃣ Convertimos a array
          state.sale_details = Array.from(map.values());

          console.log("Sale Details:", state.sale_details);
          return state.sale_details;
      },
      saleTotal(state) {
      return state.sale_details.reduce((acc, curVal) => {
        return (acc += curVal.price * curVal.quantity - curVal.discount);
      }, 0);
    },
  },
  actions: {
    async initializeStore() {
      await getPaymentMethods()
        .then((response) => {
          this.payment_methods = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
      await getDocumentSeries()
        .then((response) => {
          this.series = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getFreeSaleSerieByType(doc_type) {
      return this.series
        .filter((s) => !s.is_disabled && s.free_sale)
        .find((serie) => serie.doc_type === doc_type);
    },
    async refreshPaymentMethods() {
      return await getPaymentMethods()
        .then((response) => {
          this.payment_methods = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getPaymentMethodID(description) {
      const payment = this.payment_methods.find(
        (payment) => payment.description === description
      );
      if (payment) {
        return payment.id;
      } else {
        return null;
      }
    },
    getPaymentMethodDescription(id) {
      const payment = this.payment_methods.find((payment) => payment.id === id);
      if (payment) {
        return payment.description;
      } else {
        return null;
      }
    },
    async refreshSeries() {
      return await getDocumentSeries()
        .then((response) => {
          this.series = response.data;
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getDocumentSeriesOptions(doc_type) {
      let series = this.series.filter((s) => !s.is_disabled && !s.free_sale);
      if (!userStore.user.branchoffice) {
        series = series.filter(
          (serie) => serie.sucursal === businessStore.currentBranch
        );
      } else {
        series = series.filter(
          (serie) => serie.sucursal === userStore.user.branchoffice
        );
      }
      const filteredSeries = series.filter((serie) => serie.doc_type === String(doc_type));
      const options = filteredSeries.map((serie) => ({ label: serie.description, value: serie.id }));
      return options;
    },
    getSerieDescription(id) {
      const serie = this.series.find((serie) => serie.id === id);
      const description = serie ? serie.description : null;
      return description;
    },
    getSerieID(description) {
      const serie = this.series.find(
        (serie) => serie.description === description
      );
      return serie ? serie.id : null;
    },
    getFirstOption(doc_type) {
      let series = this.series.filter((s) => !s.is_disabled && !s.free_sale);
      if (!userStore.user.branchoffice) {
        series = series.filter(
          (serie) => serie.sucursal === businessStore.currentBranch
        );
      } else {
        series = series.filter(
          (serie) => serie.sucursal === userStore.user.branchoffice
        );
      }
      series = series.filter((serie) => serie.doc_type === String(doc_type));
      if (!series.length) {
        return null;
      } else {
        const firstOption = series[0].id;
        return firstOption;
      }
    },
    getOrderQuantity(id) {
      const order = this.order_initial.find((order) => order.id === id);
      return order ? order.quantity : null;
    },
    updateDetail(detail) {
      const settingsStore = useSettingsStore();
      detail.product_igv = !Number(detail.product_igv)
            ? settingsStore.businessSettings.sale.igv_tax
            : Number(detail.product_igv);
      switch (detail.product_affectation) {
        case 10:
          detail.price_base = Math.round((Number(detail.price_sale) / parseFloat(detail.product_igv + 1)) * 100) / 100;
          detail.igv_tax = Math.round((parseFloat(detail.price_sale) - parseFloat(detail.price_base)) * 100) / 100;
          console.log('Updated detail:', detail);
          break;
        case 20:
          detail.price_base = detail.price_sale
              ? parseFloat(detail.price_sale)
              : 0;
          detail.igv_tax = 0;
          break;
        case 21:
          detail.price_base = detail.price_sale
              ? parseFloat(detail.price_sale)
              : 0;
          detail.igv_tax = 0;
          break;
        default:
          console.error("Afectación inválida");
          break;
      }
    },
  },
});
