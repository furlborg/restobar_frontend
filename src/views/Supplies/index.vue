<template>
  <div id="Supplies">
      <n-card title="Insumos" :segmented="{content: 'hard'}">
        <template #header-extra>
          <n-button type="info" text>Ver movimientos</n-button>
        </template>
        <n-form>
          <n-input-group class="w-25">
            <n-input placeholder="Buscar..." />
            <n-button type="info">
              <v-icon name="md-search-round" />
            </n-button>
          </n-input-group>
        </n-form>
        <n-data-table class="mt-2" :columns="columns" :data="supplies" />
      </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue"
import {createSupplyColumns} from "@/utils/constants"

export default defineComponent({
  name: 'Supplies',
  setup() {
    const supplies = ref([
      {
        code: 'PROD001',
        description: 'Producto 1',
        price: 2.00,
        stock: 10,
        status: true,
      },
      {
        code: 'PROD002',
        description: 'Producto 2',
        price: 3.00,
        stock: 20,
        status: true,
      },
      {
        code: 'PROD003',
        description: 'Producto 3',
        price: 5.00,
        stock: 15,
        status: true,
      }
    ])
    return {
      supplies,
      columns: createSupplyColumns({
        editSupply(rowData) {
          console.log(rowData)
          /* showModal.value = true
          idCustomer.value = rowData.id */
        },
        deleteSupply(rowData) {
          console.log(rowData)
          /* dialog.error({
              title: 'Deshabilitando cliente',
              content: '¿Está seguro?',
              positiveText: 'Sí',
              onPositiveClick: () => {
              performDisableCustomer(rowData.id)
              }
          }) */
        }
      })
    }
  }
})
</script>

<style>

</style>