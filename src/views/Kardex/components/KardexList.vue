<template>
  <div>
    <n-space justify="space-between" class="mb-2">
      <n-input-group>
        <n-input size="small" v-model:value="search" placeholder @keypress.enter="performSearch" />
        <n-button size="small" type="primary" @click="performSearch" secondary>
          <v-icon name="md-search-round" />
        </n-button>
      </n-input-group>
      <n-radio-group size="small" :value="$route.params.list" name="list" :disabled="loading"
        @update:value="handleList">
        <n-radio-button key="products" value="products">Productos</n-radio-button>
        <n-radio-button key="supplies" value="supplies">Insumos</n-radio-button>
      </n-radio-group>
      <n-button type="info" size="small" secondary @click="refreshTable">
        <v-icon name="hi-solid-refresh" />
      </n-button>
    </n-space>
    <n-drawer :show="!!modalData" :to="genericsStore.device !== 'mobile' ? '.n-data-table-wrapper' : 'body'"
      :show-mask="false" :mask-closable="false" :default-width="genericsStore.device !== 'mobile' ? 350 : '100%'"
      @update:show="(v) => !v ? modalData = null : null">
      <n-drawer-content id="drawer-content" style="overflow: hidden" v-if="!!modalData" :title="modalData.name"
        closable>
        <n-form-item label="Cantidad">
          <n-input-number v-model:value="movement.amount" :min="0" class="w-100" placeholder="" />
        </n-form-item>
        <n-space vertical>
          <n-button type="info" secondary block :disabled="!movement.amount"
            @click="movement.concept_type = '0', showConfirm=true">Ingreso
          </n-button>
          <n-button type="error" secondary block :disabled="!movement.amount || !Number(modalData.amount)>0"
            @click="movement.concept_type = '1', showConfirm=true">Egreso
          </n-button>
        </n-space>
        <n-drawer v-model:show="showConfirm" to="#drawer-content" placement="bottom" height="75">
          <n-drawer-content body-content-style="padding: 0">
            <n-button class="h-100 fs-4" type="success" :loading="loading" :disabled="loading" secondary block
              @click="performUpdateKardex">Confirmar
            </n-button>
          </n-drawer-content>
        </n-drawer>
      </n-drawer-content>
    </n-drawer>
    <n-data-table id="KardexTable" :row-props="rowClick" style="height: 675px; overflow: hidden;" :columns="columns"
      :row-class-name="handleRow" :data="data" :pagination="pagination" :loading="loading" flex-height remote />
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useRoute, useRouter } from "vue-router";
import { createProductKardexColumns } from "@/utils/constants";
import { useGenericsStore } from "@/store/modules/generics";
import { listKardexBy, listKardexByPage, updateKardexBy } from "@/api/modules/kardex";

export default defineComponent({
  name: "KardexList",
  setup() {
    const route = useRoute()
    const router = useRouter()
    const message = useMessage()
    const list = computed(() => route.params.list)
    const genericsStore = useGenericsStore();

    const loading = ref(false)
    const data = ref([])
    const search = ref('')
    const modalData = ref(null)

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
      search.value = ''
      pagination.value.search = ''
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

    const rowClick = (row) => {
      return {
        onClick: () => {
          modalData.value = row;
          showConfirm.value = false
          movement.value = {
            amount: 0,
            concept_type: undefined,
          }
        }
      }
    }

    const showConfirm = ref(false)

    const movement = ref({
      amount: 0,
      concept_type: undefined,
    })

    const performUpdateKardex = async () => {
      loading.value = true
      await updateKardexBy(list.value, modalData.value.id, movement.value)
        .then(response => {
          if (response.status === 202) {
            message.success('Registro exitoso!')
            performSearch()
          }
          showConfirm.value = false
          modalData.value = null
        })
        .catch(error => {
          if (error.response.status === 400) {
            for (const value in error.response.data) {
              message.error(`Cantidad: ${error.response.data[`${value}`][0]}`);
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
          loading.value = false;
        })
    }

    const handleList = async (v) => {
      modalData.value = null
      movement.value = {
        amount: 0,
        concept_type: undefined,
      }
      await router.push({ name: 'KardexList', params: { list: v } })
      loadItems()
    }

    const handleRow = (row) => {
      return !!modalData.value && row.id === modalData.value.id ? 'current-row' : undefined
    }

    return {
      genericsStore,
      showConfirm,
      modalData,
      rowClick,
      search,
      pagination,
      loading,
      data,
      movement,
      loadItems,
      handleRow,
      handleList,
      refreshTable,
      performSearch,
      performUpdateKardex,
      columns: createProductKardexColumns(),
    };
  },
});
</script>

<style lang="scss">
.current-row {
  td {
    background-color: AliceBlue !important;
  }
}
</style>