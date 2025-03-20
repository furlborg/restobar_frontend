<template>
    <div id="CategoriesItems">
        <n-space class="mb-2" align="end" justify="space-between">
            <n-breadcrumb separator="⏵">
                <n-breadcrumb-item>
                    <router-link :to="{ name: 'ProductCategories' }">
                        <n-text class="fs-4">Categorías</n-text>
                    </router-link>
                </n-breadcrumb-item>
                <n-breadcrumb-item v-if="$route.params.category">
                    {{ productStore.getCategorieDescription($route.params.category) }}
                </n-breadcrumb-item>
            </n-breadcrumb>
            <n-input v-model:value="search" placeholder="Buscar..."/>
        </n-space>
        <n-scrollbar v-if="products.length > 0" style="max-height: 700px">
            <n-list>
                <n-list-item class="w-100 p-0" v-for="(product, index) in itemsList" :key="index" style="cursor: pointer"
                             @click="product.has_stock ? product?.['has_supplies'] ? orderStore.addOrder(product) : null : null">
                    <template #prefix>
                        <img src="@/assets/images/default-food-image.jpg" alt="" style="height: 70px; width: 70px"/>
                    </template>
                    <n-thing>
                        <n-space align="center">
                            <n-text :class="{ 'fs-4': genericsStore.device === 'desktop', 'fs-6': genericsStore.device === 'mobile' }"
                                    :delete="!product.has_stock || !product?.['has_supplies']"
                                    :type=" product.has_stock ? product?.['has_supplies'] ? 'default' : 'error' : 'error'">
                                {{ product.name }}
                            </n-text>
                            <n-tag type="primary" strong v-if="product.stock && product.control_stock"> Stock: {{ product.stock }}</n-tag>
                            <n-text type="success">S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text>
                        </n-space>
                        <n-text>{{ product?.description }}</n-text>
                    </n-thing>
                </n-list-item>
            </n-list>
        </n-scrollbar>
    </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { useOrderStoreMervinPuta } from "@/store/modules/storeOrderMervinPuta";
import { useGenericsStore } from "@/store/modules/generics";
import { getProductsByCategory } from "@/api/modules/products";
import { useProductStore } from "@/store/modules/product";

export default defineComponent({
    name: "CategoriesItems",
    setup() {
        const message = useMessage();
        const route = useRoute();
        const router = useRouter();
        const genericsStore = useGenericsStore();
        const orderStore = useOrderStoreMervinPuta();
        const productStore = useProductStore();
        const category = route.params.category;
        const listType = ref("list");
        const products = ref([]);
        const search = ref("");
        
        const itemsList = computed(() => {
            const list = products.value.filter((product) =>
                product.name.toLowerCase().includes(search.value.toLowerCase())
            );
            if(products.value.every((product) => !!product?.["order_index"])) {
                return list.sort((a, b) => {
                    if(a?.["order_index"] > b?.["order_index"]) {
                        return 1;
                    }
                    if(a?.["order_index"] < b?.["order_index"]) {
                        return -1;
                    }
                    return 0;
                });
            } else {
                return list;
            }
        });
        
        const loadProducts = async() => {
            await getProductsByCategory(route.params.category).then((response) => {
                if(response.status === 200) {
                    products.value = response.data;
                }
            }).catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
            });
        };
        
        onMounted(async() => {
            await loadProducts();
        });
        
        const handleBack = () => {
            router.push({ name: "ProductCategories" });
        };
        
        return {
            handleBack,
            listType,
            genericsStore,
            productStore,
            category,
            products,
            orderStore,
            search,
            itemsList
        };
    }
});
</script>
