<template>
  <div id="GeneralSettings">
    <n-page-header class="mb-2" @back="handleBack">
        <template #title>
            <n-h1 class="m-0">General Settings</n-h1>
        </template>
    </n-page-header>
    <n-card>
        <n-tabs type="card">
            <n-tab-pane name="tables" tab="Mesas">
                <n-card title="Editar Mesas" :bordered="false" embedded>
                    <n-select class="mb-2" v-model:value="area" :consistent-menu-width="true" :options="areaOptions"/>
                    <n-grid responsive="screen" cols="2 s:6 m:10 l:20 xl:24 2xl:24" :x-gap="12" :y-gap="12">
                        <n-gi :span="2">
                            <n-button class="w-100 h-100" type="success" dashed>
                                <v-icon name="md-add-round" scale="2"/>
                            </n-button>
                        </n-gi>
                        <n-gi v-for="table in tables" :key="table.id" :span="2">
                            <n-card :bordered="false" hoverable>
                                <n-space align="center" vertical>
                                    <n-button class="position-absolute top-0 end-0 m-1" text>
                                        <v-icon name="bi-three-dots" scale="1.25" />
                                    </n-button>
                                    <v-icon name="gi-table" scale="3"/>
                                    <n-text>{{table.id}}</n-text>
                                </n-space>
                            </n-card>
                        </n-gi>
                    </n-grid>
                </n-card>
            </n-tab-pane>
        </n-tabs>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from "vue"
import { useRouter } from "vue-router"
import {useTableStore} from '@/store/modules/table'

export default defineComponent({
    name: "GeneralSettings",
    setup() {
        const router = useRouter()
        const tableStore = useTableStore()
        const area = ref(1)
        const areaOptions = computed(() => {
            return tableStore.getAreasOptions
        })
        const tables = computed(() => {
            let a = tableStore.areas.find(a => (a.id == area.value))
            if (a) {
                return a.tables
            }
            return []
        })

        const handleBack = () => {
            router.push({ name: "HomeSettings" })
        }

        return {
            handleBack,
            areaOptions,
            area,
            tables,
        }
    }
})
</script>

<style>

</style>