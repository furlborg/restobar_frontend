<template>
  <n-modal
    v-model:show="showLocal"
    preset="card"
    :mask-closable="false"
    :style="{ width: '1100px', maxWidth: '95vw' }"
    title="Crear menú"
  >
    <n-steps :current="currentStep" size="small" class="mb-3">
      <n-step title="Información" description="Nombre, precio y estado" />
      <n-step title="Fases" description="Asigna productos a tus fases" />
      <n-step title="Confirmación" />
    </n-steps>

    <div v-if="currentStep === 1">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-card :segmented="{ content: 'soft' }" title="Información del menú">
          <n-grid cols="1 s:1 m:2 l:2 xl:2" x-gap="16">
            <n-form-item-gi :span="2" label="Nombre del menú" path="name">
              <n-input v-model:value="form.name" placeholder="Nombre Menú" :disabled="isReadOnly" />
            </n-form-item-gi>
            <n-form-item-gi :span="2" label="Precio del menú" path="price">
              <n-input-number v-model:value="form.price" :min="0" :precision="2" placeholder="0.00" :disabled="isReadOnly">
                <template #prefix>S/</template>
              </n-input-number>
            </n-form-item-gi>
            <n-form-item-gi :span="2" label="Estado del menú" path="active">
              <n-switch v-model:value="form.active" :disabled="isReadOnly">
                <template #checked>Activo</template>
                <template #unchecked>Inactivo</template>
              </n-switch>
            </n-form-item-gi>
          </n-grid>
        </n-card>
      </n-form>
    </div>

    <div v-else-if="currentStep === 2">
      <n-alert v-if="!canViewPhase" type="warning" :bordered="false" style="margin-bottom: 12px;">
        No tienes permisos para ver las fases del menú.
      </n-alert>
      <n-grid v-else cols="2 s:2 m:2 l:2 xl:2" x-gap="16">
        <!-- Columna izquierda: fases -->
        <n-gi>
          <n-card :segmented="{ content: 'hard' }" title="Crea fases a tu menú">
            <div class="toolbar">
              <n-input v-model:value="phaseSearch" clearable placeholder="Buscar fases de menú" :disabled="!canViewPhase" />
              <n-button type="info" secondary circle :disabled="isReadOnly || !canAddPhase" @click="openNewPhase">+</n-button>
            </div>

            <n-spin :show="loadingPhases">
              <div class="phase-list">
                <div
                  v-for="p in filteredPhases"
                  :key="p.id"
                  class="phase-item"
                  :class="{ active: selectedPhaseId === p.id }"
                  @click="selectPhase(p)"
                >
                  <div class="left">
                    <div class="title">{{ p.name }}</div>
                    <div class="sub"><i class="i-basket"/> {{ p.products_count || 0 }} productos</div>
                  </div>
                  <div class="chev">›</div>
                </div>
                <div v-if="!loadingPhases && filteredPhases.length === 0" class="empty">Aún no hay fases.</div>
              </div>
            </n-spin>
          </n-card>
        </n-gi>

        <!-- Columna derecha: productos de la fase seleccionada -->
        <n-gi>
          <n-card :segmented="{ content: 'hard' }" :title="assignPanelTitle">
            <n-alert v-if="!canViewProductPhase" type="warning" :bordered="false" style="margin-bottom: 12px;">
              No tienes permisos para ver los productos de la fase.
            </n-alert>
            <div class="row between">
              <div class="label">Estado de la fase</div>
              <n-switch
                :value="phaseActive"
                :disabled="!selectedPhaseId || isReadOnly || !canChangePhase"
                @update:value="togglePhaseActive"
              >
                <template #checked>Activo</template>
                <template #unchecked>Inactivo</template>
              </n-switch>
            </div>

            <div class="row search">
              <n-auto-complete
                v-model:value="productQuery"
                :options="productOptions"
                :disabled="!selectedPhaseId || isReadOnly || !canViewProductPhase || !canAddProductPhase"
                placeholder="Buscar un producto"
                clearable
                @update:value="onTypeProduct"
                @select="onSelectProduct"
              />
              <n-button quaternary circle :disabled="!selectedPhaseId || isReadOnly || !canViewProductPhase || !canAddProductPhase">></n-button>
            </div>

            <n-spin :show="loadingPhaseProducts">
              <div class="pp-list">
                <div v-for="pp in phaseProducts" :key="pp.id" class="pp-item">
                  <div class="left">
                    <div class="name">{{ pp.product?.name || pp.product_name }}</div>
                    <div class="sub">{{ pp.product?.category_name || pp.product?.measure_unit_name || '' }}</div>
                  </div>
                  <n-button text type="error" :disabled="isReadOnly || !canDeleteProductPhase" @click="removeProduct(pp)">✕</n-button>
                </div>
                <div v-if="!loadingPhaseProducts && phaseProducts.length === 0" class="empty">No hay productos asignados.</div>
              </div>
            </n-spin>

            <div class="rename">
              <n-button text :disabled="!selectedPhaseId || isReadOnly || !canChangePhase" @click="openRename">✎ Editar nombre de fase</n-button>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- Modal: Nueva fase -->
      <n-modal v-model:show="showNewPhase" preset="dialog" title="Nueva fase">
        <n-input v-model:value="newPhaseName" placeholder="Nombre de fase (ej. ENTRADA)" @keyup.enter="createPhaseHandler" />
        <template #action>
          <n-space>
            <n-button tertiary @click="showNewPhase = false">Cancelar</n-button>
            <n-button type="info" :loading="creatingPhase" :disabled="isReadOnly || !canAddPhase" @click="createPhaseHandler">Crear</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- Modal: Renombrar fase -->
      <n-modal v-model:show="showRename" preset="dialog" title="Editar nombre de fase">
        <n-input v-model:value="renameValue" placeholder="Nombre de fase" @keyup.enter="renamePhase" />
        <template #action>
          <n-space>
            <n-button tertiary @click="showRename = false">Cancelar</n-button>
            <n-button type="info" :loading="renaming" :disabled="isReadOnly || !canChangePhase" @click="renamePhase">Guardar</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>

    <!-- PASO 3: CONFIRM -->
    <div v-else>
      <n-result status="success" title="¡Listo!" description="El menú fue creado. Puedes seguir configurándolo en la edición." />
    </div>

    <template #action>
      <n-space justify="space-between" style="width:100%">
        <div />
        <n-space>
          <n-button tertiary @click="onCancel">Cancelar</n-button>
          <n-button v-if="currentStep > 1" @click="prevStep">Volver</n-button>
          <n-button v-if="currentStep === 1" type="info" :loading="submitting" :disabled="isReadOnly" @click="submitStep1">Siguiente</n-button>
          <n-button v-else-if="currentStep === 2" type="info" @click="nextStep">Finalizar</n-button>
          <n-button v-else type="info" @click="finish">Cerrar</n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import { useMessage } from 'naive-ui'
import { createMenu, updateMenu, retrieveMenu, getMenuPhases, createPhase, updatePhase, getMenuProductPhases, createProductPhase, deleteProductPhase } from '@/api/modules/menu'
import { searchProductByName } from '@/api/modules/products'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  show: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  menuId: { type: [String, Number, null], default: null }
})
const emit = defineEmits(['update:show', 'success', 'cancel', 'change'])

const message = useMessage()
const userStore = useUserStore()

const canAddMenu = computed(() => userStore.hasPermission('add_menu'))
const canChangeMenu = computed(() => userStore.hasPermission('change_menu'))
const canViewPhase = computed(() => userStore.hasPermission('view_fasemenu'))
const canAddPhase = computed(() => userStore.hasPermission('add_fasemenu'))
const canChangePhase = computed(() => userStore.hasPermission('change_fasemenu'))
const canViewProductPhase = computed(() => userStore.hasPermission('view_productphase'))
const canAddProductPhase = computed(() => userStore.hasPermission('add_productphase'))
const canDeleteProductPhase = computed(() => userStore.hasPermission('delete_productphase'))

const isReadOnly = computed(() => {
  if (props.mode === 'create') {
    return !canAddMenu.value
  }
  return !canChangeMenu.value
})

const showLocal = ref(props.show)
watch(() => props.show, v => showLocal.value = v)
watch(showLocal, async (v) => {
  emit('update:show', v)
  if (v && props.mode === 'edit' && props.menuId) {
    await loadMenuForEdit(props.menuId)
  }
})

// paso 1
const formRef = ref(null)
const submitting = ref(false)
const form = ref({ name: '', price: 0, active: true })
const currentStep = ref(1)
const createdMenu = ref(null)

const rules = {
  name: { required: true, message: 'El nombre es obligatorio', trigger: 'blur' },
  price: { type: 'number', required: true, message: 'El precio es obligatorio', trigger: 'blur' }
}

async function loadMenuForEdit(id) {
  try {
    const { data } = await retrieveMenu(id)
    createdMenu.value = data
    form.value.name = data.name
    form.value.price = Number(data.price ?? 0)
    form.value.active = !!data.active
    currentStep.value = 1
    await loadPhases()
  } catch (e) {
    console.error(e)
    message.error('No se pudo cargar el menú para editar')
  }
}

// paso 2 - fases
const phases = ref([])
const loadingPhases = ref(false)
const phaseSearch = ref('')
const selectedPhaseId = ref(null)

const filteredPhases = computed(() => {
  const q = (phaseSearch.value || '').toLowerCase().trim()
  if (!q) return phases.value
  return phases.value.filter(p => (p.name || '').toLowerCase().includes(q))
})

async function loadPhases() {
  if (!createdMenu.value?.id || !canViewPhase.value) {
    phases.value = []
    selectedPhaseId.value = null
    return
  }
  loadingPhases.value = true
  try {
    const { data } = await getMenuPhases(createdMenu.value.id)
    phases.value = Array.isArray(data) ? data : (data.results || [])
    // Para cada fase, obtener y setear la cantidad de productos
    for (const phase of phases.value) {
      try {
        const { data: products } = await getMenuProductPhases(createdMenu.value.id, { phase: phase.id })
        phase.products_count = Array.isArray(products) ? products.length : (products.results ? products.results.length : 0)
      } catch (e) {
        phase.products_count = 0
      }
    }
    // si no hay selección, toma la primera
    if (!selectedPhaseId.value && phases.value.length) selectedPhaseId.value = phases.value[0].id
  } catch (e) {
    console.error(e)
    message.error('No se pudo cargar las fases')
  } finally {
    loadingPhases.value = false
  }
}

// crear fase
const showNewPhase = ref(false)
const newPhaseName = ref('')
const creatingPhase = ref(false)
function openNewPhase() {
  if (isReadOnly.value || !canAddPhase.value) {
    message.error('No tienes permisos para crear fases')
    return
  }
  newPhaseName.value = ''
  showNewPhase.value = true
}
async function createPhaseHandler() {
  if (isReadOnly.value || !canAddPhase.value) {
    message.error('No tienes permisos para crear fases')
    return
  }
  const name = (newPhaseName.value || '').trim()
  if (!name) return message.warning('Ingresa un nombre de fase')
  try {
    creatingPhase.value = true
    await createPhase({ name, menu: createdMenu.value.id, active: true })
    message.success('Fase creada')
    showNewPhase.value = false
    await loadPhases()
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo crear la fase')
  } finally {
    creatingPhase.value = false
  }
}

function selectPhase(p) {
  selectedPhaseId.value = p.id
  phaseName.value = p.name
  phaseActive.value = !!p.active
  loadPhaseProducts()
}

// derecha - productos por fase
const phaseProducts = ref([])
const loadingPhaseProducts = ref(false)
const phaseName = ref('')
const phaseActive = ref(true)

const assignPanelTitle = computed(() => `Asigna productos a tus fases ${phaseName.value ? '"' + phaseName.value + '"' : ''}`)

async function loadPhaseProducts() {
  if (!selectedPhaseId.value || !canViewProductPhase.value) {
    phaseProducts.value = []
    return
  }
  loadingPhaseProducts.value = true
  try {
    const { data } = await getMenuProductPhases(createdMenu.value.id, { phase: selectedPhaseId.value })
    phaseProducts.value = Array.isArray(data) ? data : (data.results || [])
  } catch (e) {
    console.error(e)
    message.error('No se pudo cargar los productos de la fase')
  } finally {
    loadingPhaseProducts.value = false
  }
}

async function togglePhaseActive(val) {
  if (!selectedPhaseId.value) return
  if (isReadOnly.value || !canChangePhase.value) {
    message.error('No tienes permisos para editar fases')
    return
  }
  try {
    await updatePhase(selectedPhaseId.value, { name: phaseName.value, menu: createdMenu.value.id, active: val })
    phaseActive.value = val
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo cambiar el estado de la fase')
  }
}

// búsqueda / asignación de productos
const productQuery = ref('')
const productOptions = ref([])
const { debounced: fetchProducts, cancel: cancelFetchProducts } = useDebounce(async (val) => {
  try {
    const { data } = await searchProductByName(val)
    const list = Array.isArray(data) ? data : (data.results || [])
    productOptions.value = list.map(p => ({ label: p.name, value: String(p.id), raw: p }))
  } catch {
    productOptions.value = []
  }
}, 300)

function onTypeProduct(val) {
  if (isReadOnly.value || !canViewProductPhase.value || !canAddProductPhase.value) {
    return
  }
  productQuery.value = val
  if (!val || val.length < 2) {
    cancelFetchProducts()
    productOptions.value = []
    return
  }
  fetchProducts(val)
}
async function onSelectProduct(value, option) {
  if (!selectedPhaseId.value) return
  if (isReadOnly.value || !canViewProductPhase.value || !canAddProductPhase.value) {
    message.error('No tienes permisos para agregar productos a la fase')
    return
  }
  try {
    await createProductPhase({ product: Number(value), phase: selectedPhaseId.value, stock: 0 })
    message.success('Producto asignado')
    productQuery.value = ''
    productOptions.value = []
    await loadPhaseProducts()
   // incremento local inmediato
    const phase = phases.value.find(p => p.id === selectedPhaseId.value)
    if (phase) phase.products_count = (phase.products_count || 0) + 1
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo asignar el producto')
  }
}

async function removeProduct(pp) {
  if (isReadOnly.value || !canDeleteProductPhase.value) {
    message.error('No tienes permisos para eliminar productos de la fase')
    return
  }
  try {
    await deleteProductPhase(pp.id)
    message.success('Producto retirado')
    await loadPhaseProducts()
    // decremento local inmediato
    const phase = phases.value.find(p => p.id === selectedPhaseId.value)
    if (phase && phase.products_count > 0) phase.products_count -= 1
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo retirar el producto')
  }
}

// renombrar fase
const showRename = ref(false)
const renameValue = ref('')
const renaming = ref(false)
function openRename() {
  if (!selectedPhaseId.value) return
  if (isReadOnly.value || !canChangePhase.value) {
    message.error('No tienes permisos para editar fases')
    return
  }
  renameValue.value = phaseName.value
  showRename.value = true
}
async function renamePhase() {
  if (!selectedPhaseId.value) return
  if (isReadOnly.value || !canChangePhase.value) {
    message.error('No tienes permisos para editar fases')
    return
  }
  const name = (renameValue.value || '').trim()
  if (!name) return
  try {
    renaming.value = true
    await updatePhase(selectedPhaseId.value, { name, menu: createdMenu.value.id, active: phaseActive.value })
    phaseName.value = name
    showRename.value = false
    await loadPhases()
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo renombrar la fase')
  } finally {
    renaming.value = false
  }
}

function resetAll() {
  form.value = { name: '', price: 0, active: true }
  currentStep.value = 1
  createdMenu.value = null
  phases.value = []
  selectedPhaseId.value = null
  phaseProducts.value = []
}

function onCancel() {
  resetAll()
  emit('cancel')
  showLocal.value = false
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value -= 1
}

function nextStep() { currentStep.value = 3 }

function finish() {
  emit('success', createdMenu.value)
  resetAll()
  showLocal.value = false
}

function submitStep1() {
  if (props.mode === 'create' && !canAddMenu.value) {
    message.error('No tienes permisos para crear menús')
    return
  }
  if (props.mode === 'edit' && !canChangeMenu.value) {
    message.error('No tienes permisos para editar menús')
    return
  }
  formRef.value?.validate(async (errors) => {
    if (errors) return
    try {
      submitting.value = true
      if (props.mode === 'edit' && (props.menuId || createdMenu.value?.id)) {
        const id = props.menuId || createdMenu.value.id
        const { data } = await updateMenu(id, form.value)
        createdMenu.value = data
        message.success('Menú actualizado')
      } else {
        const { data } = await createMenu(form.value)
        createdMenu.value = data
        message.success('Menú creado')
      }
      currentStep.value = 2
      await loadPhases()
    } catch (e) {
      console.error(e)
      message.error('No se pudo crear el menú')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.mb-3{ margin-bottom: 12px; }
.toolbar{ display:flex; gap:8px; align-items:center; margin-bottom:12px; }
.phase-list{ display:flex; flex-direction:column; gap:8px; }
.phase-item{ border:1px solid #e5e7eb; border-radius:6px; padding:12px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
.phase-item.active{ outline:2px solid #4098fc33; background:#ecf5ff; }
.phase-item .title{ font-weight:700; letter-spacing:.2px; }
.phase-item .sub{ font-size:12px; color:#6b7280; margin-top:2px; }
.phase-item .chev{ color:#9aa0a6; font-size:18px; }
.row{ display:flex; align-items:center; gap:8px; }
.row.between{ justify-content:space-between; }
.row.search{ margin:12px 0; }
.pp-list{ display:flex; flex-direction:column; gap:10px; }
.pp-item{ border:1px solid #e5e7eb; border-radius:6px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; }
.pp-item .name{ font-weight:600; }
.pp-item .sub{ font-size:12px; color:#6b7280; }
.rename{ margin-top:10px; display:flex; justify-content:flex-end; }
.empty{ color:#6b7280; font-size:13px; text-align:center; padding:8px; }
</style>
