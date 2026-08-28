import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { numeroALetras } from "@/hooks/numberText";
import qr from "qrcode";
import { useTableStore } from "@/store/modules/table";
import { useSettingsStore } from "@/store/modules/settings";
import { useSaleStore } from "@/store/modules/sale";

/**
 * Utility to convert an image URL into base64 for jsPDF
 */
const getImageBase64FromURL = async (url) => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
        });
    } catch (e) {
        console.warn("No se pudo cargar el logo para el PDF A4:", e);
        return null;
    }
};

/**
 * Utility to generate QR Code as Base64 Data URL
 */
const generateQRBase64 = async (qrText) => {
    if (!qrText) return null;
    try {
        return await qr.toDataURL(qrText, {
            margin: 1,
            width: 150,
            errorCorrectionLevel: 'M'
        });
    } catch (err) {
        console.error("Error generando QR:", err);
        return null;
    }
};

/**
 * Helper to resolve human readable payment method name
 */
const resolvePaymentMethodName = (method, saleStore) => {
    if (!method && method !== 0) return "";
    if (typeof method === "string") {
        // Si el string es una fecha (YYYY-MM-DD), no es un método de pago
        if (/^\d{4}-\d{2}-\d{2}/.test(method.trim())) return "";
        return method;
    }
    if (typeof method === "object") {
        return method.description || method.name || method.payment_method_name || method.payment_method || "";
    }
    if (saleStore?.payment_methods) {
        const found = saleStore.payment_methods.find(m => m.id === method || m.id === Number(method));
        if (found) return found.description;
    }
    return String(method);
};

/**
 * Generates an A4 PDF for a sale voucher (Boleta, Factura, Nota de Venta)
 * 
 * @param {Object} rawData - The sale json_sale data or sale object
 * @param {Object} businessStore - Pinia business store with company information
 * @param {Object} dataOrder - Additional sale metadata (e.g. by_consumption, payment_condition, etc.)
 * @returns {Promise<jsPDF>} - The jsPDF document instance (supports .save() and .output('blob'))
 */
export const generateVoucherA4PDF = async (rawData, businessStore, dataOrder = {}) => {
    const settingsStore = useSettingsStore();
    const tableStore = useTableStore();
    const saleStore = useSaleStore();

    // 1. Normalizar estructura de datos de venta
    let data = rawData;
    if (rawData && typeof rawData === "object" && rawData.json_sale) {
        try {
            data = typeof rawData.json_sale === "string" ? JSON.parse(rawData.json_sale) : rawData.json_sale;
        } catch (e) {
            data = rawData;
        }
    } else if (typeof rawData === "string") {
        try {
            data = JSON.parse(rawData);
        } catch (e) {
            data = {};
        }
    }

    const business = businessStore?.business || {};
    const dataCustomer = data?.datos_del_cliente_o_receptor || {};
    const totales = data?.totales || {};
    const items = data?.items || [];
    const totalSaleNumber = parseFloat(totales?.total_venta || dataOrder?.amount || 0);
    const totalSaleText = numeroALetras(totalSaleNumber.toFixed(2), "SOLES");
    const byConsumption = Boolean(dataOrder?.by_consumption || data?.por_consumo);

    // Información adicional y usuario
    const rawInfo = data?.informacion_adicional || "";
    const infoParts = typeof rawInfo === "string" ? rawInfo.split("|") : [];
    const cashierUser = infoParts[0] || dataOrder?.username || dataOrder?.user?.username || dataOrder?.user?.names || "-";
    
    // Condición de pago
    let paymentCondition = "CONTADO";
    if (dataOrder?.payment_condition === 2 || dataOrder?.payment_condition === "2" || infoParts[1]?.toUpperCase().includes("CRÉDITO") || infoParts[1]?.toUpperCase().includes("CREDITO")) {
        paymentCondition = "CRÉDITO";
    }

    // Métodos de pago (simple o múltiple)
    let paymentsList = [];
    const rawPayments = dataOrder?.payments || rawData?.payments || data?.payments;
    if (Array.isArray(rawPayments) && rawPayments.length > 0) {
        paymentsList = rawPayments.map(p => {
            const name = p.payment_method_name || p.payment_name || p.description || resolvePaymentMethodName(p.payment_method, saleStore) || "PAGO";
            const amount = parseFloat(p.amount || 0).toFixed(2);
            return { name: name.toUpperCase(), amount };
        });
    }

    let singlePaymentMethod = "";
    if (paymentsList.length === 0) {
        const rawMethod = dataOrder?.payment_method_description || dataOrder?.payment_method || data?.payment_method;
        singlePaymentMethod = (resolvePaymentMethodName(rawMethod, saleStore) || "EFECTIVO").toUpperCase();
    }

    // Tipo de documento y descripción
    const docCode = String(data?.codigo_tipo_documento || dataOrder?.document_type || "03");
    let docTitle = "BOLETA DE VENTA ELECTRÓNICA";
    let isNoteOfSale = false;

    if (docCode === "01") {
        docTitle = "FACTURA ELECTRÓNICA";
    } else if (docCode === "03") {
        docTitle = "BOLETA DE VENTA ELECTRÓNICA";
    } else if (docCode === "80" || docCode === "080") {
        docTitle = "NOTA DE VENTA";
        isNoteOfSale = true;
    } else {
        const serieStr = String(data?.serie_documento || dataOrder?.serie || "");
        if (serieStr.startsWith("F")) docTitle = "FACTURA ELECTRÓNICA";
        else if (serieStr.startsWith("B")) docTitle = "BOLETA DE VENTA ELECTRÓNICA";
        else if (serieStr.startsWith("N")) {
            docTitle = "NOTA DE VENTA";
            isNoteOfSale = true;
        }
    }

    const serieDocumento = String(data?.serie_documento || dataOrder?.serie || "BV01");
    const rawNumber = String(data?.numero_documento || dataOrder?.number || "0");
    const numeroDocumento = rawNumber.padStart(8, "0");

    // Crear documento jsPDF en A4 (210 x 297 mm)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const pageWidth = 210;
    const pageMargin = 14;
    const contentWidth = pageWidth - (pageMargin * 2); // 182mm

    // ==========================================
    // 1. CABECERA: EMPRESA (IZQ) Y RECUADRO RUC (DER)
    // ==========================================
    let currentY = 9;

    // Intentar cargar logo
    let logoBase64 = null;
    if (business?.logo_url) {
        logoBase64 = await getImageBase64FromURL(`${business.logo_url}?t=${Date.now()}`);
    }

    let leftTextStartY = currentY + 3;
    if (logoBase64) {
        doc.addImage(logoBase64, "PNG", pageMargin, currentY, 36, 20, undefined, "FAST");
        leftTextStartY = currentY + 20 + 6; // 6mm de separación limpia bajo el logo
    }

    // Datos de la empresa (Izquierda)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    const businessName = business?.name || "RESTAURANTE";
    const nameLines = doc.splitTextToSize(businessName.toUpperCase(), 105);
    nameLines.forEach(line => {
        doc.text(line, pageMargin, leftTextStartY);
        leftTextStartY += 4.5;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    if (business?.commercial_name && business.commercial_name !== business.name) {
        doc.text(business.commercial_name, pageMargin, leftTextStartY);
        leftTextStartY += 4;
    }

    if (business?.fiscal_address) {
        const addressLines = doc.splitTextToSize(business.fiscal_address, 105);
        addressLines.forEach(line => {
            doc.text(line, pageMargin, leftTextStartY);
            leftTextStartY += 3.8;
        });
    }

    const contactInfo = [];
    if (business?.phone) contactInfo.push(`Telf: ${business.phone}`);
    if (business?.email) contactInfo.push(`Email: ${business.email}`);
    if (contactInfo.length > 0) {
        doc.text(contactInfo.join("  |  "), pageMargin, leftTextStartY);
        leftTextStartY += 3.8;
    }

    // Recuadro del Comprobante (Derecha)
    const boxX = 126;
    const boxY = 9;
    const boxWidth = 70;
    const boxHeight = 35;

    // Borde elegante
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.6);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "S");

    // Fondo suave para el título del comprobante
    doc.setFillColor(241, 245, 249);
    doc.rect(boxX + 0.6, boxY + 10.5, boxWidth - 1.2, 12.5, "F");

    // RUC
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`R.U.C. N° ${business?.ruc || "10000000000"}`, boxX + (boxWidth / 2), boxY + 7, { align: "center" });

    // Tipo de comprobante
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(docTitle, boxX + (boxWidth / 2), boxY + 18.5, { align: "center" });

    // Serie y Correlativo
    doc.setFontSize(12);
    doc.setTextColor(207, 19, 34); // Rojo institucional elegante para correlativo
    doc.text(`${serieDocumento} - ${numeroDocumento}`, boxX + (boxWidth / 2), boxY + 30, { align: "center" });

    // ==========================================
    // 2. RECUADRO DE DATOS DEL CLIENTE Y EMISIÓN
    // ==========================================
    currentY = Math.max(leftTextStartY + 2, boxY + boxHeight + 4);

    const clientBoxY = currentY;
    const clientBoxHeight = 27;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageMargin, clientBoxY, contentWidth, clientBoxHeight, 1.5, 1.5, "S");

    // Columna Izquierda: Cliente
    const colLeftX = pageMargin + 4;
    let clientY = clientBoxY + 5.5;

    const docTypeLabel = String(dataCustomer?.codigo_tipo_documento_identidad) === "6" ? "RUC" : "DNI / DOC";
    const clientName = dataCustomer?.apellidos_y_nombres_o_razon_social || dataOrder?.customer_name || "CLIENTES VARIOS";
    const clientDoc = dataCustomer?.numero_documento || dataOrder?.customer_document || "00000000";
    const clientAddress = dataCustomer?.direccion || "-";

    doc.setFontSize(8.5);

    // Cliente / Razón Social
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("CLIENTE:", colLeftX, clientY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(clientName, 95)[0] || "-", colLeftX + 17, clientY);
    clientY += 5.2;

    // Documento
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`${docTypeLabel}:`, colLeftX, clientY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(clientDoc, colLeftX + 17, clientY);
    clientY += 5.2;

    // Dirección
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("DIRECCIÓN:", colLeftX, clientY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(clientAddress, 95)[0] || "-", colLeftX + 19, clientY);

    // Columna Derecha: Emisión y Pago
    const colRightX = pageMargin + 112;
    let rightMetaY = clientBoxY + 5.5;

    const fechaEmision = data?.fecha_de_emision || dataOrder?.date_sale || "";
    const horaEmision = data?.hora_de_emision || "";
    const fechaVencimiento = data?.fecha_de_vencimiento || fechaEmision;

    // Fecha Emisión
    doc.setFont("helvetica", "bold");
    doc.text("F. EMISIÓN:", colRightX, rightMetaY);
    doc.setFont("helvetica", "normal");
    doc.text(`${fechaEmision} ${horaEmision}`.trim(), colRightX + 26, rightMetaY);
    rightMetaY += 5.2;

    // F. Vencimiento / Moneda
    doc.setFont("helvetica", "bold");
    doc.text("MONEDA:", colRightX, rightMetaY);
    doc.setFont("helvetica", "normal");
    doc.text("SOLES (S/)", colRightX + 26, rightMetaY);
    rightMetaY += 5.2;

    // Condición y Mesa/Orden
    let orderTableDesc = "";
    if (dataOrder?.table) {
        orderTableDesc = tableStore?.getTableByID(dataOrder.table)?.description || `Mesa ${dataOrder.table}`;
    } else if (dataOrder?.order_data?.table) {
        orderTableDesc = tableStore?.getTableByID(dataOrder.order_data.table)?.description || `Mesa ${dataOrder.order_data.table}`;
    }

    doc.setFont("helvetica", "bold");
    doc.text("FORMA PAGO:", colRightX, rightMetaY);
    doc.setFont("helvetica", "normal");
    doc.text(`${paymentCondition} ${orderTableDesc ? `| ${orderTableDesc}` : ""}`.trim(), colRightX + 26, rightMetaY);

    // ==========================================
    // 3. TABLA DE PRODUCTOS / ÍTEMS
    // ==========================================
    currentY = clientBoxY + clientBoxHeight + 5;

    let tableBody = [];
    if (byConsumption) {
        tableBody = [
            [
                "1",
                "1",
                "NIU",
                "POR CONSUMO DE ALIMENTOS Y BEBIDAS",
                totalSaleNumber.toFixed(2),
                totalSaleNumber.toFixed(2)
            ]
        ];
    } else {
        tableBody = items.map((item, index) => {
            const qty = parseFloat(item?.cantidad || 1);
            const unitPrice = parseFloat(item?.valor_unitario || item?.precio || 0);
            const itemTotal = parseFloat(item?.total_item || item?.total || (qty * unitPrice));
            const desc = item?.descripcion || item?.product_name || "PRODUCTO";

            return [
                String(index + 1),
                qty % 1 === 0 ? String(qty) : qty.toFixed(2),
                item?.unidad_de_medida || "NIU",
                desc,
                unitPrice.toFixed(2),
                itemTotal.toFixed(2)
            ];
        });
    }

    autoTable(doc, {
        startY: currentY,
        head: [["ITEM", "CANT.", "UNIDAD", "DESCRIPCIÓN", "P. UNITARIO", "TOTAL"]],
        body: tableBody,
        margin: { left: pageMargin, right: pageMargin },
        theme: "plain",
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8.5,
            cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 }
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 16, halign: "center" },
            2: { cellWidth: 18, halign: "center" },
            3: { cellWidth: "auto", halign: "left" },
            4: { cellWidth: 24, halign: "right" },
            5: { cellWidth: 24, halign: "right" }
        }
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : currentY + 30;

    // ==========================================
    // 4. TOTALES, QR Y PIE DE PÁGINA
    // ==========================================
    // Generar código QR
    const qrPayload = `${business?.ruc || ""}|${serieDocumento}|${totales?.total_igv || "0.00"}|${horaEmision}|${clientDoc}|${numeroDocumento}|${totalSaleNumber.toFixed(2)}|${dataCustomer?.codigo_tipo_documento_identidad || "1"}|`;
    const qrBase64 = await generateQRBase64(qrPayload);

    const footerStartY = currentY;

    // Lado Izquierdo: Monto en letras, QR e info legal
    const leftWidth = 108;
    let leftY = footerStartY;

    // Importe en letras
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("SON:", pageMargin, leftY + 2);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(totalSaleText, 95), pageMargin + 9, leftY + 2);
    leftY += 8;

    // Dimensiones de Totales y QR
    const totalsTableX = 124;
    const totalsTableWidth = 72;

    // Código QR
    if (qrBase64) {
        doc.addImage(qrBase64, "PNG", pageMargin, leftY, 28, 28);
    }

    // Datos junto al QR
    const metaQrX = pageMargin + 31;
    const metaValueX = metaQrX + 29;
    const metaValueMaxWidth = totalsTableX - metaValueX - 3;
    let metaQrY = leftY + 4;
    const metaLineHeight = 4.6;

    doc.setFontSize(7.5);
    
    // Forma de Pago / Condición
    doc.setFont("helvetica", "bold");
    doc.text("CONDICIÓN:", metaQrX, metaQrY);
    doc.setFont("helvetica", "normal");
    doc.text(paymentCondition, metaValueX, metaQrY);
    metaQrY += metaLineHeight;

    // Métodos de Pago
    if (paymentsList.length > 1) {
        doc.setFont("helvetica", "bold");
        doc.text("PAGOS MÚLTIPLES:", metaQrX, metaQrY);
        metaQrY += metaLineHeight;
        doc.setFont("helvetica", "normal");
        paymentsList.forEach(p => {
            doc.text(`• ${p.name}:`, metaQrX + 3, metaQrY);
            doc.text(`S/ ${p.amount}`, metaValueX, metaQrY);
            metaQrY += 3.8;
        });
    } else {
        const methodDisplay = paymentsList.length === 1 ? paymentsList[0].name : (singlePaymentMethod || "EFECTIVO");
        doc.setFont("helvetica", "bold");
        doc.text("MÉTODO DE PAGO:", metaQrX, metaQrY);
        doc.setFont("helvetica", "normal");
        const methodLines = doc.splitTextToSize(methodDisplay, metaValueMaxWidth);
        doc.text(methodLines[0] || methodDisplay, metaValueX, metaQrY);
        metaQrY += metaLineHeight;
    }

    // Atendido por (Cajero / Mozo)
    doc.setFont("helvetica", "bold");
    doc.text("ATENDIDO POR:", metaQrX, metaQrY);
    doc.setFont("helvetica", "normal");
    const cashierLines = doc.splitTextToSize(cashierUser.toUpperCase(), metaValueMaxWidth);
    doc.text(cashierLines[0] || cashierUser.toUpperCase(), metaValueX, metaQrY);
    metaQrY += metaLineHeight;

    // N° Orden
    if (dataOrder?.order_id || data?.order_id || dataOrder?.id) {
        doc.setFont("helvetica", "bold");
        doc.text("N° ORDEN:", metaQrX, metaQrY);
        doc.setFont("helvetica", "normal");
        doc.text(String(dataOrder?.order_id || data?.order_id || dataOrder?.id), metaValueX, metaQrY);
        metaQrY += metaLineHeight;
    }

    // Servicio / Mesa / Delivery
    let serviceInfo = "";
    if (dataOrder?.delivery_info) {
        const deliv = dataOrder.delivery_info;
        serviceInfo = `DELIVERY ${deliv.phone ? `(Telf: ${deliv.phone})` : ""}`;
    } else if (dataOrder?.order_type === "P" || dataOrder?.order_type === "TAKE_AWAY") {
        serviceInfo = "PARA LLEVAR";
    } else if (orderTableDesc) {
        serviceInfo = orderTableDesc;
    }
    if (serviceInfo) {
        doc.setFont("helvetica", "bold");
        doc.text("SERVICIO / UBIC:", metaQrX, metaQrY);
        doc.setFont("helvetica", "normal");
        const servLines = doc.splitTextToSize(serviceInfo, metaValueMaxWidth);
        doc.text(servLines[0] || "-", metaValueX, metaQrY);
        metaQrY += metaLineHeight;
    }

    // Observaciones si existen
    const observaciones = (dataOrder?.observations || data?.observaciones || "").trim();
    if (observaciones) {
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVACIÓN:", metaQrX, metaQrY);
        doc.setFont("helvetica", "normal");
        const obsLines = doc.splitTextToSize(observaciones, metaValueMaxWidth);
        obsLines.forEach(line => {
            doc.text(line, metaValueX, metaQrY);
            metaQrY += 3.8;
        });
    }

    // Lado Derecho: Resumen de Totales
    const opGravadas = parseFloat(totales?.total_operaciones_gravadas || 0);
    const opExoneradas = parseFloat(totales?.total_operaciones_exoneradas || 0);
    const opGratuitas = parseFloat(totales?.total_operaciones_gratuitas || 0);
    const opInafectas = parseFloat(totales?.total_operaciones_inafectas || 0);
    const totalDescuentos = parseFloat(totales?.total_descuentos || dataOrder?.discount || 0);
    const totalCargos = parseFloat(totales?.cargos || dataOrder?.other_charges || 0);
    const totalIgv = parseFloat(totales?.total_igv || 0);
    const totalIcbper = parseFloat(totales?.total_impuestos_bolsa_plastica || dataOrder?.icbper || 0);
    const givenAmount = parseFloat(dataOrder?.given_amount || totalSaleNumber);
    const vuelto = (paymentCondition === "CONTADO" && givenAmount > totalSaleNumber) ? (givenAmount - totalSaleNumber) : 0;

    const totalsRows = [];
    if (opGravadas > 0 || (!isNoteOfSale && opExoneradas === 0 && opInafectas === 0)) {
        totalsRows.push(["OP. GRAVADA:", `S/ ${opGravadas.toFixed(2)}`]);
    }
    if (opExoneradas > 0) {
        totalsRows.push(["OP. EXONERADA:", `S/ ${opExoneradas.toFixed(2)}`]);
    }
    if (opInafectas > 0) {
        totalsRows.push(["OP. INAFECTA:", `S/ ${opInafectas.toFixed(2)}`]);
    }
    if (opGratuitas > 0) {
        totalsRows.push(["OP. GRATUITA:", `S/ ${opGratuitas.toFixed(2)}`]);
    }
    if (totalDescuentos > 0) {
        totalsRows.push(["DESCUENTO:", `S/ ${totalDescuentos.toFixed(2)}`]);
    }
    if (totalCargos > 0) {
        totalsRows.push(["OTROS CARGOS / SERV:", `S/ ${totalCargos.toFixed(2)}`]);
    }
    if (totalIgv > 0) {
        const itemWithRate = items.find((i) => i.porcentaje_igv !== undefined && i.porcentaje_igv !== null && Number(i.porcentaje_igv) > 0);
        const dynamicLabel = itemWithRate ? `I.G.V. (${Number(itemWithRate.porcentaje_igv)}%):` : "I.G.V.:";
        totalsRows.push([dynamicLabel, `S/ ${totalIgv.toFixed(2)}`]);
    }
    if (totalIcbper > 0) {
        totalsRows.push(["ICBPER:", `S/ ${totalIcbper.toFixed(2)}`]);
    }

    totalsRows.push(["IMPORTE TOTAL:", `S/ ${totalSaleNumber.toFixed(2)}`]);

    if (paymentCondition === "CONTADO") {
        if (givenAmount > 0 && givenAmount >= totalSaleNumber) {
            totalsRows.push(["EFECTIVO RECIBIDO:", `S/ ${givenAmount.toFixed(2)}`]);
            if (vuelto > 0) {
                totalsRows.push(["VUELTO:", `S/ ${vuelto.toFixed(2)}`]);
            }
        }
    } else if (paymentCondition === "CRÉDITO") {
        totalsRows.push(["MONTO PENDIENTE:", `S/ ${totalSaleNumber.toFixed(2)}`]);
        if (fechaVencimiento) {
            totalsRows.push(["F. VENCIMIENTO:", fechaVencimiento]);
        }
    }

    autoTable(doc, {
        startY: footerStartY,
        body: totalsRows,
        margin: { left: totalsTableX, right: pageMargin },
        theme: "plain",
        styles: {
            fontSize: 8,
            cellPadding: { top: 1.2, bottom: 1.2, left: 1, right: 1 },
            textColor: [30, 41, 59]
        },
        columnStyles: {
            0: { cellWidth: 42, halign: "left", fontStyle: "bold" },
            1: { cellWidth: 30, halign: "right" }
        },
        didParseCell: function (cellData) {
            // Resaltar la fila de IMPORTE TOTAL
            if (cellData.row.raw[0] === "IMPORTE TOTAL:") {
                cellData.cell.styles.fontStyle = "bold";
                cellData.cell.styles.fontSize = 9.5;
                cellData.cell.styles.textColor = [15, 23, 42];
                cellData.cell.styles.fillColor = [241, 245, 249];
            }
        }
    });

    const finalFooterY = Math.max(leftY + 35, doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : footerStartY + 35);

    // Leyendas legales al pie
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);

    const legalTexts = [
        "Representación impresa del Comprobante de Pago Electrónico.",
        `Consulte la validez de su comprobante ingresando a: ${business?.website || "https://facturacion.sunat.gob.pe"}/buscar`
    ];

    if (settingsStore?.business_settings?.sale?.show_amazon_legend) {
        legalTexts.push("BIENES TRANSFERIDOS EN LA AMAZONÍA PARA SER CONSUMIDOS EN LA MISMA");
        legalTexts.push("SERVICIOS PRESTADOS EN LA AMAZONÍA PARA SER CONSUMIDOS EN LA MISMA");
    }

    let legalY = finalFooterY;
    legalTexts.forEach(line => {
        doc.text(line, pageWidth / 2, legalY, { align: "center" });
        legalY += 3.5;
    });

    return doc;
};
