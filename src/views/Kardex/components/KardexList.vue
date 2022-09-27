<template>
  <div>
    <n-space justify="space-between" class="mb-2">
      <n-input-group>
        <n-input v-model:value="search" placeholder @keypress.enter="performSearch" />
        <n-button type="primary" @click="performSearch" secondary>
          <v-icon name="md-search-round" />
        </n-button>
      </n-input-group>
      <n-radio-group size="small" :value="$route.params.list" name="list" :disabled="loading"
        @update:value="async (v) => (await $router.push({ name: 'KardexList', params: { list: v } }), loadItems())">
        <n-radio-button key="products" value="products">Productos</n-radio-button>
        <n-radio-button key="supplies" value="supplies">Insumos</n-radio-button>
      </n-radio-group>
      <n-button type="info" size="small" secondary @click="refreshTable">
        <v-icon name="hi-solid-refresh" />
      </n-button>
    </n-space>
    <n-data-table style="height: 675px" :columns="columns" :data="data" :pagination="pagination" :loading="loading"
      flex-height remote />
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useRoute } from "vue-router";
import { createProductKardexColumns } from "@/utils/constants";
import { listKardexBy, listKardexByPage } from "@/api/modules/kardex"

export default defineComponent({
  name: "KardexList",
  setup() {
    const route = useRoute()
    const message = useMessage()
    const list = computed(() => {
      return route.params.list
    })

    const loading = ref(false)
    const data = ref([])
    const search = ref('')

    const pagination = ref({
      search: null,
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize: 20,
      showSizePicker: true,
      pageSizes: [20, 50, 100],
      onChange: async (page) => {
        loading.value = true;
        pagination.value.page = page;
        await listKardexByPage(
          list.value,
          pagination.value.search,
          pagination.value.page,
          pagination.value.pageSize
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
              ++pagination.value.pageCount;
            }
            data.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            loading.value = false;
          });
      },
      onPageSizeChange: async (pageSize) => {
        loading.value = true;
        pagination.value.pageSize = pageSize;
        await listKardexByPage(
          list.value,
          pagination.value.search,
          pagination.value.page,
          pagination.value.pageSize
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
              ++pagination.value.pageCount;
            }
            data.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            loading.value = false;
          });
      },
    });

    onMounted(async () => {
      await loadItems()
    })

    const loadItems = async () => {
      loading.value = true
      await listKardexBy(list.value)
        .then(response => {
          if (response.status === 200) {
            data.value = response.data.results
          }
        })
        .catch(error => {
          console.error(error)
          message.error("Algo salió mal...")
        })
        .finally(() => {
          loading.value = false
        })
    }

    const refreshTable = async () => {
      await loadItems()
    }

    const performSearch = async () => {
      loading.value = true;
      pagination.value.search = search.value
      pagination.value.page = 1
      await listKardexByPage(
        list.value,
        pagination.value.search,
        pagination.value.page,
        pagination.value.pageSize
      )
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
          ) {
            ++pagination.value.pageCount;
          }
          data.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    }

    return {
      search,
      pagination,
      loading,
      data,
      loadItems,
      refreshTable,
      performSearch,
      columns: createProductKardexColumns(),
    };
  },
});
</script>

<style>

</style>