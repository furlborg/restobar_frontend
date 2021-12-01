<template>
  <div id="WProducts">
    <n-page-header
      class="border-bottom border-2 border-success p-2"
      @back="$router.push({ name: 'WCategories' })"
    >
      <template #title>
        <n-text class="fs-4">{{ $route.params.category }}</n-text>
      </template>
    </n-page-header>
    <n-list class="m-0 px-2">
      <n-list-item v-for="index in 20" :key="index">
        <n-space vertical>
          <n-space justify="space-between" @click="addProduct(index)">
            <n-text>Product {{ index }}</n-text>
            <n-text>S/. 10.00</n-text>
            <!-- <n-button type="info" @click="findProduct(index)">test</n-button> -->
          </n-space>
          <n-collapse-transition :show="findProduct(index)">
            <n-space justify="space-between">
              <n-button type="info" text>Indicaciones</n-button>
              <n-input-group>
                <n-button
                  type="warning"
                  size="small"
                  @click="decrementQuantity(index)"
                >
                  <v-icon name="md-remove-round" />
                </n-button>
                <n-input
                  :value="productQuantity(index)"
                  style="width: 50px"
                  size="small"
                  placeholder=""
                  readonly
                />
                <n-button
                  type="warning"
                  size="small"
                  @click="incrementQuantity(index)"
                >
                  <v-icon name="md-add-round" />
                </n-button>
              </n-input-group>
            </n-space>
          </n-collapse-transition>
        </n-space>
      </n-list-item>
    </n-list>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "WProducts",
  setup() {
    const showExtra = ref(false);
    const orderList = ref([]);
    const openExtra = () => {
      showExtra.value = true;
    };
    const addProduct = (item) => {
      if (!findProduct(item)) {
        orderList.value.push({
          product: item,
          quantity: 1,
          price: 10.0,
          subtotal: 10.0,
        });
      }
    };
    const findProduct = (item) => {
      return orderList.value.some((val) => val.product === item);
    };
    const productQuantity = (item) => {
      let found = orderList.value.find((val) => val.product === item);
      return found.quantity.toString();
    };
    const incrementQuantity = (item) => {
      orderList.value.map((val) => {
        if (val.product === item) {
          val.quantity++;
        }
      });
    };
    const decrementQuantity = (item) => {
      orderList.value.map((val) => {
        if (val.product === item) {
          val.quantity--;
        }
        if (val.quantity === 0) {
          let index = orderList.value.findIndex((val) => val.product === item);
          orderList.value.splice(index, 1);
        }
      });
    };

    return {
      orderList,
      showExtra,
      openExtra,
      findProduct,
      addProduct,
      productQuantity,
      incrementQuantity,
      decrementQuantity,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>