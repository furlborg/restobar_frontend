<template>
    <n-card title="Pedidos" :bordered="false" class="h-100" content-class="overflow-auto">
        <template #header-extra>
            <div v-if="userStore.hasPermission('charge_order')">
                <n-button v-if="!($route.name === 'TablePayment')" type="success" :disabled="!orderStore.orderId" text @click="navigateToPayment">
                    <v-icon class="me-1" name="fa-coins" />
                    <span class="fs-6">Cobrar</span>
                </n-button>
                <router-link v-else class="text-decoration-none" :to="{ name: 'ProductCategories', params: { table: $route.params.table } }">
                    <n-button type="info" text>
                        <v-icon class="me-1" name="md-add-round" />
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
                            <n-form-item-gi v-if="shouldEnterCustomerName" :span="!shouldEnterCustomerName ? 2 : 1" label="Cliente">
                                <n-input v-model:value="localAskFor" placeholder="Nombre del cliente" :readonly="isWaiter" :disabled="isWaiter" />
                            </n-form-item-gi>
                            <n-form-item-gi v-if="shouldSelectOrderUser" :span="!shouldEnterCustomerName ? 2 : 1" label="Mozo">
                                <n-select :options="activeUsersStore.usersOptions" v-model:value="localOrderUser" placeholder="Seleccione un mozo" filterable />
                            </n-form-item-gi>
                            <n-form-item-gi v-if="shouldShowCustomerMode" :span="!shouldShowCustomerMode ? 2 : customers.length > 0 ? 1 : 2" label="Agregar Cliente">
                                <n-input-group>
                                    <n-input v-model:value="newCustomerName" placeholder="Nombre del cliente" @keyup.enter="addCustomerLocal" />
                                    <n-button type="primary" @click="addCustomerLocal" :disabled="!newCustomerName.trim()">
                                        <v-icon class="me-1" name="md-personadd-round" />
                                    </n-button>
                                </n-input-group>
                            </n-form-item-gi>
                            <n-form-item-gi v-if="shouldShowCustomerMode && customers.length > 0" :span="1" label="Seleccionar Cliente">
                                <n-select :options="customerOptions" v-model:value="localSelectedCustomerId" placeholder="Seleccione un cliente" filterable />
                            </n-form-item-gi>
                            <n-form-item-gi v-if="shouldAllowAddingProducts" :span="2" label="Buscar producto">
                                <n-input-group>
                                    <n-auto-complete v-model:value="productSearch" :options="productOptions" :get-show="showOptions" :loading="searching"
                                        :render-label="renderLabel" :input-props="{ autocomplete: 'disabled' }" placeholder="Nombre del producto"
                                        clear-after-select @select="selectProduct" />
                                </n-input-group>
                            </n-form-item-gi>
                        </n-grid>
                    </n-form>

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
                                <tr v-if="order.quantity > 0" :key="index" style="cursor: pointer" @click="openOrderModal(index)">
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
                                        <n-button v-if="!isPaymentRoute" type="error" text @click.stop="handleRemoveOrder(order, index)">
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
                                        :disabled="!orderStore.orderList.length || checkState || loading" @click="validateSend()" text block>
                                        <v-icon class="me-2" name="md-notealt-twotone" scale="1.5" />
                                        <span class="fs-4">{{ orderStore.orderId ? 'Actualizar' : 'Realizar' }} pedido</span>
                                    </n-button>
                                </td>
                                <td colspan="2" class="fs-6 fw-bold">S/. {{ formatPrice(orderStore.orderTotal) }}</td>
                            </tr>
                        </tfoot>
                    </n-table>

                    <div v-else>
                        <template v-for="(customer, customerIndex) in customers" :key="customer.id">
                            <n-card class="mb-4" size="small" :title="customer.name" :bordered="false" header-class="p-0 pb-2" content-class="p-0">
                                <template #header-extra>
                                    <n-space>
                                        <n-text class="fs-6 fw-bold">S/. {{ formatPrice(getCustomerTotal(customer.id)) }}</n-text>
                                        <n-button v-if="!isPaymentRoute" type="error" size="small" @click="confirmRemoveCustomer(customerIndex, customer.name)"
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
                                        <template v-for="(order, orderIndex) in getCustomerOrders(customer.id)" :key="orderIndex">
                                            <tr v-if="order.quantity > 0" style="cursor: pointer" @click="openOrderModal(getGlobalOrderIndex(order.id))">
                                                <td>
                                                    <n-button v-if="!isPaymentRoute" type="info" text><v-icon name="md-listalt-round" /></n-button>
                                                </td>
                                                <td>
                                                    <span>{{ order.product_name }}</span><br>
                                                    <span style="color: #15151c; font-size: 12px;">{{ order.modified }}</span>
                                                </td>
                                                <td>
                                                    <n-input-number v-if="!isPaymentRoute" class="border-top-0" size="small"
                                                        :min="order.id ? saleStore.getOrderQuantity(order.id) : 1" v-model:value="order.quantity" @click.stop />
                                                    <template v-else>{{ order.quantity }}</template>
                                                </td>
                                                <td>S/. {{ formatPrice(order.subTotal) }}</td>
                                                <td>
                                                    <n-button v-if="!isPaymentRoute" type="error" text @click.stop="removeOrderItem(order.product, order.customer?.id)">
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

        <template #footer>
            <div v-if="shouldShowCustomerMode" class="order-actions p-2" style="flex-shrink: 0; background: #f8f9fa; border-radius: 6px;">
                <n-space vertical>
                    <n-space justify="space-between" align="center">
                        <n-text class="fs-5 fw-bold">Total General: S/. {{ formatPrice(getTotalAmount()) }}</n-text>
                        <n-text type="info">{{ customers.length }} cliente(s)</n-text>
                    </n-space>
                    <n-button v-if="!isPaymentRoute" :loading="loading" :type="orderStore.orderId ? 'info' : 'primary'"
                        :disabled="!hasAnyOrders() || checkState || loading" size="large" @click="validateSend()" block>
                        <v-icon class="me-2" name="md-notealt-twotone" scale="1.2" />
                        <span class="fs-5">{{ orderStore.orderId ? 'Actualizar' : 'Realizar' }} pedido</span>
                    </n-button>
                </n-space>
            </div>
        </template>
    </n-card>

    <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="currentOrder" @success="showModal = false" />
</template>

<script>
import OrderIndications from "./OrderIndications";
import { defineComponent, ref, computed, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NThing, NTag, NSpace, NText, useMessage, useDialog } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { searchProductByName } from "@/api/modules/products";
import { lighten } from "@/utils";

export default defineComponent({
    name: "TableOrder",
    components: { OrderIndications },
    props: {
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
        },
        selectedCustomer: {
            type: Object,
            default: null
        },
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
        checkState: {
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
        'update:selectedCustomerId',
        'update:ask_for',
        'update:orderUser'
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

        // Computed properties basadas en props
        const localSelectedCustomerId = computed({
            get: () => props.selectedCustomerId,
            set: (value) => emit('update:selectedCustomerId', value)
        });

        const localAskFor = computed({
            get: () => props.ask_for,
            set: (value) => emit('update:ask_for', value)
        });

        const localOrderUser = computed({
            get: () => props.orderUser,
            set: (value) => emit('update:orderUser', value)
        });

        // Funciones que emiten eventos
        const validateSend = () => emit('validateSend');
        const addCustomer = (name) => emit('addCustomer', name);
        const removeCustomer = (index) => emit('removeCustomer', index);
        const deleteOrderDetail = (index, id) => emit('deleteOrderDetail', index, id);
        const goToFirstTab = () => emit('goToFirstTab');

        const newCustomerName = ref("");
        const showModal = ref(false);
        const itemIndex = ref(null);
        const searching = ref(false);
        const productSearch = ref("");
        const products = ref([]);

        const isWaiter = computed(() => userStore.user.role === 'MOZO');
        const isPaymentRoute = computed(() => route.name === 'TablePayment');
        const shouldEnterCustomerName = computed(() => settingsStore.businessSettings?.order?.order_customer_name && !props.shouldShowCustomerMode);
        const shouldSelectOrderUser = computed(() => settingsStore.businessSettings?.order?.select_order_user && !isWaiter.value);
        const shouldAllowAddingProducts = computed(() => !props.shouldShowCustomerMode || props.selectedCustomerId);
        const currentOrder = computed(() => orderStore.orderList[itemIndex.value]);

        const customerOptions = computed(() => props.customers.map(customer => ({ value: customer.id, label: customer.name })));
        const productOptions = computed(() => products.value.map((product) => ({
            value: product.id, label: product.name, disabled: product.is_disabled,
            category: productStore.getCategorieDescription(product.category), stock: product.stock
        })));

        const openOrderModal = (index) => {
            itemIndex.value = index;
            showModal.value = true;
        };

        const addCustomerLocal = () => {
            if (newCustomerName.value.trim()) {
                addCustomer(newCustomerName.value.trim());
                newCustomerName.value = "";
            }
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

        const getCustomerOrders = (customerId) => orderStore.orderList.filter(order => order.customer && order.customer.id === customerId && order.quantity > 0);
        const getCustomerTotal = (customerId) => getCustomerOrders(customerId).reduce((total, order) => total + order.subTotal, 0);
        const getTotalAmount = () => orderStore.orderTotal;
        const formatPrice = (price) => isNaN(price) ? "0.00" : Number(price).toFixed(2);
        const hasAnyOrders = () => orderStore.orderList.some(order => order.quantity > 0);
        const getGlobalOrderIndex = (orderId) => orderStore.orderList.findIndex(order => order.id === orderId);

        const handleRemoveOrder = (order, index) => {
            if (!order.id) {
                orderStore.orderList.splice(index, 1);
                nullifyTableOrder(order);
            } else {
                deleteOrderDetail(index, order.id);
            }
        };

        const removeOrderItem = (productId, customerId) => {
            const index = orderStore.orderList.findIndex(order => order.product === productId && (!order.customer || order.customer.id === customerId));
            if (index !== -1) {
                const order = orderStore.orderList[index];
                handleRemoveOrder(order, index);
            }
        };

        const nullifyTableOrder = async (order) => {
            if (!orderStore.orderList.length && orderStore.orderId) {
                console.log('Nullifying table order for:', order);
            }
        };

        const showOptions = (value) => {
            if (value.length >= 3) {
                searching.value = true;
                searchProductByName(value).then((response) => {
                    if (response.status === 200) products.value = response.data;
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

        const selectProduct = id => {
            const item = products.value.find(product => product.id === id);
            if (item.has_supplies && item.has_stock) {
                orderStore.addOrder(item, props.customers[props.customers.findIndex(c => c.id === props.selectedCustomerId)]);
                console.log('Producto agregado a la orden');
            }
        };

        const renderLabel = (option) => {
            const t = option.label.split("-");
            let color = "#3B689F", text = "MESA";
            if (t.length > 1) {
                if (t[1].includes("LL")) {
                    color = "#926ED7";
                    text = "PARA LLEVAR";
                } else if (t[1].includes("D")) {
                    color = "#995C4E";
                    text = "DELIVERY";
                }
            }
            return h(NThing, {}, {
                default: () => "",
                header: () => h(NSpace, { align: "center" }, {
                    default: () => [
                        h(NText, { depth: 2 }, { default: () => option.label }),
                        h(NTag, {
                            size: "small",
                            color: { color: lighten(color, 48), textColor: color, borderColor: lighten(color, 24) }
                        }, { default: () => text })
                    ]
                }),
                description: () => h(NSpace, { size: "small" }, {
                    default: () => [
                        h(NText, { depth: 3 }, { default: () => option.category }),
                        h(NText, { depth: 3 }, { default: () => `Stock: ${option.stock}` })
                    ]
                })
            });
        };

        const navigateToPayment = () => {
            goToFirstTab();
            router.push({ name: 'TablePayment', params: { table: route.params.table } });
        };

        return {
            // Stores and router
            userStore, activeUsersStore, route, router, tableStore, settingsStore, genericsStore, productStore, orderStore, saleStore,
            // Reactive state
            newCustomerName, showModal, itemIndex, searching, productSearch, products,
            // Computed properties
            localSelectedCustomerId, localAskFor, localOrderUser, shouldEnterCustomerName, shouldSelectOrderUser,
            shouldAllowAddingProducts, currentOrder, customerOptions, productOptions, isWaiter, isPaymentRoute,
            // Methods
            showOptions, selectProduct, renderLabel, navigateToPayment, addCustomerLocal, confirmRemoveCustomer,
            getCustomerOrders, getCustomerTotal, getTotalAmount, formatPrice, hasAnyOrders, getGlobalOrderIndex,
            removeOrderItem, validateSend, deleteOrderDetail, nullifyTableOrder, openOrderModal, handleRemoveOrder,
            // Props (direct access for template)
            ...props
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
</style>
