<template>
  <div id="PreviewPreset">
    <div class="ticket">
      <div class="ticket-header">
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
          {{ businessStore.business.ruc }}
        </div>
        <div class="ticket-header-info">
          {{ businessStore.business.fiscal_address }}
        </div>
        <div class="ticket-header-info">
          {{ businessStore.business.branchs[0].ubigee_description }}
        </div>
        <div class="ticket-header-info">
          {{ tableStore.getTableByID(data.table).description }}
        </div>
        <div class="ticket-header-info">PRE-CUENTA</div>
        <div class="ticket-header-info">Nº {{ data.id }}</div>
      </div>
      <div class="ticket-body">
        <div class="ticket-body-details">
          <table>
            <thead>
              <tr align="center">
                <td width="15%">CANT</td>
                <td width="45%">DESCRIPCIÓN</td>
                <td width="20%">PRECIO</td>
                <td width="20%">TOTAL</td>
              </tr>
            </thead>
            <tbody>
              <template v-for="(detail, index) in expandedOrderDetails" :key="`detail-${index}`">
                <tr v-if="detail.quantity > 0" :class="{ 'menu-header': detail.isMenuHeader, 'menu-product': detail.isMenuProduct }">
                  <td align="center">{{ detail.isMenuProduct ? '' : detail.quantity }}</td>
                  <td align="left" :style="detail.isMenuProduct ? 'font-size: 11px; color: #666;' : ''">
                    {{ detail.product_name }}
                  </td>
                  <td align="right">
                    {{ detail.isMenuProduct ? '' : detail.price.toFixed(2) }}
                  </td>
                  <td align="right">
                    {{ detail.isMenuProduct ? '' : parseFloat(detail.quantity * detail.price).toFixed(2) }}
                  </td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr>
                <td align="right" colspan="3">TOTAL:</td>
                <td align="right">
                  {{ orderTotal.toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="ticket-footer">
        <div>F. EMISIÓN: {{ data.created }}</div>
        <div>USUARIO: {{ data.username }}</div>
        <div
          v-if="settingsStore.business_settings.printer.extra_text"
          style="padding: 10px"
          align="center"
        >
          EN EL PADRE NO COBRAMOS POR SERVICIO. AQUI AMAMOS LAS PROPINAS
        </div>
          <div>
              {{data.observations || ''}}
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useTableStore } from "@/store/modules/table";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";
import { expandOrderDetails, calculateOrderTotal } from "@/utils/menuExpander.js";

export default defineComponent({
  name: "PreviewPreset",
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
    const tableStore = useTableStore();
    const settingsStore = useSettingsStore();
    const businessStore = useBusinessStore();

    // Expandir menús para mostrar productos individuales
    const expandedOrderDetails = computed(() => {
      console.log('PreviewPreset - order_details:', props.data.order_details);
      return expandOrderDetails(props.data.order_details || []);
    });

    // Calcular el total correctamente incluyendo menús
    const orderTotal = computed(() => {
      return calculateOrderTotal(props.data.order_details || []);
    });
    debugger;

    return {
      tableStore,
      businessStore,
      settingsStore,
      expandedOrderDetails,
      orderTotal,
    };
  },
});
</script>

<style lang="scss" scoped>
.ticket {
  font-family: Arial, Helvetica, sans-serif;
  background-color: White;
  font-weight: bold;
  line-height: normal;
  min-width: 272px;

  &-header {
    text-align: center;
    font-size: 14px;
    margin-bottom: 5px;
  }

  &-body {
    font-size: 14px;
    table td,
    th {
      vertical-align: top;
    }
    &-details {
      width: 272px;
      tbody {
        tr {
          &:first-child {
            td {
              border-top: 1px dashed;
            }
          }
          &:last-child {
            td {
              border-bottom: 1px dashed;
            }
          }
        }
        
        .menu-header {
          font-weight: bold;
          border-top: 1px solid #ddd;
        }
        
        .menu-product {
          font-style: italic;
        }
      }
      tfoot {
        tr {
          td {
            border-bottom: 1px dashed;
          }
        }
      }
    }
  }
  &-footer {
    font-size: 14px;
  }
}
</style>
