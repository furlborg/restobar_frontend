import { defineStore } from "pinia";
import { getAreasTables } from "@/api/modules/tables";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { createDiscreteApi } from "naive-ui";

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
      const businessStore = useBusinessStore();
      const userStore = useUserStore();
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
      const businessStore = useBusinessStore();
      const userStore = useUserStore();
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
      const businessStore = useBusinessStore();
      const userStore = useUserStore();
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
      const businessStore = useBusinessStore();
      const userStore = useUserStore();
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
      const currentLocks = { ...this.lockedTables };
      const areas = rawAreas
        .filter((area) => !area.is_disabled)
        .map((area) => ({
          ...area,
          tables: Array.isArray(area.tables)
            ? area.tables.filter((table) => !table.is_disabled).map((table) => {
                // Sincronizar lockedTables con el bloqueo real devuelto por la base de datos
                if (table.lock_info && table.lock_info.is_active) {
                  currentLocks[table.id] = {
                    table_id: table.id,
                    user_id: table.lock_info.user,
                    username: table.lock_info.username,
                    locked_at: table.lock_info.locked_at,
                    expires_at: table.lock_info.expires_at,
                    remaining_seconds: table.lock_info.remaining_time
                  };
                } else {
                  delete currentLocks[table.id];
                }
                return table;
              })
            : []
        }));
      this.lockedTables = currentLocks;
      return areas;
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

            if (data.type === 'initial_locks_sync' && data.locks) {
              this.lockedTables = {
                ...this.lockedTables,
                ...data.locks
              };
              Object.entries(data.locks).forEach(([tblId, lock]) => {
                const t = this.getTableByID(tblId);
                if (t && t.lock_info) {
                  t.lock_info.is_active = true;
                  t.lock_info.username = lock.username;
                  t.lock_info.user_id = lock.user_id;
                }
              });
            }

            if (data.type === 'table_locked') {
              const lock = data.lock_data || data;
              const tableId = lock.table_id || lock.table;
              const userId = lock.user_id || lock.user;
              if (tableId) {
                this.lockedTables = {
                  ...this.lockedTables,
                  [tableId]: {
                    table_id: tableId,
                    user_id: userId,
                    username: lock.username,
                    locked_at: lock.locked_at,
                    expires_at: lock.expires_at
                  }
                };
                const t = this.getTableByID(tableId);
                if (t && t.lock_info) {
                  t.lock_info.is_active = true;
                  t.lock_info.username = lock.username;
                  t.lock_info.user_id = userId;
                }
              }
            }

            if (data.type === 'table_unlocked') {
              const unlock = data.unlock_data || data;
              const tableId = unlock.table_id || unlock.table;
              if (tableId) {
                const rest = { ...this.lockedTables };
                delete rest[tableId];
                this.lockedTables = rest;
                const t = this.getTableByID(tableId);
                if (t && t.lock_info) {
                  t.lock_info.is_active = false;
                }
              }
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
