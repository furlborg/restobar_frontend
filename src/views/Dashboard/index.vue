<template>
  <div id="Dashboard">
    <!-- <div class="logo">
      <img draggable="false" src="~@/assets/images/account-logo.png" alt="" />
    </div> -->
    <n-grid
      cols="6 xs:6 s:9 m:12 l:15 xl:18 2xl:21"
      responsive="screen"
      :x-gap="12"
      :y-gap="8"
    >
      <n-gi :span="3">
        <n-card size="small" :bordered="false" hoverable>
          <n-space class="text-center" align="center" vertical>
            <n-icon size="50">
              <v-icon name="bi-clock-history"></v-icon>
            </n-icon>
            <n-text>Ordenes pendientes</n-text>
            <n-h1>14</n-h1>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="3">
        <n-card size="small" :bordered="false" hoverable>
          <n-space class="text-center" align="center" vertical>
            <n-icon size="50">
              <v-icon name="io-fast-food"></v-icon>
            </n-icon>
            <n-text>Ordenes completas</n-text>
            <n-h1>35</n-h1>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="3">
        <n-card size="small" :bordered="false" hoverable>
          <n-space class="text-center" align="center" vertical>
            <n-icon size="50">
              <v-icon name="ri-shopping-bag-2-fill"></v-icon>
            </n-icon>
            <n-text>Ordenes para llevar</n-text>
            <n-h1>7</n-h1>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="3">
        <n-card size="small" :bordered="false" hoverable>
          <n-space class="text-center" align="center" vertical>
            <n-icon size="50">
              <v-icon name="md-deliverydining"></v-icon>
            </n-icon>
            <n-text>Ordenes de entrega</n-text>
            <n-h1>9</n-h1>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="3">
        <n-card size="small" :bordered="false" hoverable>
          <n-space class="text-center" align="center" vertical>
            <n-icon size="50">
              <v-icon name="ri-refund-2-fill"></v-icon>
            </n-icon>
            <n-text>Solicitudes de Reembolso</n-text>
            <n-h1>3</n-h1>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="3">
        <n-card size="small" :bordered="false" hoverable>
          <n-space class="text-center" align="center" vertical>
            <n-icon size="50">
              <v-icon name="fa-comment-dots"></v-icon>
            </n-icon>
            <n-text>Comentarios nuevos</n-text>
            <n-h1>136</n-h1>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "Dashboard",
  setup() {
    return {};
  },
});
</script>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
}
/* .logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  line-height: auto;
  overflow: hidden;
  white-space: nowrap;

  img {
    width: auto;
    height: auto;
  }
} */
</style>