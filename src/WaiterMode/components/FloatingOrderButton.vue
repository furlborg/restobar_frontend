<template>
  <teleport to="body">
    <n-space
      class="position-absolute bottom-0 start-50 translate-middle-x mb-3"
      align="center"
      vertical
    >
      <transition name="slide-fade">
        <n-button
          v-if="orderStore.orderList.length > 0"
          type="info"
          :disabled="orderStore.orderList.length === 0"
          round
          @click="showOrderDrawer = true"
        >
          <v-icon class="me-1" name="md-shoppingcart-round" />Ver pedido
          <n-badge 
            :value="totalOrderCount" 
            type="success" 
            :max="99"
            style="margin-left: 8px;"
          />
        </n-button>
      </transition>
    </n-space>
  </teleport>
  
  <!-- Drawer del pedido -->
  <n-drawer height="60%" v-model:show="showOrderDrawer" placement="bottom">
    <n-drawer-content
      title="Pedido Actual"
      footer-style="padding: 12px; height: auto"
      body-style="padding: 0"
      body-content-style="padding: 12px"
      closable
    >
      <n-list v-if="displayOrders.length > 0" class="m-0">
        <template v-for="(order, index) in displayOrders" :key="index">
          <n-list-item v-if="order.quantity > 0" class="py-2" @click="openIndications(order, index)">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <n-tag>{{ order.quantity }}</n-tag>
                  <!-- Caso producto normal -->
                  <n-text v-if="order.product_name" class="ms-2">
                    {{ order.product_name }}
                  </n-text>
                  <!-- Caso menú -->
                  <n-text v-else-if="order.from_menu" class="ms-2">
                    <n-icon color="#18a058" class="me-1">
                      <v-icon name="md-restaurant-round" />
                    </n-icon>
                    {{ order.name }}
                  </n-text>
                  <!-- Caso combo -->
                  <n-text v-else-if="order.from_combo" class="ms-2">
                    <n-icon color="#f0a020" class="me-1">
                      <v-icon name="gi-hot-meal" />
                    </n-icon>
                    {{ order.name }}
                  </n-text>
                </n-space>
              </template>
              
              <template #header-extra>
                <n-space align="center">
                  <n-text>
                    S/. {{ 
                      order.from_menu || order.from_combo
                        ? (order.quantity * order.price).toFixed(2)
                        : (order.quantity * order.price).toFixed(2)
                    }}
                  </n-text>
                  <n-button
                    type="error"
                    size="small"
                    text
                    :disabled="!!order.id"
                    @click.stop="removeOrderItem(order)"
                  >
                    <v-icon name="md-disabledbydefault-round" />
                  </n-button>
                </n-space>
              </template>
              
              <!-- Listar los items si es un menú -->
              <template v-if="order.from_menu && order.items">
                <div class="ms-4 mt-2">
                  <n-text class="fs-7" type="info">Productos del menú:</n-text>
                  <ul class="ms-3 mt-1">
                    <li v-for="(item, idx) in order.items" :key="idx" class="fs-7">
                      {{ item.quantity }} x {{ item.product_name }}
                      <n-tag size="tiny" class="ms-1">{{ item.phase_name }}</n-tag>
                    </li>
                  </ul>
                </div>
              </template>
              
              <!-- Listar los items si es un combo -->
              <template v-if="order.from_combo && order.items">
                <div class="ms-4 mt-2">
                  <n-text class="fs-7" type="warning">Productos del combo:</n-text>
                  <ul class="ms-3 mt-1">
                    <li v-for="(item, idx) in order.items" :key="idx" class="fs-7">
                      {{ item.quantity }} x {{ item.product_name }}
                    </li>
                  </ul>
                </div>
              </template>
            </n-thing>
          </n-list-item>
        </template>
      </n-list>
      
      <n-empty v-else description="No hay productos en el pedido" />
      
      <template #footer>
        <n-space justify="space-between" align="center">
          <n-text class="fs-5 fw-bold">
            Total: S/. {{ fullOrderTotal }}
          </n-text>
          <n-space>
            <n-button
              type="success"
              :disabled="orderStore.orderList.length === 0 || loading"
              :loading="loading"
              @click="performOrder"
            >
              <v-icon class="me-1" name="md-fastfood-twotone" />
              {{ orderStore.orderId ? 'Añadir' : 'Realizar' }} pedido
            </n-button>
          </n-space>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
  
  <!-- Modal para nombre de cliente -->
  <n-modal
    preset="card"
    title="Nombre de Cliente"
    v-model:show="showAskFor"
    :segmented="{ content: 'hard' }"
  >
    <n-input placeholder="Ingrese el nombre del cliente" v-model:value="ask_for" />
    <template #action>
      <n-space justify="end">
        <n-button
          type="default"
          @click="showAskFor = false"
        >
          Cancelar
        </n-button>
        <n-button
          type="info"
          :disabled="loading"
          :loading="loading"
          @click="executeOrder"
        >
          Confirmar pedido
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <ProductIndications
    v-model:show="showModal"
    preset="card"
    title="Indicaciones"
    :product="currentOrder"
    @success="showModal = false"
  />
</template>

<script>
import { defineComponent, ref, inject, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/store/modules/order'
import { useTableStore } from '@/store/modules/table'
import { useSettingsStore } from '@/store/modules/settings'
import { useUserStore } from '@/store/modules/user'
import { createTableOrder, updateTableOrder } from '@/api/modules/tables'
import ProductIndications from '../views/ProductIndications'

export default defineComponent({
  name: 'FloatingOrderButton',
  components: { ProductIndications },
  setup() {
    const message = useMessage()
    const route = useRoute()
    const router = useRouter()
    const orderStore = useOrderStore()
    const tableStore = useTableStore()
    const settingsStore = useSettingsStore()
    const userStore = useUserStore()
    const switchToOrderTab = inject('switchToOrderTab', () => {})
    const showOrderDrawer = ref(false)
    const loading = ref(false)
    const showAskFor = ref(false)
    const ask_for = ref('')
    const showModal = ref(false)
    const orderItemIndex = ref(null)

    const displayOrders = computed(() =>
      orderStore.fullOrderList.filter((order) => Number(order.quantity || 0) > 0)
    )
    
    const totalOrderCount = computed(() => {
      return displayOrders.value.reduce((total, order) => total + Number(order.quantity || 0), 0)
    })

    const fullOrderTotal = computed(() => {
      const total = displayOrders.value.reduce((acc, order) => {
        const qty = Number(order.quantity || 0)
        const price = parseFloat(order.price || 0)
        return acc + qty * price
      }, 0)
      return total.toFixed(2)
    })

    const currentOrder = computed(() =>
      typeof orderItemIndex.value === 'number' ? displayOrders.value[orderItemIndex.value] : null
    )

    const canOpenIndications = (order) => !!order && !order.from_menu && !order.from_combo

    const openIndications = (order, index) => {
      if (!canOpenIndications(order)) return
      orderItemIndex.value = index
      showModal.value = true
    }
    
    const removeOrderItem = (order) => {
      if (!order || order.id) return
      const index = orderStore.orders.findIndex((item) => item === order)
      if (index === -1) {
        message.warning('No se pudo eliminar el item seleccionado')
        return
      }
      orderStore.orders.splice(index, 1)
      message.info('Producto eliminado del pedido')
    }
    
    const performOrder = () => {
      if (settingsStore.business_settings?.order?.order_customer_name) {
        showAskFor.value = true
      } else {
        executeOrder()
      }
    }
    
    const executeOrder = async () => {
      loading.value = true
      showOrderDrawer.value = false
      
      try {
        const response = orderStore.orderId 
          ? await updateTableOrder(
              route.params.table,
              orderStore.orderId,
              orderStore.fullOrderList,
              userStore.user?.id ?? null,
              ask_for.value || undefined
            )
          : await createTableOrder(
              route.params.table,
              orderStore.orderList,
              userStore.user?.id ?? null,
              ask_for.value || undefined
            )
            
        if (response.status === 201 || response.status === 202) {
          message.success(
            orderStore.orderId ? 'Orden actualizada correctamente' : 'Orden creada correctamente'
          )
          
          // Limpiar completamente el carrito después de enviar
          orderStore.clearNewOrders()
          await tableStore.refreshData()

          // Recargar los pedidos guardados desde el backend para mantener el store consistente
          try {
            const { retrieveTableOrder } = await import('@/api/modules/tables')
            const orderResponse = await retrieveTableOrder(route.params.table)
            if (orderResponse.status === 200) {
              // Transformar order_details igual que en Order.vue
              const transformedOrders = orderResponse.data.order.order_details.map(detail => {
                if (detail.product_set) {
                  const isCombo = detail.product_set.set_type === 'COMBO';
                  return {
                    id: detail.id,
                    from_menu: detail.product_set.set_type === 'MENU',
                    from_combo: isCombo,
                    product_set_id: detail.product_set.id,
                    order_detail_id: detail.id,
                    combo_id: detail.product_set?.combo || null,
                    name: detail.product_set.menu_name || detail.product_set.name,
                    set_type: detail.product_set.set_type,
                    price: parseFloat(detail.product_set.price || detail.product_set.fixed_price || detail.product_set.computed_price || 0),
                    fixed_price: detail.product_set.fixed_price,
                    pricing_mode: detail.product_set.pricing_mode,
                    quantity: detail.quantity,
                    product_set: detail.product_set,
                    items: detail.product_set.items?.map(item => ({
                      quantity: item.quantity,
                      product_name: item.product?.name || item.product_phase?.product?.name || item.product_phase?.product_name,
                      phase_name: item.product_phase?.phase_name
                    })) || []
                  }
                } else if (detail.product) {
                  return {
                    id: detail.id,
                    product: detail.product,
                    product_name: detail.product_name,
                    price: parseFloat(detail.price),
                    quantity: detail.quantity,
                    indication: detail.indication || [],
                    quick_indications: detail.quick_indications || "",
                    icbper: detail.icbper,
                    product_affectation: detail.product_affectation,
                    product_igv: detail.product_igv
                  }
                }
                return null
              }).filter(Boolean)

              orderStore.setSavedOrders(transformedOrders)
              // Actualizar orderId para habilitar la pestaña de pedidos
              orderStore.orderId = orderResponse.data.order.id
            }
          } catch (error) {
            // Error recargando pedido, continuar sin fallar
          }
          
          // Limpiar modal
          showAskFor.value = false
          ask_for.value = ''
          await router.push({ name: 'WHome' })
        }
      } catch (error) {
        message.error('Error al procesar la orden')
      } finally {
        loading.value = false
      }
    }
    
    const goToOrderTab = () => {
      showOrderDrawer.value = false
      switchToOrderTab()
    }
    
    return {
      orderStore,
      totalOrderCount,
      displayOrders,
      fullOrderTotal,
      currentOrder,
      showOrderDrawer,
      loading,
      showAskFor,
      ask_for,
      showModal,
      removeOrderItem,
      openIndications,
      performOrder,
      executeOrder,
      goToOrderTab
    }
  }
})
</script>

<style lang="scss" scoped>
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

.fs-5 {
  font-size: 1.25rem;
}

.fs-7 {
  font-size: 0.85rem;
}

.fw-bold {
  font-weight: bold;
}
</style>
