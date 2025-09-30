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
              :class="{ 'no-stock': !product.stock_override || product.stock_override === 0 }"
            >
              <div class="product-name">{{ product.product_name }}</div>
              <n-text 
                :type="product.stock_override > 0 ? 'success' : 'error'"
                class="stock-info"
              >
                Stock: {{ product.stock_override || 0 }}
                <span v-if="!product.stock_override || product.stock_override === 0"> (Sin stock)</span>
                <span v-else-if="quantities[product.product_id] > 0" class="stock-calculation">
                  (Máx. {{ Math.floor((product.stock_override || 0) / quantities[product.product_id]) }} menús)
                </span>
              </n-text>
              <n-input-number
                v-model:value="quantities[product.product_id]"
                :min="0"
                :max="product.stock_override || 0"
                :disabled="!product.stock_override || product.stock_override === 0"
                :status="quantities[product.product_id] > (product.stock_override || 0) ? 'error' : 'default'"
                size="small"
              />
              <n-text 
                v-if="quantities[product.product_id] > (product.stock_override || 0)" 
                type="error" 
                class="error-text"
              >
                ⚠️ Excede stock disponible
              </n-text>
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
  // Validar que las cantidades no excedan el stock disponible
  for (const product of props.menu.items) {
    const selectedQuantity = quantities.value[product.product_id] || 0;
    const availableStock = product.stock_override || 0;
    
    if (selectedQuantity > 0 && availableStock === 0) {
      window.$message?.warning(`❌ Stock insuficiente: El producto "${product.product_name}" no tiene stock disponible`);
      return;
    }
    
    if (selectedQuantity > availableStock) {
      window.$message?.warning(`❌ Stock insuficiente: "${product.product_name}" - Solicitado: ${selectedQuantity}, Disponible: ${availableStock}`);
      return;
    }
  }

  const quantitiesByPhase = {};

  for (const [phase, products] of Object.entries(groupedProducts.value)) {
    const totalPhaseQuantity = products.reduce((sum, p) => sum + (quantities.value[p.product_id] || 0), 0);

    if (totalPhaseQuantity === 0) {
      window.$message?.error(`Selecciona al menos un producto en la fase "${phase}"`);
      return;
    }

    // Validar stock por fase completa
    for (const product of products) {
      const selectedQuantity = quantities.value[product.product_id] || 0;
      const availableStock = product.stock_override || 0;
      
      if (selectedQuantity > 0 && selectedQuantity > availableStock) {
        window.$message?.warning(`❌ Stock insuficiente en fase "${phase}": "${product.product_name}" - Solicitado: ${selectedQuantity}, Disponible: ${availableStock}`);
        return;
      }
    }

    quantitiesByPhase[phase] = totalPhaseQuantity;
  }

  const uniqueQuantities = [...new Set(Object.values(quantitiesByPhase))];
  if (uniqueQuantities.length > 1) {
    window.$message?.error("La cantidad total de productos seleccionados debe ser igual para cada fase");
    return;
  }

  const totalMenus = uniqueQuantities[0];

  // Validación final: verificar si hay stock suficiente para la cantidad total de menús solicitados
  for (const product of props.menu.items) {
    const selectedQuantity = quantities.value[product.product_id] || 0;
    const availableStock = product.stock_override || 0;
    
    if (selectedQuantity > 0) {
      // Calcular cuántos menús se pueden hacer con este producto
      const maxMenusFromThisProduct = Math.floor(availableStock / selectedQuantity);
      
      if (maxMenusFromThisProduct < totalMenus) {
        window.$message?.warning(`❌ Stock insuficiente para ${totalMenus} menús: "${product.product_name}" permite máximo ${maxMenusFromThisProduct} menús (Stock: ${availableStock}, Necesario: ${selectedQuantity * totalMenus})`);
        return;
      }
    }
  }

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
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.product-card:last-child {
  border-bottom: none;
}
.product-card.no-stock {
  opacity: 0.6;
  background-color: #fafafa;
  border-radius: 4px;
  padding: 12px 8px;
}
.product-name {
  font-weight: 500;
  margin-bottom: 4px;
}
.stock-info {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}
.stock-calculation {
  font-weight: 600;
  color: #18a058;
}
.error-text {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 500;
}
</style>