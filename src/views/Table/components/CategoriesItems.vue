<template>
  <div id="CategoriesItems">
    <n-space class="mb-2" align="end" justify="space-between">
      <n-breadcrumb separator="⏵">
        <n-breadcrumb-item>
          <router-link :to="{ name: $route.name.startsWith('W') ? 'WProductCategories' : 'ProductCategories' }">
            <n-text class="fs-4">Categorías</n-text>
          </router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item v-if="$route.params.category">
          {{ productStore.getCategorieDescription($route.params.category) }}
        </n-breadcrumb-item>
      </n-breadcrumb>
      <n-input v-model:value="search" placeholder="Buscar..." />
    </n-space>
    <n-scrollbar v-if="products.length > 0" style="max-height: 700px">
      <n-list v-if="listType === 'list'" class="me-2">
        <n-list-item
          class="w-100 p-0"
          v-for="(product, index) in itemsList"
          :key="index"
          @click="addOrderToCustomer(product)"
          style="cursor: pointer"
        >
          <template #prefix>
            <img
              :src="productImage(product)"
              alt=""
              :width="category_settings.width_image_product"
              :height="category_settings.height_image_product"
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
                  <n-tag type="primary" strong v-if="product.stock && product.control_stock">
                      Stock: {{product.stock}}
                  </n-tag>
                <n-text type="success"
                  >S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text
                >
              </n-space>
              <n-text>{{ product.description }}</n-text>
            </n-space>
          </n-thing>
          <template #suffix>
            <!-- Suffix removed as we are using a toast message now -->
          </template>
        </n-list-item>
      </n-list>
    </n-scrollbar>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";
import { useGenericsStore } from "@/store/modules/generics";
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
    const genericsStore = useGenericsStore();
    const orderStore = useOrderStore();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const category = route.params.category;
    const listType = ref("list");
    const products = ref([]);
    const search = ref("");

    const addOrderToCustomer = inject(
      "handleProductClick",
      (product) => {
        if (product?.has_stock && product?.has_supplies) {
          orderStore.addOrder(product);
          if (window.$message) {
            window.$message.success(`+1 ${product.name}`, {
              duration: 1500,
              keepAliveOnHover: true
            });
          }
        }
      }
    );

    const category_settings = computed(() => ({
      use_image: false,
      area_text_size: 16,
      width_image_product: 35,
      height_image_product: 35,
      ...(settingsStore.business_settings?.category || {}),
    }));

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

    const loadProducts = async () => {
      await getProductsByCategory(route.params.category)
        .then((response) => {
          if (response.status === 200) {
            products.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);

        });
    };

    onMounted(async () => {
      await loadProducts();
    });

    const handleBack = () => {
      router.push({ name: "ProductCategories" });
    };

    return {
      handleBack,
      addOrderToCustomer,
      listType,
      genericsStore,
      productStore,
      category,
      products,
      orderStore,
      search,
      itemsList,
      productImage,
      category_settings,
    };
  },
});
</script>

<style scoped>
</style>
