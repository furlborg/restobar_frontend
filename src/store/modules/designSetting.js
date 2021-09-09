import { defineStore } from 'pinia'
import { store } from '@/store'
import designSetting from '@/settings/designSetting'

const { darkTheme, appTheme, appThemeList } = designSetting

export const useDesignSettingStore = defineStore('app-design-setting',{
    state:() => ({
        darkTheme: darkTheme,
        appTheme: appTheme,
        appThemeList,
    }),
    getters: {
        getDarkTheme() {
            return this.darkTheme
        },
        getAppTheme() {
            return this.appTheme
        },
        getAppThemeList() {
            return this.appThemeList
        },
    },
    actions: {
        initializeStore() {
          if (localStorage.getItem('dark-theme')) {
              this.darkTheme = localStorage.getItem('dark-theme')
          } else {
              localStorage.setItem('dark-theme', this.darkTheme)
          }
          if (localStorage.getItem('app-theme')) {
              this.appTheme = localStorage.getItem('app-theme')
          } else {
              localStorage.setItem('app-theme', this.appTheme)
          }
        },
    },
})

// Need to be used outside the setup
export function useDesignSettingWithOut() {
    return useDesignSettingStore(store)
}
