<template>
  <n-card title="Mesas" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <n-space v-if="tillStore.currentTillID" align="end">
        <n-button type="info" text @click="refreshData">
          <v-icon name="hi-solid-refresh" />
          Recargar
        </n-button>
        <n-button
          type="info"
          secondary
          @click="$router.push({ name: 'TakeOrder' })"
          >Realizar pedido</n-button
        >
      </n-space>
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
    <n-spin v-if="tillStore.currentTillID" :show="isLoading">
      <n-card
        class="my-2"
        v-for="area in tableStore.branchAreas"
        :key="area.id"
        :title="area.description"
        embedded
      >
        <n-grid
          responsive="screen"
          cols="3 xs:3 s:12 m:12 l:24 xl:24 2xl:24"
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
                class="black-outline text-center position-absolute top-50 start-50 translate-middle fs-4"
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
                <n-drawer-content :native-scrollbar="false" @click.stop>
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
                  <n-button
                    v-if="userStore.user.profile_des !== 'MOZO'"
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
                    type="info"
                    size="small"
                    block
                    secondary
                    :disabled="table.status === '1'"
                    @click="performRetrieveTableOrder(table.id)"
                  >
                    Pre-cuenta
                  </n-button>
                  <n-button
                    class="mb-1"
                    type="warning"
                    size="small"
                    block
                    secondary
                    :disabled="table.status === '1'"
                    @click="
                      openOptions.splice(
                        openOptions.findIndex((i) => i === table.id),
                        1
                      );
                      fromTable = table.id;
                      currentArea = area.id;
                      changeTable = true;
                    "
                  >
                    Cambiar mesa
                  </n-button>
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
                </n-drawer-content>
              </n-drawer>
            </n-card>
          </n-gi>
        </n-grid>
      </n-card>
    </n-spin>
    <div v-else>
      <n-space align="center" vertical>
        <v-icon label="No Open Till" scale="6">
          <v-icon name="md-pointofsale-twotone" />
          <v-icon name="md-notinterested-round" scale="2" fill="#fC644d" />
        </v-icon>
        <n-text class="fs-3">NO SE HA APERTURADO CAJA</n-text>
      </n-space>
    </div>
    <n-modal
      :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }"
      preset="card"
      v-model:show="showConfirm"
      title="Anular pedido"
      :mask-closable="false"
      closable
    >
      <n-form-item label="Ingrese clave de seguridad">
        <n-input type="password" v-model:value="passConfirm" placeholder="" />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="isLoading"
            :disabled="!passConfirm || isLoading"
            secondary
            @click.prevent="performNullifyTableOrder"
            >Confirmar</n-button
          >
        </n-space>
      </template>
    </n-modal>
    <n-modal
      :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }"
      preset="card"
      v-model:show="changeTable"
      title="Cambiar mesa"
      :mask-closable="false"
      closable
    >
      <n-form-item label="Mesa actual">
        <n-select
          :value="fromTable"
          disabled
          :options="tableStore.getAreaTablesOptions(currentArea)"
          placeholder=""
        />
      </n-form-item>
      <n-form-item label="Area">
        <n-select
          v-model:value="currentArea"
          :options="tableStore.getAreasOptions"
          placeholder=""
        />
      </n-form-item>
      <n-form-item label="Mesa">
        <n-select
          v-model:value="toTable"
          :options="tableStore.getAreaTablesOptions(currentArea)"
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
  </n-card>
</template>

<script>
import { CreatePdfFile } from "@/hooks/CreatePdfFile";
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { useTableStore } from "@/store/modules/table";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import {
  cancelTableOrder,
  retrieveTableOrder,
  changeOrderTable,
} from "@/api/modules/tables";
import { cloneDeep } from "@/utils";
import { useBusinessStore } from "@/store/modules/business";

export default defineComponent({
  name: "Tables",
  setup() {
    const groupMode = ref(false);
    const isLoading = ref(false);
    const message = useMessage();
    const openOptions = ref([]);
    const tableGroups = ref([]);
    const currentTableGrouping = ref(null);
    const currentGroup = ref([]);
    const genericsStore = useGenericsStore();
    const tillStore = useTillStore();
    const tableStore = useTableStore();
    const userStore = useUserStore();
    const businessStore = useBusinessStore();

    const dateNow = ref(null);

    const loadTablesData = async () => {
      isLoading.value = true;
      await tableStore.refreshData().then(() => {
        isLoading.value = false;
      });
    };

    const performRetrieveTableOrder = async (table) => {
      await retrieveTableOrder(table)
        .then((response) => {
          if (response.status === 200) {
            let val = response.data;

            let lengthData = 0;

            let totalProdSum = 0;

            let structure = [
              {
                dat: [
                  [
                    {
                      content: businessStore.business.commercial_name,
                      styles: {
                        fontStyle: "bold",
                        halign: "center",
                        fontSize: 11,
                      },
                    },
                  ],
                  [
                    {
                      content: businessStore.business.fiscal_address,
                      styles: {
                        fontStyle: "bold",
                        halign: "center",
                        fontSize: 9,
                      },
                    },
                  ],

                  [
                    {
                      content: businessStore.business.ruc,
                      styles: {
                        fontStyle: "bold",
                        halign: "center",
                        fontSize: 11,
                      },
                    },
                  ],
                  [
                    {
                      content: "PRE CUENTA",
                      styles: {
                        fontStyle: "bold",
                        halign: "center",
                        fontSize: 11,
                      },
                    },
                  ],
                  [
                    {
                      content: `N° ${val.id}`,
                      styles: {
                        fontStyle: "bold",
                        halign: "center",
                        fontSize: 11,
                      },
                    },
                  ],
                ],
              },
              {
                col: [
                  {
                    header: "CANT.",
                    dataKey: "amount",
                  },

                  {
                    header: "DESCRIPCIÓN",
                    dataKey: "description",
                  },
                  {
                    header: "P.U",
                    dataKey: "price",
                  },

                  {
                    header: "TOTAL",
                    dataKey: "total",
                  },
                ],
                dat: val.order_details.map((val) => {
                  lengthData += 10 * 6.5;
                  totalProdSum += val.quantity * parseFloat(val.price);

                  return {
                    amount: val.quantity,
                    description: val.product_name,
                    price: parseFloat(val.price).toFixed("2"),
                    total: (val.quantity * parseFloat(val.price)).toFixed("2"),
                  };
                }),
                line: true,
              },
            ];
            lengthData += 10 * 6.5;
            structure.push(
              {
                line: true,
                dat: [
                  [
                    {
                      content: `TOTAL: ${totalProdSum.toFixed("2")}`,
                      styles: {
                        fontStyle: "bold",
                        halign: "right",
                        fontSize: 11,
                      },
                    },
                  ],
                ],
              },
              {
                dat: [
                  {
                    tittle: "F.EMISIÓN",
                    twoPoints: ":",
                    cont: dateNow.value,
                  },
                  {
                    tittle: "MOZO",
                    twoPoints: ":",
                    cont: val.username,
                  },
                  {
                    tittle: "MESA",
                    twoPoints: ":",
                    cont: val.table,
                  },
                ],
                line: true,
              }
            );

            CreatePdfFile({
              show: true,
              data: structure,
              lengthOfData: lengthData,
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    };

    const showConfirm = ref(false);

    const passConfirm = ref("");

    const deleteId = ref(null);

    const nullifyTableOrder = (id) => {
      deleteId.value = id;
      showConfirm.value = true;
    };

    const performNullifyTableOrder = async () => {
      isLoading.value = true;
      await cancelTableOrder(deleteId.value, passConfirm.value)
        .then((response) => {
          if (response.status === 202) {
            message.success("Pedido anulado correctamente!");
            showConfirm.value = false;
            deleteId.value = null;
            passConfirm.value = "";
            loadTablesData();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
          passConfirm.value = "";
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

    const refreshData = async () => {
      isLoading.value = true;
      await tableStore.refreshData();
      isLoading.value = false;
    };

    onMounted(() => {
      loadTablesData();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const changeTable = ref(false);

    const fromTable = ref(null);

    const currentArea = ref(null);

    const toTable = ref(null);

    const performChangeTable = async () => {
      isLoading.value = true;
      await changeOrderTable(fromTable.value, toTable.value)
        .then((response) => {
          if (response.status === 200) {
            message.success("Mesa cambiada!");
            changeTable.value = false;
            fromTable.value = null;
            currentArea.value = null;
            toTable.value = null;
            loadTablesData();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    return {
      isLoading,
      groupMode,
      tableStore,
      userStore,
      openOptions,
      currentGroup,
      saveGroup,
      addToGroup,
      refreshData,
      removeFromGroup,
      nullifyTableOrder,
      performNullifyTableOrder,
      tableGroups,
      currentTableGrouping,
      performRetrieveTableOrder,
      showConfirm,
      passConfirm,
      genericsStore,
      tillStore,
      changeTable,
      fromTable,
      currentArea,
      toTable,
      performChangeTable,
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
