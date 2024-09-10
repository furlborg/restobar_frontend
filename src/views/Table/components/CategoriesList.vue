<template>
    <div id="CategoriesList">
        <n-text class="fs-4">Categorías</n-text>
        <n-scrollbar class="mt-2" style="height: 700px">
            <n-list v-if="listType === 'list'" class="me-2">
                <n-list-item
                        v-for="(category, index) in productStore.categories"
                        :key="index"
                >
                    <template #prefix>
                        <img
                                src="~@/assets/images/category-bg.jpg"
                                alt=""
                                width="75"
                                height="50"
                        />
                    </template>
                    <n-thing>
                        <n-space vertical>
                            <n-space align="center">
                                <router-link
                                        class="text-decoration-none"
                                        :to="{
                    name: 'CategoriesItems',
                    params: { category: category.id },
                  }"
                                >
                                    <n-text class="fs-4">{{ category.description }}</n-text>
                                </router-link>
                                <n-text class="fs-6" type="success">S/. 10.00</n-text>
                            </n-space>
                            <n-text
                            >Lorem ipsum dolor sit, amet consectetur adipisicing
                                elit.
                            </n-text
                            >
                        </n-space>
                    </n-thing>
                    <template #suffix>
                        <n-button type="info" text>
                            <v-icon name="md-addbox-round" scale="2"/>
                        </n-button>
                    </template>
                </n-list-item>
            </n-list>
            <n-grid
                    v-if="listType === 'grid'"
                    responsive="screen"
                    cols="8 xs:8 s:12 m:12 l:16 xl:20 2xl:20"
                    :x-gap="5"
                    :y-gap="5"
            >
                <n-gi :span="4" v-for="(category, index) in productStore.categories" :key="index">
                    <div class="item-zoom">
                        <router-link class="text-decoration-none" :to="{ name: 'CategoriesItems', params: { category: category.id } }">
                            <img src="~@/assets/images/category-bg.jpg" alt=""/>

                            <n-text style="font-size: 21px; font-weight: 900; text-align: center; color: #000; top: 40%; left: 45%"
                                    class="position-absolute translate-middle"
                            >{{ category.description }}
                            </n-text>
                        </router-link>
                    </div>
                </n-gi>
            </n-grid>
        </n-scrollbar>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { renderIcon } from "@/utils";
import { useProductStore } from "@/store/modules/product";

export default defineComponent({
    name: "CategoriesList",
    setup() {
        const productStore = useProductStore();
        const listType = ref("grid");

        onMounted(async() => {
            await productStore.refreshCategories();
        });

        const productOptions = [
            {
                label: "Editar",
                key: "edit",
                icon: renderIcon("ri-edit-fill")
            },
            {
                label: "Eliminar",
                key: "delete",
                icon: renderIcon("ri-delete-bin-2-fill")
            }
        ];

        return {
            listType,
            productOptions,
            productStore
        };
    }
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