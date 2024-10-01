<template>
  <div>
    <n-card title="Insumos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-space justify="space-around">
          <n-button v-if="userStore.hasPermission('add_supplies_stock')" type="success"
            @click="()=>{newMovement(0); (showModalMovement = true)}" secondary>
            <template #icon>
              <n-icon>
                <v-icon name="hi-solid-arrow-sm-up" />
              </n-icon>
            </template>
            Entrada
          </n-button>
          <n-button v-if="userStore.hasPermission('remove_supplies_stock')" type="error" secondary
            @click="()=>{newMovement(1); (showModalMovement = true)}">
            <template #icon>
              <n-icon>
                <v-icon name="hi-solid-arrow-sm-down" />
              </n-icon>
            </template>
            Salida
          </n-button>
          <n-button v-if="userStore.hasPermission('add_supplies')" type="primary"
            @click="()=>{newSupplies(); (showModal = true)}" secondary>
            <template #icon>
              <n-icon>
                <v-icon name="la-user-plus-solid" />
              </n-icon>
            </template>
            Crear
          </n-button>
        </n-space>
      </template>

      <n-form label-placement="left" style="max-width: 350px; margin-top: -8px; margin-bottom: 12px">
        <n-input placeholder="Buscar" @keydown.enter="listSupplies()" v-model:value="textSearch" round>
          <template #prefix>
            <n-icon style="margin-top: -4px">
              <v-icon name="md-search-round" />
            </n-icon>
          </template>
        </n-input>
      </n-form>

      <n-data-table :columns="tableColumns" :data="supplies" size="small" :scroll-x="900" :loading="isLoadingData" remote :pagination="pagination" />
    </n-card>
    <!-- Customer Modal -->
    <supplies-modal v-model:show="showModal" @on-success="listSupplies()" :items="items" />
    <move-modal v-model:show="showModalMovement" @on-success="listSupplies()" :items="itemsMovement" :type="type" />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { createSuppliesColumns } from "@/utils/constants";
import SuppliesModal from "./components/SuppliesModal.vue";
import { getSupplies, disableSupplies } from "@/api/modules/supplies";
import MoveModal from "./components/MoveModal.vue";
import { useUserStore } from "@/store/modules/user";

export default defineComponent({
  name: "SupplieModal",
  components: {
    SuppliesModal,
    MoveModal,
  },
  setup() {
    const userStore = useUserStore();
    const message = useMessage();
    const dialog = useDialog();
    const showModal = ref(false);
    const showModalMovement = ref(false);
    const itemsUser = ref({});
    const supplies = ref([]);
    const items = reactive({});
    const itemsMovement = reactive({});
    const isLoadingData = ref(false);
    const textSearch = ref("");
    const page = ref(1);
    const totalSize = ref(0);
    const type = ref(0);
    // const linkSearch = ref(null);
    const pagecount = ref(null);
    const pagination = ref({
      previusPage: null,
      offset: 0,
      page: page,
      limit: 15,
      pageCount: pagecount,
      pageSlot: 5,
      suffix: () => {
        return "Total: " + totalSize.value;
      },

      onChange: (page) => {
        pagination.value.page = page;
        listSupplies();
      },
    });

    const newSupplies = () => {
      (items.id = undefined);
        (items.code = undefined);
        (items.name = undefined);
        (items.purchase_price = undefined);
        (items.measureunit = 1);
        (items.branchoffice = 1);
        (items.amount = undefined);
    };
    const editSupplies = (data) => {
      (items.id = data.id);
        (items.code = data.code);
        (items.name = data.name);
        (items.purchase_price = data.purchase_price);
        (items.measureunit = data.measureunit);
        (items.branchoffice = data.branchoffice);
        (items.amount = data.amount);
    };
    const newMovement = (value) => {
      (type.value = value);
        (itemsMovement.supplie = undefined);
        (itemsMovement.type = value);
        (itemsMovement.branchoffice = 1);
        (itemsMovement.concept = undefined);
        (itemsMovement.amount = undefined);
    };

      const listSupplies = () => {
          isLoadingData.value = true;
          const currentPage = pagination.value.page; // Página actual

          // Calcula el offset en función de la página actual
          const offset = (currentPage - 1) * pagination.value.limit;

          let filter = `supplies/?limit=${pagination.value.limit}&offset=${offset}&page=${currentPage}`;

          // Añade el texto de búsqueda si existe
          if(textSearch.value) {
              filter += `&search=${textSearch.value}`;
          }

          getSupplies(filter).then((response) => {
              console.log(response);
              supplies.value = response.data.results;
              PaginationF(response.data?.count); // Actualiza la paginación con el total de elementos
          }).catch((error) => {
              console.log(error);
              message.error("Algo salió mal...");
          }).finally(() => {
              isLoadingData.value = false;
          });
      };

      const PaginationF = (count) => {
          let total = count / 15;
          totalSize.value = count;
          if(total === 0) {
              pagecount.value = 1;
          } else {
              if(total % 1 === 0) {
                  pagecount.value = total;
              } else {
                  total += 1;
                  pagecount.value = Math.trunc(total);
              }
          }
      };

    // const SearchFilter = (val) => {
    //   let search;
    //   if (val) {
    //     search = "?page=" + page.value;
    //     if (linkSearch.value !== null) {
    //       search = linkSearch.value + "page=" + page.value;
    //     }
    //   } else {
    //     page.value = 1;
    //     linkSearch.value = null;
    //
    //     if (textSearch.value !== "") {
    //       search = "?search=" + textSearch.value + "&";
    //       linkSearch.value = search;
    //     }
    //   }
    //   listSupplies(search);
    // };

    onMounted(() => {
      listSupplies();
    });

    const changeState = async (id, state) => {
      const dial = state === false ? dialog.success : dialog.error;
      let titles = state === false ? "Habilitar Insumo" : "Deshabilitar Insumo";
      const button = state === false ? "Habilitar" : "Deshabilitar";

      dial({
        title: titles,
        content: "¿Estas seguro?",
        positiveText: button,
        negativeText: "Cancelar",
        onPositiveClick: async () => {
          disableSupplies(id)
            .then((response) => {
              console.log(response);
              listSupplies();
              message.success("Insumo deshabilitado correctamente.");
            })
            .catch((error) => {
              console.log(error);
              message.error("Algo salió mal...");
            });
        },
      });
    };

    return {
      userStore,
      showModal,
      showModalMovement,
      textSearch,
      isLoadingData,
      listSupplies,
      // SearchFilter,
      newSupplies,
      newMovement,
      type,
      pagination,
      itemsUser,
      items,
      itemsMovement,
      supplies,
      tableColumns: createSuppliesColumns({
        editSupplies(data) {
          editSupplies(data);
          showModal.value = true;
        },
        deleteSupplies(rowData) {
          changeState(rowData.id, rowData.state);
        },
      }),
    };
  },
});
</script>

<style>

</style>