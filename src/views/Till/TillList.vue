<template>
  <div id="TillList">
    <n-card :segmented="{content:'hard'}">
      <template #header>
        <n-space align="end">
          <n-text class="fs-3">Aperturas y Cierres</n-text>
          <n-button type="info" text @click="(showFilters===false) ? showFilters = true : showFilters = false">
            <v-icon name="md-filteralt-round" />
            Filtrar
          </n-button>
        </n-space>
      </template>
      <template #header-extra>
        <n-button type="success" @click="showModal=true">Open</n-button>
        <n-button type="info" text>
          <v-icon name="hi-solid-refresh" />
          Recargar
        </n-button>
      </template>
      <n-collapse-transition :show="showFilters">
        <n-form>
          <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
            <n-form-item-gi label="Usuario" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha" :span="6">
              <n-date-picker type="daterange" clearable />
            </n-form-item-gi>
            <n-form-item-gi label="Sucursal" :span="3">
              <n-select />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-input />
            </n-form-item-gi>
            <n-form-item-gi label="Sucursal" :span="3">
              <n-input />
            </n-form-item-gi>
            <n-form-item-gi :span="6">
              <n-button type="primary">Buscar</n-button>
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table :columns="tableColumns" :data="tills" />
    </n-card>
    <till-aperture-modal v-model:show="showModal" concept="ingress" @update:show="onCloseModal" @on-success="onSuccess" />
  </div>
</template>

<script>
import { defineComponent, ref } from "vue"
import TillApertureModal from "./components/TillApertureModal"
import {createTillColumns} from "@/utils/constants"
import {useMessage} from "naive-ui"

export default defineComponent({
  name: "TillList",
    components: {
        TillApertureModal,
    },
  setup() {
    const message = useMessage()
    const showModal = ref(false)
    const showFilters = ref(false)
    const tills = ref([
      {
        id: 1,
        user: 'admin',
        sucursal: 'Sucursal 1',
        opening: '2021-01-01 00:00:00',
        closing: '---------- --:--:--',
        opening_amount: 'S/. 0.00',
        closing_amount: 'S/. --.--',
        status: true,
      },
      {
        id: 2,
        user: 'admin',
        sucursal: 'Sucursal 1',
        opening: '2020-12-31 00:00:00',
        closing: '2020-12-31 23:59:59',
        opening_amount: 'S/. 0.00',
        closing_amount: 'S/. 1000.00',
        status: false,
      },
    ])

    const onCloseModal = () => {
        document.title = 'Movimientos de Caja | App'
        // idProduct.value = 0
    }

    const onSuccess = () => {
        showModal.value = false
        onCloseModal()
        // loadProductsData()
    }

    return {
      showModal,
      onCloseModal,
      onSuccess,
      showFilters,
      tills,
      tableColumns: createTillColumns({
        generateReport() {
          message.success('Opcion 1!')
        },
        deleteMovement() {
          message.success('Opcion 2!')
        },
      })
    }
  }
})
</script>

<style>

</style>