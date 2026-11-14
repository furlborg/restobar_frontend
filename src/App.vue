<template>
  <AppProvider>
    <router-view></router-view>
    <UpdateNotice />
  </AppProvider>
</template>

<script setup>
import AppProvider from "@/components/Application/TsiIndex.vue";
import UpdateNotice from "@/components/Update/UpdateNotice.vue";
</script>
