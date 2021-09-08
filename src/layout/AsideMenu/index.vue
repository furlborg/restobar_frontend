<template>
  <n-menu
      :collapsed-width=64
      :collapsed-icon-size=22
      :options="menuOptions"
      :collapsed="collapsed"
  />
</template>

<script>
import {defineComponent, h} from "vue"
import {useRouter, RouterLink} from "vue-router"
import {renderIcon} from "@/utils"

export default defineComponent({
  name: "AsideMenu",
  props: {
    collapsed: {
      type: Boolean,
    },
  },
  setup() {
    const router = useRouter()
    const routes = router.getRoutes()

    const menuOptions = [
      {
        label: () => h(
            RouterLink,
            {
              to: routes[0].path,
            },
            () => h('span', 'Dashboard')
        ),
        key: routes[0].name,
        icon: renderIcon('md-spacedashboard-twotone')
      },
      {
        label: () => h(
            RouterLink,
            {
              to: routes[1].path,
            },
            () => h('span', 'Customer')
        ),
        key: routes[1].name,
        icon: renderIcon('md-supervisedusercircle-twotone'),
      }
    ]
    return {
      menuOptions,
    }
  }
})
</script>

<style scoped>

</style>