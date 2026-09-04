<template>
  <div class="layout-header">
    <div class="layout-header-left">
      <div v-if="userStore.user.role !== 'MOZO'" class="layout-header-trigger layout-header-trigger-min"
        @click="() => $emit('update:collapsed', !collapsed)">
        <n-icon size="18" v-if="collapsed">
          <v-icon name="oi-sidebar-expand" flip="horizontal" />
        </n-icon>
        <n-icon size="18" v-else>
          <v-icon name="oi-sidebar-collapse" flip="horizontal" />
        </n-icon>
      </div>
      <div class="layout-header-trigger layout-header-trigger-min">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-icon size="18">
              <v-icon :name="fullscreenIcon" @click="toggleFullScreen" />
            </n-icon>
          </template>
          <span>Pantalla completa</span>
        </n-tooltip>
      </div>
    </div>
    <div class="layout-header-right">
      <n-space align="end" vertical :size="0">
        <n-text v-if="userStore.user.names" class="fw-bold">{{
          userStore.user.names
        }}</n-text>
        <n-text v-if="userStore.user.branchoffice_des">{{
          userStore.user.branchoffice_des
        }}</n-text>
      </n-space>
      <div class="layout-header-trigger layout-header-trigger-min">
        <n-dropdown trigger="hover" placement="bottom-end" :options="avatarOptions" @select="avatarSelect">
          <div class="avatar">
            <n-avatar>
              <v-icon name="hi-user" />
            </n-avatar>
          </div>
        </n-dropdown>
      </div>
    </div>
    <ProjectSetting ref="drawerSetting" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, toRefs } from "vue";
import { useDialog } from "naive-ui";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/modules/user";
import { retrieveCurrentTill } from "@/api/modules/tills";
import { useTillStore } from "@/store/modules/till";
import { usePrinterStore } from "@/store/modules/printer";
import { useBusinessStore } from "@/store/modules/business";
import ProjectSetting from "./ProjectSetting";
import { renderIcon } from "@/utils";


defineProps({
  collapsed: Boolean,
});
defineOptions({
  name: "PageHeader",
});
const router = useRouter();
const dialog = useDialog();
const drawerSetting = ref();
const userStore = useUserStore();
const printerStore = usePrinterStore();
const businessStore = useBusinessStore();
const tillStore = useTillStore();

const state = reactive({
  fullscreenIcon: "bi-fullscreen",
});
const { fullscreenIcon } = toRefs(state);

const toggleFullscreenIcon = () =>
(state.fullscreenIcon =
  document.fullscreenElement !== null
    ? "bi-fullscreen-exit"
    : "bi-fullscreen");

document.addEventListener("fullscreenchange", toggleFullscreenIcon);

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const avatarOptions = computed(() => {
  let options = [
    {
      label: "Cambiar de Sucursal",
      key: "branchs",
      children: businessStore.branchOptions,
    },
    {
      label: "Modo Mozo",
      key: 1,
    },
    {
      label: "Cocina (KDS)",
      key: "kds",
      icon: renderIcon("md-dining-twotone"),
    },
    {
      label: "Desconectar",
      key: -1,
      icon: renderIcon("md-logout-round"),
    },
  ];

  if (userStore.user.branchoffice) {
    options = options.filter((option) => option.key !== "branchs");
  }
  
  if (userStore.user.role === "MOZO" || !userStore.hasPermission("modo_mozo")) {
    options = options.filter((option) => option.key !== 1);
  }

  return options;
});

const performRetrieveCurrentTill = () => {
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

const avatarSelect = (key) => {
  switch (key) {
    case 1:
      router.push({ name: "WaiterMode" });
      break;
    case "kds":
    case 0:
      router.push({ name: "KdsBoard" });
      break;
    case -1:
      doLogout();
      break;
    default:
      if (key > 0) {
        businessStore.currentBranch = key;
        performRetrieveCurrentTill();
        router.push({ name: "Dashboard" });
      }
  }
};

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
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  height: 64px;
  box-shadow: 0 1px 4px rgb(0 21 41 / 8%);
  transition: all 0.2s ease-in-out;
  width: 100%;
  z-index: 11;

  &-left {
    display: flex;
    align-items: center;
  }

  &-right {
    display: flex;
    align-items: center;
    margin-right: 20px;

    .avatar {
      display: flex;
      align-items: center;
      height: 64px;
    }

    >* {
      cursor: pointer;
    }
  }

  &-trigger {
    display: inline-block;
    width: 64px;
    height: 64px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    .n-icon {
      display: flex;
      align-items: center;
      height: 64px;
      line-height: 64px;
    }

    &:hover {
      background: hsla(0, 0%, 100%, 0.08);
    }

    .v-icon {
      font-size: 16px;
      color: #515a6e;
    }
  }

  &-trigger-min {
    width: auto;
    padding: 0 12px;
  }
}

.layout-header-light {
  background: #fff;
  color: #515a6e;

  .n-icon {
    color: #515a6e;
  }

  .layout-header-left {
    ::v-deep(.n-breadcrumb .n-breadcrumb-item:last-child .n-breadcrumb-item__link) {
      color: #515a6e;
    }
  }

  .layout-header-trigger {
    &:hover {
      background: #f8f8f9;
    }
  }
}

.layout-header-fix {
  position: fixed;
  top: 0;
  right: 0;
  left: 200px;
  z-index: 11;
}
</style>
