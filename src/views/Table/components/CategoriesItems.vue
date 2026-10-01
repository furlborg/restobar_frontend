<template>
  <div id="CategoriesItems" class="categories-items-wrapper">
    <!-- BARRA SUPERIOR: RETORNO, TÍTULO, SELECTOR DE MODO Y BÚSQUEDA -->
    <header class="category-items-header">
      <div class="header-left">
        <n-button quaternary size="small" class="btn-back-categories" @click="handleBack">
          <template #icon>
            <v-icon name="md-arrowback-round" scale="1.1" />
          </template>
          <span>Categorías</span>
        </n-button>
        <div class="category-title-group">
          <span class="category-name-text">{{ currentCategoryName }}</span>
          <span class="category-badge-count">{{ itemsList.length }} {{ itemsList.length === 1 ? 'producto' : 'productos' }}</span>
        </div>
      </div>
      <div class="header-right">
        <!-- Toggle Modo Tarjetas / Modo Lista -->
        <div class="view-mode-toggle-group">
          <button
            type="button"
            class="view-mode-btn"
            :class="{ active: viewMode === 'grid' }"
            title="Modo Tarjetas (Grid)"
            @click="setViewMode('grid')"
          >
            <v-icon name="md-gridview-round" scale="1.0" />
            <span class="view-mode-text">Tarjetas</span>
          </button>
          <button
            type="button"
            class="view-mode-btn"
            :class="{ active: viewMode === 'list' }"
            title="Modo Lista"
            @click="setViewMode('list')"
          >
            <v-icon name="md-list-round" scale="1.0" />
            <span class="view-mode-text">Lista</span>
          </button>
        </div>

        <n-input
          v-model:value="search"
          size="small"
          clearable
          placeholder="Buscar producto o precio..."
          class="category-search-input"
        >
          <template #prefix>
            <v-icon name="md-search-round" class="text-muted" />
          </template>
        </n-input>
      </div>
    </header>

    <!-- ÁREA DE PRODUCTOS CON SCROLL INDEPENDIENTE -->
    <div class="category-items-scrollable">
      <n-spin :show="loading">
        <!-- MODO TARJETAS (GRID) CON NOMBRES COMPLETOS VISIBLES -->
        <div v-if="itemsList.length > 0 && viewMode === 'grid'" class="products-cards-grid">
          <div
            v-for="product in itemsList"
            :key="product.id"
            class="product-card"
            :class="{
              'in-current-order': getProductCount(product.id) > 0,
              'is-unavailable': isUnavailable(product)
            }"
            @click="handleProductCardClick(product)"
          >
            <!-- IMAGEN O ICONO GASTRONÓMICO ELEGANTE -->
            <div class="product-card-media">
              <img
                v-if="hasValidImage(product)"
                :src="productImage(product)"
                :alt="product.name"
                class="product-img"
                @error="product.imageError = true"
              />
              <div v-else class="product-icon-box">
                <v-icon name="gi-meal" scale="1.3" />
              </div>

              <!-- BADGE FLOTANTE DE CANTIDAD EN ORDEN -->
              <span v-if="getProductCount(product.id) > 0" class="order-qty-pill">
                {{ getProductCount(product.id) }}
              </span>
            </div>

            <!-- CONTENIDO Y METADATOS: NOMBRE COMPLETO SIEMPRE VISIBLE -->
            <div class="product-card-body">
              <span class="product-name" :title="product.name">{{ product.name }}</span>
              
              <div class="product-meta-row">
                <!-- Stock -->
                <span
                  v-if="hasStockControl(product)"
                  class="meta-stock-pill"
                  :class="{
                    'stock-ok': hasStockAvailable(product) && getStockNumber(product) > 5,
                    'stock-low': hasStockAvailable(product) && getStockNumber(product) <= 5,
                    'stock-out': !hasStockAvailable(product)
                  }"
                >
                  {{ hasStockAvailable(product) ? `Stock: ${getStockNumber(product)}` : 'Sin stock' }}
                </span>

                <!-- Insumos -->
                <span v-if="(product.control_supplies || product.control_supplie) && !product.has_supplies" class="meta-stock-pill stock-out">
                  Sin insumos
                </span>

                <!-- Indicador de añadido -->
                <span v-if="getProductCount(product.id) > 0" class="meta-ordered-tag">
                  <v-icon name="bi-check2" scale="0.85" /> Agregado
                </span>
              </div>
            </div>

            <!-- PRECIO Y BOTÓN DE AÑADIR -->
            <div class="product-card-action">
              <span class="product-price">S/. {{ formatPrice(product.prices) }}</span>
              <button
                type="button"
                class="btn-add-product"
                :disabled="isUnavailable(product)"
                :title="isUnavailable(product) ? 'Sin stock/insumos' : 'Añadir a la comanda'"
                @click.stop="handleProductCardClick(product)"
              >
                <v-icon name="md-add-round" scale="1.1" />
              </button>
            </div>
          </div>
        </div>

        <!-- MODO LISTA COMPACTA (LIST) -->
        <div v-else-if="itemsList.length > 0 && viewMode === 'list'" class="products-list-wrapper">
          <div
            v-for="product in itemsList"
            :key="product.id"
            class="product-list-row"
            :class="{
              'in-current-order': getProductCount(product.id) > 0,
              'is-unavailable': isUnavailable(product)
            }"
            @click="handleProductCardClick(product)"
          >
            <div class="list-media">
              <img
                v-if="hasValidImage(product)"
                :src="productImage(product)"
                :alt="product.name"
                class="list-img"
                @error="product.imageError = true"
              />
              <div v-else class="list-icon-box">
                <v-icon name="gi-meal" scale="1.1" />
              </div>
              <span v-if="getProductCount(product.id) > 0" class="list-qty-pill">
                {{ getProductCount(product.id) }}
              </span>
            </div>

            <div class="list-info">
              <div class="list-name-row">
                <span class="list-product-name">{{ product.name }}</span>
                <span v-if="getProductCount(product.id) > 0" class="meta-ordered-tag ms-2">
                  <v-icon name="bi-check2" scale="0.8" /> En comanda
                </span>
              </div>
              <div class="list-meta-row">
                <span v-if="product.description" class="list-product-desc">{{ product.description }}</span>
                <span
                  v-if="hasStockControl(product)"
                  class="meta-stock-pill"
                  :class="{
                    'stock-ok': hasStockAvailable(product) && getStockNumber(product) > 5,
                    'stock-low': hasStockAvailable(product) && getStockNumber(product) <= 5,
                    'stock-out': !hasStockAvailable(product)
                  }"
                >
                  {{ hasStockAvailable(product) ? `Stock: ${getStockNumber(product)}` : 'Sin stock' }}
                </span>
                <span v-if="(product.control_supplies || product.control_supplie) && !product.has_supplies" class="meta-stock-pill stock-out">
                  Sin insumos
                </span>
              </div>
            </div>

            <div class="list-action">
              <span class="product-price">S/. {{ formatPrice(product.prices) }}</span>
              <button
                type="button"
                class="btn-add-product"
                :disabled="isUnavailable(product)"
                :title="isUnavailable(product) ? 'Sin stock/insumos' : 'Añadir a la comanda'"
                @click.stop="handleProductCardClick(product)"
              >
                <v-icon name="md-add-round" scale="1.0" />
              </button>
            </div>
          </div>
        </div>

        <!-- ESTADO VACÍO: BÚSQUEDA SIN COINCIDENCIAS -->
        <div v-else-if="search.trim()" class="empty-state-box">
          <n-empty description="No se encontraron productos con ese criterio" size="medium">
            <template #extra>
              <n-button size="small" secondary @click="search = ''">Limpiar búsqueda</n-button>
            </template>
          </n-empty>
        </div>

        <!-- ESTADO VACÍO: CATEGORÍA SIN PRODUCTOS -->
        <div v-else class="empty-state-box">
          <n-empty description="No hay productos disponibles en esta categoría" size="medium" />
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import { getProductsByCategory } from "@/api/modules/products";
import { useProductStore } from "@/store/modules/product";

const route = useRoute();
const router = useRouter();
const genericsStore = useGenericsStore();
const orderStore = useOrderStore();
const productStore = useProductStore();
const settingsStore = useSettingsStore();

const products = ref([]);
const search = ref("");
const loading = ref(false);

// Modo de vista: 'grid' (tarjetas) o 'list' (modo lista)
const defaultMode = settingsStore.business_settings?.category?.default_view_mode || 'grid';
const viewMode = ref(localStorage.getItem('flizzy_table_view_mode') || defaultMode);

const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('flizzy_table_view_mode', mode);
};

const addOrderToCustomer = inject(
  "handleProductClick",
  (product) => {
    if (product?.has_stock && product?.has_supplies) {
      orderStore.addOrder(product);
    }
  }
);

const currentCategoryName = computed(() => {
  const catId = route.params.category;
  return productStore.getCategorieDescription(catId) || 'Productos';
});

const getProductCount = (productId) => {
  return orderStore.orderList
    .filter((order) => order.product === productId)
    .reduce((sum, order) => sum + order.quantity, 0);
};

const formatPrice = (price) => {
  return parseFloat(price || 0).toFixed(2);
};

const hasValidImage = (p) => {
  if (p?.imageError) return false;
  const img = p?.image || p?.image_url;
  return !!img && !img.includes('default-food-image') && !img.includes('default-image');
};

const productImage = (p) => {
  return p?.image || p?.image_url || '';
};

const hasStockControl = (p) => {
  return p?.control_stock === true || p?.control_stock === 1 || p?.control_stock === 'true';
};

const getStockNumber = (p) => {
  const s = parseFloat(p?.stock);
  return Number.isFinite(s) ? Math.floor(s) : 0;
};

const hasStockAvailable = (p) => {
  if (!hasStockControl(p)) return true;
  if (p?.has_stock === false) return false;
  return getStockNumber(p) > 0;
};

const isUnavailable = (p) => {
  const stockUnavail = hasStockControl(p) && !hasStockAvailable(p);
  const suppUnavail = (p?.control_supplies || p?.control_supplie) && !p?.has_supplies;
  return stockUnavail || suppUnavail;
};

const handleProductCardClick = (product) => {
  if (isUnavailable(product)) return;
  addOrderToCustomer(product);
};

const itemsList = computed(() => {
  const q = (search.value || "").trim();
  if (!q) {
    if (products.value.every((product) => !!product.order_index)) {
      return [...products.value].sort((a, b) => (a.order_index > b.order_index ? 1 : a.order_index < b.order_index ? -1 : 0));
    }
    return products.value;
  }

  // Búsqueda inteligente con productStore
  const localMatches = productStore.searchLocal(q);
  if (localMatches.length) {
    const matchRankMap = new Map();
    localMatches.forEach((p, idx) => matchRankMap.set(p.id, idx));
    const filtered = products.value.filter(p => matchRankMap.has(p.id));
    if (filtered.length) {
      return filtered.sort((a, b) => (matchRankMap.get(a.id) ?? 999) - (matchRankMap.get(b.id) ?? 999));
    }
  }

  // Fallback a coincidencia directa por nombre o precio
  const qLower = q.toLowerCase();
  return products.value.filter((product) => {
    const productName = (product.name || "").toLowerCase();
    const productPrice = parseFloat(product.prices || 0).toFixed(2);
    return productName.includes(qLower) || productPrice.includes(qLower);
  });
});

const loadProducts = async () => {
  loading.value = true;
  try {
    const response = await getProductsByCategory(route.params.category);
    if (response.status === 200) {
      products.value = (response.data || []).filter((p) => p.product_type !== "COMBO");
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadProducts();
});

const handleBack = () => {
  const backRouteName = route.name.startsWith('W') ? 'WProductCategories' : 'ProductCategories';
  router.push({ name: backRouteName });
};
</script>

<style lang="scss" scoped>
.categories-items-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.category-items-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 6px 8px 2px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 6px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.btn-back-categories {
  font-weight: 700 !important;
  color: #0284c7 !important;
  border-radius: 8px !important;
  padding: 0 8px !important;
}

.btn-back-categories:hover {
  background: #f0f9ff !important;
}

.category-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
}

.category-name-text {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-badge-count {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 7px;
  border-radius: 6px;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Selector Modo Tarjeta / Modo Lista */
.view-mode-toggle-group {
  display: flex;
  background: #f1f5f9;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.view-mode-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-mode-btn:hover {
  color: #0f172a;
}

.view-mode-btn.active {
  background: #ffffff;
  color: #ea580c;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.category-search-input {
  width: 200px;
}

.category-search-input :deep(.n-input) {
  border-radius: 8px;
  font-size: 12px;
}

.category-items-scrollable {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 3px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.category-items-scrollable::-webkit-scrollbar {
  width: 5px;
}
.category-items-scrollable::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}
.category-items-scrollable::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.category-items-scrollable::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ==================================================== */
/* MODO TARJETAS (GRID)                                 */
/* ==================================================== */
.products-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 10px;
  padding: 2px 2px 14px 2px;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 11px;
  padding: 9px 11px;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  position: relative;
}

.product-card:hover:not(.is-unavailable) {
  border-color: #ff6b00;
  box-shadow: 0 3px 12px rgba(255, 107, 0, 0.1);
  transform: translateY(-1px);
}

.product-card:active:not(.is-unavailable) {
  transform: scale(0.98);
}

.product-card.in-current-order {
  border-color: #10b981;
  background: #f0fdf4;
}

.product-card.is-unavailable {
  opacity: 0.55;
  cursor: not-allowed;
  background: #f8fafc;
}

.product-card-media {
  position: relative;
  flex-shrink: 0;
  width: 50px;
  height: 50px;
}

.product-img {
  width: 50px;
  height: 50px;
  border-radius: 9px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.product-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 9px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #ea580c;
  border: 1px solid #fed7aa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-qty-pill {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #10b981;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.product-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Nombres completos SIEMPRE visibles sin puntos suspensivos */
.product-name {
  font-size: 12.8px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  word-break: break-word;
  display: block;
}

.product-meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.meta-stock-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.meta-stock-pill.stock-ok {
  color: #15803d;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.meta-stock-pill.stock-low {
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.meta-stock-pill.stock-out {
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.meta-ordered-tag {
  font-size: 10px;
  font-weight: 700;
  color: #059669;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.product-card-action {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.product-price {
  font-size: 14px;
  font-weight: 850;
  color: #059669;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.btn-add-product {
  width: 29px;
  height: 29px;
  border-radius: 8px;
  border: none;
  background: #ff6b00;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(255, 107, 0, 0.25);
}

.btn-add-product:hover:not(:disabled) {
  background: #ea580c;
  transform: scale(1.05);
}

.btn-add-product:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

/* ==================================================== */
/* MODO LISTA COMPACTA (LIST)                           */
/* ==================================================== */
.products-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 2px 14px 2px;
}

.product-list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.product-list-row:hover:not(.is-unavailable) {
  border-color: #ff6b00;
  background: #fffaf5;
}

.product-list-row.in-current-order {
  border-color: #10b981;
  background: #f0fdf4;
}

.product-list-row.is-unavailable {
  opacity: 0.55;
  cursor: not-allowed;
  background: #f8fafc;
}

.list-media {
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
}

.list-img {
  width: 42px;
  height: 42px;
  border-radius: 7px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.list-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 7px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #ea580c;
  border: 1px solid #fed7aa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-qty-pill {
  position: absolute;
  top: -3px;
  right: -3px;
  background: #10b981;
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1px solid #ffffff;
}

.list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-name-row {
  display: flex;
  align-items: center;
}

.list-product-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}

.list-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.list-product-desc {
  font-size: 11px;
  color: #64748b;
  margin-right: 4px;
}

.list-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state-box {
  padding: 40px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .categories-items-wrapper {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
  .category-items-scrollable {
    overflow: visible !important;
    max-height: none !important;
  }
}

@media (max-width: 640px) {
  .category-items-header {
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 6px;
  }
  .header-left {
    width: 100%;
    justify-content: space-between;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .category-search-input {
    flex: 1;
    width: auto;
    min-width: 130px;
  }
  .products-cards-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .view-mode-text {
    display: none;
  }
  .view-mode-btn {
    padding: 4px 6px;
  }
}
</style>
