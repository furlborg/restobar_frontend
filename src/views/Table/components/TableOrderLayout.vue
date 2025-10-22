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
                    <router-view/>
                </n-gi>
                <n-gi :span="!shouldShowCustomerMode ? '4' : '5 xl:4'" style="height: calc(100vh - 165px);">
                    <TableOrder
                            :ask_for="ask_for"
                            :orderUser="orderUser"
                            :loading="loading"
                            :checkState="checkState"
                            @validateSend="validateSend"
                            @addCustomer="addCustomer"
                            @removeCustomer="removeCustomer"
                            @deleteOrderDetail="deleteOrderDetail"
                            @goToFirstTab="goToFirstTab"
                            @update:selectedCustomerId="selectedCustomerId = $event"
                            @update:ask_for="ask_for = $event"
                            @update:orderUser="orderUser = $event"
                    />
                </n-gi>
            </n-grid>
        </n-card>
        <n-tabs v-else tab-style="background: #fff;" v-model:value="activeTab" type="segment" animated>
            <n-tab-pane name="main" tab="Principal">
                <n-card>
                    <router-view/>
                </n-card>
            </n-tab-pane>
            <n-tab-pane name="payment" tab="Orden">
                <TableOrder
                        :ask_for="ask_for"
                        :orderUser="orderUser"
                        :loading="loading"
                        :checkState="checkState"
                        @validateSend="validateSend"
                        @addCustomer="addCustomer"
                        @removeCustomer="removeCustomer"
                        @deleteOrderDetail="deleteOrderDetail"
                        @goToFirstTab="goToFirstTab"
                        @update:selectedCustomerId="selectedCustomerId = $event"
                        @update:ask_for="ask_for = $event"
                        @update:orderUser="orderUser = $event"
                />
            </n-tab-pane>
        </n-tabs>
        <!-- Modales -->
        <n-modal title="Registrar pedido" preset="card" v-model:show="showUserConfirm" closable :mask-closable="false" :class="modalClass">
            <n-form-item label="Ingrese código de usuario">
                <n-input type="password" v-model:value="userConfirm" placeholder="****"/>
            </n-form-item>
            <template #action>
                <n-space justify="end">
                    <n-button type="success" :loading="loading" :disabled="!userConfirm || loading" secondary
                              @click.prevent="orderStore.orderId ? performUpdateTableOrder() : performCreateTableOrder()">Confirmar
                    </n-button>
                </n-space>
            </template>
        </n-modal>
        <n-modal :class="modalClass" preset="card" v-model:show="showConfirm" title="Eliminando comanda" :mask-closable="false" closable
                 @close="resetAnulateData">
            <div v-if="!userStore.hasPermission('cancel_orderdetail')">
                <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                    <n-form-item label="Cantidad">
                        <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%"/>
                    </n-form-item>
                </n-form>
            </div>
            <div v-else>
                <div v-if="requireUserPass">
                    <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                        <n-form-item label="Ingrese su usuario" path="username">
                            <n-input v-model:value="dataAnulate.username"/>
                        </n-form-item>
                        <n-form-item label="Ingrese su contraseña" path="pass">
                            <n-input type="password" v-model:value="dataAnulate.pass"/>
                        </n-form-item>
                        <n-form-item label="Cantidad">
                            <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%"/>
                        </n-form-item>
                    </n-form>
                </div>
                <div v-else-if="requireGeneralPass">
                    <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                        <n-form-item label="Ingrese la contraseña" path="pass">
                            <n-input type="password" v-model:value="dataAnulate.pass"/>
                        </n-form-item>
                        <n-form-item label="Cantidad">
                            <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%"/>
                        </n-form-item>
                    </n-form>
                </div>
            </div>
            <div v-if="showConfigMessage">
                <span style="font-weight: 700; font-size: 16px">Para poder anular un pedido, primero debe de activar la configuración "Requerir clave de usuario para anular" en la sección de configuraciones.</span>
            </div>
            <template #action>
                <n-space justify="end">
                    <n-button type="success" secondary @click.prevent="performDeleteDetail" :disabled="showConfigMessage">Confirmar
                    </n-button>
                </n-space>
            </template>
        </n-modal>

        <ticket-preview ref="ticketPreview" v-model:show="showPdf" :data="pdfData" :hidden="true" :isUpdate="!!orderStore.orderId"
                        @printed="goHome" @canceled="goHome"/>
    </div>
</template>

<script>
import TableOrder from "./TableOrder.vue";
import TicketPreview from "@/views/Order/components/TicketPreview";
import { defineComponent, ref, computed, onMounted, watchEffect, provide } from "vue";
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
import { useBreakpoint } from "vooks";

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
        const rules = {
            username: { required: true, trigger: [ "blur", "input" ], message: "" },
            pass: { required: true, trigger: [ "blur", "input" ], message: "" }
        };

        const dataAnulate = ref({ username: "", pass: "" });
        const checkState = ref(false);
        const loading = ref(false);
        const ask_for = ref(undefined);
        const orderUser = ref(null);
        const orderUser_initial = ref(null);
        const customerIdCounter = ref(1);
        const customers = ref([]);
        const dataItems = ref([]);
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
        const activeTab = ref("main");

        const isMobile = computed(() => [ "xs", "s" ].includes(breakpointRef.value));
        const shouldShowCustomerMode = computed(() => orderStore.orderId ? orderStore.orderList.some(order => order.customer) : settingsStore.businessSettings?.order?.order_by_customer);
        const selectedCustomer = computed(() => customers.value.find(c => c.id === selectedCustomerId.value) || null);
        const modalClass = computed(() => ({
            "w-100": genericsStore.device === "mobile", "w-50": genericsStore.device === "tablet",
            "w-25": genericsStore.device === "desktop"
        }));
        const requireUserPass = computed(() => settingsStore.businessSettings.sale?.require_user_pass_to_null);
        const requireGeneralPass = computed(() => settingsStore.businessSettings.sale.require_general_pass_to_null);
        const showConfigMessage = computed(() => userStore.hasPermission("cancel_orderdetail") && !requireUserPass.value && !requireGeneralPass.value);

        watchEffect(() => {
            const ordersChanged = JSON.stringify(saleStore.order_initial) !== JSON.stringify(orderStore.orderList);
            const userChanged = orderUser_initial.value !== orderUser.value;
            // Si no hay pedido aún y solo cambió el usuario → no lo consideres un cambio importante
            if ( !orderStore.orderId && userChanged && !ordersChanged) {
                checkState.value = true;
                return;
            }
            checkState.value = !ordersChanged && !userChanged;
        });

        const goToFirstTab = () => {
            activeTab.value = "main";
        };

        const handleRouteGuard = (to, isLeave = false) => {
            if ([ "ProductCategories", "CategoriesItems", "TablePayment" ].includes(to.name)) return;

            if (checkState.value) {
                cleanupOrderStore();
                return;
            }

            const config = {
                title: "Cambios sin guardar",
                content: "¿Salir de todos modos?",
                positiveText: "Sí",
                onPositiveClick: () => {
                    checkState.value = true;
                    cleanupOrderStore();
                    router.push(to);
                },
                ...(isLeave ? {} : { negativeText: "No" }),
                closable: !isLeave
            };
            dialog.error(config);
            return false;
        };

        const cleanupOrderStore = () => {
            orderStore.orderId = null;
            orderStore.orders = [];
            saleStore.order_initial = [];
        };

        onBeforeRouteUpdate((to) => handleRouteGuard(to));
        onBeforeRouteLeave((to) => handleRouteGuard(to, true));

        const resetStores = () => {
            orderStore.orderId = null;
            orderStore.orders = [];
            saleStore.order_initial = [];
            customerIdCounter.value = 1;
            dataItems.value = [];
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

        const performRetrieveTableOrder = async() => {
            resetStores();
            try {
                const response = await retrieveTableOrder(table);
                dataItems.value = response.data.order_details;
                if (response.status === 200) {
                    console.log(response.data);
                    const { order_details: orderDetails, user: userId, ask_for: askFor, id } = response.data;
                    const detectedCustomers = extractCustomers(orderDetails);
                    orderStore.orders = orderDetails;
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
                    if ( !activeUsersStore.users.length) {
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
            checkState.value = true;
            cleanupOrderStore();
        };

        const expandOrderList = (orderList) => {
            const map = new Map();

            for (const item of orderList) {
                const qty = Number(item.quantity || 1);
                const price = parseFloat(item.price || 0);
                const indications = Array.isArray(item.indication) ? item.indication : [];

                // Si tiene indicaciones, agrupar por description
                if (indications.length > 0) {
                    for (const ind of indications) {
                        const desc = ind.description?.trim()?.toLowerCase() || "__empty__";
                        const key = `${item.product}__${desc}`;

                        if (!map.has(key)) {
                            map.set(key, {
                                ...item,
                                indication: desc === "__empty__" ? [] : [ { ...ind } ],
                                quantity: 1,
                                subTotal: price,
                            });
                        } else {
                            const existing = map.get(key);
                            existing.quantity += 1;
                            existing.subTotal = price * existing.quantity;
                        }
                    }
                } else {
                    // Unidades sin indicación
                    const key = `${item.product}__empty__`;
                    if (!map.has(key)) {
                        map.set(key, {
                            ...item,
                            indication: [],
                            quantity: qty,
                            subTotal: price * qty,
                        });
                    } else {
                        const existing = map.get(key);
                        existing.quantity += qty;
                        existing.subTotal = price * existing.quantity;
                    }
                }
            }

            return Array.from(map.values());
        };

        const performCreateTableOrder = async() => {
            loading.value = true;
            try {
                const createNewOrder = expandOrderList(orderStore.orderList);
                console.log(createNewOrder);
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
            } else if ( !item) {
                list.push(order);
            }
            return list;
        }, []);

        const normalizeOldOrders = (orderDetails = []) => {
            const map = new Map();

            for (const item of orderDetails) {
                const key = `${ item.product }-${ JSON.stringify(item.indication || []) }`;
                if (map.has(key)) {
                    const existing = map.get(key);
                    existing.quantity += item.quantity || 0;
                    existing.sub_total = (existing.sub_total || 0) + (item.sub_total || 0);
                    existing.sale_detail_total = (existing.sale_detail_total || 0) + (item.sale_detail_total || 0);
                } else {
                    map.set(key, { ...item });
                }
            }

            return Array.from(map.values());
        };

        const buildUpdatedOrderList = (oldOrders = [], newOrders = []) => {
            const updated = [];

            for (const newItem of newOrders) {
                const productId = newItem.product;
                const price = parseFloat(newItem.price?.parsedValue || newItem.price || 0);
                const newQty = Number(newItem.quantity) || 0;

                // Limpia indicaciones vacías
                const validIndications = (Array.isArray(newItem.indication) ? newItem.indication : []).filter(i => i?.description?.trim());

                const oldItem = oldOrders.find(o => o.product === productId);
                const oldQty = Number(oldItem?.quantity || 0);
                const baseId = oldItem?.id || newItem.id;

                // 🧩 Caso 1: Producto existente
                if (oldItem) {
                    const qtyChanged = newQty !== oldQty;

                    // Si hay nuevas indicaciones o cambios de cantidad
                    if (validIndications.length > 0) {
                        // 1️⃣ Genera registros individuales por cada indicación
                        for (const ind of validIndications) {
                            updated.push({
                                ...oldItem,
                                id: baseId,
                                indication: [ ind ],
                                quantity: 1,
                                subTotal: price,
                                sub_total: price,
                                sale_detail_total: price
                            });
                        }

                        // 2️⃣ Determina las unidades sin indicación restantes
                        let remainingQty;
                        if (qtyChanged) {
                            // si el usuario cambió la cantidad manualmente, restamos indicadas
                            remainingQty = Math.max(newQty - validIndications.length, 0);
                        } else {
                            // si la cantidad no cambió, respetamos la cantidad original
                            remainingQty = Math.max(oldQty - validIndications.length, 0);
                        }

                        if (remainingQty > 0) {
                            updated.push({
                                ...oldItem,
                                id: baseId,
                                indication: [],
                                quantity: remainingQty,
                                subTotal: price * remainingQty,
                                sub_total: price * remainingQty,
                                sale_detail_total: price * remainingQty
                            });
                        }
                    } else {
                        // No hay indicaciones — mantener la cantidad actual (nueva o vieja)
                        updated.push({
                            ...oldItem,
                            id: baseId,
                            indication: [],
                            quantity: newQty || oldQty,
                            subTotal: price * (newQty || oldQty),
                            sub_total: price * (newQty || oldQty),
                            sale_detail_total: price * (newQty || oldQty)
                        });
                    }
                }

                // 🧩 Caso 2: Producto nuevo
                else {
                    updated.push({
                        ...newItem,
                        id: newItem.id,
                        indication: validIndications,
                        quantity: newQty,
                        subTotal: price * newQty,
                        sub_total: price * newQty,
                        sale_detail_total: price * newQty
                    });
                }
            }

            // 🧹 Evita duplicados exactos (producto + indicación)
            const seen = new Set();
            return updated.filter(o => {
                const key = `${ o.product }-${ JSON.stringify(o.indication || []) }`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        function normalizeOrderDetails(details) {
            const grouped = {};

            // Agrupar por producto + descripción
            details.forEach((item) => {
                const desc =
                    item.indication?.[0]?.description?.trim().toLowerCase() || "";
                const key = `${ item.product }__${ desc }`;

                if ( !grouped[key]) grouped[key] = [];
                grouped[key].push(item);
            });

            const normalized = [];

            // Procesar cada grupo
            Object.values(grouped).forEach((items) => {
                const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

                // Si hay varios iguales, fusionar en uno solo
                const merged = {
                    ...items[0],
                    quantity: totalQty
                };

                normalized.push(merged);
            });

            // Agrupar por producto y re-asignar cantidades
            const byProduct = {};
            normalized.forEach((item) => {
                if ( !byProduct[item.product]) byProduct[item.product] = [];
                byProduct[item.product].push(item);
            });

            const finalNormalized = [];

            for (const items of Object.values(byProduct)) {
                const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
                items.forEach((item, index) => {
                    item.quantity = index === items.length - 1 ? totalQty : 1;
                    finalNormalized.push(item);
                });
            }

            return finalNormalized;
        }

        const performUpdateTableOrder = async() => {
            loading.value = true;
            try {

                const cleanOldOrders = normalizeOldOrders(dataItems.value);
                const createNewOrder = buildUpdatedOrderList(cleanOldOrders, orderStore.orderList);
                const tetas = normalizeOrderDetails(createNewOrder);
                console.log(tetas);
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

        const performNullifyTableOrder = async() => {
            try {
                const response = await cancelTableOrder(table, dataAnulate.value);
                if (response.status === 202) {
                    message.success("Pedido anulado correctamente!");
                    checkState.value = true;
                    cleanupOrderStore();
                    await router.push({ name: "TableHome" });
                }
            } catch (error) {
                console.error(error);
                message.error("Algo salió mal...");
            }
        };

        const nullifyTableOrder = async() => {
            if ( !orderStore.orderList.length && orderStore.orderId) await performNullifyTableOrder();
        };

        const resetDeleteState = () => {
            Object.assign(removingItem.value, { ind: "", id: "" });
            deleteQuantity.value = 1;
            maxQuantity.value = 1;
            showConfirm.value = false;
            dataAnulate.value = { username: "", pass: "" };
        };

        const performDeleteDetail = async() => {
            try {
                const response = await performDeleteOrderDetail(table, removingItem.value.id, dataAnulate.value, deleteQuantity.value);
                if (response.status === 204) {
                    orderStore.orderList.splice(removingItem.value.ind, 1);
                    saleStore.order_initial.splice(removingItem.value.ind, 1);
                    await nullifyTableOrder();
                    message.success("Comanda eliminada");
                } else if (response.status === 202) {
                    const { ind } = removingItem.value;
                    const { quantity } = response.data;
                    orderStore.orderList[ind].quantity -= quantity;
                    saleStore.order_initial[ind].quantity -= quantity;
                    saleStore.order_initial[ind].subTotal = saleStore.order_initial[ind].quantity * saleStore.order_initial[ind].price;
                    message.success("Comanda actualizada correctamente");
                    const data = await retrieveTableOrder(table);
                    dataItems.value = data.data.order_details;
                }
                resetDeleteState();
            } catch (error) {
                console.error(error);
                message.error("Error al anular, verifique sus datos...");
            }
        };

        const addCustomer = (name) => {
            if ( !name?.trim()) return;
            const newCustomer = { id: customerIdCounter.value++, name: name.trim() };
            customers.value.push(newCustomer);
            selectedCustomerId.value = newCustomer.id;
            return newCustomer;
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
            orderStore.orderList = orderStore.orderList.filter(order => !order.customer || order.customer.id !== customerId);
            customers.value.splice(customerIndex, 1);
            if (selectedCustomerId.value === customerId) {
                selectedCustomerId.value = customers.value[0]?.id || null;
            }
        };

        const deleteOrderDetail = (detailIndex, detailId) => {
            Object.assign(removingItem.value, { ind: detailIndex, id: detailId });
            const quantity = saleStore.getOrderQuantity(detailId);
            deleteQuantity.value = quantity;
            maxQuantity.value = quantity;
            showConfirm.value = true;
        };

        const resetAnulateData = () => dataAnulate.value = { username: "", pass: "" };
        const goHome = () => {
            cleanupOrderStore();
            router.push({ name: "TableHome" });
        };

        onMounted(async() => {
            await performRetrieveTableOrder();
        });

        provide("selectedCustomer", selectedCustomer);
        provide("shouldShowCustomerMode", shouldShowCustomerMode);

        return {
            isMobile, userStore, activeUsersStore, route, router, tableStore, table, settingsStore, genericsStore, productStore, orderStore,
            saleStore, shouldShowCustomerMode, showUserConfirm, userConfirm, loadingConfirm,
            loading, performCreateTableOrder, performUpdateTableOrder, showConfirm, dataAnulate, rules,
            performDeleteDetail, deleteQuantity, maxQuantity, showPdf, pdfData, ticketPreview, validateSend,
            deleteOrderDetail, modalClass, requireUserPass, requireGeneralPass, showConfigMessage, resetAnulateData,
            goHome, customers, selectedCustomerId, selectedCustomer, ask_for, orderUser, checkState, addCustomer, removeCustomer,
            goToFirstTab, activeTab
        };
    }
});
</script>
