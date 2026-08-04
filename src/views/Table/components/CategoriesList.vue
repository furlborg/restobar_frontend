<template>
    <div id="CategoriesList">
        <n-tabs type="line" animated>
            <n-tab-pane name="categorias" tab="Categorías">
                <n-card title="Categorías" :bordered="false" class="h-100" content-class="overflow-auto">
                    <n-scrollbar>
                        <div>
                            <n-list v-if="listType === 'list'" class="me-2">
                                <n-list-item v-for="(category, index) in productStore.categories" :key="index">
                                    <template #prefix>
                                        <img :src="getCategoryImage(category)" alt=""
                                            :width="category_settings.width_image_product"
                                            :height="category_settings.height_image_product" />
                                    </template>
                                    <n-thing>
                                        <n-space vertical>
                                            <n-space align="center">
                                                <router-link class="text-decoration-none" :to="{
                                                    name: $route.name.startsWith('W') ? 'WCategoriesItems' : 'CategoriesItems',
                                                    params: { category: category.id },
                                                }">
                                                    <n-text class="fs-4">{{ category.description }}</n-text>
                                                </router-link>
                                                <n-text class="fs-6" type="success">S/. 10.00</n-text>
                                            </n-space>
                                            <n-text depth="3">Explora los productos asociados a esta categoría.</n-text>
                                        </n-space>
                                    </n-thing>
                                    <template #suffix>
                                        <n-button type="info" text>
                                            <v-icon name="md-addbox-round" scale="2" />
                                        </n-button>
                                    </template>
                                </n-list-item>
                            </n-list>
                            <n-grid v-if="listType === 'grid'" responsive="screen"
                                cols="6 xs:6 s:12 m:12 l:16 xl:20 2xl:20" :x-gap="5" :y-gap="5">
                                <n-gi span="2 xs:2 s:3 m:3 l:4 xl:4 2xl:4" v-for="(category, index) in productStore.categories" :key="index">
                                    <div class="item-zoom">
                                        <router-link class="text-decoration-none"
                                            :to="{ name: $route.name.startsWith('W') ? 'WCategoriesItems' : 'CategoriesItems', params: { category: category.id } }">
                                            <div class="category-container">
                                                <img v-if="category_settings.use_image && categoryHasImage(category)"
                                                    :src="category.image || category.image_url" alt="" />
                                                <div v-else class="fallback-box"></div>
                                                <n-text class="category-text"
                                                    :style="{ fontSize: category_settings.area_text_size + 'px' }">
                                                    {{ category.description }}
                                                </n-text>
                                            </div>
                                        </router-link>
                                    </div>
                                </n-gi>
                            </n-grid>
                        </div>
                    </n-scrollbar>
                </n-card>
            </n-tab-pane>

            <n-tab-pane v-if="canUseMenus" name="menu" tab="Menú del Día">
                <n-card title="Menú Programado" :bordered="false" class="h-100" content-class="overflow-auto">
                    <n-list v-if="scheduledMenus.length">
                        <n-list-item v-for="menu in scheduledMenus" :key="menu.id" @click="handleOpenMenuModal(menu)"
                            style="cursor: pointer">
                            <n-thing>
                                <n-space vertical>
                                    <n-text class="fs-4">{{ menu.menu.name }}</n-text>
                                    <n-text class="fs-6" type="info">S/. {{ parseFloat(menu.menu.price).toFixed(2)
                                        }}</n-text>
                                </n-space>
                            </n-thing>
                        </n-list-item>
                    </n-list>
                    <n-empty v-else description="Aún no se programaron menús para hoy" />
                </n-card>
            </n-tab-pane>

            <n-tab-pane v-if="canUseCombos" name="combos" tab="Combos">
                <n-card title="Combos Disponibles" :bordered="false" class="h-100" content-class="overflow-auto">
                    <n-spin :show="loadingCombos">
                        <n-space vertical size="large">
                            <div v-for="category in comboCategories" :key="category.id">
                                <n-divider title-placement="left">
                                    <n-text class="fs-5 fw-bold">{{ category.description }}</n-text>
                                </n-divider>
                                <n-list>
                                    <n-list-item v-for="combo in getCombosForCategory(category.id)" :key="combo.id"
                                        @click="handleOpenComboModal(combo)" style="cursor: pointer">
                                        <template #prefix>
                                            <n-avatar v-if="combo.image" :src="combo.image" :size="60" />
                                            <n-avatar v-else :size="60" style="background-color: #18a058">
                                                <v-icon name="gi-hot-meal" scale="1.5" />
                                            </n-avatar>
                                        </template>
                                        <n-thing>
                                            <template #header>
                                                <n-text class="fs-4">{{ combo.name }}</n-text>
                                            </template>
                                            <template #description>
                                                <n-space vertical size="small">
                                                    <n-text type="success" class="fs-6">
                                                        S/. {{ parseFloat(combo.price ||
                                                            0).toFixed(2) }}
                                                    </n-text>
                                                    <n-text depth="3" style="font-size: 12px">
                                                        {{ combo.products ? combo.products.length : 0 }}
                                                        productos incluidos
                                                    </n-text>
                                                </n-space>
                                            </template>
                                        </n-thing>
                                        <template #suffix>
                                            <n-button type="primary" circle>
                                                <template #icon>
                                                    <v-icon name="md-add-round" />
                                                </template>
                                            </n-button>
                                        </template>
                                    </n-list-item>
                                </n-list>
                                <n-empty v-if="getCombosForCategory(category.id).length === 0"
                                    description="No hay combos disponibles en esta categoría" size="small" />
                            </div>
                        </n-space>
                        <n-empty v-if="comboCategories.length === 0 && !loadingCombos"
                            description="No hay categorías de combos disponibles" />
                    </n-spin>
                </n-card>
            </n-tab-pane>
        </n-tabs>

        <MenuProductModal v-if="showMenuModal" :menu="selectedMenu" @close="showMenuModal = false" />
        <ComboProductModal v-if="showComboModal" :combo="selectedCombo" @close="showComboModal = false" />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { getMenuToday, getComboCategories, getCombos } from "@/api/modules/products";
import { useUserStore } from "@/store/modules/user";
import MenuProductModal from "./MenuProductModal.vue";
import ComboProductModal from "./ComboProductModal.vue";
import categoryFallback from "@/assets/images/category-bg.jpg";

const productStore = useProductStore();
const settingsStore = useSettingsStore();
const listType = ref("grid");
const scheduledMenus = ref([]);
const showMenuModal = ref(false);
const selectedMenu = ref(null);

const comboCategories = ref([]);
const combos = ref([]);
const loadingCombos = ref(false);
const showComboModal = ref(false);
const selectedCombo = ref(null);

const category_settings = computed(() => ({
    use_image: false,
    area_text_size: 16,
    width_image_product: 35,
    height_image_product: 35,
    ...(settingsStore.business_settings?.category || {}),
}));

const userStore = useUserStore();

const canUseMenus = computed(() => {
    const showMenus = settingsStore.business_settings?.modules?.show_menus ?? true;
    return showMenus && userStore.hasPermission('use_combos_menus');
});

const canUseCombos = computed(() => {
    const showCombos = settingsStore.business_settings?.modules?.show_combos ?? true;
    return showCombos && userStore.hasPermission('use_combos_menus');
});

const getCategoryImage = (category) => {
    if (category_settings.value.use_image && categoryHasImage(category)) {
        return category.image || category.image_url;
    }
    return categoryFallback;
};

const categoryHasImage = (category) => {
    return Boolean(category && (category.image || category.image_url));
};

const handleOpenMenuModal = async (menu) => {
    const menuData = await getMenuToday(menu.id);
    if (menuData && menuData.data && menuData.data.length > 0) {
        selectedMenu.value = menuData.data[0];
        showMenuModal.value = true;
    }
};

const handleOpenComboModal = (combo) => {
    selectedCombo.value = combo;
    showComboModal.value = true;
};

const getCombosForCategory = (categoryId) => {
    return combos.value.filter((combo) => combo.category?.id === categoryId);
};

const loadCombos = async () => {
    loadingCombos.value = true;
    try {
        const categoriesResponse = await getComboCategories({
            is_disabled: false,
            only_with_combos: true,
        });
        comboCategories.value = categoriesResponse.data || [];

        const combosResponse = await getCombos({
            is_active: true,
            page: 1,
            page_size: 100,
        });
        combos.value = combosResponse.data || [];
    } catch (error) {
        console.error("Error loading combos", error);
        window.$message?.error("Error al cargar los combos");
    } finally {
        loadingCombos.value = false;
    }
};

onMounted(async () => {
    await productStore.refreshCategories();
    const menuData = await getMenuToday();
    scheduledMenus.value = menuData.data || [];
    await loadCombos();
});

</script>

<style lang="scss" scoped>
#CategoriesList {
    height: 100%;
}

.item-zoom {
    position: relative;
    border: 1px solid #333;
    overflow: hidden;
    box-sizing: border-box;
    cursor: pointer;
}

.item-zoom img {
    width: 100%;
    aspect-ratio: 1 / 1;
    height: auto;
    object-fit: cover;
    transition: all 0.3s ease;
    filter: grayscale(100%);
}

.item-zoom:hover img {
    transform: scale(1.1);
    filter: grayscale(0%);
}

.category-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    height: auto;
}

.fallback-box {
    width: 100%;
    height: 100%;
    background-color: #e0e0e0;
    transition: background-color 0.3s ease, transform 0.3s ease;
}

.item-zoom:hover .fallback-box {
    background-color: #9ae2b8;
    transform: scale(1.05);
}

.category-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
    font-weight: 900;
    color: #000;
    text-align: center;
    white-space: normal;
    word-break: break-word;
    line-height: 1.2;
    pointer-events: none;
}
</style>