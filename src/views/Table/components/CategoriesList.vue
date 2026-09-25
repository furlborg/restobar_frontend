<template>
    <div id="CategoriesList">
        <n-tabs type="line" animated>
            <n-tab-pane name="categorias" tab="Categorías">
                <n-card title="Categorías" :bordered="false" class="h-100 categories-card" content-class="categories-card-content">
                    <n-scrollbar style="max-height: calc(100vh - 220px)">
                        <div class="categories-scroll-wrapper">
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
                                :cols="gridCols" :x-gap="8" :y-gap="8">
                                <n-gi :span="gridSpan" v-for="(category, index) in productStore.categories" :key="index">
                                    <div class="item-zoom">
                                        <router-link class="text-decoration-none"
                                            :to="{ name: $route.name.startsWith('W') ? 'WCategoriesItems' : 'CategoriesItems', params: { category: category.id } }">
                                            <div class="category-container" :style="{ height: category_settings.card_height + 'px' }">
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
                <n-card title="Combos Disponibles" :bordered="false" class="h-100 combos-card" content-class="combos-card-content">
                    <n-scrollbar style="max-height: calc(100vh - 220px)">
                        <n-spin :show="loadingCombos">
                            <div class="combos-wrapper">
                                <n-space vertical size="large">
                                    <div v-for="category in comboCategories" :key="category.id">
                                        <n-divider title-placement="left">
                                            <n-text class="fs-5 fw-bold">{{ category.description }}</n-text>
                                        </n-divider>
                                        <n-list>
                                            <n-list-item v-for="combo in getCombosForCategory(category.id)" :key="combo.id"
                                                @click="handleOpenComboModal(combo)" style="cursor: pointer" class="combo-item">
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
                            </div>
                        </n-spin>
                    </n-scrollbar>
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

const category_settings = computed(() => {
    const raw = settingsStore.business_settings?.category || {};
    let cardHeight = 120;
    if (raw.category_card_size === 'small') cardHeight = 85;
    else if (raw.category_card_size === 'large') cardHeight = 155;
    else if (raw.category_card_height) cardHeight = raw.category_card_height;

    return {
        use_image: false,
        area_text_size: 15,
        width_image_product: 35,
        height_image_product: 35,
        card_height: cardHeight,
        category_card_size: raw.category_card_size || 'medium',
        ...raw,
    };
});

const gridCols = computed(() => {
    if (category_settings.value.category_card_size === 'small') {
        return "6 xs:6 s:12 m:15 l:18 xl:24 2xl:24";
    }
    if (category_settings.value.category_card_size === 'large') {
        return "6 xs:6 s:12 m:12 l:16 xl:16 2xl:16";
    }
    return "6 xs:6 s:12 m:12 l:16 xl:20 2xl:20";
});

const gridSpan = computed(() => {
    if (category_settings.value.category_card_size === 'small') {
        return "3 xs:3 s:3 m:3 l:3 xl:3 2xl:3";
    }
    return "2 xs:2 s:3 m:3 l:4 xl:4 2xl:4";
});

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
    background-color: #ffffff;
}

.categories-card,
.combos-card {
    background-color: #ffffff !important;
}

.categories-card-content,
.combos-card-content {
    background-color: #ffffff !important;
    padding: 12px 16px !important;
}

.combos-wrapper,
.categories-scroll-wrapper {
    background-color: #ffffff;
    min-height: 100%;
    padding: 6px 4px;
    box-sizing: border-box;
}

.combo-item {
    border-radius: 8px;
    transition: background-color 0.2s ease;
    &:hover {
        background-color: #f7faf8;
    }
}

.item-zoom {
    position: relative;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-sizing: border-box;
    cursor: pointer;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-zoom:hover {
    border-color: #18a058;
    box-shadow: 0 4px 12px rgba(24, 160, 88, 0.15);
    transform: translateY(-2px);
    z-index: 2;
}

.item-zoom img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.3s ease;
    filter: grayscale(100%);
}

.item-zoom:hover img {
    transform: scale(1.05);
    filter: grayscale(0%);
}

.category-container {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fallback-box {
    width: 100%;
    height: 100%;
    background: #f7f9f8;
    transition: background-color 0.25s ease;
}

.item-zoom:hover .fallback-box {
    background-color: #e8f7f0;
}

.category-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
    font-weight: 700;
    color: #2b2b2b;
    text-align: center;
    white-space: normal;
    word-break: break-word;
    line-height: 1.25;
    pointer-events: none;
    letter-spacing: 0.2px;
}
</style>