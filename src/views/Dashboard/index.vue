<template>
  <n-grid cols="1 s:2 m:3 l:3 xl:6 2xl:6" responsive="screen" :x-gap="12" :y-gap="8">
    <n-grid-item>
      <n-card size="small" :bordered="false" hoverable>
        <n-space align="center" vertical>
          <n-icon size="50">
            <v-icon name="bi-clock-history"></v-icon>
          </n-icon>
          <n-text>Ordenes pendientes</n-text>
          <n-h1>14</n-h1>
        </n-space>
      </n-card>
    </n-grid-item>
    <n-grid-item>
      <n-card size="small" :bordered="false" hoverable>
        <n-space align="center" vertical>
          <n-icon size="50">
            <v-icon name="io-fast-food"></v-icon>
          </n-icon>
          <n-text>Ordenes completas</n-text>
          <n-h1>35</n-h1>
        </n-space>
      </n-card>
    </n-grid-item>
    <n-grid-item>
      <n-card size="small" :bordered="false" hoverable>
        <n-space align="center" vertical>
          <n-icon size="50">
            <v-icon name="ri-shopping-bag-2-fill"></v-icon>
          </n-icon>
          <n-text>Ordenes para llevar</n-text>
          <n-h1>7</n-h1>
        </n-space>
      </n-card>
    </n-grid-item>
    <n-grid-item>
      <n-card size="small" :bordered="false" hoverable>
        <n-space align="center" vertical>
          <n-icon size="50">
            <v-icon name="md-deliverydining"></v-icon>
          </n-icon>
          <n-text>Ordenes de entrega</n-text>
          <n-h1>9</n-h1>
        </n-space>
      </n-card>
    </n-grid-item>
    <n-grid-item>
      <n-card size="small" :bordered="false" hoverable>
        <n-space align="center" vertical>
          <n-icon size="50">
            <v-icon name="ri-refund-2-fill"></v-icon>
          </n-icon>
          <n-text>Solicitudes de reembolso</n-text>
          <n-h1>3</n-h1>
        </n-space>
      </n-card>
    </n-grid-item>
    <n-grid-item>
      <n-card size="small" :bordered="false" hoverable>
        <n-space align="center" vertical>
          <n-icon size="50">
            <v-icon name="fa-comment-dots"></v-icon>
          </n-icon>
          <n-text>Comentarios nuevos</n-text>
          <n-h1>136</n-h1>
        </n-space>
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<script>
import {defineComponent} from "vue"

export default defineComponent({
  name: "Dashboard",
  setup() {
    return {}
  }
})
</script>

<style lang="scss" scoped>

</style>