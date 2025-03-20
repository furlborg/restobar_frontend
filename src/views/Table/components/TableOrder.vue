<template>
    <div id="TableOrder">
        <n-page-header class="mb-2" @back="handleBack">
            <template #title>
                <n-space justify="space-between">
                    <n-text class="fs-2">
                        {{ tableStore.getTableByID(table)?.description }}
                    </n-text>
                </n-space>
            </template>
        </n-page-header>
        <n-card content-style="padding: 10px">
            <n-grid responsive="screen" cols="1 s:1 m:5 l:5 xl:5 2xl:5" :x-gap="12">
                <n-gi :span="3">
                    <router-view/>
                </n-gi>
                <n-gi span="2">
                    <n-card class="h-100" title="Pedidos" :bordered="false" embedded content-style="padding:0">
                        <template #header-extra>
                            <div v-if="userStore.hasPermission('charge_order')">
                                <n-button v-if="!($route.name === 'TablePayment')" type="success" :disabled="!orderStore.orderId" text
                                          @click=" $router.push({ name: 'TablePayment', params: { table: $route.params.table } }) ">
                                    <v-icon class="me-1" name="fa-coins"/>
                                    <span class="fs-6">Cobrar</span>
                                </n-button>
                                <router-link v-else class="text-decoration-none"
                                             :to="{ name: 'ProductCategories', params: { table: $route.params.table } }">
                                    <n-button type="info" text>
                                        <v-icon class="me-1" name="md-add-round"/>
                                        <span class="fs-6">Añadir pedido</span>
                                    </n-button>
                                </router-link>
                            </div>
                        </template>
                        <n-form v-if="!($route.name === 'TablePayment')">
                            <n-grid cols="2" x-gap="12">
                                <n-form-item-gi v-if="settingsStore.businessSettings.order?.['order_customer_name'] " label="Cliente"
                                                :span=" !settingsStore.businessSettings.order?.['select_order_user'] ? 2 : 1">
                                    <n-input v-model:value="ask_for" placeholder="" :readonly="userStore.user.role === 'MOZO'"
                                             :disabled="userStore.user.role === 'MOZO'"/>
                                </n-form-item-gi>
                                <n-form-item-gi v-if="settingsStore.businessSettings.order?.['select_order_user']"
                                                :span="!settingsStore.businessSettings.order?.['order_customer_name'] ? 2 : 1" label="Mozo">
                                    <n-select :options="activeUsersStore.usersOptions" v-model:value="orderUser" placeholder="" filterable/>
                                </n-form-item-gi>
                            </n-grid>
                            <n-form-item label="Buscar producto">
                                <n-input-group>
                                    <n-auto-complete v-model:value="productSearch" :options="productOptions" :get-show="showOptions"
                                                     :loading="searching" placeholder="" clear-after-select :render-label="renderLabel"
                                                     @select="selectProduct"/>
                                </n-input-group>
                            </n-form-item>
                            <n-form-item label="mervin puto" :show-label="false">
                                <n-button @click="addNewOrder()">
                                    Agregar orden
                                </n-button>
                            </n-form-item>
                        </n-form>
                        <n-collapse accordion :default-expanded-names="expandedNames" @update:expanded-names="updateExpandedNames">
                            <n-collapse-item v-for="(dataOrders, index) in orderStore.orders" :key="index" :name="index">
                                <template #header>
                                    <div>
                                        Orden {{ index + 1 }} {{ dataOrders?.ordersData[0]?.product_name || "" }}
                                    </div>
                                </template>

                                <template #arrow>
                                    <v-icon name="hi-solid-arrow-sm-up" @click="toggleCollapse(index)"/>
                                </template>

                                <template #header-extra>
                                    <n-button @click="deleteOrder(index)" type="error">
                                        <template #icon>
                                            <v-icon name="md-deleteforever" scale="1.5"/>
                                        </template>
                                    </n-button>
                                </template>
                                <oscar-puta v-model:itemIndex="itemIndex" v-model:showModal="showModal"
                                            :info-table="{ ordersData: dataOrders.ordersData,
                                                           saleStore: saleStore,
                                                           deleteOrderDetail: deleteOrderDetail,
                                                           nullifyTableOrder: nullifyTableOrder }"/>
                            </n-collapse-item>
                        </n-collapse>

                        <div style="display: flex; justify-content: space-between; margin-top: 5px">
                            <div>
                                <n-button v-if="!($route.name === 'TablePayment')" :type="orderStore.orderId ? 'info' : 'primary'" text
                                          block :loading="loading" :disabled=" orderStore.orderList.length ? checkState || loading : true "
                                          @click="validateSend()">
                                    <v-icon class="me-2" name="md-notealt-twotone" scale="1.5"/>
                                    <span class="fs-4">{{ orderStore.orderId ? "Actualizar" : "Realizar" }} pedido</span>
                                </n-button>
                            </div>
                            <div class="fs-6 fw-bold">
                                S/. {{ orderStore.orderTotal.toFixed(2) }}
                            </div>
                        </div>
                    </n-card>
                </n-gi>
            </n-grid>
            <n-modal preset="card" v-model:show="showUserConfirm" title="Registrar pedido" :mask-closable="false" closable
                     :class="{ 'w-100': genericsStore.device === 'mobile', 'w-50': genericsStore.device === 'tablet', 'w-25': genericsStore.device === 'desktop' }">
                <n-form-item label="Ingrese código de usuario">
                    <n-input type="password" v-model:value="userConfirm" placeholder=""/>
                </n-form-item>
                <template #action>
                    <n-space justify="end">
                        <n-button type="success" :loading="loading" :disabled="!userConfirm || loading" secondary
                                  @click.prevent=" orderStore.orderId ? performUpdateTableOrder() : performCreateTableOrder() ">
                            Confirmar
                        </n-button>
                    </n-space>
                </template>
            </n-modal>
            <n-modal preset="card" v-model:show="showConfirm" title="Eliminando comanda" :mask-closable="false"
                     :class="{ 'w-100': genericsStore.device === 'mobile', 'w-50': genericsStore.device === 'tablet', 'w-25': genericsStore.device === 'desktop' }"
                     closable @close="()=> {dataAnulate = { username: '', pass: '' }}">
                <div v-if="!userStore.hasPermission('cancel_orderdetail')">
                    <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                        <n-form-item label="Cantidad">
                            <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" placeholder="" style="width: 100%"/>
                        </n-form-item>
                    </n-form>
                </div>
                <div v-else>
                    <div v-if="settingsStore.businessSettings.sale?.['require_user_pass_to_null']">
                        <n-form ref="formRef" :model="dataAnulate" :rules="rules">
                            <n-form-item label="Ingrese su usuario" path="username">
                                <n-input v-model:value="dataAnulate.username" placeholder=""/>
                            </n-form-item>
                            <n-form-item label="Ingrese su contraseña" path="pass">
                                <n-input type="password" v-model:value="dataAnulate.pass" placeholder=""/>
                            </n-form-item>
                            <n-form-item label="Cantidad">
                                <n-input-number v-model:value="deleteQuantity" :min="1" :max="maxQuantity" style="width: 100%"/>
                            </n-form-item>
                        </n-form>
                    </div>
                    <div v-else-if="settingsStore.businessSettings.sale?.['require_general_pass_to_null']">
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
                <div v-if="userStore.hasPermission('cancel_orderdetail') && !settingsStore.businessSettings.sale?.['require_user_pass_to_null'] && !settingsStore.business_settings.sale?.['require_general_pass_to_null']">
                    <span style="font-weight: 700; font-size: 16px">
                    Para poder anular un pedido, primero debe de activar la
                    configuración "Requerir clave de usuario para anular" en la sección de configuraciones.
                    </span>
                </div>
                <template #action>
                    <n-space justify="end">
                        <n-button type="success" secondary @click.prevent="performDeleteDetail"
                                  :disabled="userStore.hasPermission('cancel_orderdetail') && !settingsStore.businessSettings.sale?.['require_user_pass_to_null'] && !settingsStore.business_settings.sale?.['require_general_pass_to_null']">
                            Confirmar
                        </n-button>
                    </n-space>
                </template>
            </n-modal>
            <OrderIndications v-model:show="showModal" preset="card" title="Indicaciones" :order="orderStore.orderList[itemIndex]"
                              @success="showModal = false"/>
            <ticket-preview ref="ticketPreview" v-model:show="showPdf" :data="pdfData" :hidden="true" :isUpdate="!!orderStore.orderId"
                            @printed="() => $router.push({ name: 'TableHome' })" @canceled="() => $router.push({ name: 'TableHome' })"/>
        </n-card>
    </div>
</template>

<script>
import OrderIndications from "./OrderIndications";
import TicketPreview from "@/views/Order/components/TicketPreview";
import { defineComponent, ref, computed, onMounted, watchEffect, h } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { isAxiosError } from "axios";
import { NThing, NTag, NSpace, NText, useDialog, useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore, useActiveUsersStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { useProductStore } from "@/store/modules/product";
import { useTableStore } from "@/store/modules/table";
import { useOrderStoreMervinPuta } from "@/store/modules/storeOrderMervinPuta";
import { useSaleStore } from "@/store/modules/sale";
import { retrieveTableOrder, cancelTableOrder, performDeleteOrderDetail, createTableOrderPuta, updateTableOrderPuta } from "@/api/modules/tables";
import { searchProductByName } from "@/api/modules/products";
import { cloneDeep, lighten } from "@/utils";
import OscarPuta from "@/views/Table/components/oscarPuta.vue";

export default defineComponent({
    name: "TableOrder",
    components: {
        OscarPuta,
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
        const orderStore = useOrderStoreMervinPuta();
        const saleStore = useSaleStore();
        const listType = ref("grid");
        const showModal = ref(false);
        const defaultDataOrder = orderStore.orderList ? orderStore.orderList : { ordersData: [], idOrder: null, collapsed: false };
        const totalOrdersData = ref(defaultDataOrder);
        const itemIndex = ref(0);
        const checkState = ref(false);
        const loading = ref(false);
        const dateNow = ref(null);
        const ask_for = ref("");
        const mervinPuta = ref();
        const expandedNames = ref([0]);
        const orderUser = ref(undefined);
        
        orderStore.orders = [{ ordersData: [], idOrder: null, collapsed: false }];
        saleStore.order_initial = [];
        orderStore.orderId = null;
        
        watchEffect(() => {
            checkState.value =
                JSON.stringify(saleStore.order_initial) ===
                JSON.stringify(orderStore.orderList);
        });
        
        onBeforeRouteUpdate((to) => {
            if(to.name !== "ProductCategories" && to.name !== "CategoriesItems") {
                if(!checkState.value) {
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
            if(to.name !== "ProductCategories" && to.name !== "CategoriesItems") {
                if(!checkState.value) {
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

        const updateExpandedNames = (names) => {
            expandedNames.value = names.length ? [names[names.length - 1]] : []; // Solo deja expandido el último seleccionado
            
            // Actualizar collapsed en la store
            orderStore.orders.forEach((order, index) => {
                order.collapsed = !names.includes(index);
            });
        };
        
        const toggleCollapse = (index) => {
            if(expandedNames.value?.includes(index)) {
                expandedNames.value = []; // Cierra todo
            } else {
                expandedNames.value = [index]; // Expande solo el seleccionado
            }
            
            updateExpandedNames(expandedNames.value);
        };
        
        const addNewOrder = () => {
            orderStore.orders.push({ ordersData: [], idOrder: null, collapsed: true });
            expandedNames.value = [orderStore.orders.length - 1]; // Expande la nueva orden automáticamente
            message.success("Nueva orden agregada");
        };
        
        const deleteOrder = (index) => {
            orderStore.orders = orderStore.orders.filter((_, idx) => idx !== index);
            expandedNames.value = [orderStore.orders.length - 1]; // Mantiene expandida la última orden
            message.success("Orden eliminada", { type: "error" });
        };
        
        const performRetrieveTableOrder = async() => {
            await retrieveTableOrder(route.params.table).then((response) => {
                if(response.status === 200) {
                    ask_for.value = response.data.ask_for;
                    orderStore.orders = response.data.order_details
                        ? response.data.order_details : { ordersData: [], idOrder: null, collapsed: true };
                    saleStore.order_initial = cloneDeep(orderStore.orderList);
                    orderStore.orderId = response.data.id;
                    if(settingsStore.businessSettings.order?.["select_order_user"]) {
                        orderUser.value = response.data?.["user_id"];
                    }
                }
            }).catch((error) => {
                if(error.response.status === 404) {
                    orderStore.orders = [{ ordersData: [], idOrder: null, collapsed: false }];
                    saleStore.order_initial = [];
                    orderStore.orderId = null;
                } else {
                    console.error(error);
                    message.error("Algo salió mal...");
                }
            });
        };
        
        onMounted(async() => {
            await performRetrieveTableOrder();
            const fetch = new Date();
            const dd = fetch.getDate();
            const mm = fetch.getMonth();
            const yy = fetch.getFullYear();
            const hh = fetch.getHours();
            const minutes = fetch.getMinutes();
            
            dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${minutes}`;
        });
        
        const performCreateTableOrder = async() => {
            loading.value = true;
            await createTableOrderPuta(
                route.params.table,
                orderStore.orderList,
                !orderUser.value ? userConfirm.value : orderUser.value,
                ask_for.value
            ).then(async(response) => {
                if(response.status === 201) {
                    pdfData.value = response.data;
                    showPdf.value = true;
                    setTimeout(() => ticketPreview.value.generate(), 250);
                    checkState.value = true;
                }
            }).catch((error) => {
                if(isAxiosError(error)) {
                    if(error.response.status === 400) {
                        console.error(error);
                        for(const value in error.response.data) {
                            for(const ser in error.response.data[`${value}`]) {
                                if(
                                    Array.isArray(error.response.data[`${value}`][`${ser}`])
                                ) {
                                    error.response.data[`${value}`][`${ser}`].forEach((err) => {
                                        if(typeof err === "object") {
                                            for(const v in err) {
                                                message.error(`${err[`${v}`]} (${ser})`);
                                            }
                                        } else {
                                            message.error(`${err}`);
                                        }
                                    });
                                } else {
                                    message.error(error.response.data[`${value}`][`${ser}`]);
                                }
                            }
                        }
                    } else {
                        console.error(error);
                        message.error("Algo salió mal...");
                    }
                } else {
                    console.error(error);
                    message.error("Algo salió mal...");
                }
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
                if(!!item && order.quantity > item.quantity) {
                    let newOrder = cloneDeep(order);
                    newOrder.quantity = order.quantity - item.quantity;
                    newOrder.indication = newOrder.indication.slice(order.quantity - 1);
                    list.push(newOrder);
                } else if(
                    !!item &&
                    JSON.stringify(order.indication) !== JSON.stringify(item.indication)
                ) {
                    let newOrder = cloneDeep(order);
                    list.push(newOrder);
                } else if(typeof item === "undefined") {
                    list.push(order);
                }
            });
            return list;
        };
        
        const performUpdateTableOrder = async() => {
            loading.value = true;
            await updateTableOrderPuta(
                route.params.table,
                orderStore.orderId,
                orderStore.orderList,
                !orderUser.value ? userConfirm.value : orderUser.value,
                ask_for.value
            ).then(async(response) => {
                if(response.status === 202) {
                    response.data.order_details = evalOrderList(
                        response.data.order_details
                    );
                    pdfData.value = response.data;
                    showPdf.value = true;
                    setTimeout(() => ticketPreview.value.generate(), 250);
                    checkState.value = true;
                }
            }).catch((error) => {
                if(isAxiosError(error)) {
                    if(error.response.status === 400) {
                        console.error(error);
                        for(const value in error.response.data) {
                            for(const ser in error.response.data[`${value}`]) {
                                if(
                                    Array.isArray(error.response.data[`${value}`][`${ser}`])
                                ) {
                                    error.response.data[`${value}`][`${ser}`].forEach((err) => {
                                        if(typeof err === "object") {
                                            for(const v in err) {
                                                message.error(`${err[`${v}`]} (${ser})`);
                                            }
                                        } else {
                                            message.error(`${err}`);
                                        }
                                    });
                                } else {
                                    message.error(error.response.data[`${value}`][`${ser}`]);
                                }
                            }
                        }
                    } else {
                        console.error(error);
                        message.error("Algo salió mal...");
                    }
                } else {
                    console.error(error);
                    message.error("Algo salió mal...");
                }
            }).finally(() => {
                userConfirm.value = "";
                loadingConfirm.value = false;
                showUserConfirm.value = false;
                loading.value = false;
            });
        };
        
        const nullifyTableOrder = async() => {
            if(!orderStore.orderList.length && orderStore.orderId) {
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
        
        const performNullifyTableOrder = async() => {
            await cancelTableOrder(table, dataAnulate.value).then((response) => {
                if(response.status === 202) {
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
        
        const performDeleteDetail = async() => {
            await performDeleteOrderDetail(
                route.params.table,
                removingItem.value.id,
                dataAnulate.value,
                deleteQuantity.value
            ).then((response) => {
                if(response.status === 204) {
                    orderStore.orderList.splice(removingItem.value.ind, 1);
                    saleStore.order_initial.splice(removingItem.value.ind, 1);
                    nullifyTableOrder();
                    message.success("Comanda eliminada");
                    removingItem.value.ind = null;
                    removingItem.value.id = null;
                    passConfirm.value = "";
                    deleteQuantity.value = 1;
                    maxQuantity.value = 1;
                    showConfirm.value = false;
                    dataAnulate.value = { username: "", pass: "" };
                } else if(response.status === 202) {
                    orderStore.orderList[removingItem.value.ind].quantity -=
                        response.data.quantity;
                    saleStore.order_initial[removingItem.value.ind].quantity -=
                        response.data.quantity;
                    saleStore.order_initial[removingItem.value.ind].subTotal =
                        saleStore.order_initial[removingItem.value.ind].quantity *
                        saleStore.order_initial[removingItem.value.ind].price;
                    message.success("Comanda actualizada correctamente");
                    removingItem.value.ind = null;
                    removingItem.value.id = null;
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
                disabled: product?.is_disabled,
                category: productStore.getCategorieDescription(product?.category),
                stock: product?.stock
            }));
        });
        
        const showOptions = (value) => {
            if(value.length >= 3) {
                searching.value = true;
                searchProductByName(value).then((response) => {
                    if(response.status === 200) {
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
            if(item?.["has_supplies"]) {
                if(item?.has_stock) {
                    orderStore.addOrder(item);
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
            if(t.length > 1) {
                if(t[1].includes("LL")) {
                    color = "#926ED7";
                    text = "PARA LLEVAR";
                } else if(t[1].includes("D")) {
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
                                    !searchProductOption(option.value)?.["has_stock"] ||
                                    !searchProductOption(option.value)?.["has_supplies"],
                                type: searchProductOption(option.value)?.["has_supplies"]
                                    ? searchProductOption(option.value)?.["has_stock"]
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
            if(userStore.user.role === "MOZO") {
                showUserConfirm.value = true;
            } else {
                if(!orderStore.orderId) {
                    performCreateTableOrder();
                } else {
                    performUpdateTableOrder();
                }
            }
        };
        
        const ticketPreview = ref(null);
        
        const showPdf = ref(false);
        
        const pdfData = ref(null);
        
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
            totalOrdersData,
            addNewOrder,
            deleteOrder,
            toggleCollapse,
            updateExpandedNames,
            mervinPuta,
            expandedNames,
            pdfData
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
