<template>
    <div id="CategoriesList">
        <n-text class="fs-4">Categorías</n-text>
        <n-scrollbar class="mt-2" style="height: 700px;">
            <n-list v-if="listType==='list'" class="me-2">
                <n-list-item v-for="index in 10" :key="index">
                    <template #prefix>
                        <img src="~@/assets/images/category-bg.jpg" alt="" width="75" height="50" />
                    </template>
                    <n-thing>
                        <n-space vertical>
                            <n-space align="center">
                                <router-link class="text-decoration-none" :to="{ name: 'CategoriesItems', params: { category: index}}">
                                    <n-text class="fs-4">Categoria</n-text>
                                </router-link>
                                <n-text class="fs-6" type="success">S/. 10.00</n-text>
                            </n-space>
                            <n-text>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</n-text>
                        </n-space>
                    </n-thing>
                    <template #suffix>
                        <n-button type="info" text>
                            <v-icon name="md-addbox-round" scale="2" />
                        </n-button>
                    </template>
                </n-list-item>
            </n-list>
            <n-grid v-if="listType==='grid'" responsive="screen" cols="4 s:4 m:20 l:20 xl:20 2xl:20" :x-gap="12" :y-gap="12">
                <n-gi :span="4" v-for="index in 10" :key="index">
                    <div class="item-zoom ">
                        <router-link class="text-decoration-none" :to="{ name: 'CategoriesItems', params: { category: index}}">
                            <img src="~@/assets/images/category-bg.jpg" alt="" />
                            <n-text class="position-absolute top-50 start-50 translate-middle fs-2">Categoría</n-text>
                        </router-link>
                    </div>
                </n-gi>
            </n-grid>
        </n-scrollbar>
    </div>
</template>

<script>
import { defineComponent, ref } from "vue"
import {renderIcon} from "@/utils"

export default defineComponent({
    name: "CategoriesList",
    setup() {
        const listType = ref('grid')

        const productOptions = [
            {
                label: 'Editar',
                key: 'edit',
                icon: renderIcon('ri-edit-fill'),
            },
            {
                label: 'Eliminar',
                key: 'delete',
                icon: renderIcon('ri-delete-bin-2-fill'),
            }
        ]

        return {
            listType,
            productOptions,
        }
    }
})
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

/* .item-zoom span {
    text-shadow: 0px 0px 5px white;
} */

.item-zoom:hover img {
	-moz-transform: scale(1.1);
	-webkit-transform: scale(1.1);
	transform: scale(1.1);
	-webkit-filter: grayscale(0%);
    -moz-filter: grayscale(0%);
    filter: grayscale(0%);
}
</style>