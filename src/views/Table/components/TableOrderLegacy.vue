<template>
    <n-page-header class="mb-2" @back="handleBack">
        <template #title>
            <n-space justify="space-between">
                <n-text class="fs-2">{{ tableStore.getTableByID(table)?.description }}</n-text>
            </n-space>
        </template>
    </n-page-header>
    <n-card content-class="p-0">
        <n-grid responsive="screen" cols="1 m:10" :x-gap="4">
            <n-gi :span="!shouldShowCustomerMode ? '6' : '5 xl:6'" style="height: calc(100vh - 165px);">
                <router-view />
            </n-gi>
            <n-gi :span="!shouldShowCustomerMode ? '4' : '5 xl:4'" style="height: calc(100vh - 165px);">
                <n-card
                    title="Pedidos"
                    :bordered="false"
                    class="h-100"
                    content-class="overflow-auto"
                >
                    <template #header-extra>
                        <div v-if="userStore.hasPermission('charge_order')">
                            <n-button v-if="!($route.name === 'TablePayment')" type="success"
                                :disabled="!orderStore.orderId" text @click="navigateToPayment">
                                <v-icon class="me-1" name="fa-coins" />
                                <span class="fs-6">Cobrar</span>
                            </n-button>
                            <router-link
                                v-else
                                class="text-decoration-none"
                                :to="{
                                    name: 'ProductCategories',
                                    params: {
                                        table: $route.params.table
                                    }
                                }"
                            >
                                <n-button type="info" text>
                                    <v-icon
                                        class="me-1"
                                        name="md-add-round"
                                    />
                                    <span class="fs-6">Añadir pedido</span>
                                </n-button>
                            </router-link>
                        </div>
                    </template>

                    <template #default>
                        <n-scrollbar>
                            <div>
                                <n-form v-if="!($route.name === 'TablePayment')">
                                    <n-grid cols="2" x-gap="12">
                                        <n-form-item-gi
                                            v-if="shouldEnterCustomerName"
                                            :span="!shouldEnterCustomerName ? 2 : 1"
                                            label="Cliente"
                                        >
                                            <n-input
                                                v-model:value="ask_for"
                                                placeholder="Nombre del cliente"
                                                :readonly="userStore.user.role === 'MOZO'"
                                                :disabled="userStore.user.role === 'MOZO'"
                                            />
                                        </n-form-item-gi>
                                        <n-form-item-gi
                                            v-if="shouldSelectOrderUser"
                                            :span="!shouldEnterCustomerName ? 2 : 1"
                                            label="Mozo"
                                        >
                                            <n-select
                                                :options="waiterUsersOptions"
                                                v-model:value="orderUser"
                                                placeholder="Seleccione un mozo"
                                                filterable
                                            />
                                        </n-form-item-gi>
                                        <n-form-item-gi
                                            v-if="shouldShowCustomerMode"
                                            :span="!shouldShowCustomerMode ? 2 : customers.length > 0 ? 1 : 2"
                                            label="Agregar Cliente"
                                        >
                                            <n-input-group>
                                                <n-input
                                                    v-model:value="newCustomerName"
                                                    placeholder="Nombre del cliente"
                                                    @keyup.enter="addCustomer"
                                                />
                                                <n-button
                                                    type="primary"
                                                    @click="addCustomer"
                                                    :disabled="!newCustomerName.trim()"
                                                >
                                                    <v-icon class="me-1" name="md-personadd-round" />
                                                </n-button>
                                            </n-input-group>
                                        </n-form-item-gi>
                                        <n-form-item-gi
                                            v-if="shouldShowCustomerMode && customers.length > 0"
                                            :span="1"
                                            label="Seleccionar Cliente"
                                        >
                                            <n-select
                                                :options="customerOptions"
                                                v-model:value="selectedCustomerId"
                                                placeholder="Seleccione un cliente"
                                                filterable
                                            />
                                        </n-form-item-gi>
                                        <n-form-item-gi
                                            v-if="shouldAllowAddingProducts"
                                            :span="2"
                                            label="Buscar producto"
                                        >
                                            <n-input-group>
                                                <n-auto-complete
                                                    v-model:value="productSearch"
                                                    :options="productOptions"
                                                    :get-show="showOptions"
                                                    :loading="searching"
                                                    :render-label="renderLabel"
                                                    :input-props="{ autocomplete: 'disabled' }"
                                                    placeholder="Nombre del producto"
                                                    clear-after-select
                                                    @select="selectProduct"
                                                />
                                            </n-input-group>
                                        </n-form-item-gi>
                                    </n-grid>
                                </n-form>

                                <!-- Tabla original para modo sin clientes -->
                                <n-table v-else size="small" >
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
                                      <!-- Menús -->
                                      <template v-for="(menu, menuIndex) in orderStore.menuSets" :key="`menu-table-${menuIndex}`">
                                          <tr style="background-color: #f8f8f8">
                                              <td>
                                                  <n-button type="warning" text>
                                                      <v-icon name="md-restaurant-round"/>
                                                  </n-button>
                                              </td>
                                              <td><b>Menú: {{ menu.name }}</b></td>
                                              <td></td>
          <!--                                     <td>
                                                  <n-input-number v-if="!isPaymentRoute" size="small" :min="1"
                                                      v-model:value="menu.quantity" @click.stop />
                                                  <template v-else>{{ menu.quantity }}</template>
                                              </td> -->
                                              <td>S/. {{ formatPrice(menu.price * menu.quantity) }}</td>
                                              <td>
                                                  <n-button v-if="!isPaymentRoute" type="error" text @click.stop="handleRemoveMenuSet(menuIndex)">
                                                      <v-icon name="md-disabledbydefault-round" />
                                                  </n-button>
                                              </td>
                                          </tr>
                                          <!-- Items del menú -->
                                          <tr v-for="item in menu.items" :key="`menu-item-table-${item.product_id}`" style="background-color: #fafafa">
                                              <td></td>
                                              <td style="padding-left: 20px;">
                                                  {{ item.product_name }}
                                                  <small v-if="item.phase_name">({{ item.phase_name }})</small>
                                              </td>
                                              <td>{{ item.quantity }}</td>
                                              <td></td>
                                              <td></td>
                                          </tr>
                                      </template>

                                      <!-- Productos individuales -->
                                      <template v-for="(order, index) in orderStore.productLines" :key="`product-table-${index}`">
                                          <tr v-if="order.quantity > 0" style="cursor: pointer" @click="openOrderModal(index)">
                                              <td>
                                                  <n-button v-if="!isPaymentRoute" type="info" text><v-icon name="md-listalt-round" /></n-button>
                                              </td>
                                              <td>
                                                  <span>{{ order.product_name }}</span><br>
                                                  <span style="color: #15151c; font-size: 12px;">{{ order.modified }}</span>
                                              </td>
                                              <td>
                                                  <n-input-number v-if="!isPaymentRoute" size="small" :min="order.id ? saleStore.getOrderQuantity(order.id) : 1"
                                                      v-model:value="order.quantity" @click.stop />
                                                  <template v-else>{{ order.quantity }}</template>
                                              </td>
                                              <td>S/. {{ formatPrice(order.subTotal) }}</td>
                                              <td>
                                                  <n-button v-if="!isPaymentRoute" type="error" text @click.stop="handleRemoveProductLine(index)">
                                                      <v-icon name="md-disabledbydefault-round" />
                                                  </n-button>
                                              </td>
                                          </tr>
                                      </template>

                                      <tr v-if="orderStore.orderList.length === 0">
                                          <td colspan="5">
                                              <n-empty description="No hay productos agregados" size="small" class="my-4" />
                                          </td>
                                      </tr>
                                  </tbody>
                                  <tfoot>
                                      <tr>
                                          <td colspan="3">
                                              <n-button v-if="!isPaymentRoute" :type="orderStore.orderId ? 'info' : 'primary'" :loading="loading"
                                                  :disabled="orderChanged" @click="validateSend()" text block>
                                                  <v-icon class="me-2" name="md-notealt-twotone" scale="1.5" />
                                                  <span class="fs-4">{{ orderStore.orderId ? 'Actualizar' : 'Realizar' }} pedido</span>
                                              </n-button>
                                          </td>
                                          <td colspan="2" class="fs-6 fw-bold">S/. {{ formattedTotals.grandTotal }}</td>
                                      </tr>
                                  </tfoot>
                                </n-table>

                                <!-- Nueva tabla para modo con clientes -->
                                <div v-else>
                                    <template v-for="(customer, customerIndex) in customers" :key="customer.id">
                                        <n-card
                                            class="mb-4"
                                            size="small"
                                            :title="customer.name"
                                            :bordered="false"
                                            header-class="p-0 pb-2"
                                            content-class="p-0"
                                        >
                                            <template #header-extra>
                                                <n-space>
                                                    <n-text class="fs-6 fw-bold">
                                                        S/. {{ formatPrice(getCustomerTotal(customer.id)) }}
                                                    </n-text>
                                                    <n-button
                                                        v-if="!($route.name === 'TablePayment')"
                                                        type="error"
                                                        size="small"
                                                        @click="confirmRemoveCustomer(customerIndex, customer.name)"
                                                        :title="`Eliminar cliente ${customer.name}`">
                                                        <v-icon name="md-delete-round" />
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
                                                    <template v-for="(order, orderIndex) in getCustomerOrders(customer.id)"
                                                        :key="orderIndex">
                                                        <tr
                                                            v-if="order.quantity > 0"
                                                            style="cursor: pointer"
                                                            @click="
                                                                itemIndex = getGlobalOrderIndex(order.id);
                                                                showModal = true;
                                                            "
                                                        >
                                                            <td>
                                                                <n-button v-if="!($route.name === 'TablePayment')"
                                                                    type="info" text>
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
                                                                <n-input-number v-if="!($route.name === 'TablePayment')"
                                                                    class="border-top-0" size="small"
                                                                    :min="order.id ? saleStore.getOrderQuantity(order.id) : 1"
                                                                    v-model:value="order.quantity" @click.stop />
                                                                <template v-else>
                                                                    {{ order.quantity }}
                                                                </template>
                                                            </td>
                                                            <td>S/. {{ formatPrice(order.subTotal) }}</td>
                                                            <td>
                                                                <n-button
                                                                    v-if="!($route.name === 'TablePayment')"
                                                                    type="error"
                                                                    text
                                                                    @click.stop="removeProduct(order.id)"
                                                                >
                                                                    <v-icon name="md-disabledbydefault-round" />
                                                                </n-button>
                                                            </td>
                                                        </tr>
                                                    </template>
                                                </tbody>
                                            </n-table>

                                            <n-empty v-if="getCustomerOrders(customer.id).length === 0" description="No hay productos agregados" size="small" class="my-4" />
                                        </n-card>
                                    </template>

                                    <n-empty v-if="customers.length === 0" description="No hay clientes agregados" class="m-4" />
                                </div>
                            </div>
                        </n-scrollbar>
                    </template>

                    <template #action>
                        <div v-if="shouldShowCustomerMode" class="order-actions p-2"
                            style="flex-shrink: 0; background: #f8f9fa; border-radius: 6px;">
                            <n-space vertical>
                                <n-space justify="space-between" align="center">
                                    <n-text class="fs-5 fw-bold">
                                        Total General: S/. {{ formatPrice(getTotalAmount()) }}
                                    </n-text>
                                    <n-text type="info">
                                        {{ customers.length }} cliente(s)
                                    </n-text>
                                </n-space>
                                <n-button
                                    v-if="!($route.name === 'TablePayment')"
                                    :loading="loading"
                                    :type="orderStore.orderId ? 'info' : 'primary'"
                                    :disabled="!hasAnyOrders() || checkState || loading"
                                    size="large"
                                    @click="validateSend()"
                                    block
                                >
                                    <v-icon class="me-2" name="md-notealt-twotone" scale="1.2" />
                                    <span class="fs-5">{{ orderStore.orderId ? 'Actualizar' : 'Realizar' }} pedido</span>
                                </n-button>
                            </n-space>
                        </div>
                    </template>
                </n-card>
            </n-gi>
        </n-grid>
        <n-modal
            title="Registrar pedido"
            preset="card"
            v-model:show="showUserConfirm"
            closable
            :mask-closable="false"
            :class="{
                'w-100': genericsStore.device === 'mobile',
                'w-50': genericsStore.device === 'tablet',
                'w-25': genericsStore.device === 'desktop',
            }"
        >
            <n-form-item label="Ingrese código de usuario">
                <n-input type="password" v-model:value="userConfirm" placeholder="****" />
            </n-form-item>
            <template #action>
                <n-space justify="end">
                    <n-button
                        type="success"
                        :loading="loading"
                        :disabled="!userConfirm || loading"
                        secondary
                        @click.prevent="orderStore.orderId
                            ? performUpdateTableOrder()
                            : performCreateTableOrder()
                        "
                    >
                        Confirmar
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
                            <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity"
                                style="width: 100%" />
                        </n-form-item>
                    </n-form>
                </div>
                <div v-else-if="settingsStore.businessSettings.sale.require_general_pass_to_null">
                    <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                        <n-form-item label="Ingrese la contraseña" path="pass">
                            <n-input type="password" v-model:value="dataAnulate.pass" />
                        </n-form-item>
                        <n-form-item label="Cantidad">
                            <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity"
                                style="width: 100%" />
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
        <OrderIndications
            v-model:show="showModal"
            preset="card"
            title="Indicaciones"
            :order="currentOrder"
            @success="showModal = false"
        />
        <ticket-preview ref="ticketPreview" v-model:show="showPdf" :data="pdfData" :hidden="true"
            :isUpdate="!!orderStore.orderId" @printed="() => $router.push({ name: 'TableHome' })"
            @canceled="() => $router.push({ name: 'TableHome' })" />
    </n-card>
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
import { useDebounce } from "@/composables/useDebounce";
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
        const customerIdCounter = ref(1);

        // Variables para el nuevo flujo de clientes
        const customers = ref([]);
        const newCustomerName = ref("");
        const selectedCustomerId = ref(null);

        // Variable para almacenar el estado inicial de clientes (para comparación de cambios)
        const customers_initial = ref([]);

        // Computed properties para determinar qué vista mostrar (DEBEN ir antes del watchEffect)
        const shouldShowCustomerMode = computed(() => orderStore.orderId
            ? orderStore.orderList.some(order => order.customer)
            : settingsStore.businessSettings?.order?.order_by_customer);

        const shouldEnterCustomerName = computed(() => settingsStore.businessSettings?.order?.order_customer_name && !shouldShowCustomerMode.value);

        const shouldSelectOrderUser = computed(() => settingsStore.businessSettings?.order?.select_order_user && (settingsStore.businessSettings?.order?.waiter_auth_mode || 'auto') !== 'code_on_confirm');
        const waiterUsersOptions = computed(() => {
            const allUsers = activeUsersStore.users || [];
            const currentLoggedId = userStore.user?.id;
            const currentOrderUserId = orderUser.value;
            const filtered = allUsers.filter(u => u.role === 'MOZO' || u.id === currentLoggedId || u.id === currentOrderUserId);
            return filtered.map(user => ({
                value: user.id,
                label: user.names || user.username
            }));
        });

        const shouldShowCustomerForm = computed(() => {
            return shouldShowCustomerMode.value && route.name !== 'TablePayment';
        });

        const shouldAllowAddingProducts = computed(() => {
            return !shouldShowCustomerMode.value || selectedCustomerId.value;
        });

        watchEffect(() => {
            const ordersChanged = JSON.stringify(saleStore.order_initial) !== JSON.stringify(orderStore.orderList);
            const userChanged = orderUser_initial.value !== orderUser.value;
            console.log('CHECK STATE: ', 'ORDERS CHANGED:', ordersChanged, 'USER CHANGED:', userChanged);
            checkState.value = !ordersChanged && !userChanged;
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

        const performRetrieveTableOrder = async () => {
            // CLEAR CURRENT STATE
            orderStore.orderId = null;
            orderStore.orders = [];
            saleStore.order_initial = [];
            customerIdCounter.value = 1;
            await retrieveTableOrder(route.params.table)
                .then(response => {
                    if (response.status === 200) {
                        const orderDetails = response.data.order_details;
                        const userId = response.data.user;
                        const detectedCustomers = [];
                        for (const item of orderDetails) {
                            if (item.customer?.id && !detectedCustomers.includes(item.customer.id)) {
                                detectedCustomers.push(item.customer);
                            }
                        }
                        orderStore.orders = orderDetails;
                        customers.value = detectedCustomers;
                        selectedCustomerId.value = detectedCustomers[0]?.id || null;

                        ask_for.value = response.data.ask_for;
                        orderStore.orderId = response.data.id;
                        saleStore.order_initial = cloneDeep(orderStore.orderList);
                        customerIdCounter.value = detectedCustomers.length + 1;
                        orderUser_initial.value = userId;
                        orderUser.value = userId;
                    }
                })
                .catch(error => {
                    if (error.response?.status === 404) {
                        orderStore.orders = [];
                        saleStore.order_initial = [];
                        orderStore.orderId = null;

                        // Inicializar estado del usuario para nuevos pedidos
                        if (userStore.user.role === 'MOZO') {
                            orderUser.value = userStore.user.id;
                        }
                        const initialUser = activeUsersStore.usersOptions[0].value;
                        orderUser_initial.value = initialUser;
                        orderUser.value = initialUser;
                    } else {
                        console.error(error);
                        message.error("Algo salió mal...");
                    }
                })
                .finally(() => {
                    loading.value = false;
                });
        };

        onMounted(async () => {
            await performRetrieveTableOrder();
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
            await createTableOrder(
                route.params.table,
                orderStore.orderList,
                orderUser.value,
                ask_for.value
            )
                .then(async response => {
                    if (response.status === 201) {
                        checkState.value = true;
                        router.push({ name: "TableHome" });
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(() => {
                    userConfirm.value = "";
                    loadingConfirm.value = false;
                    showUserConfirm.value = false;
                    loading.value = false;
                });
        };

        const performUpdateTableOrder = async () => {
            loading.value = true;
            await updateTableOrder(
                route.params.table,
                orderStore.orderId,
                orderStore.orderList,
                orderUser.value,
                ask_for.value
            )
                .then(async (response) => {
                    if (response.status === 202) {
                        checkState.value = true;
                        router.push({ name: "TableHome" });
                    }
                })
                .catch((error) => {
                    console.error(error);
                    message.error("Algo salió mal...");
                })
                .finally(() => {
                    userConfirm.value = "";
                    loadingConfirm.value = false;
                    showUserConfirm.value = false;
                    loading.value = false;
                });
        };

        const nullifyTableOrder = async () => {
            if (!orderStore.orderList.length && orderStore.orderId) {
                await performNullifyTableOrder();
            }
        };

        const performNullifyTableOrder = async () => {
            await cancelTableOrder(table, dataAnulate.value)
                .then((response) => {
                    if (response.status === 202) {
                        message.success("Pedido anulado correctamente!");
                        checkState.value = true;
                        router.push({ name: "TableHome" });
                    }
                })
                .catch((error) => {
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
            )
                .then((response) => {
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
                })
                .catch((error) => {
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

        const { debounced: fetchProducts, cancel: cancelFetchProducts } = useDebounce((value) => {
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
        }, 300);

        const showOptions = (value) => {
            if (value.length >= 3) {
                fetchProducts(value);
                return true;
            }
            cancelFetchProducts();
            products.value = [];
            searching.value = false;
            return false;
        };

        const selectProduct = id => {
            const item = products.value.find(product => product.id === id);
            if (item.has_supplies) {
                if (item.has_stock) {
                    orderStore.addOrder(
                        item,
                        customers.value[customers.value.findIndex(c => c.id === selectedCustomerId.value)]
                    );
                    console.log('Producto agregado a la orden');
                }
            }
        };

        const searchProductOption = (v) => {
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
            return h(
                NThing,
                {},
                {
                    default: () => "",
                    header: () =>
                        h(
                            NText,
                            {
                                delete:
                                    !searchProductOption(option.value).has_stock ||
                                    !searchProductOption(option.value).has_supplies,
                                type: searchProductOption(option.value).has_supplies
                                    ? searchProductOption(option.value).has_stock
                                        ? "default"
                                        : "error"
                                    : "error"
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
                                        ) : ""
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
            if (userStore.user.role === "MOZO") {
                showUserConfirm.value = true;
            } else {
                if (!orderStore.orderId) {
                    console.log('Creando nuevo pedido');
                    performCreateTableOrder();
                } else {
                    performUpdateTableOrder();
                }
            }
            // Guardar el estado inicial del usuario para detectar cambios
            orderUser_initial.value = orderUser.value;
        }

        // Computed para obtener el order actual para el modal de indicaciones
        const currentOrder = computed(() => orderStore.orderList[itemIndex.value]);

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
        };

        // Funciones para manejo de clientes
        const addCustomer = () => {
            if (newCustomerName.value.trim()) {
                const newCustomer = {
                    id: customerIdCounter.value++,
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

        const getCustomerOrders = (customerId) => {
            const customer = customers.value.find(c => c.id === customerId);
            if (!customer) return [];
            const customerOrders = orderStore.orderList.filter(order => order.customer?.id === customerId);
            return customerOrders;
        };

        const getCustomerTotal = (customerId) => {
            const total = getCustomerOrders(customerId).reduce((total, order) => {
                const subTotal = order.subTotal || 0;
                return total + (isNaN(subTotal) ? 0 : subTotal);
            }, 0);

            return isNaN(total) ? 0 : total;
        };

        const getTotalAmount = () => {
            const total = orderStore.orderList.reduce((total, order) => {
                const subTotal = order.subTotal || 0;
                return total + (isNaN(subTotal) ? 0 : subTotal);
            }, 0);

            return isNaN(total) ? 0 : total;
        };

        // Función auxiliar para formatear precios de manera segura
        const formatPrice = (value) => {
            const numValue = Number(value);
            return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
        };

        const hasAnyOrders = () => orderStore.orderList.length > 0;

        const removeProduct = (id) => {
            const orderIndex = orderStore.orderList.findIndex(order => order.id === id);
            if (orderIndex !== -1) {
                orderStore.orderList.splice(orderIndex, 1);
            }
        };

        const getGlobalOrderIndex = (orderId) => {
            const orderIndex = orderStore.orderList.findIndex(order => order.id === orderId);
            return orderIndex !== -1 ? orderIndex : null;
        };

        const navigateToPayment = () => {
            router.push({
                name: 'TablePayment',
                params: { table: route.params.table },
            });
        };

        const ticketPreview = ref(null);

        const showPdf = ref(false);

        const pdfData = ref(null);

        // Proveer funciones para componentes hijos
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
            shouldEnterCustomerName,
            shouldSelectOrderUser,
            waiterUsersOptions,
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
            removeProduct,
            getGlobalOrderIndex,
            formatPrice,
            navigateToPayment,
            resetCustomersInitialState,
            // Computed properties para determinar qué vista mostrar
            shouldShowCustomerMode,
            shouldShowCustomerForm,
            shouldAllowAddingProducts
        };
  }
});
</script>
