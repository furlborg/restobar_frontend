<template>
  <n-modal
  :class="{ 'w-100': genericsStore.device === 'mobile', 'w-75': genericsStore.device === 'tablet','w-50': genericsStore.device === 'desktop' }"
  preset="card"
  :show="show"
  :on-close="() => $emit('update:show')"
  >
    <template #header>
        <n-text class="fs-2">Kardex</n-text>
        <n-dropdown trigger="click" :options="options" placement="bottom-end" :show-arrow="true">
                <n-button type="info" text>
                    <v-icon name="md-download-round" />
                </n-button>
        </n-dropdown>
    </template>
    <n-data-table :columns="columns" />
    <template #action>
        <n-space justify="right">
            <n-button-group>
                <n-button>
                    <v-icon name="vi-file-type-excel" />
                    PDF
                </n-button>
                <n-button>
                    <v-icon name="vi-file-type-pdf2" />
                    Excel
                </n-button>
            </n-button-group>
        </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs } from "vue"
import {useGenericsStore} from '@/store/modules/generics'
import {renderIcon} from '@/utils'

export default defineComponent({
    name: 'SupplyKardex',
    emits: [
        'update:show',
        'on-success',
    ],
    props: {
        show : {
            type: Boolean,
            default: false,
        },
        idSupply: {
            type: Number,
            default: 0,
        },
    },
     setup(props, {emit}) {
         const isLoadingData = ref(false)
         const genericsStore = useGenericsStore()
         const {idSupply, show} = toRefs(props)
         const options = ref([
            {
                label: 'PDF',
                key: 'PDF',
                icon: renderIcon('vi-file-type-pdf2')
            },
            {
                label: "Excel",
                key: "Excel",
                icon: renderIcon('vi-file-type-excel')
            },
        ])

         return {
             isLoadingData,
             genericsStore,
             options,
             columns: 1,
         }
     }
})
</script>

<style>

</style>