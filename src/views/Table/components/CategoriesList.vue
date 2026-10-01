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
                <n-card title="Menú Programado" :bordered="false" class="h-100 flizzy-menu-card" content-class="flizzy-menu-content">
                    <div v-if="scheduledMenus.length" class="flizzy-menus-grid">
                        <div 
                            v-for="menu in scheduledMenus" 
                            :key="menu.id" 
                            class="flizzy-menu-item"
                            @click="handleOpenMenuModal(menu)"
                        >
                            <div class="menu-item-media">
                                <div class="menu-item-icon-box">
                                    <v-icon name="gi-hot-meal" scale="1.3" />
                                </div>
                            </div>
                            <div class="menu-item-body">
                                <div class="menu-item-header">
                                    <span class="menu-item-name" :title="menu.menu.name">{{ menu.menu.name }}</span>
                                    <span class="menu-item-tagline">Toca para configurar</span>
                                </div>
                                <div class="menu-item-footer">
                                    <span class="menu-price-pill">S/. {{ parseFloat(menu.menu.price).toFixed(2) }}</span>
                                    <div class="menu-plus-btn">
                                        <v-icon name="md-add-round" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <n-empty v-else description="Aún no se programaron menús para hoy" class="my-5" />
                </n-card>
            </n-tab-pane>

            <n-tab-pane v-if="canUseCombos" name="combos" tab="Combos">
                <n-card title="Combos Disponibles" :bordered="false" class="h-100 combos-card" content-class="combos-card-content">
                    <n-spin :show="loadingCombos">
                        <div class="combos-wrapper">
                            <div v-for="category in comboCategories" :key="category.id" class="combo-category-group">
                                <div class="combo-category-header">
                                    <span class="category-name">{{ category.description }}</span>
                                    <span class="category-count">{{ getCombosForCategory(category.id).length }} combos</span>
                                </div>
                                <div class="combos-grid">
                                    <div 
                                        v-for="combo in getCombosForCategory(category.id)" 
                                        :key="combo.id"
                                        @click="handleOpenComboModal(combo)" 
                                        class="combo-card-item"
                                    >
                                        <div class="combo-card-prefix">
                                            <img v-if="combo.image" :src="combo.image" class="combo-img" alt="" @error="combo.image = null" />
                                            <div v-else class="combo-avatar-fallback">
                                                <v-icon name="gi-hot-meal" scale="1.3" />
                                            </div>
                                        </div>
                                        <div class="combo-card-body">
                                            <div class="combo-card-header">
                                                <span class="combo-title">{{ combo.name }}</span>
                                                <div class="combo-meta">
                                                    <span class="combo-badge-included">
                                                        {{ combo.products ? combo.products.length : 0 }} productos incluidos
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="combo-card-footer">
                                                <span class="combo-price">S/. {{ parseFloat(combo.price || 0).toFixed(2) }}</span>
                                                <div class="combo-add-btn">
                                                    <v-icon name="md-add-round" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <n-empty v-if="getCombosForCategory(category.id).length === 0"
                                    description="No hay combos disponibles en esta categoría" size="small" class="my-3" />
                            </div>
                            <n-empty v-if="comboCategories.length === 0 && !loadingCombos"
                                description="No hay categorías de combos disponibles" class="my-5" />
                        </div>
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
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
}

@media (max-width: 768px) {
    #CategoriesList {
        flex: 1 1 0px;
        overflow: hidden;
    }

    .categories-card-content,
    .combos-card-content,
    .flizzy-menu-content {
        padding: 4px 6px !important;
    }

    :deep(.n-tabs) {
        flex: 1 1 0px !important;
        height: 100% !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
    }

    :deep(.n-tabs-pane-wrapper) {
        flex: 1 1 0px !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
    }

    :deep(.n-tab-pane) {
        height: auto !important;
        min-height: 100% !important;
    }
}

.categories-card,
.combos-card {
    background-color: #ffffff !important;
}

.categories-card-content,
.combos-card-content,
.flizzy-menu-content {
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

/* ==================================================== */
/* ESTILOS FLIZZY PARA MENÚ DEL DÍA                     */
/* ==================================================== */
.flizzy-menu-card {
    background: #ffffff;
}

.flizzy-menus-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    padding: 6px 2px;
}

.flizzy-menu-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.flizzy-menu-item:hover {
    border-color: #ff6b00;
    box-shadow: 0 6px 16px rgba(255, 107, 0, 0.12);
    transform: translateY(-2px);
    background: #fffaf5;
}

.menu-item-media {
    flex-shrink: 0;
}

.menu-item-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #d97706;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(217, 119, 6, 0.15);
}

.menu-item-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    min-width: 0;
    gap: 10px;
}

.menu-item-header {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.menu-item-name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
    letter-spacing: -0.01em;
}

.menu-item-tagline {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 2px;
}

.menu-price-pill {
    display: inline-flex;
    align-items: center;
    white-space: nowrap !important;
    padding: 3px 10px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    color: #15803d;
    font-weight: 800;
    font-size: 13.5px;
    font-variant-numeric: tabular-nums;
}

.menu-plus-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #ea580c;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
    flex-shrink: 0;
}

.flizzy-menu-item:hover .menu-plus-btn {
    background: #ff6b00;
    color: #ffffff;
    border-color: #ff6b00;
    transform: scale(1.08);
}

/* ==================================================== */
/* ESTILOS FLIZZY PARA COMBOS                           */
/* ==================================================== */
.combo-category-group {
    margin-bottom: 16px;
}

.combo-category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 4px 6px;
    border-bottom: 1.5px solid #f1f5f9;
    margin-bottom: 8px;
}

.combo-category-header .category-name {
    font-size: 13.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #334155;
}

.combo-category-header .category-count {
    font-size: 10.5px;
    font-weight: 600;
    color: #94a3b8;
    background: #f8fafc;
    padding: 2px 7px;
    border-radius: 6px;
}

.combos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
}

.combo-card-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.combo-card-item:hover {
    border-color: #ff6b00;
    box-shadow: 0 6px 16px rgba(255, 107, 0, 0.12);
    transform: translateY(-2px);
    background: #fffaf5;
}

.combo-card-prefix {
    flex-shrink: 0;
}

.combo-avatar-fallback {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    color: #15803d;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(21, 128, 61, 0.12);
}

.combo-img {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
}

.combo-card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    min-width: 0;
    gap: 10px;
}

.combo-card-header {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.combo-title {
    display: block;
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
    letter-spacing: -0.01em;
}

.combo-meta {
    margin-top: 2px;
}

.combo-badge-included {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 600;
    color: #15803d;
    background: #f0fdf4;
    padding: 1px 7px;
    border-radius: 6px;
    border: 1px solid #dcfce7;
    white-space: nowrap !important;
}

.combo-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 2px;
}

.combo-price {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
    white-space: nowrap !important;
}

.combo-add-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #ea580c;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
    flex-shrink: 0;
}

.combo-card-item:hover .combo-add-btn {
    background: #ff6b00;
    color: #ffffff;
    border-color: #ff6b00;
    transform: scale(1.08);
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