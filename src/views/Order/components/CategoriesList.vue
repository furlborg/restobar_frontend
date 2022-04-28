<template>
  <div id="CategoriesList">
    <n-spin :show="isLoading">
      <n-grid
        v-if="!products.length"
        responsive="screen"
        cols="4 s:4 m:20 l:20 xl:20 2xl:20"
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
              <n-text
                class="
                  position-absolute
                  top-50
                  start-50
                  translate-middle
                  text-center
                  fs-5
                "
                >{{ category.description }}</n-text
              >
            </div>
          </div>
        </n-gi>
      </n-grid>
      <div v-else>
        <n-space align="center" justify="space-between">
          <n-input v-model:value="search" placeholder="Buscar..." />
          <n-button type="info" text @click="products = []"
            >Volver a Categorias</n-button
          >
        </n-space>
        <n-scrollbar style="max-height: 600px">
          <n-list class="me-2">
            <n-list-item
              class="w-100 p-0"
              v-for="(product, index) in itemsList"
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
        </n-scrollbar>
      </div>
    </n-spin>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useProductStore } from "@/store/modules/product";
import { useOrderStore } from "@/store/modules/order";
import { getProductsByCategory } from "@/api/modules/products";

export default defineComponent({
  name: "CategoriesList",
  setup() {
    const message = useMessage();
    const isLoading = ref(false);

    const productStore = useProductStore();
    const orderStore = useOrderStore();

    const products = ref([]);
    const search = ref("");

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
      return products.value.filter((product) =>
        product.name.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    onMounted(async () => {
      await productStore.refreshCategories();
    });

    return {
      isLoading,
      selectCategory,
      productStore,
      products,
      orderStore,
      search,
      itemsList,
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