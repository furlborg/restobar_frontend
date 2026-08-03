<template>
  <div class="p-3">
    <n-input-group>
      <n-select v-model:value="area" :options="tableStore.getAreasTablesOptions" placeholder="Seleccione area"
        :disabled="!tillStore.currentTillID || waiterStore.groupMode" @update:value="tableStore.refreshData()">
      </n-select>
      <n-button type="info" :disabled="waiterStore.groupMode" @click="tableStore.refreshData()">
        <v-icon name="hi-solid-refresh" />
      </n-button>
    </n-input-group>
    <n-grid v-if="tillStore.currentTillID" class="mt-3" responsive="screen" cols="6 xs:6 s:12 m:15 l:18 xl:18 2xl:24" :x-gap="12" :y-gap="12">
      <n-gi v-for="table in tables" :key="table.id" span="2 xs:2 s:3 m:3 l:3 xl:3 2xl:3">
        <n-card @click="handleTableClick(table)" class="position-relative overflow-hidden rounded-3" :class="getTableBackgroundClass(table)"
          :style="{
            borderLeft: `6px solid ${getTableColor(table)}`,
            borderRight: `6px solid ${getTableColor(table)}`,
            aspectRatio: '1 / 1'
          }" size="small" :content-style="genericsStore.device === 'mobile' ? 'padding: 4px;' : ''" style="cursor: pointer">
          <n-checkbox v-if="waiterStore.groupMode" :checked="currentGroup.some((t) => t.id === table.id)" :disabled="tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
            currentTableGrouping === table.id
            " size="large" class="position-absolute top-0 start-0 m-2" />
          <div class="text-center position-absolute start-50 translate-middle-x d-flex align-items-center justify-content-center"
              :style="{
                  top: genericsStore.device === 'mobile' ? (table?.order_amount !== '' ? '25%' : '50%') : (table?.order_amount !== '' ? '33%' : '50%'),
                  transform: 'translate(-50%, -50%)',
                  width: '92%',
                  zIndex: 2,
                  wordBreak: genericsStore.device === 'mobile' ? 'normal' : 'break-word',
                  whiteSpace: genericsStore.device === 'mobile' ? 'nowrap' : 'normal',
                  overflow: genericsStore.device === 'mobile' ? 'hidden' : 'visible',
                  textOverflow: genericsStore.device === 'mobile' ? 'ellipsis' : 'clip'
              }"
              :class="{
                  'fs-alt': table.description.length <= 3,
                  'fs-4':
                      table.description.length > 3 &&
                      table.description.length <= 15 && genericsStore.device !== 'mobile',
                  'fs-6': (table.description.length > 15) || (genericsStore.device === 'mobile' && table.description.length > 3),
              }">
              {{ table.description }}
          </div>
          <n-button v-if="
            table.order_amount &&
            settingsStore.business_settings.order.table_order_total
          " class="bottom-0 text-center position-absolute start-50 translate-middle-x fw-bolder"
            :class="genericsStore.device === 'mobile' ? 'fs-6' : 'fs-5'"
            :style="genericsStore.device === 'mobile' ? 'bottom: 2px !important; z-index: 2;' : ''"
            color="#901E00" text>
            S/. {{ (Number(table?.order_amount) || 0)?.toFixed(2) }}
          </n-button>
          <v-icon v-if="
            waiterStore.groupMode === true &&
            tableGroups.some((g) => g.some((t) => t.id === table.id))
          " class="position-absolute top-50 start-50 translate-middle fs-4" name="ri-forbid-line" scale="8" fill="#FA8072" />
          <n-space justify="center" align="center" :style="genericsStore.device === 'mobile' ? 'min-height: 80px; display: flex;' : 'min-height: 155px; display: flex;'">
              <img draggable="false" src="~@/assets/images/default-table.png" alt="" class="table-bg-img" :style="genericsStore.device === 'mobile' ? 'max-height: 55px; width: 55px; opacity: 0.65;' : ''" />
          </n-space>
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
      <n-space v-if="waiterStore.groupMode" class="position-absolute bottom-0 start-50 translate-middle-x mb-3 w-100"
        align="center" vertical>
        <n-button class="p-3" type="success" secondary @click="saveGroup">Confirmar</n-button>
        <n-button class="p-3" type="error" secondary @click="
          waiterStore.groupMode = false;
        currentGroup = [];
        currentTableGrouping = null;
        ">Cancelar</n-button>
      </n-space>
    </teleport>
    <n-modal preset="card" v-model:show="waiterStore.changeTable" title="Cambiar mesa" :mask-closable="false" closable>
      <n-form-item label="Mesa actual" :disabled="isLoading">
        <n-select v-model:value="fromTable" :options="tableStore.getAreaTablesOptions(area, true)" placeholder="" />
      </n-form-item>
      <n-form-item label="Area">
        <n-select v-model:value="currentArea" :options="tableStore.getAreasOptions" placeholder=""
          @update:value="(v) => (toTable = null)" />
      </n-form-item>
      <n-form-item label="Mesa">
        <n-select v-model:value="toTable" :options="tableStore.getAreaTablesOptions(currentArea)"
          :disabled="!currentArea" placeholder="" filterable />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button type="success" :loading="isLoading" :disabled="!toTable || isLoading" secondary
            @click.prevent="performChangeTable">Confirmar</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";
import { useWaiterStore } from "@/store/modules/waiter";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { changeOrderTable } from "@/api/modules/tables";
import { useMessage } from "naive-ui";
import { cloneDeep } from "@/utils";
import { useTableLock } from "@/composables/useTableLock";
import { useRouter } from 'vue-router';

const router = useRouter();
const settingsStore = useSettingsStore();
const genericsStore = useGenericsStore();
const waiterStore = useWaiterStore();
const tableStore = useTableStore();
const tillStore = useTillStore();
const isLoading = ref(false);
const message = useMessage();
const area = ref(null);
const currentTableGrouping = ref(null);
const currentGroup = ref([]);
const tableGroups = ref([]);
const userStore = useUserStore();

// Composable de table lock (para enviar lock/unlock)
const { connectLockWebSocket } = useTableLock();

/**
 * Verifica si una mesa está bloqueada usando el store (fuente de verdad global)
 */
const isTableBlocked = (table) => {
  // Verificar el estado del store (WebSocket global)
  const wsLockInfo = tableStore.lockedTables[table.id];

  if (wsLockInfo && wsLockInfo.user_id !== userStore.user.id) {
    return {
      blocked: true,
      username: wsLockInfo.username,
      remaining: null
    };
  }

  // Luego verificar lock_info de la API
  if (table.lock_info && table.lock_info.is_active && !table.lock_info.is_locked_by_me) {
    return {
      blocked: true,
      username: table.lock_info.username,
      remaining: table.lock_info.remaining_minutes
    };
  }

  return { blocked: false };
};

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
    const blockStatus = isTableBlocked(table);
    if (blockStatus.blocked) {
      const remainingMinutes = blockStatus.remaining || '?';
      const lockedBy = blockStatus.username;

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

  // Conectar WebSocket de mesas (table store)
  tableStore.connectWebSocket();

  // Conectar WebSocket de locks (composable global)
  connectLockWebSocket();
});

// Watch para forzar re-render cuando cambian los locks
watch(() => tableStore.lockedTables, () => {
  console.log('[WaiterHome] 🔄 lockedTables cambió:', tableStore.lockedTables);
}, { deep: true });

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
  // Verificar bloqueo usando la función combinada
  const blockStatus = isTableBlocked(table);
  if (blockStatus.blocked) {
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
  // Verificar bloqueo usando la función combinada
  const blockStatus = isTableBlocked(table);
  if (blockStatus.blocked) {
    return 'bg-locked';
  }

  // Mesa con orden -> Fondo rojo
  if (table.status === '3') {
    return 'bg-occuped';
  }

  // Mesa libre -> Fondo verde
  return 'bg-free';
};
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
