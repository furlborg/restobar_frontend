<template>
  <n-list class="m-0">
    <n-list-item
      v-for="category in productStore.categories"
      :key="category.id"
      :class="`box small back-${category.id}`"
      @click="
        $router.push({ name: 'WProducts', params: { category: category.id } })
      "
    >
      <!-- <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Ramen.png"
            alt=""
            width="48"
            height="48"
          />
        </template> -->
      <span>{{ category.description }}</span>
    </n-list-item>
    <!-- <router-link :to="{ name: 'WProducts', params: { category: 'Pizzas' } }">
      <n-list-item class="box small back-2">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Pizza.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Pizzas</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Pastas' } }">
      <n-list-item class="box small back-3">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Spaghetti.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Pastas</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Mariscos' } }">
      <n-list-item class="box small back-4">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Sushi.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Mariscos</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Chifa' } }">
      <n-list-item class="box small back-5">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Chopsticks.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Chifa</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Postres' } }">
      <n-list-item class="box small back-6">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Cheesecake.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Postres</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Ensaladas' } }">
      <n-list-item class="box small back-7">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Salad.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Ensaladas</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Refrescos' } }">
      <n-list-item class="box small back-8">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Juice.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Refrescos</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Gaseosas' } }">
      <n-list-item class="box small back-9">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Softdrink.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Gaseosas</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Helados' } }">
      <n-list-item class="box small back-10">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/Ice-Cream.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Helados</span>
      </n-list-item>
    </router-link>
    <router-link :to="{ name: 'WProducts', params: { category: 'Parrillas' } }">
      <n-list-item class="box small back-11">
        <template #prefix>
          <img
            class="ms-4"
            src="~@/assets/icons/food/BBQ.png"
            alt=""
            width="48"
            height="48"
          />
        </template>
        <span>Parrillas</span>
      </n-list-item>
    </router-link> -->
  </n-list>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useProductStore } from "@/store/modules/product";

export default defineComponent({
  name: "Categories",
  setup() {
    const productStore = useProductStore();

    const counter = ref(0);

    onMounted(() => {
      productStore.refreshCategories();
    });

    return {
      productStore,
      counter,
    };
  },
});
</script>

<style lang="scss" scoped>
.back-1 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, Azure);
}
.back-2 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, GhostWhite);
}
.back-3 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, Ivory);
}
.back-4 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, LavenderBlush);
}
.back-5 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, LightCyan);
}
.back-6 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, MintCream);
}
.back-7 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, Linen);
}
.back-8 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, MistyRose);
}
.back-9 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, OldLace);
}
.back-10 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, FloralWhite);
}
.back-11 {
  background: -webkit-linear-gradient(-50deg, WhiteSmoke, HoneyDew);
}
.box {
  height: 116px;
  position: relative;
  width: 50%;
  float: left;

  &.right {
    float: right;
  }
  &.tall {
    height: 232px;
  }
  &.wide {
    width: 100%;
  }
  &.small {
    width: 100%;
    height: 70px;
  }
  &.hero {
    height: 240px;
    width: 100%;

    span {
      font-size: 23px;
    }
  }
  span {
    color: SlateGray;
    font-size: 15px;
    bottom: 0;
    left: 0;
    text-transform: uppercase;
    padding: 25px 25px;
    font-weight: 600;
  }
}
</style>