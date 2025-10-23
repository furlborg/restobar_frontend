<template>
  <n-modal v-model:show="localShow" title="Programación diaria del menú" preset="dialog" style="width: 90%;">
    <div v-if="selectedDate && currentStep === 1" class="selected-date-display">
      <n-alert type="info" :show-icon="false" class="selected-date-alert">
        <template #header>
          📅 Fecha seleccionada
        </template>
        <strong>{{ new Date(selectedDate).toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) }}</strong>
      </n-alert>
    </div>
    <div v-if="currentStep === 1" class="step1">
      <!-- Controles de navegación del calendario -->
      <div class="calendar-navigation">
        <n-button @click="goToPreviousMonth" ghost>
          ‹
        </n-button>
        <span class="current-month">
          {{ currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
        </span>
        <n-button @click="goToNextMonth" ghost>
          ›
        </n-button>
        <n-button @click="goToToday" size="small" type="primary" ghost>Hoy</n-button>
      </div>
      
      <calendar-view 
        :show-date="currentMonth"
        @click-date="onDateSelected"
        @show-date-change="onShowDateChange"
        :enable-date-selection="true"
        :items="scheduledDaysForCalendar"
        :date-classes="getDateClasses"
        class="theme-default holiday-us custom-calendar"
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
  try {
    const year = currentMonth.value.getFullYear()
    const month = currentMonth.value.getMonth() + 1
    console.log(`Cargando días programados para ${month}/${year}`)
    
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
    console.log("Días programados cargados:", scheduledDaysForCalendar.value)
  } catch (error) {
    console.error("Error cargando días programados:", error)
    scheduledDaysForCalendar.value = []
  }
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

// Watcher para detectar cambios de mes y recargar los datos
watch(currentMonth, () => {
  if (localShow.value && currentStep.value === 1) {
    loadScheduledDays()
  }
})

function onDateSelected(date) {
  selectedDate.value = date
  // Forzar la actualización del calendario para que aplique las nuevas clases
  scheduledDaysForCalendar.value = [...scheduledDaysForCalendar.value]
}

function onShowDateChange(date) {
  if (date && date !== currentMonth.value) {
    currentMonth.value = new Date(date)
  }
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
            product_phase: item.product_phase.id,
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

// Métodos para navegación del calendario
function goToPreviousMonth() {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() - 1)
  currentMonth.value = newMonth
}

function goToNextMonth() {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() + 1)
  currentMonth.value = newMonth
}

function goToToday() {
  currentMonth.value = new Date()
}

// Función para aplicar clases CSS a los días del calendario
function getDateClasses(date) {
  const classes = []
  
  // Si es el día seleccionado, agregar clase especial
  if (selectedDate.value && 
      date.toDateString() === new Date(selectedDate.value).toDateString()) {
    classes.push('selected-day')
  }
  
  // Si es el día actual, agregar clase para destacarlo
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    classes.push('today')
  }
  
  return classes
}
</script>

<style scoped>
.step1 {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
}

.calendar-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 8px;
}

.calendar-navigation .n-button {
  font-size: 20px;
  font-weight: bold;
}

.current-month {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
  min-width: 200px;
  text-align: center;
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
  height: 800rgb(12, 187, 210)ajusta según tu modal */
}

.stock-label {
  font-size: 0.75em;
  color: gray;
  margin-top: 4px;
}

.menu-day-active .cv-item {
  background: #068d9c; /* verde */
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
  margin-bottom: 16px;
}

.selected-date-alert {
  border-radius: 8px;
  border: 2px solid #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.selected-date-alert .n-alert__body {
  text-align: center;
  padding: 12px;
}

/* Estilos para el calendario personalizado */
:deep(.custom-calendar .cv-day.selected-day) {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
  color: white !important;
  border-radius: 8px !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4) !important;
  border: 2px solid #ffffff !important;
  font-weight: bold !important;
  transition: all 0.3s ease;
}

:deep(.custom-calendar .cv-day.today) {
  border: 2px solid #1890ff !important;
  border-radius: 6px;
  font-weight: bold;
}

:deep(.custom-calendar .cv-day:hover) {
  background-color: #f0f0f0 !important;
  cursor: pointer;
  transform: scale(1.02);
  transition: all 0.2s ease;
}

/* Mejorar la visibilidad de días con eventos */
:deep(.custom-calendar .cv-day.hasItems) {
  background-color: #fff7e6 !important;
  border-left: 4px solid #fa8c16 !important;
}

/* Highlight selected day in calendar - ya no necesario */

</style>
