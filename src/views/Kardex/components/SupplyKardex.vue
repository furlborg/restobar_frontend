<template>
    <n-modal
        :class="{ 'w-100': genericsStore.device === 'mobile', 'w-75': genericsStore.device === 'tablet', 'w-50': genericsStore.device === 'desktop' }"
        preset="card" :show="props.show" :on-close="() => emit('update:show')">
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

<script setup>
import { ref } from "vue"
import { useGenericsStore } from '@/store/modules/generics'
import { renderIcon } from '@/utils'

const emit = defineEmits(['update:show', 'on-success'])

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    idSupply: {
        type: Number,
        default: 0,
    },
})

const genericsStore = useGenericsStore()
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

const columns = 1 // Esto parece un placeholder, lo mantengo como está.

</script>
