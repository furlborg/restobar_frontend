<template>
  <n-layout position="absolute">
    <n-layout-header style="height: 48px" position="absolute" bordered>
      <n-space class="h-100 m-0" align="center" justify="space-between">
        <div v-if="$route.params.table" class="d-flex ms-2 fs-6">
          <n-button text @click="$router.back()">
            <v-icon name="md-arrowback-round" />
          </n-button>
          <div class="ms-2">
            {{ tableStore.getTableByID($route.params.table)?.description }}
          </div>
        </div>
        <div class="menuBtn" :class="{ act: active === true }" @click="active = !active">
          <span class="lines"></span>
        </div>
        <v-icon class="position-absolute top-0 end-0 me-1" name="fa-circle" scale="0.75"
          :color="isConnected ? 'green' : 'red'" :animation="isConnected ? undefined : 'flash'" />
      </n-space>
    </n-layout-header>
    <n-layout-content position="absolute" style="top: 48px" :native-scrollbar="false">
      <!-- Selector de clientes para Modo Mozo -->
      <div v-if="shouldShowCustomerMode && $route.params.table" class="bg-white px-2 py-2 border-bottom shadow-sm z-3 position-relative">
        <n-space justify="start" align="center" style="overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px;">
          <n-button dashed type="primary" size="small" class="shrink-0" @click="showAddCustomerModal = true">
            <template #icon>
              <v-icon name="md-add-round" />
            </template>
            Añadir
          </n-button>
          <n-radio-group :value="orderStore.waiterSelectedCustomerId" @update:value="orderStore.waiterSelectedCustomerId = $event" name="customer-selector" class="d-flex flex-nowrap" style="gap: 8px;">
            <n-radio-button v-for="(customer, index) in orderStore.waiterCustomers" :key="customer.id" :value="customer.id" size="small" class="shrink-0">
              {{ customer.name }}
              <n-button v-if="index !== 0" size="tiny" text type="error" class="ms-2" @click.stop="orderStore.removeWaiterCustomer(customer.id)">
                <v-icon name="md-close-round" />
              </n-button>
            </n-radio-button>
          </n-radio-group>
        </n-space>
      </div>
      <div :style="shouldShowCustomerMode && $route.params.table ? 'height: calc(100% - 48px)' : 'height: 100%'">
        <router-view v-slot="{ Component }">
          <transition name="zoom-fade" mode="out-in" appear>
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </n-layout-content>
    
    <!-- Modal para Añadir Cliente -->
    <n-modal v-model:show="showAddCustomerModal" preset="card" title="Nombre del Cliente" class="w-75">
      <n-input v-model:value="newCustomerName" placeholder="Ej: Juan, Pedro..." @keyup.enter="handleAddCustomer" />
      <template #action>
        <n-space justify="end">
          <n-button type="success" secondary @click="handleAddCustomer" :disabled="!newCustomerName.trim()">
            Guardar
          </n-button>
        </n-space>
      </template>
    </n-modal>
    <div class="mainMenu" :class="{ act: active === true }">
      <ul>
        <li v-if="$route.name === 'WHome'">
          <a @click="
            waiterStore.changeTable = true;
          active = false;
          ">Mover Mesa</a>
        </li>
        <li v-if="userStore.user.role !== 'MOZO'">
          <a @click="$router.push({ name: 'Dashboard' })">Volver</a>
        </li>
        <li>
          <a href="#" class="suBtn" @click="doLogout">Cerrar sesión</a>
        </li>
      </ul>
    </div>
  </n-layout>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useDialog } from "naive-ui";
import { retrieveCurrentTill } from "@/api/modules/tills";
import { usePrinterStore } from "@/store/modules/printer";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";
import { useTableStore } from "@/store/modules/table";
import { useProductStore } from "@/store/modules/product";
import { useWaiterStore } from "@/store/modules/waiter";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";
import { useOrderStore } from "@/store/modules/order";

const active = ref(false);
const showAddCustomerModal = ref(false);
const newCustomerName = ref("");
const dialog = useDialog();
const router = useRouter();
const businessStore = useBusinessStore();
const waiterStore = useWaiterStore();
const printerStore = usePrinterStore();
const settingsStore = useSettingsStore();
const tableStore = useTableStore();
const tillStore = useTillStore();
const productStore = useProductStore();
const userStore = useUserStore();
const orderStore = useOrderStore();
businessStore.initializeStore();
tableStore.initializeStore();
settingsStore.initializeStore().then(() => productStore.initializeStore());

const shouldShowCustomerMode = computed(() => settingsStore.businessSettings?.order?.order_by_customer);

const handleAddCustomer = () => {
  if (newCustomerName.value.trim()) {
    orderStore.addWaiterCustomer(newCustomerName.value);
    showAddCustomerModal.value = false;
    newCustomerName.value = "";
  }
};

const isConnected = ref(false);

setInterval(() => {
  isConnected.value = printerStore.qz.websocket.isActive();
}, 1000);

const checkTill = () => {
  retrieveCurrentTill()
    .then((response) => {
      if (response.status === 200) {
        tillStore.currentTillID = response.data.id;
        tillStore.currentTillOrders = response.data.orders_count;
      }
    })
    .catch((error) => {
      if (error.response.status === 404) {
        tillStore.currentTillID = null;
        tillStore.currentTillOrders = 0;
      }
    });
};
checkTill();

const doLogout = () => {
  dialog.error({
    title: "Cerrar sesión",
    content: "¿Desea cerrar sesión?",
    positiveText: "Si",
    negativeText: "No",
    onPositiveClick: async () => {
      await userStore.blacklistToken().then((v) => {
        if (v) {
          printerStore.endConnection();
          router.push({ name: "Login" });
        }
      });
    },
    onNegativeClick: () => { },
  });
};
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
}

*,
*:after,
*:before {
  box-sizing: border-box;
}

ol,
ul {
  list-style: none;
}

a {
  color: #000;
  text-decoration: none;
}

header {
  background-color: #fff;
  background-color: rgba(255, 255, 255, 0);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  height: 50px;
}

.logo {
  color: #000;
  font-size: 20px;
  line-height: 50px;
  padding: 0 0 0 20px;
  text-transform: capitalize;
}

/* menu button */
.menuBtn {
  height: 30px;
  width: 30px;

  position: absolute;
  right: 20px;
  top: 10px;
  z-index: 101;

  >span {
    background-color: #000;
    border-radius: 1px;
    height: 2px;
    width: 100%;
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -1px 0 0 -15px;
    transition: height 100ms;

    &:after,
    &:before {
      content: "";
      background-color: #000;
      border-radius: 1px;
      height: 2px;
      width: 100%;
      position: absolute;
      left: 50%;
      margin-left: -15px;
      transition: all 200ms;
    }

    &:after {
      top: -7px;
    }

    &:before {
      bottom: -7px;
    }
  }

  &.act {
    >span {
      height: 0;

      &:after,
      &:before {
        background-color: #008877;
        top: 1px;
      }

      &:after {
        transform: rotate(45deg);
      }

      &:before {
        transform: rotate(-45deg);
      }
    }
  }
}

/* main menu block */
.mainMenu {
  background-color: #fff;
  position: relative;
  left: 0;
  top: 0;
  z-index: 100;
  height: 100%;
  width: 100%;
  display: table;
  text-align: center;
  opacity: 0;
  transition: all 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: scale(0);

  &.act {
    opacity: 1;
    transform: scale(1);

    ul li {
      opacity: 1;
      transform: translateX(0);
    }
  }

  ul {
    display: table-cell;
    vertical-align: middle;
  }

  li {
    padding: 8px 0;
    transition: all 400ms 510ms;
    opacity: 0;

    &:nth-child(odd) {
      transform: translateX(30%);
    }

    &:nth-child(even) {
      transform: translateX(-30%);
    }

    &:last-child {
      transform: none;
    }
  }

  a {
    color: #19b698;
    display: inline-block;
    font-size: 18px;

    &.suBtn {
      color: #fff;
    }
  }
}

/* sign up button */
.suBtn {
  background-color: #19b698;
  border-radius: 5px;
  padding: 10px 20px;
}

/* router view transition */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: transform 0.15s, opacity 0.28s ease-in-out;
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>
