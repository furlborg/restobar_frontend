<template>
  <div class="p-3">
    <n-input-group>
      <n-select
        v-model:value="area"
        :options="tableStore.getAreasOptions"
        placeholder="Seleccione area"
        :disabled="!tillStore.currentTillID || waiterStore.groupMode"
        @update:value="tableStore.refreshData()"
      >
      </n-select>
      <n-button
        type="info"
        :disabled="waiterStore.groupMode"
        @click="tableStore.refreshData(), printerStore.startConnection()"
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
          @click="
            waiterStore.groupMode
              ? currentTableGrouping === table.id ||
                tableGroups.some((g) => g.some((t) => t.id === table.id))
                ? null
                : !currentGroup.some((t) => t.id == table.id)
                ? addToGroup(table)
                : removeFromGroup(table)
              : ($router.push({ name: 'WOrder', params: { table: table.id } }),
                cleanParams())
          "
          class="position-relative"
          :class="{ 'bg-occuped': table.status === '3' }"
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
            S/. {{ table.order_amount.toFixed(2) }}
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

export default defineComponent({
  name: "WHome",
  setup() {
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
      if (tableStore.getAreasOptions.length && tillStore.currentTillID) {
        area.value = tableStore.getAreasOptions[0].id;
      }
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
    };
  },
});
</script>

<style lang="scss">
.bg-occuped {
  background-color: rgb(255, 128, 128);
}

.black-outline {
  -webkit-text-stroke: 0.75px black;
  color: Gainsboro;
  -webkit-font-smoothing: antialiased;
  font-weight: bold;
}
</style>
