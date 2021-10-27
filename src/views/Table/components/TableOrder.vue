<template>
  <div id="TableOrder">
    <n-page-header class="mb-2" @back="handleBack">
        <template #title>
            <n-text class="fs-2">Mesa {{table}}</n-text>
        </template>
    </n-page-header>
    <n-card>
        <n-grid responsive="screen" cols="1 s:1 m:3 l:3 xl:3 2xl:3" :x-gap="12">
            <n-gi :span="2">
                <router-view />
            </n-gi>
            <n-gi span="1">
                <n-card class="h-100" title="Pedidos" :bordered="false" embedded>
                    <n-table>
                        <thead>
                            <tr>
                                <th class="bg-white" width="25%">Cantidad</th>
                                <th class="bg-white" width="50%">Producto</th>
                                <th class="bg-white" width="25%">SubTotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th class="bg-white">
                                    <n-input-number class="border-top-0" :value="1" />
                                </th>
                                <th class="bg-white">Product</th>
                                <th class="bg-white">S/. 10.00</th>
                            </tr>
                            <tr>
                                <th class="bg-white">
                                    <n-input-number class="border-top-0" :value="3" />
                                </th>
                                <th class="bg-white">Product</th>
                                <th class="bg-white">S/. 30.00</th>
                            </tr>
                            <tr>
                                <th class="bg-white">
                                    <n-input-number class="border-top-0" :value="2" />
                                </th>
                                <th class="bg-white">Product</th>
                                <th class="bg-white">S/. 20.00</th>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th class="bg-white" colspan="2">
                                    <router-link class="text-decoration-none" :to="{ name: 'TablePayment', params: { table: $route.params.table } }">
                                        <n-button type="success" text block>
                                            <v-icon class="me-2" name="gi-money-stack" scale="2" />
                                            <span class="fs-4">Cobrar</span>
                                        </n-button>
                                    </router-link>
                                </th>
                                <!-- <th class="bg-white"><n-space justify="end">Total:</n-space></th> -->
                                <th class="bg-white fs-4">S/. 50.00</th>
                            </tr>
                        </tfoot>
                    </n-table>
                </n-card>
            </n-gi>
        </n-grid>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue"
import {useRoute} from "vue-router"
import { useRouter } from "vue-router"
import {renderIcon} from "@/utils"

export default defineComponent({
    name: "TableOrder",
    setup() {
        const route = useRoute()
        const router = useRouter()
        const table = route.params.table
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

        const handleBack = () => {
            router.push({ name: "TableHome" })
        }

        return {
            table,
            handleBack,
            listType,
            productOptions,
        }
    }
})
</script>

<style lang="scss" scoped>
.slide-enter-active,
.slide-leave-active {
    transition: opacity 1s, transform 1s;
}

.slide-enter,
.slide-leave-to {
    opacity: 0;
    transform: translateX(-30%);
}
</style>