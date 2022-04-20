import { defineStore } from "pinia";
import { getPaymentMethods } from "@/api/modules/sales";
import { getDocumentSeries } from "@/api/modules/business";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useOrderStore } from "@/store/modules/order";
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
      return state.payment_methods.map((payment_method) => ({
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
      state.sale_details = orderStore.orderList.map((order) => ({
        product: order.product,
        product_name: order.product_name,
        price_sale: parseFloat(order.price).toFixed(2),
        quantity: Number(order.quantity),
      }));
      return state.sale_details;
    },
    saleTotal(state) {
      return state.sale_details.reduce((acc, curVal) => {
        return (acc += curVal.price * curVal.quantity);
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
      let series = this.series;
      if (!userStore.user.branchoffice) {
        series = series.filter(
          (serie) => serie.sucursal === businessStore.currentBranch
        );
      } else {
        series = series.filter(
          (serie) => serie.sucursal === userStore.user.branchoffice
        );
      }
      return series
        .filter((serie) => serie.doc_type === String(doc_type))
        .map((serie) => ({ label: serie.description, key: serie.id }));
    },
    getSerieDescription(id) {
      const serie = this.series.find((serie) => serie.id === id);
      return serie ? serie.description : null;
    },
    getFirstOption(doc_type) {
      let series = this.series;
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
        return series[0].id;
      }
    },
    getOrderQuantity(id) {
      const order = this.order_initial.find((order) => order.id === id);
      return order ? order.quantity : null;
    },
  },
});
