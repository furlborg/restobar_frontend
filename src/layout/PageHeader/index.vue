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
      <div v-if="userStore.user.role !== 'MOZO'" class="layout-header-trigger layout-header-trigger-min">
        <!-- WhatsApp Conectado: Popover informativo seguro sin riesgo de desvinculación accidental -->
        <n-popover
          v-if="isWhatsAppConnected"
          v-model:show="showWhatsAppPopover"
          trigger="click"
          placement="bottom"
          style="max-width: 320px; border-radius: 12px; padding: 14px;"
        >
          <template #trigger>
            <n-tooltip placement="bottom">
              <template #trigger>
                <n-icon
                  size="20"
                  color="#25D366"
                  style="cursor: pointer; display: flex; align-items: center;"
                >
                  <v-icon
                    name="bi-whatsapp"
                    fill="#25D366"
                    style="color: #25D366"
                  />
                </n-icon>
              </template>
              <span>WhatsApp Conectado (+{{ whatsappPhone || '' }})</span>
            </n-tooltip>
          </template>
          <div class="whatsapp-popover-content">
            <div class="d-flex align-items-center gap-2 mb-2">
              <v-icon name="bi-whatsapp" scale="1.4" fill="#25D366" />
              <div>
                <div class="fw-bold fs-6 text-success">WhatsApp Conectado</div>
                <div class="fw-semibold text-muted" v-if="whatsappPhone">+{{ whatsappPhone }}</div>
              </div>
            </div>
            <p class="fs-7 text-secondary mb-3" style="line-height: 1.4; margin: 0 0 12px 0;">
              Los comprobantes de venta y notificaciones se envían desde este número vinculado.
            </p>
            <div class="d-flex justify-content-end">
              <n-button size="small" type="primary" secondary @click="goToWhatsAppSettings">
                <template #icon><v-icon name="md-settings-twotone" /></template>
                Gestionar en Configuración
              </n-button>
            </div>
          </div>
        </n-popover>

        <!-- WhatsApp Desconectado: Clic para abrir el escáner de código QR -->
        <n-tooltip v-else placement="bottom">
          <template #trigger>
            <n-icon
              size="20"
              color="#909399"
              style="cursor: pointer; display: flex; align-items: center;"
              @click="showWhatsAppQrModal = true"
            >
              <v-icon
                name="bi-whatsapp"
                fill="#909399"
                style="color: #909399"
              />
            </n-icon>
          </template>
          <span>WhatsApp No Vinculado (Haz clic para escanear QR)</span>
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
    <WhatsAppQrModal v-model:show="showWhatsAppQrModal" @linked="onWhatsAppLinked" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, toRefs, watch, onMounted, onUnmounted } from "vue";
import { useDialog } from "naive-ui";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/modules/user";
import { retrieveCurrentTill } from "@/api/modules/tills";
import { useTillStore } from "@/store/modules/till";
import { usePrinterStore } from "@/store/modules/printer";
import { useBusinessStore } from "@/store/modules/business";
import { getWhatsAppStatus } from "@/api/modules/business";
import ProjectSetting from "./ProjectSetting";
import WhatsAppQrModal from "@/views/Settings/components/whatsapp/WhatsAppQrModal.vue";
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

// WhatsApp (Zendy) estado y modal
const showWhatsAppQrModal = ref(false);
const showWhatsAppPopover = ref(false);
const isWhatsAppConnected = ref(false);
const whatsappPhone = ref("");

const goToWhatsAppSettings = () => {
  showWhatsAppPopover.value = false;
  router.push({ name: "AdvancedSettings", query: { tab: "whatsapp" } });
};

const checkWhatsAppStatus = async (forceRefresh = false) => {
  try {
    const res = await getWhatsAppStatus(forceRefresh ? { refresh: 1 } : {});
    if (res?.data) {
      isWhatsAppConnected.value = Boolean(res.data.is_ready || res.data.state === "ready");
      whatsappPhone.value = res.data.phone_number || "";
    }
  } catch (e) {
    console.warn("Aviso al verificar WhatsApp en PageHeader:", e);
  }
};

const onWhatsAppLinked = (data) => {
  isWhatsAppConnected.value = true;
  whatsappPhone.value = data?.phone_number || "";
  window.dispatchEvent(
    new CustomEvent("whatsapp-status-changed", {
      detail: { is_connected: true, phone_number: whatsappPhone.value },
    })
  );
};

// Escuchar cambios de estado globales emitidos desde Configuración o el Modal QR
const handleWhatsAppStatusEvent = (e) => {
  if (e?.detail) {
    isWhatsAppConnected.value = Boolean(e.detail.is_connected);
    if (e.detail.phone_number !== undefined) {
      whatsappPhone.value = e.detail.phone_number || "";
    }
  } else {
    checkWhatsAppStatus(true);
  }
};

// Al cerrar el modal de QR, refrescar siempre el estado actual forzando limpieza de caché
watch(showWhatsAppQrModal, (isOpen) => {
  if (!isOpen) {
    checkWhatsAppStatus(true);
  }
});

onMounted(() => {
  // Consultar una sola vez al cargar la aplicación
  checkWhatsAppStatus();
  // Escuchar eventos en tiempo real emitidos al vincular o desvincular
  window.addEventListener("whatsapp-status-changed", handleWhatsAppStatusEvent);
});

onUnmounted(() => {
  window.removeEventListener("whatsapp-status-changed", handleWhatsAppStatusEvent);
});

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
