<template>
  <n-card title="Clientes" :bordered="false" :segmented="{ content: 'hard' }">
    <template #header-extra>
      <n-button
        :disabled="isTableLoading"
        type="primary"
        @click="showModal = true"
        secondary
      >
        <template #icon>
          <n-icon>
            <v-icon name="la-user-plus-solid" />
          </n-icon>
        </template>
        Nuevo
      </n-button>
    </template>
    <n-space justify="space-between">
      <n-button
        type="info"
        text
        @click="
          showFilters === false ? (showFilters = true) : (showFilters = false)
        "
      >
        <v-icon name="md-filteralt-round" />
        {{ showFilters ? "Ocultar Filtros" : "Mostrar filtros" }}
      </n-button>
      <n-button
        type="info"
        :disabled="isTableLoading"
        text
        @click="refreshTable"
      >
        <v-icon name="hi-solid-refresh" />
        Recargar
      </n-button>
    </n-space>
    <n-collapse-transition class="mt-2" :show="showFilters">
      <!-- Search Customer Form -->
      <n-form>
        <n-grid
          responsive="screen"
          cols="6 s:6 m:12 l:12 xl:24 2xl:24"
          :x-gap="12"
        >
          <n-form-item-gi label="Tipo Documento" :span="3">
            <n-select
              v-model:value="searchParams.doc_type"
              :options="documentOptions"
              placeholder=""
              clearable
            />
          </n-form-item-gi>
          <n-form-item-gi label="Nº Documento" :span="3">
            <n-input v-model:value="searchParams.doc_num" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi label="Nombre" :span="6">
            <n-input v-model:value="searchParams.names" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi label="Email" :span="6">
            <n-input v-model:value="searchParams.email" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi label="Celular" :span="3">
            <n-input-number
              v-model:value="searchParams.phone"
              :show-button="false"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi :span="3">
            <n-button type="primary" @click="performSearch" secondary
              >Buscar</n-button
            >
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-collapse-transition>
    <!-- Customer Data Table -->
    <n-data-table
      class="mt-2"
      :columns="tableColumns"
      :data="customers"
      :pagination="customers.length > 10 ? pagination : {}"
      :loading="isTableLoading"
      :scroll-x="1500"
      remote
    />
    <!-- Customer Modal -->
    <customer-modal
      v-model:show="showModal"
      :id-customer="idCustomer"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
  </n-card>
</template>

<script>
import { defineComponent, onMounted, ref } from "vue";
import { documentOptions, createCustomerColumns } from "@/utils/constants";
import { useMessage, useDialog } from "naive-ui";
import {
  getCustomers,
  getCustomersByPageNumber,
  searchCustomers,
  disableCustomer,
} from "@/api/modules/customer";
import CustomerModal from "./components/CustomerModal";

export default defineComponent({
  name: "Customer",
  components: {
    CustomerModal,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const isTableLoading = ref(false);
    const showFilters = ref(false);
    const showModal = ref(false);
    const idCustomer = ref(0);
    const customers = ref([]);
    const searchParams = ref({
      doc_type: null,
      doc_num: null,
      names: null,
      address: null,
      email: null,
      phone: null,
    });
    const pagination = ref({
      pageSearchParams: null,
      previusPage: null,
      total: 0,
      offset: 0,
      page: 1,
      pageSlot: 6,
      pageCount: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 25, 50, 100],
      onChange: (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        pagination.value.offset = --page * pagination.value.pageSize;
        getCustomersByPageNumber(
          pagination.value.pageSearchParams,
          pagination.value.pageSize,
          pagination.value.offset
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (Number(response.data.count) % pagination.value.pageSize !== 0) {
              ++pagination.value.pageCount;
            }
            customers.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isTableLoading.value = false;
          });
      },
      onPageSizeChange: (pageSize) => {
        isTableLoading.value = true;
        pagination.value.offset = 0;
        pagination.value.page = 1;
        pagination.value.pageSize = pageSize;
        getCustomersByPageNumber(
          pagination.value.pageSearchParams,
          pageSize,
          pagination.value.offset
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (Number(response.data.count) % pagination.value.pageSize !== 0) {
              ++pagination.value.pageCount;
            }
            customers.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isTableLoading.value = false;
          });
      },
    });

    const loadCustomersData = () => {
      isTableLoading.value = true;
      pagination.value.offset = 0;
      pagination.value.page = 1;
      getCustomers()
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (Number(response.data.count) % pagination.value.pageSize !== 0) {
            ++pagination.value.pageCount;
          }
          customers.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    const performSearch = () => {
      isTableLoading.value = true;
      pagination.value.pageSearchParams = searchParams.value;
      pagination.value.offset = 0;
      pagination.value.page = 1;
      searchCustomers(
        pagination.value.pageSearchParams,
        pagination.value.pageSize,
        pagination.value.offset
      )
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (Number(response.data.count) % pagination.value.pageSize !== 0) {
            ++pagination.value.pageCount;
          }
          customers.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    const performDisableCustomer = (id) => {
      isTableLoading.value = true;
      disableCustomer(id)
        .then((response) => {
          if (response.status === 202) {
            message.success("Cliente deshabilitado con éxito!");
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          isTableLoading.value = false;
          refreshTable();
        });
    };

    const refreshTable = () => {
      pagination.value.pageSearchParams = null;
      loadCustomersData();
    };

    const onCloseModal = () => {
      document.title = "Clientes | App";
      idCustomer.value = 0;
    };

    const onSuccess = () => {
      showModal.value = false;
      onCloseModal();
      loadCustomersData();
    };

    onMounted(() => {
      document.title = "Clientes | App";
      loadCustomersData();
    });

    return {
      isTableLoading,
      showModal,
      showFilters,
      pagination,
      customers,
      searchParams,
      idCustomer,
      performSearch,
      refreshTable,
      onCloseModal,
      onSuccess,
      documentOptions,
      tableColumns: createCustomerColumns({
        editCustomer(rowData) {
          showModal.value = true;
          idCustomer.value = rowData.id;
        },
        deleteCustomer(rowData) {
          dialog.error({
            title: "Deshabilitando cliente",
            content: "¿Está seguro?",
            positiveText: "Sí",
            onPositiveClick: () => {
              performDisableCustomer(rowData.id);
            },
          });
        },
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
</style>