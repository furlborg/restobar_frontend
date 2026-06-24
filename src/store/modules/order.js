import { defineStore } from "pinia";
import { useSettingsStore } from "@/store/modules/settings";

export const useOrderStore = defineStore("order", {
  state: () => ({
    orderId: null,
    orders: [], // Solo items nuevos (carrito)
    savedOrders: [], // Items ya guardados en el backend
    waiterCustomers: [],
    waiterSelectedCustomerId: null,
    waiterCustomerCounter: 1,
  }),
  getters: {
    // Para el carrito (FloatingOrderButton) - solo items nuevos
    orderList(state) {
      const settingsStore = useSettingsStore();
      state.orders.forEach((order) => {
        // Corregir: convertir a número después de toFixed()
        order.subTotal = Number(
          (Number(order.quantity) * parseFloat(order.price)).toFixed(2),
        );
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
    // Para la pestaña "Pedido" - combinar items guardados + nuevos
    fullOrderList(state) {
      const settingsStore = useSettingsStore();
      const allOrders = [
        ...state.savedOrders,
        ...state.orders.filter((order) => !order.is_delta),
      ];
      allOrders.forEach((order) => {
        // Corregir: convertir a número después de toFixed()
        order.subTotal = Number(
          (Number(order.quantity) * parseFloat(order.price)).toFixed(2),
        );
        if (order.icbper) {
          order.icbper_amount =
            Number(order.quantity) *
            parseFloat(settingsStore.businessSettings.sale.icbper_tax);
        } else {
          order.icbper_amount = 0;
        }
      });
      return allOrders;
    },
    // Obtener solo los productos individuales (no menús ni combos)
    productLines(state) {
      return state.orders.filter(
        (order) => !order.from_menu && !order.from_combo,
      );
    },
    // Obtener solo los menús y combos (ProductSets)
    menuSets(state) {
      return state.orders.filter(
        (order) => order.from_menu || order.from_combo,
      );
    },
    // Obtener solo menús
    onlyMenus(state) {
      return state.orders.filter((order) => order.from_menu);
    },
    // Obtener solo combos
    onlyCombos(state) {
      return state.orders.filter((order) => order.from_combo);
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
    getWaiterSelectedCustomer(state) {
      if (!state.waiterSelectedCustomerId) return null;
      return state.waiterCustomers.find(c => String(c.id) === String(state.waiterSelectedCustomerId)) || null;
    }
  },
  actions: {
    initializeStore() {
      return null;
    },
    addMenuOrder(menuOrder) {
      this.orders.push({
        ...menuOrder,
        created_at: Date.now(),
      });
    },
    addComboOrder(comboOrder) {
      // Agregar combo al carrito
      this.orders.push({
        ...comboOrder,
        created_at: Date.now(),
      });
    },
    addOrder(product, customer) {
      const settingsStore = useSettingsStore();
      const productId = product?.id;
      if (!productId) return;
      const customerId = customer?.id ?? null;
      let existence;
      if (customerId != null) {
        existence = this.orders.find(
          (order) =>
            order?.product === productId && order?.customer?.id === customerId,
        );
      } else {
        existence = this.orders.find(
          (order) => order?.product === productId && !order?.customer,
        );
        if (!existence) {
          existence = this.orders.find((order) => order?.product === productId);
        }
      }
      if (typeof existence !== "undefined") {
        existence.quantity++;
      } else {
        const resolvedIgv = product?.igv_tax;
        let order = {
          product: product.id,
          product_name: product.name,
          price: product.prices,
          quantity: 1,
          indication: [],
          icbper: product?.icbper,
          product_affectation: product?.affectation,
          product_igv: !Number(resolvedIgv)
            ? settingsStore.businessSettings.sale.igv_tax
            : Number(resolvedIgv),
          quick_indications: product?.quick_indications ?? [],
          customer: customer || null,
        };
        this.orders.push(order);
      }
    },
    addOrderItem(product) {
      const settingsStore = useSettingsStore();
      const productId = product?.product ?? product?.id;
      if (!productId) return;
      const qtyToAdd = Number(product.quantity || 0);
      if (!qtyToAdd) return;
      const customerId = product?.customer?.id ?? null;
      const matchesCustomer = (order) =>
        customerId !== null
          ? order?.customer?.id === customerId
          : !order?.customer;
      const mergeIndications = (target) => {
        const incoming = Array.isArray(product.indication)
          ? product.indication
          : [];
        if (!incoming.length) return;
        if (!Array.isArray(target.indication)) target.indication = [];
        if (!target.indication.length) {
          target.indication = [...incoming];
          return;
        }
        incoming.forEach((item) => target.indication.push(item));
      };

      const savedOrder = this.savedOrders.find(
        (order) => order?.product === productId && matchesCustomer(order),
      );
      if (savedOrder) {
        savedOrder.quantity = Number(savedOrder.quantity || 0) + qtyToAdd;
        mergeIndications(savedOrder);
        if (!savedOrder.quick_indications && product.quick_indications) {
          savedOrder.quick_indications = product.quick_indications;
        }

        const deltaOrder = this.orders.find(
          (order) =>
            order?.is_delta &&
            order?.product === productId &&
            matchesCustomer(order),
        );
        if (deltaOrder) {
          deltaOrder.quantity = Number(deltaOrder.quantity || 0) + qtyToAdd;
          mergeIndications(deltaOrder);
        } else {
          const resolvedIgv = product?.igv_tax;
          this.orders.push({
            product: productId,
            product_name:
              savedOrder.product_name ?? product.product_name ?? product.name,
            price: savedOrder.price ?? product.price ?? product.prices,
            quantity: qtyToAdd,
            indication: Array.isArray(product.indication)
              ? [...product.indication]
              : [],
            icbper: savedOrder.icbper ?? product.icbper,
            product_affectation:
              savedOrder.product_affectation ?? product.affectation,
            product_igv:
              savedOrder.product_igv ??
              (!Number(resolvedIgv)
                ? settingsStore.businessSettings.sale.igv_tax
                : Number(resolvedIgv)),
            quick_indications:
              savedOrder.quick_indications ?? product.quick_indications,
            customer: savedOrder.customer ?? product.customer ?? null,
            is_delta: true,
          });
        }
        return;
      }

      const existing = this.orders.find(
        (order) =>
          !order.is_delta &&
          order?.product === productId &&
          matchesCustomer(order),
      );
      if (typeof existing !== "undefined") {
        existing.quantity = Number(existing.quantity || 0) + qtyToAdd;
        mergeIndications(existing);
        if (!existing.quick_indications && product.quick_indications) {
          existing.quick_indications = product.quick_indications;
        }
        return;
      }

      const resolvedIgv = product?.igv_tax;
      this.orders.push({
        product: productId,
        product_name: product.product_name ?? product.name,
        price: product.price ?? product.prices,
        quantity: qtyToAdd,
        indication: Array.isArray(product.indication) ? product.indication : [],
        icbper: product.icbper,
        product_affectation: product.affectation,
        product_igv: !Number(resolvedIgv)
          ? settingsStore.businessSettings.sale.igv_tax
          : Number(resolvedIgv),
        quick_indications: product.quick_indications,
        customer: product.customer ?? null,
      });
    },
    removeOrderItem(id) {
      const index = this.orders.findIndex((order) => order.id === id);
      if (index !== -1) {
        this.orders.splice(index, 1);
      }
    },
    setSavedOrders(savedOrders) {
      this.savedOrders = savedOrders;
    },
    updateOrderPrice(product_id, customer, is_delta, newPrice) {
      const customerId = typeof customer === 'object' && customer !== null ? customer.id : customer ?? null;
      const matchesCustomer = (order) => {
        if (customerId === null || customerId === undefined) {
          return !order?.customer;
        }
        const orderCustomerId = typeof order?.customer === 'object' && order?.customer !== null ? order?.customer?.id : order?.customer;
        return orderCustomerId == customerId;
      };

      const targetOrder = this.orders.find(
        (order) =>
          !!order.is_delta === !!is_delta &&
          order?.product === product_id &&
          matchesCustomer(order)
      );

      if (targetOrder && targetOrder.price !== newPrice) {
        targetOrder.price = newPrice;
      } else {
        // En caso de que sea un savedOrder (cuando se edita una orden ya enviada a cocina pero no cobrada)
        const savedOrder = this.savedOrders.find(
          (order) =>
            order?.product === product_id &&
            matchesCustomer(order)
        );
        if (savedOrder && savedOrder.price !== newPrice) {
          savedOrder.price = newPrice;
        }
      }
    },
    clearNewOrders() {
      this.orders = [];
    },
    // Nuevas acciones para el Modo Mozo (Pedidos por Cliente)
    extractWaiterCustomers(orderDetails) {
      const detectedCustomers = [];
      const seenIds = new Set();
      orderDetails.forEach(item => {
        const cid = item.customer?.id;
        if (cid && !seenIds.has(cid)) {
          seenIds.add(cid);
          detectedCustomers.push(item.customer);
        }
      });
      this.waiterCustomers = detectedCustomers;
      if (detectedCustomers.length > 0) {
        this.waiterSelectedCustomerId = detectedCustomers[0].id;
        this.waiterCustomerCounter = detectedCustomers.length + 1;
      } else {
        this.waiterSelectedCustomerId = null;
        this.waiterCustomerCounter = 1;
      }
    },
    addWaiterCustomer(name) {
      if (!name?.trim()) return;
      const newCustomer = { id: `temp_${this.waiterCustomerCounter}`, name: name.trim() };
      this.waiterCustomers.push(newCustomer);
      this.waiterSelectedCustomerId = newCustomer.id;
      this.waiterCustomerCounter++;
    },
    removeWaiterCustomer(customerId) {
      this.waiterCustomers = this.waiterCustomers.filter(c => c.id !== customerId);
      // Opcional: remover los pedidos que le pertenecían o dejarlos huérfanos. 
      // Por ahora, imitando TableOrderLayout, los quitamos del carrito de pendientes.
      this.orders = this.orders.filter(order => !order.customer || order.customer.id !== customerId);
      
      if (this.waiterSelectedCustomerId === customerId) {
        this.waiterSelectedCustomerId = this.waiterCustomers.length > 0 ? this.waiterCustomers[0].id : null;
      }
    },
    resetWaiterCustomers() {
      this.waiterCustomers = [];
      this.waiterSelectedCustomerId = null;
      this.waiterCustomerCounter = 1;
    }
  },
});
