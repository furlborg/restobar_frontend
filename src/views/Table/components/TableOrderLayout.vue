<template>
    <div>
        <n-page-header class="mb-2 px-4" @back="() => $router.push({ name: 'TableHome' })">
            <template #title>
                <n-text class="fs-2">{{ tableStore.getTableByID(table)?.description }}</n-text>
            </template>
        </n-page-header>
        <n-card v-if="!isMobile">
            <n-grid responsive="screen" cols="1 m:10">
                <n-gi :span="!shouldShowCustomerMode ? '6' : '5 xl:6'" style="height: calc(100vh - 165px);">
                    <router-view />
                </n-gi>
                <n-gi :span="!shouldShowCustomerMode ? '4' : '5 xl:4'" style="height: calc(100vh - 165px);">
                    <TableOrder
                        :ask_for="ask_for"
                        :orderUser="orderUser"
                        :loading="loading"
                        :hasUnsavedChanges="hasUnsavedChanges"
                        :customers="customers"
                        :selectedCustomerId="selectedCustomerId"
                        :shouldShowCustomerMode="shouldShowCustomerMode"
                        @validateSend="validateSend"
                        @addCustomer="addCustomer"
                        @removeCustomer="removeCustomer"
                        @deleteOrderDetail="deleteOrderDetail"
                        @goToFirstTab="goToFirstTab"
                        @update:selectedCustomerId="selectedCustomerId = $event"
                        @update:ask_for="ask_for = $event"
                        @update:orderUser="orderUser = $event"
                        @productSelect="handleProductClick"
                    />
                </n-gi>
            </n-grid>
        </n-card>
        <n-tabs v-else tab-style="background: #fff;" v-model:value="activeTab" type="segment" animated>
            <n-tab-pane name="main" tab="Principal">
                <n-card><router-view /></n-card>
            </n-tab-pane>
            <n-tab-pane name="payment" tab="Orden">
                <TableOrder
                    :ask_for="ask_for"
                    :orderUser="orderUser"
                    :loading="loading"
                    :hasUnsavedChanges="hasUnsavedChanges"
                    :customers="customers"
                    :selectedCustomerId="selectedCustomerId"
                    :shouldShowCustomerMode="shouldShowCustomerMode"
                    @validateSend="validateSend"
                    @addCustomer="addCustomer"
                    @removeCustomer="removeCustomer"
                    @deleteOrderDetail="deleteOrderDetail"
                    @goToFirstTab="goToFirstTab"
                    @update:selectedCustomerId="selectedCustomerId = $event"
                    @update:ask_for="ask_for = $event"
                    @update:orderUser="orderUser = $event"
                    @productSelect="handleProductClick"
                />
            </n-tab-pane>
        </n-tabs>
        <!-- Modales -->
        <n-modal title="Registrar pedido" preset="card" v-model:show="showUserConfirm" closable :mask-closable="false" :class="modalClass">
            <n-form-item label="Ingrese código de usuario">
                <n-input type="password" v-model:value="userConfirm" placeholder="****" />
            </n-form-item>
            <template #action>
                <n-space justify="end">
                    <n-button type="success" :loading="loading" :disabled="!userConfirm || loading" secondary @click.prevent="orderStore.orderId ? performUpdateTableOrder() : performCreateTableOrder()">Confirmar</n-button>
                </n-space>
            </template>
        </n-modal>
        <n-modal :class="modalClass" preset="card" v-model:show="showConfirm" title="Eliminando comanda" :mask-closable="false" closable @close="resetAnulateData">
            <div v-if="!userStore.hasPermission('cancel_orderdetail')">
                <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                    <n-form-item label="Cantidad">
                        <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%" />
                    </n-form-item>
                </n-form>
            </div>
            <div v-else>
                <div v-if="requireUserPass">
                    <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                        <n-form-item label="Ingrese su usuario" path="username">
                            <n-input v-model:value="dataAnulate.username" />
                        </n-form-item>
                        <n-form-item label="Ingrese su contraseña" path="pass">
                            <n-input type="password" v-model:value="dataAnulate.pass" />
                        </n-form-item>
                        <n-form-item label="Cantidad">
                            <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%" />
                        </n-form-item>
                    </n-form>
                </div>
                <div v-else-if="requireGeneralPass">
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
            <div v-if="showConfigMessage">
                <span style="font-weight: 700; font-size: 16px">Para poder anular un pedido, primero debe de activar la configuración "Requerir clave de usuario para anular" en la sección de configuraciones.</span>
            </div>
            <template #action>
                <n-space justify="end">
                    <n-button type="success" secondary @click.prevent="performDeleteDetail" :disabled="showConfigMessage">Confirmar</n-button>
                </n-space>
            </template>
        </n-modal>

        <ticket-preview ref="ticketPreview" v-model:show="showPdf" :data="pdfData" :hidden="true" :isUpdate="!!orderStore.orderId" @printed="goHome" @canceled="goHome" />
    </div>
</template>

<script>
import TableOrder from "./TableOrder.vue";
import TicketPreview from "@/views/Order/components/TicketPreview";
import { defineComponent, ref, computed, onMounted, watchEffect, provide } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { useDialog, useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { retrieveTableOrder, createTableOrder, updateTableOrder, cancelTableOrder, performDeleteOrderDetail } from "@/api/modules/tables";
import { cloneDeep } from "@/utils";
import { useBreakpoint } from 'vooks';

export default defineComponent({
    name: "TableOrderLayout",
    components: { TableOrder, TicketPreview },
    setup() {
        const breakpointRef = useBreakpoint();
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

        const table = route.params.table;
        const rules = { username: { required: true, trigger: ["blur", "input"], message: "" }, pass: { required: true, trigger: ["blur", "input"], message: "" } };

        const dataAnulate = ref({ username: "", pass: "" });
        const loading = ref(false);
        const ask_for = ref(undefined);
        const orderUser = ref(null);
        const orderUser_initial = ref(null);
        const customerIdCounter = ref(1);
        const customers = ref([]);
        const selectedCustomerId = ref(null);
        const showConfirm = ref(false);
        const deleteQuantity = ref(1);
        const maxQuantity = ref(1);
        const removingItem = ref({ ind: null, id: null });
        const showUserConfirm = ref(false);
        const loadingConfirm = ref(false);
        const userConfirm = ref("");
        const showPdf = ref(false);
        const pdfData = ref(null);
        const ticketPreview = ref(null);
        const activeTab = ref('main')
        const isMobile = computed(() => ['xs', 's'].includes(breakpointRef.value));
        const shouldShowCustomerMode = computed(() => orderStore.orderId ? orderStore.orderList.some(order => order.customer) : settingsStore.businessSettings?.order?.order_by_customer);
        const selectedCustomer = computed(() => customers.value.find(c => c.id === selectedCustomerId.value) || null);
        const modalClass = computed(() => ({ 'w-100': genericsStore.device === 'mobile', 'w-50': genericsStore.device === 'tablet', 'w-25': genericsStore.device === 'desktop' }));
        const requireUserPass = computed(() => settingsStore.businessSettings.sale?.require_user_pass_to_null);
        const requireGeneralPass = computed(() => settingsStore.businessSettings.sale.require_general_pass_to_null);
        const showConfigMessage = computed(() => userStore.hasPermission('cancel_orderdetail') && !requireUserPass.value && !requireGeneralPass.value);

        const hasUnsavedChanges = computed(() => {
            const ordersChanged = JSON.stringify(saleStore.order_initial) !== JSON.stringify(orderStore.orderList);
            const userChanged = orderUser_initial.value !== orderUser.value;
            // Si no hay pedido aún y solo cambió el usuario → no lo consideres un cambio importante
            if (!orderStore.orderId && userChanged && !ordersChanged) {
                checkState.value = true;
                return;
            }
            checkState.value = !ordersChanged && !userChanged;
        });

        const goToFirstTab = () => activeTab.value = 'main';

        const handleRouteGuard = (to, isLeave = false) => {
            if (["ProductCategories", "CategoriesItems"].includes(to.name)) return;

            if (hasUnsavedChanges.value) {
                dialog.error({
                    title: "Cambios sin guardar",
                    content: "¿Salir de todos modos?",
                    positiveText: "Sí",
                    onPositiveClick: () => {
                        cleanupOrderStore();
                        router.push(to);
                    },
                    ...(isLeave ? {} : { negativeText: "No" }),
                    closable: !isLeave
                });
                return false;
            }
        };

        const cleanupOrderStore = () => {
            orderStore.orderId = null;
            orderStore.orders = [];
            saleStore.order_initial = [];
        };

        const resetStores = () => {
            orderStore.orderId = null;
            orderStore.orders = [];
            saleStore.order_initial = [];
            customerIdCounter.value = 1;
        };

        const extractCustomers = (orderDetails) => {
            const detectedCustomers = [];
            const seenIds = new Set();
            orderDetails.forEach(item => {
                const cid = item.customer?.id;
                if (cid && !seenIds.has(cid)) {
                    seenIds.add(cid);
                    detectedCustomers.push(item.customer);
                }
            });
            return detectedCustomers;
        };

        const performRetrieveTableOrder = async () => {
            resetStores();
            try {
                const response = await retrieveTableOrder(table);
                if (response.status === 200) {
                    const { order_details: orderDetails, user: userId, ask_for: askFor, id } = response.data;
                    const mappedOrderDetails = orderDetails.map(detail => {
                        if (detail.product_set) {
                            return {
                                from_menu: true,
                                product_set_id: detail.product_set.id,
                                order_detail_id: detail.id,
                                name: detail.product_set.menu_name,
                                price: detail.product_set.price,
                                quantity: detail.product_set.quantity,
                                items: Array.isArray(detail.product_set.items)
                                    ? detail.product_set.items.map(item => ({
                                        id: item.id,
                                        product_phase_id: item.product_phase.id,
                                        product_id: item.product.id,
                                        product_name: item.product.name,
                                        phase_name: item.product_phase.phase_name,
                                        quantity: item.quantity,
                                    }))
                                    : [],
                                ...(detail.id ? { id: detail.id } : {}),
                                ...(detail.customer ? { customer: detail.customer } : {}),
                            }
                        }
                        return detail;
                    });
                    const detectedCustomers = extractCustomers(mappedOrderDetails);
                    orderStore.orders = mappedOrderDetails;
                    customers.value = detectedCustomers;
                    selectedCustomerId.value = detectedCustomers[0]?.id || null;
                    ask_for.value = askFor;
                    orderStore.orderId = id;
                    saleStore.order_initial = cloneDeep(orderStore.orderList);
                    customerIdCounter.value = detectedCustomers.length + 1;
                    orderUser_initial.value = userId;
                    orderUser.value = userId;
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    resetStores();
                    // const initialUser = activeUsersStore.usersOptions[0]?.value;
                    // orderUser_initial.value = initialUser;
                    // orderUser.value = userStore.user.role === 'MOZO' ? userStore.user.id : initialUser;

                    // Aseguramos que la lista de usuarios activos esté cargada
                    if (!activeUsersStore.users.length) {
                        await activeUsersStore.initializeStore();
                    }

                    const currentUserId = userStore.user?.id ?? null;
                    const users = activeUsersStore.usersOptions;

                    const firstUser = users[0]?.value ?? null;
                    const userInList = activeUsersStore.users.some(u => u.id === currentUserId);

                    // 👇 Si el usuario logueado está en la lista, lo usamos.
                    // Si no, usamos el primer usuario disponible.
                    const defaultUserId = userInList ? currentUserId : firstUser;

                    orderUser_initial.value = defaultUserId;
                    orderUser.value = defaultUserId;

                } else {
                    console.error(error);
                    message.error("Algo salió mal...");
                }
            } finally {
                loading.value = false;
            }
        };

        const resetConfirmState = () => {
            userConfirm.value = "";
            loadingConfirm.value = false;
            showUserConfirm.value = false;
            loading.value = false;
        };

        const handleOrderSuccess = (response) => {
            pdfData.value = response.data;
            showPdf.value = true;
            setTimeout(() => ticketPreview.value.generate(), 250);
            cleanupOrderStore();
        };

        const performCreateTableOrder = async () => {
            loading.value = true;
            try {
                const response = await createTableOrder(table, orderStore.orderList, orderUser.value, ask_for.value);
                if (response.status === 201) handleOrderSuccess(response);
            } catch (error) {
                console.error(error);
            } finally {
                resetConfirmState();
            }
        };

        const evalOrderList = (details) => details.reduce((list, order) => {
            const item = saleStore.order_initial.find(v => v.id === order.id);
            if (item && order.quantity > item.quantity) {
                const newOrder = cloneDeep(order);
                newOrder.quantity = order.quantity - item.quantity;
                newOrder.indication = newOrder.indication.slice(order.quantity - 1);
                list.push(newOrder);
            } else if (item && JSON.stringify(order.indication) !== JSON.stringify(item.indication)) {
                list.push(cloneDeep(order));
            } else if (!item) {
                list.push(order);
            }
            return list;
        }, []);

        const performUpdateTableOrder = async () => {
            loading.value = true;
            try {
                const response = await updateTableOrder(table, orderStore.orderId, orderStore.orderList, orderUser.value, ask_for.value);
                if (response.status === 202) {
                    response.data.order_details = evalOrderList(response.data.order_details);
                    handleOrderSuccess(response);
                }
            } catch (error) {
                console.error(error);
                message.error("Algo salió mal...");
            } finally {
                resetConfirmState();
            }
        };

        const performNullifyTableOrder = async () => {
            try {
                const response = await cancelTableOrder(table, dataAnulate.value);
                if (response.status === 202) {
                    message.success("Pedido anulado correctamente!");
                    cleanupOrderStore();
                    router.push({ name: "TableHome" });
                }
            } catch (error) {
                console.error(error);
                message.error("Algo salió mal...");
            }
        };

        const nullifyTableOrder = async () => {
            if (!orderStore.orderList.length && orderStore.orderId) {
                await performNullifyTableOrder();
            }
        };

        const resetDeleteState = () => {
            Object.assign(removingItem.value, { ind: "", id: "" });
            deleteQuantity.value = 1;
            maxQuantity.value = 1;
            showConfirm.value = false;
            dataAnulate.value = { username: "", pass: "" };
        };

        const performDeleteDetail = async () => {
            try {
                const response = await performDeleteOrderDetail(table, removingItem.value.id, dataAnulate.value, deleteQuantity.value);
                if (response.status === 204) {
                    orderStore.orderList.splice(removingItem.value.ind, 1);
                    saleStore.order_initial.splice(removingItem.value.ind, 1);
                    nullifyTableOrder();
                    message.success("Comanda eliminada");
                } else if (response.status === 202) {
                    const { ind } = removingItem.value;
                    const { quantity } = response.data;
                    orderStore.orderList[ind].quantity -= quantity;
                    saleStore.order_initial[ind].quantity -= quantity;
                    saleStore.order_initial[ind].subTotal = saleStore.order_initial[ind].quantity * saleStore.order_initial[ind].price;
                    message.success("Comanda actualizada correctamente");
                }
                resetDeleteState();
            } catch (error) {
                console.error(error);
                message.error("Error al anular, verifique sus datos...");
            }
        };

        const addCustomer = (name) => {
            if (!name?.trim()) return;
            const newCustomer = { id: customerIdCounter.value++, name: name.trim() };
            customers.value = [...customers.value, newCustomer];
            selectedCustomerId.value = newCustomer.id;
        };

        const validateSend = () => {
            if (userStore.user.role === "MOZO") {
                showUserConfirm.value = true;
            } else {
                orderStore.orderId ? performUpdateTableOrder() : performCreateTableOrder();
            }
            orderUser_initial.value = orderUser.value;
        };

        const removeCustomer = (customerIndex) => {
            const customerId = customers.value[customerIndex].id;
            
            orderStore.orders = orderStore.orders.filter(order => !order.customer || order.customer.id !== customerId);
            saleStore.order_initial = saleStore.order_initial.filter(order => !order.customer || order.customer.id !== customerId);
            customers.value.splice(customerIndex, 1);
            
            if (selectedCustomerId.value === customerId) {
                selectedCustomerId.value = customers.value[0]?.id || null;
            }
        };

        const handleProductClick = (product) => {
            if (!product.has_stock || !product.has_supplies) return;

            if (shouldShowCustomerMode.value && !selectedCustomer.value) {
                message.warning("Seleccione un cliente primero");
                return;
            }

            orderStore.addOrder(product, selectedCustomer.value);
        };

        const deleteOrderDetail = (detailIndex, detailId) => {
            Object.assign(removingItem.value, { ind: detailIndex, id: detailId });
            const quantity = saleStore.getOrderQuantity(detailId);
            deleteQuantity.value = quantity;
            maxQuantity.value = quantity;
            showConfirm.value = true;
        };

        const resetAnulateData = () => {
            dataAnulate.value = { username: "", pass: "" };
        };

        const goHome = () => {
            cleanupOrderStore();
            router.push({ name: "TableHome" });
        };

        onMounted(() => performRetrieveTableOrder());

        onBeforeRouteUpdate(handleRouteGuard);
        onBeforeRouteLeave((to) => handleRouteGuard(to, true));

        provide("customers", customers);
        provide("selectedCustomer", selectedCustomer);
        provide("shouldShowCustomerMode", shouldShowCustomerMode);
        provide("handleProductClick", handleProductClick);

        return {
            isMobile, userStore, activeUsersStore, route, router, tableStore, table, settingsStore, 
            genericsStore, productStore, orderStore, saleStore, shouldShowCustomerMode, 
            showUserConfirm, userConfirm, loadingConfirm, loading, performCreateTableOrder, 
            performUpdateTableOrder, showConfirm, dataAnulate, rules, performDeleteDetail, 
            deleteQuantity, maxQuantity, showPdf, pdfData, ticketPreview, validateSend, deleteOrderDetail, 
            modalClass, requireUserPass, requireGeneralPass, showConfigMessage, resetAnulateData, goHome, 
            customers, selectedCustomerId, selectedCustomer, ask_for, orderUser, hasUnsavedChanges, 
            addCustomer, removeCustomer, goToFirstTab, activeTab, handleProductClick
        };
    }
});
</script>
