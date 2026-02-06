<template>
  <div class="order-categories">
    <n-tabs type="line" animated>
      <n-tab-pane name="categories" tab="Categorías">
        <n-space vertical size="large">
          <n-card
            v-if="!selectedCategory"
            :bordered="false"
            title="Categorías disponibles"
            content-class="category-card"
          >
            <n-spin :show="!productStore.categories.length && isLoadingCategories">
              <n-empty
                v-if="!productStore.categories.length && !isLoadingCategories"
                description="No se encontraron categorías activas"
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
                    :class="{ 'is-selected': isCategorySelected(category.id) }"
                    role="button"
                    tabindex="0"
                    @click="selectCategory(category)"
                    @keyup.enter="selectCategory(category)"
                  >
                    <div class="category-container">
                      <img
                        v-if="category_settings.use_image && (category.image || category.image_url)"
                        :src="category.image || category.image_url"
                        alt="Imagen de categoría"
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

          <n-card v-else :bordered="false" class="product-card">
            <template #header>
              <n-space justify="space-between" align="center" class="w-100">
                <n-text class="fs-4">{{ selectedCategoryTitle }}</n-text>
                <n-button size="small" secondary type="primary" @click="clearSelectedCategory">
                  Volver a categorías
                </n-button>
              </n-space>
            </template>
            <n-input v-model:value="search" placeholder="Buscar producto" clearable class="mb-3">
              <template #prefix>
                <v-icon name="md-search-round" />
              </template>
            </n-input>
            <n-spin :show="isLoading">
              <n-scrollbar style="max-height: 700px">
                <n-list v-if="itemsList.length" class="product-list me-2">
                  <n-list-item
                    v-for="product in itemsList"
                    :key="product.id"
                    class="product-list-item"
                    :class="{ 'product-disabled': !product.has_stock || !product.has_supplies }"
                    @click="handleSelectProduct(product)"
                  >
                    <template #prefix>
                      <n-avatar
                        round
                        :size="category_settings.width_image_product"
                        :style="{ minWidth: category_settings.width_image_product + 'px' }"
                        :src="product.image || product.image_url"
                      >
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
                <div ref="loadMoreTrigger" style="height: 1px;"></div>
                <div v-if="isLoadingMore" class="text-center py-2">
                  <n-text depth="3">Cargando mas productos...</n-text>
                </div>
              </n-scrollbar>
            </n-spin>
          </n-card>
        </n-space>
      </n-tab-pane>

      <n-tab-pane
        v-if="canUsePrograms"
        name="menu"
        tab="Menú"
      >
        <n-card title="Menú programado" :bordered="false" content-class="overflow-auto">
          <n-list v-if="scheduledMenus.length">
            <n-list-item
              v-for="menu in scheduledMenus"
              :key="menu.id"
              style="cursor: pointer"
              @click="handleOpenMenuModal(menu)"
            >
              <n-thing>
                <n-space vertical>
                  <n-text class="fs-4">{{ menu.menu.name }}</n-text>
                  <n-text type="info">S/. {{ parseFloat(menu.menu.price).toFixed(2) }}</n-text>
                </n-space>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-empty v-else description="Aún no se programaron menús para hoy" />
        </n-card>
      </n-tab-pane>

      <n-tab-pane
        v-if="canUsePrograms"
        name="combos"
        tab="Combos"
      >
        <n-card title="Combos disponibles" :bordered="false" content-class="overflow-auto" class="h-100">
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
                    style="cursor: pointer"
                    @click="handleOpenComboModal(combo)"
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
                <n-empty v-if="!getCombosForCategory(category.id).length" description="No hay combos para esta categoría" size="small" />
              </div>
            </n-space>
            <n-empty v-if="!comboCategories.length && !loadingCombos" description="No hay categorías de combos disponibles" />
          </n-spin>
        </n-card>
      </n-tab-pane>
    </n-tabs>

    <MenuProductModal v-if="showMenuModal" :menu="selectedMenu" @close="showMenuModal = false" />
    <ComboProductModal v-if="showComboModal" :combo="selectedCombo" @close="showComboModal = false" />
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
} from "vue";
import { useMessage } from "naive-ui";
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";
import {
  getProductsByCategory,
  getComboCategories,
  getCombos,
  getMenuToday,
} from "@/api/modules/products";
import { useSettingsStore } from "@/store/modules/settings";
import ComboProductModal from "@/views/Table/components/ComboProductModal.vue";
import MenuProductModal from "@/views/Table/components/MenuProductModal.vue";

export default defineComponent({
  name: "CategoriesList",
  components: {
    ComboProductModal,
    MenuProductModal,
  },
  setup() {
    const message = useMessage();
    const productStore = useProductStore();
    const orderStore = useOrderStore();
    const settingsStore = useSettingsStore();

    const isLoading = ref(false);
    const isLoadingCategories = ref(false);
    const products = ref([]);
    const search = ref("");
    const selectedCategory = ref(null);
    const pageLimit = 10;
    const totalCount = ref(null);
    const lastBatchCount = ref(0);
    const isLoadingMore = ref(false);
    const loadMoreTrigger = ref(null);
    let scrollRoot = null;

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
      width_image_product: 75,
      height_image_product: 75,
      ...(settingsStore.business_settings?.category || {}),
    }));

    const canUsePrograms = computed(
      () => !settingsStore.businessSettings?.order?.order_by_customer,
    );

    const itemsList = computed(() => {
      const source = Array.isArray(products.value) ? products.value : [];
      const list = source.filter((product) => {
        const searchTerm = search.value.toLowerCase();
        const productName = product.name.toLowerCase();
        const productPrice = parseFloat(product.prices).toFixed(2);
        return productName.includes(searchTerm) || productPrice.includes(searchTerm);
      });

      if (source.every((product) => !!product.order_index)) {
        return list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
      return list;
    });

    const normalizePaginated = (payload) => {
      if (Array.isArray(payload)) {
        return {
          count: payload.length,
          results: payload,
          next: null,
          previous: null,
        };
      }
      const results = Array.isArray(payload?.results) ? payload.results : [];
      const count =
        typeof payload?.count === "number" ? payload.count : results.length;
      return {
        count,
        results,
        next: payload?.next ?? null,
        previous: payload?.previous ?? null,
      };
    };

    const hasMoreProducts = computed(() => {
      if (totalCount.value !== null) {
        return products.value.length < totalCount.value;
      }
      return lastBatchCount.value !== 0;
    });

    const getScrollParent = (el) => {
      let parent = el?.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (/(auto|scroll)/.test(style.overflowY)) return parent;
        parent = parent.parentElement;
      }
      return null;
    };

    const getScrollRoot = () => {
      if (loadMoreTrigger.value) {
        const byClosest = loadMoreTrigger.value.closest(".n-scrollbar-container");
        if (byClosest) return byClosest;
        const parent = getScrollParent(loadMoreTrigger.value);
        if (parent) return parent;
      }
      return null;
    };

    const scrollThreshold = 200;

    const getScrollMetrics = () => {
      if (scrollRoot && scrollRoot !== window) {
        return {
          scrollTop: scrollRoot.scrollTop,
          clientHeight: scrollRoot.clientHeight,
          scrollHeight: scrollRoot.scrollHeight,
        };
      }
      const doc = document.documentElement;
      return {
        scrollTop: doc.scrollTop || window.pageYOffset,
        clientHeight: window.innerHeight,
        scrollHeight: doc.scrollHeight,
      };
    };

    const handleScroll = () => {
      if (isLoading.value || isLoadingMore.value) return;
      if (!hasMoreProducts.value) return;
      const { scrollTop, clientHeight, scrollHeight } = getScrollMetrics();
      if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
        loadProducts(false);
      }
    };

    const setupScrollListener = () => {
      const root = getScrollRoot();
      const nextRoot = root || window;
      if (scrollRoot === nextRoot) return;
      if (scrollRoot) {
        scrollRoot.removeEventListener("scroll", handleScroll);
      }
      scrollRoot = nextRoot;
      scrollRoot.addEventListener("scroll", handleScroll, { passive: true });
    };

    const teardownScrollListener = () => {
      if (!scrollRoot) return;
      scrollRoot.removeEventListener("scroll", handleScroll);
      scrollRoot = null;
    };

    const selectedCategoryTitle = computed(() => {
      return selectedCategory.value
        ? `Productos de ${selectedCategory.value.description}`
        : "Productos";
    });

    const isCategorySelected = (categoryId) => {
      return selectedCategory.value ? selectedCategory.value.id === categoryId : false;
    };

    const loadProducts = async (reset = false) => {
      if (!selectedCategory.value) return;
      if (isLoading.value || isLoadingMore.value) return;
      if (!reset && !hasMoreProducts.value) return;

      if (reset) {
        products.value = [];
        totalCount.value = null;
        lastBatchCount.value = 0;
      }

      const offset = products.value.length;
      const isInitialLoad = reset || offset === 0;
      if (isInitialLoad) {
        isLoading.value = true;
      } else {
        isLoadingMore.value = true;
      }

      try {
        const response = await getProductsByCategory(selectedCategory.value.id, {
          limit: pageLimit,
          offset,
        });
        if (response.status === 200) {
          const { results, count } = normalizePaginated(response.data);
          products.value = offset === 0 ? results : [...products.value, ...results];
          lastBatchCount.value = results.length;
          totalCount.value = results.length === 0 ? products.value.length : count;
        }
      } catch (error) {
        console.error(error);
        message.error("No se pudieron cargar los productos de la categor??a");
      } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    };

    const selectCategory = async (category) => {
      if (!category) return;
      selectedCategory.value = category;
      search.value = "";
      await loadProducts(true);
      await loadProducts(false);
      await nextTick();
      setupScrollListener();
    };

    const clearSelectedCategory = () => {
      selectedCategory.value = null;
      products.value = [];
      totalCount.value = null;
      lastBatchCount.value = 0;
      isLoadingMore.value = false;
      search.value = "";
      teardownScrollListener();
    };

    const handleSelectProduct = (product) => {
      if (!product.has_stock || !product.has_supplies) return;
      orderStore.addOrder(product);
      message.success(`${product.name} agregado`);
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
      combos.value.filter((combo) => combo.combo_category === categoryId);

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

    watch(loadMoreTrigger, (value) => {
      if (value) {
        setupScrollListener();
      }
    });

    onUnmounted(() => {
      teardownScrollListener();
    });

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
      clearSelectedCategory,
      handleSelectProduct,
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
      isLoadingMore,
      loadMoreTrigger,
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
</style>
