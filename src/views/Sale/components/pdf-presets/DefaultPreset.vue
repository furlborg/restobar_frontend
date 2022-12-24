<template>
  <div id="DefaultPreset">
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
        <div class="ticket-header-info">{{ businessStore.business.name }}</div>
        <div class="ticket-header-info">
          {{ businessStore.business.commercial_name }}
        </div>
        <div class="ticket-header-info">
          {{ businessStore.business.fiscal_address }}
        </div>
        <div class="ticket-header-info">{{ businessStore.business.phone }}</div>
        <div class="ticket-header-info">
          {{ businessStore.business.website }}
        </div>
        <div class="ticket-header-title">{{ title() }}</div>
        <div class="ticket-header-title">
          {{ sale.serie_documento }}-{{ sale.numero_documento }}
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
                <td>F. EMISIÓN :</td>
                <td>{{ sale.fecha_de_emision }} {{ sale.hora_de_emision }}</td>
              </tr>
              <tr>
                <td>F. VENCIMIENTO :</td>
                <td>{{ sale.fecha_de_vencimiento }}</td>
              </tr>
              <tr>
                <td>DNI/RUC :</td>
                <td>
                  {{ sale.datos_del_cliente_o_receptor.numero_documento }}
                </td>
              </tr>
              <tr>
                <td>CLIENTE :</td>
                <td>
                  {{
                    sale.datos_del_cliente_o_receptor
                      .apellidos_y_nombres_o_razon_social
                  }}
                </td>
              </tr>
              <tr>
                <td>DIRECCIÓN :</td>
                <td>{{ sale.datos_del_cliente_o_receptor.direccion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ticket-body-details">
          <table width="272px">
            <thead>
              <tr>
                <th width="15%">CANT</th>
                <th width="10%">UM</th>
                <th width="30%">DESCRIPCIÓN</th>
                <th width="15%">PRECIO</th>
                <th width="15%">DESCT</th>
                <th width="15%">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in sale.items" :key="index">
                <td>{{ item.cantidad }}</td>
                <td>UND</td>
                <td align="left">{{ item.descripcion }}</td>
                <td align="right">{{ item.precio_unitario.toFixed(2) }}</td>
                <td align="right">0.00</td>
                <td align="right">{{ item.total_item.toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td align="right" colspan="5">OP. GRAVADAS:</td>
                <td align="right">
                  {{ sale.totales.total_operaciones_gravadas.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">OP. EXONERADAS:</td>
                <td align="right">
                  {{ sale.totales.total_operaciones_exoneradas.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">OP. GRATUITAS:</td>
                <td align="right">
                  {{ sale.totales.total_operaciones_gratuitas.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="!!sale.totales.total_descuentos">
                <td align="right" colspan="5">DESCUENTO TOTAL:</td>
                <td align="right">
                  {{ sale.totales.total_descuentos.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">ICBPER:</td>
                <td align="right">
                  {{ sale.totales.total_impuestos_bolsa_plastica.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">IGV:</td>
                <td align="right">
                  {{ sale.totales.total_igv.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">IMPORTE TOTAL:</td>
                <td align="right">
                  {{ sale.totales.total_venta.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">EFECTIVO :</td>
                <td align="right">
                  {{ parseFloat(data.given_amount).toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" colspan="5">VUELTO :</td>
                <td align="right">
                  {{ parseFloat(data.given_amount - data.amount).toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
          <div class="amount-text">SON {{ amountText }}</div>
        </div>
        <div v-if="sale.codigo_tipo_documento !== '80'" class="ticket-footer">
          <div class="ticket-footer-extra">
            <div class="qr-code">
              <img :src="generateQR()" alt="qr" width="116" />
            </div>
            <div class="extra-info">
              <div class="extra-info-label">MÉTODO DE PAGO:</div>
              <div class="extra-info-value">{{ info[2] }}</div>
              <div class="extra-info-label">CONDICIÓN DE PAGO:</div>
              <div class="extra-info-value">{{ info[1] }}</div>
              <div class="extra-info-label">USUARIO:</div>
              <div class="extra-info-value">{{ info[0] }}</div>
              <div class="extra-info-label">PEDIDO:</div>
              <div class="extra-info-value">ORDEN N°{{ data.order_id }}</div>
            </div>
          </div>
          <div>
            Representación impresa del comprobante electrónico. Puede verificar
            utilizando su clave SOL o ingresando a:
          </div>
          <div class="ticket-footer-url">
            {{ businessStore.business.website }}/buscar
          </div>
          <div>
            BIENES CONSUMIDOS/SEVICIOS PRESTADOS EN LA AMAZONIA PARA SER
            CONSUMIDAS EN LA MISMA
          </div>
        </div>
        <div v-else class="ticket-footer">
          <table>
            <thead>
              <th></th>
              <th></th>
            </thead>
            <tbody>
              <tr>
                <td>MÉTODO DE PAGO:</td>
                <td>{{ info[2] }}</td>
              </tr>
              <tr>
                <td>CONDICIÓN DE PAGO:</td>
                <td>
                  {{ info[1] }}
                </td>
              </tr>
              <tr>
                <td>USUARIO:</td>
                <td>
                  {{ info[0] }}
                </td>
              </tr>
              <tr>
                <td>PEDIDO:</td>
                <td>ORDEN N°{{ data.order_id }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useBusinessStore } from "@/store/modules/business";
import { numeroALetras } from "@/hooks/numberText.js";
import qr from "qrcode";
export default defineComponent({
  name: "DefaultPreset",
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const businessStore = useBusinessStore();

    const sale = JSON.parse(props.data.json_sale);

    const title = () => {
      switch (sale.codigo_tipo_documento) {
        case "01":
          return "FACTURA ELECTRONICA";
        case "03":
          return "BOLETA ELECTRONICA";
        case "80":
          return "NOTA DE VENTA";
        default:
          console.error("tipo de documento inválido");
          return "";
      }
    };

    const info = sale.informacion_adicional.split("|");

    const amountText = numeroALetras(
      sale.totales.total_venta.toFixed("2"),
      "SOLES"
    );

    const generateQR = () => {
      let code_qr;
      qr.toDataURL(
        `${businessStore.business.ruc}|${sale.serie_documento}|${sale.totales.total_igv}|${sale.hora_de_EMISIÓN}|${sale.datos_del_cliente_o_receptor.numero_documento}|${sale.numero_documento}|${sale.totales.total_venta}|${sale.datos_del_cliente_o_receptor.codigo_tipo_documento_identidad}|`,
        (err, code) => {
          if (err) return console.error("error occurred");
          code_qr = code;
        }
      );
      return code_qr;
    };

    return {
      businessStore,
      sale,
      title,
      info,
      generateQR,
      amountText,
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
      font-size: 10px;
    }
    &-title {
      font-size: 12px;
      margin-top: 5px;
    }
  }
  &-body {
    font-size: 10px;
    table td,
    th {
      vertical-align: top;
    }
    &-info {
      table {
        width: 272px;
        td {
          &:first-child {
            width: 35%;
            text-align: right;
          }
          &:last-child {
            width: 65%;
            text-align: left;
          }
        }
      }
    }
    &-details {
      table {
        width: 272px;
        th {
          font-size: 9px;
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
