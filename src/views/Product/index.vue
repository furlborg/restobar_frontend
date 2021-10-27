<template>
  <div id="Product">
      <n-card title="Productos" :segmented="{content:'hard'}" >
            <template #header-extra>
                <n-button type="success" @click=" showModal=true">Agregar</n-button>
            </template>
            <n-space justify="space-between">
                <n-input-group>
                    <n-input placeholder="Buscar..." />
                    <n-button type="primary">
                        <v-icon name="md-search-round" />
                    </n-button>
                </n-input-group>
                <n-radio-group v-model:value="listType" name="listType" size="small">
                    <n-radio-button class="p-0" value="list" key="list">
                        <v-icon class="m-1" name="md-list-round" />
                    </n-radio-button>
                    <n-radio-button class="p-0" value="grid" key="grid">
                        <v-icon class="m-1" name="md-gridview-round" />
                    </n-radio-button>
                </n-radio-group>
            </n-space>
            <n-list v-if="listType==='list'">
                <n-list-item v-for="index in 10" :key="index">
                    <template #prefix>
                        <img src="~@/assets/images/default-food-image.jpg" alt="" width="90" height="90" />
                    </template>
                    <n-thing>
                        <template #header>
                            <n-text class="fs-4">Product</n-text>
                        </template>
                        <template #description>
                            <n-text class="fs-6" type="success">S/. 10.00</n-text>
                        </template>
                        <n-text>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</n-text>
                    </n-thing>
                    <template #suffix>
                        <n-button-group vertical>
                            <n-button type="warning" text>
                                <v-icon name="ri-edit-fill" scale="1.5" />
                            </n-button>
                            <n-button type="error" text>
                                <v-icon name="ri-delete-bin-2-fill" scale="1.5" />
                            </n-button>
                        </n-button-group>
                    </template>
                </n-list-item>
            </n-list>
            <n-grid v-if="listType==='grid'" class="mt-2" responsive="screen" cols="4 s:4 m:12 l:12 xl:24 2xl:24" :x-gap="12" :y-gap="12">
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
            <template #footer>
                <n-pagination :page="1" :page-count="10" />
            </template>
      </n-card>
    <!-- Customer Modal -->
    <product-modal v-model:show="showModal" @update:show="onCloseModal" @on-success="onSuccess" />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue"
import {renderIcon} from "@/utils"
import ProductModal from "./components/ProductModal"

export default defineComponent({
    name: "Product",
    components: {
        ProductModal,
    },
    setup() {
        const listType = ref('list')
        const showModal = ref(false)
        // const idProduct = ref(0)
        // const products = ref([])
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

        const onCloseModal = () => {
            document.title = 'Productos | App'
            // idProduct.value = 0
        }

        const onSuccess = () => {
            showModal.value = false
            onCloseModal()
            // loadProductsData()
        }

        onMounted(() => {
            document.title = 'Productos | App'
        })

        return {
            listType,
            showModal,
            productOptions,
            onCloseModal,
            onSuccess,
            // products,
            // idProduct,
        }
    }
})
</script>

<style>

</style>