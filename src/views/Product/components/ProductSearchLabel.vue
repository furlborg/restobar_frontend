<template>
  <n-thing>
    <template #header>
      <n-space align="center">
        <n-text :depth="2">{{ option.label }}</n-text>
        <n-tag
          size="small"
          :color="{
            color: lighten(tagColor, 48),
            textColor: tagColor,
            borderColor: lighten(tagColor, 24)
          }"
        >
          {{ tagText }}
        </n-tag>
      </n-space>
    </template>

    <template #description>
      <n-space size="small">
        <n-text :depth="3">{{ option.category }}</n-text>
        <n-text :depth="3">Stock: {{ option.stock }}</n-text>
        <n-text :depth="3">Precio: {{ option.price }}</n-text>
      </n-space>
    </template>
  </n-thing>
</template>

<script setup>
import { computed } from 'vue';
import { NThing, NSpace, NText, NTag } from 'naive-ui';
import { lighten } from '@/utils';

const props = defineProps({
  option: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && 
             typeof value.label === 'string' &&
             typeof value.category === 'string' &&
             (typeof value.stock === 'string' || typeof value.stock === 'number');
    }
  }
});

// Compute tag color and text based on label
const tagColor = computed(() => {
  const t = props.option.label.split("-");
  if (t.length > 1) {
    if (t[1].includes("LL")) {
      return "#926ED7"; // Para llevar
    } else if (t[1].includes("D")) {
      return "#995C4E"; // Delivery  
    }
  }
  return "#3B689F"; // Mesa (default)
});

const tagText = computed(() => {
  const t = props.option.label.split("-");
  if (t.length > 1) {
    if (t[1].includes("LL")) {
      return "PARA LLEVAR";
    } else if (t[1].includes("D")) {
      return "DELIVERY";
    }
  }
  return "MESA";
});
</script>
