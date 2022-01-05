<template>
  <n-card title="Kardex General">
    <template #header-extra>
      <n-date-picker type="daterange" size="small" clearable />
      <n-dropdown
        trigger="click"
        :options="options"
        placement="bottom-end"
        :show-arrow="true"
      >
        <n-button class="ms-2" type="info" size="small">
          <v-icon name="md-download-round" />
        </n-button>
      </n-dropdown>
    </template>
    <n-data-table
      style="height: 675px"
      :columns="columns"
      :pagination="pagination"
      flex-height
    />
  </n-card>
</template>

<script>
import { defineComponent, ref } from "vue";
import { createKardexListColumns } from "@/utils/constants";
import { renderIcon } from "@/utils";

export default defineComponent({
  name: "KardexList",
  setup() {
    const pagination = ref({});

    const options = ref([
      {
        label: "PDF",
        key: "PDF",
        icon: renderIcon("vi-file-type-pdf2"),
      },
      {
        label: "Excel",
        key: "Excel",
        icon: renderIcon("vi-file-type-excel"),
      },
    ]);

    return {
      pagination,
      options,
      columns: createKardexListColumns(),
    };
  },
});
</script>

<style>
</style>