<template>
  <div id="GeneralSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración General</n-text>
      </template>
    </n-page-header>
    <n-card>
      <n-tabs type="card">
        <n-tab-pane name="tables" tab="Mesas">
          <n-card title="Editar Mesas" :bordered="false" embedded>
            <n-form>
              <n-grid
                responsive="screen"
                cols="24 s:24 m:24 l:24 xl:24 2xl:24"
                :x-gap="12"
              >
                <n-form-item-gi :span="4" label="Lugar Preparación">
                  <n-select
                    class="mb-2"
                    v-model:value="area"
                    :consistent-menu-width="true"
                    :options="areaOptions"
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="4" label="Código">
                  <n-input v-model:value="table.code" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="4" label="Descripción">
                  <n-input v-model:value="table.description" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="4">
                  <n-button
                    type="info"
                    :disabled="!(table.code && table.description)"
                    secondary
                    @click="performCreateTable"
                    >Agregar</n-button
                  >
                </n-form-item-gi>
              </n-grid>
            </n-form>
            <n-spin :show="isLoadingData">
              <n-grid
                responsive="screen"
                cols="2 s:6 m:10 l:20 xl:24 2xl:24"
                :x-gap="12"
                :y-gap="12"
              >
                <!-- <n-gi :span="2">
                <n-button class="w-100 h-100" type="success" dashed>
                  <v-icon name="md-add-round" scale="2" />
                </n-button>
              </n-gi> -->
                <n-gi v-for="table in tables" :key="table.id" :span="2">
                  <n-card :bordered="false" hoverable>
                    <n-space align="center" vertical>
                      <n-button class="position-absolute top-0 end-0 m-1" text>
                        <v-icon name="bi-three-dots" scale="1.25" />
                      </n-button>
                      <v-icon name="gi-table" scale="3" />
                      <n-text>{{ table.id }}</n-text>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
            </n-spin>
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { useTableStore } from "@/store/modules/table";
import { createTable } from "@/api/modules/tables";

export default defineComponent({
  name: "GeneralSettings",
  setup() {
    const message = useMessage();
    const router = useRouter();
    const tableStore = useTableStore();
    const isLoadingData = ref(false);
    const area = ref(1);
    const table = ref({
      id: null,
      code: "",
      description: "",
    });
    const areaOptions = computed(() => {
      return tableStore.getAreasOptions;
    });
    const tables = computed(() => {
      let a = tableStore.areas.find((a) => a.id == area.value);
      if (a) {
        return a.tables;
      }
      return [];
    });

    const performCreateTable = (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      createTable(area.value, table.value)
        .then((response) => {
          if (response.status === 201) {
            tableStore.refreshData();
          }
        })
        .catch((error) => {
          console.error(error.response.data);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    onMounted(() => {
      tableStore.refreshData();
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    return {
      handleBack,
      isLoadingData,
      areaOptions,
      area,
      table,
      tables,
      performCreateTable,
    };
  },
});
</script>

<style>
</style>