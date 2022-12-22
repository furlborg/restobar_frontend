<template>
  <div id="DefaultTicket">
    <div class="ticket">
      <div class="ticket-header">
        <div class="ticket-header-title">
          {{ info.table || (!info.delivery_info ? "PARA LLEVAR" : "DELIVERY") }}
        </div>
        <div class="ticket-header-subtitle">ORDEN #{{ info.id }}</div>
      </div>
      <div class="ticket-body">
        <div
          class="ticket-body-reference"
          v-if="info.order_type === 'P' && data.ask_for"
        >
          REFERENCIA: {{ data.ask_for }}
        </div>
        <template v-for="detail in infoDetails" :key="detail.id">
          <div class="ticket-body-item">
            <div>
              {{ getPrefix(detail.product_category)
              }}{{
                settingsStore.business_settings.printer
                  .kitchen_ticket_format === 2 && `${detail.quantity}x`
              }}{{ detail.product_name }}
            </div>
            <div
              v-if="
                settingsStore.business_settings.printer
                  .kitchen_ticket_format === 1
              "
            >
              CANT: {{ !isUpdate ? detail.quantity : detail.quantity }}
            </div>
            <div class="indication">
              <template
                v-for="(indication, index) in detail.indication"
                :key="index"
              >
                <div class="indication-item" v-if="!!indication.description">
                  -
                  {{
                    !indication.takeAway
                      ? indication.description
                      : indication.description + " [LLEVAR]"
                  }}
                </div>
              </template>
              <div
                v-if="detail.indication.some((ind) => ind.takeAway)"
                class="indication-extra"
              >
                PARA LLEVAR: {{ indicationTakeAways(detail.indication) }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="ticket-footer">
        <div>{{ info.created }}</div>
        <div>{{ info.username }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";

export default defineComponent({
  name: "DefaultTicket",
  props: {
    data: {
      type: Object,
    },
    place: {
      type: Object,
      default: undefined,
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const settingsStore = useSettingsStore();
    const tableStore = useTableStore();

    const info = computed(() => {
      let data = {
        ...props.data,
        order_details: !props.place
          ? props.data.order_details
          : props.data.order_details.filter(
              (detail) => detail.preparation_place === props.place.description
            ),
        table: !props.data.table
          ? ""
          : tableStore.getTableByID(props.data.table).description,
        json_sale: !props.data.json_sale
          ? ""
          : JSON.parse(props.data.json_sale),
      };
      return data;
    });

    const infoDetails = computed(() => {
      return info.value.order_details.map((detail) => {
        detail.indication = detail.indication.map((indication) => {
          let desc = "";
          if (indication.quick_indications.length) {
            indication.quick_indications.forEach((ind) => {
              desc += `${ind}, `;
            });
          }
          indication.description = !indication.description
            ? desc.slice(0, -2)
            : desc + indication.description;
          return indication;
        });
        return detail;
      });
    });

    const indicationTakeAways = (indication) => {
      return indication.reduce((acc, curVal) => {
        curVal.takeAway && acc++;
        return acc;
      }, 0);
    };

    const getPrefix = (cat) => {
      let prefix = "";
      if (settingsStore.business_settings.printer.show_cat) {
        if (cat.toLowerCase().includes("menu")) {
          prefix = "[MENU] ";
        } else if (cat.toLowerCase().includes("combo")) {
          prefix = "[COMBO] ";
        } else {
          prefix = "[CARTA] ";
        }
      }
      return prefix;
    };

    return {
      info,
      getPrefix,
      infoDetails,
      settingsStore,
      indicationTakeAways,
    };
  },
});
</script>

<style lang="scss" scoped>
.ticket {
  font-family: Arial, Helvetica, sans-serif;
  background-color: White;
  line-height: normal;
  width: 252px;
  margin: 0 10px 0 10px;
  &-header {
    font-weight: bold;
    text-align: center;
    margin: 10px 0 0 0;
    &-title {
      font-size: 18px;
    }
    &-subtitle {
      font-size: 16px;
    }
  }
  &-body {
    margin: 20px 0 20px 0;
    font-weight: bold;
    &-reference {
      margin-bottom: 10px;
      font-size: 14px;
    }
    &-item {
      font-size: 14px;
    }
    .indication {
      margin: 5px 0 5px 0;
      font-size: 12px;
      &-extra {
        margin: 5px 0 5px 0;
        font-size: 14px;
      }
    }
  }
  &-footer {
    font-weight: bold;
    font-size: 14px;
  }
}
</style>
