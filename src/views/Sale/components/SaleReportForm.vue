<template>
  <n-form>
    <n-form-item label="Fechas">
      <n-date-picker
        type="datetimerange"
        v-model:formatted-value="queryParams.date_range"
        format="yyyy-MM-dd HH:mm:ss"
        :default-time="['00:00:00', '23:59:59']"
        clearable
      />
    </n-form-item>
    <n-form-item label="Tipos Documento">
      <n-space class="w-100" justify="space-around">
        <n-tag
          :checked="queryParams.invoice_types.some((v) => v === 1)"
          @update:checked="(v) => checkInvoices(v, 1)"
          checkable
          >FACTURA</n-tag
        >
        <n-tag
          :checked="queryParams.invoice_types.some((v) => v === 3)"
          @update:checked="(v) => checkInvoices(v, 3)"
          checkable
          >BOLETA</n-tag
        >
        <n-tag
          :checked="queryParams.invoice_types.some((v) => v === 80)"
          @update:checked="(v) => checkInvoices(v, 80)"
          checkable
          >N. VENTA</n-tag
        >
      </n-space>
    </n-form-item>
  </n-form>
</template>

<script>
import { defineComponent, ref, toRef } from "vue";

export default defineComponent({
  name: "SaleReportForm",
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const queryParams = toRef(props, "data");

    const checkInvoices = (v, i) => {
      const index = queryParams.value.invoice_types.findIndex(
        (inv) => inv === i
      );
      if (!v && index >= 0) {
        queryParams.value.invoice_types.splice(index, 1);
      } else if (v) {
        queryParams.value.invoice_types.push(i);
      }
    };

    return {
      queryParams,
      checkInvoices,
    };
  },
});
</script>

<style>
</style>