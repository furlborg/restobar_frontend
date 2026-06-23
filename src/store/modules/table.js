import { defineStore } from "pinia";
import { getAreasTables } from "@/api/modules/tables";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { createDiscreteApi } from "naive-ui";

const businessStore = useBusinessStore();
const userStore = useUserStore();
const { notification } = createDiscreteApi(["notification"]);

export const useTableStore = defineStore("table", {
  state: () => ({
    areas: [],
    socket: null,
    wsConnected: false,
    processedMessages: new Set(),
    lockedTables: {},
  }),
  getters: {
    getAreasOptions() {
      let areas = this.areas;
      if (!userStore.user.branchoffice) {
        areas = areas.filter(
          (area) => area.branch === businessStore.currentBranch
        );
      } else {
        areas = areas.filter(
          (area) => area.branch === userStore.user.branchoffice
        );
      }
      return areas.map((area) => ({
        label: area.description,
        value: area.id,
        sale_printer: area.sale_printer,
        account_printer: area.account_printer,
      }));
    },
    getAreasTablesOptions() {
      let areas = this.areas;

      const branchToFilter = !userStore.user.branchoffice
        ? businessStore.currentBranch
        : userStore.user.branchoffice;

      areas = areas.filter(area => area.branch === branchToFilter);

      const hasHasTablesField = areas.some(area =>
        Object.prototype.hasOwnProperty.call(area, "has_tables")
      );

      if (hasHasTablesField) {
        areas = areas.filter(area => area.has_tables === true);
      }

      return areas.map(area => ({
        label: area.description,
        value: area.id,
        sale_printer: area.sale_printer,
        account_printer: area.account_printer,
      }));
    },
    branchAreas() {
      if (!userStore.user.branchoffice) {
        return this.areas.filter(
          (area) => area.branch === businessStore.currentBranch
        );
      } else {
        return this.areas.filter(
          (area) => area.branch === userStore.user.branchoffice
        );
      }
    },
    branch_table_Areas() {
      const branchToFilter = !userStore.user.branchoffice
        ? businessStore.currentBranch
        : userStore.user.branchoffice;

      let filteredAreas = this.areas.filter(
        area => area.branch === branchToFilter
      );

      const hasHasTablesField = filteredAreas.some(area =>
        Object.prototype.hasOwnProperty.call(area, "has_tables")
      );

      if (hasHasTablesField) {
        filteredAreas = filteredAreas.filter(area => area.has_tables === true);
      }

      return filteredAreas;
    },
  },
  actions: {
    sanitizeAreas(rawAreas = []) {
      return rawAreas
        .filter((area) => !area.is_disabled)
        .map((area) => ({
          ...area,
          tables: Array.isArray(area.tables)
            ? area.tables.filter((table) => !table.is_disabled)
            : []
        }));
    },
    async initializeStore() {
      return await getAreasTables()
        .then((response) => {
          this.areas = this.sanitizeAreas(response.data);
          return this.areas;
        })
        .catch(() => {});
    },
    async refreshData() {
      return await getAreasTables()
        .then((response) => {
          this.areas = this.sanitizeAreas(response.data);
        })
        .catch(() => {});
    },
    getAreaByID(id) {
      let area = this.areas.find((area) => area.id === id);
      return area ? area.description : null;
    },
    getAreaTablesOptions(id, inverted = false) {
      let areas = this.areas.find((area) => area.id === id);
      if (typeof areas !== "undefined") {
        return areas.tables.map((table) => ({
          label: table.description,
          value: table.id,
          disabled: inverted ? !(table.status === '3') : table.status === '3'
        }));
      }
      return []
    },
    getTableByID(id) {
      let table = null;
      this.areas.forEach((area) => {
        let t = area.tables.find((table) => table.id == id);
        if (typeof t !== "undefined") {
          table = t;
          return table;
        }
      });
      return table;
    },
    connectWebSocket() {
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, '');
        const socketUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${apiUrl}/ws/print/`;

        this.socket = new WebSocket(socketUrl);

        this.socket.onopen = () => {
          this.wsConnected = true;
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'table_status_changed') {

              if (data.id && this.processedMessages.has(data.id)) {
                return;
              }

              if (data.id) {
                this.processedMessages.add(data.id);
                setTimeout(() => {
                  this.processedMessages.delete(data.id);
                }, 10000);
              }

              this.refreshData().then(() => {
                notification.info({
                  content: `Mesa ${data.table_id}: ${data.status_text}`,
                  duration: 4000
                });
              });
            }

            if (data.type === 'order_updated') {

              if (data.id && this.processedMessages.has(data.id)) {
                return;
              }

              if (data.id) {
                this.processedMessages.add(data.id);
                setTimeout(() => {
                  this.processedMessages.delete(data.id);
                }, 10000);
              }

              if (data.table_id) {
                this.refreshData();
              }
            }

            if (data.type === 'table_locked') {
              this.lockedTables = {
                ...this.lockedTables,
                [data.table_id]: {
                  table_id: data.table_id,
                  user_id: data.user_id,
                  username: data.username,
                  locked_at: data.locked_at,
                  expires_at: data.expires_at
                }
              };
            }

            if (data.type === 'table_unlocked') {
              const rest = { ...this.lockedTables };
              delete rest[data.table_id];
              this.lockedTables = rest;
            }

          } catch (error) {
            console.warn("WebSocket message parse error:", error);
          }
        };

        this.socket.onerror = () => {
          this.wsConnected = false;
        };

        this.socket.onclose = () => {
          this.wsConnected = false;
          setTimeout(() => {
            this.connectWebSocket();
          }, 3000);
        };
      } catch (error) {
        this.wsConnected = false;
      }
    },
    disconnectWebSocket() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        this.wsConnected = false;
      }
    },
  },
});
