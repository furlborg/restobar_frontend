<template>
  <n-modal v-model:show="modalVisible" preset="card" title="Configurar Cambios - Kardex"
    :style="{ width: '90%', maxWidth: '800px' }" :segmented="{ content: 'hard' }">
    <n-spin :show="isLoading">
      <n-space vertical size="large">
        <!-- Información del item -->
        <n-alert type="info" :bordered="false">
          <template #header>
            Producto: <strong>{{ item?.product_name }}</strong>
          </template>
          <n-text>
            Cantidad en el combo: <strong>{{ item?.quantity }}</strong>
          </n-text>
          <br>
          <n-text depth="3" style="font-size: 13px; margin-top: 8px">
            Por defecto, se descontará del inventario del mismo producto.
            Aquí puedes configurar un producto alternativo si deseas que el descuento se haga de otro producto.
          </n-text>
        </n-alert>

        <!-- Toggle para usar kardex personalizado -->
        <n-card size="small" title="Configuración de Kardex">
          <n-space vertical>
            <n-checkbox v-model:checked="useCustomKardex">
              Usar producto personalizado para descuento de inventario
            </n-checkbox>

            <!-- Si no usa kardex personalizado -->
            <n-alert v-if="!useCustomKardex" type="success">
              Se descontará automáticamente:
              <br>
              <strong>{{ item?.quantity }}</strong> unidades del producto
              <strong>{{ item?.product_name }}</strong> (ID: {{ item?.product_id }})
            </n-alert>

            <!-- Si usa kardex personalizado -->
            <div v-if="useCustomKardex">
              <n-divider />

              <!-- Buscador de producto -->
              <n-form-item label="Buscar producto para descontar">
                <n-input v-model:value="productSearch" placeholder="Buscar producto alternativo..." clearable
                  @input="handleProductSearch">
                  <template #prefix>
                    <v-icon name="md-search-round" />
                  </template>
                </n-input>
              </n-form-item>

              <!-- Resultados de búsqueda -->
              <n-list v-if="searchResults.length > 0" hoverable clickable bordered size="small">
                <n-list-item v-for="product in searchResults" :key="product.id" @click="selectProduct(product)">
                  <n-thing>
                    <template #header>
                      {{ product.name }}
                    </template>
                    <template #description>
                      <n-space size="small">
                        <n-tag size="tiny" type="info">
                          ID: {{ product.id }}
                        </n-tag>
                        <n-tag size="tiny" type="success">
                          Precio: S/ {{ parseFloat(product.prices || 0).toFixed(2) }}
                        </n-tag>
                      </n-space>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>

              <!-- Producto seleccionado -->
              <n-card v-if="selectedProduct" size="small" style="margin-top: 16px">
                <template #header>
                  <n-space justify="space-between" align="center">
                    <span>Producto seleccionado para descuento</span>
                    <n-button size="small" quaternary type="error" @click="clearSelection">
                      <template #icon>
                        <v-icon name="md-close-round" />
                      </template>
                      Quitar
                    </n-button>
                  </n-space>
                </template>

                <n-space vertical>
                  <n-text>
                    <strong>{{ selectedProduct.name }}</strong>
                  </n-text>
                  <n-text depth="3">
                    ID: {{ selectedProduct.id }}
                  </n-text>

                  <!-- Cantidad a descontar -->
                  <n-form-item label="Cantidad a descontar del inventario">
                    <n-input-number v-model:value="kardexQuantity" :min="0.01" :precision="4" :step="0.1"
                      style="width: 100%">
                      <template #prefix>
                        Cant:
                      </template>
                    </n-input-number>
                  </n-form-item>

                  <n-alert type="warning" :bordered="false">
                    Al vender este combo, se descontarán <strong>{{ kardexQuantity }}</strong> unidades
                    del producto <strong>{{ selectedProduct.name }}</strong>
                  </n-alert>
                </n-space>
              </n-card>
            </div>
          </n-space>
        </n-card>

        <!-- Preview del kardex -->
        <n-card v-if="kardexPreview" size="small" title="Vista previa" type="success">
          <n-descriptions :column="1" size="small">
            <n-descriptions-item label="Producto a descontar">
              {{ kardexPreview.product_name }}
            </n-descriptions-item>
            <n-descriptions-item label="ID del producto">
              {{ kardexPreview.product_id }}
            </n-descriptions-item>
            <n-descriptions-item label="Cantidad">
              {{ kardexPreview.qty }}
            </n-descriptions-item>
            <n-descriptions-item label="Customizado">
              <n-tag :type="kardexPreview.is_customized ? 'warning' : 'success'" size="small">
                {{ kardexPreview.is_customized ? 'Sí (personalizado)' : 'No (automático)' }}
              </n-tag>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-space>
    </n-spin>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">Cancelar</n-button>
        <n-button type="primary" @click="handleSave">
          Guardar Configuración
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import { searchProducts, getProductById } from '@/api/modules/products'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'update'])

// Reactive state
const modalVisible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const isLoading = ref(false)
const useCustomKardex = ref(false)
const productSearch = ref('')
const searchResults = ref([])
const selectedProduct = ref(null)
const kardexQuantity = ref(1)

// Computed
const kardexPreview = computed(() => {
  if (!props.item) return null

  if (useCustomKardex.value && selectedProduct.value) {
    return {
      product_id: selectedProduct.value.id,
      product_name: selectedProduct.value.name,
      qty: kardexQuantity.value,
      is_customized: true
    }
  }

  return {
    product_id: props.item.product_id,
    product_name: props.item.product_name,
    qty: props.item.quantity,
    is_customized: false
  }
})

// Methods
const { debounced: fetchProducts, cancel: cancelFetchProducts } = useDebounce(async (term) => {
  isLoading.value = true
  try {
    const response = await searchProducts({
      search: term,
      product_type: 'NORMAL',
      limit: 10
    })
    searchResults.value = response.data.results || response.data
  } catch (error) {
    console.error('Error searching products:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}, 300)

const handleProductSearch = () => {
  if (!productSearch.value || productSearch.value.length < 2) {
    cancelFetchProducts()
    searchResults.value = []
    isLoading.value = false
    return
  }
  fetchProducts(productSearch.value)
}

const selectProduct = (product) => {
  selectedProduct.value = product
  kardexQuantity.value = props.item?.quantity || 1
  productSearch.value = ''
  searchResults.value = []
}

const clearSelection = () => {
  selectedProduct.value = null
  kardexQuantity.value = 1
}

const handleCancel = () => {
  modalVisible.value = false
}

const handleSave = () => {
  let kardexMap = null

  if (useCustomKardex.value && selectedProduct.value) {
    kardexMap = {
      product_id: selectedProduct.value.id,
      qty: kardexQuantity.value
    }
  }

  emit('update', kardexMap)
  modalVisible.value = false
}

// Watchers
watch(() => props.show, (newVal) => {
  if (newVal && props.item) {
    // Reset state
    productSearch.value = ''
    searchResults.value = []
    selectedProduct.value = null
    kardexQuantity.value = props.item.quantity || 1

    // Check if has custom kardex_map
    if (props.item.kardex_map) {
      useCustomKardex.value = true
      // Optionally load the product details
      loadProductById(props.item.kardex_map.product_id)
      kardexQuantity.value = props.item.kardex_map.qty || props.item.quantity
    } else {
      useCustomKardex.value = false
    }
  }
})

watch(useCustomKardex, (newVal) => {
  if (!newVal) {
    clearSelection()
  }
})

const loadProductById = async (productId) => {
  try {
    const response = await getProductById(productId)
    selectedProduct.value = response.data
  } catch (error) {
    console.error('Error loading product:', error)
  }
}
</script>

<style scoped>
:deep(.n-list-item) {
  cursor: pointer;
}

:deep(.n-list-item:hover) {
  background-color: rgba(24, 160, 88, 0.08);
}
</style>
