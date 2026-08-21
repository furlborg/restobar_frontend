<template>
    <n-drawer id="PreviewDrawer" :show="show" @update:show="(v) => $emit('update:show', v)" placement="right"
        width="272px" :on-after-leave="() => (send = false)" :mask-closable="false"
        :on-esc="() => ($emit('update:show', false), $emit('canceled'))" :z-index="!previewOnly ? undefined : -1000000">
        <n-drawer-content body-content-style="padding: 0;"
            footer-style="padding: 0; height: auto; display: flex; flex-direction: column;" :native-scrollbar="false">
            <template #header>
                <n-page-header title="Previsualización"
                    @back="() => ($emit('update:show', false), $emit('canceled'))"></n-page-header>
            </template>
            <default-preset v-if="!preVoucher" ref="ticket" :data="data" :isPrintMode="isPrintMode" />
            <preview-preset v-else ref="ticket" :data="data" :isPrintMode="isPrintMode" />
            <template v-if="!previewOnly" #footer>
                <n-button class="fs-4" type="info" secondary block @click="generate">
                    Imprimir
                </n-button>
                <div style="width: 100%; display: flex">
                    <n-button-group>
                        <n-button style="width: 90px" type="success" tertiary @click="dataModalWhatsApp()"
                            :disabled="data.status === 'A'">
                            <v-icon name="bi-whatsapp" />
                        </n-button>
                        <n-button style="width: 90px" type="info" tertiary disabled>
                            <v-icon name="md-outgoingmail" />
                        </n-button>
                        <n-button style="width: 90px" type="warning" tertiary :loading="downloadingA4" @click="downloadA4PDF">
                            <v-icon name="fa-download" />
                        </n-button>
                    </n-button-group>
                    <n-drawer v-model:show="send" placement="bottom" to="#PreviewDrawer" height="69">
                        <n-drawer-content body-content-style="padding: 0;">
                            <n-input v-model:value="phoneNumber" placeholder="" @keypress="isNumber" :show-count="true"
                                :maxlength="9" />
                            <n-button type="success" secondary block :loading="loading"
                                :disabled="phoneNumber.length < 9 || loading" @click="sendToWhatsapp">
                                <v-icon name="bi-whatsapp" />
                                Enviar
                            </n-button>
                        </n-drawer-content>
                    </n-drawer>
                </div>
            </template>
            <send-to-whats-app-mervin-gay :data-message="data" :data-modal="putaOscar" />
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
import { generateVoucherA4PDF } from "@/hooks/createVoucherA4PDF";

export default defineComponent({
    name: "PreviewDrawer",
    components: {
        SendToWhatsAppMervinGay,
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
        const isPrintMode = ref(false);
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
                        `"Total de pulsaciones: ", ${totalEnterPulse.value}, "si no se imprime es porque el qz esta mal configurado..."`);
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

        const downloadingA4 = ref(false);

        const downloadA4PDF = async () => {
            if (!props.data) return;
            downloadingA4.value = true;
            try {
                const doc = await generateVoucherA4PDF(props.data, businessStore, props.data);
                const serieDesc = saleStore.getSerieDescription(props.data?.serie) || props.data?.serie || "COMPROBANTE";
                const numberVal = props.data?.number || "0";
                doc.save(`${serieDesc}-${numberVal}.pdf`);
                message.success("Comprobante A4 descargado con éxito");
            } catch (e) {
                console.error("Error al generar PDF A4:", e);
                message.error("Error al generar el comprobante en formato A4");
            } finally {
                downloadingA4.value = false;
            }
        };

        const generate = async (save = false) => {
            if (save === true) {
                return await downloadA4PDF();
            }

            // Activar modo impresión para usar dimensiones correctas
            isPrintMode.value = true;

            // Esperar a que Vue actualice el DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            if (props.preVoucher) {
                    const business = businessStore.business;
                    const sendTicketData = async () => {

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
                        try {
                            const response = await http.post('orders/print-proxy/', jsonTicket);
                            if (response.status === 200) {
                                message.success(response.data.success || 'Pre-cuenta enviada a imprimir');
                            }
                        } catch (error) {
                            console.error("Error enviando pre-cuenta", error);
                            message.error("Error de conexión con el servidor");
                        }
                    };

                    sendTicketData();
                } else {
                    const gordoPuto = async () => {
                        try {
                            // eslint-disable-next-line no-undef
                            const response = await http.post(`${import.meta.env.VITE_APP_URL}/api/v1/sales/${props.data.id}/print/`);
                            if (response.status === 200) {
                                return response.data;
                            }
                        } catch (e) {
                            console.log(e);
                        }
                        return null;
                    };

                    const voucherData = await gordoPuto();

                    const sendTicketData = async () => {
                        console.log(voucherData);
                        const jsonTicket = {
                            ...voucherData,
                            printer_name: voucherData.printer_name
                                ? voucherData.printer_name
                                : settingsStore.business_settings.sale.printer_name
                        };
                        try {
                            const response = await http.post('orders/print-proxy/', jsonTicket);
                            if (response.status === 200) {
                                message.success('Voucher enviado a imprimir');
                            }
                        } catch (error) {
                            console.error("Error enviando voucher", error);
                            message.error("Error de conexión con el servidor");
                        }
                    };

                    await sendTicketData();
                }

            // Desactivar modo impresión después de generar el PDF
            isPrintMode.value = false;
        };

        const sendToWhatsapp = () => {
            loading.value = true;
            sendWhatsapp(
                props.data.id,
                [props.data.serie, props.data.number],
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
            downloadingA4,
            downloadA4PDF,
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
