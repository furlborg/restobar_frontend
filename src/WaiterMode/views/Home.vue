<template>
  <div class="p-3">
    <n-input-group>
      <n-select
        v-model:value="area"
        :options="tableStore.getAreasOptions"
        :disabled="waiterStore.groupMode"
      ></n-select>
      <n-button type="info" :disabled="waiterStore.groupMode"
        ><v-icon name="hi-solid-refresh"
      /></n-button>
    </n-input-group>
    <n-grid class="mt-3" cols="3" :x-gap="6" :y-gap="6">
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
          class="position-relative table"
          style="cursor: pointer"
          embedded
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
          <n-text class="position-absolute top-50 start-50 translate-middle">{{
            table.code
          }}</n-text>
        </n-card>
      </n-gi>
    </n-grid>
    <teleport to="body">
      <n-space
        v-if="waiterStore.groupMode"
        class="
          position-absolute
          bottom-0
          start-50
          translate-middle-x
          mb-3
          w-100
        "
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
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useTableStore } from "@/store/modules/table";
import { useWaiterStore } from "@/store/modules/waiter";
import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "WHome",
  setup() {
    const waiterStore = useWaiterStore();
    const tableStore = useTableStore();
    const area = ref(1);
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

    return {
      waiterStore,
      tableStore,
      area,
      tables,
      tableGroups,
      currentGroup,
      currentTableGrouping,
      cleanParams,
      addToGroup,
      removeFromGroup,
      saveGroup,
    };
  },
});
</script>

<style lang="scss">
.table img {
  opacity: 0.1;
}
</style>