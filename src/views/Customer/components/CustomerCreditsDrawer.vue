<template>
  <n-drawer
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="right"
    style="width: 100%; min-width: 320px; max-width: 1024px"
  >
    <CustomerCredits :id="id" />
  </n-drawer>
</template>

<script>
import { defineComponent } from "vue";
import CustomerCredits from "./CustomerCredits.vue";
export default defineComponent({
  name: "CustomerCreditsDrawer",
  components: {
    CustomerCredits,
  },
  emits: ["update:show"],
  props: {
    show: {
      type: Boolean,
    },
    id: {
      type: Number,
    },
  },
  setup() {
    return {};
  },
});
</script>

<style lang="scss"></style>
