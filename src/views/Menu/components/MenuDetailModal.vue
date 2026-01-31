<template>
  <n-modal v-model:show="localShow" preset="card" style="width: 90vw; max-width: 1200px">
    <template #header>
      <div>
        <n-space align="center">
          <n-icon><v-icon name="md-infooutline-round" /></n-icon>
          <span>Detalle de tu <strong>{{ menu?.name }}</strong></span>
        </n-space>
      </div>
    </template>

    <div>
      <n-grid cols="3" x-gap="16" class="mb-4">
        <n-gi>
          <div><strong>Precio del menú</strong></div>
          <div>S/ {{ menu?.price }}</div>
        </n-gi>
        <n-gi>
          <div><strong>Fases de menú agregadas</strong></div>
          <div v-if="canViewPhase">{{ menu?.phases?.length || 0 }} Fases</div>
          <div v-else>Sin permiso</div>
        </n-gi>
        <n-gi>
          <div><strong>Estado del menú</strong></div>
          <div :style="{ color: menu?.active ? 'green' : 'red' }">
            {{ menu?.active ? 'Activo' : 'Inactivo' }}
          </div>
        </n-gi>
      </n-grid>

      <div>
        <h4>Contenido del menú:</h4>
        <n-alert
          v-if="!canViewPhase || !canViewProductPhase || !canViewProductPhaseAvailableDay"
          type="warning"
          :bordered="false"
          style="margin-bottom: 12px;"
        >
          No tienes permisos para ver el contenido del menú.
        </n-alert>
        <n-grid v-else cols="7" x-gap="8">
          <n-gi v-for="day in days" :key="day">
            <div class="day-column">
              <div class="day-title">{{ day }}</div>
              <div 
                v-for="phase in getPhasesByDay(day)" 
                :key="phase.id" 
                class="phase-block"
              >
                <div class="phase-name">{{ phase.name }}</div>
                <div v-for="pp in phase.products">
                  <span>
                      {{ pp.product_name }}
                  </span>
                </div>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </div>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="localShow = false">Cerrar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { getMenuDetail } from '@/api/modules/menu'
import { useUserStore } from '@/store/modules/user'


const props = defineProps({
  show: { type: Boolean, default: false },
  menuId: { type: Number, default: null }
})
const emit = defineEmits(['update:show'])

const userStore = useUserStore()
const canViewPhase = computed(() => userStore.hasPermission('view_fasemenu'))
const canViewProductPhase = computed(() => userStore.hasPermission('view_productphase'))
const canViewProductPhaseAvailableDay = computed(() => userStore.hasPermission('view_productphaseavailableday'))

const menu = ref(null)
const days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

watch(() => props.show, async (val) => {
  if (val && props.menuId) {
    const res = await getMenuDetail(props.menuId)
    console.log("data", res)
    menu.value = res.data
  }
})

// proxy para v-model
const localShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

function getPhasesByDay(day) {
  if (!menu.value || !menu.value.phases) return []
  if (!canViewPhase.value || !canViewProductPhase.value || !canViewProductPhaseAvailableDay.value) {
    return []
  }
  return menu.value.phases
    .map(phase => {
      const filteredProducts = phase.products.filter(p =>
        Array.isArray(p.available_days) &&
        p.available_days.some(ad => ad.day === day)
      )
      return {
        ...phase,
        products: filteredProducts
      }
    })
    .filter(phase => phase.products.length > 0)
}
</script>

<style scoped>
  .day-column {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 6px;
    min-height: 180px;
    background: #fafafa;
  }

  .day-title {
    font-weight: bold;
    font-size: 12px;
    text-align: center;
    margin-bottom: 6px;
  }

  .phase-block {
    margin-bottom: 8px;
  }

  .phase-name {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 2px;
    text-transform: uppercase;
    color: #666;
  }

  .product-item {
    font-size: 12px;
    margin-left: 8px;
  }
</style>
