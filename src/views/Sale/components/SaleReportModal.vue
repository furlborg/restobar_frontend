<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    title="Reporte Ventas"
    preset="card"
    :segmented="{ content: 'hard' }"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
  >
    <sale-report-form ref="saleReportForm" :data="queryParams" />
    <template #action>
      <n-space justify="end">
        <n-button
          type="info"
          secondary
          :disabled="
            !queryParams.date_range || !queryParams.invoice_types.length
          "
          @click="generateReport"
          >Generar</n-button
        >
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { getExcelReport } from "@/api/modules/tills";
import SaleReportForm from "./SaleReportForm.vue";
import format from "date-fns/format";

export default defineComponent({
  name: "SaleReportModal",
  components: {
    SaleReportForm,
  },
  props: {
    show: {
      type: Boolean,
    },
  },
  setup() {
    const genericsStore = useGenericsStore();
    const message = useMessage();

    const queryParams = ref({
      date_range: null,
      invoice_types: [1, 3],
    });

    const saleReportForm = ref(null);

    const generateReport = async () => {
      await getExcelReport(null, "sales_documents", queryParams.value)
        .then((response) => {
          if (response.status === 200) {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
              "download",
              `Reporte Contable ${format(
                new Date(Date.now()),
                "yyyy-MM-dd"
              )}.xlsx`
            );
            document.body.appendChild(link);
            link.click();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal");
        });
    };

    return {
      genericsStore,
      saleReportForm,
      queryParams,
      generateReport,
    };
  },
});
</script>