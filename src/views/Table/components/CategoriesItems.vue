<template>
    <div id="CategoriesItems">
        <n-space class="mb-2" align="end" justify="space-between">
            <n-breadcrumb separator="⏵">
                <n-breadcrumb-item>
                    <router-link :to="{ name: 'ProductCategories' }">
                        <n-text class="fs-4">Categorías</n-text>
                    </router-link>
                </n-breadcrumb-item>
                <n-breadcrumb-item v-if="$route.params.category">{{$route.params.category}}</n-breadcrumb-item>
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
        <n-scrollbar style="max-height: 700px;">
            <n-list v-if="listType==='list'" class="me-2">
                <n-list-item v-for="index in 10" :key="index">
                    <template #prefix>
                        <img src="~@/assets/images/default-food-image.jpg" alt="" width="75" height="75" />
                    </template>
                    <n-thing>
                        <n-space vertical>
                            <n-space align="center">
                                <n-text class="fs-4">Product</n-text>
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
            <n-grid v-if="listType==='grid'" responsive="screen" cols="5 s:5 m:10 l:10 xl:24 2xl:24" :x-gap="12" :y-gap="12">
                <n-gi :span="4" v-for="index in 10" :key="index">
                    <n-card>
                        <template #header>
                            <n-h2 class="mb-0">Product</n-h2>
                            <n-text type="success">S/. 10.00</n-text>
                        </template>
                        <template #header-extra>
                            <n-dropdown :options="productOptions" placement="left-start" size="small">
                                <n-button text size="small">
                                    <v-icon name="bi-three-dots-vertical" />
                                </n-button>
                            </n-dropdown>
                        </template>
                        <template #cover>
                            <img src="~@/assets/images/default-food-image.jpg" alt="" />
                        </template>
                        <n-text>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</n-text>
                    </n-card>
                </n-gi>
            </n-grid>
        </n-scrollbar>
    </div>
</template>

<script>
import { defineComponent, ref } from "vue"
import {useRoute} from "vue-router"
import { useRouter } from "vue-router"

export default defineComponent({
    name: "CategoriesItems",
    setup() {
        const route = useRoute()
        const router = useRouter()
        const category = route.params.category
        const listType = ref('list')

        const handleBack = () => {
            router.push({ name: "ProductCategories" })
        }

        return {
            handleBack,
            listType,
            category,
        }
    }
})
</script>

<style>

</style>