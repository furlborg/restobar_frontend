<template>
    <div>

        <n-space class="mb-2">
            <n-breadcrumb separator="⏵">
                <n-breadcrumb-item>
                    <router-link
                        :to="{ name: 'CategoriesOrder', query: { delivery: route.query.delivery || 'false' } }">
                        <n-text class="fs-4">Categorías</n-text>
                    </router-link>
                </n-breadcrumb-item>
                <n-breadcrumb-item v-if="selectedCategory">
                    {{ productStore.getCategorieDescription(selectedCategory.id) }}
                </n-breadcrumb-item>
            </n-breadcrumb>
        </n-space>

        <n-space justify="space-between" align="center" class="w-100">
            <n-text class="fs-4">{{ selectedCategoryTitle }}</n-text>
            <n-button v-if="selectedCategory" size="small" secondary type="primary" @click="clearSelectedCategory">
                Limpiar selección
            </n-button>
        </n-space>

        <n-input v-model:value="search" placeholder="Buscar producto" clearable class="mb-3">
            <template #prefix>
                <v-icon name="md-search-round" />
            </template>
        </n-input>

        <n-spin :show="isLoading">
            <n-list v-if="itemsList.length" class="product-list">
                <n-list-item v-for="product in itemsList" :key="product.id" class="product-list-item"
                    :class="{ 'product-disabled': !product.has_stock || !product.has_supplies }"
                    @click="handleSelectProduct(product)">
                    <template #prefix>
                        <n-avatar round :size="category_settings.width_image_product"
                            :style="{ minWidth: category_settings.width_image_product + 'px' }"
                            :src="product.image || product.image_url">
                            <v-icon name="gi-hot-meal" />
                        </n-avatar>
                    </template>
                    <n-thing>
                        <template #header>
                            <n-text class="fw-bold">{{ product.name }}</n-text>
                        </template>
                        <template #description>
                            <n-space align="center" size="small">
                                <n-text type="success">S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text>
                                <n-tag v-if="product.control_stock" type="primary" size="small" round>
                                    Stock: {{ formatStock(product.stock) }}
                                </n-tag>
                                <n-tag v-if="!product.has_stock" type="error" size="small" round>Sin stock</n-tag>
                                <n-tag v-else-if="!product.has_supplies" type="warning" size="small" round>Sin
                                    insumos</n-tag>
                            </n-space>
                        </template>
                    </n-thing>
                    <template #suffix>
                        <n-button circle type="primary" :disabled="!product.has_stock || !product.has_supplies">
                            <template #icon>
                                <v-icon name="md-add-round" />
                            </template>
                        </n-button>
                    </template>
                </n-list-item>
            </n-list>
            <n-empty v-else description="No se encontraron productos para esta categoría" />
        </n-spin>
    </div>
</template>

<script setup>
import { getCategoryById, getProductsByCategory } from '@/api/modules/products';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMessage } from "naive-ui";
import { useSettingsStore } from '@/store/modules/settings';
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";

const message = useMessage();
const route = useRoute();
const settingsStore = useSettingsStore();
const productStore = useProductStore();
const orderStore = useOrderStore();

const selectedCategory = ref(null);
const search = ref("");
const isLoading = ref(false);
const products = ref([]);


// Datos computados
const category_settings = computed(() => ({
    use_image: false,
    area_text_size: 16,
    width_image_product: 75,
    height_image_product: 75,
    ...(settingsStore.business_settings?.category || {}),
}));

const selectedCategoryTitle = computed(() => {
    return selectedCategory.value
        ? `Productos de ${selectedCategory.value.description}`
        : "Productos";
});

const itemsList = computed(() => {
    const list = products.value.filter((product) => {
        const searchTerm = search.value.toLowerCase();
        const productName = product.name.toLowerCase();
        const productPrice = parseFloat(product.prices).toFixed(2);
        return productName.includes(searchTerm) || productPrice.includes(searchTerm);
    });

    if (products.value.every((product) => !!product.order_index)) {
        return list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
    return list;
});

// Métodos
const clearSelectedCategory = () => {
    products.value = [];
    search.value = "";
    loadProducts(selectedCategory.value.id)
};

const formatStock = (stock) => Number(stock ?? 0);

const loadProducts = async (category_id) => {
    search.value = "";
    isLoading.value = true;

    try {
        const response = await getProductsByCategory(category_id);
        if (response.status === 200) {
            products.value = response.data;
        }
    } catch (error) {
        console.error(error);
        message.error("No se pudieron cargar los productos de la categoría");
    } finally {
        isLoading.value = false;
    }
}

const handleSelectProduct = (product) => {
    if (!product.has_stock || !product.has_supplies) return;
    orderStore.addOrder(product);
    message.success(`${product.name} agregado`);
};

onMounted(async () => {
    getCategoryById(route.params.category_id).then(category => {
        console.info(category.data)
        selectedCategory.value = category.data;

        loadProducts(route.params.category_id)
    });


});
</script>
