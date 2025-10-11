<template>
  <div id="CategoriesList">
    <n-tabs v-if="!products.length" type="line" animated>
      <n-tab-pane name="categorias" tab="Categorías">
        <n-spin :show="isLoading">
          <n-grid
            responsive="screen"
            cols="8 xs:8 s:12 m:12 l:16 xl:20 2xl:20"
            :x-gap="12"
            :y-gap="12"
          >
            <n-gi
              :span="4"
              v-for="(category, index) in productStore.categories"
              :key="index"
            >
              <div class="item-zoom" @click="selectCategory(category.id)">
                <div>
                  <img src="~@/assets/images/category-bg.jpg" alt="" />
                    <n-text style="font-size: 21px; font-weight: 900; text-align: center; color: #000; top: 40%; left: 45%"
                            class="position-absolute translate-middle">{{ category.description }}</n-text>
                </div>
              </div>
            </n-gi>
          </n-grid>
        </n-spin>
      </n-tab-pane>
      
      <n-tab-pane name="menu" tab="Menú">
        <n-card title="Menú Programado" :bordered="false">
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
      <n-tab-pane name="combos" tab="Combos">
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
    
    <div v-else>
      <n-space align="center" justify="space-between" class="mb-3">
        <n-button class="fs-5" type="info" text @click="(products = []), (search = '')"
          >Volver a Categorias</n-button
        >
        <n-input v-model:value="search" placeholder="Buscar..." />
      </n-space>
      <n-scrollbar style="max-height: 600px">
        <n-list class="me-2">
          <n-list-item
            class="w-100 p-0"
            v-for="(product, index) in itemsList"
            :key="index"
            @click="
              product.has_stock
                ? product.has_supplies
                  ? orderStore.addOrder(product)
                  : null
                : null
            "
            style="cursor: pointer"
          >
            <template #prefix>
              <img
                src="~@/assets/images/default-food-image.jpg"
                alt=""
                width="75"
                height="75"
              />
            </template>
            <n-thing>
              <n-space vertical>
                <n-space align="center">
                  <n-text
                    :class="{
                      'fs-4': genericsStore.device === 'desktop',
                      'fs-6': genericsStore.device === 'mobile',
                    }"
                    :delete="!product.has_stock || !product.has_supplies"
                    :type="
                      product.has_stock
                        ? product.has_supplies
                          ? 'default'
                          : 'error'
                        : 'error'
                    "
                    >{{ product.name }}</n-text
                  >
                  <n-text class="fs-6" type="success"
                    >S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text
                  >
                </n-space>
                <n-text>{{ product.description }}</n-text>
              </n-space>
            </n-thing>
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </div>
    
    <ComboProductModal 
      v-if="showComboModal" 
      :combo="selectedCombo" 
      @close="showComboModal = false" 
    />
    <MenuProductModal
      v-if="showMenuModal"
      :menu="selectedMenu"
      @close="showMenuModal = false"
    />

  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";
import { getProductsByCategory, getComboCategories, getCombos, getMenuToday } from "@/api/modules/products";
import { useGenericsStore } from "@/store/modules/generics";
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
    const isLoading = ref(false);

    const productStore = useProductStore();
    const genericsStore = useGenericsStore();
    const orderStore = useOrderStore();

    const products = ref([]);
    const search = ref("");
    
    // Menu state
    const scheduledMenus = ref([]);
    const showMenuModal = ref(false);
    const selectedMenu = ref(null);
    
    // Combos state
    const comboCategories = ref([]);
    const combos = ref([]);
    const loadingCombos = ref(false);
    const showComboModal = ref(false);
    const selectedCombo = ref(null);

    const selectCategory = async (id) => {
      isLoading.value = true;
      await getProductsByCategory(id)
        .then((response) => {
          if (response.status === 200) {
            products.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    const itemsList = computed(() => {
      const list = products.value.filter((product) => {
        const searchTerm = search.value.toLowerCase();
        const productName = product.name.toLowerCase();
        const productPrice = parseFloat(product.prices).toFixed(2);
        return productName.includes(searchTerm) || productPrice.includes(searchTerm);
      });
      if (products.value.every((product) => !!product.order_index)) {
        return list.sort((a, b) => {
          if (a.order_index > b.order_index) {
            return 1;
          }
          if (a.order_index < b.order_index) {
            return -1;
          }
          return 0;
        });
      } else {
        return list;
      }
    });
    
    const handleOpenComboModal = (combo) => {
      selectedCombo.value = combo;
      showComboModal.value = true;
    };
    
    const handleOpenMenuModal = async (menu) => {
      const menuData = await getMenuToday(menu.id);
      if (menuData?.data?.length) {
        selectedMenu.value = menuData.data[0];
        showMenuModal.value = true;
      }
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
        const categoriesResponse = await getComboCategories({ is_disabled: false, only_with_combos: true });
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

    onMounted(async () => {
      await productStore.refreshCategories();
      // Cargar menús programados
      const menuData = await getMenuToday();
      scheduledMenus.value = menuData.data;
      // Cargar combos
      await loadCombos();
    });

    return {
      genericsStore,
      isLoading,
      selectCategory,
      productStore,
      products,
      orderStore,
      search,
      itemsList,
      // Menu
      scheduledMenus,
      showMenuModal,
      selectedMenu,
      handleOpenMenuModal,
      // Combos
      comboCategories,
      combos,
      loadingCombos,
      showComboModal,
      selectedCombo,
      handleOpenComboModal,
      getCombosForCategory,
    };
  },
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
