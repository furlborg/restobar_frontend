<template>
  <div id="Supplies">
      <n-card title="Insumos" :segmented="{content: 'hard'}">
        <!-- <template #header-extra>
          <n-button type="info" text>Ver movimientos</n-button>
        </template> -->
        <n-grid class="mt-2" responsive="screen" cols="10 s:10 m:10 l:10 xl:10 2xl:10" :x-gap="12">
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
              <n-data-table :columns="columns" :data="supplies" :pagination="pagination" />
            </n-card>
          </n-gi>
        </n-grid>
        <supply-kardex v-model:show="showModal" @update:show="onCloseModal" @on-success="onSuccess" />
      </n-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue"
import {createSupplyColumns} from "@/utils/constants"
import SupplyKardex from './components/SupplyKardex'

export default defineComponent({
  name: 'Supplies',
  components: {
    SupplyKardex,
  },
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
    const pagination = ref({
        page: 1,
    })

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

    return {
      supplies,
      showModal,
      onCloseModal,
      onSuccess,
      pagination,
      columns: createSupplyColumns()
    }
  }
})
</script>

<style>

</style>