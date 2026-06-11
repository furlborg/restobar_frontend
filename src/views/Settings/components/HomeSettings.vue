<template>
  <div id="HomeSettings">
    <n-h1>
      <n-text>Configuración</n-text>
    </n-h1>
    <n-space justify="space-around">
      <router-link class="text-decoration-none" :to="{ name: 'BusinessSettings' }">
        <n-card class="w-100" hoverable>
          <n-space align="center" vertical>
            <v-icon name="io-business" scale="10" />
            <n-text class="fs-5">Empresa</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link class="text-decoration-none" :to="{ name: 'DocumentCounters' }">
        <n-card hoverable>
          <n-space align="center" vertical>
            <v-icon name="fa-file-invoice-dollar" scale="10" />
            <n-text class="fs-5">Contadores</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link class="text-decoration-none" :to="{ name: 'GeneralSettings' }">
        <n-card hoverable>
          <n-space align="center" vertical>
            <v-icon name="md-foodbank-round" scale="10" />
            <n-text class="fs-5">Aplicación</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link class="text-decoration-none" :to="{ name: 'AdvancedSettings' }">
        <n-card hoverable>
          <n-space align="center" vertical>
            <v-icon name="gi-settings-knobs" scale="10" />
            <n-text class="fs-5">Avanzado</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link class="text-decoration-none" :to="{ name: 'UserSettings' }">
        <n-card hoverable>
          <n-space align="center" vertical>
            <v-icon name="fa-users" scale="10" />
            <n-text class="fs-5">Usuarios</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link class="text-decoration-none" :to="{ name: 'ConsultationSunat' }">
        <n-card hoverable>
          <n-space align="center" vertical>
            <v-icon name="md-search-round" scale="10" />
            <n-text class="fs-5">Consulta SUNAT</n-text>
          </n-space>
        </n-card>
      </router-link>
    </n-space>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "HomeSettings",
  setup() {
    return {};
  },
});
</script>

<style lang="scss" scoped>
.setting:hover {
  cursor: pointer;
}
</style>
