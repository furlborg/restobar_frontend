<template>
  <div id="CategoriesItems">
    <n-space class="mb-2" align="end" justify="space-between">
      <n-breadcrumb separator="⏵">
        <n-breadcrumb-item>
          <router-link :to="{ name: 'ProductCategories' }">
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
          @click="handleProductClick(product)"
          style="cursor: pointer"
        >
          <template #prefix>
            <img
               :src="productImage(product)"
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
        </n-list-item>
      </n-list>
    </n-scrollbar>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref, inject } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { renderIcon } from "@/utils";
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
    const message = useMessage();
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

    // Inyectar funciones del componente padre para el flujo de clientes
    const addOrderToCustomer = inject('addOrderToCustomer', null);
    const selectedCustomerId = inject('selectedCustomerId', ref(null));

    const handleProductClick = (product) => {
      if (!product.has_stock || !product.has_supplies) return;
      
      if (settingsStore.businessSettings.order.order_by_customer) {
        // Nuevo flujo por cliente
        if (selectedCustomerId.value && addOrderToCustomer) {
          addOrderToCustomer(product, selectedCustomerId.value);
        }
      } else {
        // Flujo tradicional
        orderStore.addOrder(product);
      }
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

    const productOptions = [
      {
        label: "Editar",
        key: "edit",
        icon: renderIcon("ri-edit-fill"),
      },
      {
        label: "Eliminar",
        key: "delete",
        icon: renderIcon("ri-delete-bin-2-fill"),
      },
    ];

    const loadProducts = async () => {
      await getProductsByCategory(route.params.category)
        .then((response) => {
          if (response.status === 200) {
            products.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
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
      handleProductClick,
      listType,
      genericsStore,
      productOptions,
      productStore,
      category,
      products,
      orderStore,
      search,
      itemsList,
      productImage,
    };
  },
});
</script>
