<template>
  <div id="CategoriesItems">
    <n-space class="mb-2" align="end" justify="space-between">
      <n-breadcrumb separator="⏵">
        <n-breadcrumb-item>
          <router-link :to="{ name: 'ProductCategories' }">
            <n-text class="fs-4">Categorías</n-text>
          </router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item v-if="$route.params.category">{{
          productStore.getCategorieDescription($route.params.category)
        }}</n-breadcrumb-item>
      </n-breadcrumb>
      <n-radio-group v-model:value="listType" name="listType" size="small">
        <n-radio-button class="p-0" value="list" key="list">
          <v-icon class="m-1" name="md-list-round" />
        </n-radio-button>
        <n-radio-button class="p-0" value="grid" key="grid">
          <v-icon class="m-1" name="md-gridview-round" />
        </n-radio-button>
      </n-radio-group>
    </n-space>
    <n-scrollbar v-if="products.length > 0" style="max-height: 700px">
      <n-list v-if="listType === 'list'" class="me-2">
        <n-list-item
          class="w-100 p-0"
          v-for="(product, index) in products"
          :key="index"
          @click="orderStore.addOrder(product)"
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
                <n-text class="fs-4">{{ product.name }}</n-text>
                <n-text class="fs-6" type="success"
                  >S/. {{ parseFloat(product.prices).toFixed(2) }}</n-text
                >
              </n-space>
              <n-text>{{ product.description }}</n-text>
            </n-space>
          </n-thing>
        </n-list-item>
      </n-list>
      <n-grid
        v-if="listType === 'grid'"
        responsive="screen"
        cols="5 s:5 m:10 l:10 xl:24 2xl:24"
        :x-gap="12"
        :y-gap="12"
      >
        <n-gi :span="4" v-for="index in 10" :key="index">
          <n-card>
            <template #header>
              <n-h2 class="mb-0">Product</n-h2>
              <n-text type="success">S/. 10.00</n-text>
            </template>
            <template #header-extra>
              <n-dropdown
                :options="productOptions"
                placement="left-start"
                size="small"
              >
                <n-button text size="small">
                  <v-icon name="bi-three-dots-vertical" />
                </n-button>
              </n-dropdown>
            </template>
            <template #cover>
              <img src="~@/assets/images/default-food-image.jpg" alt="" />
            </template>
            <n-text
              >Lorem ipsum dolor sit, amet consectetur adipisicing elit.</n-text
            >
          </n-card>
        </n-gi>
      </n-grid>
    </n-scrollbar>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { renderIcon } from "@/utils";
import { useOrderStore } from "@/store/modules/order";
import { getProductsByCategory } from "@/api/modules/products";
import { useProductStore } from "@/store/modules/product";

export default defineComponent({
  name: "CategoriesItems",
  setup() {
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
    const orderStore = useOrderStore();
    const productStore = useProductStore();
    const category = route.params.category;
    const listType = ref("list");
    const products = ref([]);

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

    const loadProducts = () => {
      getProductsByCategory(route.params.category)
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

    onMounted(() => {
      loadProducts();
    });

    const handleBack = () => {
      router.push({ name: "ProductCategories" });
    };

    return {
      handleBack,
      listType,
      productOptions,
      productStore,
      category,
      products,
      orderStore,
    };
  },
});
</script>

<style>
</style>