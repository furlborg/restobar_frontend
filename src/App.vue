<template>
  <AppProvider>
    <router-view></router-view>
  </AppProvider>
</template>

<script>
import { defineComponent } from "vue";
import AppProvider from "@/components/Application/index.vue";

export default defineComponent({
  name: "App",
  components: {
    AppProvider,
  },
  setup() {
    return {};
  },
});
</script>
