<template>
  <n-layout id="ChefMode" position="absolute">
    <n-layout-header class="layout-header" position="absolute" bordered>
      <n-dropdown trigger="click" :options="options" @select="handleSelect">
        <n-button class="rounded-0 h-100" secondary>
          <v-icon name="bi-list-nested" scale="1.5" />
        </n-button>
      </n-dropdown>
    </n-layout-header>
    <n-layout-content class="layout-content" position="absolute" embedded>
      <div class="position-absolute h-100 mh-100 w-100 mw-100">
        <router-view v-slot="{ Component }">
          <transition name="zoom-fade" mode="out-in" appear>
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "ChefMode",
  setup() {
    const handleSelect = (option) => {
      switch (option) {
        case 1:
          break;
        case 2:
          break;
        case 3:
          break;
        default:
          break;
      }
    };

    const options = [
      {
        key: 1,
        label: "Pantalla completa",
      },
      {
        key: 2,
        label: "Salir Modo Chef",
      },
      {
        key: 3,
        label: "Cerrar sesión",
      },
    ];
    return {
      options,
      handleSelect,
    };
  },
});
</script>

<style scoped lang="scss">
.layout-header {
  background-color: WhiteSmoke;
  height: 64px;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.layout-content {
  margin-top: 64px;
}

/* router view transition */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: transform 0.15s, opacity 0.28s ease-in-out;
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>