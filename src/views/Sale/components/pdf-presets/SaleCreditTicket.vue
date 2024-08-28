<template>
  <div id="SaleCreditTicket">
    <div class="ticket">
      <div class="ticket-header">
        <div class="ticket-header-logo">
          <img
            :src="businessStore.business.logo_url"
            alt="business-logo"
            width="128"
          />
        </div>
        <div class="ticket-header-info">
          {{ businessStore.business.ruc }}
        </div>
        <div>
          {{ businessStore.business.commercial_name }}
        </div>
        <div class="ticket-header-info">
          {{ businessStore.business.fiscal_address }}
        </div>
      </div>
      <div class="ticket-body">
        <div class="ticket-body-info">
          <table>
            <thead>
              <th></th>
              <th></th>
            </thead>
            <tbody>
              <tr>
                <td>F. EMISIÓN</td>
                <td>: {{ data.date_sale }}</td>
              </tr>
              <tr>
                <td>DNI/RUC</td>
                <td>: {{ data.customer_doc }}</td>
              </tr>
              <tr>
                <td>CLIENTE</td>
                <td>
                  :
                  {{ data.customer_name }}
                </td>
              </tr>
              <tr>
                <td>MÉTODO PAGO</td>
                <td>
                  :
                  {{
                    saleStore.getPaymentMethodDescription(data.payment_method)
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ticket-body-details">
          <table width="272px">
            <thead>
              <tr>
                <th>Detalle</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td align="left">
                  {{ data.codsale }} - PAGO CRÉDITO N°{{
                    data.payments.length - payment
                  }}
                </td>
                <td>S/. {{ data.payments[payment].amount.toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td align="right">TOTAL DEUDA:</td>
                <td>S/. {{ data.amount.toFixed(2) }}</td>
              </tr>
              <tr>
                <td align="right">TOTAL PAGADO:</td>
                <td>S/. {{ data.paid_amount.toFixed(2) }}</td>
              </tr>
              <tr>
                <td align="right">TOTAL PENDIENTE:</td>
                <td>S/. {{ data.pending_amount.toFixed(2) }}</td>
              </tr>
              <tr>
                <td align="right">OBSERVACIONES:</td>
                <td>S/. {{ data.observations || '' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useBusinessStore } from "@/store/modules/business";
import { useSettingsStore } from "@/store/modules/settings";
import { useSaleStore } from "@/store/modules/sale";

export default defineComponent({
  name: "SaleCreditTicket",
  props: {
    data: {
      type: Object,
    },
    payment: {
      type: Number,
    },
  },
  setup() {
    const settingsStore = useSettingsStore();
    const businessStore = useBusinessStore();
    const saleStore = useSaleStore();

    return {
      settingsStore,
      businessStore,
      saleStore,
    };
  },
});
</script>

<style lang="scss" scoped>
.ticket {
  font-family: Arial, Helvetica, sans-serif;
  background-color: White;
  text-align: center;
  line-height: normal;
  min-width: 272px;
  &-header {
    font-weight: bold;
    margin-bottom: 5px;
    &-logo {
      img {
        margin: 5px;
      }
    }
    &-info {
      font-size: 12px;
    }
    &-title {
      font-size: 14px;
      margin-top: 5px;
    }
  }
  &-body {
    font-size: 12px;
    table td,
    th {
      vertical-align: top;
    }
    &-info {
      font-weight: bold;
      table {
        width: 272px;
        td {
          &:first-child {
            width: 37%;
            text-align: left;
          }
          &:last-child {
            width: 63%;
            text-align: left;
          }
        }
      }
    }
    &-details {
      table {
        width: 272px;
        th {
          font-size: 12px;
        }
        tfoot {
          font-weight: bold;
        }
      }
    }
    .amount-text {
      font-weight: bold;
    }
  }
  &-footer {
    font-size: 10px;
    text-align: center;
    &-extra {
      display: flex;
    }
    .extra-info {
      text-align: left;
      margin-top: 10px;
      &-label {
        font-weight: bold;
      }
    }
    &-url {
      margin: 5px;
      font-weight: bold;
    }
    table {
      width: 272px;
      td {
        &:first-child {
          width: 50%;
          text-align: left;
        }
        &:last-child {
          width: 50%;
          font-weight: bold;
          text-align: right;
        }
      }
    }
  }
}
</style>
