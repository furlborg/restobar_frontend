<template>
  <div class="menus-container p-3">
    <n-space class="mb-3" justify="space-between" align="center">
      <n-text class="fs-5">Menús del día</n-text>
      <n-button @click="loadMenus" size="small" type="info">
        <v-icon name="hi-solid-refresh" />
      </n-button>
    </n-space>

    <n-spin :show="loading">
      <n-list v-if="scheduledMenus.length > 0" class="m-0">
        <n-list-item v-for="menu in scheduledMenus" :key="menu.id" class="menu-item"
          :class="{ 'no-stock': getAvailableItemsCount(menu.items) === 0 }" @click="openMenuModal(menu)">
          <template #prefix>
            <n-avatar color="#18a058" style="background-color: rgba(24, 160, 88, 0.1);">
              <v-icon name="md-restaurant-round" style="color: #18a058;" />
            </n-avatar>
          </template>
          <n-thing>
            <template #header>
              <n-space align="center" justify="space-between">
                <n-space align="center">
                  <n-text class="fs-6 fw-bold">{{ menu.menu_name }}</n-text>
                  <n-badge v-if="getAvailableItemsCount(menu.items) === 0" value="Sin stock" type="error" />
                  <n-badge v-else-if="getAvailableItemsCount(menu.items) < menu.items?.length" value="Stock limitado"
                    type="warning" />
                  <n-badge v-else value="Disponible" type="success" />
                </n-space>
                <n-text class="fs-5 fw-bold" type="success">S/. {{ menu.menu.price }}</n-text>
              </n-space>
            </template>
            <template #description>
              <n-space vertical size="small">
                <n-text class="fs-7" type="info">
                  {{ menu.items?.length || 0 }} productos disponibles
                </n-text>
                <n-space size="small">
                  <n-tag v-for="(products, phase) in getGroupedProducts(menu.items)" :key="phase" size="small"
                    type="info">
                    {{ phase }}: {{ products.length }}
                  </n-tag>
                </n-space>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>

      <n-empty v-else-if="!loading" description="No hay menús programados para hoy" />
    </n-spin>

    <!-- Modal para agregar menú -->
    <MenuProductModal v-if="showMenuModal" :menu="selectedMenu" @close="closeMenuModal" @success="handleMenuAdded" />

    <!-- Botón flotante de pedido -->
    <FloatingOrderButton />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getMenuToday } from '@/api/modules/products'
import MenuProductModal from '@/WaiterMode/components/MenuProductModal.vue'
import FloatingOrderButton from '@/WaiterMode/components/FloatingOrderButton.vue'

const message = useMessage()
const loading = ref(false)
const scheduledMenus = ref([])
const showMenuModal = ref(false)
const selectedMenu = ref(null)

const loadMenus = async () => {
  loading.value = true
  try {
    const response = await getMenuToday()
    if (response.status === 200) {
      scheduledMenus.value = response.data
    }
  } catch (error) {
    console.error('Error loading menus:', error)
    message.error('Error al cargar los menús')
  } finally {
    loading.value = false
  }
}

const getGroupedProducts = (items = []) => {
  const groups = {}
  items.forEach(item => {
    if (!groups[item.phase_name]) groups[item.phase_name] = []
    groups[item.phase_name].push(item)
  })
  return groups
}

const getAvailableItemsCount = (items = []) => {
  return items.filter(item => (item.stock_override || 0) > 0).length
}

const openMenuModal = (menu) => {
  // Solo abrir el modal si hay al menos un item con stock
  if (getAvailableItemsCount(menu.items) === 0) {
    message.warning('Este menú no tiene productos con stock disponible')
    return
  }
  selectedMenu.value = menu
  showMenuModal.value = true
}

const closeMenuModal = () => {
  showMenuModal.value = false
  selectedMenu.value = null
}

const handleMenuAdded = () => {
  closeMenuModal()
  message.success('Menú agregado al pedido')
  // El orderStore ya se actualiza automáticamente cuando se agrega un item
  // La pestaña de pedido se actualizará reactivamente
}

onMounted(() => {
  loadMenus()
})


</script>

<style lang="scss" scoped>
.menus-container {
  height: 100%;
  overflow-y: auto;
}

.menu-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 8px;

  &:hover:not(.no-stock) {
    background-color: rgba(24, 160, 88, 0.1);
    transform: translateY(-1px);
  }

  &.no-stock {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      background-color: rgba(208, 48, 80, 0.1);
    }
  }
}

.fs-5 {
  font-size: 1.25rem;
}

.fs-6 {
  font-size: 1.1rem;
}

.fs-7 {
  font-size: 0.9rem;
}

.fw-bold {
  font-weight: bold;
}

/* Animaciones para el botón flotante */
.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(25px);
  opacity: 0;
}
</style>