<template>
    <n-drawer id="PreviewDrawer" :show="show" @update:show="(v) => $emit('update:show', v)" placement="right"
        width="272px" :mask-closable="false"
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
                    <n-button-group style="width: 100%">
                        <n-button style="flex: 1" type="success" tertiary @click="dataModalWhatsApp()"
                            :disabled="data.status === 'A'" title="Enviar por WhatsApp">
                            <v-icon name="bi-whatsapp" />
                        </n-button>
                        <n-button v-if="canSendEmail" style="flex: 1" type="info" tertiary
                            @click="dataModalEmail()" :disabled="data.status === 'A'" title="Enviar por correo">
                            <v-icon name="md-outgoingmail" />
                        </n-button>
                        <n-button v-if="showReviewQrButton" style="flex: 1" type="primary" tertiary
                            :loading="printingReviewQr" :disabled="data.status === 'A'" @click="printReviewQr"
                            title="Imprimir QR de calificación">
                            <v-icon name="md-qrcode" />
                        </n-button>
                        <n-button style="flex: 1" type="warning" tertiary :loading="downloadingA4"
                            @click="downloadA4PDF" title="Descargar comprobante A4">
                            <v-icon name="fa-download" />
                        </n-button>
                    </n-button-group>
                </div>
            </template>
            <send-to-whats-app-mervin-gay :data-message="data" :data-modal="whatsAppModal" />
            <send-voucher-by-email-modal :data-message="data" :data-modal="emailModal" />
        </n-drawer-content>
    </n-drawer>
</template>

<script>
import { computed, defineComponent, ref, watchEffect, watch } from "vue";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useSaleStore } from "@/store/modules/sale";
import DefaultPreset from "./pdf-presets/DefaultPreset";
import PreviewPreset from "./pdf-presets/PreviewPreset";
import { useBusinessStore } from "@/store/modules/business";
import { useTableStore } from "@/store/modules/table";
import { useUserStore } from "@/store/modules/user";
import { http } from "@/api";
import SendToWhatsAppMervinGay from "@/components/sendToWhatsAppMervinGay.vue";
import SendVoucherByEmailModal from "@/components/sendVoucherByEmailModal.vue";
import { generateVoucherA4PDF } from "@/hooks/createVoucherA4PDF";

export default defineComponent({
    name: "PreviewDrawer",
    components: {
        SendToWhatsAppMervinGay,
        SendVoucherByEmailModal,
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
        const userStore = useUserStore();
        const totalEnterPulse = ref(0);
        const businessStore = useBusinessStore();
        const isPrintMode = ref(false);

        const showModalWhatsApp = ref(false);
        const closeModalWhatsApp = () => (showModalWhatsApp.value = false);
        const whatsAppModal = {
            closeModal: closeModalWhatsApp,
            show: showModalWhatsApp
        };
        const dataModalWhatsApp = () => {
            showModalWhatsApp.value = true;
        };

        const showModalEmail = ref(false);
        const emailModal = {
            closeModal: () => (showModalEmail.value = false),
            show: showModalEmail
        };
        const dataModalEmail = () => {
            showModalEmail.value = true;
        };

        const message = useMessage();

        const ticket = ref(null);

        const printingReviewQr = ref(false);

        const canSendEmail = computed(
            () => !props.preVoucher && !props.previewOnly && userStore.hasPermission("send_sale_email")
        );

        const showReviewQrButton = computed(() => {
            if (props.previewOnly || props.preVoucher) return false;
            const reviewQr = settingsStore.business_settings?.review_qr || {};
            return Boolean(reviewQr.enabled && String(reviewQr.url || "").trim());
        });

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

                        // En cuentas separadas, lo ya cobrado queda con quantity 0: no debe salir en la precuenta
                        const orderDetails = (props.data.order_details || []).filter(
                            (detail) => parseFloat(detail?.quantity) > 0
                        );

                        const mapOrderLine = (order) => {
                            let totalOperation = 0;
                            let totalUnitPrice = 0;
                            let totalIGV = 0;
                            const affectation = order.product_affectation || 20;
                            const price = parseFloat(order.price ?? order.product_set?.price ?? 0);
                            const quantity = parseFloat(order.quantity ?? 1);
                            const igvTax = parseFloat(order.product_igv || 0);

                            if (affectation === 20) {
                                totalOperation = parseFloat((quantity * price).toFixed(2));
                                totalUnitPrice = parseFloat(price.toFixed(2));
                            }
                            if (affectation === 10) {
                                totalOperation = parseFloat((quantity * ((price * igvTax) + price)).toFixed(2));
                                totalUnitPrice = parseFloat(((price * igvTax) + price).toFixed(2));
                                totalIGV = (order?.["sub_total"] || (quantity * price)) * igvTax;
                            }

                            let description = order.product_name || order.product_set?.menu_name || order.product_set?.name || "-";
                            // Si tiene productos componentes de combo/menú, agregamos el desglose con sus cantidades
                            if (order.product_set && Array.isArray(order.product_set.items) && order.product_set.items.length > 0) {
                                const subItems = order.product_set.items.map((it) => {
                                    const qty = parseFloat(it.quantity) || 1;
                                    const name = it.product?.name || it.product_name || it.combo_product?.product?.name || "";
                                    return name ? `${qty}x ${name}` : null;
                                }).filter(Boolean);
                                if (subItems.length > 0) {
                                    description += ` (${subItems.join(", ")})`;
                                }
                            } else if (order.product_description) {
                                description += ` (${order.product_description})`;
                            }

                            return {
                                operation: affectation,
                                cantidad: quantity,
                                descripcion: description,
                                "product_name": description,
                                "product_description": order.product_description || "",
                                "product_category": order.product_category || (order.product_set ? "Combos" : ""),
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
                            const response = await http.post(`sales/${props.data.id}/print/`);
                            if (response.status === 200) {
                                return response.data;
                            }
                        } catch (e) {
                            console.log(e);
                        }
                        return null;
                    };

                    const voucherData = await gordoPuto();

                    // El POST a sales/{id}/print/ ya envía el voucher a Kuzeta desde el backend
                    // (sender_data). Reenviarlo por orders/print-proxy duplicaba el mensaje
                    // (mismo id): Kuzeta lo descartaba, pero se generaba igual.
                    try {
                        if (voucherData) {
                            message.success('Voucher enviado a imprimir');
                        }
                    } catch (err) {
                        console.error("Error al imprimir voucher:", err);
                    } finally {
                        emit("printed");
                    }
                }

            // Desactivar modo impresión después de generar el PDF
            isPrintMode.value = false;
        };

        const printReviewQr = async () => {
            if (printingReviewQr.value || !props.data?.id) return;
            printingReviewQr.value = true;
            try {
                const response = await http.post(`sales/${props.data.id}/print-review-qr/`);
                if (response.status === 200) {
                    message.success(response.data?.success || "Enviado a imprimir");
                }
            } catch (error) {
                const detail = error?.response?.data?.error;
                message.error(detail || "No se pudo enviar el QR a imprimir");
            } finally {
                printingReviewQr.value = false;
            }
        };

        return {
            downloadingA4,
            downloadA4PDF,
            ticket,
            generate,
            dataModalWhatsApp,
            dataModalEmail,
            whatsAppModal,
            emailModal,
            canSendEmail,
            showReviewQrButton,
            printingReviewQr,
            printReviewQr,
            isPrintMode
        };
    }
});
</script>

<style lang="scss"></style>
