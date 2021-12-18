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
          $route.params.category
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
    <n-scrollbar style="max-height: 700px">
      <n-list v-if="listType === 'list'" class="me-2">
        <n-list-item
          v-for="(product, index) in products"
          :key="index"
          @click="
            orderStore.orders.some((p) => p.id === product.id)
              ? null
              : orderStore.orders.push(product)
          "
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
                <n-text class="fs-4">{{ product.title }}</n-text>
                <n-text class="fs-6" type="success"
                  >S/. {{ product.price.toFixed(2) }}</n-text
                >
              </n-space>
              <n-text
                >Lorem ipsum dolor sit, amet consectetur adipisicing
                elit.</n-text
              >
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
import { defineComponent, ref } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useOrderStore } from "@/store/modules/order";

export default defineComponent({
  name: "CategoriesItems",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const orderStore = useOrderStore();
    const category = route.params.category;
    const listType = ref("list");
    const products = ref([
      {
        id: 0,
        title: "Product 1",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 1,
        title: "Product 2",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 2,
        title: "Product 3",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 3,
        title: "Product 4",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 4,
        title: "Product 5",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 5,
        title: "Product 6",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 6,
        title: "Product 7",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 7,
        title: "Product 8",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 8,
        title: "Product 9",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 9,
        title: "Product 10",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 10,
        title: "Product 11",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 11,
        title: "Product 12",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 12,
        title: "Product 13",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 13,
        title: "Product 14",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 14,
        title: "Product 15",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 15,
        title: "Product 16",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 16,
        title: "Product 17",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 17,
        title: "Product 18",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 18,
        title: "Product 19",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
      {
        id: 19,
        title: "Product 20",
        price: 10.0,
        quantity: 0,
        indications: [],
      },
    ]);

    const handleBack = () => {
      router.push({ name: "ProductCategories" });
    };

    return {
      handleBack,
      listType,
      category,
      products,
      orderStore,
    };
  },
});
</script>

<style>
</style>