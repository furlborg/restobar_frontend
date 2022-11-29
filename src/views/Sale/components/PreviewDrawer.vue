<template>
  <n-drawer
    id="PreviewDrawer"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="right"
    width="272px"
    :on-after-leave="() => (send = false)"
  >
    <n-drawer-content
      body-content-style="padding: 0;"
      footer-style="padding: 0; height: auto; display: flex; flex-direction: column;"
      :native-scrollbar="false"
    >
      <!-- <template #header>
        <n-button type="success" tertiary>
          <v-icon name="bi-whatsapp" />
        </n-button>
      </template> -->
      <default-preset ref="ticket" :data="data" />
      <template #footer>
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
            <n-button style="width: 90px" type="warning" tertiary>
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
                :disabled="phoneNumber.length < 9"
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
import { printPdf } from "@/utils/printer";
import { jsPDF } from "jspdf";
import DefaultPreset from "./pdf-presets/DefaultPreset";
import { isNumber } from "@/utils";
import { sendWhatsapp } from "@/api/modules/sales";

export default defineComponent({
  name: "PreviewDrawer",
  components: {
    DefaultPreset,
  },
  props: {
    show: {
      type: Boolean,
    },
    data: {
      type: Object,
    },
  },
  setup(props) {
    const ticket = ref(null);

    const send = ref(false);

    const phoneNumber = ref("");

    const generate = () => {
      const format = [
        ticket.value.$el.clientWidth,
        ticket.value.$el.clientHeight + 10,
      ];
      const doc = new jsPDF({
        unit: "px",
        format: format,
        hotfixes: ["px_scaling"],
      });
      doc.html(ticket.value.$el.innerHTML, {
        callback: function (doc) {
          // doc.save();
          printPdf(doc, format);
        },
      });
    };

    const sendToWhatsapp = () => {
      console.log(props.data.external_id, phoneNumber.value);
      sendWhatsapp(props.data.external_id, phoneNumber.value)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error);
        });
    };

    return {
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
