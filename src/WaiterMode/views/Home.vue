<template>
  <div class="p-3">
    <n-input-group>
      <n-select
        v-model:value="area"
        :options="tableStore.getAreasTablesOptions"
        placeholder="Seleccione area"
        :disabled="!tillStore.currentTillID || waiterStore.groupMode"
        @update:value="tableStore.refreshData()"
      >
      </n-select>
      <n-button
        type="info"
        :disabled="waiterStore.groupMode"
        @click="tableStore.refreshData()"
      >
        <v-icon name="hi-solid-refresh" />
      </n-button>
    </n-input-group>
    <n-grid
      v-if="tillStore.currentTillID"
      class="mt-3"
      cols="3"
      :x-gap="6"
      :y-gap="6"
    >
      <n-gi v-for="table in tables" :key="table.id">
        <n-card
          @click="handleTableClick(table)"
          class="position-relative"
          :class="getTableBackgroundClass(table)"
          :style="{
            borderLeft: `4px solid ${getTableColor(table)}`,
            borderRight: `4px solid ${getTableColor(table)}`
          }"
          style="cursor: pointer"
        >
          <n-checkbox
            v-if="waiterStore.groupMode"
            :checked="currentGroup.some((t) => t.id === table.id)"
            :disabled="
              tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
              currentTableGrouping === table.id
            "
            size="small"
            class="position-absolute top-0 start-0 m-2"
          />
          <v-icon
            v-if="
              waiterStore.groupMode === true &&
              tableGroups.some((g) => g.some((t) => t.id === table.id))
            "
            class="position-absolute top-50 start-50 translate-middle fs-4"
            name="ri-forbid-line"
            scale="6"
            fill="#FA8072"
          />
          <n-space align="center" :size="0" vertical>
            <img
              src="~@/assets/images/default-table.png"
              alt=""
              width="64"
              height="64"
            />
          </n-space>
          <n-text
            class="black-outline position-absolute top-50 start-50 translate-middle"
            >{{ table.description }}</n-text
          >
          <n-button
            v-if="
              table.order_amount &&
              settingsStore.business_settings.order.table_order_total
            "
            class="text-center position-absolute bottom-0 start-50 translate-middle-x fs-5 fw-bolder"
            color="#901E00"
            text
          >
            S/. {{ (Number(table?.order_amount) || 0)?.toFixed(2) }}
          </n-button>
        </n-card>
      </n-gi>
    </n-grid>
    <div v-else>
      <n-space align="center" vertical>
        <v-icon label="No Open Till" scale="6">
          <v-icon name="md-pointofsale-twotone" />
          <v-icon name="md-notinterested-round" scale="2" fill="#fC644d" />
        </v-icon>
        <n-text class="fs-3">NO SE HA APERTURADO CAJA</n-text>
      </n-space>
    </div>
    <teleport to="body">
      <n-space
        v-if="waiterStore.groupMode"
        class="position-absolute bottom-0 start-50 translate-middle-x mb-3 w-100"
        align="center"
        vertical
      >
        <n-button class="p-3" type="success" secondary @click="saveGroup"
          >Confirmar</n-button
        >
        <n-button
          class="p-3"
          type="error"
          secondary
          @click="
            waiterStore.groupMode = false;
            currentGroup = [];
            currentTableGrouping = null;
          "
          >Cancelar</n-button
        >
      </n-space>
    </teleport>
    <n-modal
      preset="card"
      v-model:show="waiterStore.changeTable"
      title="Cambiar mesa"
      :mask-closable="false"
      closable
    >
      <n-form-item label="Mesa actual" :disabled="isLoading">
        <n-select
          v-model:value="fromTable"
          :options="tableStore.getAreaTablesOptions(area, true)"
          placeholder=""
        />
      </n-form-item>
      <n-form-item label="Area">
        <n-select
          v-model:value="currentArea"
          :options="tableStore.getAreasOptions"
          placeholder=""
          @update:value="(v) => (toTable = null)"
        />
      </n-form-item>
      <n-form-item label="Mesa">
        <n-select
          v-model:value="toTable"
          :options="tableStore.getAreaTablesOptions(currentArea)"
          :disabled="!currentArea"
          placeholder=""
          filterable
        />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="isLoading"
            :disabled="!toTable || isLoading"
            secondary
            @click.prevent="performChangeTable"
            >Confirmar</n-button
          >
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";
import { useWaiterStore } from "@/store/modules/waiter";
import { useTillStore } from "@/store/modules/till";
import { usePrinterStore } from "@/store/modules/printer";
import { changeOrderTable } from "@/api/modules/tables";
import { useMessage } from "naive-ui";
import { cloneDeep } from "@/utils";
import { useTableLock } from "@/composables/useTableLock";
import { useRouter } from 'vue-router';

export default defineComponent({
  name: "WHome",
  setup() {
    const router = useRouter();
    const settingsStore = useSettingsStore();
    const printerStore = usePrinterStore();
    const waiterStore = useWaiterStore();
    const tableStore = useTableStore();
    const tillStore = useTillStore();
    const isLoading = ref(false);
    const message = useMessage();
    const area = ref(null);
    const currentTableGrouping = ref(null);
    const currentGroup = ref([]);
    const tableGroups = ref([]);
    
    // Composable de table lock
    const { isTableLockedByOther, getLockInfo } = useTableLock();

    /**
     * Maneja el click en una mesa
     * Valida el lock_info antes de navegar
     */
    const handleTableClick = (table) => {
      if (waiterStore.groupMode) {
        // Modo de agrupación
        if (currentTableGrouping.value === table.id ||
            tableGroups.value.some((g) => g.some((t) => t.id === table.id))) {
          return;
        }
        
        if (!currentGroup.value.some((t) => t.id === table.id)) {
          addToGroup(table);
        } else {
          removeFromGroup(table);
        }
      } else {
        // Validar si la mesa está bloqueada por otro usuario
        if (table.lock_info && table.lock_info.is_locked && !table.lock_info.locked_by_me) {
          const remainingMinutes = table.lock_info.remaining_minutes;
          const lockedBy = table.lock_info.locked_by_username;
          
          message.warning(
            `Mesa bloqueada por ${lockedBy}. Disponible en ${remainingMinutes} minutos.`,
            { duration: 4000 }
          );
          return;
        }
        
        // Modo normal - navegar directamente
        // El backend validará el lock en el endpoint /tables/{id}/order/
        router.push({ name: 'WOrder', params: { table: table.id } });
        cleanParams();
      }
    };

    const tables = computed(() => {
      let a = tableStore.areas.find((a) => a.id == area.value);
      if (a) {
        return a.tables;
      }
      return [];
    });

    tableStore.initializeStore().then((areas) => {
      if (areas.length && tillStore.currentTillID) {
        area.value = areas[0].id;
      }
    });

    const addToGroup = (table) => {
      currentGroup.value.push(cloneDeep(table));
    };

    const removeFromGroup = (table) => {
      let index = currentGroup.value.findIndex((t) => t.id === table.id);
      currentGroup.value.splice(index, 1);
    };

    const saveGroup = () => {
      tableGroups.value.push(cloneDeep(currentGroup.value));
      cleanParams();
    };

    const cleanParams = () => {
      waiterStore.groupMode = false;
      currentGroup.value = [];
      currentTableGrouping.value = null;
    };

    onMounted(() => {
      console.log('🔵 WaiterMode Home.vue montado');
      if (tableStore.getAreasOptions.length && tillStore.currentTillID) {
        area.value = tableStore.getAreasOptions[0].id;
      }
      
      // Conectar WebSocket único desde el store
      tableStore.connectWebSocket();
    });

    const fromTable = ref(null);

    const currentArea = ref(null);

    const toTable = ref(null);

    const performChangeTable = async () => {
      isLoading.value = true;
      await changeOrderTable(fromTable.value, toTable.value)
        .then((response) => {
          if (response.status === 200) {
            message.success("Mesa cambiada!");
            waiterStore.changeTable = false;
            fromTable.value = null;
            currentArea.value = null;
            toTable.value = null;
            tableStore.refreshData();
          }
        })
        .catch((error) => {
          if (error.response.status === 400) {
            for (const value in error.response.data) {
              if (Array.isArray(error.response.data[`${value}`])) {
                error.response.data[`${value}`].forEach((err) => {
                  if (typeof err === "object") {
                    for (const v in err) {
                      message.error(`${err[`${v}`]}`);
                    }
                  } else {
                    message.error(`${err}`);
                  }
                });
              } else {
                message.error(error.response.data[`${value}`]);
              }
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
          isLoading.value = false;
        });
    };

    /**
     * Obtener color de la mesa según su estado
     * Verde: Libre
     * Rojo: Con orden activa
     * Amarillo: Bloqueada por otro usuario
     */
    const getTableColor = (table) => {
      // Mesa bloqueada por otro usuario -> Amarillo
      if (table.lock_info && table.lock_info.is_locked && !table.lock_info.locked_by_me) {
        return '#ffc107'; // Amarillo
      }
      
      // Mesa con orden -> Rojo
      if (table.status === '3') {
        return '#f44336'; // Rojo
      }
      
      // Mesa libre -> Verde
      return '#4caf50'; // Verde
    };
    
    /**
     * Obtener clase de fondo de la mesa según su estado
     */
    const getTableBackgroundClass = (table) => {
      // Mesa bloqueada por otro usuario -> Fondo amarillo
      if (table.lock_info && table.lock_info.is_locked && !table.lock_info.locked_by_me) {
        return 'bg-locked';
      }
      
      // Mesa con orden -> Fondo rojo
      if (table.status === '3') {
        return 'bg-occuped';
      }
      
      // Mesa libre -> Fondo verde
      return 'bg-free';
    };

    return {
      settingsStore,
      printerStore,
      waiterStore,
      tableStore,
      tillStore,
      isLoading,
      area,
      tables,
      tableGroups,
      currentGroup,
      currentTableGrouping,
      cleanParams,
      addToGroup,
      removeFromGroup,
      saveGroup,
      fromTable,
      currentArea,
      toTable,
      performChangeTable,
      getTableColor,
      getTableBackgroundClass,
      handleTableClick
    };
  },
});
</script>

<style lang="scss">
.bg-occuped {
  background-color: rgb(255, 162, 162); // Rojo suave
}

.bg-locked {
  background-color: rgb(255, 243, 176); // Amarillo suave
}

.bg-free {
  background-color: rgb(200, 230, 201); // Verde suave
}

.black-outline {
  -webkit-text-stroke: 0.75px black;
  color: Gainsboro;
  -webkit-font-smoothing: antialiased;
  font-weight: bold;
}
</style>
