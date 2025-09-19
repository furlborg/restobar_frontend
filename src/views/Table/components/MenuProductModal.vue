<template>
  <n-modal
    :show="true"
    preset="card"
    :title="menu.name"
    style="width: 90vw; max-width: 1200px;"
  >
    <n-grid :cols="4" :x-gap="12">
      <n-gi v-for="(products, type) in groupedProducts" :key="type">
        <n-card :title="type.toUpperCase()">
          <n-space vertical>
            <div
              v-for="product in products"
              :key="product.product_id"
              class="product-card"
            >
              <div>{{ product.product_name }}</div>
              <n-text type="success">Stock: {{ product.stock }}</n-text>
              <n-input-number
                v-model:value="quantities[product.product_id]"
                :min="0"
                :max="product.stock"
              />
            </div>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    <template #footer>
      <n-space justify="space-between">
        <n-button @click="$emit('close')" secondary>Cancelar</n-button>
        <n-button type="primary" @click="handleAddMenu">Agregar menú</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, ref } from 'vue'


const props = defineProps({
  menu: Object,
})
const quantities = ref({})

const groupedProducts = computed(() => {
  const groups = {};
  props.menu.items?.forEach((product) => {
    if (!groups[product.phase_name]) groups[product.phase_name] = [];
    groups[product.phase_name].push(product);
    if (!(product.product_id in quantities.value)) {
      quantities.value[product.product_id] = 0;
    }
  });
  return groups;
})

const handleAddMenu = () => {
  const selected = Object.entries(quantities.value)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product_id: id, quantity: qty }))
  // emitir al padre o agregar directamente
  console.log('Seleccionados:', selected)
  // $emit('add-menu', selected) si fuera necesario
}
</script>

<style scoped>
.product-card {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.product-card:last-child {
  border-bottom: none;
}
</style>