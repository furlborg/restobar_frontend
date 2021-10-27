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
import {RouterLink} from "vue-router"
import {renderIcon} from "@/utils"

export default defineComponent({
  name: "AsideMenu",
  props: {
    collapsed: {
      type: Boolean,
    },
  },
  setup() {
    // console.log(routes)
    const menuOptions = [
      {
        label: () => h(
            RouterLink,
            {
              to: { name: "Dashboard"},
            },
            () => h('span', 'Dashboard')
        ),
        key: 'Dashboard',
        icon: renderIcon('md-spacedashboard-twotone')
      },
      {
        label: () => h(
            RouterLink,
            {
              to: { name: "Table"},
            },
            () => h('span', 'Mesas')
        ),
        key: "Table",
        icon: renderIcon('md-dining-twotone'),
      },
      {
        label: () => h(
            RouterLink,
            {
              to: { name: "Till"},
            },
            () => h('span', 'Caja')
        ),
        key: "Till",
        icon: renderIcon('md-pointofsale-twotone'),
      },
      {
        label: () => h(
            RouterLink,
            {
              to: { name: "Product"},
            },
            () => h('span', 'Productos')
        ),
        key: "Product",
        icon: renderIcon('md-fastfood-twotone'),
      },
      {
        label: () => h(
            RouterLink,
            {
              to: { name: "Customer"},
            },
            () => h('span', 'Clientes')
        ),
        key: "Customer",
        icon: renderIcon('md-supervisedusercircle-twotone'),
      },
      {
        label: () => h(
            RouterLink,
            {
              to: { name: "Settings"},
            },
            () => h('span', 'Configuración')
        ),
        key: "Settings",
        icon: renderIcon('md-settings-twotone'),
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