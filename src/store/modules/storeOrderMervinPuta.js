import { defineStore } from "pinia";
import { useSettingsStore } from "@/store/modules/settings";
import { createDiscreteApi } from "naive-ui";
const { message } = createDiscreteApi(["message"]);

export const useOrderStoreMervinPuta = defineStore("orderMervinPuta", {
    state: () => ({
        orderId: null,
        orders: [{ ordersData: [], idOrder: null, collapsed: true }]
    }),
    getters: {
        orderList(state) {
            const settingsStore = useSettingsStore();
            
            state.orders.forEach(orderContainer => {
                orderContainer.ordersData.forEach(order => {
                    order.subTotal = Number(order.quantity) * parseFloat(order.price).toFixed(2);
                    
                    if(order.icbper) {
                        order.icbper_amount =
                            Number(order.quantity) * parseFloat(settingsStore.businessSettings.sale?.["icbper_tax"]);
                    } else {
                        order.icbper_amount = 0;
                    }
                });
            });
            
            return state.orders;
        },
        orderTotal(state) {
            return state.orders.reduce((acc, orderContainer) => {
                return acc + orderContainer.ordersData.reduce((sum, order) => sum + (order.price * order.quantity), 0);
            }, 0);
        },
        orderTotalDelivery(state) {
            return state.orders.reduce((acc, curVal) => {
                return (acc += curVal.price * curVal.quantity);
            }, 0);
        },
        orderToSale(state) {
            return state.orders.flatMap(orderContainer =>
                orderContainer.ordersData.map(order => ({
                    product: order.product,
                    product_name: order.product_name,
                    price_sale: parseFloat(order.price).toFixed(2),
                    quantity: Number(order.quantity),
                    icbper: parseFloat(order.icbper_amount).toFixed(2),
                    product_affectation: order.product_affectation,
                    product_igv: order.product_igv
                }))
            );
        }
    },
    actions: {
        initializeStore() {
            return null;
        },
        addOrder(product) {
            const settingsStore = useSettingsStore();
            
            // Buscar la orden donde collapsed = false
            let activeOrder = this.orders.find(order => !order.collapsed);
            
            // Si no hay ninguna orden con collapsed false, creamos una
            if(!activeOrder) {
                message.warning("Expanda alguna orden para agregar productos");
                return;
            }
            
            // Buscar si el producto ya existe en ordersData
            const existence = activeOrder.ordersData.find(item => item.product === product.id);
            
            if(existence) {
                existence.quantity++;
            } else {
                let orderItem = {
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
                    quick_indications: product.quick_indications
                };
                
                activeOrder.ordersData.push(orderItem);
            }
        },
        addOrderItem(product) {
            const settingsStore = useSettingsStore();
            
            // Buscar la orden donde collapsed = false
            let activeOrder = this.orders.find(order => !order.collapsed);
            
            // Si no hay ninguna orden con collapsed false, creamos una
            if(!activeOrder) {
                activeOrder = { ordersData: [], idOrder: null, collapsed: false };
                this.orders.push(activeOrder);
            }
            
            // Buscar si el producto ya existe en ordersData
            const existence = activeOrder.ordersData.find(item => item.product === product.id);
            
            if(existence) {
                existence.quantity += product.quantity;
                if(existence.indication.length === 0 && product.indication.length > 0) {
                    existence.indication = product.indication;
                } else if(existence.indication.length > 0 && product.indication.length > 0) {
                    product.indication.forEach(item => existence.indication.push(item));
                }
            } else {
                let orderItem = {
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
                    quick_indications: product.quick_indications
                };
                
                activeOrder.ordersData.push(orderItem);
            }
        }
    }
});
