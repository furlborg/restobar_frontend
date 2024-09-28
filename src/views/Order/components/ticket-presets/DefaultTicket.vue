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
          <template
            v-if="
              settingsStore.business_settings.printer.info_location === 'header'
            "
          >
            <div>{{ info.created }}</div>
            <div>{{ info.username }}</div>
          </template>
          <div v-if="info.order_type !== 'M' && data.ask_for" key="ask_for">
            REFERENCIA: {{ data.ask_for }}
          </div>
        </div>
        <template v-if="info.order_details.length">
          <template
            v-if="
              settingsStore.business_settings.printer.kitchen_ticket_format ===
              4
            "
          >
            <table style="width: 100%">
              <thead>
                <tr>
                  <th width="20%">CANT</th>
                  <th
                    :width="
                      !settingsStore.business_settings.printer
                        .show_product_price
                        ? '80%'
                        : '60%'
                    "
                  >
                    PRODUCTO
                  </th>
                  <th
                    v-if="
                      settingsStore.business_settings.printer.show_product_price
                    "
                    width="20%"
                  >
                    PRC
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in info.order_details" :key="detail.id">
                  <td align="center">
                    {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
                  </td>
                  <td>
                    {{ getPrefix(detail.product_category)
                    }}{{ detail.product_name
                    }}{{ generateIndication(detail.indication) }}
                  </td>
                  <td
                    v-if="
                      settingsStore.business_settings.printer.show_product_price
                    "
                  >
                    {{ detail.price.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
          <template v-else>
            <template v-for="detail in info.order_details" :key="detail.id">
              <div class="ticket-body-item">
                <div>
                  {{ getPrefix(detail.product_category)
                  }}{{
                    settingsStore.business_settings.printer
                      .kitchen_ticket_format !== 1
                      ? `${
                          !!isUpdate ? detail.quantity : detail.initial_quantity
                        } x `
                      : ""
                  }}{{ detail.product_name }}
                </div>
                <div
                  v-if="
                    settingsStore.business_settings.printer
                      .kitchen_ticket_format === 1
                  "
                >
                  CANT:
                  {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
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
                    v-if="
                      !!detail.product_description &&
                      settingsStore.business_settings.printer
                        .kitchen_ticket_format !== 3
                    "
                  >
                    <div
                      v-for="desc in detail.product_description.split(',')"
                      :key="desc"
                    >
                      *{{ desc }}
                    </div>
                  </template>
                  <template
                    v-for="(indication, index) in detail.indication"
                    :key="index"
                  >
                    <div
                      class="indication-item"
                      v-if="!!indication.description"
                    >
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
                      info.order_type === 'M' &&
                      detail.indication.some((ind) => ind.takeAway)
                    "
                    class="indication-extra"
                  >
                    PARA LLEVAR: {{ indicationTakeAways(detail.indication) }}
                  </div>
                </div>
              </div>
            </template>
          </template>
        </template>
        <template
          v-if="
            settingsStore.business_settings.printer.manage_fittings &&
            !place.is_main &&
            fitting_info.order_details.length
          "
        >
          <template
            v-if="
              settingsStore.business_settings.printer.kitchen_ticket_format ===
              4
            "
          >
            <table style="width: 100%">
              <thead>
                <tr>
                  <th width="20%">CANT.</th>
                  <th width="80%">GUARNICIÓN</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="detail in fitting_info.order_details"
                  :key="`fitting-${detail.id}`"
                >
                  <td align="center">
                    {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
                  </td>
                  <td>
                    {{ detail.product_fitting.name }} ({{
                      detail.product_name
                    }}){{ generateIndication(detail.indication) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
          <template v-else>
            <template
              v-for="detail in fitting_info.order_details"
              :key="`fitting-${detail.id}`"
            >
              <div class="ticket-body-item">
                <div>
                  {{
                    settingsStore.business_settings.printer
                      .kitchen_ticket_format !== 1
                      ? `${
                          !!isUpdate ? detail.quantity : detail.initial_quantity
                        } x `
                      : ""
                  }}{{ detail.product_fitting.name }} ({{
                    detail.product_name
                  }}){{ generateIndication(detail.indication) }}
                </div>
                <div
                  v-if="
                    settingsStore.business_settings.printer
                      .kitchen_ticket_format === 1
                  "
                >
                  CANT:
                  {{ !!isUpdate ? detail.quantity : detail.initial_quantity }}
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
                    v-if="
                      !!detail.product_description &&
                      settingsStore.business_settings.printer
                        .kitchen_ticket_format !== 3
                    "
                  >
                    <div
                      v-for="desc in detail.product_description.split(',')"
                      :key="desc"
                    >
                      *{{ desc }}
                    </div>
                  </template>
                  <template
                    v-for="(indication, index) in detail.indication"
                    :key="index"
                  >
                    <div
                      class="indication-item"
                      v-if="!!indication.description"
                    >
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
          </template>
        </template>
      </div>
      <div
        class="ticket-footer"
        :style="{
          fontSize: `${settingsStore.business_settings.printer.footer_font_size}px`,
        }"
      >
        <template
          v-if="
            settingsStore.business_settings.printer.info_location === 'footer'
          "
        >
          <div>{{ isUpdate ? info.created : info.modified }}</div>
          <div>{{ info.username }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
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

    const generateData = () => {
      let data = {
        ...props.data,
        order_details: !props.place
          ? props.data.order_details
          : props.data.order_details.filter((detail) =>
              settingsStore.business_settings.printer.subticket_mode &&
              props.place.is_main
                ? !!detail.preparation_place
                : detail.preparation_place === props.place.description
            ),
        table: !props.data.table
          ? ""
          : tableStore.getTableByID(props.data.table).description,
        json_sale: !props.data.json_sale
          ? ""
          : JSON.parse(props.data.json_sale),
      };
      data.order_details.forEach((detail) => {
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
        if (
          detail.product_category.toLowerCase().includes("combo") &&
          settingsStore.business_settings.printer.kitchen_ticket_format === 3
        ) {
          detail.product_name =
            detail.product_category +
            detail.product_description.replaceAll(",", "+");
        }
      });
      return data;
    };

    const info = ref(generateData());

      const generateFittingData = () => {
          let data = {
              ...props.data,
              order_details: !props.place
                  ? props.data.order_details
                  : props.data.order_details.filter(
                      (detail) =>
                          detail.product_fitting?.preparation_place ===
                          props.place.description
                  ),
              table: !props.data.table
                  ? ""
                  : tableStore.getTableByID(props.data.table).description,
              json_sale: !props.data.json_sale
                  ? ""
                  : JSON.parse(props.data.json_sale)
          };
          data.order_details.forEach((detail) => {
              detail.indication = detail.indication.map((indication) => {
                  let desc = "";
                  if(indication.quick_indications.length) {
                      indication.quick_indications.forEach((ind) => {
                          desc += `${ind}, `;
                      });
                  }
                  indication.description = !indication.description
                      ? desc.slice(0, -2)
                      : desc + indication.description;
                  return indication;
              });
          });
          return data;
      };

    const fitting_info = ref(generateFittingData());

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
        } else if (cat.toLowerCase().includes("porcion")) {
          prefix = "[PORCION] >> ";
        } else {
          prefix = "[CARTA] >> ";
        }
      }
      return prefix;
    };

    const generateIndication = (ind) => {
      let text = "";
      for (const indication of ind) {
          if(!indication.description.includes('[]') || indication.quick_indications.length > 0) text += ` [${indication.description}]`;
      }
      return text;
    };

    return {
      info,
      fitting_info,
      getPrefix,
      generateIndication,
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
  margin: 0 10px;
  &-header {
    font-weight: bold;
    text-align: center;
    margin-top: 10px;
    &-subtitle {
      word-spacing: 5px;
    }
  }
  table {
    th {
      border-bottom: 1px dotted black;
    }
    tr {
      td {
        border-bottom: 1px dotted black;
      }
    }
  }
  &-body {
    padding-top: 20px;
    padding-bottom: 10px;
    font-weight: bold;
    word-spacing: 5px;
    &-info {
      margin-bottom: 10px;
    }
    &-item {
      border-top: 1px dashed;
      padding-top: 10px;
    }
    .indication {
      margin-top: 5px;
      &-extra {
        margin-top: 5px;
      }
    }
  }
  &-footer {
    font-weight: bold;
  }
}
</style>
