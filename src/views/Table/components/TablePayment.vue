<template>
  <div id="TablePayment">
    <n-card>
      <n-form>
        <n-space class="mb-2" align="center" justify="space-between">
          <div class="d-flex align-items-center">
            <n-text class="fs-4">BO-001</n-text>
            <n-dropdown
              trigger="click"
              :options="docOptions"
              :show-arrow="true"
              placement="bottom-end"
              size="huge"
            >
              <n-button type="info" text>
                <v-icon
                  class="p-0"
                  name="md-arrowdropdown-round"
                  scale="1.75"
                />
              </n-button>
            </n-dropdown>
          </div>
          <n-radio-group v-model:value="doc_type" name="docType" size="small">
            <n-radio-button :value="1" :key="1">FACTURA</n-radio-button>
            <n-radio-button :value="2" :key="2">BOLETA</n-radio-button>
            <n-radio-button :value="3" :key="3">N. VENTA</n-radio-button>
          </n-radio-group>
          <n-radio-group v-model:value="sale_type" name="saleType" size="small">
            <n-radio-button :value="1" :key="1">CONTADO</n-radio-button>
            <n-radio-button :value="2" :key="2">CRÉDITO</n-radio-button>
          </n-radio-group>
        </n-space>

        <n-grid
          responsive="screen"
          cols="12 s:12 m:12 l:12 xl:12 2xl:12"
          :x-gap="12"
        >
          <n-form-item-gi :span="6" label="Cliente">
            <n-input-group>
              <n-input />
              <n-button type="info">
                <v-icon name="md-add-round" />
              </n-button>
            </n-input-group>
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Método Pago">
            <n-input />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Fecha">
            <n-date-picker class="w-100" type="date" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="Nombres">
            <n-input />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="Dirección">
            <n-input />
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="Observaciones">
            <n-input type="textarea" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <n-table class="fs-6 m-auto text-center" :bordered="false">
        <thead>
          <tr>
            <th>#</th>
            <th>Cantidad</th>
            <th>Producto</th>
            <th>Precio Unitario</th>
            <th>Precio Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(detail, index) in orderStore.orderToSale" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ detail.quantity }}</td>
            <td>{{ detail.product_name }}</td>
            <td>S/. {{ detail.price_sale }}</td>
            <td>S/. {{ detail.quantity * detail.price_sale }}</td>
          </tr>
        </tbody>
      </n-table>
      <n-space align="center" justify="space-around">
        <n-space align="center" vertical>
          <span class="fs-4">Pago</span>
          <div class="fs-5">
            S/.
            <span
              class="fs-1"
              @keypress="isDecimal($event)"
              @keypress.enter.prevent="onInput"
              contenteditable
              >{{ sale.amount.toFixed(2) }}</span
            >
          </div>
        </n-space>
        <n-space align="center" vertical>
          <span class="fs-4">Vuelto</span>
          <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
        </n-space>
        <n-space class="mt-2 fs-6 fw-bold" align="end" vertical>
          <div>SUBTOTAL: <span>S/. 50.00</span></div>
          <div>ICBPER: <span>S/. 0.00</span></div>
          <div>IGV: <span>S/. 9.00</span></div>
          <div>DSCT: <span>S/. 0.00</span></div>
          <div>TOTAL: <span>S/. 50.00</span></div>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useOrderStore } from "@/store/modules/order";
import { isDecimal, isNumber, isLetter } from "@/utils";

export default defineComponent({
  name: "TablePayment",
  setup() {
    const orderStore = useOrderStore();
    const doc_type = ref(2);
    const sale_type = ref(1);
    const sale = ref({
      order: orderStore.orderId,
      serie: null,
      number: "",
      date_sale: "",
      count: "",
      amount: 0.0,
      invoice_type: null,
      payment_method: null,
      payment_condition: null,
      customer: null,
      customer_name: "",
      address: "",
      branch_office: "",
      discount: "",
      observations: "",
      sale_details: [],
    });
    const docOptions = [
      {
        label: "BO-001",
        key: "BO-001",
      },
      {
        label: "BO-002",
        key: "BO-002",
      },
      {
        label: "BO-003",
        key: "BO-003",
      },
      {
        label: "BO-004",
        key: "BO-004",
      },
    ];

    const onInput = (e) => {
      sale.value.amount = Number(e.target.innerText);
    };

    return {
      orderStore,
      doc_type,
      sale_type,
      sale,
      onInput,
      docOptions,
      isDecimal,
    };
  },
});
</script>

<style>
</style>