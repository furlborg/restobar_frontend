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
              <n-text type="success">Stock: {{ product.stock_override }}</n-text>
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
import { computed, ref, defineProps, defineEmits } from 'vue'
import { inject } from 'vue'
import { useOrderStore } from '@/store/modules/order'

const emit = defineEmits(['close'])

const orderStore = useOrderStore()
const selectedCustomerId = inject('selectedCustomerId', ref(null))
const addOrderToCustomer = inject('addOrderToCustomer', null)

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
  const quantitiesByPhase = {};

  for (const [phase, products] of Object.entries(groupedProducts.value)) {
    const totalPhaseQuantity = products.reduce((sum, p) => sum + (quantities.value[p.product_id] || 0), 0);

    if (totalPhaseQuantity === 0) {
      window.$message?.error(`Selecciona al menos un producto en la fase "${phase}"`);
      return;
    }

    quantitiesByPhase[phase] = totalPhaseQuantity;
  }

  const uniqueQuantities = [...new Set(Object.values(quantitiesByPhase))];
  if (uniqueQuantities.length > 1) {
    window.$message?.error("La cantidad total de productos seleccionados debe ser igual para cada fase");
    return;
  }

  const totalMenus = uniqueQuantities[0];

  const selectedItems = props.menu.items
    .filter(item => quantities.value[item.product_id] > 0)
    .map(item => ({
      product_phase_id: item.product_phase.id,
      product_id: item.product_id,
      product_name: item.product_name,
      phase_name: item.phase_name,
      quantity: quantities.value[item.product_id]
    }));

  if (!selectedItems.length) {
    window.$message?.error("Selecciona al menos un producto");
    return;
  }

  const menuOrder = {
    from_menu: true,
    order_detail_id: null,
    menu_id: props.menu.menu.id,
    name: props.menu.menu.name,
    price: props.menu.menu.price,
    quantity: totalMenus,
    items: selectedItems
  };

  if (selectedCustomerId.value && addOrderToCustomer) {
    addOrderToCustomer(menuOrder, selectedCustomerId.value);
  } else {
    orderStore.addMenuOrder(menuOrder);
  }

  emit('close')
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