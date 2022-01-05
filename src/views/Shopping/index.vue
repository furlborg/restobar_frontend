<template>
  <div id="Shopping">
    <n-card title="Compras" :segmented="{ content: 'hard' }">
      <!-- <template #header-extra>
              <n-button type="primary">Ver Proveedores</n-button>
          </template> -->
      <n-form>
        <n-grid
          responsive="screen"
          cols="12 s:12 m:12 l:12 xl:12 2xl:12"
          :x-gap="12"
        >
          <n-form-item-gi :span="2" label="RUC">
            <n-input-group>
              <n-input placeholder="" />
              <n-button type="info" secondary>
                <v-icon name="md-add-round" />
              </n-button>
            </n-input-group>
          </n-form-item-gi>
          <n-form-item-gi :span="4" label="Proveedor">
            <n-input placeholder="" readonly />
          </n-form-item-gi>
          <n-form-item-gi :span="1" label="Tipo pago">
            <n-select placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="1" label="Documento">
            <n-select placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="2" label="Nº Documento">
            <n-input placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="2" label="Fecha compra">
            <n-date-picker class="w-100" type="date" placeholder="" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <n-card title="Insumos">
        <n-form>
          <n-grid
            responsive="screen"
            cols="20 s:20 m:20 l:20 xl:20 2xl:20"
            :x-gap="12"
          >
            <n-form-item-gi :span="4" label="Insumo">
              <n-input-group>
                <n-input placeholder="" />
                <n-button type="info" secondary>
                  <v-icon name="md-add-round"></v-icon>
                </n-button>
              </n-input-group>
            </n-form-item-gi>
            <n-form-item-gi :span="2" label="Cantidad">
              <n-input-number class="w-100" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi :span="2" label="Pre. compra (S/.)">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi :span="2" label="Pre. compra actual">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi>
              <n-button type="info" secondary>Agregar</n-button>
            </n-form-item-gi>
          </n-grid>
        </n-form>
        <n-data-table :columns="tableColumns" :data="supplies"></n-data-table>
      </n-card>
    </n-card>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { createSuppliesColumns } from "@/utils/constants";
import { useMessage } from "naive-ui";

export default defineComponent({
  name: "Shopping",
  setup() {
    const message = useMessage();
    const supplies = [
      {
        code: "COD01",
        quantity: 5,
        description: "Sal",
        unit_price: 1.0,
        subtotal: 5.0,
      },
      {
        code: "COD02",
        quantity: 3,
        description: "Azúcar",
        unit_price: 1.5,
        subtotal: 4.5,
      },
      {
        code: "COD03",
        quantity: 10,
        description: "Arroz",
        unit_price: 2.0,
        subtotal: 20.0,
      },
    ];

    return {
      supplies,
      summary: (pageData) => {
        return {
          subtotal: {
            value: pageData.reduce(
              (prevValue, row) => prevValue + row.subtotal,
              0
            ),
          },
        };
      },
      tableColumns: createSuppliesColumns({
        createSuppliesColumns() {
          message.success("Hello there!");
        },
      }),
    };
  },
});
</script>

<style>
</style>