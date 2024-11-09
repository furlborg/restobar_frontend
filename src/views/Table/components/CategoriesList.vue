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
                    :x-gap="10"
                    :y-gap="10"
            >
                <n-gi :span="5" v-for="(category, index) in productStore.categories" :key="index">
                    <router-link class="text-decoration-none" :to="{ name: 'CategoriesItems', params: { category: category.id } }">
                        <div class="fixed-size-container">
                            <div class="item-zoom">
                                <!--                                 <img src="~@/assets/images/category-bg.jpg" alt=""/>-->
                                <n-text class="text-overlay">{{ category.description }}</n-text>
                            </div>
                        </div>
                    </router-link>
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

.fixed-size-container {
  width: 100%;
  height: 180px !important;
  position: relative;
  background: #d7dadc;
  border: #0a58ca 1px solid;
}

.text-overlay {
  font-size: 21px;
  font-weight: 900;
  color: #000;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
</style>