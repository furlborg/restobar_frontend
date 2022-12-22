<template>
  <div id="TicketDelivery">
    <div class="ticket">
      <div class="ticket-header">
        <div class="ticket-header-title">DELIVERY</div>
        <div class="ticket-header-subtitle">ORDEN #{{ data.id }}</div>
      </div>
      <div class="ticket-body">
        <table class="ticket-body-info">
          <tbody>
            <tr>
              <td>DOCUMENTO :</td>
              <td>{{ info.serie_documento }}-{{ info.numero_documento }}</td>
            </tr>
            <tr>
              <td align="right">CLIENTE :</td>
              <td>
                {{
                  info.datos_del_cliente_o_receptor
                    .apellidos_y_nombres_o_razon_social
                }}
              </td>
            </tr>
            <tr>
              <td align="right">REFERENCIA :</td>
              <td>{{ data.delivery_info.person }}</td>
            </tr>
            <tr>
              <td align="right">TELÉFONO :</td>
              <td>{{ data.delivery_info.phone }}</td>
            </tr>
            <tr>
              <td align="right">DIRECCIÓN :</td>
              <td>{{ data.delivery_info.address }}</td>
            </tr>
            <tr>
              <td align="right">F.EMISIÓN :</td>
              <td>{{ info.fecha_de_emision }} {{ info.hora_de_emision }}</td>
            </tr>
            <tr>
              <td align="right">PAGO :</td>
              <td>{{ data.given_amount }}</td>
            </tr>
            <tr>
              <td align="right">VUELTO :</td>
              <td>
                {{ parseFloat(data.given_amount - data.amount).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <table class="ticket-body-details">
        <thead>
          <tr>
            <td>CANT</td>
            <td>UM</td>
            <td>DESCRIPCIÓN</td>
            <td>PRECIO</td>
            <td>TOTAL</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in info.items" :key="index">
            <td>{{ item.cantidad }}</td>
            <td>UND</td>
            <td align="left">{{ item.descripcion }}</td>
            <td align="right">{{ item.precio_unitario.toFixed(2) }}</td>
            <td align="right">{{ item.total_item.toFixed(2) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr v-if="Number(data.delivery_info.amount)">
            <td colspan="4" align="right">DELIVERY</td>
            <td align="right">
              {{ parseFloat(data.delivery_info.amount).toFixed(2) }}
            </td>
          </tr>
          <tr>
            <td colspan="4" align="right">TOTAL</td>
            <td align="right">{{ info.totales.total_venta.toFixed(2) }}</td>
          </tr>
        </tfoot>
      </table>
      <div class="ticket-footer">
        <div>REPARTIDOR:{{ data.delivery_info.deliveryman }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "TicketDelivery",
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const info = JSON.parse(props.data.json_sale);

    return {
      info,
    };
  },
});
</script>

<style lang="scss" scoped>
.ticket {
  font-family: Arial, Helvetica, sans-serif;
  background-color: White;
  line-height: normal;
  font-weight: bold;
  min-width: 272px;
  &-header {
    text-align: center;
    margin-bottom: 5px;
    font-size: 14px;
  }
  &-body {
    font-size: 12px;
    margin-bottom: 5px;
    &-details {
      margin-top: 5px;
      font-size: 10px;
      width: 272px;
      tbody {
        tr {
          &:first-child {
            td {
              border-top: 1px solid;
            }
          }
          &:last-child {
            td {
              border-bottom: 1px solid;
            }
          }
        }
      }
    }
  }
  &-footer {
    font-size: 12px;
  }
}
</style>
