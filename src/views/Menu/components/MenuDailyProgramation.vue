<template>
  <n-modal v-model:show="localShow" title="Programación diaria del menú" preset="dialog" style="width: 90%;">
    <div v-if="selectedDate && currentStep === 1" class="selected-date-display">
      Fecha seleccionada: <strong>{{ new Date(selectedDate).toLocaleDateString() }}</strong>
    </div>
    <div v-if="currentStep === 1" class="step1">
      <calendar-view 
        :show-date="currentMonth"
        @click-date="onDateSelected"
        :enable-date-selection="true"
        :items="scheduledDaysForCalendar"
        :attributes="[{ dates: [selectedDate], class: 'selected' }]"
        class="theme-default holiday-us"
        style="height: 600px;"
        >
        <template #header="{ headerProps }">
          <CalendarViewHeader :header-props="headerProps" />
        </template>
      </calendar-view>
    </div>
    <div v-else class="step2">
      <div class="menus-list">
        <n-input v-model:value="menuSearch" placeholder="Buscar menú activo" clearable />
        <n-list bordered size="small" style="height: 320px; overflow-y: auto;">
          <n-list-item
            v-for="menu in filteredMenus"
            :key="menu.id"
            :class="{ selected: selectedMenu && selectedMenu.id === menu.id }"
            @click="selectMenu(menu)"
            style="cursor: pointer;"
          >
            {{ menu.name }}
          </n-list-item>
        </n-list>
      </div>

      <div class="products-list">
        <!-- Mostrar la fecha seleccionada -->
        <div class="selected-date">
          Menú para el día: <strong>{{ new Date(selectedDate).toLocaleDateString() }}</strong>
        </div>

        <!-- Grid con columnas por fase -->
        <n-grid :cols="Object.keys(productsByPhase).length" x-gap="16">
          <n-gi v-for="(products, phase) in productsByPhase" :key="phase">
            <h4>{{ phase }}</h4>
            <n-list bordered size="small" style="max-height: 300px; overflow-y: auto;">
              <n-list-item v-for="product in products" :key="product.id">
                <div>
                  <n-checkbox
                    :value="product.id"
                    :label="product.name"
                    :checked="isProductSelected(product.id)"
                    @update:checked="onProductToggle(product)"
                  />
                  <div v-if="isProductSelected(product.id)" class="stock-label">Stock: {{ getProductStock(product.id) }}</div>
                </div>
              </n-list-item>
            </n-list>
          </n-gi>
        </n-grid>
      </div>
    </div>
    <n-modal v-model:show="showStockModal" title="Definir stock" preset="dialog" style="width: 400px;">
      <div style="padding: 16px;">
        <n-input-number v-model:value="tempStock" placeholder="Stock disponible" style="width: 100%;" />
      </div>
      <template #action>
        <n-button @click="onCancelStock">Cancelar</n-button>
        <n-button type="primary" @click="onConfirmStock">Aceptar</n-button>
      </template>
    </n-modal>
    <template #action>
      <n-button @click="onCancel">Cancelar</n-button>
      <n-button v-if="currentStep === 2" @click="onBack">Volver</n-button>
      <n-button v-if="currentStep === 1" :disabled="!selectedDate" @click="onNext" type="primary">Siguiente</n-button>
      <n-button v-if="currentStep === 2" :disabled="!selectedMenu" type="primary" @click="onApply">Aplicar menú del día</n-button>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CalendarView, CalendarViewHeader } from 'vue-simple-calendar'
import 'vue-simple-calendar/dist/vue-simple-calendar.css'
import 'vue-simple-calendar/dist/css/default.css'
import { 
  getScheduledDaysForMonth,
  getMenus,
  applyMenuScheduledDay,
  getScheduledDays   // 👈 importar el servicio
} from '@/api/modules/menu'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['update:show'])
const localShow = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v)
})

const currentStep = ref(1)
const selectedDate = ref(null)
const tempStock = ref(0)
const menus = ref([])
const menuSearch = ref('')
const selectedMenu = ref(null)
const productsByPhase = ref({})
const selectedProducts = ref([])
const currentProduct = ref(null)
const showStockModal = ref(false)
const prefilledProductIds = ref([])

const currentMonth = ref(new Date())
const scheduledDaysForCalendar = ref([])

async function loadScheduledDays() {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth() + 1
  const { data } = await getScheduledDaysForMonth(year, month)

  scheduledDaysForCalendar.value = data.flatMap(d => {
    const [day, monthStr, yearStr] = d.date.split('/')
    const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(day))

    // Si un día tiene varios menús, retornamos múltiples items para el mismo startDate
    return (d.menus || [d]).map(menu => ({
      id: menu.id,
      startDate: dateObj,
      title: menu.menu_name || d.menu_name || 'Menú programado'
    }))
  })
  console.log("data", scheduledDaysForCalendar.value)
}

watch(localShow, (val) => {
  if (val && currentStep.value === 1) {
    loadScheduledDays()
  }
})

watch(currentStep, (val) => {
  if(val===1){
    loadScheduledDays()
  }
})

function onDateSelected(date) {
  selectedDate.value = date
}

async function fetchMenus() {
  const response = await getMenus()
  menus.value = response.data
}

async function prefillSelectedProducts(date) {
  try {
    const dateFilter = new Date(date).toISOString().split('T')[0]
    const { data } = await getScheduledDays({date: dateFilter})
    let items = []
    if (Array.isArray(data)) {
      data.forEach(scheduled => {
        if (scheduled.items && Array.isArray(scheduled.items)) {
          items.push(...scheduled.items.map(item => ({
            product_phase: item.product_phase,
            available: item.available,
            stock_override: item.stock_override
          })))
        }
      })
    }
    selectedProducts.value = items
    prefilledProductIds.value = items.map(item => item.product_phase)
  } catch (error) {
    console.error("Error prefilling selected products:", error)
    selectedProducts.value = []
    prefilledProductIds.value = []
  }
}

async function fetchProductsByPhase(menuId) {
  try {
    const phases = menus.value.find((menu) => menu.id === menuId).phases || []

    const dayMap = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
    const selectedDay = dayMap[new Date(selectedDate.value).getDay()]

    const phaseMap = {}
    phases.forEach(phase => {
      const filteredProducts = phase.products.filter(product =>
        product.available_days?.some(d => d.day === selectedDay)
      )

      if (filteredProducts.length > 0) {
        phaseMap[phase.name] = filteredProducts.map(product => ({
          id: product.id,
          name: product.product_name
        }))
      }
    })

    productsByPhase.value = phaseMap
    // Only reset selectedProducts if empty to keep previously loaded values
    if (selectedProducts.value.length === 0) {
      selectedProducts.value = []
    }
  } catch (error) {
    console.error("Error cargando productos por fase", error)
  }
}

const filteredMenus = computed(() => {
  if (!menuSearch.value) return menus.value
  return menus.value.filter(menu =>
    menu.name.toLowerCase().includes(menuSearch.value.toLowerCase())
  )
})

async function selectMenu(menu) {
  selectedMenu.value = menu
  await fetchProductsByPhase(menu.id)
}

async function onNext() {
  if (selectedDate.value) {
    currentStep.value = 2
    selectedMenu.value = null
    productsByPhase.value = {}
    selectedProducts.value = []
    menuSearch.value = ''
    await fetchMenus()
    // Prefill selected products for the first menu if any
    if (menus.value.length > 0) {
      selectedMenu.value = menus.value[0]
      await fetchProductsByPhase(selectedMenu.value.id)
    }
    await prefillSelectedProducts(selectedDate.value)
  }
}

function onBack() {
  currentStep.value = 1
  selectedMenu.value = null
  productsByPhase.value = {}
  selectedProducts.value = []
  menuSearch.value = ''
}

function onCancel() {
  localShow.value = false
  currentStep.value = 1
  selectedDate.value = null
  selectedMenu.value = null
  productsByPhase.value = {}
  selectedProducts.value = []
  menuSearch.value = ''
  prefilledProductIds.value = []
}

async function loadSchedule(menuId, date) {
  const { data } = await getMenuScheduledDay(menuId, date)
  console.log("Schedule encontrado:", data)
}

async function onApply() {
  if (!selectedMenu.value || !selectedDate.value) return

  try {
    await applyMenuScheduledDay(selectedMenu.value.id, {
      date: new Date(selectedDate.value).toISOString().split('T')[0],
      active: true,
      items: selectedProducts.value
        .filter(p => !prefilledProductIds.value.includes(p.product_phase))
        .map(p => ({
          product_phase: p.product_phase,
          available: p.available,
          stock_override: p.stock_override
        }))
    })

    window.$message?.success("Programación aplicada correctamente ✅")
    onCancel()
  } catch (error) {
    console.error("Error aplicando programación:", error)
    window.$message?.error("Error al aplicar la programación ❌")
  }
}

function isProductSelected(productId) {
  return selectedProducts.value.some(p => p.product_phase === productId)
}

function onProductToggle(product) {
  const exists = selectedProducts.value.find(p => p.product_phase === product.id)

  if (exists) {
    // Si ya estaba, quitarlo
    selectedProducts.value = selectedProducts.value.filter(p => p.product_phase !== product.id)
  } else {
    // Si es nuevo, abrir modal para stock
    currentProduct.value = product
    tempStock.value = null
    showStockModal.value = true
  }
}

function onCancelStock() {
  showStockModal.value = false
  currentProduct.value = null
}

function onConfirmStock() {
  selectedProducts.value.push({
    product_phase: currentProduct.value.id,
    available: true,
    stock_override: tempStock.value ?? null,
  })
  showStockModal.value = false
  currentProduct.value = null
}

function getProductStock(productId) {
  const product = selectedProducts.value.find(p => p.product_phase === productId)
  return product?.stock_override ?? 0
}
</script>

<style scoped>
.step1 {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.step2 {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.menus-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.products-list {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: 370px;
}

.phase-group h4 {
  margin-bottom: 8px;
  margin-top: 0;
}

.n-list-item.selected {
  background-color: #e6f7ff;
}

.calendar-wrapper {
  width: 100%;
  height: 800px; /* ajusta según tu modal */
}

.stock-label {
  font-size: 0.75em;
  color: gray;
  margin-top: 4px;
}

.menu-day-active .cv-item {
  background: #36ad6a; /* verde */
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
}

.menu-day-inactive .cv-item {
  background: #d9d9d9; /* gris */
  color: #333;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
}

.selected-date-display {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
  padding: 6px 0;
}

/* Highlight selected day in calendar */
.cv-day.selected {
  outline: 2px solid #1890ff;
  outline-offset: -2px;
  border-radius: 4px;
}

</style>
