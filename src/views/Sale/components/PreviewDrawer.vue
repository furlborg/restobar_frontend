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
            <default-preset v-if="!preVoucher" ref="ticket" :data="data" :isPrintMode="isPrintMode"/>
            <preview-preset v-else ref="ticket" :data="data" :isPrintMode="isPrintMode"/>
            <template v-if="!previewOnly" #footer>
                <n-button class="fs-4" type="info" secondary block @click="generate">
                    Imprimir
                </n-button>
                <div style="width: 100%; display: flex">
                    <n-button-group>
                        <n-button
                                style="width: 90px"
                                type="success"
                                tertiary
                                @click="dataModalWhatsApp()"
                                :disabled="data.status === 'A'"
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
            <send-to-whats-app-mervin-gay :data-message="data" :data-modal="putaOscar"/>
        </n-drawer-content>
    </n-drawer>
</template>

<script>
import { defineComponent, ref, watchEffect, watch } from "vue";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useSaleStore } from "@/store/modules/sale";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import DefaultPreset from "./pdf-presets/DefaultPreset";
import PreviewPreset from "./pdf-presets/PreviewPreset";
import { isNumber } from "@/utils";
import { sendWhatsapp } from "@/api/modules/sales";
import { useBusinessStore } from "@/store/modules/business";
import { useTableStore } from "@/store/modules/table";
import { http } from "@/api";
import SendToWhatsAppMervinGay from "@/components/sendToWhatsAppMervinGay.vue";

export default defineComponent({
    name: "PreviewDrawer",
    components: {
        SendToWhatsAppMervinGay,
        DefaultPreset,
        PreviewPreset
    },
    emits: [ "update:show", "printed", "canceled" ],
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
        const isPrintMode = ref(false);
        // eslint-disable-next-line no-undef
        // const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, ''); // Elimina 'http://' o 'https://'
        let socket = null;

        const showModalWhatsApp = ref(false);
        const closeModal = () => (showModalWhatsApp.value = false);

        const putaOscar = {
            closeModal,
            show: showModalWhatsApp
        };

        const dataModalWhatsApp = () => {
            showModalWhatsApp.value = true;
        };

        const message = useMessage();

        const ticket = ref(null);

        const loading = ref(false);

        const send = ref(false);

        const phoneNumber = ref("");

        const onKeyUp = (event) => {
            if (event.keyCode === 13 || event.keyCode === 12) {
                totalEnterPulse.value += 1;
            }
        };

        watchEffect(() => {
            if (props.show && !props.preVoucher && !props.previewOnly) {
                window.addEventListener("keyup", onKeyUp);
                if (totalEnterPulse.value >= 3 && totalEnterPulse.value <= 4) {
                    generate();
                    message.success(
                        `"Total de pulsaciones: ", ${ totalEnterPulse.value }, "si no se imprime es porque el qz esta mal configurado..."`);
                }
            }
        });

        watch(
            () => props.show,
            (show) => {
                if (!show || !props.previewOnly) return;
                const active = document?.activeElement;
                if (active && typeof active.blur === "function") {
                    active.blur();
                }
            }
        );

        const generate = async(save = false) => {
            // Activar modo impresión para usar dimensiones correctas
            isPrintMode.value = true;

            // Esperar a que Vue actualice el DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            if (save === true) {
                try {
                    const el = ticket.value?.$el;
                    if (!el) throw new Error("Ticket DOM no disponible");
                    const canvas = await html2canvas(el, {
                        scale: 2,            
                        useCORS: true,       
                        logging: false,
                        backgroundColor: '#ffffff'
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const pdfW = canvas.width;
                    const pdfH = canvas.height + 10;

                    const doc = new jsPDF({
                        unit: 'px',
                        format: [pdfW, pdfH],
                        orientation: 'p',
                        hotfixes: ['px_scaling']
                    });

                    doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
                    doc.save(`${ saleStore.getSerieDescription(props.data.serie) }-${ props.data.number }`);
                } catch (e) {
                    console.error(e);
                } finally {
                    isPrintMode.value = false;
                }
                return;
            } else {
                if (props.preVoucher) {
                    const business = businessStore.business;
                    const sendTicketData = () => {

                        const orderDetails = props.data.order_details || [];

                        const mapOrderLine = (order) => {
                            let totalOperation = 0;
                            let totalUnitPrice = 0;
                            let totalIGV = 0;
                            if (order.product_affectation === 20) {
                                totalOperation = parseFloat((order.quantity * order.price).toFixed(2));
                                totalUnitPrice = parseFloat((order.price).toFixed(2));
                            }
                            if (order.product_affectation === 10) {
                                totalOperation = parseFloat((order.quantity * ((order.price * order.product_igv) + order.price)).toFixed(2));
                                totalUnitPrice = parseFloat(((order.price * order.product_igv) + order.price)).toFixed(2);
                                totalIGV = (order?.["sub_total"]) * (order.product_igv);
                            }
                            return {
                                operation: order.product_affectation,
                                cantidad: order.quantity,
                                descripcion: order.product_name,
                                "product_name": order.product_name,
                                "product_description": order.product_description,
                                "product_category": order.product_category,
                                igv: totalIGV.toFixed(2),
                                precio: totalUnitPrice,
                                total: totalOperation
                            };
                        };

                        const baseOrders = orderDetails.map(mapOrderLine);
                        const hasCustomers = orderDetails.some((detail) => !!detail?.customer);
                        let orders = [];

                        if (hasCustomers) {
                            const groups = [];
                            const index = new Map();

                            orderDetails.forEach((detail) => {
                                const customerId = detail.customer?.id ?? "NO_CUSTOMER";
                                const customerName =
                                    detail.customer?.name ||
                                    detail.customer?.full_name ||
                                    (customerId === "NO_CUSTOMER" ? "SIN CLIENTE" : `CLIENTE ${customerId}`);

                                if (!index.has(customerId)) {
                                    index.set(customerId, groups.length);
                                    groups.push({
                                        key: customerId,
                                        customerName,
                                        items: []
                                    });
                                }

                                groups[index.get(customerId)].items.push(detail);
                            });

                            groups.forEach((group) => {
                                orders.push({
                                    cantidad: "",
                                    descripcion: `CLIENTE: ${group.customerName}`,
                                    "product_name": `CLIENTE: ${group.customerName}`,
                                    "product_description": "",
                                    "product_category": "",
                                    is_header: true
                                });

                                group.items.forEach((detail) => {
                                    orders.push(mapOrderLine(detail));
                                });
                            });
                        } else {
                            orders = baseOrders;
                        }

                        const totalIGV = baseOrders.reduce((acc, it) => {
                            return it.operation === 10 ? acc + it.total : acc;
                        }, 0);
                        const totalExo = baseOrders.reduce((acc, it) => {
                            return it.operation === 20 ? acc + it.total : acc;
                        }, 0);

                        const igvTotal = baseOrders.reduce((acc, it) => {
                            return it.operation === 10 ? acc + it.igv : acc;
                        }, 0);
                        const gravado = parseFloat((totalIGV - igvTotal).toFixed(2));

                        const jsonTicket = {
                            "printer_name": props.data.printer_name || settingsStore.business_settings?.["qz_config"].host,
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
                                "igv": igvTotal || 0,
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
                    if ( !socket || socket.readyState === WebSocket.CLOSED) {
                        // eslint-disable-next-line no-undef
                        const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, "");
                        socket = new WebSocket(`${ window.location.protocol === "https:" ? "wss" : "ws" }://${ apiUrl }/ws/print/`);

                        socket.onopen = function() {
                            console.log("Conexión WebSocket abierta");
                            sendTicketData();
                        };

                        socket.onerror = function(error) {
                            console.log("Error en WebSocket", error);
                            message.error(error);
                        };

                        socket.onmessage = function(event) {
                            if (event.data.includes("success")) {
                                console.log("Mensaje recibido del servidor", JSON.parse(event.data).success);
                                message.success(JSON.parse(event.data).success);
                                socket.close();
                            }
                        };

                        socket.onclose = function(event) {
                            console.log("Conexión WebSocket cerrada", event);
                        };
                    } else if (socket.readyState === WebSocket.OPEN) {
                        // Si el WebSocket ya está abierto, envía el mensaje directamente
                        sendTicketData();
                    }
                } else {
                    const gordoPuto = async() => {
                        try {
                            // eslint-disable-next-line no-undef
                            const response = await http.post(`${ import.meta.env.VITE_APP_URL }/api/v1/sales/${ props.data.id }/print/`);
                            if (response.status === 200) {
                                return response.data;
                            }
                        } catch (e) {
                            console.log(e);
                        }
                        return null;
                    };

                    const voucherData = await gordoPuto();

                    const sendTicketData = () => {
                        console.log(voucherData);
                        const jsonTicket = {
                            ...voucherData,
                            printer_name: voucherData.printer_name
                                          ? voucherData.printer_name
                                          : settingsStore.business_settings.sale.printer_name
                        };
                        socket?.send(JSON.stringify(jsonTicket));
                    };

                    // if(!socket || socket.readyState === WebSocket.CLOSED) {
                    //     // eslint-disable-next-line no-undef
                    //     const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, "");
                    //     socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${apiUrl}/ws/print/`);
                    //
                    //     socket.onopen = function() {
                    //         console.log("Conexión WebSocket abierta");
                    //         sendTicketData();
                    //     };
                    //
                    //     socket.onerror = function(error) {
                    //         console.log("Error en WebSocket", error);
                    //         message.error(error);
                    //     };
                    //
                    //     socket.onmessage = function(event) {
                    //         if(event.data.includes("success")) {
                    //             console.log("Mensaje recibido del servidor", JSON.parse(event.data).success);
                    //             message.success(JSON.parse(event.data).success);
                    //             socket.close()
                    //         }
                    //     };
                    //
                    //     socket.onclose = function(event) {
                    //         console.log("Conexión WebSocket cerrada", event);
                    //     };
                    // } else 
                    //     if(socket.readyState === WebSocket.OPEN) {
                    sendTicketData();
                    // }

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
            
            // Desactivar modo impresión después de generar el PDF
            isPrintMode.value = false;
            
            emit("printed");
            emit("update:show", false);
        };

        const sendToWhatsapp = () => {
            loading.value = true;
            sendWhatsapp(
                props.data.id,
                [ props.data.serie, props.data.number ],
                phoneNumber.value
            ).then((response) => {
                if (response.status === 200)
                    window.open(response.data.data.url, "_blank");
            }).catch((error) => {
                console.error(error);
                
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
            dataModalWhatsApp,
            putaOscar,
            phoneNumber,
            isPrintMode
        };
    }
});
</script>

<style lang="scss"></style>
