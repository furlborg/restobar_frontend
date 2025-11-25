<template>
  <div id="CategoriesList">
    <n-spin :show="isLoading">
      <n-grid
        v-if="!products.length"
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
          <!-- <div class="item-zoom" @click="selectCategory(category.id)">
            <div>
              <img src="~@/assets/images/category-bg.jpg" alt="" />
                <n-text style="font-size: 21px; font-weight: 900; text-align: center; color: #000; top: 50%; left: 50%; "
                        class="position-absolute translate-middle">{{ category.description }}</n-text>
            </div>
          </div> -->

          <div class="item-zoom" @click="selectCategory(category.id)">
            <div class="category-container">

              <!-- Si useImage === true, muestra la imagen -->
              <img
                v-if="category_settings.use_image"
                src="~@/assets/images/category-bg.jpg"
                alt=""
                class="category-image"
              />

              <!-- Si useImage === false, muestra un cuadro -->
              <div v-else class="fallback-box"></div>

              <!-- Texto centrado -->
              <n-text
                class="category-text"
                :style="{ fontSize: category_settings.area_text_size + 'px' }"
              >
                {{ category.description }}
              </n-text>

            </div>
          </div>
        </n-gi>
      </n-grid>
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
                <!-- <img
                  src="~@/assets/images/default-food-image.jpg"
                  alt=""
                  width="35"
                  height="35"
                /> -->
                <img
                  src="~@/assets/images/default-food-image.jpg"
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
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";

export default defineComponent({
  name: "CategoriesList",
  setup() {
    const message = useMessage();
    const isLoading = ref(false);

    const productStore = useProductStore();
    const genericsStore = useGenericsStore();
    const orderStore = useOrderStore();
    const settingsStore = useSettingsStore();
    const category_settings = computed(() => ({
      use_image: false,
      area_text_size: 16,
      width_image_product: 35,
      height_image_product: 35,
      ...(settingsStore.business_settings?.category || {})
    }));

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

    onMounted(async () => {
      // console.log("delivery monted");
      await settingsStore.initializeStore();
      await productStore.tableCategories();
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
      category_settings,
    };
  },
});
</script>

<style lang="scss" scoped>

.item-zoom {
  position: relative;
  border: 1px solid #333;
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
}

/* Imagen */
.item-zoom img {
  width: 100%;
  height: 130px;
  object-fit: cover;

  transition: all 0.3s ease;
  filter: grayscale(100%);
}

.item-zoom:hover img {
  transform: scale(1.1);
  filter: grayscale(0%);
}

/* Contenedor */
.category-container {
  position: relative;
  width: 100%;
  height: 130px;     /* ← mismo alto para coherencia */
}

/* Cuadro sin imagen */
.fallback-box {
  width: 100%;
  height: 100%;      /* ← mismo alto que el contenedor */
  background-color: #e0e0e0;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.item-zoom:hover .fallback-box {
  background-color: #9ae2b8;
  transform: scale(1.05);
}

/* Texto */
.category-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  font-weight: 900;
  color: #000;
  text-align: center;

  white-space: normal;
  word-break: keep-all;
  pointer-events: none;
}


</style>
