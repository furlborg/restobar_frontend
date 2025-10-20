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
  },
  actions: {
    async initializeStore() {
      return await getAreasTables()
        .then((response) => {
          this.areas = response.data;
          return this.areas
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async refreshData() {
      return await getAreasTables()
        .then((response) => {
          this.areas = response.data;
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
        console.log('⚠️ WebSocket ya está conectado');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, '');
        const socketUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${apiUrl}/ws/print/`;
        
        console.log('🔌 Conectando WebSocket único...');
        this.socket = new WebSocket(socketUrl);
        
        this.socket.onopen = () => {
          console.log('🟢 WebSocket único conectado');
          this.wsConnected = true;
        };
        
        this.socket.onmessage = (event) => {
          try {
            console.log('🔍 [DEBUG] Mensaje WebSocket RAW recibido:', event.data);
            
            const data = JSON.parse(event.data);
            console.log('🔍 [DEBUG] Mensaje parseado:', data);
            console.log('🔍 [DEBUG] Tipo de mensaje:', data.type);
            
            if (data.type === 'table_status_changed') {
              console.log('✅ [DEBUG] Es notificación de mesa!');
              console.log('📢 Notificación completa:', JSON.stringify(data, null, 2));
              
              // Filtrar duplicados por ID
              if (data.id && this.processedMessages.has(data.id)) {
                console.log('⏭️ Mensaje duplicado ignorado:', data.id);
                return;
              }
              
              // Marcar como procesado
              if (data.id) {
                this.processedMessages.add(data.id);
                setTimeout(() => {
                  this.processedMessages.delete(data.id);
                }, 10000);
              }
              
              console.log('🔄 [DEBUG] Actualizando datos de mesas...');
              
              // Actualizar datos
              this.refreshData().then(() => {
                console.log('✅ [DEBUG] Datos actualizados, mostrando notificación');
                message.info(`Mesa ${data.table_id}: ${data.status_text}`);
              });
            } else {
              console.log(`ℹ️ [DEBUG] Mensaje de otro tipo: ${data.type}`);
            }
          } catch (error) {
            console.error('❌ [DEBUG] Error al procesar mensaje:', error);
            console.error('❌ [DEBUG] Event data:', event.data);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('❌ Error WebSocket:', error);
          this.wsConnected = false;
        };
        
        this.socket.onclose = () => {
          console.log('🔴 WebSocket cerrado');
          this.wsConnected = false;
        };
      } catch (error) {
        console.error('Error al conectar WebSocket:', error);
        this.wsConnected = false;
      }
    },
    disconnectWebSocket() {
      if (this.socket) {
        console.log('🔌 Desconectando WebSocket...');
        this.socket.close();
        this.socket = null;
        this.wsConnected = false;
      }
    },
  },
});
