<template>
  <n-drawer
    id="SaleCreditDrawer"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="right"
    width="272px"
    :on-esc="() => ($emit('update:show', false), $emit('canceled'))"
    :z-index="!previewOnly ? undefined : -1000000"
  >
    <n-drawer-content
      body-content-style="padding: 0;"
      :native-scrollbar="false"
      footer-style="padding: 0;"
    >
      <template #header>
        <n-page-header
          title="Previsualización"
          @back="() => ($emit('update:show', false), $emit('canceled'))"
        />
      </template>
      <sale-credit-ticket ref="ticket" :data="data" :payment="payment" />
      <template v-if="!previewOnly" #footer>
        <n-button class="fs-4" type="info" secondary block @click="generate">
          Imprimir
        </n-button>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script>
import { defineComponent, ref } from "vue";
import { jsPDF } from "jspdf";
// import { useSettingsStore } from "@/store/modules/settings";
// import { usePrinterStore } from "@/store/modules/printer";
import { useSaleStore } from "@/store/modules/sale";
import SaleCreditTicket from "./pdf-presets/SaleCreditTicket";

export default defineComponent({
  name: "SaleCreditDrawer",
  components: {
    SaleCreditTicket,
  },
  emits: ["update:show", "printed", "canceled"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    previewOnly: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
    },
    payment: {
      type: Number,
    },
  },
  setup(props, { emit }) {
    // const settingsStore = useSettingsStore();
    // const printerStore = usePrinterStore();
    const saleStore = useSaleStore();

    const ticket = ref(null);

    const generate = (save = false) => {
      const format = [
        ticket.value.$el.clientWidth,
        ticket.value.$el.clientHeight + 10,
      ];
      const doc = new jsPDF({
        unit: "px",
        format: format,
        orientation: "p",
        hotfixes: ["px_scaling"],
      });
      doc.html(ticket.value.$el.innerHTML, {
        callback: async function (doc) {
          if (save === true) {
            doc.save(
              `${saleStore.getSerieDescription(props.data.serie)}-${
                props.data.number
              }`
            );
          } else {
            // if (settingsStore.business_settings.printer.native_printing) {
              doc.autoPrint();
              const hiddFrame = document.createElement("iframe");
              hiddFrame.style.position = "fixed";
              hiddFrame.style.width = "1px";
              hiddFrame.style.height = "1px";
              hiddFrame.style.opacity = "0.01";
              hiddFrame.src = doc.output("bloburl");
              document.body.appendChild(hiddFrame);
            // }
            // else {
            //   await printerStore.printTicket(
            //     doc,
            //     format,
            //     `SALEPAYMENT#${props.data.id}#${saleStore.getSerieDescription(
            //       props.data.serie
            //     )}-${props.data.number}`
            //   );
            // }
          }
          emit("printed");
          emit("update:show", false);
        },
      });
    };

    return {
      ticket,
      generate,
    };
  },
});
</script>

<style lang="scss" scoped></style>
