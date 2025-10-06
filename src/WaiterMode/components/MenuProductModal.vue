<template>
  <n-modal
    :show="true"
    preset="card"
    :title="menu.menu_name || menu.menu.name"
    style="width: 90vw; max-width: 1200px;"
    @update:show="$emit('close')"
  >
    <template #header-extra>
      <n-text class="fs-5 fw-bold" type="success">S/. {{ menu.menu.price }}</n-text>
    </template>
    
    <n-grid :cols="4" :x-gap="12">
      <n-gi v-for="(products, type) in groupedProducts" :key="type">
        <n-card :title="type.toUpperCase()">
          <n-space vertical>
            <div
              v-for="product in products"
              :key="product.product_id"
              class="product-card"
              :class="{ 'no-stock': !availableStock[product.product_id]?.available || availableStock[product.product_id]?.available === 0 }"
            >
              <div class="product-name">{{ product.product_name }}</div>
              <n-text 
                :type="availableStock[product.product_id]?.available > 0 ? 'success' : 'error'"
                class="stock-info"
              >
                Stock: {{ availableStock[product.product_id]?.available || 0 }} de {{ availableStock[product.product_id]?.original || 0 }}
                <span v-if="availableStock[product.product_id]?.used > 0" class="used-stock">
                  (Usado: {{ availableStock[product.product_id]?.used }})
                </span>
                <span v-if="!availableStock[product.product_id]?.available || availableStock[product.product_id]?.available === 0"> (Sin stock)</span>
              </n-text>
              <n-input-number
                v-model:value="quantities[product.product_id]"
                :min="0"
                :max="availableStock[product.product_id]?.available || 0"
                :disabled="!availableStock[product.product_id]?.available || availableStock[product.product_id]?.available === 0"
                :status="quantities[product.product_id] > (availableStock[product.product_id]?.available || 0) ? 'error' : 'default'"
                size="small"
              />
              <n-text 
                v-if="quantities[product.product_id] > (availableStock[product.product_id]?.available || 0)" 
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
      <n-space direction="vertical" size="small">
        <!-- Mensaje de validación de fases -->
        <n-text v-if="phaseValidationError" type="error" class="fs-7">
          {{ phaseValidationError }}
        </n-text>
        
        <n-space justify="space-between">
          <n-button @click="$emit('close')" secondary>Cancelar</n-button>
          <n-space>
            <n-text class="fs-6">
              Total: S/. {{ totalPrice.toFixed(2) }}
            </n-text>
            <n-button 
              type="primary" 
              @click="handleAddMenu"
              :disabled="!hasValidQuantities"
            >
              Agregar menú ({{ totalQuantity }})
            </n-button>
          </n-space>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, computed, ref, defineProps, defineEmits } from 'vue'
import { useOrderStore } from '@/store/modules/order'
import { useMessage } from 'naive-ui'

export default defineComponent({
  name: 'MenuProductModal',
  props: {
    menu: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const orderStore = useOrderStore()
    const message = useMessage()
    const quantities = ref({})

    const groupedProducts = computed(() => {
      const groups = {};
      props.menu.items?.forEach((product) => {
        if (!groups[product.phase_name]) groups[product.phase_name] = [];
        groups[product.phase_name].push(product);
        // Inicializar cantidades en 0 si no existen
        if (!(product.product_id in quantities.value)) {
          quantities.value[product.product_id] = 0;
        }
      });
      return groups;
    })

    // Computed para calcular el stock disponible considerando lo ya agregado en el frontend
    const availableStock = computed(() => {
      const stockMap = {};
      
      // Obtener menús ya agregados en el orderStore para este menú específico
      const existingMenuOrders = orderStore.menuSets.filter(menu => 
        menu.menu_id === props.menu.menu.id
      );
      
      props.menu.items?.forEach((product) => {
        let usedStock = 0;
        
        // Calcular stock ya usado para este producto en menús existentes
        existingMenuOrders.forEach(menuOrder => {
          const menuItem = menuOrder.items?.find(item => item.product_id === product.product_id);
          if (menuItem) {
            usedStock += menuItem.quantity * menuOrder.quantity;
          }
        });
        
        const originalStock = product.stock_override || 0;
        const available = Math.max(0, originalStock - usedStock);
        
        stockMap[product.product_id] = {
          original: originalStock,
          used: usedStock,
          available: available
        };
      });
      
      return stockMap;
    });

    const totalQuantity = computed(() => {
      // Agrupar cantidades por fase para validar que sean iguales
      const quantitiesByPhase = {};
      
      for (const [productId, quantity] of Object.entries(quantities.value)) {
        if (quantity > 0) {
          const product = props.menu.items?.find(item => item.product_id == productId);
          if (product) {
            const phase = product.phase_name;
            if (!quantitiesByPhase[phase]) {
              quantitiesByPhase[phase] = 0;
            }
            quantitiesByPhase[phase] += quantity;
          }
        }
      }
      
      const uniqueQuantities = [...new Set(Object.values(quantitiesByPhase))];
      // Si hay diferentes cantidades por fase, retornar 0 (inválido)
      if (uniqueQuantities.length > 1) {
        return 0;
      }
      
      return uniqueQuantities[0] || 0;
    });

    const totalPrice = computed(() => {
      return (props.menu.menu.price || 0) * totalQuantity.value;
    });

    const phaseValidationError = computed(() => {
      const quantitiesByPhase = {};
      
      for (const [productId, quantity] of Object.entries(quantities.value)) {
        if (quantity > 0) {
          const product = props.menu.items?.find(item => item.product_id == productId);
          if (product) {
            const phase = product.phase_name;
            if (!quantitiesByPhase[phase]) {
              quantitiesByPhase[phase] = 0;
            }
            quantitiesByPhase[phase] += quantity;
          }
        }
      }
      
      const uniqueQuantities = [...new Set(Object.values(quantitiesByPhase))];
      if (uniqueQuantities.length > 1) {
        const phases = Object.keys(quantitiesByPhase);
        return `Las cantidades por fase deben ser iguales. Actualmente: ${phases.map(phase => `${phase}: ${quantitiesByPhase[phase]}`).join(', ')}`;
      }
      
      return null;
    });

    const hasValidQuantities = computed(() => {
      const values = Object.values(quantities.value);
      const hasSelection = values.some(q => q > 0);
      const withinStock = values.every((q, index) => {
        const productId = Object.keys(quantities.value)[index];
        return q <= (availableStock.value[productId]?.available || 0);
      });
      
      // Validar que las cantidades por fase sean iguales
      const quantitiesByPhase = {};
      for (const [productId, quantity] of Object.entries(quantities.value)) {
        if (quantity > 0) {
          const product = props.menu.items?.find(item => item.product_id == productId);
          if (product) {
            const phase = product.phase_name;
            if (!quantitiesByPhase[phase]) {
              quantitiesByPhase[phase] = 0;
            }
            quantitiesByPhase[phase] += quantity;
          }
        }
      }
      
      const uniqueQuantities = [...new Set(Object.values(quantitiesByPhase))];
      const equalPhases = uniqueQuantities.length <= 1;
      
      return hasSelection && withinStock && equalPhases;
    });

    const handleAddMenu = () => {
      // Validación de cantidades por fase
      const quantitiesByPhase = {};
      
      for (const [productId, quantity] of Object.entries(quantities.value)) {
        if (quantity > 0) {
          const product = props.menu.items?.find(item => item.product_id == productId);
          if (product) {
            const phase = product.phase_name;
            const availableStockAmount = availableStock.value[productId]?.available || 0;
            
            if (!quantitiesByPhase[phase]) {
              quantitiesByPhase[phase] = 0;
            }
            quantitiesByPhase[phase] += quantity;
            
            if (quantity > availableStockAmount) {
              message.warning(`Stock insuficiente en fase "${phase}": "${product.product_name}" - Solicitado: ${quantity}, Disponible: ${availableStockAmount}`);
              return;
            }
          }
        }
      }
      
      const uniqueQuantities = [...new Set(Object.values(quantitiesByPhase))];
      if (uniqueQuantities.length > 1) {
        message.error("La cantidad total de productos seleccionados debe ser igual para cada fase");
        return;
      }
      
      const totalMenus = uniqueQuantities[0];
      
      if (!totalMenus || totalMenus === 0) {
        message.error('Debes seleccionar al menos un producto');
        return;
      }
      
      // Crear el objeto del menú para agregar al pedido
      const selectedItems = props.menu.items
        .filter(item => quantities.value[item.product_id] > 0)
        .map(item => ({
          product_phase_id: item.product_phase?.id,
          product_id: item.product_id,
          product_name: item.product_name,
          phase_name: item.phase_name,
          quantity: quantities.value[item.product_id]
        }));
      
      const menuOrder = {
        from_menu: true,
        order_detail_id: null,
        menu_id: props.menu.menu.id,
        name: props.menu.menu_name || props.menu.menu.name,
        price: props.menu.menu.price,
        quantity: totalMenus,
        items: selectedItems
      };
      
      // Usar el método addMenuOrder del orderStore
      orderStore.addMenuOrder(menuOrder);
      
      message.success(`Menú "${props.menu.menu_name || props.menu.menu.name}" agregado al pedido`);
      emit('success');
    };

    return {
      quantities,
      groupedProducts,
      availableStock,
      totalQuantity,
      totalPrice,
      phaseValidationError,
      hasValidQuantities,
      handleAddMenu
    }
  }
})
</script>

<style lang="scss" scoped>
.product-card {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #18a058;
    box-shadow: 0 2px 8px rgba(24, 160, 88, 0.1);
  }

  &.no-stock {
    opacity: 0.6;
    background-color: #f5f5f5;
  }
}

.product-name {
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.stock-info {
  font-size: 12px;
  margin-bottom: 8px;
  display: block;
}

.used-stock {
  color: #f0a020;
}

.error-text {
  font-size: 11px;
  margin-top: 4px;
}

.fs-5 {
  font-size: 1.25rem;
}

.fs-6 {
  font-size: 1.1rem;
}

.fs-7 {
  font-size: 0.85rem;
}

.fw-bold {
  font-weight: bold;
}
</style>