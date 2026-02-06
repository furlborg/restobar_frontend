<template>
    <div id="CategoriesList">
        <n-tabs type="line" animated>
            <n-tab-pane name="categorias" tab="Categorias">
                <n-space vertical size="large">
                    <n-card
                        :bordered="false"
                        title="Categorias disponibles"
                        content-class="category-card overflow-auto"
                    >
                        <n-spin :show="!productStore.categories.length && isLoadingCategories">
                            <n-empty
                                v-if="!productStore.categories.length && !isLoadingCategories"
                                description="No se encontraron categorias activas"
                            />
                            <n-grid
                                v-else
                                responsive="screen"
                                cols="8 xs:8 s:12 m:12 l:16 xl:20 2xl:20"
                                :x-gap="8"
                                :y-gap="8"
                            >
                                <n-gi :span="4" v-for="category in productStore.categories" :key="category.id">
                                    <div
                                        class="item-zoom"
                                        role="button"
                                        tabindex="0"
                                        @click="goToCategory(category)"
                                        @keyup.enter="goToCategory(category)"
                                    >
                                        <div class="category-container">
                                            <img
                                                v-if="category_settings.use_image && (category.image || category.image_url)"
                                                :src="category.image || category.image_url"
                                                alt="Imagen de categoria"
                                            />
                                            <div v-else class="fallback-box"></div>
                                            <n-text class="category-text" :style="{ fontSize: category_settings.area_text_size + 'px' }">
                                                {{ category.description }}
                                            </n-text>
                                        </div>
                                    </div>
                                </n-gi>
                            </n-grid>
                        </n-spin>
                    </n-card>
                </n-space>
            </n-tab-pane>

            <n-tab-pane v-if="canUsePrograms" name="menu" tab="Menú">
                <n-card title="Menú Programado" :bordered="false" class="h-100" content-class="overflow-auto">
                    <n-list v-if="scheduledMenus.length">
                        <n-list-item
                            v-for="menu in scheduledMenus"
                            :key="menu.id"
                            @click="handleOpenMenuModal(menu)"
                            style="cursor: pointer"
                        >
                            <n-thing>
                                <n-space vertical>
                                    <n-text class="fs-4">{{ menu.menu.name }}</n-text>
                                    <n-text class="fs-6" type="info">S/. {{ parseFloat(menu.menu.price).toFixed(2) }}</n-text>
                                </n-space>
                            </n-thing>
                        </n-list-item>
                    </n-list>
                    <n-empty v-else description="Aún no se programaron menús para hoy" />
                </n-card>
            </n-tab-pane>

            <n-tab-pane v-if="canUsePrograms" name="combos" tab="Combos">
                <n-card title="Combos Disponibles" :bordered="false" class="h-100" content-class="overflow-auto">
                    <n-spin :show="loadingCombos">
                        <n-space vertical size="large">
                            <div v-for="category in comboCategories" :key="category.id">
                                <n-divider title-placement="left">
                                    <n-text class="fs-5 fw-bold">{{ category.description }}</n-text>
                                </n-divider>
                                <n-list>
                                    <n-list-item
                                        v-for="combo in getCombosForCategory(category.id)"
                                        :key="combo.id"
                                        @click="handleOpenComboModal(combo)"
                                        style="cursor: pointer"
                                    >
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
                                                        S/. {{ parseFloat(combo.computed_price || combo.fixed_price || 0).toFixed(2) }}
                                                    </n-text>
                                                    <n-text depth="3" style="font-size: 12px">
                                                        {{ combo.combo_products ? combo.combo_products.length : 0 }} productos incluidos
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
                                <n-empty
                                    v-if="getCombosForCategory(category.id).length === 0"
                                    description="No hay combos disponibles en esta categoría"
                                    size="small"
                                />
                            </div>
                        </n-space>
                        <n-empty
                            v-if="comboCategories.length === 0 && !loadingCombos"
                            description="No hay categorías de combos disponibles"
                        />
                    </n-spin>
                </n-card>
            </n-tab-pane>
        </n-tabs>

        <MenuProductModal v-if="showMenuModal" :menu="selectedMenu" @close="showMenuModal = false" />
        <ComboProductModal v-if="showComboModal" :combo="selectedCombo" @close="showComboModal = false" />
    </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { getMenuToday, getComboCategories, getCombos } from "@/api/modules/products";
import MenuProductModal from "./MenuProductModal.vue";
import ComboProductModal from "./ComboProductModal.vue";

export default defineComponent({
    name: "CategoriesList",
    components: {
        MenuProductModal,
        ComboProductModal,
    },
    setup() {
        const productStore = useProductStore();
        const settingsStore = useSettingsStore();
        const router = useRouter();
        const scheduledMenus = ref([]);
        const showMenuModal = ref(false);
        const selectedMenu = ref(null);

        const comboCategories = ref([]);
        const combos = ref([]);
        const loadingCombos = ref(false);
        const showComboModal = ref(false);
        const selectedCombo = ref(null);
        const isLoadingCategories = ref(false);

        const category_settings = computed(() => ({
            use_image: false,
            area_text_size: 16,
            width_image_product: 35,
            height_image_product: 35,
            ...(settingsStore.business_settings?.category || {}),
        }));

        const canUsePrograms = computed(() => {
            const orderSettings = settingsStore.businessSettings?.order;
            return !(orderSettings && orderSettings.order_by_customer);
        });

        const goToCategory = (category) => {
            if (!category) return;
            router.push({ name: "CategoriesItems", params: { category: category.id } });
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
            return combos.value.filter((combo) => combo.combo_category === categoryId);
        };

        const loadCombos = async () => {
            loadingCombos.value = true;
            try {
                const categoriesResponse = await getComboCategories({
                    is_disabled: false,
                    only_with_combos: true,
                });
                comboCategories.value =
                    categoriesResponse.data.results || categoriesResponse.data || [];

                const combosResponse = await getCombos({
                    is_active: true,
                    page: 1,
                    page_size: 100,
                });
                combos.value = combosResponse.data.results || combosResponse.data || [];
            } catch (error) {
                console.error("Error loading combos", error);
                window.$message?.error("Error al cargar los combos");
            } finally {
                loadingCombos.value = false;
            }
        };

        onMounted(async () => {
            isLoadingCategories.value = true;
            try {
                await productStore.refreshCategories();
            } finally {
                isLoadingCategories.value = false;
            }
            const menuData = await getMenuToday();
            scheduledMenus.value = menuData.data || [];
            await loadCombos();
        });

        return {
            productStore,
            scheduledMenus,
            showMenuModal,
            selectedMenu,
            handleOpenMenuModal,
            comboCategories,
            combos,
            loadingCombos,
            showComboModal,
            selectedCombo,
            handleOpenComboModal,
            getCombosForCategory,
            category_settings,
            canUsePrograms,
            isLoadingCategories,
            goToCategory,
        };
    },
});
</script>

<style lang="scss" scoped>
#CategoriesList {
    height: 100%;
}

.category-card {
    min-height: 200px;
}

.item-zoom {
    position: relative;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.3s ease, transform 0.3s ease;
}

.item-zoom.is-selected {
    border-color: #18a058;
    transform: translateY(-2px);
}

.item-zoom img,
.category-container img {
    width: 100%;
    height: 130px;
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
    height: 130px;
}

.fallback-box {
    width: 100%;
    height: 100%;
    background: #f3f3f3;
    transition: background-color 0.3s ease, transform 0.3s ease;
}

.item-zoom:hover .fallback-box {
    background-color: #d5f3e5;
    transform: scale(1.02);
}

.category-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 700;
    color: #2b2b2b;
    text-align: center;
    white-space: normal;
    word-break: break-word;
    pointer-events: none;
}
</style>
