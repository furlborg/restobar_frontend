<template>
  <div id="TicketDelivery">
    <div class="ticket">
      <div
        class="ticket-header"
        :style="{
          fontSize: `${
            settingsStore.business_settings.printer.delivery_ticket_font_size +
            4
          }px`,
        }"
      >
        <div class="ticket-header-title">DELIVERY</div>
        <div class="ticket-header-subtitle">ORDEN #{{ data.id }}</div>
      </div>
      <div
        class="ticket-body"
        :style="{
          fontSize: `${
            settingsStore.business_settings.printer.delivery_ticket_font_size +
            2
          }px`,
        }"
      >
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
      <table
        class="ticket-body-details"
        :style="{
          fontSize: `${settingsStore.business_settings.printer.delivery_ticket_font_size}px`,
        }"
      >
        <thead>
          <tr>
            <td width="15%">CANT</td>
            <td width="15%">UM</td>
            <td width="35%">DESCRIPCIÓN</td>
            <td width="19%">PRECIO</td>
            <td width="21%">TOTAL</td>
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
      <div
        class="ticket-footer"
        :style="{
          fontSize: `${
            settingsStore.business_settings.printer.delivery_ticket_font_size +
            2
          }px`,
        }"
      >
        <div>REPARTIDOR:{{ data.delivery_info.deliveryman }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useSettingsStore } from "@/store/modules/settings";

export default defineComponent({
  name: "TicketDelivery",
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const settingsStore = useSettingsStore();

    const parseSale = () => {
      let saleData = JSON.parse(props.data.json_sale);
      // console.log(JSON.stringify(props.data, null, "  "));
      // console.log(JSON.stringify(saleData, null, "  "));
      props.data.order_details.forEach((detail, index) => {
        const indication = detail.indication.reduce((desc, indication) => {
          if (indication.quick_indications.length) {
            indication.quick_indications.forEach((ind) => {
              desc += `${ind}, `;
            });
          }
          desc = !indication.description
            ? ` [${desc.slice(0, -2)}]`
            : ` [${desc}${indication.description}]`;
          return desc;
        }, "");
        saleData.items[index].descripcion += indication;
      });
      return saleData;
    };

    const info = parseSale();

    return {
      info,
      settingsStore,
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
  }
  &-body {
    margin-bottom: 5px;
    &-details {
      margin-top: 5px;
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
  }
}
</style>
