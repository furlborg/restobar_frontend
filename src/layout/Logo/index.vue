<template>
  <div :class="{ logo: !collapsed, 'logo-collapsed': collapsed }">
    <img draggable="false" :src="image" alt="" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import logo from "@/assets/images/flizzy-logo.png";
import axios from "axios";

defineProps({
  collapsed: Boolean,
});
defineOptions({
  name: "WLogo",
});
const image = ref(logo);
axios
  .get(`${import.meta.env.VITE_APP_URL}/media/business/logo.png`)
  .then((response) => {
    if (response.status === 200) {
      image.value = `${import.meta.env.VITE_APP_URL}/media/business/logo.png`;
    } else {
      image.value = logo;
    }
  })
  .catch(() => (image.value = logo));
</script>

<style lang="scss" scoped>
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 125px;
  padding: 10px 8px;

  &-collapsed {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    padding: 6px;

    img {
      height: 52px;
      width: 52px;
      object-fit: contain;
    }
  }

  img {
    max-height: 108px;
    max-width: 162px;
    width: auto;
    height: auto;
    object-fit: contain;
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
