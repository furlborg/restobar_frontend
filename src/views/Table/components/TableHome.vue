<template>
  <n-card title="Mesas" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <n-space v-if="tillStore.currentTillID" align="end">
        <n-button type="info" text @click="refreshData">
          <v-icon name="hi-solid-refresh" />
          Recargar
        </n-button>
        <n-button v-if="userStore.hasPermission('take_away_order')" type="info" secondary
          @click="$router.push({ name: 'TakeOrder' })">Llevar / Delivery</n-button>
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
      <n-card class="my-2" v-for="area in tableStore.branchAreas" :key="area.id" :title="area.description" embedded>
        <n-grid responsive="screen" cols="3 xs:3 s:12 m:12 l:15 xl:21 2xl:21" :x-gap="12" :y-gap="12">
          <n-gi v-for="table in area.tables" :key="table.id" :span="3">
            <n-card :id="`table-${table.id}`" class="position-relative overflow-hidden rounded-3"
              :class="{ 'bg-occuped': table.status === '3' }" size="small" @click="
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
              " style="cursor: pointer">
              <n-checkbox v-if="groupMode" :checked="currentGroup.some((t) => t.id === table.id)" :disabled="
                tableGroups.some((g) => g.some((t) => t.id === table.id)) ||
                currentTableGrouping === table.id
              " size="large" class="position-absolute top-0 start-0 m-2" />
              <div class="
                  ms-1
                  black-outline
                  text-center text-wrap
                  position-absolute
                  top-50
                  start-50
                  translate-middle
                " :class="{
                  'fs-4': table.description.length <= 15,
                  'fs-6': table.description.length > 15,
                }">
                {{ table.description }}
              </div>
              <n-button v-if="
                table.order_amount &&
                settingsStore.business_settings.order.table_order_total
              " class="
                  text-center
                  position-absolute
                  bottom-0
                  start-50
                  translate-middle-x
                  fs-5
                  fw-bolder
                " color="#901E00" text>
                S/. {{ table.order_amount.toFixed(2) }}
              </n-button>
              <n-button @click.stop="openOptions.push(table.id)" class="position-absolute top-0 end-0" quaternary
                size="small">
                <v-icon name="bi-three-dots-vertical" />
              </n-button>
              <v-icon v-if="
                groupMode === true &&
                tableGroups.some((g) => g.some((t) => t.id === table.id))
              " class="position-absolute top-50 start-50 translate-middle fs-4" name="ri-forbid-line" scale="8"
                fill="#FA8072" />
              <n-space justify="center">
                <!-- <router-link
                  :to="{ name: 'TableOrder', params: { table: table.id } }"
                > -->
                <img draggable="false" src="~@/assets/images/default-table.png" alt="" width="128" height="128" />
                <!-- </router-link> -->
              </n-space>
              <n-drawer :show="
                groupMode
                  ? ((openOptions = []), false)
                  : openOptions.some((t) => t === table.id)
              " height="100%" placement="top" :to="`#table-${table.id}`" @maskClick.stop>
                <n-drawer-content :native-scrollbar="false" @click.stop>
                  <n-space vertical align="center">
                    <n-button type="error" size="small" tertiary circle @click="
                      openOptions.splice(
                        openOptions.findIndex((i) => i === table.id),
                        1
                      )
                    ">
                      <v-icon name="md-close-round" />
                    </n-button>
                  </n-space>
                  <n-button v-if="userStore.hasPermission('charge_order')" class="mb-1" type="success" size="small"
                    block secondary :disabled="table.status === '1'" @click="
                      $router.push({
                        name: 'TablePayment',
                        params: { table: table.id },
                      })
                    ">
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
                  <n-button class="mb-1" type="info" size="small" block secondary :disabled="table.status === '1'"
                    @click="performRetrieveTableOrder(table.id)">
                    Pre-cuenta
                  </n-button>
                  <n-button class="mb-1" type="warning" size="small" block secondary :disabled="table.status === '1'"
                    @click="
  openOptions.splice(
    openOptions.findIndex((i) => i === table.id),
    1
  );
fromTable = table.id;
currentArea = area.id;
changeTable = true;
                    ">
                    Cambiar mesa
                  </n-button>
                  <n-button v-if="userStore.hasPermission('null_orders')" class="mb-1" type="error" size="small" block
                    secondary :disabled="table.status === '1'" @click="
                      openOptions.splice(
                        openOptions.findIndex((i) => i === table.id),
                        1
                      ),
                      nullifyTableOrder(table.id)
                    ">
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
    <n-modal :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }" preset="card" v-model:show="showConfirm" title="Anular pedido" :mask-closable="false" closable
      @close="closeNullModal">
      <n-form-item label="Ingrese clave de seguridad" required>
        <n-input type="password" v-model:value="passConfirm" placeholder="" />
      </n-form-item>
      <n-form-item v-if="
        addReason ||
        settingsStore.business_settings.order.required_null_reason
      " label="Motivo de anulación" required>
        <n-input v-model:value="nullReason" placeholder="" />
      </n-form-item>
      <n-space v-else justify="end">
        <n-button type="info" text @click="addReason = true">Especificar motivo</n-button>
      </n-space>
      <template #action>
        <n-space justify="end">
          <n-button type="success" :loading="isLoading" :disabled="
            settingsStore.business_settings.order.required_null_reason ||
              addReason
              ? !passConfirm || isLoading || !nullReason
              : !passConfirm || isLoading
          " secondary @click.prevent="performNullifyTableOrder">Confirmar</n-button>
        </n-space>
      </template>
    </n-modal>
    <n-modal :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }" preset="card" v-model:show="changeTable" title="Cambiar mesa" :mask-closable="false" closable>
      <n-form-item label="Mesa actual">
        <n-select :value="fromTable" disabled :options="tableStore.getAreaTablesOptions(currentArea)" placeholder="" />
      </n-form-item>
      <n-form-item label="Area">
        <n-select v-model:value="currentArea" :options="tableStore.getAreasOptions" placeholder="" />
      </n-form-item>
      <n-form-item label="Mesa">
        <n-select v-model:value="toTable" :options="tableStore.getAreaTablesOptions(currentArea)" placeholder=""
          filterable />
      </n-form-item>
      <template #action>
        <n-space justify="end">
          <n-button type="success" :loading="isLoading" :disabled="!toTable || isLoading" secondary
            @click.prevent="performChangeTable">Confirmar</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script>
import { CreatePdfFile } from "@/hooks/CreatePdfFile";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
import { isAxiosError } from "axios";
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
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
    const settingsStore = useSettingsStore();
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
            VoucherPrint({
              data: response.data,
              businessStore,
              prePayment: true,
              auto: true,
            });
          }
        })
        .catch((error) => {
          if (isAxiosError(error)) {
            if (error.response.status === 400) {
              for (const value in error.response.data) {
                error.response.data[`${value}`].forEach((err) => {
                  if (typeof err === "object") {
                    for (const v in err) {
                      message.error(`${err[`${v}`]}`);
                    }
                  } else {
                    message.error(`${err}`);
                  }
                });
              }
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
          message.error("Algo salió mal...");
          console.error(error);
        });
    };

    const showConfirm = ref(false);

    const passConfirm = ref("");

    const addReason = ref(false);

    const nullReason = ref(undefined);

    const deleteId = ref(null);

    const nullifyTableOrder = (id) => {
      deleteId.value = id;
      showConfirm.value = true;
    };

    const closeNullModal = () => {
      addReason.value = false;
      passConfirm.value = "";
      nullReason.value = undefined;
    };

    const performNullifyTableOrder = async () => {
      isLoading.value = true;
      await cancelTableOrder(
        deleteId.value,
        passConfirm.value,
        nullReason.value
      )
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
          if (isAxiosError(error)) {
            if (error.response.status === 400) {
              for (const value in error.response.data) {
                error.response.data[`${value}`].forEach((err) => {
                  if (typeof err === "object") {
                    for (const v in err) {
                      message.error(`${err[`${v}`]}`);
                    }
                  } else {
                    message.error(`${err}`);
                  }
                });
              }
            } else {
              console.error(error);
              message.error("Algo salió mal...");
            }
          }
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
      addReason,
      nullReason,
      closeNullModal,
      passConfirm,
      genericsStore,
      tillStore,
      changeTable,
      fromTable,
      currentArea,
      toTable,
      performChangeTable,
      settingsStore,
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
