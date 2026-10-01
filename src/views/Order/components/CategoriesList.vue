<template>
  <div class="order-categories">
    <n-tabs type="line" animated>
      <n-tab-pane name="categories" tab="Categorías">
        <n-space vertical size="large">
          <n-card :bordered="false" title="Categorías disponibles" content-class="category-card">
            <n-spin :show="!productStore.categories.length && isLoadingCategories">
              <n-empty v-if="!productStore.categories.length && !isLoadingCategories"
                description="No se encontraron categorías activas" />
              <n-grid v-else responsive="screen" cols="8 xs:8 s:12 m:12 l:16 xl:20 2xl:20" :x-gap="8" :y-gap="8">
                <n-gi :span="4" v-for="category in productStore.categories" :key="category.id">
                  <div class="item-zoom" :class="{ 'is-selected': isCategorySelected(category.id) }" role="button"
                    tabindex="0" @click="selectCategory(category)" @keyup.enter="selectCategory(category)">
                    <div class="category-container">
                      <img v-if="category_settings.use_image && (category.image || category.image_url)"
                        :src="category.image || category.image_url" alt="Imagen de categoría" />
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

          <n-card :bordered="false" class="product-card">
            <template #header>
              <n-space justify="space-between" align="center" class="w-100">
                <n-text class="fs-4">{{ selectedCategoryTitle }}</n-text>
                <n-button v-if="selectedCategory" size="small" secondary type="primary" @click="clearSelectedCategory">
                  Limpiar selección
                </n-button>
              </n-space>
            </template>
            <div v-if="selectedCategory">
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
                          <n-tag v-if="!product.has_stock" type="error" size="small" round>Sin stock</n-tag>
                          <n-tag v-else-if="!product.has_supplies" type="warning" size="small" round>Sin insumos</n-tag>
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
            <n-empty v-else description="Seleccione una categoría para mostrar sus productos" />
          </n-card>
        </n-space>
      </n-tab-pane>

      <n-tab-pane v-if="canUsePrograms" name="menu" tab="Menú del Día">
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

      <n-tab-pane v-if="canUsePrograms" name="combos" tab="Combos">
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

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useProductStore } from "@/store/modules/product";
import {
  getComboCategories,
  getCombos,
  getMenuToday,
} from "@/api/modules/products";
import { useSettingsStore } from "@/store/modules/settings";
import { useUserStore } from "@/store/modules/user";
import ComboProductModal from "@/views/Table/components/ComboProductModal.vue";
import MenuProductModal from "@/views/Table/components/MenuProductModal.vue";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  name: "CategoriesList",
  components: {
    ComboProductModal,
    MenuProductModal,
  },
  setup() {
    const message = useMessage();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const userStore = useUserStore();

    const isLoading = ref(false);
    const isLoadingCategories = ref(false);
    const products = ref([]);
    const search = ref("");
    const selectedCategory = ref(null);

    const scheduledMenus = ref([]);
    const showMenuModal = ref(false);
    const selectedMenu = ref(null);

    const comboCategories = ref([]);
    const combos = ref([]);
    const loadingCombos = ref(false);
    const showComboModal = ref(false);
    const selectedCombo = ref(null);

    const router = useRouter();
    const route = useRoute();

    const category_settings = computed(() => ({
      use_image: false,
      area_text_size: 16,
      width_image_product: 75,
      height_image_product: 75,
      ...(settingsStore.business_settings?.category || {}),
    }));

    const canUsePrograms = computed(() => userStore.hasPermission('use_combos_menus'));

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

    const selectedCategoryTitle = computed(() => {
      return selectedCategory.value
        ? `Productos de ${selectedCategory.value.description}`
        : "Productos";
    });

    const isCategorySelected = (categoryId) => {
      return selectedCategory.value ? selectedCategory.value.id === categoryId : false;
    };

    const selectCategory = async (category) => {
      if (!category) return;
      router.push({ name: "CategoriesOrderItems", params: { category_id: category.id }, query: { delivery: route.query.delivery || "false" } });
      return;
    };

    const handleOpenComboModal = (combo) => {
      selectedCombo.value = combo;
      showComboModal.value = true;
    };

    const handleOpenMenuModal = async (menu) => {
      try {
        const menuData = await getMenuToday(menu.id);
        if (menuData?.data?.length) {
          selectedMenu.value = menuData.data[0];
          showMenuModal.value = true;
        }
      } catch (error) {
        console.error("Error loading menu", error);
        message.error("No fue posible cargar el menú seleccionado");
      }
    };

    const getCombosForCategory = (categoryId) =>
      combos.value.filter((combo) => combo.category?.id === categoryId);

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
        combos.value = combosResponse.data || [];
      } catch (error) {
        console.error("Error loading combos", error);
        message.error("Error al cargar los combos");
      } finally {
        loadingCombos.value = false;
      }
    };

    const loadCategories = async () => {
      isLoadingCategories.value = true;
      try {
        if (productStore.refreshCategories) {
          await productStore.refreshCategories();
        } else if (productStore.tableCategories) {
          await productStore.tableCategories();
        }
      } catch (error) {
        console.error("Error loading categories", error);
      } finally {
        isLoadingCategories.value = false;
      }
    };

    const loadMenus = async () => {
      try {
        const menuData = await getMenuToday();
        scheduledMenus.value = menuData.data || [];
      } catch (error) {
        console.error("Error loading menus", error);
      }
    };

    onMounted(async () => {
      await settingsStore.initializeStore?.();
      await loadCategories();
      await loadMenus();
      await loadCombos();
    });

    return {
      productStore,
      settingsStore,
      isLoading,
      isLoadingCategories,
      selectCategory,
      products,
      search,
      itemsList,
      selectedCategory,
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
      selectedCategoryTitle,
      isCategorySelected,
    };
  },
});
</script>

<style scoped lang="scss">
.order-categories {
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

.product-card {
  min-height: 240px;
}

.product-list-item {
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.product-list-item:not(.product-disabled):hover {
  background-color: #f8faf9;
}

.product-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.product-list :deep(.n-list-item__main) {
  width: 100%;
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
.combos-card {
  background: #ffffff;
}

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
</style>
