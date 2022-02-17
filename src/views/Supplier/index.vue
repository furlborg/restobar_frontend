<template>
  <div>
    <n-card title="Proveedores" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button type="primary" @click="newSupplier(), (showModal = true)" secondary>
          <template #icon>
            <n-icon>
              <v-icon name="la-user-plus-solid" />
            </n-icon>
          </template>
          Crear
        </n-button>
      </template>

      <n-form
        label-placement="left"
        style="maxWidth: 350px; margin-top: -8px; margin-bottom: 12px;"
      >
          
        <n-input
          placeholder="Buscar"
          @keydown.enter="SearchFilter()"
          v-model:value="textsearch"
          round>
          <template #prefix>
            <n-icon style="margin-top: -4px;"><v-icon name="md-search-round" /></n-icon>
          </template>
        </n-input>
      </n-form>

      <n-data-table 
        :columns="tableColumns"
        :data="supplier.results" 
        size="small"
        :scroll-x="900"
        :loading="isLoadingData" 
        remote 
        :pagination="pagination" />
    </n-card>
    <!-- Customer Modal -->
    <supplier-modal
      v-model:show="showModal"
      @on-success="listSupplier"
      :items="items"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { createSuppliersColumns } from "@/utils/constants";
import SupplierModal from "./components/SupplierModal.vue";
import { getSupplier, disableSupplier } from "@/api/modules/supplier";

export default defineComponent({
  name: "UserSettings",
  components: {
    SupplierModal,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const showModal = ref(false);
    const showModalPass = ref(false);
    const itemsUser = ref({});
    const supplier = ref([]);
    const items = reactive({});
    const isLoadingData = ref(false);
    const textsearch = ref("");
    const page = ref(1);
    const linksearch = ref(null);
    const pagecount = ref(null);
    const pagination = ref({
      previusPage: null,
      offset: 0,
      page: page,
      pageSize: 15,
      pageCount: pagecount,
      pageSlot: 5,
      suffix: () => {
        return "Total: " + supplier.value.count;
      },

      onChange: (page) => {
        pagination.value.page = page;
        SearchFilter(page);
      },
    });
    const newSupplier = () => {
      (items.id = undefined),
        (items.names = undefined),
        (items.email = undefined),
        (items.doc_type = "1"),
        (items.document = ""),
        (items.representative = undefined),
        (items.phone = undefined),
        (items.address = [{ubigeo: null, address: ""}]);
    };

    const editSupplier = (data) => {
      (items.id = data.id),
        (items.names = data.names),
        (items.email = data.email),
        (items.doc_type = data.doc_type),
        (items.document = data.document),
        (items.representative = data.representative),
        (items.phone = data.phone),
        (items.address = data.address);
    };

    const listSupplier = (search) => {
      isLoadingData.value = true;
      let filter = 'supplier/';
      if (search) {
          filter = 'supplier/' + search;
      }
      getSupplier(filter)
        .then((response) => {
          supplier.value = response.data;
          PaginationF();
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    }

    const PaginationF = () => {
      let total = supplier.value.count / 15;

      if (total == 0) {
        pagecount.value = 1;
      } else {
        if (total % 1 == 0) {
          pagecount.value = total;
        } else {
          total += 1;
          pagecount.value = Math.trunc(total);
        }
      }
    };

    const SearchFilter = (val) => {
      let search;

      if (val) {
        search = "?page=" + page.value;
        if (linksearch.value !== null) {
          search = linksearch.value + "page=" + page.value;
        }
      } else {
        page.value = 1;
        linksearch.value = null;

        if (textsearch.value !== "") {
          search = "?search=" + textsearch.value + "&";
          linksearch.value = search;
        }
      }
      listSupplier(search);
    };

    onMounted(() => {
      listSupplier();
    });

    const changeState = async (id, state) => {
      const dial = state==false? dialog.success: dialog.error;
      let titles = state==false?"Habilitar Provedor" :"Deshabilitar Provedor";
      const button = state==false?"Habilitar":"Deshabilitar";

      dial({
        title: titles,
        content: "¿Estas seguro?",
        positiveText: button,
        negativeText: "Cancelar",
        onPositiveClick: async () => {
          disableSupplier(id)
          .then((response) => {
            listSupplier();
            message.success( "Provedor deshabilitado correctamente.");
          })
          .catch((error) => {
            message.error("Algo salió mal...");
          })
        },
      })
    };

    return {
      showModal,
      showModalPass,
      textsearch,
      isLoadingData,
      listSupplier,
      SearchFilter,
      newSupplier,
      pagination,
      itemsUser,
      items,
      supplier,
      tableColumns: createSuppliersColumns({
        editSupplier(data) {
          editSupplier(data);
          showModal.value = true;
        },
        deleteSupplier(rowData) {
          changeState(rowData.id, rowData.state)
        }
      }),
    };
  },
});
</script>

<style>
</style>