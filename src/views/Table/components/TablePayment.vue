<template>
  <div id="TablePayment">
      <n-card>
          <template #header>
                <n-space align="center" justify="space-between">
                    <n-text class="fs-4">Pago</n-text>
                    <n-button-group vertical>
                        <n-radio-group v-model:value="doc_type" name="docType">
                            <n-radio-button :value="1" :key="1">FACTURA</n-radio-button>
                            <n-radio-button :value="2" :key="2">BOLETA</n-radio-button>
                            <n-radio-button :value="3" :key="3">N. VENTA</n-radio-button>
                        </n-radio-group>
                    </n-button-group>
                </n-space>
          </template>
          <n-table :bordered="false" :single-line="false" :single-column="true" :bottom-bordered="false">
              <tbody>
                  <tr>
                      <td>
                          <n-space align="center" vertical>
                              <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                              <span class="fs-4">Total</span>
                          </n-space>
                      </td>
                      <td>
                          <n-space align="center" vertical>
                              <div class="fs-5">S/. <span class="fs-1" @input="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                              <span class="fs-4">Pago</span>
                          </n-space>
                      </td>
                      <td>
                          <n-space align="center" vertical>
                              <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                              <span class="fs-4">Vuelto</span>
                          </n-space>
                      </td>
                  </tr>
                  <tr>
                      <td colspan="3">
                          <n-space justify="center" align="center">
                              <n-switch />
                              <span>Aplicar Descuento</span>
                              <n-input value="0.00" />
                          </n-space>
                      </td>
                  </tr>
                  <tr>
                      <td colspan="3">
                            <n-space justify="space-between" align="center">
                                <n-text class="fs-6">Pagos Agregados</n-text>
                                <n-button-group>
                                    <n-button color="#87CEFA" ghost round>S/. 10</n-button>
                                    <n-button color="#87CEFA" ghost>S/. 20</n-button>
                                    <n-button color="#87CEFA" ghost>S/. 50</n-button>
                                    <n-button color="#87CEFA" ghost round>S/. 100</n-button>
                                </n-button-group>
                                <n-button type="info" text>
                                    <v-icon name="md-add-round" />
                                    Agregar
                                </n-button>
                            </n-space>
                            <n-table class="fs-1 m-auto text-center" :bordered="false" :single-column="true" :bottom-bordered="false">
                                <tbody>
                                    <tr>
                                        <td>1</td>
                                        <td>Efectivo</td>
                                        <td>S/. 1.00</td>
                                    </tr>
                                </tbody>
                            </n-table>
                      </td>
                  </tr>
              </tbody>
          </n-table>
      </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue"

export default defineComponent({
    name: "TablePayment",
    setup() {
        const doc_type = ref(2)
        const amount = ref(0.00)

        const onInput = (e) => {
            amount.value = Number(e.target.innerText)
        }

        return {
            doc_type,
            amount,
            onInput,
        }
    }
})
</script>

<style>

</style>