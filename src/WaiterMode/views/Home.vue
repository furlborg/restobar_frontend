<template>
  <div class="p-3">
    <n-input-group>
      <n-select
        v-model:value="area"
        :options="tableStore.getAreasOptions"
      ></n-select>
      <n-button type="info"><v-icon name="hi-solid-refresh" /></n-button>
    </n-input-group>
    <n-grid class="mt-3" cols="3" :x-gap="6" :y-gap="6">
      <n-gi v-for="table in tables" :key="table.id">
        <router-link
          class="text-decoration-none"
          :to="{ name: 'WOrder', params: { table: table.id } }"
        >
          <n-card class="position-relative table" embedded>
            <n-space align="center" :size="0" vertical>
              <img
                src="~@/assets/images/default-table.png"
                alt=""
                width="64"
                height="64"
              />
            </n-space>
            <n-text
              class="position-absolute top-50 start-50 translate-middle"
              >{{ table.code }}</n-text
            >
          </n-card>
        </router-link>
      </n-gi>
    </n-grid>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useTableStore } from "@/store/modules/table";

export default defineComponent({
  name: "WHome",
  setup() {
    const tableStore = useTableStore();
    const area = ref(1);
    const tables = computed(() => {
      let a = tableStore.areas.find((a) => a.id == area.value);
      if (a) {
        return a.tables;
      }
      return [];
    });

    return {
      tableStore,
      area,
      tables,
    };
  },
});
</script>

<style lang="scss">
.table img {
  opacity: 0.1;
}
</style>