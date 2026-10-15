<template>
    <div class="flizzy-orders-card">
        <!-- HEADER -->
        <header class="orders-card-top-header">
            <div class="orders-header-title-box">
                <span class="orders-header-title">Comanda / Pedidos</span>
                <span v-if="orderStore.orderList.length" class="orders-count-badge">
                    {{ orderStore.orderList.length }} {{ orderStore.orderList.length === 1 ? 'ítem' : 'ítems' }}
                </span>
            </div>
            <div v-if="userStore.hasPermission('charge_order')">
                <n-button 
                    v-if="!isPaymentRoute" 
                    type="success"
                    text
                    :disabled="!orderStore.orderId" 
                    @click="navigateToPayment"
                >
                    <v-icon class="me-1" name="fa-coins" />
                    <span class="fs-6">Cobrar</span>
                </n-button>
                <n-button v-else class="flizzy-btn-order-add" text @click="navigateToTakeOrder">
                    <v-icon class="me-1" name="md-add-round" />
                    <span>Añadir pedido</span>
                </n-button>
            </div>
        </header>

        <!-- FORMULARIO DE CONTROLES: MOZO, CLIENTE, BUSCADOR RÁPIDO -->
        <n-form v-if="!isPaymentRoute" class="orders-form-header">
                        <n-grid cols="2" x-gap="10" y-gap="6">
                            <!-- Mozo -->
                            <n-form-item-gi v-if="shouldSelectOrderUser" :span="2" label="Mozo Asignado" class="orders-form-item">
                                <n-select :options="waiterUsersOptions" v-model:value="localOrderUser"
                                    placeholder="Seleccione un mozo..." filterable size="small" class="flizzy-select" />
                            </n-form-item-gi>
                            <n-form-item-gi v-if="shouldShowCustomerMode"
                                :span="!shouldShowCustomerMode ? 2 : customers.length > 0 ? 1 : 2"
                                label="Agregar Cliente" class="orders-form-item">
                                <n-input-group size="small">
                                    <n-input v-model:value="newCustomerName" placeholder="Nombre del cliente"
                                        @keyup.enter="handleAddCustomer" />
                                    <n-button type="primary" @click="handleAddCustomer"
                                        :disabled="!newCustomerName.trim()">
                                        <v-icon class="me-1" name="md-personadd-round" />
                                    </n-button>
                                </n-input-group>
                            </n-form-item-gi>
                            <n-form-item-gi v-if="shouldShowCustomerMode && customers.length > 0" :span="1"
                                label="Seleccionar Cliente" class="orders-form-item">
                                <n-select :options="customerOptions" v-model:value="localSelectedCustomerId"
                                    placeholder="Seleccione un cliente" filterable size="small" />
                            </n-form-item-gi>
                            <!-- buscar producto -->
                            <n-form-item-gi v-if="!shouldShowCustomerMode || localSelectedCustomerId" :span="2"
                                label="Buscar Producto Rápido" class="orders-form-item">
                                <n-input-group size="small">
                                    <n-auto-complete v-model:value="productSearch" :options="productOptions"
                                        :get-show="showOptions" :loading="searching" :render-label="renderLabel"
                                        :filter="() => true"
                                        @update:value="fetchProducts"
                                        :input-props="{ autocomplete: 'disabled' }" placeholder="Escriba para buscar producto..."
                                        clear-after-select @select="selectProduct" class="flizzy-search-autocomplete" />
                                </n-input-group>
                            </n-form-item-gi>
                        </n-grid>
                    </n-form>

                    <!-- Viewport con scroll dedicado para los ítems de comanda -->
                    <div class="orders-items-scroll-viewport">
                        <!-- Tabla original para modo sin clientes -->
                        <n-table v-if="!shouldShowCustomerMode" size="small" class="flizzy-orders-table">
                        <thead>
                            <tr>
                                <th style="width: 8%"></th>
                                <th style="width: 42%">Producto</th>
                                <th style="width: 24%">Cant.</th>
                                <th style="width: 18%">SubTotal</th>
                                <th style="width: 8%"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Menús y Combos -->
                            <template v-for="(menuSet, menuIndex) in orderStore.menuSets"
                                :key="`menu-set-table-${menuIndex}`">
                                <template v-if="menuSet.quantity > 0">
                                    <!-- Fila principal del Menú o Combo -->
                                    <tr class="order-row-combo">
                                        <td class="text-center">
                                            <div class="row-icon-badge combo-badge">
                                                <v-icon :name="menuSet.from_combo ? 'gi-hot-meal' : 'md-restaurant-round'" />
                                            </div>
                                        </td>
                                        <td>
                                            <span class="order-combo-name">{{ menuSet.from_combo ? 'Combo' : 'Menú' }}: {{ menuSet.name }}</span>
                                            <div class="order-combo-subitems">
                                                <div v-for="item in menuSet.items" :key="`menu-set-item-table-${item.product_id || item.id}`" class="subitem-line">
                                                    <span>- {{ item.quantity }}x {{ item.product_name }}</span>
                                                    <small v-if="item.phase_name" class="ms-1 subitem-phase">({{ item.phase_name }})</small>
                                                </div>
                                            </div>
                                            <span v-if="menuSet.from_combo" class="badge-included-pill">
                                                {{ menuSet.items?.length || 0 }} productos incluidos
                                            </span>
                                        </td>
                                        <td>
                                            <span class="qty-pill">{{ menuSet.quantity }}x</span>
                                        </td>
                                        <td class="order-price-col">S/. {{ formatPrice(menuSet.price * menuSet.quantity) }}</td>
                                        <td class="text-center">
                                            <n-button v-if="!isPaymentRoute" class="btn-order-delete" text
                                                @click.stop="handleRemoveMenuSet(menuIndex)">
                                                <v-icon name="md-delete-round" />
                                            </n-button>
                                        </td>
                                    </tr>
                                </template>
                            </template>

                            <!-- Productos individuales -->
                            <template v-for="(order, index) in orderStore.productLines" :key="`product-table-${index}`">
                                <tr v-if="order.quantity > 0" class="order-row-product" @click="openOrderModal(index)">
                                    <td class="text-center">
                                        <div class="row-icon-badge product-badge">
                                            <v-icon name="md-listalt-round" />
                                        </div>
                                    </td>
                                    <td>
                                        <span class="order-product-name">{{ order.product_name }}</span>
                                        <span class="order-product-time">{{ order.modified }}</span>
                                    </td>
                                    <td>
                                        <n-input-number v-if="!isPaymentRoute" class="flizzy-stepper-input" size="small"
                                            :min="order.id ? saleStore.getOrderQuantity(order.id) : 1"
                                            v-model:value="order.quantity" @click.stop />
                                        <span v-else class="qty-pill">{{ order.quantity }}</span>
                                    </td>
                                    <td class="order-price-col">S/. {{ formatPrice(order.subTotal) }}</td>
                                    <td class="text-center">
                                        <n-button v-if="!isPaymentRoute" class="btn-order-delete" text
                                            @click.stop="handleRemoveProductLine(index)">
                                            <v-icon name="md-delete-round" />
                                        </n-button>
                                    </td>
                                </tr>
                            </template>

                            <tr v-if="orderStore.orderList.length === 0">
                                <td colspan="5" class="py-4">
                                    <n-empty description="No hay productos en esta comanda" size="small" />
                                </td>
                            </tr>
                        </tbody>
                    </n-table>

                    <!-- Nueva tabla para modo con clientes -->
                    <div v-else class="customer-cards-wrapper">
                        <template v-for="(customer, customerIndex) in customers" :key="customer.id">
                            <n-card class="mb-3 flizzy-customer-card" size="small" :title="customer.name" :bordered="false"
                                header-class="p-0 pb-2" content-class="p-0">
                                <template #header-extra>
                                    <n-space align="center">
                                        <span class="customer-total-badge">
                                            S/. {{ formatPrice(getCustomerTotal(customer.id)) }}
                                        </span>
                                        <n-button v-if="!($route.name === 'TablePayment')" class="btn-order-delete" size="small" text
                                            @click="confirmRemoveCustomer(customerIndex, customer.name)"
                                            :title="`Eliminar cliente ${customer.name}`">
                                            <v-icon name="md-delete-round" />
                                        </n-button>
                                    </n-space>
                                </template>

                                <n-table size="small" class="flizzy-orders-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 8%"></th>
                                            <th style="width: 42%">Producto</th>
                                            <th style="width: 24%">Cant.</th>
                                            <th style="width: 18%">SubTotal</th>
                                            <th style="width: 8%"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="(order, orderIndex) in getCustomerOrders(customer.id)"
                                            :key="orderIndex">
                                            
                                            <!-- Si es menú o combo -->
                                            <template v-if="order.from_menu || order.from_combo">
                                                <tr class="order-row-combo">
                                                    <td class="text-center">
                                                        <div class="row-icon-badge combo-badge">
                                                            <v-icon :name="order.from_combo ? 'gi-hot-meal' : 'md-restaurant-round'" />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span class="order-combo-name">{{ order.from_combo ? 'Combo' : 'Menú' }}: {{ order.name }}</span>
                                                        <div class="order-combo-subitems">
                                                            <div v-for="item in order.items" :key="`customer-menu-item-${item.product_id || item.id}`" class="subitem-line">
                                                                <span>- {{ item.quantity }}x {{ item.product_name || item.name }}</span>
                                                                <small v-if="item.phase_name" class="ms-1 subitem-phase">({{ item.phase_name }})</small>
                                                            </div>
                                                        </div>
                                                        <span v-if="order.from_combo" class="badge-included-pill">
                                                            {{ order.items?.length || 0 }} productos incluidos
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span class="qty-pill">{{ order.quantity }}x</span>
                                                    </td>
                                                    <td class="order-price-col">S/. {{ formatPrice(order.subTotal) }}</td>
                                                    <td class="text-center">
                                                        <n-button v-if="!($route.name === 'TablePayment')" class="btn-order-delete" text
                                                            @click.stop="handleRemoveOrderGlobal(order)">
                                                            <v-icon name="md-delete-round" />
                                                        </n-button>
                                                    </td>
                                                </tr>
                                            </template>

                                            <!-- Si es un producto individual -->
                                            <template v-else>
                                                <tr v-if="order.quantity > 0" class="order-row-product"
                                                    @click="openOrderModal(order)">
                                                    <td class="text-center">
                                                        <div class="row-icon-badge product-badge">
                                                            <v-icon name="md-listalt-round" />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span class="order-product-name">{{ order.product_name }}</span>
                                                        <span class="order-product-time">{{ order.modified }}</span>
                                                    </td>
                                                    <td>
                                                        <n-input-number v-if="!($route.name === 'TablePayment')"
                                                            class="flizzy-stepper-input" size="small"
                                                            :min="order.id ? saleStore.getOrderQuantity(order.id) : 1"
                                                            v-model:value="order.quantity" @click.stop />
                                                        <span v-else class="qty-pill">{{ order.quantity }}</span>
                                                    </td>
                                                    <td class="order-price-col">S/. {{ formatPrice(order.subTotal) }}</td>
                                                    <td class="text-center">
                                                        <n-button v-if="!($route.name === 'TablePayment')" class="btn-order-delete" text
                                                            @click.stop="handleRemoveOrderGlobal(order)">
                                                            <v-icon name="md-delete-round" />
                                                        </n-button>
                                                    </td>
                                                </tr>
                                            </template>

                                        </template>
                                    </tbody>
                                </n-table>

                                <n-empty v-if="getCustomerOrders(customer.id).length === 0"
                                    description="No hay productos agregados" size="small" class="my-4" />
                            </n-card>
                        </template>

                        <n-empty v-if="customers.length === 0" description="Agregue un cliente para realizar un pedido"
                            class="m-4" />
                    </div>
                </div>

        <!-- FOOTER FIJO: Total y botón de confirmación siempre visibles en pantalla -->
        <footer class="orders-card-footer">
            <div class="orders-footer-summary">
                <div class="footer-total-box">
                    <span class="total-label">
                        {{ shouldShowCustomerMode ? `TOTAL GENERAL (${customers.length} clientes):` : 'TOTAL COMANDA:' }}
                    </span>
                    <span class="total-value">
                        {{ shouldShowCustomerMode ? ('S/. ' + formatPrice(orderStore.orderTotal)) : formattedTotals.grandTotal }}
                    </span>
                </div>
                <n-button v-if="!isPaymentRoute" class="flizzy-btn-order-submit"
                    :loading="loading" :disabled="orderButtonDisabled" @click="validateSend()" block>
                    <v-icon class="me-2" name="md-notealt-twotone" scale="1.3" />
                    <span>{{ orderStore.orderId ? 'Actualizar Pedido' : 'Realizar Pedido' }}</span>
                </n-button>
            </div>
        </footer>
    </div>

    <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="currentOrder"
        @success="showModal = false" />
</template>

<script setup>
import OrderIndications from "./OrderIndications";
import ProductSearchLabel from "@/views/Product/components/ProductSearchLabel.vue";
import { ref, computed, h, watch, onMounted, onUnmounted, toRefs } from "vue";

import { useRoute, useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useSaleTotals } from "@/composables/useSaleTotals";
import { useDebounce } from "@/composables/useDebounce";
import { searchProductByName, searchProductPrice } from "@/api/modules/products";

const props = defineProps({
    ask_for: { type: String, default: '' },
    orderUser: { type: [Number, String], default: null },
    loading: { type: Boolean, default: false },
    hasUnsavedChanges: { type: Boolean, default: false },
    customers: { type: Array, default: () => [] },
    selectedCustomerId: { type: [Number, String], default: null },
    shouldShowCustomerMode: { type: Boolean, default: false }
});

const emit = defineEmits([
    'validateSend',
    'addCustomer',
    'removeCustomer',
    'deleteOrderDetail',
    'goToFirstTab',
    'update:ask_for',
    'update:orderUser',
    'update:selectedCustomerId',
    'productSelect'
]);

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const userStore = useUserStore();
const activeUsersStore = useActiveUsersStore();
const tableStore = useTableStore();
const settingsStore = useSettingsStore();
const productStore = useProductStore();
const orderStore = useOrderStore();
const saleStore = useSaleStore();
const { formattedTotals } = useSaleTotals();



// Para acceder a props reactivamente
const { customers, shouldShowCustomerMode, selectedCustomerId, orderUser } = toRefs(props)

// Estado local
const newCustomerName = ref("");
const showModal = ref(false);
const itemIndex = ref(null);
const searching = ref(false);
const productSearch = ref("");
const products = ref([]);

// ID de la mesa desde la ruta
const tableId = computed(() => {
    const param = route.params.table;
    return typeof param === 'string' ? parseInt(param) : param;
});
const customerOptions = computed(() => customers.value.map(customer => ({ label: customer.name, value: customer.id })));
const localSelectedCustomerId = computed({
    get: () => selectedCustomerId.value,
    set: (value) => emit('update:selectedCustomerId', value)
});
const isWaiter = computed(() => userStore.user.role === 'MOZO');
const isPaymentRoute = computed(() => route.name === 'TablePayment' || route.name === 'WTablePayment');
const shouldSelectOrderUser = computed(() => settingsStore.businessSettings?.order?.waiter_auth_mode === 'select');
const waiterUsersOptions = computed(() => {
    const allUsers = activeUsersStore.users || [];
    const currentLoggedId = userStore.user?.id;
    const currentOrderUserId = localOrderUser.value;
    const filtered = allUsers.filter(u => u.role === 'MOZO' || u.id === currentLoggedId || u.id === currentOrderUserId);
    return filtered.map(user => ({
        value: user.id,
        label: user.names || user.username
    }));
});
const currentOrder = computed(() => {
    const index = itemIndex.value;
    return typeof index === 'number' && index >= 0 ? orderStore.orderList[index] : null;
});
const productOptions = computed(() => products.value.filter((p) => p.product_type !== 'COMBO').map((product) => ({
    value: product.id,
    label: product.name,
    product: product,
    disabled: product.is_disabled,
    category: productStore.getCategorieDescription(product.category) || 'General',
    stock: product.stock ?? 0,
    price: parseFloat(product.prices || 0).toFixed(2),
})));
const orderButtonDisabled = computed(() => !props.hasUnsavedChanges);


const selectProduct = (v) => {
    const item = (v && typeof v === 'object') ? v : products.value.find(p => p.id === v);
    if (item) {
        emit('productSelect', item);
    }
};

const localOrderUser = computed({
    get: () => orderUser.value,
    set: (value) => emit('update:orderUser', value)
});

const validateSend = () => emit('validateSend');
const addCustomer = (name) => emit('addCustomer', name);
const removeCustomer = (index) => emit('removeCustomer', index);
const deleteOrderDetail = (index, id) => emit('deleteOrderDetail', index, id);

const getGlobalOrderIndex = (targetOrder) => {
    if (targetOrder == null) return -1;

    if (typeof targetOrder === 'number') {
        if (targetOrder >= 0 && targetOrder < orderStore.orderList.length) {
            return targetOrder;
        }
        return orderStore.orderList.findIndex(order => order.id === targetOrder);
    }

    if (typeof targetOrder === 'string') {
        return orderStore.orderList.findIndex(order => String(order.id) === targetOrder);
    }

    const byId = targetOrder.id != null
        ? orderStore.orderList.findIndex(order => order.id === targetOrder.id)
        : -1;
    if (byId !== -1) return byId;

    if (targetOrder.created_at) {
        const byCreated = orderStore.orderList.findIndex(order => order.created_at === targetOrder.created_at);
        if (byCreated !== -1) return byCreated;
    }

    return orderStore.orderList.findIndex(order => order === targetOrder);
};

const openOrderModal = (order) => {
    const index = getGlobalOrderIndex(order);
    itemIndex.value = index !== -1 ? index : null;
    if (index !== -1) {
        showModal.value = true;
    }
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
    orderStore.orderList.filter(order => order.customer && String(order.customer.id) === String(customerId) && order.quantity > 0);
const getCustomerTotal = (customerId) =>
    getCustomerOrders(customerId).reduce((total, order) => total + Number(order.subTotal || 0), 0);

const formatPrice = (price) => (isNaN(price) ? 0 : Number(price)).toFixed(2);

const handleRemoveMenuSet = (menuIndex) => {
    // Obtener menús Y combos (ProductSets)
    const menuSetItems = orderStore.orderList.filter(item => item.from_menu || item.from_combo);
    const menuSetToRemove = menuSetItems[menuIndex];
    if (!menuSetToRemove) return;

    handleRemoveOrderGlobal(menuSetToRemove);
};

const handleRemoveOrderGlobal = (orderToRemove) => {
    if (!orderToRemove) return;
    const orderIndex = orderStore.orderList.findIndex(item => item === orderToRemove);
    if (orderIndex === -1) return;

    if (!orderToRemove.id) {
        orderStore.orderList.splice(orderIndex, 1);
    } else {
        deleteOrderDetail(orderIndex, orderToRemove.id);
    }
    updateSaleStore();
};

const handleRemoveProductLine = (productIndex) => {
    const productToRemove = orderStore.productLines[productIndex];
    if (!productToRemove) return;

    handleRemoveOrderGlobal(productToRemove);
};

const updateSaleStore = () => {
    Object.assign(saleStore, {
        sale_details: orderStore.productLines,
        sale_product_sets: orderStore.menuSets
    });
    saleStore.buildSalePayload();
};

let searchAbortController = null;
let currentSearchSeq = 0;

onMounted(() => {
    productStore.loadCatalog(true).catch(() => {});
});

const executeSearch = (value) => {
    const priceRegex = /^\d+(\.\d{0,2})?$/;
    const isPrice = priceRegex.test(value);
    const isTextSearch = value && value.trim().length >= 1;

    if (!isPrice && !isTextSearch) {
        products.value = [];
        searching.value = false;
        return;
    }

    // 1. Si el catálogo está en memoria, buscar de forma 100% instantánea (0 ms)
    if (productStore.catalog?.length) {
        const localMatches = productStore.searchLocal(value);
        if (localMatches.length) {
            products.value = localMatches;
            searching.value = false;
            return;
        }
    }

    // 2. Si no hubo coincidencia local (o el catálogo aún carga), consultar al backend
    if (searchAbortController) {
        searchAbortController.abort();
        searchAbortController = null;
    }

    searchAbortController = new AbortController();
    const currentSeq = ++currentSearchSeq;
    searching.value = true;

    const request = isPrice
        ? searchProductPrice(value, { signal: searchAbortController.signal })
        : searchProductByName(value, { signal: searchAbortController.signal });

    request
        .then(res => {
            if (currentSeq === currentSearchSeq && res.status === 200) {
                products.value = res.data;
            }
        })
        .catch(err => {
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                return;
            }
            if (currentSeq === currentSearchSeq) {
                console.error(err);
                message.error('Algo salió mal...');
            }
        })
        .finally(() => {
            if (currentSeq === currentSearchSeq) {
                searching.value = false;
            }
        });
};

const { debounced: debouncedFetchProducts } = useDebounce(executeSearch, 200);

const fetchProducts = (value) => {
    // Si el catálogo está listo, la búsqueda local es inmediata (0ms sin debounce!)
    if (productStore.catalog?.length) {
        executeSearch(value);
    } else {
        debouncedFetchProducts(value);
    }
};

// --- get-show controla visibilidad del dropdown y asegura ejecución inmediata ---
const showOptions = (value) => {
    if (!value) return false;
    const shouldShow = value.trim().length >= 1 || /^\d+(\.\d{0,2})?$/.test(value);
    if (shouldShow) {
        fetchProducts(value);
        return true;
    }
    return false;
};

onUnmounted(() => {
    if (searchAbortController) {
        searchAbortController.abort();
    }
});

watch(productSearch, (value) => {
    fetchProducts(value);
});

const renderLabel = (option) => {
    return h(ProductSearchLabel, { option });
};

const navigateToPayment = () => {
    emit('goToFirstTab');
    const dest = route.matched.some(r => r.name === 'WaiterMode') ? 'WTablePayment' : 'TablePayment';
    router.push({ name: dest, params: { table: route.params.table } });
};

const navigateToTakeOrder = () => {
    emit('goToFirstTab');
    const dest = route.matched.some(r => r.name === 'WaiterMode') ? 'WProductCategories' : 'ProductCategories';
    router.push({ name: dest, params: { table: route.params.table } });
};


</script>

<style scoped>
/* ==================================================== */
/* ESTILOS FLIZZY PARA TABLEORDER                       */
/* ==================================================== */
.flizzy-orders-card {
    background: #ffffff;
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.orders-card-top-header {
    flex-shrink: 0;
    padding: 10px 14px 8px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.orders-header-title-box {
    display: flex;
    align-items: center;
    gap: 8px;
}

.orders-header-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
}

.orders-count-badge {
    font-size: 11px;
    font-weight: 700;
    background: #fff7ed;
    color: #ea580c;
    border: 1px solid #fed7aa;
    padding: 1px 7px;
    border-radius: 6px;
}

.orders-form-header {
    flex-shrink: 0;
    margin: 8px 10px 6px;
    background: #f8fafc;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
}

.orders-items-scroll-viewport {
    flex: 1 1 0px;
    height: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 10px 6px;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f8fafc;
}

.orders-items-scroll-viewport::-webkit-scrollbar {
    width: 6px;
}
.orders-items-scroll-viewport::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 4px;
}
.orders-items-scroll-viewport::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
.orders-items-scroll-viewport::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.orders-card-footer {
    flex-shrink: 0;
    padding: 8px 10px 10px;
    background: #ffffff;
    border-top: 1.5px solid #e2e8f0;
    box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
}

.orders-form-item {
    margin-bottom: 0 !important;
}

:deep(.orders-form-item .n-form-item-label) {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #64748b !important;
    padding-bottom: 2px !important;
}

/* TABLA DE COMANDA */
.flizzy-orders-table {
    border: 1px solid #f1f5f9 !important;
    border-radius: 10px !important;
    overflow: hidden !important;
}

.flizzy-orders-table thead th {
    background: #f8fafc !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    color: #64748b !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
    border-bottom: 1.5px solid #e2e8f0 !important;
    padding: 6px 8px !important;
}

.flizzy-orders-table tbody td {
    padding: 6px 8px !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.order-row-combo {
    background: #fafffd !important;
    transition: background-color 0.15s ease;
}

.order-row-combo:hover,
.order-row-product:hover {
    background: #fffaf5 !important;
}

.row-icon-badge {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
}

.combo-badge {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
}

.product-badge {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
}

.order-combo-name {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
}

.order-combo-subitems {
    font-size: 11px;
    color: #64748b;
    margin: 2px 0;
    line-height: 1.2;
}

.subitem-phase {
    color: #94a3b8;
    font-style: italic;
}

.badge-included-pill {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    border: 1px solid #86efac;
    padding: 1px 6px;
    border-radius: 4px;
    margin-top: 2px;
}

.order-product-name {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
}

.order-product-time {
    display: block;
    font-size: 10.5px;
    color: #94a3b8;
    margin-top: 1px;
}

.qty-pill {
    display: inline-block;
    padding: 2px 7px;
    background: #f1f5f9;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 800;
    color: #334155;
    font-variant-numeric: tabular-nums;
}

.order-price-col {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap;
}

.btn-order-delete {
    width: 26px !important;
    height: 26px !important;
    border-radius: 6px !important;
    color: #94a3b8 !important;
    transition: all 0.15s ease !important;
}

.btn-order-delete:hover {
    color: #ef4444 !important;
    background: #fee2e2 !important;
}

:deep(.flizzy-stepper-input) {
    max-width: 95px !important;
    border-radius: 6px !important;
}

.customer-total-badge {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
}

/* FOOTER Y TOTAL */
.flizzy-orders-tfoot td {
    padding: 8px !important;
    background: #ffffff !important;
    border-top: 1.5px solid #e2e8f0 !important;
}

.orders-footer-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.footer-total-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.footer-total-box .total-label {
    font-size: 11.5px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.04em;
}

.footer-total-box .total-value {
    font-size: 17px;
    font-weight: 900;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
}

.flizzy-btn-order-submit {
    height: 42px !important;
    border-radius: 10px !important;
    font-size: 14.5px !important;
    font-weight: 800 !important;
    background: linear-gradient(135deg, #ff6b00 0%, #ea580c 100%) !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3) !important;
    transition: all 0.2s ease !important;
}

.flizzy-btn-order-submit:not(:disabled):hover {
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%) !important;
    box-shadow: 0 6px 16px rgba(255, 107, 0, 0.4) !important;
    transform: translateY(-1px) !important;
}

/* ==================================================== */
/* OPTIMIZACIONES EXCLUSIVAS PARA MÓVIL (<= 768px)      */
/* ==================================================== */
@media (max-width: 768px) {
    .flizzy-orders-card {
        height: 100% !important;
        max-height: 100% !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        border-radius: 10px !important;
    }

    .orders-card-top-header {
        flex-shrink: 0 !important;
        padding: 8px 10px 6px !important;
    }

    .orders-header-title {
        font-size: 14px !important;
    }

    .orders-form-header {
        flex-shrink: 0 !important;
        margin: 6px 6px 4px !important;
        padding: 6px !important;
    }

    .orders-items-scroll-viewport {
        flex: 1 1 0px !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        padding: 0 4px 8px !important;
    }

    .flizzy-orders-table thead th {
        padding: 5px 3px !important;
        font-size: 10px !important;
        letter-spacing: 0.02em !important;
    }

    .flizzy-orders-table tbody td {
        padding: 6px 3px !important;
    }

    .order-product-name {
        font-size: 12.5px !important;
        line-height: 1.25 !important;
        word-break: break-word;
    }

    .order-product-time {
        font-size: 9.5px !important;
    }

    .order-combo-name {
        font-size: 12.5px !important;
        line-height: 1.25 !important;
        word-break: break-word;
    }

    .order-combo-subitems {
        font-size: 10.5px !important;
    }

    .row-icon-badge {
        width: 22px !important;
        height: 22px !important;
        font-size: 11px !important;
        border-radius: 6px !important;
    }

    :deep(.flizzy-stepper-input) {
        max-width: 76px !important;
        min-width: 68px !important;
        width: 100% !important;
    }

    :deep(.flizzy-stepper-input .n-input__input-el) {
        font-size: 12px !important;
        padding: 0 2px !important;
        text-align: center !important;
    }

    :deep(.flizzy-stepper-input .n-input-number-button) {
        width: 18px !important;
        padding: 0 !important;
    }

    .qty-pill {
        padding: 2px 5px !important;
        font-size: 11px !important;
    }

    .order-price-col {
        font-size: 12px !important;
        padding-left: 2px !important;
        padding-right: 2px !important;
    }

    .btn-order-delete {
        width: 24px !important;
        height: 24px !important;
        padding: 0 !important;
    }

    .btn-order-delete :deep(svg) {
        width: 16px !important;
        height: 16px !important;
    }

    .orders-card-footer {
        flex-shrink: 0 !important;
        position: relative !important;
        bottom: auto !important;
        background: #ffffff !important;
        border-top: 1.5px solid #e2e8f0 !important;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05) !important;
        padding: 8px 10px max(10px, env(safe-area-inset-bottom, 10px)) !important;
        margin-top: 0 !important;
    }

    .footer-total-box {
        padding: 5px 8px !important;
    }

    .footer-total-box .total-label {
        font-size: 11px !important;
    }

    .footer-total-box .total-value {
        font-size: 16px !important;
    }

    .flizzy-btn-order-submit {
        height: 44px !important;
        font-size: 15px !important;
    }

    .customer-total-badge {
        font-size: 12px !important;
        padding: 2px 6px !important;
    }
}
</style>
