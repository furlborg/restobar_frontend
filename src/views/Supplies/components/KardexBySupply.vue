<template>
  <n-grid responsive="screen" cols="10 s:10 m:10 l:10 xl:10 2xl:10" :x-gap="12">
    <n-gi :span="3">
      <n-card title="Productos" :bordered="false" embedded>
        <n-form>
          <n-input-group>
            <n-input placeholder="Buscar..." />
            <n-button type="info">
              <v-icon name="md-search-round" />
            </n-button>
          </n-input-group>
        </n-form>
        <n-scrollbar class="mt-2 pe-3" style="height: 625px;">
          <n-list class="mt-0">
            <n-list-item v-for="index in 100" :key="index">
              <template #prefix>
                <n-text>{{index}}</n-text>
              </template>
              <template #suffix>
                <n-text>Stock:10</n-text>
              </template>
              <n-text>Producto #{{index}}</n-text>
            </n-list-item>
          </n-list>
        </n-scrollbar>
      </n-card>
    </n-gi>
    <n-gi :span="7">
      <n-card title="Kardex">
        <template #header-extra>
          <!-- <v-icon class="me-2" name="md-filteralt-round" fill="dodgerblue" /> -->
          <n-date-picker type="daterange" size="small" clearable />
          <n-dropdown trigger="click" :options="options" placement="bottom-end" :show-arrow="true">
            <n-button class="ms-2" type="info" size="small">
              <v-icon name="md-download-round" />
            </n-button>
          </n-dropdown>
        </template>
        <n-grid responsive="screen" cols="3" :x-gap="6">
          <n-gi>
            <div class="px-2" style="background-color: HoneyDew">
              <n-space justify="space-around" align="center">
                <n-text>Entradas</n-text>
                <div class="fs-4">20</div>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="px-2" style="background-color: LavenderBlush">
              <n-space justify="space-around" align="center">
                <n-text>Salidas</n-text>
                <div class="fs-4">10</div>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="px-2" style="background-color: LightCyan">
              <n-space justify="space-around" align="center">
                <n-text>Stock</n-text>
                <div class="fs-4">20</div>
              </n-space>
            </div>
          </n-gi>
        </n-grid>
        <n-data-table class="mt-2" style="height: 618px" :columns="columns" :data="supplies" :pagination="pagination" flex-height />
      </n-card>
    </n-gi>
  </n-grid>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue"
import {createKardexBySupplyColumns} from "@/utils/constants"
import {renderIcon} from '@/utils'

export default defineComponent({
  name: 'KardexBySupply',
  setup() {
    const showModal = ref(false)
    const supplies = ref([
      {
        type: 'ingress',
        date: '2021-01-01',
        description: 'Actualizar stock',
        document: 'BO01',
        input: 10,
        stock: 20,
      },
      {
        type: 'egress',
        date: '2021-01-01',
        description: 'Actualizar stock',
        document: 'BO02',
        output: 10,
        stock: 10,
      },
      {
        type: 'ingress',
        date: '2021-01-01',
        description: 'Actualizar stock',
        document: 'BO03',
        input: 10,
        stock: 20,
      }
    ])
    const pagination = ref({})

    const onCloseModal = () => {
        document.title = 'Productos | App'
        // idProduct.value = 0
    }

    const onSuccess = () => {
        showModal.value = false
        onCloseModal()
        // loadProductsData()
    }

    onMounted(() => {
        document.title = 'Proveedores | App'
    })

    const options = ref([
      {
        label: 'PDF',
        key: 'PDF',
        icon: renderIcon('vi-file-type-pdf2')
      },
      {
        label: "Excel",
        key: "Excel",
        icon: renderIcon('vi-file-type-excel')
      },
    ])

    return {
      options,
      supplies,
      showModal,
      onCloseModal,
      onSuccess,
      pagination,
      columns: createKardexBySupplyColumns()
    }
  }
})
</script>

<style>

</style>