import { defineStore } from "pinia";
import { useSettingsStore } from "@/store/modules/settings";

export const useOrderStore = defineStore("order", {
  state: () => ({
    orderId: null,
    orders: [], // Solo items nuevos (carrito)
    savedOrders: [], // Items ya guardados en el backend
  }),
  getters: {
    // Para el carrito (FloatingOrderButton) - solo items nuevos
    orderList(state) {
      const settingsStore = useSettingsStore();
      state.orders.forEach((order) => {
        order.subTotal = Number(order.quantity) * parseFloat(order.price).toFixed(2);
        if (order.icbper) {
          order.icbper_amount = Number(order.quantity) * parseFloat(settingsStore.businessSettings.sale.icbper_tax);
        } else {
          order.icbper_amount = 0;
        }
      });
      return state.orders;
    },
    // Para la pestaña "Pedido" - combinar items guardados + nuevos
    fullOrderList(state) {
      const settingsStore = useSettingsStore();
      const allOrders = [...state.savedOrders, ...state.orders];
      allOrders.forEach((order) => {
        order.subTotal = Number(order.quantity) * parseFloat(order.price).toFixed(2);
        if (order.icbper) {
          order.icbper_amount = Number(order.quantity) * parseFloat(settingsStore.businessSettings.sale.icbper_tax);
        } else {
          order.icbper_amount = 0;
        }
      });
      return allOrders;
    },
    // Obtener solo los productos individuales (no menús)
    productLines(state) {
      return state.orders.filter(order => !order.from_menu);
    },
    // Obtener solo los menús
    menuSets(state) {
      return state.orders.filter(order => order.from_menu);
    },
    // Para acceso reactivo a savedOrders
    savedOrderList(state) {
      return state.savedOrders;
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
        product_affectation: order.affectation,
        product_igv: order.igv_tax,
      }));
    },
  },
  actions: {
    initializeStore() {
      return null;
    },
    addMenuOrder(menuOrder) {
      this.orders.push({
        ...menuOrder,
        created_at: Date.now()
      });
    },
    addOrder(product, customer) {
      const settingsStore = useSettingsStore();
      const existence = this.orders.find(order => order.product === product.id && (customer && order.customer.id === customer.id));
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
          product_affectation: product.affectation,
          product_igv: !Number(product.igv_tax)
            ? settingsStore.businessSettings.sale.igv_tax
            : Number(product.igv_tax),
          quick_indications: product.quick_indications,
          customer: customer || null,
        };
        this.orders.push(order);
      }
    },
    addOrderItem(product) {
      const settingsStore = useSettingsStore();
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
          product_affectation: product.affectation,
          product_igv: !Number(product.igv_tax)
            ? settingsStore.businessSettings.sale.igv_tax
            : Number(product.igv_tax),
          quick_indications: product.quick_indications,
        };
        this.orders.push(order);
      }
    },
    removeOrderItem(id) {
      const index = this.orders.findIndex(order => order.id === id);
      if (index !== -1) {
        this.orders.splice(index, 1);
      }
    },
    setSavedOrders(savedOrders) {
      this.savedOrders = savedOrders;
    },
    clearNewOrders() {
      this.orders = [];
    }
  },
});
