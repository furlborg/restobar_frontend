<template>
    <n-tabs type="line" animated>
        <n-tab-pane name="categorias" tab="Categorías">
            <n-card
            title="Categorías"
            :bordered="false"
            class="h-100"
            content-class="overflow-auto"
            >
                <n-scrollbar>
                    <div>
                        <n-list v-if="listType === 'list'" class="me-2">
                            <n-list-item
                                    v-for="(category, index) in productStore.categories"
                                    :key="index"
                            >
                                <template #prefix>
                                    <img
                                        src="~@/assets/images/category-bg.jpg"
                                        alt=""
                                        width="75"
                                        height="50"
                                    />
                                </template>
                                <n-thing>
                                    <n-space vertical>
                                        <n-space align="center">
                                            <router-link
                                                    class="text-decoration-none"
                                                    :to="{
                                                        name: 'CategoriesItems',
                                                        params: { category: category.id },
                                                    }"
                                            >
                                                <n-text class="fs-4">{{ category.description }}</n-text>
                                            </router-link>
                                            <n-text class="fs-6" type="success">S/. 10.00</n-text>
                                        </n-space>
                                        <n-text
                                        >Lorem ipsum dolor sit, amet consectetur adipisicing
                                            elit.
                                        </n-text
                                        >
                                    </n-space>
                                </n-thing>
                                <template #suffix>
                                    <n-button type="info" text>
                                        <v-icon name="md-addbox-round" scale="2"/>
                                    </n-button>
                                </template>
                            </n-list-item>
                        </n-list>
                        <n-grid
                                v-if="listType === 'grid'"
                                responsive="screen"
                                cols="8 xs:8 s:12 m:12 l:16 xl:20 2xl:20"
                                :x-gap="5"
                                :y-gap="5"
                        >
                            <n-gi :span="4" v-for="(category, index) in productStore.categories" :key="index">
                                <div class="item-zoom">
                                    <router-link class="text-decoration-none" :to="{ name: 'CategoriesItems', params: { category: category.id } }">
                                        <img src="~@/assets/images/category-bg.jpg" alt=""/>

                                        <n-text class="position-absolute translate-middle fs-7 fw-bold w-100 top-50 start-50 text-center" style="color: #000;"
                                        >{{ category.description }}
                                        </n-text>
                                    </router-link>
                                </div>
                            </n-gi>
                        </n-grid>
                    </div>
                </n-scrollbar>
            </n-card>
        </n-tab-pane>
        <n-tab-pane v-if="!settingsStore.businessSettings.order?.order_by_customer" name="menu" tab="Menú">
            <n-card
            title="Menú Programado"
            :bordered="false"
            class="h-100"
            content-class="overflow-auto"
            >
                <n-list>
                    <n-list-item v-for="menu in scheduledMenus" :key="menu.id" @click="handleOpenMenuModal(menu)" style="cursor: pointer">
                        <n-thing>
                            <n-space vertical>
                                <n-text class="fs-4">{{ menu.menu.name }}</n-text>
                                <n-text class="fs-6" type="info">Price: {{ menu.menu.price}}</n-text>
                            </n-space>
                        </n-thing>
                    </n-list-item>
                </n-list>
            </n-card>
        </n-tab-pane>
        <n-tab-pane v-if="!settingsStore.businessSettings.order?.order_by_customer" name="combos" tab="Combos">
            <n-card
                title="Combos Disponibles"
                :bordered="false"
                class="h-100"
                content-class="overflow-auto"
            >
                <n-spin :show="loadingCombos">
                    <!-- Categorías de Combos -->
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
                                        <n-avatar v-else :size="60" style="background-color: #18a058;">
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
                                                <n-text depth="3" style="font-size: 12px;">
                                                    {{ combo.combo_products?.length || 0 }} productos incluidos
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
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { renderIcon } from "@/utils";
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
        const listType = ref("grid");
        const scheduledMenus = ref([]);
        const showMenuModal = ref(false);
        const selectedMenu = ref(null);
        
        // Combos state
        const comboCategories = ref([]);
        const combos = ref([]);
        const loadingCombos = ref(false);
        const showComboModal = ref(false);
        const selectedCombo = ref(null);

        const handleOpenMenuModal = async (menu) => {
            const menuData = await getMenuToday(menu.id);
            if (menuData?.data?.length) {
                selectedMenu.value = menuData.data[0];
                showMenuModal.value = true;
            }
        };
        
        const handleOpenComboModal = (combo) => {
            selectedCombo.value = combo;
            showComboModal.value = true;
        };
        
        const getCombosForCategory = (categoryId) => {
            return combos.value.filter(combo => {
                // Usar combo_category del serializer
                const comboCategoryId = combo.combo_category;
                return comboCategoryId === categoryId;
            });
        };
        
        const loadCombos = async () => {
            loadingCombos.value = true;
            try {
                // Cargar categorías de combos
                // Solo cargar categorías que tienen combos activos (para órdenes/pedidos)
                const categoriesResponse = await getComboCategories({ 
                    is_disabled: false,
                    only_with_combos: true
                });
                comboCategories.value = categoriesResponse.data.results || categoriesResponse.data || [];
                
                // Cargar todos los combos activos
                const combosResponse = await getCombos({ 
                    is_active: true,
                    page: 1,
                    page_size: 100
                });
                combos.value = (combosResponse.data.results || combosResponse.data || []);
                    
            } catch (error) {
                console.error('Error loading combos:', error);
                window.$message?.error('Error al cargar los combos');
            } finally {
                loadingCombos.value = false;
            }
        };

        onMounted(async() => {
            await productStore.refreshCategories();
            const menuData = await getMenuToday();
            scheduledMenus.value = menuData.data;
            await loadCombos();
        });

        const productOptions = [
            {
                label: "Editar",
                key: "edit",
                icon: renderIcon("ri-edit-fill")
            },
            {
                label: "Eliminar",
                key: "delete",
                icon: renderIcon("ri-delete-bin-2-fill")
            }
        ];

        return {
            listType,
            productOptions,
            productStore,
            scheduledMenus,
            showMenuModal,
            selectedMenu,
            handleOpenMenuModal,
            settingsStore,
            // Combos
            comboCategories,
            combos,
            loadingCombos,
            showComboModal,
            selectedCombo,
            handleOpenComboModal,
            getCombosForCategory,
        };
    }
});
</script>

<style lang="scss" scoped>
.item-zoom {
  position: relative;
  border: 1px solid #333;
  overflow: hidden;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

.item-zoom img {
  vertical-align: top;
  max-width: 100%;
  -moz-transition: all 0.3s;
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
  -webkit-filter: grayscale(100%);
  -moz-filter: grayscale(100%);
  filter: grayscale(100%);
}

.item-zoom:hover img {
  -moz-transform: scale(1.1);
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
  -webkit-filter: grayscale(0%);
  -moz-filter: grayscale(0%);
  filter: grayscale(0%);
}
</style>