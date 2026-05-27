<template>
  <n-modal v-model:show="modalVisible" preset="card" :title="mode === 'create' ? 'Crear Combo' : 'Editar Combo'"
    :style="{ width: '90%', maxWidth: '1200px' }" :segmented="{ content: 'hard' }" @after-leave="handleAfterLeave">
    <n-spin :show="isLoading">
      <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="top"
        require-mark-placement="right-hanging">
        <n-tabs type="line" animated>
          <!-- Tab 1: Información del combo -->
          <n-tab-pane name="info" tab="Información del Combo">
            <n-grid :cols="24" :x-gap="16">
              <!-- Nombre -->
              <n-form-item-gi label="Nombre del combo" path="name" :span="12">
                <n-input v-model:value="formData.name" placeholder="Ej: Combo Familiar" maxlength="100" show-count
                  :disabled="isReadOnly" />
              </n-form-item-gi>

              <!-- Categoría con botones de crear/editar -->
              <n-form-item-gi :span="12" label="Categoría">
                <n-form-item v-if="categoryForm">
                  <n-input-group>
                    <n-input v-model:value="category.description" placeholder="Nombre de la categoría"
                      :disabled="isReadOnly || (category.id ? !canChangeComboCategory : !canAddComboCategory)" />
                    <n-button type="info" tertiary :disabled="isReadOnly ||
                      (category.id ? !canChangeComboCategory : !canAddComboCategory) ||
                      category.description === getCategoryDescription(category.id) ||
                      !category.description
                      " @click="
                        !category.id
                          ? performCreateCategory()
                          : performUpdateCategory()
                        ">
                      <v-icon name="md-save-round" />
                    </n-button>
                    <n-button type="error" tertiary @click="categoryForm = false">
                      <v-icon name="md-close-round" />
                    </n-button>
                  </n-input-group>
                </n-form-item>
                <n-form-item v-else path="category_id">
                  <n-input-group>
                    <n-button type="info" tertiary :disabled="isReadOnly || !canAddComboCategory" @click="
                      categoryForm = true;
                    category.id = null;
                    category.description = null;
                    ">
                      <v-icon name="md-add-round" />
                    </n-button>
                    <n-select v-model:value="formData.category_id" :options="categoryOptions"
                      placeholder="Seleccionar categoría" filterable clearable
                      :disabled="isReadOnly || !canViewComboCategory" />
                    <n-button v-if="formData.category_id" type="warning" tertiary
                      :disabled="isReadOnly || !canChangeComboCategory" @click="
                        categoryForm = true;
                      category.id = formData.category_id;
                      category.description = getCategoryDescription(formData.category_id);
                      ">
                      <v-icon name="ri-edit-fill" />
                    </n-button>
                  </n-input-group>
                </n-form-item>
              </n-form-item-gi>

              <!-- Modo de precio -->
              <n-form-item-gi label="Modo de precio" path="pricing_mode" :span="12">
                <n-radio-group v-model:value="formData.pricing_mode" :disabled="isReadOnly">
                  <n-space>
                    <n-radio value="FIXED">
                      <n-space align="center">
                        <v-icon name="md-monetizationon-round" scale="1.2" />
                        Precio Fijo
                      </n-space>
                    </n-radio>
                    <n-radio value="VARIABLE">
                      <n-space align="center">
                        <v-icon name="md-calculate-round" scale="1.2" />
                        Precio Variable (suma de items)
                      </n-space>
                    </n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item-gi>

              <!-- Precio fijo (solo si pricing_mode=FIXED) -->
              <n-form-item-gi v-if="formData.pricing_mode === 'FIXED'" label="Precio fijo" path="fixed_price"
                :span="12">
                <n-input-number v-model:value="formData.fixed_price" placeholder="0.00" :precision="2" :min="0"
                  :step="0.5" style="width: 100%" :disabled="isReadOnly">
                  <template #prefix>
                    S/
                  </template>
                </n-input-number>
              </n-form-item-gi>

              <!-- Precio calculado (si pricing_mode=VARIABLE) -->
              <n-form-item-gi v-if="formData.pricing_mode === 'VARIABLE'" label="Precio total (calculado)" :span="12">
                <n-input-number :value="computedPrice" placeholder="0.00" :precision="2" disabled style="width: 100%">
                  <template #prefix>
                    S/
                  </template>
                </n-input-number>
                <n-text depth="3" style="font-size: 12px; margin-top: 4px">
                  Calculado automáticamente según los items agregados
                </n-text>
              </n-form-item-gi>

              <!-- Imagen Upload -->
              <n-form-item-gi label="Imagen" :span="12">
                <n-upload ref="uploadRef" list-type="image-card" :max="1" accept="image/*" :default-upload="false"
                  :on-change="onImageChange" :file-list="imageFileList" :disabled="isReadOnly">
                  Subir imagen
                </n-upload>
              </n-form-item-gi>

              <!-- Vista previa de imagen existente -->
              <n-form-item-gi v-if="formData.image_url && !imageFileList.length" label="Vista previa" :span="12">
                <img :src="formData.image_url" alt="imagen combo"
                  style="max-width: 200px; max-height: 200px; border: 1px solid #eee; padding: 4px; border-radius: 4px;" />
              </n-form-item-gi>
            </n-grid>
          </n-tab-pane>

          <!-- Tab 2: Productos -->
          <n-tab-pane v-if="canViewComboProduct" name="products" tab="Productos del Combo">
            <n-space vertical size="large">
              <!-- Buscador de productos -->
              <n-card title="Agregar productos" size="small">
                <n-space vertical>
                  <n-input v-model:value="productSearch" placeholder="Buscar producto por nombre o código..." clearable
                    @input="handleProductSearch" :disabled="isReadOnly || !canAddComboProduct">
                    <template #prefix>
                      <v-icon name="md-search-round" />
                    </template>
                  </n-input>

                  <!-- Resultados de búsqueda -->
                  <n-list v-if="searchResults.length > 0" :hoverable="!isReadOnly && canAddComboProduct"
                    :clickable="!isReadOnly && canAddComboProduct" bordered>
                    <n-list-item v-for="product in searchResults" :key="product.id" @click="addProduct(product)">
                      <n-thing>
                        <template #header>
                          {{ product.name }}
                        </template>
                        <template #description>
                          <n-space>
                            <n-tag size="small" type="info">
                              Código: {{ product.code || 'N/A' }}
                            </n-tag>
                            <n-tag size="small" type="success">
                              Precio: S/ {{ parseFloat(product.prices || 0).toFixed(2) }}
                            </n-tag>
                          </n-space>
                        </template>
                        <template #action>
                          <n-button size="small" type="primary" :disabled="isReadOnly || !canAddComboProduct">
                            Agregar
                          </n-button>
                        </template>
                      </n-thing>
                    </n-list-item>
                  </n-list>
                  <n-empty v-else-if="productSearch && !isSearching" description="No se encontraron productos" />
                </n-space>
              </n-card>

              <!-- Lista de productos agregados -->
              <n-card title="Productos agregados" size="small">
                <n-alert v-if="formData.products.length === 0" type="warning" style="margin-bottom: 16px">
                  Debes agregar al menos 1 producto al combo
                </n-alert>

                <n-list v-if="formData.products.length > 0" bordered>
                  <n-list-item v-for="(item, index) in formData.products" :key="index">
                    <n-grid :cols="24" :x-gap="12" style="align-items: center">
                      <!-- Nombre del producto -->
                      <n-gi :span="6">
                        <n-text strong>{{ item.product_name }}</n-text>
                        <br>
                        <n-text depth="3" style="font-size: 12px">
                          ID: {{ item.product_id }}
                        </n-text>
                      </n-gi>

                      <!-- Cantidad -->
                      <n-gi :span="7">
                        <n-input-number v-model:value="item.quantity" :min="0.01" :precision="2" :step="0.5"
                          size="small" style="width: 100%" :disabled="isReadOnly || !canChangeComboProduct">
                          <template #prefix>
                            Cant:
                          </template>
                        </n-input-number>
                      </n-gi>

                      <!-- Precio unitario -->
                      <n-gi :span="4">
                        <n-text>
                          S/ {{ parseFloat(item.product_price || 0).toFixed(2) }}
                        </n-text>
                      </n-gi>

                      <!-- Acciones -->
                      <n-gi :span="3">
                        <n-space>
                          <n-button size="small" type="success" :disabled="isReadOnly || !canChangeComboProduct"
                            @click="openKardexModal(index)">
                            <template #icon>
                              <v-icon name="md-settings-round" scale="0.9" />
                            </template>
                            Configurar cambios
                          </n-button>
                        </n-space>
                      </n-gi>

                      <!-- Botón eliminar -->
                      <n-gi :span="4" style="text-align: right; margin-top: 8px">
                        <n-button size="small" type="error" quaternary :disabled="isReadOnly || !canDeleteComboProduct"
                          @click="removeProduct(index)">
                          <template #icon>
                            <v-icon name="md-delete-round" />
                          </template>
                          Eliminar
                        </n-button>
                      </n-gi>
                    </n-grid>
                  </n-list-item>
                </n-list>

                <n-empty v-else description="No hay productos agregados" />

                <!-- Resumen de items -->
                <n-divider v-if="formData.products.length > 0" />
                <n-space v-if="formData.products.length > 0" justify="space-between">
                  <n-text>Total de items: <n-text strong>{{ formData.products.length }}</n-text></n-text>
                  <n-text>Precio total: <n-text strong type="success">S/ {{ computedPrice.toFixed(2)
                      }}</n-text></n-text>
                </n-space>
              </n-card>
            </n-space>
          </n-tab-pane>

          <!-- Tab 3: Adicionales (opcional) -->
          <n-tab-pane name="extras" tab="Adicionales (Palabras clave)">
            <n-card size="small">
              <n-space vertical>
                <n-text>
                  Agrega palabras clave o adicionales que no tienen costo pero aparecerán en el pedido.
                </n-text>

                <n-dynamic-tags v-model:value="formData.extras" type="success" />

                <n-text depth="3" style="font-size: 12px">
                  Ejemplo: "Sin cebolla", "Extra salsa", "Papas fritas", etc.
                </n-text>
              </n-space>
            </n-card>
          </n-tab-pane>
        </n-tabs>
      </n-form>
    </n-spin>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">Cancelar</n-button>
        <n-button type="primary" :loading="isSaving" :disabled="isReadOnly" @click="handleSubmit">
          {{ mode === 'create' ? 'Crear Combo' : 'Guardar Cambios' }}
        </n-button>
      </n-space>
    </template>
    <!-- Modal Configurar Cambios (Kardex) -->
    <KardexConfigModal v-model:show="showKardexModal" :item="selectedItem" @update="handleKardexUpdate" />
  </n-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import { useMessage, NDynamicTags } from 'naive-ui'
import {
  getCombo,
  createCombo,
  updateCombo,
  getComboCategories,
  searchProducts,
  createComboCategory,
  updateComboCategory
} from '@/api/modules/products'
import KardexConfigModal from './KardexConfigModal.vue'
import { useUserStore } from '@/store/modules/user'
import { addIcons } from 'oh-vue-icons'
import {
  MdAddRound, MdCalculateRound, MdCloseRound, MdDeleteRound, MdMonetizationonRound, MdSaveRound, MdSearchRound, MdSettingsRound, RiEditFill
} from 'oh-vue-icons/icons'

addIcons(MdMonetizationonRound, MdCalculateRound, MdSearchRound, MdAddRound, RiEditFill, MdSaveRound, MdCloseRound, MdSettingsRound, MdDeleteRound)

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  comboId: {
    type: [Number, String],
    default: null
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value)
  }
})

const emit = defineEmits(['update:show', 'success'])

const message = useMessage()
const userStore = useUserStore()

const canAddCombo = computed(() => userStore.hasPermission('add_combo'))
const canChangeCombo = computed(() => userStore.hasPermission('change_combo'))
const canViewComboProduct = computed(() => userStore.hasPermission('view_comboproduct'))
const canAddComboProduct = computed(() => userStore.hasPermission('add_comboproduct'))
const canChangeComboProduct = computed(() => userStore.hasPermission('change_comboproduct'))
const canDeleteComboProduct = computed(() => userStore.hasPermission('delete_comboproduct'))
const canViewComboCategory = computed(() => userStore.hasPermission('view_combocategory'))
const canAddComboCategory = computed(() => userStore.hasPermission('add_combocategory'))
const canChangeComboCategory = computed(() => userStore.hasPermission('change_combocategory'))

const isReadOnly = computed(() => {
  if (props.mode === 'create') {
    return !canAddCombo.value
  }
  return !canChangeCombo.value
})

// Reactive state
const modalVisible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const formRef = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isSearching = ref(false)

const productSearch = ref('')
const searchResults = ref([])
const categoryOptions = ref([])

// Category form state
const categoryForm = ref(false)
const category = ref({
  id: null,
  description: null
})

// Image upload state
const uploadRef = ref(null)
const imageFileList = ref([])

const showKardexModal = ref(false)
const selectedItemIndex = ref(null)
const selectedItem = computed(() => {
  if (selectedItemIndex.value !== null && formData.products[selectedItemIndex.value]) {
    return formData.products[selectedItemIndex.value]
  }
  return null
})

const formData = reactive({
  name: '',
  pricing_mode: 'FIXED',
  fixed_price: null,
  category_id: null,
  image_url: '',
  image: null, // Nueva imagen a subir
  products: [],
  extras: []
})

const formRules = {
  name: [
    { required: true, message: 'El nombre es requerido', trigger: 'blur' },
    { min: 3, max: 100, message: 'El nombre debe tener entre 3 y 100 caracteres', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: 'La categoría es requerida', trigger: 'change', type: 'number' }
  ],
  pricing_mode: [
    { required: true, message: 'El modo de precio es requerido', trigger: 'change' }
  ],
  fixed_price: [
    {
      validator: (rule, value) => {
        if (formData.pricing_mode === 'FIXED') {
          if (!value || value <= 0) {
            return new Error('El precio fijo debe ser mayor a 0')
          }
        }
        return true
      },
      trigger: 'blur'
    }
  ]
}

// Computed
const computedPrice = computed(() => {
  if (formData.pricing_mode === 'FIXED') {
    return parseFloat(formData.fixed_price || 0)
  }

  // VARIABLE: sum of items
  return formData.products.reduce((sum, item) => {
    const price = parseFloat(item.product_price || 0)
    const qty = parseFloat(item.quantity || 0)
    return sum + (price * qty)
  }, 0)
})

// Helper functions
const getCategoryDescription = (categoryId) => {
  const cat = categoryOptions.value.find(c => c.value === categoryId)
  return cat ? cat.label : ''
}

const onImageChange = ({ file, fileList }) => {
  if (file?.file) {
    formData.image = file.file
  }
  imageFileList.value = fileList.slice(0, 1)
}

// Category management
const performCreateCategory = async () => {
  if (!canAddComboCategory.value) {
    message.error('No tienes permisos para crear categorías de combo')
    return
  }
  try {
    const response = await createComboCategory(category.value.description, false)
    if (response.status === 201) {
      message.success('Categoría de combo creada exitosamente')
      await loadCategories()
      // Seleccionar la nueva categoría
      const newCategory = categoryOptions.value.find(
        cat => cat.label.toUpperCase() === category.value.description.toUpperCase()
      )
      if (newCategory) {
        formData.category_id = newCategory.value
      }
      categoryForm.value = false
    }
  } catch (error) {
    console.error('Error creating combo category:', error)
    message.error('Error al crear categoría de combo: ' + (error.response?.data?.message || error.message))
  }
}

const performUpdateCategory = async () => {
  if (!canChangeComboCategory.value) {
    message.error('No tienes permisos para editar categorías de combo')
    return
  }
  try {
    const response = await updateComboCategory(
      category.value.id,
      category.value.description,
      false
    )
    if (response.status === 200 || response.status === 202) {
      message.success('Categoría de combo actualizada exitosamente')
      await loadCategories()
      categoryForm.value = false
    }
  } catch (error) {
    console.error('Error updating combo category:', error)
    message.error('Error al actualizar categoría de combo: ' + (error.response?.data?.message || error.message))
  }
}

// Methods
const { debounced: fetchProducts, cancel: cancelFetchProducts } = useDebounce(async (term) => {
  isSearching.value = true
  try {
    const response = await searchProducts({
      search: term,
      product_type: 'NORMAL', // Only normal products for combo items
      limit: 10
    })
    searchResults.value = response.data.results || response.data
  } catch (error) {
    console.error('Error searching products:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}, 300)

const handleProductSearch = () => {
  if (isReadOnly.value || !canAddComboProduct.value) {
    return
  }
  if (!productSearch.value || productSearch.value.length < 2) {
    cancelFetchProducts()
    searchResults.value = []
    isSearching.value = false
    return
  }
  fetchProducts(productSearch.value)
}

const addProduct = (product) => {
  if (isReadOnly.value || !canAddComboProduct.value) {
    message.error('No tienes permisos para agregar productos al combo')
    return
  }
  // Check if product already added
  const exists = formData.products.some(item => item.product_id === product.id)
  if (exists) {
    message.warning('Este producto ya está agregado')
    return
  }

  formData.products.push({
    product_id: product.id,
    product_name: product.name,
    product_price: product.prices,
    quantity: 1,
    kardex_map: null,
    indication: ''
  })

  // Clear search
  productSearch.value = ''
  searchResults.value = []

  message.success('Producto agregado')
}

const removeProduct = (index) => {
  if (isReadOnly.value || !canDeleteComboProduct.value) {
    message.error('No tienes permisos para eliminar productos del combo')
    return
  }
  formData.products.splice(index, 1)
}

const openKardexModal = (index) => {
  if (isReadOnly.value || !canChangeComboProduct.value) {
    message.error('No tienes permisos para editar productos del combo')
    return
  }
  selectedItemIndex.value = index
  showKardexModal.value = true
}

const handleKardexUpdate = (updatedKardexMap) => {
  if (isReadOnly.value || !canChangeComboProduct.value) {
    message.error('No tienes permisos para editar productos del combo')
    showKardexModal.value = false
    return
  }
  if (selectedItemIndex.value !== null) {
    formData.products[selectedItemIndex.value].kardex_map = updatedKardexMap
    message.success('Configuración de kardex actualizada')
  }
  showKardexModal.value = false
}

const handleCancel = () => {
  modalVisible.value = false
}

const handleSubmit = async () => {
  try {
    if (props.mode === 'create' && !canAddCombo.value) {
      message.error('No tienes permisos para crear combos')
      return
    }
    if (props.mode === 'edit' && !canChangeCombo.value) {
      message.error('No tienes permisos para editar combos')
      return
    }

    await formRef.value?.validate()

    // Validate items
    if (formData.products.length === 0) {
      message.error('Debes agregar al menos 1 producto')
      return
    }

    isSaving.value = true

    const payload = {
      name: formData.name,
      set_type: 'COMBO',
      pricing_mode: formData.pricing_mode,
      combo_category_id: formData.category_id,  // Usar combo_category_id
      image_url: formData.image_url || null,
      image: formData.image, // Agregar imagen si existe
      products: formData.products.map(item => {
        // Asegurar que product_id siempre esté presente
        if (!item.product_id) {
          console.error('Item sin product_id:', item)
          throw new Error(`Producto sin ID: ${item.product_name || 'Desconocido'}`)
        }
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          kardex_map: item.kardex_map,
          indication: item.indication || ''
        }
      }),
    }

    if (formData.pricing_mode === 'FIXED') {
      payload.fixed_price = formData.fixed_price
    }

    let response
    if (props.mode === 'create') {
      response = await createCombo(payload)
      message.success('Combo creado exitosamente')
    } else {
      response = await updateCombo(props.comboId, payload)
      message.success('Combo actualizado exitosamente')
    }

    emit('success', response.data)
    modalVisible.value = false
  } catch (error) {
    if (error?.message?.includes('validate')) {
      message.error('Por favor completa todos los campos requeridos')
    } else {
      let errorMsg = error.message;
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (typeof error.response.data === 'object') {
          // Flatten DRF error dictionary
          const errors = [];
          for (const key in error.response.data) {
            errors.push(`${key}: ${error.response.data[key]}`);
          }
          errorMsg = errors.join(', ');
        }
      }
      message.error('Error al guardar: ' + errorMsg);
    }
  } finally {
    isSaving.value = false
  }
}

const handleAfterLeave = () => {
  // Reset form
  Object.assign(formData, {
    name: '',
    pricing_mode: 'FIXED',
    fixed_price: null,
    category_id: null,
    image_url: '',
    image: null,
    products: [],
    extras: []
  })
  productSearch.value = ''
  searchResults.value = []
  selectedItemIndex.value = null
  imageFileList.value = []
  categoryForm.value = false
}

const loadComboData = async () => {
  if (!props.comboId || props.mode !== 'edit') return

  isLoading.value = true
  try {
    const response = await getCombo(props.comboId)
    const combo = response.data

    Object.assign(formData, {
      name: combo.name,
      pricing_mode: combo.pricing_mode,
      fixed_price: Number(combo.fixed_price) || null,
      // Usar combo_category del serializer
      category_id: combo.category.id,
      image_url: combo.image || '',
      image: null, // Limpiar selección de nueva imagen
      products: (combo.products).map(item => {
        return {
          product_id: item.id,
          product_name: item.name,
          product_price: item.unit_price || 0,
          quantity: parseFloat(item.quantity) || 0,
          kardex_map: item.kardex_map || null,
          indication: item.indication || ''
        }
      }),
      extras: combo.extras || []
    })

    // Limpiar lista de archivos de imagen
    imageFileList.value = []
  } catch (error) {
    message.error('Error al cargar combo: ' + (error.response?.data?.message || error.message))
  } finally {
    isLoading.value = false
  }
}

const loadCategories = async () => {
  if (!canViewComboCategory.value) {
    categoryOptions.value = []
    return
  }
  try {
    const response = await getComboCategories({ active_only: true })
    const categories = response.data.results || response.data
    categoryOptions.value = categories.map(cat => ({
      label: cat.description || cat.name,
      value: cat.id
    }))
  } catch (error) {
    console.error('Error loading combo categories:', error)
    message.error('Error al cargar las categorías de combos')
  }
}

// Watchers
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadCategories()
    if (props.mode === 'edit' && props.comboId) {
      loadComboData()
    }
  }
})
</script>

<style scoped>
:deep(.n-tabs-nav) {
  margin-bottom: 24px;
}

:deep(.n-list-item) {
  cursor: pointer;
}

:deep(.n-list-item:hover) {
  background-color: rgba(24, 160, 88, 0.08);
}

.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}
</style>
