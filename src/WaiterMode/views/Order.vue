<template>
  <n-tabs type="line" justify-content="space-around">
    <n-tab-pane class="p-0" name="menu" tab="Carta">
      <router-view></router-view>
      <teleport to="body">
        <n-button class="position-absolute bottom-0 start-50 translate-middle-x mb-3" size="large" type="info" @click="active=true" round>Ver pedidos</n-button>
      </teleport>
      <n-drawer height="35%" v-model:show="active" placement="bottom" closable>
        <n-drawer-content title="Pedidos"></n-drawer-content>
      </n-drawer>
    </n-tab-pane>
    <n-tab-pane name="order" tab="Pedido">
      <n-card title="Pedido"></n-card>
    </n-tab-pane>
  </n-tabs>
</template>

<script>
import { defineComponent, onUpdated, onMounted, ref } from "vue"

export default defineComponent({
    name: 'Order',
    setup() {
      const active = ref(false)
      function setTabStyle() {
        let tab_nav = document.getElementsByClassName('n-tabs-nav')
        for(let i = 0; i < tab_nav.length; i++) {
          tab_nav[i].style.position = 'absolute'
          tab_nav[i].style.zIndex = 1
          tab_nav[i].style.backgroundColor = 'White'
        }
      }
      onMounted(() => {
        setTabStyle()
      })

      onUpdated(() => {
        setTabStyle()
      })
        return {
          active,
        }
    }
})
</script>

<style lang="scss" scoped>
.n-tab-pane {
  position: relative;
  top: 42px;
}
</style>