<template>
  <div id="Till">
    <n-grid
      cols="5 s:5 m:10 l:20 xl:20 2xl:20"
      responsive="screen"
      :x-gap="12"
      :y-gap="12"
    >
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon name="md-trendingup-round" scale="2" fill="LimeGreen" />
              <n-text class="fs-5">Ingresos</n-text>
            </n-space>
            <n-button type="success" text @click="showModal = true">
              <v-icon name="bi-pencil-square" scale="1.25" />
            </n-button>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. 1000</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon
                name="md-trendingdown-round"
                scale="2"
                fill="red"
                flip="horizontal"
              />
              <n-text class="fs-5">Egresos</n-text>
            </n-space>
            <n-button type="error" text>
              <v-icon name="bi-pencil-square" scale="1.25" />
            </n-button>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. 100</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon
                name="md-attachmoney-round"
                scale="2"
                fill="deepskyblue"
              />
              <n-text class="fs-5">Ventas</n-text>
            </n-space>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. 1000</n-text>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi :span="5">
        <n-card hoverable>
          <n-space justify="space-between" align="center">
            <n-space align="center" vertical>
              <v-icon name="la-coins-solid" scale="2" fill="orange" />
              <n-text class="fs-5">Total</n-text>
            </n-space>
          </n-space>
          <n-space>
            <n-text class="fs-1">S/. 900</n-text>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    <n-card class="mt-2" title="Movimientos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
          type="info"
          secondary
          @click="$router.push({ name: 'TillList' })"
          >Lista de Cajas</n-button
        >
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
        <n-button type="info" text>
          <v-icon name="hi-solid-refresh" />
          Recargar
        </n-button>
      </n-space>
      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid
            responsive="screen"
            cols="6 s:6 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
          >
            <n-form-item-gi label="Descripción" :span="3">
              <n-input />
            </n-form-item-gi>
            <n-form-item-gi label="Tipo" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Concepto" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Sucursal" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi :span="6">
              <n-button type="primary">Buscar</n-button>
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table class="mt-2" :columns="tableColumns" :data="movements" />
    </n-card>
    <till-modal
      v-model:show="showModal"
      concept="ingress"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage, useDialog, NButton } from "naive-ui";
import { createMovementsColumns } from "@/utils/constants";
import TillModal from "./components/TillModal";

export default defineComponent({
  name: "Till",
  components: {
    TillModal,
  },
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const showModal = ref(false);
    const showFilters = ref(false);
    const movements = ref([
      {
        id: 1,
        document: "B01",
        user: "admin",
        sucursal: "Sucursal 1",
        description: "Buffet presidencial",
        payment_method: "Tarjeta",
        amount: "S/. 1000.00",
        concept: "Venta",
        concept_type: 1,
        date: "2021-01-01",
      },
      {
        id: 2,
        document: "B02",
        user: "admin",
        sucursal: "Sucursal 1",
        description: "Pago recibo luz",
        payment_method: "Efectivo",
        amount: "S/. 100.00",
        concept: "Otros",
        concept_type: 2,
        date: "2021-01-01",
      },
    ]);

    onMounted(() => {
      document.title = "Movimientos de Caja | App";
    });

    const onCloseModal = () => {
      document.title = "Movimientos de Caja | App";
      // idProduct.value = 0
    };

    const onSuccess = () => {
      showModal.value = false;
      onCloseModal();
      // loadProductsData()
    };

    return {
      showModal,
      showFilters,
      onCloseModal,
      onSuccess,
      movements,
      tableColumns: createMovementsColumns({
        editMovement(rowData) {
          message.info("Editar registro " + rowData.id);
          /* showModal.value = true
              idCustomer.value = rowData.id */
        },
        deleteMovement(rowData) {
          dialog.error({
            title: "Eliminando registro",
            content: "¿Está seguro?",
            positiveText: "Sí",
            onPositiveClick: () => {
              message.success("Usuario " + rowData.id + " eliminado");
              /* performDisableCustomer(rowData.id) */
            },
          });
        },
      }),
    };
  },
});
</script>

<style>
</style>