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
            <default-preset v-if="!preVoucher" ref="ticket" :data="data"/>
            <preview-preset v-else ref="ticket" :data="data"/>
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
                            <v-icon name="bi-whatsapp"/>
                        </n-button>
                        <n-button style="width: 90px" type="info" tertiary disabled>
                            <v-icon name="md-outgoingmail"/>
                        </n-button>
                        <n-button
                                style="width: 90px"
                                type="warning"
                                tertiary
                                @click="generate(true)"
                        >
                            <v-icon name="fa-download"/>
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
                                <v-icon name="bi-whatsapp"/>
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
import { defineComponent, ref, watchEffect } from "vue";
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
        PreviewPreset
    },
    emits: ["update:show", "printed", "canceled"],
    props: {
        show: {
            type: Boolean
        },
        previewOnly: {
            type: Boolean,
            default: false
        },
        data: {
            type: Object
        },
        preVoucher: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const settingsStore = useSettingsStore();
        const printerStore = usePrinterStore();
        const saleStore = useSaleStore();
        const totalEnterPulse = ref(0);

        const message = useMessage();

        const ticket = ref(null);

        const loading = ref(false);

        const send = ref(false);

        const phoneNumber = ref("");

        const onKeyDown = (event) => {
            if(event.keyCode === 13 || event.keyCode === 12) {
                totalEnterPulse.value += 1;
            }
        };

        watchEffect(() => {
            if(props.show && !props.preVoucher && !props.previewOnly) {
                window.addEventListener("keydown", onKeyDown);
                if(totalEnterPulse.value >= 3 && totalEnterPulse.value <= 4) {
                    generate();
                    message.success(`"Total de pulsaciones: ", ${totalEnterPulse.value}, "si no se imprime es porque el qz esta mal configurado..."`);
                }
            }
        });

        const generate = (save = false) => {
            const format = [
                ticket.value.$el.clientWidth,
                ticket.value.$el.clientHeight + 10
            ];
            const doc = new jsPDF({
                unit: "px",
                format: format,
                orientation: "p",
                hotfixes: ["px_scaling"]
            });
            doc.html(ticket.value.$el.innerHTML, {
                callback: async function(doc) {
                    if(save === true) {
                        doc.save(
                            `${saleStore.getSerieDescription(props.data.serie)}-${
                                props.data.number
                            }`
                        );
                    } else {
                        if(settingsStore.business_settings.printer.native_printing) {
                            doc.autoPrint();
                            const hiddFrame = document.createElement("iframe");
                            hiddFrame.style.position = "fixed";
                            hiddFrame.style.width = "1px";
                            hiddFrame.style.height = "1px";
                            hiddFrame.style.opacity = "0.01";
                            hiddFrame.src = doc.output("bloburl");
                            document.body.appendChild(hiddFrame);
                        } else {
                            console.log("xd: ", props.data);
                            console.log("xd: ", props.preVoucher);
                            if(props.preVoucher) {
                                const socket = new WebSocket(`${settingsStore?.business_settings.qz_config.wbsockets_host}/print`);
                                socket.onopen = function() {
                                    // Enviar el mensaje JSON
                                    const jsonTicket = {
                                        "printer_name": "DEMO",
                                        "ticket_type": "PRE-ACCOUNT",
                                        "header": {
                                            "logo": "",
                                            "ruc": 20145965384,
                                            "company": "BRAZZERS",
                                            "address": "JR. SERAFIN FILOMENO S/N",
                                            "table": "MESA 1",
                                            "order": 25653
                                        },
                                        "ticket_content": [
                                            {
                                                "cantidad": 2,
                                                "descripcion": "Ceviche de Caballo",
                                                "precio": 20,
                                                "total": 40
                                            },
                                            {
                                                "cantidad": 4,
                                                "descripcion": "Inca Cola 2L",
                                                "precio": 12,
                                                "total": 48
                                            },
                                            {
                                                "cantidad": 6,
                                                "descripcion": "Cerveza pilsen personal",
                                                "precio": 8,
                                                "total": 24
                                            }
                                        ],
                                        "totals": {
                                            "exonerado": 11200,
                                            "gravado": 0,
                                            "icbper": 0,
                                            "igv": 0,
                                            "total" : 11200
                                        },
                                        "footer":{
                                            "date": "09/09/2024 14:05:24",
                                            "username": "JORGE"
                                        }
                                    }

                                    console.log(jsonTicket);
                                    socket.send(JSON.stringify(jsonTicket));

                                };

// Evento si ocurre algún error en la conexión
                                socket.onerror = function(error) {
                                    console.log("Error en WebSocket", error);
                                    message.error(error);
                                };

// Evento cuando se recibe un mensaje del servidor
                                socket.onmessage = function(event) {
                                    console.log("Mensaje recibido del servidor", event.data);
                                    message.success(event.data);
                                };

// Evento cuando la conexión es cerrada
                                socket.onclose = function(event) {
                                    console.log("Conexión WebSocket cerrada", event);
                                };
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
                    }
                    emit("printed");
                    emit("update:show", false);
                }
            });
        };

        const sendToWhatsapp = () => {
            loading.value = true;
            sendWhatsapp(
                props.data.id,
                [props.data.serie, props.data.number],
                phoneNumber.value
            ).then((response) => {
                if(response.status === 200)
                    window.open(response.data.data.url, "_blank");
            }).catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
            }).finally(() => {
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
            phoneNumber
        };
    }
});
</script>

<style lang="scss"></style>
