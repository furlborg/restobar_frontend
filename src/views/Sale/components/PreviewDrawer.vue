<template>
  <n-drawer
    id="PreviewDrawer"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="right"
    width="272px"
    :on-after-leave="() => (send = false)"
    :mask-closable="false"
    :on-esc="() => ($emit('update:show', false), $emit('canceled'))"
    :z-index="!previewOnly ? undefined : -1000000"
  >
    <n-drawer-content
      body-content-style="padding: 0;"
      footer-style="padding: 0; height: auto; display: flex; flex-direction: column;"
      :native-scrollbar="false"
    >
      <template #header>
        <n-page-header
          title="Previsualización"
          @back="() => ($emit('update:show', false), $emit('canceled'))"
        ></n-page-header>
      </template>
      <default-preset v-if="!preVoucher" ref="ticket" :data="data" />
      <preview-preset v-else ref="ticket" :data="data" />
      <template v-if="!previewOnly" #footer>
        <n-button class="fs-4" type="info" secondary block @click="generate">
          Imprimir
        </n-button>
        <div style="width: 272px; display: flex">
          <n-button-group>
            <n-button
              style="width: 90px"
              type="success"
              tertiary
              @click="send = true"
              :disabled="data.invoice_type === '80'"
            >
              <v-icon name="bi-whatsapp" />
            </n-button>
            <n-button style="width: 90px" type="info" tertiary disabled>
              <v-icon name="md-outgoingmail" />
            </n-button>
            <n-button
              style="width: 90px"
              type="warning"
              tertiary
              @click="generate(true)"
            >
              <v-icon name="fa-download" />
            </n-button>
          </n-button-group>
          <n-drawer
            v-model:show="send"
            placement="bottom"
            to="#PreviewDrawer"
            height="69"
          >
            <n-drawer-content body-content-style="padding: 0;">
              <n-input
                v-model:value="phoneNumber"
                placeholder=""
                @keypress="isNumber"
                :show-count="true"
                :maxlength="9"
              />
              <n-button
                type="success"
                secondary
                block
                :loading="loading"
                :disabled="phoneNumber.length < 9 || loading"
                @click="sendToWhatsapp"
              >
                <v-icon name="bi-whatsapp" />
                Enviar
              </n-button>
            </n-drawer-content>
          </n-drawer>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { usePrinterStore } from "@/store/modules/printer";
import { useSaleStore } from "@/store/modules/sale";
import { jsPDF } from "jspdf";
import DefaultPreset from "./pdf-presets/DefaultPreset";
import PreviewPreset from "./pdf-presets/PreviewPreset";
import { isNumber } from "@/utils";
import { sendWhatsapp } from "@/api/modules/sales";

export default defineComponent({
  name: "PreviewDrawer",
  components: {
    DefaultPreset,
    PreviewPreset,
  },
  emits: ["update:show", "printed", "canceled"],
  props: {
    show: {
      type: Boolean,
    },
    previewOnly: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
    },
    preVoucher: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const settingsStore = useSettingsStore();
    const printerStore = usePrinterStore();
    const saleStore = useSaleStore();
    const message = useMessage();
    const ticket = ref(null);

    const loading = ref(false);

    const send = ref(false);

    const phoneNumber = ref("");

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
                !props.preVoucher
                  ? `SALE#${props.data.id}#${saleStore.getSerieDescription(
                      props.data.serie
                    )}-${props.data.number}`
                  : `PREVOUCHER#${props.data.id}`
              );
            }
          }
          emit("printed");
          emit("update:show", false);
        },
      });
    };

    const sendToWhatsapp = () => {
      loading.value = true;
      sendWhatsapp(props.data.external_id, phoneNumber.value)
        .then((response) => {
          if (response.status === 200) {
            message.success("Envío exitoso!");
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          phoneNumber.value = "";
          loading.value = false;
          send.value = false;
        });
    };

    return {
      loading,
      ticket,
      generate,
      send,
      isNumber,
      sendToWhatsapp,
      phoneNumber,
    };
  },
});
</script>

<style lang="scss"></style>
