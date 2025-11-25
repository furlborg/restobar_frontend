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
                                width="30"
                                height="30"
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
                                    <n-text class="category-text">{{ category.description }}</n-text>
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
                    <!-- <div class="item-zoom">
                        <router-link class="text-decoration-none" :to="{ name: 'CategoriesItems', params: { category: category.id } }">
                            <img src="~@/assets/images/category-bg.jpg" alt=""/>

                            <n-text
                                class="category-text"
                                :style="{ fontSize: category.text_size + 'px' }"
                            >
                                {{ category.description }}
                            </n-text>
                        </router-link>
                    </div> -->
                    <div class="item-zoom">
                        <router-link
                            class="text-decoration-none"
                            :to="{ name: 'CategoriesItems', params: { category: category.id } }"
                        >
                            <div class="category-container">

                            <!-- imagen si useImage === true -->
                            <img
                                v-if="category_settings.use_image"
                                src="~@/assets/images/category-bg.jpg"
                                alt=""
                                class="category-image"
                            />

                            <!-- cuadro si useImage === false -->
                            <div v-else class="fallback-box"></div>

                            <!-- texto centrado -->
                            <n-text
                                class="category-text"
                                :style="{ fontSize: category_settings.area_text_size + 'px' }"
                            >
                                {{ category.description }}
                            </n-text>

                            </div>
                        </router-link>
                    </div>

                </n-gi>
            </n-grid>
        </n-scrollbar>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { renderIcon } from "@/utils";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";

export default defineComponent({
    name: "CategoriesList",
    setup() {
        const productStore = useProductStore();
        const listType = ref("grid");

        const settingsStore = useSettingsStore();
        const category_settings = computed(() => ({
        use_image: false,
        area_text_size: 16,
        width_image_product: 35,
        height_image_product: 35,
        ...(settingsStore.business_settings?.category || {})
        }));

        onMounted(async() => {
            // console.log("mounted");
            await productStore.tableCategories();
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
            productStore,
            category_settings
        };
    }
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