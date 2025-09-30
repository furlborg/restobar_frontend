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
        <div
          v-if="settingsStore.business_settings.printer.show_both_names"
          class="ticket-header-info"
        >
          {{ businessStore.business.name }}
        </div>
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
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>F. EMISIÓN</td>
                <td>
                  : {{ sale.fecha_de_emision }} {{ sale.hora_de_emision }}
                </td>
              </tr>
              <tr>
                <td>F. VENCIMIENTO</td>
                <td>: {{ sale.fecha_de_vencimiento }}</td>
              </tr>
              <tr>
                <td>DNI/RUC</td>
                <td>
                  : {{ sale.datos_del_cliente_o_receptor.numero_documento }}
                </td>
              </tr>
              <tr>
                <td>CLIENTE</td>
                <td>
                  :
                  {{
                    sale.datos_del_cliente_o_receptor
                      .apellidos_y_nombres_o_razon_social
                  }}
                </td>
              </tr>
              <tr>
                <td>DIRECCIÓN</td>
                <td>: {{ sale.datos_del_cliente_o_receptor.direccion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ticket-body-details">
          <table :width="isPrintMode ? '272px' : '100%'">
            <template v-if="data.by_consumption">
              <thead>
                <tr>
                  <th :width="!!hasDiscounts ? '60%' : '80%'" align="center">
                    DESCRIPCIÓN
                  </th>
                  <th width="0"></th>
                  <th width="0"></th>
                  <th v-if="hasDiscounts" width="20%">DESCT</th>
                  <th width="20%">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td align="center">Por consumo de alimentos</td>
                  <td></td>
                  <td></td>
                  <td v-if="hasDiscounts" align="right">
                    {{ sale.totales?.total_descuentos?.toFixed(2) || '0' }}
                  </td>
                  <td align="right">
                    {{ sale.totales?.total_venta.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-else>
              <thead>
                <tr>
                  <th width="15%">CANT</th>
                  <th width="40%">DESCRIPCIÓN</th>
                  <th :width="!!hasDiscounts ? '15%' : '20%'">PRECIO</th>
                  <th v-if="hasDiscounts" width="15%">DESCT</th>
                  <th :width="!!hasDiscounts ? '15%' : '20%'">TOTAL</th>
                </tr>
              </thead>
              <tbody v-if="!isCustomerMode">
                <tr v-for="(item, index) in sale.items" :key="index" 
                    :class="{ 'menu-header': item.isMenuHeader, 'menu-product': item.isMenuProduct }">
                  <td>{{ item.isMenuProduct ? '' : item.cantidad }}</td>
                  <td align="left" :style="item.isMenuProduct ? 'font-size: 11px; color: #666;' : ''">
                    {{ item.descripcion }}
                  </td>
                  <td align="right">
                    {{ item.isMenuProduct ? '' : item.precio_unitario.toFixed(2) }}
                  </td>
                  <td v-if="hasDiscounts" align="right">
                    {{ item.isMenuProduct ? '' : (data.sale_details[index]?.discount || '0.00') }}
                  </td>
                  <td align="right">
                    {{ item.isMenuProduct ? '' : item.total_item.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
              <tbody v-else v-for="customer in groupedByCustomer" :key="customer.customerName">
                <!-- Encabezado del cliente -->
                <tr style="background-color: #f0f0f0; font-weight: bold;">
                  <td colspan="6" align="center" style="padding: 4px; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                    {{ customer.customerName.toUpperCase() }}
                  </td>
                </tr>
                <!-- Items del cliente -->
                <tr v-for="(item, index) in customer.items" :key="`${customer.customerName}-${index}`"
                    :class="{ 'menu-header': item.isMenuHeader, 'menu-product': item.isMenuProduct }">
                  <td>{{ item.isMenuProduct ? '' : item.cantidad }}</td>
                  <td align="left" :style="item.isMenuProduct ? 'font-size: 11px; color: #666;' : ''">
                    {{ item.descripcion }}
                  </td>
                  <td align="right">
                    {{ item.isMenuProduct ? '' : item.precio_unitario.toFixed(2) }}
                  </td>
                  <td v-if="hasDiscounts" align="right">
                    {{ item.isMenuProduct ? '' : (data.sale_details[sale.items.indexOf(item)]?.discount || '0.00') }}
                  </td>
                  <td align="right">
                    {{ item.isMenuProduct ? '' : item.total_item.toFixed(2) }}
                  </td>
                </tr>
                <!-- Subtotal del cliente -->
                <tr style="font-weight: bold; font-style: italic;">
                  <td colspan="3" align="right">SUBTOTAL CLIENTE:</td>
                  <td v-if="hasDiscounts"></td>
                  <td align="right">{{ customer.total.toFixed(2) }}</td>
                </tr>
                <!-- Separador -->
                <tr>
                  <td colspan="6" style="border-bottom: 1px dashed #ccc; height: 8px;"></td>
                </tr>
              </tbody>
            </template>
            <tfoot>
              <tr v-if="Number(sale.totales?.total_operaciones_gravadas)">
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  OP. GRAVADAS:
                </td>
                <td align="right">
                  {{ sale.totales.total_operaciones_gravadas.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(sale.totales?.total_operaciones_exoneradas)">
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  OP. EXONERADAS:
                </td>
                <td align="right">
                  {{ sale.totales.total_operaciones_exoneradas.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(sale.totales.total_operaciones_gratuitas)">
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  OP. GRATUITAS:
                </td>
                <td align="right">
                  {{ sale.totales.total_operaciones_gratuitas.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(sale.totales.total_descuentos)">
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  DESCUENTO TOTAL:
                </td>
                <td align="right">
                  {{ sale.totales.total_descuentos.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(sale.totales.total_impuestos_bolsa_plastica)">
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">ICBPER:</td>
                <td align="right">
                  {{ sale.totales.total_impuestos_bolsa_plastica.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(sale.totales.total_igv)">
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">IGV:</td>
                <td align="right">
                  {{ sale.totales.total_igv.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  IMPORTE TOTAL:
                </td>
                <td align="right">
                  {{ sale.totales.total_venta.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  EFECTIVO :
                </td>
                <td align="right">
                  {{
                    data.payment_condition === 1
                      ? parseFloat(data.given_amount).toFixed(2)
                      : sale.totales.total_venta.toFixed(2)
                  }}
                </td>
              </tr>
              <tr>
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  OTROS :
                </td>
                <td align="right">
                    {{ data.other_charges }}
                </td>
              </tr>
              <tr
                v-if="
                  data.payment_condition === 1 &&
                  parseFloat(data.given_amount - data.amount)
                "
              >
                <td align="right" :colspan="!!hasDiscounts ? 4 : 3">
                  VUELTO :
                </td>
                <td align="right">
                  {{ parseFloat(data.given_amount - data.amount).toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
          <div class="amount-text">SON {{ amountText }}</div>
        </div>
<!--<pre>-->
<!--          {{ data }}-->
<!--</pre>-->
          
        <div v-if="sale.codigo_tipo_documento !== '80'" class="ticket-footer">
          <div class="ticket-footer-extra">
            <div class="qr-code">
              <img :src="generateQR()" alt="qr" width="108" />
            </div>
            <div class="extra-info">
              <div class="extra-info-label">MÉTODO DE PAGO:</div>
              <div class="extra-info-value">{{ info[2] }}</div>
              <div class="extra-info-label">CONDICIÓN DE PAGO:</div>
              <div class="extra-info-value">{{ info[1] }}</div>
              <div class="extra-info-label">USUARIO:</div>
              <div class="extra-info-value">{{ info[0] }}</div>
              <div v-if="data.order_id" class="extra-info-label">PEDIDO:</div>
              <div v-if="data.order_id" class="extra-info-value">
                ORDEN N°{{ data.order_id }}
              </div>
              <div v-if="data.order_data" class="extra-info-value">
                {{
                  !data.order_data.table
                    ? !data.order_data.delivery_info
                      ? "PARA LLEVAR"
                      : "DELIVERY"
                    : tableStore.getTableByID(data.order_data.table).description
                }}
              </div>
            </div>
          </div>
          <div v-if="data.observations" style="text-align: left; font-weight: bold">
              <p>
                  OBSERVACIONES: {{ data.observations }}
              </p>
          </div>
          <div>
            Representación impresa del comprobante electrónico. Puede verificar
            utilizando su clave SOL o ingresando a:
          </div>
          <div class="ticket-footer-url">
            {{ businessStore.business.website }}/buscar
          </div>
          <div>
            BIENES CONSUMIDOS/SERVICIOS PRESTADOS EN LA AMAZONIA PARA SER
            CONSUMIDAS EN LA MISMA
          </div>
        </div>
        <div v-else class="ticket-footer">
          <table>
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
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
              <tr>
                <td></td>
                <td>
                  {{
                    !data.order_data.table
                      ? !data.order_data.delivery_info
                        ? settingsStore.business_settings.order?.fast_sale_format ? "VENTA RÁPIDA" : "PARA LLEVAR"  
                        : "DELIVERY"
                      : tableStore.getTableByID(data.order_data.table)
                          .description
                  }}
                </td>
              </tr>
              <tr>
                <td>OBSERVACIONES</td>
                <td>
                  {{
                    data.observations
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useBusinessStore } from "@/store/modules/business";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";
import { numeroALetras } from "@/hooks/numberText.js";
import { expandMenusInSaleData } from "@/utils/menuExpander.js";
import qr from "qrcode";
export default defineComponent({
  name: "DefaultPreset",
  props: {
    data: {
      type: Object,
    },
    isPrintMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const settingsStore = useSettingsStore();
    const businessStore = useBusinessStore();
    const tableStore = useTableStore();

    const hasDiscounts = props.data.sale_details.some(
      (detail) => !!Number(detail.discount)
    );

    // Detectar si es modo clientes
    const isCustomerMode = computed(() =>(
      props.data.order_by_customer === 'order_by_customer' ||
      (props.data.original_sale_details &&
      props.data.original_sale_details.some(detail => !!detail.customer))
    ));

    // Agrupar items por cliente para modo clientes
    const groupedByCustomer = computed(() => {
      if (!isCustomerMode.value) return null;

      const groups = {};
      const saleDetails = props.data.original_sale_details || props.data.sale_details;
      const saleData = parseSale(); // Obtener los datos de venta aquí

      saleDetails.forEach((detail, index) => {
        const customerId = detail.customer.id || 'sin_cliente';
        const customerName = detail.customer.name || 'Sin cliente';

        if (!groups[customerId]) {
          groups[customerId] = {
            customerName,
            items: [],
            total: 0
          };
        }
        
        // Obtener el item correspondiente de saleData.items
        const saleItem = saleData.items[index];
        if (saleItem) {
          groups[customerId].items.push({
            ...saleItem,
            customerName
          });
          groups[customerId].total += saleItem.total_item;
        }
      });
      
      return Object.values(groups);
    });

    const parseSale = () => {
      let saleData = JSON.parse(props.data.json_sale);
      // Expandir menús para mostrar productos individuales
      if (settingsStore.business_settings.printer.detail_items) {
        const orderDetails = props.data?.order_data?.order_details || props.data?.order_details || [];
        
        // Crear items expandidos manualmente ya que el JSON de venta no los incluye
        const expandedItems = [];
        
        saleData.items?.forEach((saleItem, saleIndex) => {
          // Buscar si existe un menú correspondiente
          const menuDetail = orderDetails.find(orderDetail => 
            orderDetail.product_set && 
            parseFloat(orderDetail.product_set.price) === saleItem.total_item
          );
          
          if (menuDetail && menuDetail.product_set && menuDetail.product_set.items?.length > 0) {
            // Es un menú, expandir
            const menuName = menuDetail.product_set.menu_name || menuDetail.product_set.name || saleItem.descripcion;
            
            // Agregar encabezado del menú
            expandedItems.push({
              ...saleItem,
              descripcion: `${menuName} (Menú)`,
              isMenuHeader: true
            });
            
            // Agregar productos del menú
            menuDetail.product_set.items.forEach(menuItem => {
              if (menuItem.product && menuItem.quantity > 0) {
                expandedItems.push({
                  cantidad: menuItem.quantity,
                  descripcion: `  ↳ ${menuItem.product.name}`,
                  precio_unitario: parseFloat(menuItem.product.prices) || 0,
                  total_item: 0, // No mostrar total individual para productos de menú
                  isMenuProduct: true,
                  parentMenu: menuName
                });
              }
            });
          } else {
            // Producto regular
            expandedItems.push(saleItem);
          }
        });
        
        saleData.items = expandedItems;
        
        // Procesar indicaciones
        orderDetails.forEach((detail) => {
          detail.indication = detail.indication ? detail.indication : []
          const indication = detail?.indication.reduce((desc, indication) => {
            if (indication.quick_indications?.length) {
              indication.quick_indications.forEach((ind) => {
                desc += `${ind}, `;
              });
            }
            desc = !indication.description
              ? ` [${desc.slice(0, -2)}]`
              : `${desc} [${indication.description}]`;
            return desc;
          }, "");
          
          if (indication) {
            const item = saleData.items.find(
              (i) => i.descripcion === detail.product_name
            );
            if (item) item.descripcion += indication;
          }
        });
      }
      
      return saleData;
    };

    const sale = parseSale();

    const title = () => {
      switch (sale.codigo_tipo_documento) {
        case "01":
          return "FACTURA ELECTRÓNICA";
        case "03":
          return "BOLETA  DE VENTA ELECTRÓNICA";
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
      settingsStore,
      businessStore,
      tableStore,
      sale,
      title,
      info,
      generateQR,
      amountText,
      hasDiscounts,
      isCustomerMode,
      groupedByCustomer,
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
        th {
          font-size: 12px;
        }
        tfoot {
          font-weight: bold;
        }
        
        .menu-header {
          font-weight: bold;
          border-top: 1px solid #ddd;
        }
        
        .menu-product {
          font-style: italic;
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
