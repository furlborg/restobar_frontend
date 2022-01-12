<template>
  <router-view></router-view>
</template>

<script>
import { defineComponent, onMounted } from "vue";

export default defineComponent({
  name: "Settings",
  setup() {
    onMounted(() => (document.title = "Configuración | App"));
    return {};
  },
});
</script>

<style>
</style>