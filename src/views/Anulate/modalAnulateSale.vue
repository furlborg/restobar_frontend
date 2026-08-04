<template>
    <n-modal :show="props.data?.show" :mask-closable="false" preset="card" title="Vista de ventas anuladas"
        :style="{ width: '90%', maxWidth: '1000px' }"
        @esc="closeModal()" @close="closeModal()">
        <div class="mb-3">
            <div v-if="props.data?.details?.null_reason" class="px-3 py-2 mb-3 rounded" style="background-color: #fff1f0; border: 1px solid #ffa39e;">
                <n-space align="start" :wrap="false" :size="12">
                    <v-icon name="md-cancel-round" color="#cf1322" size="20" class="mt-1" />
                    <div>
                        <n-text style="color: #cf1322; font-size: 14px;">
                            <strong style="font-weight: 600;">Motivo de anulación:</strong> {{ props.data.details.null_reason }}
                        </n-text>
                        <div v-if="props.data?.details?.modified" class="mt-1">
                            <n-text style="color: #cf1322; opacity: 0.8; font-size: 12px;">
                                <v-icon name="md-accesstime-round" size="14" style="vertical-align: -2px; margin-right: 2px;" />
                                {{ new Date(props.data.details.modified).toLocaleDateString('es-ES') }} a las {{ new Date(props.data.details.modified).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) }}
                            </n-text>
                        </div>
                    </div>
                </n-space>
            </div>

            <n-data-table 
                :columns="tableColumns" 
                :data="dataTable" 
                striped 
                max-height="calc(100vh - 350px)" 
                scroll-x="100%"
                size="small"
                style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);" 
            />
        </div>
    </n-modal>
</template>
<script setup>
import { watch, ref } from "vue";
import { useGenericsStore } from "@/store/modules/generics";

const props = defineProps({ data: { type: Object, default: () => { } } });
const emit = defineEmits(['update:show']);
const dataTable = ref([]);
const genericsStore = useGenericsStore();

watch(props, () => {
    if (props.data?.show) {
        dataTable.value = JSON.parse(props.data.details.json_sale).items;
    }
});

const tableColumns = [
    { title: "Cant.", key: "cantidad", width: 70, align: "center" },
    { title: "Descripción", key: "descripcion", width: 200, align: "center" },
    { title: "P. Unit.", width: 100, align: "center", render(row) { return `S/. ${parseFloat(row?.["valor_unitario"]).toFixed(2)}`; } },
    { title: "Total", width: 100, align: "center", render(row) { return `S/. ${parseFloat(row?.['total_item']).toFixed(2)}`; } }
];

const closeModal = () => {
    emit('update:show', false);
}

</script>
