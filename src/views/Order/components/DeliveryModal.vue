<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Información de delivery"
    :mask-closable="false"
    :show="show"
    @close="() => $emit('update:show')"
  >
    <n-space vertical>
      <n-text class="fs-6">Persona:</n-text>
      <n-text v-if="delivery" class="fs-4">{{ delivery.person }}</n-text>
      <n-skeleton v-else text />
      <n-text class="fs-6">Dirección:</n-text>
      <n-text v-if="delivery" class="fs-4">{{ delivery.address }}</n-text>
      <n-skeleton v-else text />
      <n-text class="fs-6">Número de contacto:</n-text>
      <n-text v-if="delivery" class="fs-4">{{ delivery.phone }}</n-text>
      <n-skeleton v-else text />
      <n-text class="fs-6">Persona:</n-text>
      <n-text v-if="delivery" class="fs-4">{{ delivery.amount }}</n-text>
      <n-skeleton v-else text />
    </n-space>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, watch, computed } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { isNumber, isLetter } from "@/utils";
import { listOrderDetails } from "@/api/modules/orders";

export default defineComponent({
  name: "DeliveryModal",
  emits: ["update:show"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    delivery: {
      type: Object,
      default: null,
    },
  },
  setup() {
    const genericsStore = useGenericsStore();

    return {
      genericsStore,
    };
  },
});
</script>

<style>
</style>