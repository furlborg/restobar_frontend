<template>
  <div id="DefaultTicket">
    <div class="ticket">
      <div class="ticket-header">
        <div
          class="ticket-header-title"
          :style="{
            fontSize: `${settingsStore.business_settings.printer.header_font_size}px`,
            textAlign:
              settingsStore.business_settings.printer.kitchen_ticket_format ===
              3
                ? 'right'
                : 'center',
          }"
        >
          {{ info.table || (!info.delivery_info ? "PARA LLEVAR" : "DELIVERY") }}
        </div>
        <div
          v-if="
            settingsStore.business_settings.printer.kitchen_ticket_format !== 3
          "
          class="ticket-header-subtitle"
          :style="{
            fontSize: `${settingsStore.business_settings.printer.sub_header_font_size}px`,
          }"
        >
          ORDEN #{{ info.id }}
        </div>
        <div
          v-if="isUpdate"
          class="ticket-header-subtitle"
          :style="{
            fontSize: `${settingsStore.business_settings.printer.sub_header_font_size}px`,
          }"
        >
          ACTUALIZACIÓN
        </div>
      </div>
      <div
        class="ticket-body"
        :style="{
          fontSize: `${settingsStore.business_settings.printer.body_font_size}px`,
        }"
      >
        <div
          class="ticket-body-info"
          :style="{
            fontSize: `${
              settingsStore.business_settings.printer.body_font_size + 1
            }px`,
          }"
        >
          <div>{{ info.created }}</div>
          <div>{{ info.username }}</div>
          <div v-if="info.order_type !== 'M' && data.ask_for" key="ask_for">
            REFERENCIA: {{ data.ask_for }}
          </div>
        </div>
        <template v-for="detail in infoDetails" :key="detail.id">
          <div class="ticket-body-item">
            <div>
              {{ getPrefix(detail.product_category)
              }}{{
                settingsStore.business_settings.printer
                  .kitchen_ticket_format !== 1
                  ? `${!isUpdate ? detail.quantity : detail.initial_quantity} x `
                  : ""
              }}{{ generateName(detail) }}
            </div>
            <div
              v-if="
                settingsStore.business_settings.printer
                  .kitchen_ticket_format === 1
              "
            >
              CANT: {{ !isUpdate ? detail.quantity : detail.initial_quantity }}
            </div>
            <div
              class="indication"
              :style="{
                fontSize: `${
                  settingsStore.business_settings.printer.body_font_size - 1
                }px`,
              }"
            >
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
                v-if="
                  info.order_type !== 'M' &&
                  detail.indication.some((ind) => ind.takeAway)
                "
                class="indication-extra"
              >
                PARA LLEVAR: {{ indicationTakeAways(detail.indication) }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div
        class="ticket-footer"
        :style="{
          fontSize: `${settingsStore.business_settings.printer.footer_font_size}px`,
        }"
      ></div>
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
          prefix = "[COMBO] >> ";
        } else {
          prefix = "[CARTA] >> ";
        }
      }
      return prefix;
    };

    const generateName = (detail) => {
      if (settingsStore.business_settings.printer.kitchen_ticket_format !== 2 && detail.product_category.toLowerCase().includes("combo")) {
        detail.product_name =
          detail.product_category +
          detail.product_description.replaceAll(", ", "+");
      }
      return detail.product_name;
    };

    return {
      info,
      getPrefix,
      infoDetails,
      generateName,
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
    &-subtitle {
      word-spacing: 5px;
    }
  }
  &-body {
    padding: 20px 0;
    font-weight: bold;
    word-spacing: 5px;
    &-info {
      margin-bottom: 10px;
    }
    &-item {
      border-top: 1px dashed;
      padding: 10px 0;
    }
    .indication {
      margin: 5px 0 5px 0;
      &-extra {
        margin: 5px 0 5px 0;
      }
    }
  }
  &-footer {
    font-weight: bold;
  }
}
</style>
