<template>
  <n-card title="Mesas" :bordered="false" :segmented="{ content: 'hard' }">
    <n-spin :show="isLoading">
      <n-card
        class="my-2"
        v-for="area in tableStore.areas"
        :key="area.id"
        :title="area.description"
        embedded
      >
        <n-grid
          responsive="screen"
          cols="6 s:6 m:12 l:24 xl:24 2xl:24"
          :x-gap="12"
          :y-gap="12"
        >
          <n-gi v-for="table in area.tables" :key="table.id" :span="3">
            <n-card
              :title="String(table.id)"
              size="small"
              footer-style="padding: 0px;"
            >
              <template #header-extra>
                <n-button text size="small">
                  <v-icon name="bi-three-dots-vertical" />
                </n-button>
              </template>
              <n-space justify="center">
                <router-link
                  :to="{ name: 'TableOrder', params: { table: table.id } }"
                >
                  <img
                    src="~@/assets/images/default-table-2.png"
                    alt=""
                    width="128"
                    height="128"
                  />
                </router-link>
              </n-space>
              <template #footer>
                <n-space justify="center">
                  <router-link
                    class="text-decoration-none"
                    :to="{ name: 'TablePayment', params: { table: table.id } }"
                  >
                    <n-button type="success" text>
                      <v-icon class="me-2" name="gi-money-stack" scale="2" />
                      <span class="fs-5">S/. 1000.00</span>
                    </n-button>
                  </router-link>
                </n-space>
              </template>
            </n-card>
          </n-gi>
        </n-grid>
      </n-card>
    </n-spin>
  </n-card>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { getTables } from "@/api/modules/tables";
import { useTableStore } from "@/store/modules/table";

export default defineComponent({
  name: "Tables",
  setup() {
    const isLoading = ref(false);
    const message = useMessage();
    const tableStore = useTableStore();
    const loadTablesData = () => {
      isLoading.value = true;
      tableStore.refreshData().then(() => {
        isLoading.value = false;
      });
    };

    onMounted(() => {
      loadTablesData();
    });
    return {
      isLoading,
      tableStore,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>