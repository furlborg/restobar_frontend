<template>
  <div id="HomeSettings">
    <n-h1>
      <n-text>Configuración</n-text>
    </n-h1>
    <n-space justify="space-around">
      <router-link
        class="text-decoration-none"
        :to="{ name: 'BusinessSettings' }"
      >
        <n-card class="w-100" hoverable>
          <n-space align="center" vertical>
            <v-icon name="io-business" scale="10" />
            <n-text class="fs-5">Empresa</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link
        class="text-decoration-none"
        :to="{ name: 'GeneralSettings' }"
      >
        <n-card hoverable>
          <n-space align="center" vertical>
            <v-icon name="md-foodbank-round" scale="10" />
            <n-text class="fs-5">Aplicación</n-text>
          </n-space>
        </n-card>
      </router-link>
      <router-link
        class="text-decoration-none"
        :to="{ name: 'AdvancedSettings' }"
      >
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
    </n-space>
    <!-- <n-grid responsive="screen" cols="8 s:8 m:16 l:16 xl:32 2xl:32" :x-gap="24" :y-gap="24">
            <n-gi :span="8">
                <router-link class="text-decoration-none" :to="{ name: 'BusinessSettings'}">
                    <n-card :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <v-icon name="io-business" scale="10"/>
                        <n-text class="fs-5">Empresa</n-text>
                        </n-space>
                    </n-card>
                </router-link>
            </n-gi>
            <n-gi :span="8">
                <router-link class="text-decoration-none" :to="{ name: 'GeneralSettings'}">
                    <n-card :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <v-icon name="md-foodbank-round" scale="10"/>
                        <n-text class="fs-5">Aplicación</n-text>
                        </n-space>
                    </n-card>
                </router-link>
            </n-gi>
            <n-gi :span="8">
                <router-link class="text-decoration-none" :to="{ name: 'UserSettings'}">
                    <n-card :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <v-icon name="fa-users" scale="10"/>
                        <n-text class="fs-5">Usuarios</n-text>
                        </n-space>
                    </n-card>
                </router-link>
            </n-gi>
            <n-gi :span="8">
                <n-card class="setting" :bordered="false" hoverable>
                    <n-space align="center" vertical>
                    <n-text>Configuración #</n-text>
                    </n-space>
                </n-card>
            </n-gi>
            <n-gi :span="8">
                <n-card class="setting" :bordered="false" hoverable>
                    <n-space align="center" vertical>
                    <n-text>Configuración #</n-text>
                    </n-space>
                </n-card>
            </n-gi>
            <n-gi :span="8">
                <n-card class="setting" :bordered="false" hoverable>
                    <n-space align="center" vertical>
                    <n-text>Configuración #</n-text>
                    </n-space>
                </n-card>
            </n-gi>
            <n-gi :span="8">
                <n-card class="setting" :bordered="false" hoverable>
                    <n-space align="center" vertical>
                    <n-text>Configuración #</n-text>
                    </n-space>
                </n-card>
            </n-gi>
            <n-gi :span="8">
                <n-card class="setting" :bordered="false" hoverable>
                    <n-space align="center" vertical>
                    <n-text>Configuración #</n-text>
                    </n-space>
                </n-card>
            </n-gi>
        </n-grid> -->
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