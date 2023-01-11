<template>
  <div :class="{ logo: !collapsed, 'logo-collapsed': collapsed }">
    <img
      v-if="collapsed"
      draggable="false"
      src="~@/assets/images/logo.png"
      alt=""
    />
    <img
      v-else
      draggable="false"
      src="~@/assets/images/account-logo.png"
      alt=""
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "Logo",
  props: {
    collapsed: {
      type: Boolean,
    },
  },
});
</script>

<style lang="scss" scoped>
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 112px;

  &-collapsed {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;

    img {
      height: 48px;
    }
  }

  img {
    max-height: 96px;
  }
}

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
