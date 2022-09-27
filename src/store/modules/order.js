import { defineStore } from "pinia";
import { useSettingsStore } from "@/store/modules/settings";

export const useOrderStore = defineStore("order", {
  state: () => ({
    orderId: null,
    orders: [],
  }),
  getters: {
    orderList(state) {
      const settingsStore = useSettingsStore();
      state.orders.forEach((order) => {
        order.subTotal =
          Number(order.quantity) * parseFloat(order.price).toFixed(2);
        if (order.icbper) {
          order.icbper_amount =
            Number(order.quantity) *
            parseFloat(settingsStore.businessSettings.sale.icbper_tax);
        } else {
          order.icbper_amount = 0;
        }
      });
      return state.orders;
    },
    orderTotal(state) {
      return state.orders.reduce((acc, curVal) => {
        return (acc += curVal.price * curVal.quantity);
      }, 0);
    },
    orderToSale(state) {
      return state.orders.map((order) => ({
        product: order.product,
        product_name: order.product_name,
        price_sale: parseFloat(order.price).toFixed(2),
        quantity: Number(order.quantity),
        icbper: parseFloat(order.icbper_amount).toFixed(2),
      }));
    },
  },
  actions: {
    initializeStore() {
      return null;
    },
    addOrder(product) {
      const existence = this.orders.find(
        (order) => order.product === product.id
      );
      if (typeof existence !== "undefined") {
        existence.quantity++;
      } else {
        let order = {
          product: product.id,
          product_name: product.name,
          price: product.prices,
          quantity: 1,
          indication: [],
          icbper: product.icbper,
          quick_indications: product.quick_indications,
        };
        this.orders.push(order);
      }
    },
    addOrderItem(product) {
      const existence = this.orders.find(
        (order) => order.product === product.id
      );
      if (typeof existence !== "undefined") {
        existence.quantity += product.quantity;
        if (
          existence.indication.length === 0 &&
          product.indication.length > 0
        ) {
          existence.indication = product.indication;
        } else if (
          existence.indication.length > 0 &&
          product.indication.length > 0
        ) {
          product.indication.forEach((item) => {
            existence.indication.push(item);
          });
        }
      } else {
        let order = {
          product: product.id,
          product_name: product.name,
          price: product.prices,
          quantity: Number(product.quantity),
          indication: product.indication,
          icbper: product.icbper,
          quick_indications: product.quick_indications,
        };
        this.orders.push(order);
      }
    },
  },
});
