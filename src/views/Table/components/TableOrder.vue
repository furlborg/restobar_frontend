<template>
    <n-card title="Pedidos" :bordered="false" class="h-100" content-class="overflow-auto">
        <template #header-extra>
            <div v-if="userStore.hasPermission('charge_order')">
                <n-button v-if="!($route.name === 'TablePayment')" type="success" :disabled="!orderStore.orderId" text @click="navigateToPayment">
                    <v-icon class="me-1" name="fa-coins" />
                    <span class="fs-6">Cobrar</span>
                </n-button>
                <n-button v-else type="info" text @click="navigateToTakeOrder">
                    <v-icon class="me-1" name="md-add-round" />
                    <span class="fs-6">Añadir pedido</span>
                </n-button>
            </div>
        </template>

        <template #default>
            <n-scrollbar>
                <div>
                    <n-form v-if="!($route.name === 'TablePayment')">
                        <n-grid cols="2" x-gap="12">
                            <n-form-item-gi v-if="shouldSelectOrderUser" :span="2" label="Mozo">
                                <n-select :options="activeUsersStore.usersOptions" v-model:value="localOrderUser" placeholder="Seleccione un mozo" filterable />
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
                                        @keyup.enter="handleAddCustomer"
                                    />
                                    <n-button
                                        type="primary"
                                        @click="handleAddCustomer"
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
                                    v-model:value="localSelectedCustomerId"
                                    placeholder="Seleccione un cliente"
                                    filterable
                                />
                            </n-form-item-gi>
                            <n-form-item-gi v-if="!shouldShowCustomerMode || localSelectedCustomerId" :span="2" label="Buscar producto">
                                <n-input-group>
                                    <n-auto-complete v-model:value="productSearch" :options="productOptions" :get-show="showOptions" :loading="searching"
                                        :render-label="renderLabel" :input-props="{ autocomplete: 'disabled' }" placeholder="Nombre del producto"
                                        clear-after-select @select="selectProduct" />
                                </n-input-group>
                            </n-form-item-gi>
                        </n-grid>
                    </n-form>

                    <!-- Tabla original para modo sin clientes -->
                    <n-table v-if="!shouldShowCustomerMode" size="small" >
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
                            <!-- Menús y Combos -->
                            <template v-for="(menuSet, menuIndex) in orderStore.menuSets" :key="`menu-set-table-${menuIndex}`">
                                <!-- Fila principal del Menú o Combo -->
                                <tr :style="{ backgroundColor: menuSet.from_combo ? '#f0f9ff' : '#f8f8f8' }">
                                    <td>
                                        <n-button :type="menuSet.from_combo ? 'success' : 'warning'" text>
                                            <v-icon :name="menuSet.from_combo ? 'gi-hot-meal' : 'md-restaurant-round'"/>
                                        </n-button>
                                    </td>
                                    <td>
                                        <b>{{ menuSet.from_combo ? 'Combo' : 'Menú' }}: {{ menuSet.name }}</b>
                                        <br>
                                        <n-tag v-if="menuSet.from_combo" size="small" type="success" style="margin-top: 4px;">
                                            {{ menuSet.items?.length || 0 }} productos incluidos
                                        </n-tag>
                                    </td>
                                    <td>
                                        <n-tag size="small" type="info">{{ menuSet.quantity }}x</n-tag>
                                    </td>
                                    <td>S/. {{ formatPrice(menuSet.price * menuSet.quantity) }}</td>
                                    <td>
                                        <n-button v-if="!isPaymentRoute" type="error" text @click.stop="handleRemoveMenuSet(menuIndex)">
                                            <v-icon name="md-disabledbydefault-round" />
                                        </n-button>
                                    </td>
                                </tr>
                                <!-- Items del menú o combo -->
                                <tr v-for="item in menuSet.items" :key="`menu-set-item-table-${item.product_id || item.id}`" :style="{ backgroundColor: menuSet.from_combo ? '#fafeff' : '#fafafa' }">
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
                                        :disabled="orderButtonDisabled" @click="validateSend()" text block>
                                        <v-icon class="me-2" name="md-notealt-twotone" scale="1.5" />
                                        <span class="fs-4">{{ orderStore.orderId ? 'Actualizar' : 'Realizar' }} pedido</span>
                                    </n-button>
                                </td>
                                <td colspan="2" class="fs-6 fw-bold">{{ formattedTotals.grandTotal }}</td>
                            </tr>
                        </tfoot>
                    </n-table>

                    <!-- Nueva tabla para modo con clientes -->
                    <n-card :bordered="false" v-else content-class="p-0" footer-class="p-0">
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
                                                        @click.stop="handleRemoveProductLine(orderIndex)"
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
                        <template #footer>
                            <div v-if="shouldShowCustomerMode" class="p-2 mt-3"
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
                                        :disabled="orderButtonDisabled"
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

                        <n-empty v-if="customers.length === 0" description="Agregue un cliente para realizar un pedido" class="m-4" />
                    </n-card>
                </div>
            </n-scrollbar>
        </template>
    </n-card>

    <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="currentOrder" @success="showModal = false" />
</template>

<script>
import OrderIndications from "./OrderIndications";
import ProductSearchLabel from "@/views/Product/components/ProductSearchLabel.vue";
import { defineComponent, ref, computed, h, watchEffect, provide, watch } from "vue";

import { useRoute, useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useSaleTotals } from "@/composables/useSaleTotals";
import { searchProductByName, searchProductPrice } from "@/api/modules/products";

export default defineComponent({
    name: "TableOrder",
    components: { OrderIndications, ProductSearchLabel },
    props: {
        ask_for: {
            type: String,
            default: ''
        },
        orderUser: {
            type: [Number, String],
            default: null
        },
        loading: {
            type: Boolean,
            default: false
        },
        hasUnsavedChanges: {
            type: Boolean,
            default: false
        },
        customers: {
            type: Array,
            default: () => []
        },
        selectedCustomerId: {
            type: [Number, String],
            default: null
        },
        shouldShowCustomerMode: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        'validateSend',
        'addCustomer',
        'removeCustomer',
        'deleteOrderDetail',
        'goToFirstTab',
        'update:ask_for',
        'update:orderUser',
        'update:selectedCustomerId',
        'productSelect'
    ],
    setup(props, { emit }) {

        const route = useRoute();
        const router = useRouter();
        const message = useMessage();
        const dialog = useDialog();

        const userStore = useUserStore();
        const activeUsersStore = useActiveUsersStore();
        const tableStore = useTableStore();
        const settingsStore = useSettingsStore();
        const genericsStore = useGenericsStore();
        const productStore = useProductStore();
        const orderStore = useOrderStore();
        const saleStore = useSaleStore();
        const { formattedTotals } = useSaleTotals();

        const customerOptions = computed(() => props.customers.map(customer => ({ label: customer.name, value: customer.id })));
        
        const localSelectedCustomerId = computed({
            get: () => props.selectedCustomerId,
            set: (value) => emit('update:selectedCustomerId', value)
        });

        //const selectProduct = (productId) => emit('productSelect', productId);

        const localAskFor = computed({
            get: () => props.ask_for,
            set: (value) => emit('update:ask_for', value)
        });

        const localOrderUser = computed({
            get: () => props.orderUser,
            set: (value) => emit('update:orderUser', value)
        });

        const validateSend = () => emit('validateSend');
        const addCustomer = (name) => emit('addCustomer', name);
        const removeCustomer = (index) => emit('removeCustomer', index);
        const deleteOrderDetail = (index, id) => emit('deleteOrderDetail', index, id);

        const newCustomerName = ref("");
        const showModal = ref(false);
        const itemIndex = ref(null);
        const searching = ref(false);
        const productSearch = ref("");
        const products = ref([]);

        const isWaiter = computed(() => userStore.user.role === 'MOZO');
        const isPaymentRoute = computed(() => route.name === 'TablePayment');
        const shouldSelectOrderUser = computed(() => settingsStore.businessSettings?.order?.select_order_user && !isWaiter.value);
        const currentOrder = computed(() => orderStore.orderList[itemIndex.value]);

        const productOptions = computed(() => products.value.map((product) => ({
            value: product.id,
            label: product.name,
            disabled: product.is_disabled,
            category: productStore.getCategorieDescription(product.category),
            stock: product.stock,
            price: parseFloat(product.prices).toFixed(2),
        })));

        const openOrderModal = (index) => {
            itemIndex.value = index;
            showModal.value = true;
        };

        const handleAddCustomer = () => {
            if (!newCustomerName.value.trim()) return;
            addCustomer(newCustomerName.value.trim());
            newCustomerName.value = "";
        };

        const confirmRemoveCustomer = (customerIndex, customerName) => {
            dialog.warning({
                title: 'Confirmar eliminación',
                content: `¿Estás seguro de que quieres eliminar al cliente "${customerName}"? Esto también eliminará todos sus pedidos.`,
                positiveText: 'Sí, eliminar',
                negativeText: 'Cancelar',
                onPositiveClick: () => removeCustomer(customerIndex)
            });
        };

        const getCustomerOrders = (customerId) => 
            orderStore.orderList.filter(order => order.customer?.id === customerId && order.quantity > 0);
        const getCustomerTotal = (customerId) => 
            getCustomerOrders(customerId).reduce((total, order) => total + Number(order.subTotal || 0), 0);
        const getTotalAmount = () => orderStore.orderTotal;
        const formatPrice = (price) => (isNaN(price) ? 0 : Number(price)).toFixed(2);
        const hasAnyOrders = computed(() => orderStore.orderList.some(order => order.quantity > 0));
        const getGlobalOrderIndex = (orderId) => orderStore.orderList.findIndex(order => order.id === orderId);

        const handleRemoveOrder = (order, index) => {
            order.id ? deleteOrderDetail(index, order.id) : (orderStore.orderList.splice(index, 1), nullifyTableOrder());
        };

        const handleRemoveMenuSet = (menuIndex) => {
            // Obtener menús Y combos (ProductSets)
            const menuSetItems = orderStore.orderList.filter(item => item.from_menu || item.from_combo);
            const menuSetToRemove = menuSetItems[menuIndex];
            if (!menuSetToRemove) return;

            const orderIndex = orderStore.orderList.findIndex(item => item === menuSetToRemove);
            if (orderIndex === -1) return;

            if (!menuSetToRemove.id) {
                orderStore.orderList.splice(orderIndex, 1);
                nullifyTableOrder();
            } else {
                deleteOrderDetail(orderIndex, menuSetToRemove.id);
            }
            updateSaleStore();
        };

        const handleRemoveProductLine = (productIndex) => {
            const productItems = orderStore.orderList.filter(item => !item.from_menu);
            const productToRemove = productItems[productIndex];
            if (!productToRemove) return;

            const orderIndex = orderStore.orderList.findIndex(item => item === productToRemove);
            if (orderIndex === -1) return;

            if (!productToRemove.id) {
                orderStore.orderList.splice(orderIndex, 1);
                nullifyTableOrder();
            } else {
                deleteOrderDetail(orderIndex, productToRemove.id);
            }
            updateSaleStore();
        };

        const updateSaleStore = () => {
            Object.assign(saleStore, {
                sale_details: orderStore.productLines,
                sale_product_sets: orderStore.menuSets
            });
            saleStore.buildSalePayload();
        };

        const nullifyTableOrder = async () => {
            if (!orderStore.orderList.length && orderStore.orderId) {
                // console.log('Nullifying table order for:', order);
            }
        };

        const debounce = (fn, delay = 500) => {
            let timeout
            return (...args) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => fn(...args), delay)
            }
        }

        const fetchProducts = debounce((value) => {
            const priceRegex = /^\d+(\.\d{0,2})?$/

            // Si es un precio, buscar por precio
            if (priceRegex.test(value)) {
                searching.value = true
                searchProductPrice(value)
                .then(res => {
                    if (res.status === 200) products.value = res.data
                })
                .catch(() => message.error('Algo salió mal...'))
                .finally(() => (searching.value = false))
                return
            }

            // Si es texto con al menos 3 caracteres, buscar por nombre
            if (value.length >= 3) {
                searching.value = true
                searchProductByName(value)
                .then(res => {
                    if (res.status === 200) products.value = res.data
                })
                .catch(() => message.error('Algo salió mal...'))
                .finally(() => (searching.value = false))
            } else {
                products.value = []
            }
            }, 500)

        // --- get-show solo controla visibilidad del dropdown ---
        const showOptions = (value) => {
            if (!value) return false
            // cuando hay algo escrito, deja mostrar las opciones
            return value.length >= 3 || /^\d+(\.\d{0,2})?$/.test(value)
        }

        watch(productSearch, (value) => {
            fetchProducts(value)
        })

        const selectProduct = id => {
            const item = products.value.find(product => product.id === id);
            if (item.has_supplies && item.has_stock) {
                orderStore.addOrder(item);
                // console.log('Producto agregado a la orden');
            }
        };

        const renderLabel = (option) => {
            return h(ProductSearchLabel, { option });
        };

        const navigateToPayment = () => {
            emit('goToFirstTab');
            router.push({ name: 'TablePayment', params: { table: route.params.table } });
        };

        const navigateToTakeOrder = () => {
            emit('goToFirstTab');
            router.push({ name: 'ProductCategories', params: { table: route.params.table } });
        };

        const orderButtonDisabled = computed(() => !props.hasUnsavedChanges);

        provide("handleProductClick", selectProduct);

        return {
            userStore, activeUsersStore, route, router, tableStore, settingsStore, genericsStore, 
            productStore, orderStore, saleStore,
            customers: computed(() => props.customers),
            shouldShowCustomerMode: computed(() => props.shouldShowCustomerMode),
            customerOptions, localSelectedCustomerId, addCustomer, removeCustomer, deleteOrderDetail,
            newCustomerName, showModal, itemIndex, searching, productSearch, products,
            localAskFor, localOrderUser, shouldSelectOrderUser, currentOrder, productOptions, isWaiter, isPaymentRoute,
            showOptions, selectProduct, renderLabel, navigateToPayment, confirmRemoveCustomer, navigateToTakeOrder, 
            handleAddCustomer, getCustomerOrders, getCustomerTotal, getTotalAmount, formatPrice, hasAnyOrders, 
            getGlobalOrderIndex, validateSend, deleteOrderDetail, nullifyTableOrder, openOrderModal, handleRemoveOrder, 
            handleRemoveMenuSet, handleRemoveProductLine, updateSaleStore, formattedTotals, orderButtonDisabled
        };
  }
});
</script>
