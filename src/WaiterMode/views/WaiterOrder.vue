<template>
    <n-tabs v-model:value="activeTab" type="line" justify-content="space-around">
        <template #prefix>
            <n-button class="ms-2" :disabled="$route.name !== 'WCategories'" text @click="showDrawer = true">
                <v-icon name="md-search-round" />
            </n-button>
            <ProductsDrawer v-model:show="showDrawer" />
        </template>
        <n-tab-pane class="p-0" name="menu" tab="Carta">
            <router-view></router-view>
        </n-tab-pane>
        <n-tab-pane v-if="canUseMenus" class="p-0" name="menus" tab="Menús">
            <WaiterMenus />
        </n-tab-pane>
        <n-tab-pane v-if="canUseCombos" class="p-0" name="combos" tab="Combos">
            <WaiterCombos />
        </n-tab-pane>
        <n-tab-pane id="OrderPane" name="order" tab="Pedido"
            :disabled="!orderStore.orderId && orderStore.fullOrderList.length === 0">
            <n-card title="Pedido" size="small" :segmented="{ content: 'hard' }">
                <template #header-extra>
                    <n-button v-if="userStore.hasPermission('print_order_prebill')" type="info" secondary size="small"
                        @click="printOrderPrebill">
                        <v-icon name="fa-file-invoice-dollar" />
                    </n-button>
                </template>
                <!-- <n-h2>Pedido</n-h2> -->
                <n-list class="m-0">
                    <template v-for="(order, index) in currentOrderList" :key="index">
                        <n-list-item v-if="order.quantity > 0" @click="openIndications(order, index)">
                            <n-thing>
                                <template #header>
                                    <n-tag>{{ order.quantity }}</n-tag>
                                    <!-- Caso producto normal -->
                                    <n-text v-if="order.product_name" class="ms-2">
                                        <n-tag v-if="order.customer" size="small" type="success" class="me-1">
                                            {{ order.customer.name }}
                                        </n-tag>
                                        {{ order.product_name }}
                                    </n-text>
                                    <!-- Caso menú -->
                                    <n-text v-else-if="order.from_menu" class="ms-2">
                                        <n-icon color="#18a058" class="me-1">
                                            <v-icon name="md-restaurant-round" />
                                        </n-icon>
                                        <n-tag v-if="order.customer" size="small" type="success" class="me-1">
                                            {{ order.customer.name }}
                                        </n-tag>
                                        {{ order.name }}
                                    </n-text>
                                    <!-- Caso combo -->
                                    <n-text v-else-if="order.from_combo" class="ms-2">
                                        <n-icon color="#f0a020" class="me-1">
                                            <v-icon name="gi-hot-meal" />
                                        </n-icon>
                                        <n-tag v-if="order.customer" size="small" type="success" class="me-1">
                                            {{ order.customer.name }}
                                        </n-tag>
                                        {{ order.name }}
                                    </n-text>
                                </template>

                                <template #header-extra>
                                    <n-text>
                                        S/. {{ (order.quantity * order.price).toFixed(2) }}
                                    </n-text>
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
            </n-card>
            <ProductIndications v-model:show="showModal" preset="card" title="Indicaciones"
                :product="currentOrderList[itemIndex]" @success="showModal = false" />
            <PreviewDrawer ref="previewDrawer" v-model:show="showPreview" :data="previewData" :preVoucher="true"
                :previewOnly="true" />
        </n-tab-pane>
    </n-tabs>
</template>

<script setup>
import { ref, onUpdated, onMounted, onUnmounted, provide, computed, nextTick } from "vue";
import ProductsDrawer from "../components/ProductsDrawer";
import WaiterMenus from "./WaiterMenus.vue";
import WaiterCombos from "./WaiterCombos.vue";
import PreviewDrawer from "@/views/Sale/components/PreviewDrawer";
import { useMessage, useDialog } from "naive-ui";
import {
    useRoute,
    useRouter,
    onBeforeRouteLeave,
    onBeforeRouteUpdate
} from "vue-router";
import ProductIndications from "./ProductIndications";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";
import { useWaiterStore } from "@/store/modules/waiter";
import { useOrderStore } from "@/store/modules/order";
import { useUserStore } from "@/store/modules/user";
import { useSaleStore } from "@/store/modules/sale";
import { retrieveTableOrder } from "@/api/modules/tables";
import { cloneDeep } from "@/utils";
import VoucherPrint from "@/hooks/PrintsTemplates/Voucher/Voucher.js";
import { useTableLock } from "@/composables/useTableLock";
import { useTableStore } from "@/store/modules/table";

const settingsStore = useSettingsStore();
const businessStore = useBusinessStore();
const waiterStore = useWaiterStore();
const orderStore = useOrderStore();
const saleStore = useSaleStore();
const userStore = useUserStore();
const tableStore = useTableStore();

const canUseMenus = computed(() => {
    const showMenus = settingsStore.business_settings?.modules?.show_menus ?? true;
    return showMenus && userStore.hasPermission('use_combos_menus');
});

const canUseCombos = computed(() => {
    const showCombos = settingsStore.business_settings?.modules?.show_combos ?? true;
    return showCombos && userStore.hasPermission('use_combos_menus');
});

const { wsLockTable, wsUnlockTable } = useTableLock();
const message = useMessage();
const dialog = useDialog();
const route = useRoute();
const router = useRouter();
const showDrawer = ref(false);
const showModal = ref(false);
const itemIndex = ref(null);
const activeTab = ref("menu"); // Controlar pestaña activa

const ALLOWED_ROUTES = ["WCategories", "WProducts"];

// Provide function para que WMenus pueda cambiar la pestaña
const switchToOrderTab = () => {
    activeTab.value = "order";
};

provide('switchToOrderTab', switchToOrderTab);

// Computed para hacer la lista más reactiva
const currentOrderList = computed(() => {
    return orderStore.fullOrderList;
});

const canOpenIndications = (order) => {
    return !!order && !order.from_menu && !order.from_combo;
};

const openIndications = (order, index) => {
    if (!canOpenIndications(order)) return;
    itemIndex.value = index;
    showModal.value = true;
};

onBeforeRouteUpdate((to) => {
    if (!ALLOWED_ROUTES.includes(to.name)) {
        if (orderStore.orders.length) {
            dialog.error({
                title: "Cambios sin guardar",
                content: "¿Salir de todos modos?",
                positiveText: "Sí",
                negativeText: "No",
                onPositiveClick: () => {
                    orderStore.clearNewOrders();
                    router.push(to);
                }
            });
            return false;
        }
    }
});

onBeforeRouteLeave((to) => {
    if (!ALLOWED_ROUTES.includes(to.name)) {
        if (orderStore.orders.length) {
            dialog.error({
                content: "¿Salir de todos modos?",
                positiveText: "Sí",
                title: "Cambios sin guardar",
                onPositiveClick: () => {
                    orderStore.clearNewOrders();
                    router.push(to);
                }
            });
            return false;
        }
    }
});

const performRetrieveTableOrder = () => {
    retrieveTableOrder(route.params.table).then((response) => {
        if (response.status === 200) {
            // Transformar order_details del backend al formato que espera el frontend
            const transformedOrders = response.data.order.order_details.map(detail => {
                if (detail.product_set) {
                    // Determinar si es MENU o COMBO
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
                            product_name: item.product_name,
                            phase_name: item.product_phase?.phase_name
                        })) || [],
                        customer: detail.customer || null
                    };
                } else if (detail.product) {
                    // Es un producto regular
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
                        product_igv: detail.product_igv,
                        customer: detail.customer || null
                    };
                }
                return null;
            }).filter(Boolean);

            orderStore.setSavedOrders(transformedOrders);
            orderStore.extractWaiterCustomers(transformedOrders);
            saleStore.order_initial = cloneDeep(orderStore.fullOrderList);
            orderStore.orderId = response.data.order.id;
        }
    }).catch((error) => {
        if (error.response && error.response.status === 423) {
            // Mesa bloqueada por otro usuario
            const lockData = error.response.data.lock_data || error.response.data;
            const lockedBy = lockData?.locked_by_username || 'otro usuario';
            const remainingMinutes = lockData?.remaining_minutes ||
                Math.ceil((lockData?.remaining_seconds || 0) / 60);

            message.error(
                `Mesa bloqueada por ${lockedBy}. Disponible en ${remainingMinutes} minutos.`,
                { duration: 5000 }
            );
            router.push({ name: 'WHome' });
        } else if (error.response && error.response.status === 404) {
            orderStore.setSavedOrders([]);
            orderStore.extractWaiterCustomers([]);
            saleStore.order_initial = [];
            orderStore.orderId = null;
        } else {
            console.error(error);
        }
    });
};

const printOrderPrebill = async () => {
    await retrieveTableOrder(route.params.table).then(async (response) => {
        if (response.status === 200) {
            const order = response.data.order;
            if (settingsStore.business_settings.printer.print_html) {
                previewData.value = order;
                showPreview.value = true;
                await nextTick();
                if (typeof previewDrawer.value?.generate === "function") {
                    await previewDrawer.value.generate();
                } else {
                    console.warn("previewDrawer no disponible o sin generate");
                    message.error("No se pudo generar la preboleta");
                }
            } else {
                VoucherPrint({
                    data: order,
                    businessStore,
                    prePayment: true,
                    auto: true,
                    show: false
                });
            }
        }
    }).catch((error) => {
        console.error(error);
    });
};

function setTabStyle() {
    let tab_nav = document.getElementsByClassName("n-tabs-nav");
    for (let i = 0; i < tab_nav.length; i++) {
        tab_nav[i].style.position = "absolute";
        tab_nav[i].style.zIndex = 1;
        tab_nav[i].style.backgroundColor = "White";
    }
}

onMounted(() => {
    orderStore.clearNewOrders(); // Limpiar carrito de la sesión anterior
    performRetrieveTableOrder();
    setTabStyle();

    // Lógica de bloqueo de mesa
    const tableId = typeof route.params.table === 'string' ? parseInt(route.params.table) : route.params.table;
    capturedTableId.value = tableId;

    const lockInfo = tableStore.lockedTables[capturedTableId.value];
    const isMyLock = lockInfo && lockInfo.user_id === userStore.user.id;

    if (!lockInfo || isMyLock) {
        console.log('[WaiterOrder] 🔒 Bloqueando mesa', capturedTableId.value);
        wsLockTable(capturedTableId.value, 15);
        shouldUnlock.value = true;
        window.addEventListener('beforeunload', handleBeforeUnload);
    }
});

onUnmounted(() => {
    console.log('[WaiterOrder] 🔴 Componente desmontado - Mesa:', capturedTableId.value);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    unlockCurrentTable();
});

onUpdated(() => {
    setTabStyle();
});

const previewDrawer = ref(null);

const showPreview = ref(false);

const previewData = ref(null);

const shouldUnlock = ref(false);
const capturedTableId = ref(null);

const unlockCurrentTable = () => {
    const idToUnlock = capturedTableId.value;
    console.log('[WaiterOrder] 🔍 unlockCurrentTable llamado - shouldUnlock:', shouldUnlock.value, 'capturedTableId:', capturedTableId.value);
    if (shouldUnlock.value && idToUnlock) {
        console.log('[WaiterOrder] 🔓 Desbloqueando mesa', idToUnlock);
        wsUnlockTable(idToUnlock);
        shouldUnlock.value = false;
    }
};

const handleBeforeUnload = () => {
    unlockCurrentTable();
};

</script>

<style lang="scss" scoped>
.n-tab-pane {
    position: relative;
    top: 42px;
}

.fs-7 {
    font-size: 0.85rem;
}
</style>
