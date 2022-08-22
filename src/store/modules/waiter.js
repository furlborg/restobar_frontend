import { defineStore } from "pinia";
import { cloneDeep } from "@/utils";

export const useWaiterStore = defineStore('waiter', {
    state: () => ({
        preOrderList: [],
        groupMode: false,
        changeTable: false,
    }),
    actions: {
        initializeStore() {
            return null
        },
        saveOrders(orders) {
            this.orderList = orders
        },
        addOrders(orders) {
            if (orders.length > 0) {
                orders.forEach(order => { this.orderList.push(order) })
            }
        }
    }
})