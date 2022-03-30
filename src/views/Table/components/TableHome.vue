<template>
  <n-card title="Mesas" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <!-- <n-button
        v-if="!groupMode"
        type="info"
        secondary
        @click="groupMode = true"
        >Agrupar</n-button
      >
      <n-space v-else justify="space-between">
        <n-button type="success" secondary @click="saveGroup"
          >Confirmar</n-button
        >
        <n-button
          type="error"
          secondary
          @click="
            groupMode = false;
            currentGroup = [];
            currentTableGrouping = null;
          "
          >Cancelar</n-button
        >
      </n-space> -->
    </template>
    <n-spin :show="isLoading">
      <n-card
        class="my-2"
        v-for="area in tableStore.branchAreas"
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
              :id="`table-${table.id}`"
              class="position-relative overflow-hidden rounded-3"
              :class="{ 'bg-occuped': table.status === '3' }"
              size="small"
              @click="
                groupMode
                  ? currentTableGrouping === table.id ||
                    tableGroups.some((g) => g.some((t) => t.id === table.id))
                    ? null
                    : !currentGroup.some((t) => t.id == table.id)
                    ? addToGroup(table)
                    : removeFromGroup(table)
                  : $router.push({
                      name: 'TableOrder',
                      params: { table: table.id },
                    })
              "
              style="cursor: pointer"
            >
              <n-checkbox
                v-if="groupMode"
                :checked="currentGroup.some((t) => t.id === table.id)"
                :disabled="
                  tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
                  currentTableGrouping === table.id
                "
                size="large"
                class="position-absolute top-0 start-0 m-2"
              />
              <div
                class="
                  black-outline
                  text-center
                  position-absolute
                  top-50
                  start-50
                  translate-middle
                  fs-4
                "
              >
                {{ "MESA " + String(table.id) }}
              </div>
              <n-button
                @click.stop="openOptions.push(table.id)"
                class="position-absolute top-0 end-0"
                quaternary
                size="small"
              >
                <v-icon name="bi-three-dots-vertical" />
              </n-button>
              <v-icon
                v-if="
                  groupMode === true &&
                  tableGroups.some((g) => g.some((t) => t.id === table.id))
                "
                class="position-absolute top-50 start-50 translate-middle fs-4"
                name="ri-forbid-line"
                scale="8"
                fill="#FA8072"
              />
              <n-space justify="center">
                <!-- <router-link
                  :to="{ name: 'TableOrder', params: { table: table.id } }"
                > -->
                <img
                  draggable="false"
                  src="~@/assets/images/default-table.png"
                  alt=""
                  width="128"
                  height="128"
                />
                <!-- </router-link> -->
              </n-space>
              <n-drawer
                :show="
                  groupMode
                    ? ((openOptions = []), false)
                    : openOptions.some((t) => t === table.id)
                "
                height="100%"
                placement="top"
                :to="`#table-${table.id}`"
                @maskClick.stop
              >
                <n-drawer-content @click.stop>
                  <n-button
                    class="mb-1"
                    type="success"
                    size="small"
                    block
                    secondary
                    :disabled="table.status === '1'"
                    @click="
                      $router.push({
                        name: 'TablePayment',
                        params: { table: table.id },
                      })
                    "
                  >
                    Cobrar pedido
                  </n-button>
                  <!-- <n-button
                    class="mb-1"
                    type="warning"
                    size="small"
                    block
                    secondary
                    @click="
                      currentTableGrouping = table.id;
                      addToGroup(table);
                      groupMode = true;
                      openOptions.splice(
                        openOptions.findIndex((i) => i === table.id),
                        1
                      );
                    "
                  >
                    Unir mesa
                  </n-button> -->
                  <n-button
                    class="mb-1"
                    type="error"
                    size="small"
                    block
                    secondary
                    :disabled="table.status === '1'"
                    @click="
                      openOptions.splice(
                        openOptions.findIndex((i) => i === table.id),
                        1
                      ),
                        nullifyTableOrder(table.id)
                    "
                  >
                    Anular pedido
                  </n-button>
                  <n-space vertical align="center">
                    <n-button
                      type="error"
                      size="small"
                      tertiary
                      circle
                      @click="
                        openOptions.splice(
                          openOptions.findIndex((i) => i === table.id),
                          1
                        )
                      "
                    >
                      <v-icon name="md-close-round" />
                    </n-button>
                  </n-space>
                </n-drawer-content>
              </n-drawer>
            </n-card>
          </n-gi>
        </n-grid>
      </n-card>
    </n-spin>
  </n-card>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { useTableStore } from "@/store/modules/table";
import { cancelTableOrder } from "@/api/modules/tables";
import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "Tables",
  setup() {
    const groupMode = ref(false);
    const isLoading = ref(false);
    const message = useMessage();
    const dialog = useDialog();
    const openOptions = ref([]);
    const tableGroups = ref([]);
    const currentTableGrouping = ref(null);
    const currentGroup = ref([]);
    const tableStore = useTableStore();

    const loadTablesData = () => {
      isLoading.value = true;
      tableStore.refreshData().then(() => {
        isLoading.value = false;
      });
    };

    const nullifyTableOrder = (id) => {
      dialog.error({
        title: "Anular pedido",
        content: "¿Está seguro?",
        positiveText: "Sí",
        negativeText: "No",
        onPositiveClick: () => {
          performNullifyTableOrder(id);
        },
      });
    };

    const performNullifyTableOrder = (id) => {
      isLoading.value = true;
      cancelTableOrder(id)
        .then((response) => {
          if (response.status === 202) {
            message.success("Pedido anulado correctamente!");
            loadTablesData();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
          isLoading.value = false;
        });
    };

    const addToGroup = (table) => {
      currentGroup.value.push(cloneDeep(table));
    };

    const removeFromGroup = (table) => {
      let index = currentGroup.value.findIndex((t) => t.id === table.id);
      currentGroup.value.splice(index, 1);
    };

    const saveGroup = () => {
      tableGroups.value.push(cloneDeep(currentGroup.value));
      groupMode.value = false;
      currentGroup.value = [];
      currentTableGrouping.value = null;
    };

    onMounted(() => {
      loadTablesData();
    });

    return {
      isLoading,
      openOptions,
      tableStore,
      groupMode,
      currentGroup,
      addToGroup,
      removeFromGroup,
      saveGroup,
      tableGroups,
      currentTableGrouping,
      nullifyTableOrder,
    };
  },
});
</script>

<style lang="scss" scoped>
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