<template>
  <div id="PreviewPreset">
    <div class="ticket">
      <div class="ticket-header">
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
        <div class="ticket-header-info">ORDEN #{{ data.id }}</div>
        <div class="ticket-header-info">PRE CUENTA</div>
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
              <tr v-for="(detail, index) in data.order_details" :key="index">
                <td align="center">{{ detail.initial_quantity }}</td>
                <td align="left">{{ detail.product_name }}</td>
                <td align="right">{{ detail.price.toFixed(2) }}</td>
                <td align="right">
                  {{
                    parseFloat(detail.initial_quantity * detail.price).toFixed(
                      2
                    )
                  }}
                </td>
              </tr>
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
        <div>MESA: {{ tableStore.getTableByID(data.table).description }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useTableStore } from "@/store/modules/table";
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
    const businessStore = useBusinessStore();

    return {
      tableStore,
      businessStore,
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
    font-size: 12px;
    margin-bottom: 5px;
  }

  &-body {
    font-size: 10px;
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
