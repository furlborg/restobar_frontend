<template>
    <n-drawer :show="show" @update:show="(v) => $emit('update:show', v)" placement="top" height="100%">
        <n-drawer-content title="Productos" footer-style="padding: 0; height: 50px" closable>
            <n-auto-complete v-model:value="productSearch" :options="productOptions" :get-show="showOptions" :loading="searchingProduct"
                             placeholder="Buscar..." clear-after-select :render-label="renderLabel" @select="selectProduct"/>
            <n-list>
                <n-list-item v-for="(orderItem, index) in waiterStore.preOrderList" :key="index">
                    <n-thing>
                        <template #header>
                            <n-text class="fs-5" type="info" text @click="orderItemIndex = index; showModal = true;">
                                {{ orderItem.product_name }}
                            </n-text>
                        </template>
                        <n-space align="center" justify="space-between">
                            <n-input-group>
                                <n-button type="warning" size="small" primary :disabled="orderItem.quantity <= 1"
                                          @click.stop="orderItem.quantity--">
                                    <v-icon name="md-remove-round"/>
                                </n-button>
                                <n-input-number v-model:value="orderItem.quantity" style="width: 50px" placeholder="" :min="1"
                                                :show-button="false" size="small" readonly @click.stop/>
                                <n-button type="warning" size="small" primary @click.stop="orderItem.quantity++">
                                    <v-icon name="md-add-round"/>
                                </n-button>
                            </n-input-group>
                            <n-tag>{{ `S/. ${ Number(orderItem.quantity) * parseFloat(orderItem.price).toFixed(2) }` }}</n-tag>
                        </n-space>
                    </n-thing>
                    <template #suffix>
                        <n-button type="error" text @click.stop="waiterStore.preOrderList.splice(index, 1)">
                            <v-icon name="md-disabledbydefault-round" scale="1.25"/>
                        </n-button>
                    </template>
                </n-list-item>
            </n-list>
            <n-modal preset="card" title="Nombre de Cliente" v-model:show="showAskFor" :segmented="{ content: 'hard' }">
                <n-input placeholder="" v-model:value="ask_for"/>
                <template #action>
                    <n-space justify="end">
                        <n-button type="info" :disabled="!showAskFor || loading" :loading="loading" secondary
                                  @click=" orderStore.orderId ? performUpdateTableOrder() : performCreateTableOrder() ">Guardar
                        </n-button>
                    </n-space>
                </template>
            </n-modal>
            <ProductIndications v-model:show="showModal" preset="card" title="Indicaciones"
                                :product="waiterStore.preOrderList[orderItemIndex]" @success="showModal = false"/>
            <template #footer>
                <n-button class="h-100 fs-4" type="info" secondary :disabled="!waiterStore.preOrderList.length || loading"
                          :loading="loading" block
                          @click=" orderStore.orderId ? performUpdateTableOrder() : settingsStore.business_settings.order?.['order_customer_name'] ? (showAskFor = true) : performCreateTableOrder()">
                    {{ orderStore.orderId ? "Añadir" : "Realizar" }} pedido
                </n-button>
            </template>
            <ticket-preview ref="ticketPreview" v-model:show="showPdf" :data="pdfData" :hidden="true" :isUpdate="!!orderStore.orderId"
                            @printed="() => $router.push({ name: 'WHome' })" @canceled="() => $router.push({ name: 'WHome' })"/>
        </n-drawer-content>
    </n-drawer>
</template>

<script>
import ProductIndications from "../views/ProductIndications";
import TicketPreview from "@/views/Order/components/TicketPreview.vue";
import { h, defineComponent, ref, computed } from "vue";
import { NThing, NTag, NSpace, NText, useMessage, useDialog } from "naive-ui";
import { createTableOrder, updateTableOrder } from "@/api/modules/tables";
import { searchProductByName, searchProductPrice } from "@/api/modules/products";
import { useDebounce } from "@/composables/useDebounce";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { useWaiterStore } from "@/store/modules/waiter";
import { useOrderStore } from "@/store/modules/order";
import { useTableStore } from "@/store/modules/table";
import { useSaleStore } from "@/store/modules/sale";
import { useUserStore } from "@/store/modules/user";
import { useRoute, useRouter } from "vue-router";
import { cloneDeep, lighten } from "@/utils";

export default defineComponent({
    name: "ProductsDrawer",
    components: {
        ProductIndications,
        TicketPreview
    },
    props: {
        show: {
            type: Boolean
        }
    },
    emits: [ "update:show" ],
    // eslint-disable-next-line vue/no-setup-props-destructure
    setup(props, { emit }) {
        const settingsStore = useSettingsStore();
        const productStore = useProductStore();
        const waiterStore = useWaiterStore();
        const orderStore = useOrderStore();
        const tableStore = useTableStore();
        const saleStore = useSaleStore();
        const userStore = useUserStore();
        const route = useRoute();
        const router = useRouter();

        const loading = ref(false);
        const orderItemIndex = ref(null);
        const showModal = ref(false);

        const message = useMessage();
        const dialog = useDialog();

        const searchingProduct = ref(false);

        const productSearch = ref("");

        const products = ref([]);

        const productOptions = computed(() => {
            return products.value.map((product) => ({
                value: product.id,
                label: product.name,
                disabled: product?.is_disabled,
                category: productStore.getCategorieDescription(product?.category)
            }));
        });

        const priceRegex = /^\d+(\.\d{0,2})?$/;

        const { debounced: fetchProducts, cancel: cancelFetchProducts } = useDebounce((value) => {
            searchingProduct.value = true;
            const request = priceRegex.test(value)
                ? searchProductPrice(value)
                : searchProductByName(value);

            request.then((response) => {
                if (response.status === 200) {
                    products.value = response.data;
                }
            }).catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
            }).finally(() => {
                searchingProduct.value = false;
            });
        }, 300);

        const showOptions = (value) => {
            if (priceRegex.test(value) || value.length >= 3) {
                fetchProducts(value);
                return true;
            }
            cancelFetchProducts();
            products.value = [];
            searchingProduct.value = false;
            return false;
        };

        const selectProduct = (v) => {
            const item = products.value.find((product) => product.id === v);
            if (item?.["has_supplies"]) {
                if (item?.has_stock) {
                    addToPreList(item);
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
                                delete: !searchProductOption(option.value)?.has_stock || !searchProductOption(option.value)?.["has_supplies"],
                                type: searchProductOption(option.value)?.["has_supplies"] ? searchProductOption(option.value)?.has_stock ? "default" : "error" : "error"
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
                                        NTag, { size: "small", type: "info" },
                                        {
                                            default: () => option.category.toLowerCase().includes("menu") ? "MENU" : option.category.toLowerCase().includes("comb") ? "COMBO" : "CARTA"
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
                                        }, {
                                            default: () => text
                                        }
                                    ),
                                    h(
                                        NTag, { size: "small", type: "info" },
                                        {
                                            default: () => option.category
                                        }
                                    )
                                ]
                            }
                        )
                }
            );
        };

        const addToPreList = (product) => {
            const existence = waiterStore.preOrderList.find((order) => order.id === product.id);
            if (typeof existence !== "undefined") {
                existence.quantity += 1;
            } else {
                console.log(product);
                let order = {
                    id: product.id,
                    product_name: product.name,
                    product_category: product.category,
                    product_description: product.description,
                    quick_indications: product.quick_indications,
                    price: product.prices,
                    quantity: 1,
                    indication: []
                };
                waiterStore.preOrderList.push(order);
                console.log(waiterStore.preOrderList);
            }
            product.indications = [];
        };

        const transformOrderDetails = (orderDetails = []) => {
            return orderDetails.map((detail) => {
                if (detail.product_set) {
                    const isCombo = detail.product_set.set_type === "COMBO";
                    return {
                        id: detail.id,
                        from_menu: detail.product_set.set_type === "MENU",
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
                        items: detail.product_set.items?.map((item) => ({
                            quantity: item.quantity,
                            product_name: item.product_name,
                            phase_name: item.product_phase?.phase_name
                        })) || []
                    };
                }
                if (detail.product) {
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
                    };
                }
                return null;
            }).filter(Boolean);
        };

        const syncOrderFromResponse = (data) => {
            const orderData = data?.order ?? data;
            if (!orderData?.order_details) return;
            const transformed = transformOrderDetails(orderData.order_details);
            orderStore.setSavedOrders(transformed);
            orderStore.orderId = orderData.id ?? orderStore.orderId;
            saleStore.order_initial = cloneDeep(orderStore.fullOrderList);
        };

        const performCreateTableOrder = () => {
            dialog.info({
                title: "¿Realizar pedido?",
                loading: loading.value,
                positiveText: "Si",
                negativeText: "No",
                onPositiveClick: async() => {
                    addToList();
                    loading.value = true;
                    console.log(orderStore.orderList);
                    const response = await createTableOrder(route.params.table, orderStore.orderList, userStore.user?.id ?? null, !ask_for.value ? undefined : ask_for.value);
                    if (response.status === 201) {
                        message.success("Orden creada correctamente");
                        syncOrderFromResponse(response.data);
                        waiterStore.preOrderList = [];
                        emit("update:show", false);
                        await tableStore.refreshData();
                        router.push({ name: "WHome" });
                        // router.push({ name: "WHome" });
                    }
                },
                onNegativeClick: () => {
                }
            });
        };

        const performUpdateTableOrder = async() => {
            dialog.info({
                title: "¿Actualizar pedido?",
                positiveText: "Si",
                negativeText: "No",
                loading: loading.value,
                onPositiveClick: async() => {
                    addToList();
                    loading.value = true;
                    const response = await updateTableOrder(
                        route.params.table,
                        orderStore.orderId,
                        orderStore.fullOrderList,
                        userStore.user?.id ?? null,
                        !ask_for.value ? undefined : ask_for.value
                    );
                    if (response.status === 202) {
                        message.success("Orden actualizada correctamente");
                        waiterStore.preOrderList = [];
                        emit("update:show", false);
                        await tableStore.refreshData();
                        router.push({ name: "WHome" });
                        // router.push({ name: "WHome" });
                    }
                },
                onNegativeClick: () => {
                }
            });
        };

        const addToList = () => {
            waiterStore.preOrderList.forEach((product) => {
                const indications = Array.isArray(product.indication) ? product.indication : [];
                const quicks = Array.isArray(product.quick_indications)
                    ? product.quick_indications
                    : typeof product.quick_indications === "string"
                    ? product.quick_indications.split(",").map((item) => item.trim()).filter(Boolean)
                    : [];

                if (indications.length === 0) {
                    const safeItem = {
                        ...product,
                        product: product.id,
                        id: null,
                        fromBackend: false,
                        indication: [],
                        quick_indications: [...quicks],
                        quantity: product.quantity
                    };
                    orderStore.addOrderItem(safeItem);
                } else {
                    indications.forEach((ind) => {
                        const indQuicks = Array.isArray(ind.quick_indications) ? [...ind.quick_indications] : [];
                        const safeItem = {
                            ...product,
                            product: product.id,
                            id: null,
                            fromBackend: false,
                            indication: [{
                                ...ind,
                                quick_indications: indQuicks
                            }],
                            quick_indications: [...quicks],
                            quantity: 1
                        };
                        orderStore.addOrderItem(safeItem);
                    });
                }
            });
        };

        const showAskFor = ref(false);

        const ask_for = ref("");

        const ticketPreview = ref(null);

        const showPdf = ref(false);

        const pdfData = ref(null);

        return {
            performCreateTableOrder,
            performUpdateTableOrder,
            waiterStore,
            orderStore,
            loading,
            searchingProduct,
            productSearch,
            productOptions,
            showOptions,
            selectProduct,
            renderLabel,
            orderItemIndex,
            showModal,
            settingsStore,
            showAskFor,
            ask_for,
            ticketPreview,
            showPdf,
            pdfData
        };
    }
});
</script>

<style></style>
