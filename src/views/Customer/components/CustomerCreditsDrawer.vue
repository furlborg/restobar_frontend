<template>
  <n-drawer :show="show" @update:show="(v) => $emit('update:show', v)" placement="right"
    style="width: 100%; min-width: 320px; max-width: 1024px">
    <CustomerCredits :id="id" />
  </n-drawer>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import CustomerCredits from "./CustomerCredits.vue";

defineOptions({
  name: "CustomerCreditsDrawer",
});

defineProps({
  show: Boolean,
  id: Number,
});

defineEmits(["update:show"]);
</script>

<style lang="scss"></style>
