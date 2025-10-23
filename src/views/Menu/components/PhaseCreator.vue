<file name=src/views/Menu/components/PhaseProducts.vue>
<template>
  <div class="phase-products">
    <n-card :segmented="{ content: 'hard' }" :title="panelTitle">
      <n-space vertical>
        <div class="row between">
          <div class="label">Estado de la fase</div>
          <n-switch :value="phaseActive" :disabled="!phaseId" @update:value="toggleActive">
            <template #checked>Activo</template>
            <template #unchecked>Inactivo</template>
          </n-switch>
        </div>

        <n-auto-complete
          v-model:value="query"
          :options="options"
          :disabled="!phaseId"
          placeholder="Buscar un producto"
          clearable
          @update:value="onType"
          @select="onSelect"
        />

        <n-spin :show="loadingList">
          <div class="product-list">
            <div v-for="pp in productPhases" :key="pp.id" class="product-item">
              <div class="left">
                <div class="name">{{ pp.product?.name || pp.product_name || 'Producto' }}</div>
                <div class="sub">{{ pp.product?.category_name || pp.product?.measure_unit_name || '' }}</div>
              </div>
              <n-button text type="error" @click="remove(pp)">✕</n-button>
            </div>
            <div v-if="!loadingList && productPhases.length === 0" class="empty">No hay productos asignados.</div>
          </div>
        </n-spin>

        <n-button text @click="emit('rename-phase')">Editar nombre de fase</n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { getMenuProductPhases, createProductPhase, deleteProductPhase, updatePhase, retrieveMenu, getMenuPhases } from '@/api/modules/menu'
import { searchProductByName } from '@/api/modules/products'

const props = defineProps({
  menuId: { type: [String, Number], required: true },
  phaseId: { type: [String, Number, null], default: null },
})
const emit = defineEmits(['change', 'rename-phase'])

const message = useMessage()

const productPhases = ref([])
const loadingList = ref(false)
const query = ref('')
const options = ref([])
const phaseActive = ref(true)
const phaseName = ref('')

const panelTitle = computed(() => {
  return `Asigna productos a tus fases ${phaseName.value ? '"' + phaseName.value + '"' : ''}`
})

async function loadPhaseState() {
  if (!props.phaseId) return
  try {
    // buscar la fase seleccionada para conocer su estado y nombre
    const { data } = await getMenuPhases(props.menuId)
    const item = (Array.isArray(data) ? data : data.results || []).find(p => p.id === Number(props.phaseId))
    if (item) {
      phaseActive.value = !!item.active
      phaseName.value = item.name
    }
  } catch {}
}

async function loadProducts() {
  if (!props.phaseId) { productPhases.value = []; return }
  loadingList.value = true
  try {
    const { data } = await getMenuProductPhases(props.menuId, { phase: props.phaseId })
    productPhases.value = Array.isArray(data) ? data : (data.results || [])
  } catch (e) {
    console.error(e)
    message.error('No se pudo cargar productos de la fase')
  } finally {
    loadingList.value = false
  }
}

async function onType(val) {
  query.value = val
  if (!val || val.length < 2) { options.value = []; return }
  try {
    const { data } = await searchProductByName(val)
    const list = Array.isArray(data) ? data : (data.results || [])
    options.value = list.map(p => ({ label: p.name, value: String(p.id), raw: p }))
  } catch (e) { options.value = [] }
}

async function onSelect(value, option) {
  if (!props.phaseId) return
  try {
    await createProductPhase({ product: option.raw?.id || Number(value), phase: props.phaseId, stock: 0 })
    message.success('Producto asignado')
    query.value = ''
    options.value = []
    await loadProducts()
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo asignar el producto')
  }
}

async function remove(pp) {
  try {
    await deleteProductPhase(pp.id)
    message.success('Producto retirado de la fase')
    await loadProducts()
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo retirar el producto')
  }
}

async function toggleActive(val) {
  if (!props.phaseId) return
  try {
    await updatePhase(props.phaseId, { name: phaseName.value, menu: props.menuId, active: val })
    phaseActive.value = val
    emit('change')
  } catch (e) {
    console.error(e)
    message.error('No se pudo cambiar el estado de la fase')
  }
}

watch(() => props.phaseId, async () => {
  await loadPhaseState()
  await loadProducts()
}, { immediate: true })
</script>

<style scoped>
.phase-products .row { display: flex; align-items: center; gap: 8px; }
.phase-products .between { justify-content: space-between; }
.product-list { display: flex; flex-direction: column; gap: 10px; }
.product-item { display:flex; align-items:center; justify-content:space-between; border:1px solid #e5e7eb; border-radius:6px; padding:10px 12px; }
.product-item .name { font-weight:600; }
.product-item .sub { font-size:12px; color:#6b7280; }
.empty { color:#6b7280; font-size:13px; text-align:center; padding:8px; }
</style>
</file>

<file name=src/views/Menu/components/MenuCreateModal.vue>
<template>
  <n-modal v-model:show="show" preset="dialog" :style="{ width: '900px' }">
    <template #header>
      <h3>{{ modalTitle }}</h3>
    </template>
    <template #default>
      <div v-if="currentStep === 1">
        <!-- Step 1 content -->
      </div>
      <div v-else-if="currentStep === 2">
        <n-grid cols="1 s:1 m:2" x-gap="16">
          <n-gi>
            <PhaseCreator v-if="createdMenu?.id" v-model="selectedPhase" :menu-id="createdMenu.id" @change="emit('change')" />
          </n-gi>
          <n-gi>
            <PhaseProducts v-if="createdMenu?.id" :menu-id="createdMenu.id" :phase-id="selectedPhase" @change="emit('change')" />
          </n-gi>
        </n-grid>
      </div>
      <div v-else-if="currentStep === 3">
        <!-- Step 3 content -->
      </div>
    </template>
    <template #footer>
      <!-- Footer buttons -->
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import PhaseCreator from './PhaseCreator.vue'
import PhaseProducts from './PhaseProducts.vue'

const props = defineProps({
  show: Boolean,
  menu: Object,
  createdMenu: Object
})
const emit = defineEmits(['update:show', 'change'])

const currentStep = ref(1)
const selectedPhase = ref(null)
</script>
</file>