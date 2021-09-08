<template>
  <n-config-provider
      :locale="commonEsPE"
      :date-locale="dateEsPE"
      :theme="getDarkTheme"
      :theme-overrides="getThemeOverrides"
  >
    <app-provider>
      <n-layout class="layout" position="absolute" has-sider>
        <n-layout-sider
            class="layout-sider"
            @collapse="collapsed = true"
            @expand="collapsed = false"
            :collapsed="collapsed"
            :collapsed-width="64"
            collapse-mode="width"
            :width="200"
            :native-scrollbar="false"
        >
          <Logo :collapsed="collapsed" />
          <AsideMenu v-model:collapsed="collapsed" />
        </n-layout-sider>
        <n-layout>
          <n-layout-header position="absolute" bordered>
            <PageHeader v-model:collapsed="collapsed" />
          </n-layout-header>
          <n-layout-content class="layout-content"
                            :class="{ 'layout-default-background': getDarkTheme === undefined }"
          >
            <div class="layout-content-main">
              <router-view />
            </div>
          </n-layout-content>
        </n-layout>
      </n-layout>
    </app-provider>
  </n-config-provider>
</template>

<script>
import {computed, defineComponent, onMounted, ref} from "vue"
import {createTheme, inputDark, datePickerDark, darkTheme} from 'naive-ui'
import {commonEsPE, dateEsPE} from '@/locale'
import AppProvider from '@/components/Application'
import Logo from '@/layout/Logo'
import AsideMenu from '@/layout/AsideMenu'
import PageHeader from '@/layout/PageHeader'
import { useDesignSettingStore } from '@/store/modules/designSetting'
import {lighten} from "@/utils"

export default defineComponent({
  name: 'App',
  components: {
    AppProvider,
    Logo,
    AsideMenu,
    PageHeader,
  },
  setup() {
    const collapsed = ref(false)

    const watchWidth = () => {
      const Width = document.body.clientWidth;
      if (Width <= 950) {
        collapsed.value = true;
      } else collapsed.value = false;
    }

    onMounted(() => {
      window.addEventListener('resize', watchWidth)
      // window['$loading'] = useLoadingBar()
      // window['$loading'].finish()
    })

    const designStore = useDesignSettingStore()

    const getThemeOverrides = computed(() => {
      const appTheme = designStore.appTheme;
      const lightenStr = lighten(designStore.appTheme, 6)
      return {
        common: {
          primaryColor: appTheme,
          primaryColorHover: lightenStr,
          primaryColorPressed: lightenStr,
        },
        LoadingBar: {
          colorLoading: appTheme,
        },
      }
    })

    const getDarkTheme = computed(() => (designStore.darkTheme ? darkTheme : undefined))

    return {
      commonEsPE,
      dateEsPE,
      getThemeOverrides,
      getDarkTheme,
      darkTheme: createTheme([inputDark, datePickerDark]),
      collapsed,
    }
  }
})
</script>
<style lang="scss">
.layout {
  display: flex;
  flex-direction: row;
  flex: auto;

  &-default-background {
    background: #f5f7f9;
  }

  .layout-sider {
    min-height: 100vh;
    box-shadow: 2px 0 8px 0 rgb(29 35 41 / 5%);
    position: relative;
    z-index: 13;
    transition: all 0.2s ease-in-out;
  }

  .layout-sider-fix {
    position: fixed;
    top: 0;
    left: 0;
  }

  .ant-layout {
    overflow: hidden;
  }

  .layout-right-fix {
    overflow-x: hidden;
    padding-left: 200px;
    min-height: 100vh;
    transition: all 0.2s ease-in-out;
  }

  .layout-content {
    flex: auto;
    min-height: 100vh;
    padding-top: 64px;
  }

  .n-layout-header.n-layout-header--absolute-positioned {
    z-index: 11;
  }
}

.layout-content-main {
  margin: 10px 25px 25px;
  position: relative;
}
</style>
