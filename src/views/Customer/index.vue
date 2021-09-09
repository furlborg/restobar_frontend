<template>
  <n-card title="Clientes" :bordered="false" :segmented="{ content: 'hard' }">
    <n-collapse class="mb-3" arrow-placement="right">
      <n-collapse-item title="Búsqueda" name="1">
        <template #header-extra>
          <n-button type="primary" @click="">
            <template #icon>
              <n-icon>
                <v-icon name="la-user-plus-solid" />
              </n-icon>
            </template>
            Nuevo
          </n-button>
        </template>
        <!-- Search Customer Form -->
        <n-form>
          <n-grid cols="2 s:2 m:3 l:3 xl:5 2xl:5" :x-gap="12" responsive="screen">
            <n-grid-item>
              <n-grid x-gap="12" :cols="2" >
                <n-grid-item>
                  <n-form-item label="Tipo Documento">
                    <n-radio-group name="docTypeGroup">
                      <n-select style="width: 150px;" :options="documentOptions" placeholder="" />
                    </n-radio-group>
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="Documento">
                    <n-input-number :show-button="false" placeholder="" />
                  </n-form-item>
                </n-grid-item>
              </n-grid>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Nombre">
                <n-input placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Dirección">
                <n-input placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Correo">
                <n-input placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-grid x-gap="12" :cols="2" >
                <n-grid-item>
                  <n-form-item label="Celular">
                    <n-input-number :show-button="false" placeholder="" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="Fecha de Nacimiento">
                    <n-date-picker type="date" placeholder="" clearable />
                  </n-form-item>
                </n-grid-item>
              </n-grid>
            </n-grid-item>
            <n-grid-item>
              <n-button type="primary">
                Buscar
              </n-button>
            </n-grid-item>
          </n-grid>
        </n-form>
      </n-collapse-item>
    </n-collapse>
    <!-- Customer Data Table -->
    <n-data-table :columns="tableColumns" :data="data" :pagination="pagination" />
  </n-card>
</template>

<script>
import {defineComponent, ref} from "vue"
import {OhVueIcon} from "@/plugins/icon"
import {documentOptions, createCostumerColumns} from "@/utils/constants";
import {useMessage} from "naive-ui";

export default defineComponent({
  name: "Customer",
  components: {
    'v-icon': OhVueIcon
  },
  setup() {
    const message = useMessage()
    const idCostumer = ref(0)

    return {
      documentOptions,
      tableColumns: createCostumerColumns({
        editCustomer(rowData) {
          idCostumer.value = rowData.id
          // openCustomerModal()
        },
        deleteCustomer(rowData) {
          message.error('Eliminando cliente ' + rowData.name)
        }
      }),
    }
  }
})
</script>

<style scoped>

</style>