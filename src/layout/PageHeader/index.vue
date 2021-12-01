<template>
  <div class="layout-header">
    <div class="layout-header-left">
      <div class="layout-header-trigger layout-header-trigger-min"
           @click="() => $emit('update:collapsed', !collapsed)"
      >
        <n-icon size="18" v-if="collapsed">
          <v-icon name="oi-sidebar-expand" flip="horizontal"/>
        </n-icon>
        <n-icon size="18" v-else>
          <v-icon name="oi-sidebar-collapse" flip="horizontal"/>
        </n-icon>
      </div>
    </div>
    <div class="layout-header-right">
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
      <div class="layout-header-trigger layout-header-trigger-min" @click="openSetting">
        <n-tooltip>
          <template #trigger>
            <n-icon size="18">
              <v-icon name="gi-settings-knobs" />
            </n-icon>
          </template>
          <span>Tema</span>
        </n-tooltip>
      </div>
      <div class="layout-header-trigger layout-header-trigger-min">
        <n-dropdown trigger="hover" placement="bottom-end" @select="avatarSelect" :options="avatarOptions">
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

<script>
import {defineComponent, reactive, ref, toRefs} from "vue"
import {useDialog, useMessage} from "naive-ui"
import ProjectSetting from './ProjectSetting'
import { useRouter } from "vue-router"

export default defineComponent({
  name: "PageHeader",
  components: {
    ProjectSetting,
  },
  props: {
    collapsed: {
      type: Boolean,
    },
  },
  setup() {
    const router = useRouter()
    const message = useMessage()
    const dialog = useDialog()
    const drawerSetting = ref()

    const state = reactive({
      fullscreenIcon: 'bi-fullscreen',
    })

    const toggleFullscreenIcon = () => (
        state.fullscreenIcon = document.fullscreenElement !== null ? 'bi-fullscreen-exit' : 'bi-fullscreen'
    )

    document.addEventListener('fullscreenchange', toggleFullscreenIcon)

    const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
    }

    const avatarOptions = [
      {
        label: 'Modo Mozo',
        key: 0,
      },
      {
        label: 'Configuraciones personales',
        key: 1,
      },
      {
        label: 'Desconectar',
        key: 2,
      },
    ]

    const avatarSelect = (key) => {
      switch (key) {
        case 0:
          router.push({name: 'WaiterMode'})
          break;
        case 1:
          console.log('option 1')
          break;
        case 2:
          doLogout();
          console.log('option 2')
          break;
      }
    }

    const doLogout = () => {
      dialog.info({
        title: 'Logout',
        content: 'Are you sure you want to log out',
        positiveText: 'Yes',
        negativeText: 'No',
        onPositiveClick: () => {
          message.success('You just logged out...')
        },
        onNegativeClick: () => {
          message.error('You stay...')
        },
      })
    }

    function openSetting() {
      const { openDrawer } = drawerSetting.value;
      openDrawer();
    }

    return {
      ...toRefs(state),
      toggleFullScreen,
      doLogout,
      avatarOptions,
      avatarSelect,
      drawerSetting,
      openSetting,
    }
  }
})
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
  //color: #fff;

  //.n-icon {
  //  color: #fff
  //}

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

    > * {
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

//::v-deep(.menu-router-link) {
//  color: #515a6e;
//
//  &:hover {
//    color: #1890ff;
//  }
//}
</style>