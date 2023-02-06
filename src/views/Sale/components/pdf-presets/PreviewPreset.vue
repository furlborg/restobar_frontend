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
              <template
                v-for="(detail, index) in data.order_details"
                :key="index"
              >
                <tr v-if="detail.quantity > 0">
                  <td align="center">{{ detail.quantity }}</td>
                  <td align="left">{{ detail.product_name }}</td>
                  <td align="right">{{ detail.price.toFixed(2) }}</td>
                  <td align="right">
                    {{
                      parseFloat(
                        detail.initial_quantity * detail.price
                      ).toFixed(2)
                    }}
                  </td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr>
                <td align="right" colspan="3">TOTAL:</td>
                <td align="right">
                  {{
                    data.order_details
                      .reduce(
                        (acc, curVal) =>
                          (acc += curVal.quantity * curVal.price),
                        0
                      )
                      .toFixed(2)
                  }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="ticket-footer">
        <div>F. EMISIÓN: {{ data.created }}</div>
        <div>USUARIO: {{ data.username }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useTableStore } from "@/store/modules/table";
import { useSettingsStore } from "@/store/modules/settings";
import { useBusinessStore } from "@/store/modules/business";

export default defineComponent({
  name: "PreviewPreset",
  props: {
    data: {
      type: Object,
    },
  },
  setup(props) {
    const tableStore = useTableStore();
    const settingsStore = useSettingsStore();
    const businessStore = useBusinessStore();

    return {
      tableStore,
      businessStore,
      settingsStore,
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
