<template>
  <n-drawer
    id="TicketPreview"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    placement="right"
    width="272px"
    :z-index="!hidden ? undefined : -1000000"
  >
      <n-drawer-content body-content-style="padding: 0;" :native-scrollbar="false" >
          <template v-for="(place, i) in places" :key="`product-${place.id}`">
              <default-ticket
                      :ref="(el) => (tickets[i] = el)"
                      :data="data"
                      :place="place"
                      :isUpdate="isUpdate"
              />
              <n-button type="info" secondary block @click="printTicket(i, place)">
                  <template #icon>
                      <v-icon name="md-print-round"/>
                  </template>
                  {{ place.description }}
              </n-button>
          </template>

          <template v-if="data.order_type === 'D'">
              <ticket-delivery ref="delivery" :data="data"/>
              <n-button type="info" secondary block @click="printDelivery">
                  <template #icon>
                      <v-icon name="md-print-round"/>
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
import TicketDelivery from "./ticket-presets/TicketDelivery";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { usePrinterStore } from "@/store/modules/printer";
import { jsPDF } from "jspdf";
import { useMessage } from "naive-ui";
import { useTableStore } from "@/store/modules/table";

export default defineComponent({
  name: "TicketPreview",
  components: {
    DefaultTicket,
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
    const message = useMessage();
    const tickets = ref([]);
    const fittings = ref([]);
    const delivery = ref(null);
    let socket = null;
    const tableStore = useTableStore();
      // eslint-disable-next-line no-undef

    const places = computed(() => {
      return productStore.places.filter((place) =>
        props.data.order_details.some(
          (detail) =>
            detail.preparation_place === place.description ||
            detail.product_fitting?.preparation_place === place.description
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
              hotfixes: ["px_scaling"]
          });

          doc.html(ticket.$el.innerHTML, {
              margin: settingsStore.business_settings.printer.margins,
              callback: async function() {
                  console.log(props.data);
                  const sendTicketData = () => {
                      const jsonTicket = {
                          "printer_name": place.printer_name,
                          "ticket_type": "ORDER",
                          "tittle": {
                              "table": "",
                              "order": props.data.id
                          },
                          "header": {
                              "date": props.data.created,
                              "reference": props.data.ask_for,
                              "username": props.data.username
                          },
                          "ticket_content": props.data.order_details.filter(pl => pl.preparation_place === place.description).map(it => ({
                              "id": it.id,
                              "cantidad": it.quantity,
                              "descripcion": it.product_name,
                              "indicaciones": it.indication.filter(indicate => {
                                  return (
                                      (!indicate.description.includes("[]") || indicate.quick_indications.length > 0) &&
                                      indicate.description !== ""
                                  );
                              }).map(indicate => indicate.description) || ""
                          }))
                      };
                      console.log(tableStore.getTableByID(props.data.table).description);

                      jsonTicket.tittle.table = tableStore.getTableByID(props.data.table).description;
                      if (props.data.delivery_info || props.data.table) delete jsonTicket.header.reference;
                      if (!props.data.table) jsonTicket.tittle.table = !props.data.delivery_info ? "PARA LLEVAR" : "DELIVERY";

                      console.log("Enviando ticket:", jsonTicket);
                      socket.send(JSON.stringify(jsonTicket));  // Aquí se envía el ticket cuando el WebSocket está abierto
                  };

                  // Verificar si el WebSocket necesita ser creado
                  if (!socket || socket.readyState === WebSocket.CLOSED) {
                      console.log("Iniciando WebSocket...");
                      // eslint-disable-next-line no-undef
                      const apiUrl = process.env.VUE_APP_API_URL.replace(/^https?:\/\//, '');

                      const socketUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${apiUrl}/ws/print/`;
                      socket = new WebSocket(socketUrl);

                      socket.onopen = function(e) {
                          console.log("Conexión WebSocket abierta", e);
                          sendTicketData();  // Enviar los datos cuando la conexión esté abierta
                      };

                      socket.onerror = function(error) {
                          console.log("Error en WebSocket", error);
                          message.error("Error al conectarse al WebSocket");
                      };

                      socket.onmessage = function(event) {
                          if (event.data.includes("success")) {
                              console.log("Mensaje recibido del servidor", JSON.parse(event.data).success);
                              message.success(JSON.parse(event.data).success);
                          }
                      };

                      socket.onclose = function(event) {
                          console.log("Conexión WebSocket cerrada", event);
                      };

                  } else if (socket.readyState === WebSocket.OPEN) {
                      // Si el WebSocket ya está abierto, simplemente enviamos el ticket
                      console.log("WebSocket ya abierto, enviando ticket directamente.");
                      sendTicketData();
                  }
              }
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
              delivery.value.$el.clientHeight + 10
          ];
          const doc = new jsPDF({
              unit: "px",
              format: format,
              orientation: "m",
              hotfixes: ["px_scaling"]
          });

          doc.html(delivery.value.$el.innerHTML, {
              callback: async function (doc) {
                  if (settingsStore.business_settings.printer.native_printing) {
                      doc.autoPrint();
                      const hiddeFrame = document.createElement("iframe");
                      hiddeFrame.style.position = "fixed";
                      hiddeFrame.style.width = "1px";
                      hiddeFrame.style.height = "1px";
                      hiddeFrame.style.opacity = "0.01";
                      hiddeFrame.src = doc.output("bloburl");
                      document.body.appendChild(hiddeFrame);
                  } else {
                      const sendTicketData = () => {
                          const jsonTicket = {
                              "printer_name": settingsStore.businessSettings.sale.printer_name,
                              "ticket_type": "DELIVERY",
                              "tittle": {
                                  "table": "DELIVERY",
                                  "order": props.data.id
                              },
                              "header": {
                                  "invoice": `${JSON.parse(props.data.json_sale)?.serie_documento}-${JSON.parse(props.data.json_sale)?.numero_documento}`,
                                  "fecha": JSON.parse(props.data.json_sale).fecha_de_emision,
                                  "customer": props.data.delivery_info.person,
                                  "reference": props.data.ask_for,
                                  "phone": props.data.delivery_info.phone,
                                  "address": props.data.delivery_info.address,
                                  "payment_method": JSON.parse(props.data.json_sale).informacion_adicional.split("|")[2],
                                  "usuario": props.data.username
                              },
                              "ticket_content": JSON.parse(props.data.json_sale).items.map(it => ({
                                  "cantidad": it.cantidad,
                                  "descripcion": it.descripcion,
                                  "precio": parseFloat(it?.["precio_unitario"].toFixed(2)),
                                  "total": parseFloat(it?.["total_item"].toFixed(2))
                              })),
                              "totals": {
                                  "exonerado":JSON.parse(props.data.json_sale).totales.total_operaciones_exoneradas  ,
                                  "gravado":JSON.parse(props.data.json_sale).totales.total_operaciones_gravadas  ,
                                  "icbper":JSON.parse(props.data.json_sale).totales.total_impuestos_bolsa_plastica ,
                                  "igv": JSON.parse(props.data.json_sale).totales.total_igv ,
                                  "total": JSON.parse(props.data.json_sale).totales.total_venta ,
                                  "pago": parseFloat(props.data.given_amount),
                                  "vuelto": parseFloat((props.data.given_amount - JSON.parse(props.data.json_sale)?.["totales"]?.["total_venta"]).toFixed(2))
                              },
                              "footer": {
                                  "repartidor": props.data.delivery_info.deliveryman
                              }
                          };
                          socket.send(JSON.stringify(jsonTicket));
                      };

                      // Iniciar WebSocket solo si no existe o está cerrado
                      // eslint-disable-next-line no-undef
                      const apiUrl = process.env.VUE_APP_API_URL.replace(/^https?:\/\//, "");
                      const socketUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${apiUrl}/ws/print/`;

                      if (!socket || socket.readyState === WebSocket.CLOSED) {
                          socket = new WebSocket(socketUrl);

                          socket.onopen = function (e) {
                              console.log("Conexión WebSocket abierta", e);
                              sendTicketData(); // Enviar datos una vez se abre el WebSocket
                          };

                          socket.onerror = function (error) {
                              console.log("Error en WebSocket", error);
                              message.error("Error en la conexión WebSocket");
                          };

                          socket.onmessage = function (event) {
                              if (event.data.includes("success")) {
                                  console.log("Mensaje recibido del servidor", JSON.parse(event.data).success);
                                  message.success("Impresión completada con éxito");
                              }
                          };

                          socket.onclose = function () {
                              console.log("Conexión WebSocket cerrada");
                          };
                      } else if (socket.readyState === WebSocket.OPEN) {
                          // Si el WebSocket ya está abierto, envía el ticket
                          sendTicketData();
                      } else {
                          console.log("Esperando conexión WebSocket...");
                      }
                  }
              }
          });
      };


      const generate = () => {
      places.value.forEach((place, i) => {
        printTicket(i, place);
      });
      // if (settingsStore.business_settings.printer.manage_fittings) {
      //   fittingPlaces.value.forEach((place, i) => {
      //     printFitting(i, place);
      //   });
      // }
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
