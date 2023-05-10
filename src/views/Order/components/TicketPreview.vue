<template>
  <n-drawer
    id="TicketPreview"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="right"
    width="272px"
    :z-index="!hidden ? undefined : -1000000"
  >
    <n-drawer-content
      body-content-style="padding: 0;"
      :native-scrollbar="false"
    >
      <template v-for="(place, i) in places" :key="`product-${place.id}`">
        <default-ticket
          :ref="(el) => (tickets[i] = el)"
          :data="data"
          :place="place"
          :isUpdate="isUpdate"
        />
        <n-button type="info" secondary block @click="printTicket(i, place)">
          <template #icon>
            <v-icon name="md-print-round" />
          </template>
          {{ place.description }}
        </n-button>
      </template>
      <template v-if="settingsStore.business_settings.printer.manage_fittings">
        <template
          v-for="(place, i) in fittingPlaces"
          :key="`fitting-${place.id}`"
        >
          <fitting-ticket
            :ref="(el) => (fittings[i] = el)"
            :data="data"
            :place="place"
            :isUpdate="isUpdate"
          />
          <n-button type="info" secondary block @click="printFitting(i, place)">
            <template #icon>
              <v-icon name="md-print-round" />
            </template>
            {{ place.description }}
          </n-button>
        </template>
      </template>
      <template v-if="data.order_type === 'D'">
        <ticket-delivery ref="delivery" :data="data" />
        <n-button type="info" secondary block @click="printDelivery">
          <template #icon>
            <v-icon name="md-print-round" />
          </template>
          DELIVERY
        </n-button>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import DefaultTicket from "./ticket-presets/DefaultTicket";
import FittingTicket from "./ticket-presets/FittingTicket";
import TicketDelivery from "./ticket-presets/TicketDelivery";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { usePrinterStore } from "@/store/modules/printer";
import { jsPDF } from "jspdf";

export default defineComponent({
  name: "TicketPreview",
  components: {
    DefaultTicket,
    FittingTicket,
    TicketDelivery,
  },
  emits: ["update:show", "printed", "canceled"],
  props: {
    show: {
      type: Boolean,
    },
    data: {
      type: Object,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const settingsStore = useSettingsStore();
    const printerStore = usePrinterStore();
    const productStore = useProductStore();
    const tickets = ref([]);
    const fittings = ref([]);
    const delivery = ref(null);

    const places = computed(() => {
      return productStore.places.filter((place) =>
        props.data.order_details.some(
          (detail) => detail.preparation_place === place.description
        )
      );
    });

    const printTicket = (i, place) => {
      const ticket = tickets.value[i];
      const format = [ticket.$el.clientWidth, ticket.$el.clientHeight + 30];
      const doc = new jsPDF({
        unit: "px",
        format: format,
        orientation: "m",
        hotfixes: ["px_scaling"],
      });
      doc.html(ticket.$el.innerHTML, {
        margin: settingsStore.business_settings.printer.margins,
        callback: async function (doc) {
          // doc.save();
          await printerStore.printTicket(
            doc,
            format,
            `ORDER#${props.data.id}#${place.description}`,
            place.printer_name
          );
        },
      });
    };

    const printFitting = (i, place) => {
      const ticket = fittings.value[i];
      const format = [ticket.$el.clientWidth, ticket.$el.clientHeight + 30];
      const doc = new jsPDF({
        unit: "px",
        format: format,
        orientation: "m",
        hotfixes: ["px_scaling"],
      });
      doc.html(ticket.$el.innerHTML, {
        margin: settingsStore.business_settings.printer.margins,
        callback: async function (doc) {
          // doc.save();
          await printerStore.printTicket(
            doc,
            format,
            `ORDER#${props.data.id}#${place.description}`,
            place.printer_name
          );
        },
      });
    };

    const fittingPlaces = computed(() => {
      return productStore.places.filter((place) =>
        props.data.order_details.some(
          (detail) =>
            detail.product_fitting?.preparation_place === place.description
        )
      );
    });

    const printDelivery = () => {
      const format = [
        delivery.value.$el.clientWidth,
        delivery.value.$el.clientHeight + 10,
      ];
      const doc = new jsPDF({
        unit: "px",
        format: format,
        orientation: "m",
        hotfixes: ["px_scaling"],
      });
      doc.html(delivery.value.$el.innerHTML, {
        callback: async function (doc) {
          if (settingsStore.business_settings.printer.native_printing) {
            doc.autoPrint();
            const hiddFrame = document.createElement("iframe");
            hiddFrame.style.position = "fixed";
            hiddFrame.style.width = "1px";
            hiddFrame.style.height = "1px";
            hiddFrame.style.opacity = "0.01";
            hiddFrame.src = doc.output("bloburl");
            document.body.appendChild(hiddFrame);
          } else {
            await printerStore.printTicket(
              doc,
              format,
              `DELIVERY#${props.data.id}`
            );
          }
        },
      });
    };

    const generate = () => {
      places.value.forEach((place, i) => {
        printTicket(i, place);
      });
      if (settingsStore.business_settings.printer.manage_fittings) {
        fittingPlaces.value.forEach((place, i) => {
          printFitting(i, place);
        });
      }
      if (
        props.data.order_type === "D" &&
        settingsStore.business_settings.printer.print_html
      ) {
        printDelivery();
      }
      emit("printed");
      emit("update:show", false);
    };

    return {
      tickets,
      delivery,
      printTicket,
      printFitting,
      printDelivery,
      places,
      fittingPlaces,
      fittings,
      generate,
      settingsStore,
    };
  },
});
</script>

<style lang="scss" scoped></style>
