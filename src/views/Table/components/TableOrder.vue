<template>
  <div id="TableOrder">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-space justify="space-between">
          <n-text class="fs-2">{{
            tableStore.getTableByID(table).description
          }}
          </n-text>
        </n-space>
      </template>
    </n-page-header>
    <n-card>
      <n-scrollbar>
        <n-grid responsive="screen" cols="1 s:1 m:5 l:5 xl:5 2xl:5" :x-gap="12" style="height: 100%; overflow: hidden;">
            <n-gi :span="3">
              <router-view />
            </n-gi>
            <n-gi span="2">
              <n-card title="Pedidos" :bordered="false">
                <template #header-extra>
                  <div v-if="userStore.hasPermission('charge_order')">
                    <n-button v-if="!($route.name === 'TablePayment')" type="success" :disabled="!orderStore.orderId" text
                      @click="navigateToPayment">
                      <v-icon class="me-1" name="fa-coins" />
                      <span class="fs-6">Cobrar</span>
                    </n-button>
                    <router-link v-else class="text-decoration-none" :to="{
                      name: 'ProductCategories',
                      params: { table: $route.params.table },
                    }">
                      <n-button type="info" text>
                        <v-icon class="me-1" name="md-add-round" />
                        <span class="fs-6">Añadir pedido</span>
                      </n-button>
                    </router-link>
                  </div>
                </template>

                <n-form v-if="!($route.name === 'TablePayment')">
                  <n-grid cols="2" x-gap="12">
                    <n-form-item-gi v-if="
                      settingsStore.businessSettings.order.order_customer_name &&
                      !shouldShowCustomerMode
                    " :span="!(settingsStore.businessSettings.order.select_order_user && userStore.user.role !== 'MOZO')
                          ? 2
                          : 1
                        " label="Cliente">
                      <n-input v-model:value="ask_for" placeholder="" :readonly="userStore.user.role === 'MOZO'"
                        :disabled="userStore.user.role === 'MOZO'" />
                    </n-form-item-gi>
                    <n-form-item-gi v-if="settingsStore.businessSettings.order.select_order_user && userStore.user.role !== 'MOZO'" :span="!settingsStore.businessSettings.order.order_customer_name || shouldShowCustomerMode
                        ? 2
                        : 1
                      " label="Mozo">
                      <n-select :options="activeUsersStore.usersOptions" v-model:value="orderUser" placeholder=""
                        filterable />
                    </n-form-item-gi>
                  </n-grid>

                  <!-- Nuevo flujo para pedidos por cliente -->
                  <div v-if="shouldShowCustomerForm">
                    <n-form-item label="Agregar Cliente">
                      <n-input-group>
                        <n-input v-model:value="newCustomerName" placeholder="Nombre del cliente"
                          @keyup.enter="addCustomer" />
                        <n-button type="primary" @click="addCustomer" :disabled="!newCustomerName.trim()">
                          <v-icon class="me-1" name="md-personadd-round" />
                          Agregar
                        </n-button>
                      </n-input-group>
                    </n-form-item>

                    <n-form-item v-if="customers.length > 0" label="Seleccionar Cliente">
                      <n-select :options="customerOptions" v-model:value="selectedCustomerId"
                        placeholder="Seleccione un cliente" filterable />
                    </n-form-item>
                  </div>

                  <n-form-item label="Buscar producto"
                    v-if="shouldAllowAddingProducts">
                    <n-input-group>
                      <n-auto-complete :input-props="{
                        autocomplete: 'disabled',
                      }" v-model:value="productSearch" :options="productOptions" :get-show="showOptions"
                        :loading="searching" placeholder="" clear-after-select :render-label="renderLabel"
                        @select="selectProduct" />
                    </n-input-group>
                  </n-form-item>
                </n-form>

                <!-- Tabla original para modo sin clientes -->
                <n-table v-if="!shouldShowCustomerMode" size="small">
                  <thead>
                    <tr>
                      <th style="width: 10%"></th>
                      <th style="width: 40%">Producto</th>
                      <th style="width: 25%">Cantidad</th>
                      <th style="width: 15%">SubTotal</th>
                      <th style="width: 10%"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(order, index) in orderStore.orderList">
                      <tr v-if="order.quantity > 0" :key="index" style="cursor: pointer" @click="
                        itemIndex = index;
                      showModal = true;
                      ">
                        <td>
                          <n-button v-if="!($route.name === 'TablePayment')" type="info" text>
                            <v-icon name="md-listalt-round" />
                          </n-button>
                        </td>
                        <td>
                          <span>
                            {{ order.product_name }}
                          </span><br>
                          <span style="color: #15151c; font-size: 12px;">
                            {{ order.modified }}
                          </span>
                        </td>
                        <td>
                          <n-input-number v-if="!($route.name === 'TablePayment')" class="border-top-0" size="small"
                            :min="order.id ? saleStore.getOrderQuantity(order.id) : 1
                              " v-model:value="order.quantity" @click.stop />
                          <template v-else>
                            {{ order.quantity }}
                          </template>
                        </td>
                        <td>S/. {{ order.subTotal.toFixed(2) }}</td>
                        <td>
                          <n-button v-if="!($route.name === 'TablePayment')" type="error" text @click.stop="
                            !order.id
                              ? (orderStore.orderList.splice(index, 1),
                                nullifyTableOrder())
                              : deleteOrderDetail(index, order.id)
                            ">
                            <v-icon name="md-disabledbydefault-round" />
                          </n-button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3">
                        <n-button v-if="!($route.name === 'TablePayment')"
                          :type="orderStore.orderId ? 'info' : 'primary'" text block :loading="loading" :disabled="orderStore.orderList.length
                              ? checkState || loading
                              : true
                            " @click="validateSend()">
                          <v-icon class="me-2" name="md-notealt-twotone" scale="1.5" />
                          <span class="fs-4">{{
                            orderStore.orderId ? "Actualizar" : "Realizar"
                          }}
                            pedido</span>
                        </n-button>
                      </td>
                      <td colspan="2" class="fs-6 fw-bold">
                        S/. {{ orderStore.orderTotal.toFixed(2) }}
                      </td>
                    </tr>
                  </tfoot>
                </n-table>

                <!-- Nueva tabla para modo con clientes -->
                <div v-else>
                  <template v-for="(customer, customerIndex) in customers" :key="customer.id">
                    <n-card class="mb-3" size="small" :title="customer.name" :bordered="true"
                      style="width: 100%; max-width: 100%; box-sizing: border-box;">
                      <template #header-extra>
                        <n-space>
                          <n-text class="fs-6 fw-bold">
                            S/. {{ formatPrice(getCustomerTotal(customer.id)) }}
                          </n-text>
                          <n-button v-if="!($route.name === 'TablePayment')" type="error" size="small"
                            @click="confirmRemoveCustomer(customerIndex, customer.name)"
                            :title="`Eliminar cliente ${customer.name}`">
                            <v-icon name="md-delete-round" />
                            <span class="ms-1">Eliminar</span>
                          </n-button>
                        </n-space>
                      </template>

                      <n-table size="small">
                        <thead>
                          <tr>
                            <th style="width: 10%"></th>
                            <th style="width: 40%">Producto</th>
                            <th style="width: 25%">Cantidad</th>
                            <th style="width: 15%">SubTotal</th>
                            <th style="width: 10%"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <template v-for="(order, orderIndex) in getCustomerOrders(customer.id)" :key="orderIndex">
                            <tr v-if="order.quantity > 0" style="cursor: pointer" @click="
                              itemIndex = getGlobalOrderIndex(customer.id, orderIndex);
                            showModal = true;
                            ">
                              <td>
                                <n-button v-if="!($route.name === 'TablePayment')" type="info" text>
                                  <v-icon name="md-listalt-round" />
                                </n-button>
                              </td>
                              <td>
                                <span>{{ order.product_name }}</span><br>
                                <span style="color: #15151c; font-size: 12px;">
                                  {{ order.modified }}
                                </span>
                              </td>
                              <td>
                                <n-input-number v-if="!($route.name === 'TablePayment')" class="border-top-0"
                                  size="small" :min="order.id ? saleStore.getOrderQuantity(order.id) : 1"
                                  v-model:value="order.quantity" @click.stop />
                                <template v-else>
                                  {{ order.quantity }}
                                </template>
                              </td>
                              <td>S/. {{ formatPrice(order.subTotal) }}</td>
                              <td>
                                <n-button v-if="!($route.name === 'TablePayment')" type="error" text
                                  @click.stop="removeProductFromCustomer(customer.id, orderIndex, order.id)">
                                  <v-icon name="md-disabledbydefault-round" />
                                </n-button>
                              </td>
                            </tr>
                          </template>
                        </tbody>
                      </n-table>

                      <n-empty v-if="getCustomerOrders(customer.id).length === 0"
                        description="No hay productos agregados" size="small" />
                    </n-card>
                  </template>

                  <n-empty v-if="customers.length === 0" description="No hay clientes agregados">
                    <template #extra>
                      <n-text depth="3">
                        Agregue un cliente usando el campo "Agregar Cliente" para comenzar a tomar pedidos.
                      </n-text>
                    </template>
                  </n-empty>
                </div>

                <!-- Botón de realizar pedido para modo clientes - SIEMPRE visible -->
                <div v-if="shouldShowCustomerMode" class="order-actions"
                  style="flex-shrink: 0; margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                  <n-space vertical>
                    <n-space justify="space-between" align="center">
                      <n-text class="fs-5 fw-bold">
                        Total General: S/. {{ formatPrice(getTotalAmount()) }}
                      </n-text>
                      <n-text type="info">
                        {{ customers.length }} cliente(s)
                      </n-text>
                    </n-space>
                    <n-button v-if="!($route.name === 'TablePayment')" :type="orderStore.orderId ? 'info' : 'primary'"
                      :loading="loading" :disabled="!hasAnyOrders() || checkState || loading" @click="validateSend()" block
                      size="large">
                      <v-icon class="me-2" name="md-notealt-twotone" scale="1.5" />
                      <span class="fs-4">
                        {{ orderStore.orderId ? "Actualizar" : "Realizar" }} pedido
                      </span>
                    </n-button>
                  </n-space>
                </div>
              </n-card>
            </n-gi>
        </n-grid>
      </n-scrollbar>
      <n-modal :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }" preset="card" v-model:show="showUserConfirm" title="Registrar pedido" :mask-closable="false" closable>
        <n-form-item label="Ingrese código de usuario">
          <n-input type="password" v-model:value="userConfirm" placeholder="" />
        </n-form-item>
        <template #action>
          <n-space justify="end">
            <n-button type="success" :loading="loading" :disabled="!userConfirm || loading" secondary @click.prevent="
              orderStore.orderId
                ? performUpdateTableOrder()
                : performCreateTableOrder()
              ">Confirmar
            </n-button>
          </n-space>
        </template>
      </n-modal>
      <n-modal :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }" preset="card" v-model:show="showConfirm" title="Eliminando comanda" :mask-closable="false" closable
        @close="() => { dataAnulate = { username: '', pass: '' } }">
        <div v-if="!userStore.hasPermission('cancel_orderdetail')">
          <n-form ref="formRef" :model="dataAnulate" :rules="rules">
            <n-form-item label="Cantidad">
              <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" placeholder=""
                style="width: 100%" />
            </n-form-item>
          </n-form>
        </div>
        <div v-else>
          <div v-if="settingsStore.businessSettings.sale?.require_user_pass_to_null">
            <n-form ref="formRef" :model="dataAnulate" :rules="rules">
              <n-form-item label="Ingrese su usuario" path="username">
                <n-input v-model:value="dataAnulate.username" placeholder="" />
              </n-form-item>
              <n-form-item label="Ingrese su contraseña" path="pass">
                <n-input type="password" v-model:value="dataAnulate.pass" placeholder="" />
              </n-form-item>
              <n-form-item label="Cantidad">
                <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%" />
              </n-form-item>
            </n-form>
          </div>
          <div v-else-if="settingsStore.businessSettings.sale.require_general_pass_to_null">
            <n-form ref="formRef" :model="dataAnulate" :rules="rules">
              <n-form-item label="Ingrese la contraseña" path="pass">
                <n-input type="password" v-model:value="dataAnulate.pass" />
              </n-form-item>
              <n-form-item label="Cantidad">
                <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%" />
              </n-form-item>
            </n-form>
          </div>
        </div>
        <div
          v-if="userStore.hasPermission('cancel_orderdetail') && !settingsStore.businessSettings.sale?.require_user_pass_to_null && !settingsStore.business_settings.sale.require_general_pass_to_null">
          <span style="font-weight: 700; font-size: 16px">
            Para poder anular un pedido, primero debe de activar la
            configuración "Requerir clave de usuario para anular" en la sección de configuraciones.
          </span>
        </div>
        <template #action>
          <n-space justify="end">
            <n-button type="success" secondary @click.prevent="performDeleteDetail"
              :disabled="userStore.hasPermission('cancel_orderdetail') && !settingsStore.businessSettings.sale?.require_user_pass_to_null && !settingsStore.business_settings.sale.require_general_pass_to_null">Confirmar
            </n-button>
          </n-space>
        </template>
      </n-modal>
      <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="currentOrder"
        @success="showModal = false" />
      <ticket-preview ref="ticketPreview" v-model:show="showPdf" :data="pdfData" :hidden="true"
        :isUpdate="!!orderStore.orderId" @printed="() => $router.push({ name: 'TableHome' })"
        @canceled="() => $router.push({ name: 'TableHome' })" />
    </n-card>
  </div>
</template>

<script>
import OrderIndications from "./OrderIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import { defineComponent, ref, computed, onMounted, watchEffect, h, provide } from "vue";
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate
} from "vue-router";
import { NThing, NTag, NSpace, NText, useDialog, useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import {
  retrieveTableOrder,
  createTableOrder,
  updateTableOrder,
  cancelTableOrder,
  performDeleteOrderDetail
} from "@/api/modules/tables";
import { searchProductByName } from "@/api/modules/products";
import { cloneDeep, lighten } from "@/utils";

export default defineComponent({
  name: "TableOrder",
  components: {
    OrderIndications,
    TicketPreview
  },
  setup() {
    const rules = {
      username: { required: true, trigger: ["blur", "input"], message: "" },
      pass: { required: true, trigger: ["blur", "input"], message: "" }
    };
    const dataAnulate = ref({ username: "", pass: "" });
    const userStore = useUserStore();
    const activeUsersStore = useActiveUsersStore();
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
    const tableStore = useTableStore();
    const table = route.params.table;
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const saleStore = useSaleStore();
    const listType = ref("grid");
    const showModal = ref(false);
    const itemIndex = ref(null);
    const checkState = ref(false);
    const loading = ref(false);
    const dateNow = ref(null);
    const ask_for = ref(undefined);
    const orderUser = ref(null); // Representa el mozo asignado (user_id), no el usuario autenticado
    const orderUser_initial = ref(null); // Estado inicial del mozo para detectar cambios

    // Variables para el nuevo flujo de clientes
    const customers = ref([]);
    const newCustomerName = ref("");
    const selectedCustomerId = ref(null);
    let customerIdCounter = 1;

    // Variable para almacenar el estado inicial de clientes (para comparación de cambios)
    const customers_initial = ref([]);

    // Variable para almacenar el modo en que fue creado el pedido actual
    const orderCreationMode = ref('traditional'); // 'traditional' o 'order_by_customer'

    // Computed properties para determinar qué vista mostrar (DEBEN ir antes del watchEffect)
    const shouldShowCustomerMode = computed(() => {
      // Mostrar modo clientes si:
      // 1. El pedido actual fue creado en modo clientes, O
      // 2. No hay pedido existente Y la configuración actual es modo clientes
      return orderCreationMode.value === 'order_by_customer';
    });

    const shouldShowCustomerForm = computed(() => {
      // Mostrar formulario de clientes si:
      // 1. Estamos en modo clientes Y no estamos en pantalla de pago
      return shouldShowCustomerMode.value && route.name !== 'TablePayment';
    });

    const shouldAllowAddingProducts = computed(() => {
      // Permitir agregar productos si:
      // 1. No estamos en modo clientes, O
      // 2. Estamos en modo clientes Y hay un cliente seleccionado
      return !shouldShowCustomerMode.value || selectedCustomerId.value;
    });

    const effectiveOrderMode = computed(() => {
      // Para operaciones de creación/actualización, usar la configuración actual
      // Para visualización, usar el modo detectado del pedido
      if (orderStore.orderId) {
        // Pedido existente: usar modo detectado para visualización
        return orderCreationMode.value;
      } else {
        // Nuevo pedido: usar configuración actual
        return settingsStore.businessSettings?.order?.order_by_customer ? 'order_by_customer' : 'traditional';
      }
    });

    orderStore.orders = [];
    saleStore.order_initial = [];
    orderStore.orderId = null;

    watchEffect(() => {
      if (shouldShowCustomerMode.value) {
        // Para el modo de clientes, actualizamos los subtotales cuando cambian las cantidades
        customers.value.forEach(customer => {
          customer.orders.forEach(order => {
            const quantity = Number(order.quantity) || 0;
            const price = Number(order.price) || 0;
            order.subTotal = quantity * price;
          });
        });
        
        // Comparar el estado actual con el inicial para detectar cambios
        const customersChanged = JSON.stringify(customers_initial.value) !== JSON.stringify(customers.value);
        const userChanged = orderUser_initial.value !== orderUser.value;
        checkState.value = !customersChanged && !userChanged;
      } else {
        // Para el modo tradicional
        const ordersChanged = JSON.stringify(saleStore.order_initial) !== JSON.stringify(orderStore.orderList);
        const userChanged = orderUser_initial.value !== orderUser.value;
        checkState.value = !ordersChanged && !userChanged;
      }
    });

    onBeforeRouteUpdate((to) => {
      if (to.name !== "ProductCategories" && to.name !== "CategoriesItems") {
        if (!checkState.value) {
          dialog.error({
            title: "Cambios sin guardar",
            content: "¿Salir de todos modos?",
            positiveText: "Sí",
            negativeText: "No",
            onPositiveClick: () => {
              checkState.value = true;
              orderStore.orders = saleStore.order_initial;
              router.push(to);
            }
          });
          return false;
        }
      }
    });

    onBeforeRouteLeave((to) => {
      if (to.name !== "ProductCategories" && to.name !== "CategoriesItems") {
        if (!checkState.value) {
          dialog.error({
            title: "Cambios sin guardar",
            content: "¿Salir de todos modos?",
            positiveText: "Sí",
            onPositiveClick: () => {
              checkState.value = true;
              orderStore.orders = saleStore.order_initial;
              router.push(to);
            },
            closable: false
          });
          return false;
        }
      }
    });

    // Función para detectar automáticamente el modo en que fue creado el pedido
    const detectOrderCreationMode = (orderDetails) => {
      if (!orderDetails || orderDetails.length === 0) {
        return 'traditional'; // Por defecto, modo tradicional
      }

      // Verificar si algún order_detail tiene información de clientes
      const hasCustomerInfo = orderDetails.some(detail => 
        detail.customer_id !== null && 
        detail.customer_id !== undefined && 
        detail.customer_name && 
        detail.customer_name.trim() !== ''
      );

      // Verificar si hay múltiples clientes diferentes
      const uniqueCustomers = new Set();
      orderDetails.forEach(detail => {
        if (detail.customer_id !== null && detail.customer_id !== undefined) {
          uniqueCustomers.add(detail.customer_id);
        }
      });

      // Si hay información de clientes válida, especialmente si hay múltiples clientes,
      // entonces fue creado en modo order_by_customer
      if (hasCustomerInfo && uniqueCustomers.size > 0) {
        console.log('Detectado modo order_by_customer - tiene info de clientes:', {
          hasCustomerInfo,
          uniqueCustomersCount: uniqueCustomers.size,
          customerIds: Array.from(uniqueCustomers)
        });
        return 'order_by_customer';
      }

      console.log('Detectado modo traditional - sin info de clientes válida');
      return 'traditional';
    };

    const performRetrieveTableOrder = async () => {
      await retrieveTableOrder(route.params.table).then((response) => {
        if (response.status === 200) {
          ask_for.value = response.data.ask_for;
          orderStore.orderId = response.data.id;
          
          if (settingsStore.businessSettings.order.select_order_user) {
            // Si el usuario actual es MOZO, usar su ID en lugar del guardado
            if (userStore.user.role === 'MOZO') {
              orderUser.value = userStore.user.id;
            } else {
              // user_id representa el mozo asignado (no el usuario autenticado)
              orderUser.value = response.data.user_id || response.data.user;
            }
            // Guardar el estado inicial del usuario para detectar cambios
            orderUser_initial.value = orderUser.value;
          }

          // Detectar automáticamente el modo en que fue creado el pedido
          const detectedMode = detectOrderCreationMode(response.data.order_details);
          orderCreationMode.value = detectedMode;
          
          console.log('Modo detectado del pedido existente:', detectedMode);
          console.log('Configuración actual:', settingsStore.businessSettings?.order?.order_by_customer ? 'order_by_customer' : 'traditional');
          
          if (detectedMode === 'order_by_customer') {
            // El pedido fue creado en modo clientes, usar estructura de clientes
            reconstructCustomersFromOrderDetails(response.data.order_details);
          } else {
            // El pedido fue creado en modo tradicional, usar estructura tradicional
            orderStore.orders = response.data.order_details;
            resetTraditionalInitialState();
          }
        }
      }).catch((error) => {
        if (error.response.status === 404) {
          // No hay pedido existente - usar configuración actual para nuevos pedidos
          orderCreationMode.value = settingsStore.businessSettings?.order?.order_by_customer ? 'order_by_customer' : 'traditional';
          
          if (settingsStore.businessSettings?.order?.order_by_customer) {
            customers.value = [];
            customers_initial.value = [];
            selectedCustomerId.value = null;
          } else {
            orderStore.orders = [];
            saleStore.order_initial = [];
          }
          orderStore.orderId = null;
          
          // Inicializar estado del usuario para nuevos pedidos
          if (userStore.user.role === 'MOZO') {
            orderUser.value = userStore.user.id;
          }
          orderUser_initial.value = orderUser.value;
        } else {
          console.error(error);
          message.error("Algo salió mal...");
        }
      });
    };

    // Nueva función para reconstruir la estructura de clientes desde order_details
    const reconstructCustomersFromOrderDetails = (orderDetails) => {
      console.log('Reconstruyendo clientes desde order_details:', orderDetails);
      
      const customersMap = new Map();
      let maxCustomerId = 0;

      // Procesar cada order_detail
      orderDetails.forEach(orderDetail => {
        // Solo procesar si tiene información mínima válida
        if (!orderDetail.product && !orderDetail.product_id) {
          console.warn('Order detail sin product_id válido:', orderDetail);
          return;
        }
        
        const customerId = orderDetail.customer_id || 'default';
        const customerName = orderDetail.customer_name || 'Cliente sin nombre';

        // Solo procesar si el customer_name no está vacío o es un valor por defecto válido
        if (!customerName || customerName.trim() === '') {
          console.warn('Order detail sin customer_name válido:', orderDetail);
          return;
        }

        // Actualizar el contador de IDs de cliente
        if (typeof customerId === 'number' && customerId > maxCustomerId) {
          maxCustomerId = customerId;
        }

        // Si no existe el cliente en el mapa, crearlo
        if (!customersMap.has(customerId)) {
          customersMap.set(customerId, {
            id: customerId,
            name: customerName,
            orders: []
          });
        }

        // Agregar el pedido al cliente
        const customer = customersMap.get(customerId);
        customer.orders.push({
          id: orderDetail.id,
          product_id: orderDetail.product,
          product_name: orderDetail.product_name || 'Producto desconocido',
          quantity: orderDetail.quantity,
          price: parseFloat(orderDetail.price || 0),
          subTotal: parseFloat(orderDetail.quantity * (orderDetail.price || 0)),
          modified: orderDetail.modified || '',
          indication: orderDetail.indication || [],
          customer_id: customerId
        });
      });

      // Convertir el mapa a array y asignar a customers
      customers.value = Array.from(customersMap.values());

      // Actualizar el contador de customer ID para nuevos clientes
      customerIdCounter = maxCustomerId + 1;

      // Si hay clientes, seleccionar el primero por defecto
      if (customers.value.length > 0) {
        selectedCustomerId.value = customers.value[0].id;
      }

      // Guardar el estado inicial para comparación de cambios
      resetCustomersInitialState();

      console.log('Clientes reconstruidos:', customers.value);
    };

    // Función para actualizar solo los IDs de los pedidos sin perder la estructura de clientes
    const updateOrderIdsFromResponse = (orderDetails, currentCustomers) => {
      console.log('Actualizando IDs sin reconstruir clientes:', { orderDetails, currentCustomers });
      
      // Restaurar la estructura actual pero actualizar con datos del backend
      currentCustomers.forEach(customer => {
        customer.orders.forEach(order => {
          // Buscar el order_detail correspondiente en la respuesta del backend
          const matchingDetail = orderDetails.find(detail => {
            // Intentar hacer match por product_id y customer_id
            const productMatch = (detail.product === order.product_id || detail.product_id === order.product_id);
            const customerMatch = (detail.customer_id === customer.id || !detail.customer_id);
            return productMatch && customerMatch;
          });
          
          if (matchingDetail) {
            // Actualizar el ID si el backend devolvió uno
            if (matchingDetail.id && !order.id) {
              order.id = matchingDetail.id;
              console.log(`Actualizando ID de producto ${order.product_id} para cliente ${customer.name}: ${matchingDetail.id}`);
            }
            
            // También actualizar otros campos que pudieran haber cambiado
            if (matchingDetail.quantity !== undefined) {
              order.quantity = matchingDetail.quantity;
            }
            if (matchingDetail.price !== undefined) {
              order.price = parseFloat(matchingDetail.price);
              order.subTotal = order.quantity * order.price;
            }
          }
        });
      });

      // Restaurar la estructura actualizada
      customers.value = currentCustomers;
      
      // Actualizar también el estado inicial
      resetCustomersInitialState();
      
      console.log('Clientes actualizados con nuevos IDs:', customers.value);
    };

    onMounted(async () => {
      await performRetrieveTableOrder();
      
      // Si el usuario es MOZO, asignar automáticamente su ID como orderUser
      if (userStore.user.role === 'MOZO') {
        orderUser.value = userStore.user.id;
      }
      
      // Guardar el estado inicial del usuario para detectar cambios
      orderUser_initial.value = orderUser.value;
      
      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
    });

    const performCreateTableOrder = async () => {
      loading.value = true;
      
      // Para creación, usar la configuración actual (no el modo detectado)
      const isOrderByCustomer = settingsStore.businessSettings?.order?.order_by_customer || false;
      
      // Actualizar el modo de creación para el nuevo pedido
      orderCreationMode.value = isOrderByCustomer ? 'order_by_customer' : 'traditional';
      
      // Preparar los detalles del pedido con la nueva estructura unificada
      let order_details;
      
      if (isOrderByCustomer) {
        // Modo: Pedidos por cliente
        order_details = [];
        customers.value.forEach(customer => {
          customer.orders.forEach(order => {
            const orderDetail = {
              product: order.product_id,
              quantity: order.quantity,
              indication: order.indication || [],
              product_fitting: null,
              customer_id: customer.id,
              customer_name: customer.name
            };
            
            // Incluir user_id específico si existe en el order (mozo asignado diferente al principal)
            if (order.user_id && order.user_id !== orderUser.value) {
              orderDetail.user_id = order.user_id;
            }
            
            order_details.push(orderDetail);
          });
        });
      } else {
        // Modo tradicional
        order_details = orderStore.orderList.map(order => {
          const orderDetail = {
            product: order.product,
            quantity: order.quantity,
            indication: order.indication || [],
            product_fitting: null
          };
          
          // Incluir user_id específico si existe en el order (mozo asignado diferente al principal)
          if (order.user_id && order.user_id !== orderUser.value) {
            orderDetail.user_id = order.user_id;
          }
          
          return orderDetail;
        });
      }
      
      await createTableOrder(
        route.params.table,
        order_details,
        orderUser.value, // Mozo asignado (se enviará como 'user_id' al backend)
        isOrderByCustomer ? "" : (ask_for.value || "")
      ).then(async (response) => {
        if (response.status === 201) {
          // Establecer el ID del pedido
          orderStore.orderId = response.data.id;
          
          // Si estamos en modo clientes y la respuesta incluye order_details, reconstruir la estructura
          if (isOrderByCustomer && response.data.order_details) {
            reconstructCustomersFromOrderDetails(response.data.order_details);
          } else if (isOrderByCustomer) {
            // Si estamos en modo clientes pero no hay order_details, reinicializar el estado
            resetCustomersInitialState();
          }
          
          pdfData.value = response.data;
          showPdf.value = true;
          setTimeout(() => ticketPreview.value.generate(), 250);
          checkState.value = true;
        }
      }).catch((error) => {
        console.error(error);
        message.error("Error al crear el pedido");
      }).finally(() => {
        userConfirm.value = "";
        loadingConfirm.value = false;
        showUserConfirm.value = false;
        loading.value = false;
      });
    };

    const evalOrderList = (details) => {
      let list = [];
      details.forEach((order) => {
        let item = saleStore.order_initial.find((v) => v.id === order.id);
        if (!!item && order.quantity > item.quantity) {
          let newOrder = cloneDeep(order);
          newOrder.quantity = order.quantity - item.quantity;
          newOrder.indication = newOrder.indication.slice(order.quantity - 1);
          list.push(newOrder);
        } else if (
          !!item &&
          JSON.stringify(order.indication) !== JSON.stringify(item.indication)
        ) {
          let newOrder = cloneDeep(order);
          list.push(newOrder);
        } else if (typeof item === "undefined") {
          list.push(order);
        }
      });
      return list;
    };

    const performUpdateTableOrder = async () => {
      loading.value = true;
      
      // Para actualización, usar el modo en que fue creado originalmente el pedido
      const isOrderByCustomer = orderCreationMode.value === 'order_by_customer';
      
      let order_details;
      
      if (isOrderByCustomer) {
        // Modo: Pedidos por cliente
        order_details = [];
        customers.value.forEach(customer => {
          customer.orders.forEach(order => {
            const orderDetail = {
              product: order.product_id,
              quantity: order.quantity,
              indication: order.indication || [],
              product_fitting: null,
              customer_id: customer.id,
              customer_name: customer.name
            };
            
            // Solo incluir id si existe y es válido (para elementos existentes)
            if (order.id && order.id !== null && order.id !== undefined) {
              orderDetail.id = order.id;
            }
            
            // Incluir user_id específico si existe en el order (mozo asignado diferente al principal)
            if (order.user_id && order.user_id !== orderUser.value) {
              orderDetail.user_id = order.user_id;
            }
            
            order_details.push(orderDetail);
          });
        });
      } else {
        // Modo tradicional
        order_details = orderStore.orderList.map(order => {
          const orderDetail = {
            product: order.product,
            quantity: order.quantity,
            indication: order.indication || [],
            product_fitting: null
          };
          
          // Solo incluir id si existe y es válido (para elementos existentes)
          if (order.id && order.id !== null && order.id !== undefined) {
            orderDetail.id = order.id;
          }
          
          // Incluir user_id específico si existe en el order (mozo asignado diferente al principal)
          if (order.user_id && order.user_id !== orderUser.value) {
            orderDetail.user_id = order.user_id;
          }
          
          return orderDetail;
        });
      }
      
      console.log('Enviando al backend para actualización:', {
        mode: isOrderByCustomer ? 'order_by_customer' : 'traditional',
        order_details: order_details,
        currentCustomers: isOrderByCustomer ? customers.value : 'N/A'
      });
      
      await updateTableOrder(
        route.params.table,
        orderStore.orderId,
        order_details,
        orderUser.value, // Mozo asignado (se enviará como 'user_id' al backend)
        isOrderByCustomer ? "" : (ask_for.value || "")
      ).then(async (response) => {
        if (response.status === 202) {
          console.log('Respuesta del backend al actualizar:', response.data);
          
          // Si estamos en modo clientes, actualizar IDs sin perder la estructura
          if (isOrderByCustomer && response.data.order_details) {
            // Guardar la estructura actual de clientes antes de reconstruir
            const currentCustomers = JSON.parse(JSON.stringify(customers.value));
            
            // Verificar si la respuesta contiene información de clientes válida
            const hasValidCustomerData = response.data.order_details.some(detail => 
              detail.customer_id !== null && detail.customer_id !== undefined && 
              detail.customer_name && detail.customer_name.trim() !== '' && 
              detail.customer_name !== 'Cliente sin nombre'
            );
            
            console.log('¿Respuesta tiene datos válidos de clientes?', hasValidCustomerData);
            console.log('Order details recibidos:', response.data.order_details);
            
            if (hasValidCustomerData) {
              // Si hay datos válidos de clientes, reconstruir normalmente
              console.log('Reconstruyendo clientes desde respuesta del backend...');
              reconstructCustomersFromOrderDetails(response.data.order_details);
            } else {
              // Si no hay datos válidos, mantener estructura actual y solo actualizar IDs
              console.log('Manteniendo estructura actual y actualizando IDs...');
              updateOrderIdsFromResponse(response.data.order_details, currentCustomers);
            }
          } else if (isOrderByCustomer) {
            // Si estamos en modo clientes pero no hay order_details válidos, reinicializar estado
            resetCustomersInitialState();
          } else if (response.data.order_details) {
            // Modo tradicional: evaluar diferencias para el ticket
            response.data.order_details = evalOrderList(response.data.order_details);
          }
          
          pdfData.value = response.data;
          showPdf.value = true;
          setTimeout(() => ticketPreview.value.generate(), 250);
          checkState.value = true;
        }
      }).catch((error) => {
        console.error(error);
        message.error("Error al actualizar el pedido");
      }).finally(() => {
        userConfirm.value = "";
        loadingConfirm.value = false;
        showUserConfirm.value = false;
        loading.value = false;
      });
    };

    const nullifyTableOrder = async () => {
      if (!orderStore.orderList.length && orderStore.orderId) {
        await performNullifyTableOrder();
        /* dialog.error({
  title: "Anular pedido",
  content: "¿Está seguro?",
  positiveText: "Sí",
  negativeText: "No",
  onPositiveClick: async () => {
  await performNullifyTableOrder();
  },
}); */
      }
    };

    const performNullifyTableOrder = async () => {
      await cancelTableOrder(table, dataAnulate.value).then((response) => {
        if (response.status === 202) {
          message.success("Pedido anulado correctamente!");
          checkState.value = true;
          router.push({ name: "TableHome" });
        }
      }).catch((error) => {
        console.error(error);
        message.error("Algo salió mal...");
      });
    };

    const showConfirm = ref(false);

    const passConfirm = ref("");

    const deleteQuantity = ref(1);

    const maxQuantity = ref(1);

    const removingItem = ref({ ind: null, id: null });

    const performDeleteDetail = async () => {
      await performDeleteOrderDetail(
        route.params.table,
        removingItem.value.id,
        dataAnulate.value,
        deleteQuantity.value
      ).then((response) => {
        if (response.status === 204) {
          orderStore.orderList.splice(removingItem.value.ind, 1);
          saleStore.order_initial.splice(removingItem.value.ind, 1);
          nullifyTableOrder();
          message.success("Comanda eliminada");
          removingItem.value.ind = "";
          removingItem.value.id = "";
          passConfirm.value = "";
          deleteQuantity.value = 1;
          maxQuantity.value = 1;
          showConfirm.value = false;
          dataAnulate.value = { username: "", pass: "" };
        } else if (response.status === 202) {
          orderStore.orderList[removingItem.value.ind].quantity -=
            response.data.quantity;
          saleStore.order_initial[removingItem.value.ind].quantity -=
            response.data.quantity;
          saleStore.order_initial[removingItem.value.ind].subTotal =
            saleStore.order_initial[removingItem.value.ind].quantity *
            saleStore.order_initial[removingItem.value.ind].price;
          message.success("Comanda actualizada correctamente");
          removingItem.value.ind = "";
          removingItem.value.id = "";
          passConfirm.value = "";
          deleteQuantity.value = 1;
          dataAnulate.value = { username: "", pass: "" };
          maxQuantity.value = 1;
          showConfirm.value = false;
        }
      }).catch((error) => {
        console.error(error);
        message.error("Error al anular, verifique sus datos...");
      });
    };

    const deleteOrderDetail = (detailIndex, detailId) => {
      removingItem.value.ind = detailIndex;
      removingItem.value.id = detailId;
      deleteQuantity.value = saleStore.getOrderQuantity(detailId);
      maxQuantity.value = saleStore.getOrderQuantity(detailId);
      showConfirm.value = true;
    };

    const searching = ref(false);

    const productSearch = ref("");

    const products = ref([]);

    const productOptions = computed(() => {
      return products.value.map((product) => ({
        value: product.id,
        label: product.name,
        disabled: product.is_disabled,
        category: productStore.getCategorieDescription(product.category),
        stock: product.stock
      }));
    });

    const showOptions = (value) => {
      if (value.length >= 3) {
        searching.value = true;
        searchProductByName(value).then((response) => {
          if (response.status === 200) {
            products.value = response.data;
          }
        }).catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        }).finally(() => {
          searching.value = false;
        });
        return true;
      }
      return false;
    };

    const selectProduct = (v) => {
      const item = products.value.find((product) => product.id === v);
      if (item.has_supplies) {
        if (item.has_stock) {
          if (settingsStore.businessSettings.order.order_by_customer) {
            if (selectedCustomerId.value) {
              addOrderToCustomer(item, selectedCustomerId.value);
            }
          } else {
            orderStore.addOrder(item);
          }
        }
      }
    };

    // Computed para obtener el order actual para el modal de indicaciones
    const currentOrder = computed(() => {
      if (settingsStore.businessSettings.order.order_by_customer) {
        // Para el modo de clientes, necesitamos encontrar el order correcto
        let globalIndex = 0;
        for (let customer of customers.value) {
          for (let order of customer.orders) {
            if (globalIndex === itemIndex.value) {
              return order;
            }
            globalIndex++;
          }
        }
        return null;
      } else {
        // Modo tradicional
        return orderStore.orderList[itemIndex.value];
      }
    });

    // Computed para opciones de clientes
    const customerOptions = computed(() => {
      return customers.value.map(customer => ({
        label: customer.name,
        value: customer.id
      }));
    });

    // Función auxiliar para reinicializar el estado después de operaciones exitosas
    const resetCustomersInitialState = () => {
      customers_initial.value = cloneDeep(customers.value);
      orderUser_initial.value = orderUser.value;
      console.log('Estado inicial de clientes y usuario reinicializado');
    };

    // Función auxiliar para reinicializar el estado en modo tradicional
    const resetTraditionalInitialState = () => {
      saleStore.order_initial = cloneDeep(orderStore.orderList);
      orderUser_initial.value = orderUser.value;
      console.log('Estado inicial tradicional y usuario reinicializado');
    };

    // Funciones para manejo de clientes
    const addCustomer = () => {
      if (newCustomerName.value.trim()) {
        const newCustomer = {
          id: customerIdCounter++,
          name: newCustomerName.value.trim(),
          orders: []
        };
        customers.value.push(newCustomer);
        selectedCustomerId.value = newCustomer.id;
        newCustomerName.value = "";
      }
    };

    const confirmRemoveCustomer = (customerIndex, customerName) => {
      dialog.warning({
        title: "Confirmar eliminación",
        content: `¿Está seguro que desea eliminar al cliente "${customerName}" y todos sus pedidos?`,
        positiveText: "Sí, eliminar",
        negativeText: "Cancelar",
        onPositiveClick: () => {
          removeCustomer(customerIndex);
          message.success(`Cliente "${customerName}" eliminado correctamente`);
        }
      });
    };

    const removeCustomer = (customerIndex) => {
      const customer = customers.value[customerIndex];
      if (selectedCustomerId.value === customer.id) {
        selectedCustomerId.value = null;
      }
      customers.value.splice(customerIndex, 1);
    };

    const addOrderToCustomer = (product, customerId) => {
      const customer = customers.value.find(c => c.id === customerId);
      if (customer) {
        const existingOrder = customer.orders.find(order => order.product_id === product.id);
        if (existingOrder) {
          existingOrder.quantity += 1;
          const price = existingOrder.price || 0;
          existingOrder.subTotal = existingOrder.quantity * price;
        } else {
          const price = product.prices || product.price || 0;
          const newOrder = {
            id: null,
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            price: parseFloat(price),
            subTotal: parseFloat(price),
            modified: "",
            indication: [],
            customer_id: customerId
          };
          customer.orders.push(newOrder);
        }
      }
    };

    const getCustomerOrders = (customerId) => {
      const customer = customers.value.find(c => c.id === customerId);
      return customer ? customer.orders : [];
    };

    const getCustomerTotal = (customerId) => {
      const customer = customers.value.find(c => c.id === customerId);
      if (!customer) return 0;

      const total = customer.orders.reduce((total, order) => {
        const subTotal = order.subTotal || 0;
        return total + (isNaN(subTotal) ? 0 : subTotal);
      }, 0);

      return isNaN(total) ? 0 : total;
    };

    const getTotalAmount = () => {
      const total = customers.value.reduce((total, customer) => {
        const customerTotal = customer.orders.reduce((customerTotal, order) => {
          const subTotal = order.subTotal || 0;
          return customerTotal + (isNaN(subTotal) ? 0 : subTotal);
        }, 0);
        return total + (isNaN(customerTotal) ? 0 : customerTotal);
      }, 0);

      return isNaN(total) ? 0 : total;
    };

    // Función auxiliar para formatear precios de manera segura
    const formatPrice = (value) => {
      const numValue = Number(value);
      return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
    };

    const hasAnyOrders = () => {
      return customers.value.some(customer => customer.orders.length > 0);
    };

    const removeProductFromCustomer = (customerId, orderIndex, orderId) => {
      const customer = customers.value.find(c => c.id === customerId);
      if (customer) {
        if (!orderId) {
          // Producto nuevo, solo remover de la lista
          customer.orders.splice(orderIndex, 1);
        } else {
          // Producto existente, usar lógica de eliminación existente
          // Aquí puedes implementar la lógica similar a deleteOrderDetail
          customer.orders.splice(orderIndex, 1);
        }
      }
    };

    const getGlobalOrderIndex = (customerId, localOrderIndex) => {
      // Esta función ayuda a mantener compatibilidad con el modal de indicaciones
      let globalIndex = 0;
      for (let customer of customers.value) {
        if (customer.id === customerId) {
          return globalIndex + localOrderIndex;
        }
        globalIndex += customer.orders.length;
      }
      return globalIndex;
    };

    // Función para navegar al pago preparando los datos correctamente
    const navigateToPayment = () => {
      // Usar el modo detectado del pedido, no la configuración actual
      if (orderCreationMode.value === 'order_by_customer') {
        // Modo clientes: convertir la estructura de clientes a orderList para compatibilidad
        const flattenedOrders = [];
        customers.value.forEach(customer => {
          customer.orders.forEach(order => {
            // Buscar el producto original para obtener sus propiedades tributarias
            const originalOrder = orderStore.orders.find(o => o.id === order.id);
            
            flattenedOrders.push({
              id: order.id,
              product: order.product_id,
              product_name: order.product_name,
              quantity: order.quantity,
              price: order.price,
              subTotal: order.subTotal,
              modified: order.modified,
              indication: order.indication,
              // Usar los valores reales del producto, no hardcoded
              product_affectation: originalOrder?.affectation || 20, // 20 = exonerado por defecto
              product_igv: originalOrder?.igv_tax || 0, // Sin IGV por defecto
              icbper: originalOrder?.icbper || false,
              icbper_amount: originalOrder?.icbper_amount || 0,
              // Información del cliente para referencia
              customer_id: customer.id,
              customer_name: customer.name
            });
          });
        });
        
        console.log('TableOrder - Preparando datos para pago en modo clientes:', flattenedOrders);
        
        // Actualizar orderStore.orders temporalmente para el pago
        orderStore.orders = flattenedOrders;
      }
      // En modo tradicional, orderStore.orders ya tiene los datos correctos
      
      // Navegar a la pantalla de pago
      router.push({
        name: 'TablePayment',
        params: { table: route.params.table },
      });
    };

    const searchProductOption = (v) => {
      if (!products.value || !Array.isArray(products.value)) {
        return null;
      }
      const item = products.value.find((product) => product.id === v);
      return item ? item : null;
    };

    const renderLabel = (option) => {
      const t = option.label.split("-");
      let color = "#3B689F";
      let text = "MESA";
      if (t.length > 1) {
        if (t[1].includes("LL")) {
          color = "#926ED7";
          text = "PARA LLEVAR";
        } else if (t[1].includes("D")) {
          color = "#995C4E";
          text = "DELIVERY";
        }
      }
      
      // Obtener producto de forma segura
      const productOption = searchProductOption(option.value);
      const hasStock = productOption?.has_stock || false;
      const hasSupplies = productOption?.has_supplies || false;
      
      return h(
        NThing,
        {},
        {
          default: () => "",
          header: () =>
            h(
              NText,
              {
                delete: !hasStock || !hasSupplies,
                type: hasSupplies ? (hasStock ? "default" : "error") : "error"
              },
              {
                default: () => t[0]
              }
            ),
          description: () =>
            h(
              NSpace,
              {},
              {
                default: () => [
                  h(
                    NTag,
                    {
                      size: "small",
                      type: "info"
                    },
                    {
                      default: () =>
                        option.category.toLowerCase().includes("menu")
                          ? "MENU"
                          : option.category.toLowerCase().includes("comb")
                            ? "COMBO"
                            : "CARTA"
                    }
                  ),
                  h(
                    NTag,
                    {
                      size: "small",
                      color: {
                        color: lighten(color, 48),
                        textColor: color,
                        borderColor: lighten(color, 24)
                      }
                    },
                    {
                      default: () => text
                    }
                  ),
                  h(
                    NTag,
                    {
                      size: "small",
                      type: "info"
                    },
                    {
                      default: () => option.category
                    }
                  ),
                  option.stock ?
                    h(
                      NTag,
                      {
                        size: "small",
                        type: "info"
                      },
                      {
                        default: () => `Stock: ${option.stock}`
                      }
                    ) : ''
                ]
              }
            )
        }
      );
    };

    const showUserConfirm = ref(false);

    const loadingConfirm = ref(false);

    const userConfirm = ref("");

    const handleBack = () => {
      router.push({ name: "TableHome" });
    };

    const validateSend = () => {
      // Flujo unificado para ambos modos
      if (!orderStore.orderId) {
        performCreateTableOrder();
      } else {
        performUpdateTableOrder();
      }
    };

    const ticketPreview = ref(null);

    const showPdf = ref(false);

    const pdfData = ref(null);

    // Proveer funciones para componentes hijos
    provide('addOrderToCustomer', addOrderToCustomer);
    provide('selectedCustomerId', selectedCustomerId);

    return {
      showModal,
      itemIndex,
      table,
      listType,
      userStore,
      orderStore,
      dataAnulate,
      saleStore,
      handleBack,
      renderLabel,
      performCreateTableOrder,
      performUpdateTableOrder,
      performNullifyTableOrder,
      deleteOrderDetail,
      searching,
      rules,
      checkState,
      productSearch,
      productOptions,
      showOptions,
      selectProduct,
      nullifyTableOrder,
      showConfirm,
      passConfirm,
      performDeleteDetail,
      deleteQuantity,
      maxQuantity,
      genericsStore,
      showUserConfirm,
      userConfirm,
      loadingConfirm,
      validateSend,
      loading,
      tableStore,
      ask_for,
      activeUsersStore,
      orderUser,
      settingsStore,
      ticketPreview,
      showPdf,
      pdfData,
      // Nuevas variables y funciones para clientes
      customers,
      customers_initial,
      newCustomerName,
      selectedCustomerId,
      customerOptions,
      currentOrder,
      addCustomer,
      confirmRemoveCustomer,
      removeCustomer,
      getCustomerOrders,
      getCustomerTotal,
      getTotalAmount,
      hasAnyOrders,
      removeProductFromCustomer,
      getGlobalOrderIndex,
      formatPrice,
      navigateToPayment,
      resetCustomersInitialState,
      // Computed properties para determinar qué vista mostrar
      shouldShowCustomerMode,
      shouldShowCustomerForm,
      shouldAllowAddingProducts,
      effectiveOrderMode
    };
  }
});
</script>

<style lang="scss">
.slide-enter-active,
.slide-leave-active {
  transition: opacity 1s, transform 1s;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}

.n-form-item .n-form-item-feedback-wrapper {
  min-height: 12px;
}

#TableOrder {
  height: calc(100vh - 140px); // Ajustar según el header del layout y márgenes
  display: flex;
  flex-direction: column;
  overflow: hidden; // Prevenir desbordamiento del contenedor principal

  .n-page-header {
    flex-shrink: 0; // No se encoge
    margin-bottom: 0.5rem;
  }

  >.n-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0; // Permite que flexbox funcione correctamente
    overflow: hidden; // Prevenir desbordamiento

    >.n-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 12px; // Reducir padding para más espacio
      overflow: hidden; // Prevenir desbordamiento

      .n-grid {
        flex: 1;
        min-height: 0;
        overflow: hidden; // Prevenir desbordamiento

        .n-gi:last-child {
          display: flex;
          flex-direction: column;
          overflow: hidden; // Prevenir desbordamiento

          >.n-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden; // Prevenir desbordamiento

            >.n-card__content {
              flex: 1;
              display: flex;
              flex-direction: column;
              min-height: 0;
              overflow: hidden; // Prevenir desbordamiento

              .n-form {
                flex-shrink: 0; // El formulario no se encoge
                margin-bottom: 1rem;
              }

              .orders-container {
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
                overflow: hidden; // Prevenir desbordamiento del contenedor

                .orders-scrollbar {
                  flex: 1;
                  min-height: 0;
                  max-height: 100%; // Limitar altura máxima
                  overflow: auto; // Permitir scroll cuando sea necesario

                  // Asegurar que el contenido del scroll sea visible
                  .n-scrollbar-content {
                    min-height: 100%;
                    padding-right: 8px; // Espacio para el scrollbar
                  }
                }

                // Contenedor de acciones siempre visible
                .order-actions {
                  flex-shrink: 0;
                  background: #f8f9fa;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                  .n-button {
                    font-weight: 600;
                  }
                }
              }

              // El botón de realizar pedido para modo clientes debe estar fuera del scroll
              >.n-card.mt-3 {
                flex-shrink: 0;
                margin-top: 1rem;
              }
            }
          }
        }
      }
    }
  }
}

// Asegurar que las tablas no se desborden
.orders-container .n-table {
  min-width: 100%;
  table-layout: fixed; // Forzar que las columnas respeten los anchos definidos
}

// Estilos específicos para las tarjetas de clientes
.orders-container .n-card.mb-3 {
  margin-bottom: 1rem;
  width: 100%; // Asegurar que no se desborde
  box-sizing: border-box; // Incluir padding y border en el ancho
  border: 2px solid #e9ecef;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: #007bff;
  }

  &:last-child {
    margin-bottom: 0;
  }

  // Mejorar el header de la tarjeta
  .n-card-header {
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .n-card-header__main {
      font-weight: 600;
      color: #495057;
    }
  }

  // Limitar el ancho de las columnas de la tabla
  .n-table {

    th,
    td {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:nth-child(1) {
        width: 10%;
        min-width: 40px;
      }

      &:nth-child(2) {
        width: 40%;
        min-width: 100px;
      }

      &:nth-child(3) {
        width: 25%;
        min-width: 80px;
      }

      &:nth-child(4) {
        width: 15%;
        min-width: 70px;
      }

      &:nth-child(5) {
        width: 10%;
        min-width: 40px;
      }
    }
  }

  // Estilo para mensaje vacío
  .n-empty {
    padding: 2rem 1rem;
    color: #6c757d;
    font-style: italic;
  }
}

// Estilos para el contenedor de scroll
.orders-scrollbar {

  // Asegurar que el scrollbar no cause desbordamiento
  .n-scrollbar-rail {
    right: 2px !important;
  }
}

// Estilos adicionales para evitar desbordamiento horizontal
.orders-container {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden; // Prevenir scroll horizontal
}

// Estilos para dispositivos móviles
@media (max-width: 768px) {
  #TableOrder {
    height: calc(100vh - 120px);

    .n-grid {
      .n-gi:first-child {
        margin-bottom: 1rem;
      }
    }
  }
}

// Estilos para prevenir desbordamiento en todos los contenedores
* {
  box-sizing: border-box;
}

.n-card {
  overflow: hidden;
}

.n-card__content {
  overflow: hidden;
}

// Asegurar que los elementos de input no se desborden
.n-input-group {
  width: 100%;
  max-width: 100%;
}

.n-auto-complete {
  width: 100%;
  max-width: 100%;
}

.n-select {
  width: 100%;
  max-width: 100%;
}

// Ajustes específicos para las tablas dentro de las tarjetas de cliente
.orders-container .n-card .n-table-wrapper {
  overflow-x: auto;
  max-width: 100%;
}

.orders-container .n-card .n-table {
  min-width: 100%;
  max-width: 100%;
  width: 100%;
}
</style>
