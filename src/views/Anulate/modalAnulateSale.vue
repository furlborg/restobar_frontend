<script setup>
import { watch, ref } from "vue";
import { useGenericsStore } from "@/store/modules/generics";

const props = defineProps({ data: { type: Object, default: () => { } } });
const dataTable = ref([]);
const genericsStore = useGenericsStore();

watch(props, () => {
    if(props.data?.show) {
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
    props.data.show = false;
}

</script>

<template>
    <n-modal :show="props.data?.show" :mask-closable="false" preset="card" title="Vista de ventas anuladas"
             :class="{ 'w-100': genericsStore.device === 'mobile', 'w-75': genericsStore.device === 'tablet', 'w-50': genericsStore.device === 'desktop'}"
             @esc="closeModal()" @close="closeModal()">
        <n-data-table :columns="tableColumns" :data="dataTable" striped max-height="calc(100vh - 350px)" scroll-x="100%" size="small"/>
    </n-modal>
</template>
