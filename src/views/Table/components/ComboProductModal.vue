<template>
  <n-modal :show="true" preset="card" :title="`Agregar Combo: ${combo.name}`"
    :style="{ width: '90%', maxWidth: '800px' }" @close="emit('close')">
    <n-spin :show="false">
      <n-space vertical size="large">
        <!-- Información del combo -->
        <n-card size="small" :bordered="false" style="background-color: #f8f9fa;">
          <n-space vertical>
            <n-space justify="space-between" align="center">
              <n-text class="fs-4 fw-bold">{{ combo.name }}</n-text>
              <n-tag type="success" size="large">
                S/. {{ formatPrice(combo.price || 0) }}
              </n-tag>
            </n-space>

            <n-divider style="margin: 8px 0;" />

            <!-- Items incluidos en el combo -->
            <div>
              <n-text class="fs-6 fw-bold">Productos incluidos:</n-text>
              <n-list style="margin-top: 8px;">
                <n-list-item v-for="item in combo.products" :key="item.id">
                  <n-space align="center">
                    <n-tag type="info" size="small">{{ item.quantity }}x</n-tag>
                    <n-text>{{ item.name || item.product_name || item.product?.name || 'Producto' }}</n-text>
                    <n-text depth="3" style="font-size: 12px;">
                      (S/. {{ formatPrice(item.unit_price || 0) }} c/u)
                    </n-text>
                  </n-space>
                </n-list-item>
              </n-list>
            </div>
          </n-space>
        </n-card>

        <!-- Selección de cantidad -->
        <n-card size="small" title="Cantidad de combos">
          <n-space vertical>
            <n-text depth="3">
              Selecciona cuántos combos deseas agregar al pedido
            </n-text>
            <n-input-number v-model:value="quantity" :min="1" :max="99" :step="1" size="large" style="width: 100%;">
              <template #prefix>
                Cantidad:
              </template>
            </n-input-number>
          </n-space>
        </n-card>

        <!-- Resumen -->
        <n-card size="small" :bordered="false" style="background-color: #f0f9ff;">
          <n-space justify="space-between" align="center">
            <n-text class="fs-5">Total:</n-text>
            <n-text class="fs-3 fw-bold" type="success">
              S/. {{ formatPrice(totalPrice) }}
            </n-text>
          </n-space>
        </n-card>

        <!-- Selector de cliente (si está en modo cliente) -->
        <n-card v-if="shouldShowCustomerSelector" size="small" title="Asignar a cliente">
          <n-select v-model:value="selectedCustomerId" :options="customerOptions" placeholder="Seleccione un cliente"
            clearable />
        </n-card>
      </n-space>
    </n-spin>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('close')">Cancelar</n-button>
        <n-button type="primary" @click="handleAddCombo" :disabled="quantity <= 0">
          <template #icon>
            <v-icon name="md-add-round" />
          </template>
          Agregar al pedido
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useOrderStore } from '@/store/modules/order';
import { useSettingsStore } from '@/store/modules/settings';

const props = defineProps({
  combo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();

const quantity = ref(1);
const selectedCustomerId = inject('selectedCustomerId', ref(null));

// Inyectar funciones del componente padre si están disponibles
const addOrderToCustomer = inject('addOrderToCustomer', null);
const customers = inject('customers', ref([]));

const shouldShowCustomerSelector = computed(() =>
  customers.value.length > 0
);

const customerOptions = computed(() =>
  customers.value.map(customer => ({
    label: customer.name,
    value: customer.id
  }))
);

const totalPrice = computed(() => {
  const price = parseFloat(props.combo.price || 0);
  return price * quantity.value;
});

const formatPrice = (price) => {
  return parseFloat(price || 0).toFixed(2);
};

const handleAddCombo = () => {
  if (quantity.value <= 0) {
    window.$message?.error('La cantidad debe ser mayor a 0');
    return;
  }

  // Preparar el objeto del combo para agregar a la orden
  const comboOrder = {
    from_combo: true,  // Flag para identificar que es un combo
    combo_id: props.combo.id, // ID del Combo (plantilla)
    product_set_id: null, // Se genera al crear la orden
    name: props.combo.name,
    set_type: 'COMBO',
    // CORREGIDO: Usar el campo price directamente, que ya contiene el total desde el backend
    price: Number(props.combo.price || 0),
    quantity: quantity.value,
    pricing_mode: props.combo.pricing_mode || 'FIXED',
    fixed_price: props.combo.fixed_price || null,
    combo_category_id: props.combo.combo_category_id || props.combo.combo_category?.id || null,
    //CORRECCIÓN: AGREGAR EL PRICING_MODE, EL FIXED_PRICE Y EL COMBO_CATEGORY_ID
    items: (props.combo.products || []).map(comboProduct => ({
      combo_product_id: null,
      product_id: comboProduct.id,
      product_name: comboProduct.name,

      quantity: comboProduct.quantity,
      kardex_map: comboProduct.kardex_map || null,
      indication: ''
    }))
  };

  console.log('[ComboProductModal] comboOrder created:', {
    name: comboOrder.name,
    price: comboOrder.price,
    quantity: comboOrder.quantity,
    total: comboOrder.price * comboOrder.quantity,
    combo_source: props.combo
  });

  // Si está en modo cliente y hay un cliente seleccionado
  if (shouldShowCustomerSelector.value && selectedCustomerId.value && addOrderToCustomer) {
    addOrderToCustomer(comboOrder, selectedCustomerId.value);
  } else {
    // Agregar el combo al store usando el método existente o crear uno nuevo
    orderStore.addComboOrder(comboOrder);
  }

  window.$message?.success(`Combo "${props.combo.name}" agregado al pedido`);
  emit('close');
};
</script>

<style scoped>
.n-card {
  margin-bottom: 0;
}
</style>
