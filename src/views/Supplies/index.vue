<template>
  <div>
    <n-card title="Insumos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-space justify="space-around">
          <n-button v-if="userStore.hasPermission('add_supplies_stock')" type="success"
            @click="newMovement(0), (showModalMovement = true)" secondary>
            <template #icon>
              <n-icon>
                <v-icon name="hi-solid-arrow-sm-up" />
              </n-icon>
            </template>
            Entrada
          </n-button>
          <n-button v-if="userStore.hasPermission('remove_supplies_stock')" type="error" secondary
            @click="newMovement(1), (showModalMovement = true)">
            <template #icon>
              <n-icon>
                <v-icon name="hi-solid-arrow-sm-down" />
              </n-icon>
            </template>
            Salida
          </n-button>
          <n-button v-if="userStore.hasPermission('add_supplies')" type="primary"
            @click="newSupplies(), (showModal = true)" secondary>
            <template #icon>
              <n-icon>
                <v-icon name="la-user-plus-solid" />
              </n-icon>
            </template>
            Crear
          </n-button>
        </n-space>
      </template>

      <n-form label-placement="left" style="maxwidth: 350px; margin-top: -8px; margin-bottom: 12px">
        <n-input placeholder="Buscar" @keyup.enter="listSupplies()" v-model:value="textSearch" round>
          <template #prefix>
            <n-icon style="margin-top: -4px">
              <v-icon name="md-search-round" />
            </n-icon>
          </template>
        </n-input>
      </n-form>

      <!-- Nuevo: checkbox para mostrar deshabilitados -->
      <n-space align="center" style="margin: -8px 0 12px 0">
        <n-checkbox v-model:checked="showDisabled" @update:checked="listSupplies()">
          Mostrar deshabilitados
        </n-checkbox>
      </n-space>


      <n-data-table :columns="tableColumns" :data="supplies" size="small" :scroll-x="900" :loading="isLoadingData" remote
                    :pagination="pagination" />
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
    const showDisabled = ref(false);
    const page = ref(1);
    const type = ref(0);
    const pageCount = ref(null);
      const pagination = ref({
          previusPage: null,
          offset: 0,
          page: page,
          pageSize: 15,
          itemCount: pageCount,
          pageCount: 0,
          pageSlot: 5,
          suffix: () => {
              return "Total: " + pagination.value.itemCount;
          },
          
          onChange: async (page) => {
              pagination.value.page = page;
              pagination.value.offset = (page - 1) * pagination.value.pageSize; // Recalcular el offset
              await listSupplies();
          },
      });
    const newSupplies = () => {
      (items.id = undefined),
        (items.code = undefined),
        (items.name = undefined),
        (items.purchase_price = undefined),
        (items.measureunit = 1),
        (items.branchoffice = 1),
        (items.amount = undefined);
    };
    const editSupplies = (data) => {
      (items.id = data.id),
        (items.code = data.code),
        (items.name = data.name),
        (items.purchase_price = data.purchase_price),
        (items.measureunit = data.measureunit),
        (items.branchoffice = data.branchoffice),
        (items.amount = data.amount);
    };
    const newMovement = (value) => {
      (type.value = value),
        (itemsMovement.supplie = undefined),
        (itemsMovement.type = value),
        (itemsMovement.branchoffice = 1),
        (itemsMovement.concept = undefined),
        (itemsMovement.amount = undefined);
    };
      
      const listSupplies = async() => {
          isLoadingData.value = true;
          
          // Solicitar datos con offset y limit
          getSupplies("supplies", {
              offset: pagination.value.offset,
              limit: pagination.value.pageSize,
              search: textSearch.value,
              state: showDisabled.value
          }).then((response) => {
              supplies.value = response.data.results; // Datos de la página actual
              pagination.value.itemCount = response.data.count; // Total de elementos
              pagination.value.pageCount = Math.ceil(response.data.count / pagination.value.pageSize); // Calcular total de páginas
          }).catch((error) => {
              console.error(error);
          }).finally(() => {
              isLoadingData.value = false;
          });
      };

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
            });
        },
      });
    };

    return {
      userStore,
      showModal,
      showModalMovement,
      textSearch,
      showDisabled,
      isLoadingData,
      listSupplies, 
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