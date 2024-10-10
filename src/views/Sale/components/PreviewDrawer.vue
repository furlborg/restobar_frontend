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
import { useSaleStore } from "@/store/modules/sale";
import { jsPDF } from "jspdf";
import DefaultPreset from "./pdf-presets/DefaultPreset";
import PreviewPreset from "./pdf-presets/PreviewPreset";
import { isNumber } from "@/utils";
import { sendWhatsapp } from "@/api/modules/sales";
import { useBusinessStore } from "@/store/modules/business";
import { useTableStore } from "@/store/modules/table";
import { http } from "@/api";

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
        const saleStore = useSaleStore();
        const tableStore = useTableStore();
        const totalEnterPulse = ref(0);
        const businessStore = useBusinessStore();
        // eslint-disable-next-line no-undef
        // const apiUrl = process.env.VUE_APP_API_URL.replace(/^https?:\/\//, ''); // Elimina 'http://' o 'https://'
        let socket = null;

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
                    message.success(
                        `"Total de pulsaciones: ", ${totalEnterPulse.value}, "si no se imprime es porque el qz esta mal configurado..."`);
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
                        if(props.preVoucher) {
                            const business = businessStore.business;
                            const sendTicketData = () => {

                                const orders = props.data.order_details.map(order => {
                                    let totalOperation = 0;
                                    let totalUnitPrice = 0;
                                    if(order.product_affectation === 20) {
                                        totalOperation = parseFloat((order.quantity * order.price).toFixed(2));
                                        totalUnitPrice = parseFloat((order.price).toFixed(2));
                                    }
                                    if(order.product_affectation === 10) {
                                        totalOperation = parseFloat((order.quantity * ((order.price * 0.18) + order.price)).toFixed(2));
                                        totalUnitPrice = parseFloat(((order.price * 0.18) + order.price)).toFixed(2);
                                    }
                                    return {
                                        operation: order.product_affectation,
                                        cantidad: order.quantity,
                                        descripcion: order.product_name,
                                        precio: totalUnitPrice,
                                        total: totalOperation
                                    };
                                });
                                const totalIGV = orders.reduce((acc, it) => { return it.operation === 10 ? acc + it.total : acc; }, 0);
                                const totalExo = orders.reduce((acc, it) => { return it.operation === 20 ? acc + it.total : acc; }, 0);

                                const igv = parseFloat((totalIGV - (totalIGV / 1.18)).toFixed(2))
                                const gravado = parseFloat((totalIGV / 1.18).toFixed(2))
                                const jsonTicket = {
                                    "printer_name": settingsStore.business_settings?.['qz_config'].host,
                                    "ticket_type": "PRE-ACCOUNT",
                                    "tittle": {
                                        "logo": "",
                                        "ruc": business.ruc,
                                        "company": business.commercial_name,
                                        "address": business.fiscal_address,
                                        "table": tableStore.getTableByID(props.data.table).description,
                                        "order": props.data.id
                                    },
                                    "ticket_content": orders,
                                    "totals": {
                                        "exonerado": totalExo,
                                        "gravado": gravado,
                                        "icbper": 0,
                                        "igv": igv,
                                        "total": parseFloat(totalExo + totalIGV).toFixed(2)
                                    },
                                    "footer": {
                                        "date": props.data.created,
                                        "username": props.data.username
                                    }
                                };
                                socket.send(JSON.stringify(jsonTicket));
                            };

                            // Verifica el estado del WebSocket y maneja la conexión
                            if(!socket || socket.readyState === WebSocket.CLOSED) {
                                // eslint-disable-next-line no-undef
                                const apiUrl = process.env.VUE_APP_API_URL.replace(/^https?:\/\//, "");
                                socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${apiUrl}/ws/print/`);

                                socket.onopen = function() {
                                    console.log("Conexión WebSocket abierta");
                                    sendTicketData();
                                };

                                socket.onerror = function(error) {
                                    console.log("Error en WebSocket", error);
                                    message.error(error);
                                };

                                socket.onmessage = function(event) {
                                    if(event.data.includes("success")) {
                                        console.log("Mensaje recibido del servidor", JSON.parse(event.data).success);
                                        message.success(JSON.parse(event.data).success);
                                        socket.close()
                                    }
                                };

                                socket.onclose = function(event) {
                                    console.log("Conexión WebSocket cerrada", event);
                                };
                            } else if(socket.readyState === WebSocket.OPEN) {
                                // Si el WebSocket ya está abierto, envía el mensaje directamente
                                sendTicketData();
                            }
                        } else {
                            const gordoPuto = async() => {
                                try {
                                    // eslint-disable-next-line no-undef
                                    const response = await http.get(`${process.env.VUE_APP_API_URL}/api/v1/sales/${props.data.id}/print`);
                                    if(response.status === 200) {
                                        return response.data;
                                    }
                                } catch(e) {
                                    console.log(e);
                                }
                                return null;
                            };

                            const voucherData = await gordoPuto()

                            const sendTicketData = () => {

                                const jsonTicket = {
                                    ...voucherData,
                                    printer_name: settingsStore.business_settings.sale.printer_name || ''
                                };
                                socket.send(JSON.stringify(jsonTicket));
                            };

                            if(!socket || socket.readyState === WebSocket.CLOSED) {
                                // eslint-disable-next-line no-undef
                                const apiUrl = process.env.VUE_APP_API_URL.replace(/^https?:\/\//, "");
                                socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${apiUrl}/ws/print/`);

                                socket.onopen = function() {
                                    console.log("Conexión WebSocket abierta");
                                    sendTicketData();
                                };

                                socket.onerror = function(error) {
                                    console.log("Error en WebSocket", error);
                                    message.error(error);
                                };

                                socket.onmessage = function(event) {
                                    if(event.data.includes("success")) {
                                        console.log("Mensaje recibido del servidor", JSON.parse(event.data).success);
                                        message.success(JSON.parse(event.data).success);
                                        socket.close()
                                    }
                                };

                                socket.onclose = function(event) {
                                    console.log("Conexión WebSocket cerrada", event);
                                };
                            } else if(socket.readyState === WebSocket.OPEN) {
                                sendTicketData();
                            }

                            // const printDataVoucher = await gordoPuto()
                            // console.log(printDataVoucher);
                            // doc.autoPrint();
                            // const hiddeFrame = document.createElement("iframe");
                            // hiddeFrame.style.position = "fixed";
                            // hiddeFrame.style.width = "1px";
                            // hiddeFrame.style.height = "1px";
                            // hiddeFrame.style.opacity = "0.01";
                            // hiddeFrame.src = doc.output("bloburl");
                            // document.body.appendChild(hiddeFrame);
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
