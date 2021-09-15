<template>
  <n-drawer v-model:show="isDrawer" :width="280" placement="right" :native-scrollbar="false">
    <n-drawer-content title="Personalización de la Aplicación">
      <div class="drawer">
        <n-divider title-placement="center">Tema Oscuro</n-divider>

        <div class="drawer-setting-item justify-center dark-switch">
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-switch size="large" v-model:value="designStore.darkTheme" @on-update:value="designStore.toggleDarkTheme()">
                <template #checked>
                  <v-icon name="md-darkmode-twotone" />
                </template>
                <template #unchecked>
                  <v-icon name="md-lightmode-twotone" fill="#000000" />
                </template>
              </n-switch>
            </template>
            <span>Tema oscuro</span>
          </n-tooltip>
        </div>

        <n-divider title-placement="center">Tema del Sistema</n-divider>

        <div class="drawer-setting-item align-items-top">
          <span
            class="theme-item"
            v-for="(item, index) in appThemeList"
            :key="index"
            :style="{ 'background-color': item }"
            @click="designStore.setAppTheme(item)"
          >
            <v-icon name="bi-check2" inverse v-if="item === designStore.appTheme" />
          </span>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script>
  import { defineComponent, reactive, toRefs } from 'vue'
  import { useDesignSettingStore } from '@/store/modules/designSetting'
  import { darkTheme } from 'naive-ui'

  export default defineComponent({
    name: 'ProjectSetting',
    setup() {
      const designStore = useDesignSettingStore()
      const state = reactive({
        isDrawer: false,
        appThemeList: designStore.appThemeList,
      })

      function openDrawer() {
        state.isDrawer = true
      }

      function closeDrawer() {
        state.isDrawer = false
      }

      return {
        ...toRefs(state),
        designStore,
        darkTheme,
        openDrawer,
        closeDrawer,
      }
    },
  })
</script>

<style lang="scss" scoped>
  .drawer {
    .n-divider:not(.n-divider--vertical) {
      margin: 10px 0;
    }

    &-setting-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      flex-wrap: wrap;

      &-style {
        display: inline-block;
        position: relative;
        margin-right: 16px;
        cursor: pointer;
        text-align: center;
      }

      &-title {
        flex: 1 1;
        font-size: 14px;
      }

      &-action {
        flex: 0 0 auto;
      }

      .theme-item {
        width: 20px;
        min-width: 20px;
        height: 20px;
        cursor: pointer;
        border: 1px solid #eee;
        border-radius: 2px;
        margin: 0 5px 5px 0;
        text-align: center;
      }
    }

    .align-items-top {
      align-items: flex-start;
      padding: 2px 0;
    }

    .justify-center {
      justify-content: center;
    }

    .dark-switch .n-switch--active {
      ::v-deep(.n-switch__rail) {
        background-color: #000e1c;
      }
    }
  }
</style>
