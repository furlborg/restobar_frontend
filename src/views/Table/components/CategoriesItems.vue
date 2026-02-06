<template>
  <div id="CategoriesItems">
    <n-card :bordered="false" class="product-card">
      <template #header>
        <n-space justify="space-between" align="center" class="w-100">
          <n-text class="fs-4">{{ selectedCategoryTitle }}</n-text>
          <n-button size="small" secondary type="primary" @click="handleBack">
            Volver a categorias
          </n-button>
        </n-space>
      </template>
      <n-input v-model:value="search" placeholder="Buscar producto" clearable class="mb-3">
        <template #prefix>
          <v-icon name="md-search-round" />
        </template>
      </n-input>
      <n-spin :show="isLoading">
        <n-scrollbar ref="scrollbarRef" style="max-height: 700px">
          <n-list v-if="itemsList.length" class="product-list me-2">
            <n-list-item
              v-for="product in itemsList"
              :key="product.id"
              class="product-list-item"
              :class="{ 'product-disabled': !product.has_stock || !product.has_supplies }"
              @click="addOrderToCustomer(product)"
            >
              <template #prefix>
                <n-avatar
                  round
                  :size="category_settings.width_image_product"
                  :style="{ minWidth: category_settings.width_image_product + 'px' }"
                  :src="productImage(product)"
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
          <n-empty v-else description="No se encontraron productos para esta categoria" />
          <div ref="loadMoreTrigger" style="height: 1px;"></div>
          <div v-if="isLoadingMore" class="text-center py-2">
            <n-text depth="3">Cargando mas productos...</n-text>
          </div>
        </n-scrollbar>
      </n-spin>
    </n-card>
  </div>
</template>

<script>
import {
  defineComponent,
  computed,
  onMounted,
  onUnmounted,
  ref,
  inject,
  watch,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useSettingsStore } from "@/store/modules/settings";
import { getProductsByCategory } from "@/api/modules/products";
import { useProductStore } from "@/store/modules/product";
import defaultFoodImage from "@/assets/images/default-food-image.jpg";

export default defineComponent({
  name: "CategoriesItems",
  setup() {
    const productImage = (p) => p?.image || p?.image_url || defaultFoodImage;
    const route = useRoute();
    const router = useRouter();
    const orderStore = useOrderStore();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const products = ref([]);
    const search = ref("");
    const pageLimit = 10;
    const totalCount = ref(null);
    const lastBatchCount = ref(0);
    const isLoading = ref(false);
    const isLoadingMore = ref(false);
    const scrollbarRef = ref(null);
    const loadMoreTrigger = ref(null);
    let scrollRoot = null;

    const addOrderToCustomer = inject(
      "handleProductClick",
      (product) => {
        if (product?.has_stock && product?.has_supplies) {
          orderStore.addOrder(product);
        }
      }
    );

    const category_settings = computed(() => ({
      use_image: false,
      area_text_size: 16,
      width_image_product: 75,
      height_image_product: 75,
      ...(settingsStore.business_settings?.category || {}),
    }));

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

    const selectedCategoryTitle = computed(() => {
      return productStore.getCategorieDescription(route.params.category) || "Productos";
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
      const el = scrollbarRef.value?.$el || scrollbarRef.value;
      if (el) {
        const internal = el.querySelector?.(".n-scrollbar-container");
        if (internal) return internal;
      }
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

    const loadProducts = async (reset = false) => {
      if (!route.params.category) return;
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
        const response = await getProductsByCategory(route.params.category, {
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
      } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    };

    watch(
      () => route.params.category,
      async (newCategory, oldCategory) => {
        if (newCategory === oldCategory) return;
        search.value = "";
        await loadProducts(true);
        await loadProducts(false);
        await nextTick();
        setupScrollListener();
      }
    );

    watch([scrollbarRef, loadMoreTrigger], () => {
      setupScrollListener();
    });

    onUnmounted(() => {
      teardownScrollListener();
    });

    onMounted(async () => {
      await loadProducts(true);
      await loadProducts(false);
      await nextTick();
      setupScrollListener();
    });

    const handleBack = () => {
      router.push({ name: "ProductCategories" });
    };

    return {
      handleBack,
      addOrderToCustomer,
      productStore,
      products,
      orderStore,
      search,
      itemsList,
      productImage,
      category_settings,
      isLoading,
      isLoadingMore,
      loadMoreTrigger,
      scrollbarRef,
      selectedCategoryTitle,
    };
  },
});
</script>

<style lang="scss" scoped>
#CategoriesItems {
  height: 100%;
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
