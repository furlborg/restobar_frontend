import { defineStore } from "pinia";
import { getAreasTables } from "@/api/modules/tables";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { createDiscreteApi } from "naive-ui";

const businessStore = useBusinessStore();
const userStore = useUserStore();
const { message } = createDiscreteApi(["message"]);

export const useTableStore = defineStore("table", {
  state: () => ({
    areas: [],
    socket: null,
    wsConnected: false,
    processedMessages: new Set(), // IDs de mensajes ya procesados
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
      if (!userStore.user.branchoffice) {
        areas = areas.filter(
          (area) => area.branch === businessStore.currentBranch && area.has_tables === true
        );
      } else {
        areas = areas.filter(
          (area) => area.branch === userStore.user.branchoffice && area.has_tables === true
        );
      }
      return areas.map((area) => ({
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
      if (!userStore.user.branchoffice) {
        return this.areas.filter(
          (area) => area.branch === businessStore.currentBranch && area.has_tables === true
        );
      } else {
        return this.areas.filter(
          (area) => area.branch === userStore.user.branchoffice && area.has_tables === true
        );
      }
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
        .catch((error) => {
          console.error(error);
        });
    },
    async refreshData() {
      return await getAreasTables()
        .then((response) => {
          this.areas = this.sanitizeAreas(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
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
      // Solo crear una conexión si no existe
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
              
              // Filtrar duplicados por ID
              if (data.id && this.processedMessages.has(data.id)) {
                return;
              }
              
              // Marcar como procesado
              if (data.id) {
                this.processedMessages.add(data.id);
                setTimeout(() => {
                  this.processedMessages.delete(data.id);
                }, 10000);
              }
              
              // Actualizar datos
              this.refreshData().then(() => {
                message.info(`Mesa ${data.table_id}: ${data.status_text}`);
              });
            }
            
            // Manejar actualización de orden
            if (data.type === 'order_updated') {
              
              // Filtrar duplicados por ID
              if (data.id && this.processedMessages.has(data.id)) {
                return;
              }
              
              // Marcar como procesado
              if (data.id) {
                this.processedMessages.add(data.id);
                setTimeout(() => {
                  this.processedMessages.delete(data.id);
                }, 10000);
              }
              
              // Si tiene mesa asociada, actualizar datos
              if (data.table_id) {
                this.refreshData();
              }
            }
          } catch (error) {
            console.error('Error al procesar mensaje WebSocket:', error);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('❌ Error WebSocket:', error);
          this.wsConnected = false;
        };
        
        this.socket.onclose = () => {
          this.wsConnected = false;
        };
      } catch (error) {
        console.error('Error al conectar WebSocket:', error);
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
