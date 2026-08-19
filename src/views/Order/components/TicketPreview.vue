<template>
    <n-drawer
            id="TicketPreview"
            :show="show"
            @update:show="(v) => $emit('update:show', v)"
            placement="right"
            width="272px"
            :z-index="!hidden ? undefined : -1000000"
    >
        <n-drawer-content body-content-style="padding: 0;" :native-scrollbar="false">
            <template v-for="(place, i) in places" :key="`product-${place.id}`">
                <default-ticket
                        ref="tickets"
                        :data="data"
                        :place="place"
                        :isUpdate="isUpdate"
                />

                <n-button type="info" secondary block @click="printTicket(i, place, true)">
                    <template #icon>
                        <v-icon name="md-print-round"/>
                    </template>
                    {{ place.description }}
                </n-button>
            </template>

            <template v-if="data.order_type === 'D'">
                <ticket-delivery ref="delivery" :data="data"/>
                <n-button type="info" secondary block @click="printDelivery(true)">
                    <template #icon>
                        <v-icon name="md-print-round"/>
                    </template>
                    DELIVERY
                </n-button>
            </template>
            <template v-if="data.order_canceleddetails && data.order_canceleddetails.length">
                <div style="margin-top: 20px; padding: 15px; border-top: 1px dashed #ccc; text-align: center; color: #666; font-size: 12px;">
                    
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #000;">
                        ANULADOS
                    </div>
                    
                    <table style="width: 100%; text-align: left; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; margin-bottom: 15px; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="width: 25%; text-align: center; border-bottom: 1px dotted #ccc; padding: 4px 0; vertical-align: bottom;">CANT</th>
                                <th style="width: 75%; border-bottom: 1px dotted #ccc; padding: 4px 0; vertical-align: bottom;">PRODUCTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(detail, idx) in data.order_canceleddetails" :key="'canc-'+idx" style="text-decoration: line-through;">
                                <td style="text-align: center; padding: 4px 0; border-bottom: 1px dotted #eee; vertical-align: top;">{{ detail.quantity }}</td>
                                <td style="padding: 4px 0; border-bottom: 1px dotted #eee; vertical-align: top;">
                                    {{ detail.product_name || detail.product_set?.name }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div>-- HISTORIAL DE CAMBIOS / REGISTRO DE AUDITORÍA --</div>
                </div>
            </template>
        </n-drawer-content>
    </n-drawer>
</template>

<script>
import { defineComponent, ref, computed, nextTick } from "vue";
import DefaultTicket from "./ticket-presets/DefaultTicket";
import TicketDelivery from "./ticket-presets/TicketDelivery";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";
import { jsPDF } from "jspdf";
import { useMessage } from "naive-ui";
import { useTableStore } from "@/store/modules/table";
import { http } from "@/api";

export default defineComponent({
    name: "TicketPreview",
    components: {
        DefaultTicket,
        TicketDelivery
    },
    emits: ["update:show", "printed", "canceled"],
    props: {
        show: {
            type: Boolean
        },
        data: {
            type: Object
        },
        hidden: {
            type: Boolean,
            default: false
        },
        isUpdate: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const settingsStore = useSettingsStore();
        const productStore = useProductStore();
        const message = useMessage();
        const tickets = ref([]);
        const fittings = ref([]);
        const delivery = ref(null);
        let socket = null;
        const tableStore = useTableStore();
        const logPrefix = "[ORDER-PRINT]";

        const orderDetails = computed(() =>
            Array.isArray(props.data?.order_details) ? props.data.order_details : []
        );

        const places = computed(() => {
            const details = orderDetails.value;
            const matchedPlaces = productStore.places.filter((place) =>
                details.some(
                    (detail) =>
                        detail?.preparation_place === place.description ||
                        detail?.product_fitting?.preparation_place === place.description
                )
            );
            if (matchedPlaces.length) return matchedPlaces;
            if (!details.length) return [];

            const fallbackPrinter =
                props.data?.printer_name ||
                settingsStore.businessSettings?.sale?.printer_name ||
                settingsStore.business_settings?.sale?.printer_name;

            return [
                {
                    id: "DEFAULT",
                    description: props.data?.printer_name || "GENERAL",
                    printer_name: fallbackPrinter,
                    is_main: true,
                    is_default: true
                }
            ];
        });

        const handleSocketMessage = (event) => {
            const response = JSON.parse(event.data);
            console.info(logPrefix, "WS message:", response);
            if(response.id) {
                if (tableStore.processedMessages.has(response.id)) {
                    return;
                }
                tableStore.processedMessages.add(response.id);
                setTimeout(() => {
                    tableStore.processedMessages.delete(response.id);
                }, 10000);

                if(response.success) {
                    message.success(response.success);
                } else {
                    message.error("No se pudo establecer conexión con el servidor de impresiones");
                    message.error("Iniciando impresión manual");
                    // Aquí puedes agregar la lógica para la impresión manual
                }
            }
        };

        // WebSocket logic removed in favor of HTTP proxy

        const printDelivery = async(send) => {
            return new Promise((resolve) => {

                const sendTicketData = async () => {
                    const jsonTicket = {
                        "printer_name": settingsStore.businessSettings.sale.printer_name,
                        "ticket_type": "DELIVERY",
                        "tittle": {
                            "table": "DELIVERY",
                            "order": props.data.id
                        },
                        "header": {
                            "invoice": `${JSON.parse(props.data.json_sale)?.serie_documento}-${JSON.parse(
                                props.data.json_sale)?.numero_documento}`,
                            "fecha": JSON.parse(props.data.json_sale).fecha_de_emision,
                            "customer": props.data.delivery_info.person,
                            "reference": props.data.ask_for,
                            "phone": props.data.delivery_info.phone,
                            "address": props.data.delivery_info.address,
                            "payment_method": JSON.parse(props.data.json_sale).informacion_adicional.split("|")[2],
                            "usuario": props.data.username
                        },
                        "ticket_content": props.data.order_details.map(it => ({
                        // "ticket_content": JSON.parse(props.data.json_sale).items.map(it => ({
                            "cantidad": it.quantity,
                            "descripcion": it.product_name,
                            "product_name": it.product_name,
                            "product_description": it.product_description,
                            "product_category": it.product_category,
                            "precio": parseFloat(it?.["sale_detail_price"].toFixed(2)),
                            "total": parseFloat(it?.["sale_detail_total"].toFixed(2)),
                            "indicaciones": it.indication.filter(indicate => {
                                return (
                                    (!indicate.description.includes("[]") || indicate.description.length > 3 ||
                                        indicate.quick_indications.length > 0) &&
                                    indicate.description !== ""
                                );
                            }).map(indicate => indicate.description) || ""
                        })),
                        "totals": {
                            "exonerado": JSON.parse(props.data.json_sale).totales.total_operaciones_exoneradas,
                            "gravado": JSON.parse(props.data.json_sale).totales.total_operaciones_gravadas,
                            "icbper": JSON.parse(props.data.json_sale).totales.total_impuestos_bolsa_plastica,
                            "igv": JSON.parse(props.data.json_sale).totales.total_igv,
                            "delivery": JSON.parse(props.data.json_sale).totales.total_delivery,
                            "total": JSON.parse(props.data.json_sale).totales.total_venta,
                            "pago": parseFloat(props.data.given_amount),
                            "vuelto": parseFloat(
                                (props.data.given_amount - JSON.parse(props.data.json_sale)?.["totales"]?.["total_venta"]).toFixed(2))
                        },
                        "footer": {
                            "repartidor": props.data.delivery_info.deliveryman
                        }
                    };

                    if (send===true) {
                        try {
                            const response = await http.post('orders/print-proxy/', jsonTicket);
                            if (response.status === 200) {
                                message.success(response.data.success || 'Ticket enviado a imprimir');
                            }
                        } catch (error) {
                            console.error("Error enviando ticket", error);
                            message.error("Error de conexión con el servidor");
                            message.error("Iniciando impresión manual");
                            startManualPrint();
                        }
                    }
                    resolve();
                };
                if(settingsStore.business_settings.printer.native_printing) {
                    startManualPrint();
                } else {
                    sendTicketData();
                }
            });
        };

        const printTicket = async(i, place, send) => {
            // console.log(place);
            // console.log(props.data);
            return new Promise((resolve) => {
                const sendTicketData = async () => {
                    let printerNameToPrint;

                    if(!props.data.table && props.data.delivery_info) {
                        printerNameToPrint = settingsStore.businessSettings.printer?.["print_name_delivery"] || place.printer_name;
                    } else if(!props.data.table && !props.data.delivery_info) {
                        printerNameToPrint = settingsStore.businessSettings.printer?.["print_name_take_away"] || place.printer_name;
                    } else {
                        printerNameToPrint = place.printer_name;
                    }
                    const jsonTicket = {
                        "printer_name": printerNameToPrint,
                        "ticket_type": "ORDER",
                        "tittle": {
                            "area": props.data.area,
                            "table": "",
                            "order": props.data.id
                        },
                        "header": {
                            "date": props.data.created,
                            "reference": props.data.ask_for,
                            "username": props.data.username
                        },
                        "ticket_content": (() => {
                            const rawDetails = (!place || place.is_default)
                                ? (props.data.order_details || [])
                                : (props.data.order_details || []).filter((pl) =>
                                    settingsStore.business_settings.printer.subticket_mode && place.is_main
                                        ? !!pl.preparation_place
                                        : pl.preparation_place === place.description ||
                                          pl.product_fitting?.preparation_place === place.description
                                );

                            const groupDetailsByIndication = (items) => {
                                const unitItems = [];
                                for (const item of items) {
                                    const totalQty = Number(item.quantity || 0);
                                    const indications = Array.isArray(item.indication) ? item.indication : [];
                                    if (totalQty <= 0) continue;

                                    for (let i = 0; i < totalQty; i++) {
                                        const unitInd = indications[i] || null;
                                        const hasValidInd = unitInd && (
                                            (unitInd.description && unitInd.description.trim() !== "" && !unitInd.description.includes("[]")) ||
                                            (unitInd.quick_indications && unitInd.quick_indications.length > 0) ||
                                            unitInd.takeAway
                                        );

                                        const unitItem = JSON.parse(JSON.stringify(item));
                                        unitItem.quantity = 1;
                                        unitItem.initial_quantity = 1;
                                        unitItem.indication = hasValidInd ? [unitInd] : [];
                                        unitItems.push(unitItem);
                                    }
                                }

                                const grouped = [];
                                const indexMap = new Map();

                                for (const unit of unitItems) {
                                    const productName = unit.product_name || unit.product_set?.name || 'Desconocido';
                                    const descStr = unit.product_description || '';
                                    const setStr = unit.product_set ? JSON.stringify(unit.product_set) : '';
                                    const fittingStr = unit.product_fitting ? JSON.stringify(unit.product_fitting) : '';

                                    let indKey = '__NO_IND__';
                                    if (unit.indication && unit.indication.length > 0) {
                                        const ind = unit.indication[0];
                                        const indDesc = (ind.description || '').trim();
                                        const takeAway = !!ind.takeAway;
                                        indKey = `${indDesc}__takeAway:${takeAway}`;
                                    }

                                    const key = `${productName}__${descStr}__${setStr}__${fittingStr}__${indKey}`;

                                    if (indexMap.has(key)) {
                                        const existingItem = grouped[indexMap.get(key)];
                                        existingItem.quantity = (existingItem.quantity || 0) + 1;
                                    } else {
                                        grouped.push(unit);
                                        indexMap.set(key, grouped.length - 1);
                                    }
                                }

                                grouped.sort((a, b) => {
                                    const nameA = a.product_name || a.product_set?.name || '';
                                    const nameB = b.product_name || b.product_set?.name || '';
                                    if (nameA !== nameB) return 0;
                                    const hasIndA = a.indication && a.indication.length > 0 ? 1 : 0;
                                    const hasIndB = b.indication && b.indication.length > 0 ? 1 : 0;
                                    return hasIndA - hasIndB;
                                });

                                return grouped;
                            };

                            const mapLine = (it) => ({
                                "id": it.id,
                                "cantidad": it.quantity,
                                "descripcion": it.product_name || it.product_set?.name || "",
                                "product_name": it.product_name || it.product_set?.name || "",
                                "product_description": it.product_description || "",
                                "product_category": it.product_category || "",
                                "indicaciones": (it.indication || []).map(indicate => {
                                    if (!indicate) return "";
                                    let parts = [];
                                    if (Array.isArray(indicate.quick_indications) && indicate.quick_indications.length > 0) {
                                        parts.push(...indicate.quick_indications);
                                    }
                                    if (indicate.description && indicate.description.trim() !== "" && !indicate.description.includes("[]")) {
                                        parts.push(indicate.description.trim());
                                    }
                                    let desc = parts.join(", ");
                                    if (indicate.takeAway) {
                                        desc = desc ? `${desc} [LLEVAR]` : "[LLEVAR]";
                                    }
                                    return desc;
                                }).filter(d => d && d.trim() !== "")
                            });

                            const orderByCustomer = !!settingsStore.business_settings?.order?.order_by_customer;
                            const hasCustomers = rawDetails.some((detail) => !!detail?.customer);

                            if (!orderByCustomer || !hasCustomers) {
                                return groupDetailsByIndication(rawDetails).map(mapLine);
                            }

                            const groups = [];
                            const index = new Map();

                            rawDetails.forEach((detail) => {
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

                            const content = [];
                            groups.forEach((group) => {
                                content.push({
                                    "cantidad": " ",
                                    "quantity": " ",
                                    "descripcion": `CLIENTE: ${group.customerName}`,
                                    "product_name": `CLIENTE: ${group.customerName}`,
                                    "product_description": "",
                                    "product_category": "",
                                    "is_header": true
                                });
                                content.push({
                                    "cantidad": "CANT",
                                    "quantity": "CANT",
                                    "descripcion": "PRODUCTO",
                                    "product_name": "PRODUCTO",
                                    "product_description": "",
                                    "product_category": "",
                                    "is_header": true,
                                    "is_table_header": true
                                });
                                groupDetailsByIndication(group.items).forEach((detail) => {
                                    content.push(mapLine(detail));
                                });
                            });

                            return content;
                        })()
                    };
                    console.info(logPrefix, "Prepared ORDER ticket", {
                        orderId: props.data?.id,
                        place: place?.description,
                        printer: printerNameToPrint,
                        contentCount: jsonTicket.ticket_content?.length,
                        send
                    });
                    // --- Ajustes especiales para el título ---
                    if (props.data.table !== null) {
                        // Caso mesa normal
                        jsonTicket.tittle.table = tableStore.getTableByID(props.data.table).description;
                    } else {
                        console.log(settingsStore);
                        // console.log(settingsStore.businessSettings.orders?.["fast_sale_format"]);
                        // Caso sin mesa
                        if (settingsStore.businessSettings.order?.["fast_sale_format"] === true) {
                            jsonTicket.tittle.table = "VENTA RÁPIDA";
                        } else {
                            jsonTicket.tittle.table = props.data.delivery_info ? "DELIVERY" : "PARA LLEVAR";
                        }
                    }

                    if (props.data.delivery_info || props.data.table) {
                        delete jsonTicket.header.reference;
                    }

                    if (send===true) {
                        try {
                            const response = await http.post('orders/print-proxy/', jsonTicket);
                            if (response.status === 200) {
                                message.success(response.data.success || 'Ticket enviado a imprimir');
                            }
                        } catch (error) {
                            console.error("Error enviando ticket", error);
                            message.error("Error de conexión con el servidor");
                            message.error("Iniciando impresión manual");

                            const ticket = tickets.value[i];
                            nextTick(() => {
                                if(ticket && ticket.$el) {
                                    const format = [ticket.$el.clientWidth, ticket.$el.clientHeight + 30];
                                    const doc = new jsPDF({
                                        unit: "px",
                                        format: format,
                                        orientation: "m",
                                        hotfixes: ["px_scaling"]
                                    });
                                    doc.html(ticket.$el.innerHTML, {
                                        callback: async function(doc) {
                                            doc.autoPrint();
                                            const hiddeFrame = document.createElement("iframe");
                                            hiddeFrame.style.position = "fixed";
                                            hiddeFrame.style.width = "1px";
                                            hiddeFrame.style.height = "1px";
                                            hiddeFrame.style.opacity = "0.01";
                                            hiddeFrame.src = doc.output("bloburl");
                                            document.body.appendChild(hiddeFrame);
                                        }
                                    });
                                } else {
                                    console.error("No se pudo encontrar el elemento del ticket.");
                                }
                            });
                        }
                    }
                    resolve();
                };
                sendTicketData();
            });
        };

        function startManualPrint() {
            if(delivery.value && delivery.value.$el) {
                const format = [delivery.value.$el.clientWidth, delivery.value.$el.clientHeight + 30];
                const doc = new jsPDF({
                    unit: "px",
                    format: format,
                    orientation: "m",
                    hotfixes: ["px_scaling"]
                });
                doc.html(delivery.value.$el.innerHTML, {
                    callback: async function(doc) {
                        doc.autoPrint();
                        const hiddeFrame = document.createElement("iframe");
                        hiddeFrame.style.position = "fixed";
                        hiddeFrame.style.width = "1px";
                        hiddeFrame.style.height = "1px";
                        hiddeFrame.style.opacity = "0.01";
                        hiddeFrame.src = doc.output("bloburl");
                        document.body.appendChild(hiddeFrame);
                    }
                });
            } else {
                console.error("No se pudo encontrar el elemento del ticket.");
            }
        }

        const printTicketsForAllPlaces = async(send = false) => {
            if (!places.value.length) {
                console.warn(logPrefix, "No places available for printing", {
                    orderId: props.data?.id,
                    orderDetailsCount: orderDetails.value?.length
                });
            }
            for(const [i, place] of places.value.entries()) {
                console.info(logPrefix, "Queue place for printing", place);
                await printTicket(i, place, send);
            }
        };

        const generate = async() => {
            console.info(logPrefix, "Generate print", {
                orderId: props.data?.id,
                orderType: props.data?.order_type,
                details: orderDetails.value?.length,
                places: places.value?.length,
                printHtml: settingsStore.business_settings?.printer?.print_html,
                nativePrinting: settingsStore.business_settings?.printer?.native_printing
            });
            if(props.data.order_type === "D" && settingsStore.business_settings.printer.print_html) {
                await printDelivery(true);
            }
            await printTicketsForAllPlaces(true);
            emit("printed");
            emit("update:show", false);
        };

        return {
            tickets,
            delivery,
            printTicket,
            // printFitting,
            printDelivery,
            places,
            // fittingPlaces,
            fittings,
            generate,
            settingsStore,
            printTicketsForAllPlaces
        };
    }
});
</script>

<style lang="scss" scoped></style>
