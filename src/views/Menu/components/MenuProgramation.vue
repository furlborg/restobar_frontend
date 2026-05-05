<template>
  <n-modal v-model:show="localShow" preset="card" style="width: 90vw; max-width: 1400px">
    <template #header>Programar Menú</template>
    <n-alert v-if="!canViewProductPhaseAvailableDay || !canViewProductPhase" type="warning" :bordered="false"
      style="margin-bottom: 12px;">
      No tienes permisos para ver la programación semanal de fases de producto.
    </n-alert>
    <n-grid cols="12" x-gap="12">
      <n-gi :span="4">
        <div>
          <h3>Productos asignados a tu menú</h3>
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-input v-model:value="search" placeholder="Buscar producto" class="mb-1" />
            </n-gi>
            <n-gi>
              <n-select v-model:value="selectedPhase" :options="phaseOptions" class="mb-1" />
            </n-gi>
          </n-grid>
          <div class="product-list-scroll">
            <n-list bordered>
              <n-list-item v-for="prod in filteredProducts" :key="prod.id" class="product-list-item">
                <div class="product-item">
                  <span class="product-name">{{ prod.product_name }} ({{ prod.phase_name }})</span>
                  <n-button text size="tiny" :disabled="!canEditProductPhaseAvailableDay" @click="openAssignDays(prod)">
                    <template #icon>
                      <v-icon name="md-add-round" />
                    </template>
                  </n-button>
                  <div class="product-days-legend">
                    <small v-if="getProductDays(prod).length">
                      {{ getProductDays(prod).join(' - ') }}
                    </small>
                  </div>
                </div>
              </n-list-item>
            </n-list>
          </div>
        </div>
      </n-gi>

      <!-- Right side: Programación semanal de menú -->
      <n-gi :span="8">
        <div>
          <h3>Programación semanal de menú</h3>
          <div class="week-grid">
            <div v-for="day in days" :key="day" class="day-col">
              <h4>{{ day }}</h4>
              <n-tag v-for="item in scheduleByDay(day)" :key="item.id + '-' + day" type="info"
                :closable="canEditProductPhaseAvailableDay" @close="removeDay(item, day)" class="mb-1"
                style="height: 50px;">
                <div class="phase-block">
                  <span>
                    <small style="display:block; font-size: 0.95em; color: #555;">{{ item.phase_name }}</small>
                    {{ item.product_name }}
                  </span>
                </div>
              </n-tag>
            </div>
          </div>
        </div>
      </n-gi>
    </n-grid>

    <!-- Footer con botones -->
    <template #action>
      <n-space justify="end">
        <n-button @click="localShow = false">Cancelar</n-button>
        <n-button type="primary" :disabled="!canEditProductPhaseAvailableDay" @click="saveProgramation">Guardar
          programación</n-button>
      </n-space>
    </template>

    <!-- Modal secundario -->
    <AssignDaysModal v-model:show="showAssignDays" :product="selectedProduct"
      :initial-days="getProductDays(selectedProduct)" @save="handleAssignDays" />
  </n-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AssignDaysModal from './AssignDaysModal.vue'
import { getMenuPhases, getMenuProductPhases, getMenuWeeklyAvailability, saveMenuWeeklyAvailability } from '@/api/modules/menu'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({ show: Boolean, menuId: Number })
const emit = defineEmits(['update:show'])

// proxy para v-model
const localShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const userStore = useUserStore()
const canViewProductPhase = computed(() => userStore.hasPermission('view_productphase'))
const canViewProductPhaseAvailableDay = computed(() => userStore.hasPermission('view_productphaseavailableday'))
const canEditProductPhaseAvailableDay = computed(() =>
  userStore.hasPermission('add_productphaseavailableday') ||
  userStore.hasPermission('change_productphaseavailableday') ||
  userStore.hasPermission('delete_productphaseavailableday')
)

const search = ref('')
const selectedPhase = ref(null)
const products = ref([])
const schedule = ref([])

const days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
const phaseOptions = ref([])

const filteredProducts = computed(() =>
  products.value.filter(
    (p) =>
      (!selectedPhase.value || p.phase_id === selectedPhase.value) &&
      (!search.value || p.product_name.toLowerCase().includes(search.value.toLowerCase()))
  )
)

function scheduleByDay(day) {
  return schedule.value.filter((s) => s.days.includes(day))
}

// asignación
const showAssignDays = ref(false)
const selectedProduct = ref(null)
function openAssignDays(prod) {
  if (!canEditProductPhaseAvailableDay.value) {
    window.$message?.error('No tienes permisos para editar la programación')
    return
  }
  selectedProduct.value = prod
  showAssignDays.value = true
}

function getProductDays(prod) {
  if (!prod) return []
  const existing = schedule.value.find(s => s.id === prod.id)
  return existing ? existing.days : []
}

function handleAssignDays(days) {
  // Remove previous entry for this product
  schedule.value = schedule.value.filter(s => s.id !== selectedProduct.value.id)
  // Only add if days are assigned
  if (days && days.length > 0) {
    schedule.value.push({ ...selectedProduct.value, days })
  }
}

function removeDay(item, day) {
  if (!canEditProductPhaseAvailableDay.value) {
    window.$message?.error('No tienes permisos para editar la programación')
    return
  }
  // Find schedule entry for this product
  const idx = schedule.value.findIndex(s => s.id === item.id)
  if (idx !== -1) {
    const newDays = schedule.value[idx].days.filter(d => d !== day)
    if (newDays.length === 0) {
      schedule.value.splice(idx, 1)
    } else {
      schedule.value[idx] = { ...schedule.value[idx], days: newDays }
    }
  }
}

async function loadPhasesAndProducts() {
  if (!canViewProductPhase.value || !canViewProductPhaseAvailableDay.value) {
    products.value = []
    phaseOptions.value = []
    schedule.value = []
    return
  }
  const phases = await getMenuPhases(props.menuId)
  phaseOptions.value = [{ label: 'Todas', value: null }, ...phases.data.map(p => ({ label: p.name, value: p.id }))]
  products.value = []
  for (const p of phases.data) {
    const prods = await getMenuProductPhases(props.menuId, { phase: p.id })
    for (const prod of prods.data) {
      products.value.push({ ...prod, phase_name: p.name, phase_id: p.id })
    }
  }

  // cargar programación previa (semana actual)
  const today = new Date()
  const start = new Date(today.setDate(today.getDate() - today.getDay() + 1)) // Monday
  const startStr = start.toISOString().split('T')[0]
  const saved = await getMenuWeeklyAvailability(props.menuId, startStr)
  // flatten response into schedule.value
  schedule.value = []
  for (const dayData of saved.data) {
    const prod = products.value.find(p => p.id === dayData.product_phase)
    if (prod) {
      const existing = schedule.value.find(s => s.id === prod.id)
      const day = dayData.day
      if (existing) {
        if (!existing.days.includes(day)) {
          existing.days.push(day)
        }
      } else {
        schedule.value.push({
          ...prod,
          days: [day]
        })
      }
    }
  }
}

async function saveProgramation() {
  if (!canEditProductPhaseAvailableDay.value) {
    window.$message?.error('No tienes permisos para guardar la programación')
    return
  }
  const daysPayload = days.map(d => ({
    date: d, // You may need a real date mapping
    active: true,
    items: schedule.value
      .filter(s => s.days.includes(d))
      .map(s => ({ product_phase: s.id, available: true }))
  }))
  await saveMenuWeeklyAvailability(props.menuId, daysPayload)
  localShow.value = false
}

watch([() => props.menuId, localShow], ([menuId, show]) => {
  if (show && menuId) {
    loadPhasesAndProducts()
  }
})
</script>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 120px);
  gap: 8px;
}

.day-col {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px;
  min-height: 400px;
  font-size: 0.84em;
  overflow-x: hidden;
}

.day-col h4 {
  font-size: 0.95em;
  text-align: center;
  margin-bottom: 4px;
}

.day-col .n-tag {
  font-size: 0.88em;
  margin-bottom: 4px;
  white-space: normal;
  word-wrap: break-word;
}

.product-list-scroll {
  max-height: 500px;
  overflow-y: auto;
  font-size: 0.85em;
}

.product-item .product-name {
  font-size: 0.85em;
}

.product-days-legend small {
  font-size: 0.7em;
  color: #666;
  display: block;
  margin-top: 2px;
}

.list-products {
  width: 200px;
}

.list-days {
  width: 800px;
}
</style>
