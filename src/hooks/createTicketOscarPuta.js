import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { numeroALetras } from "@/hooks/numberText";
import qr from "qrcode";
import { useTableStore } from "@/store/modules/table";

export const generateVoucherPDF = async(data, infoHeader, dataOrder) => {

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [ 80, 300 ] // largo adaptable
    });

    const dataCustomer = data?.["datos_del_cliente_o_receptor"];
    const totales = data?.["totales"];
    const totalSale = numeroALetras(data?.["totales"]?.["total_venta"].toFixed(2), "SOLES");
    const info = data.informacion_adicional.split("|");
    const tableStore = useTableStore();
    const orderData = dataOrder?.["order_data"];
    const byConsumption = Boolean(dataOrder?.by_consumption);

    const title = () => {
        switch (String(data?.["codigo_tipo_documento"])) {
            case "01":
                return "FACTURA ELECTRÓNICA";
            case "03":
                return "BOLETA  DE VENTA ELECTRÓNICA";
            case "80":
            case "080":
                return "NOTA DE VENTA";
            default:
                console.error("tipo de documento inválido", data?.["codigo_tipo_documento"]);
                return "";
        }
    };

    const generateQR = () => {
        let code_qr;
        qr.toDataURL(
            `${ infoHeader.business.ruc }|${ data?.["serie_documento"] }|${ totales?.["total_igv"] }|${ data?.["hora_de_emision"] }|${ dataCustomer?.["numero_documento"] }|${ data?.["numero_documento"] }|${ totales?.["total_venta"] }|${ dataCustomer?.["codigo_tipo_documento_identidad"] }|`,
            (err, code) => {
                if (err) return console.error("error occurred");
                code_qr = code;
            }
        );
        return code_qr;
    };

    const getImageBase64FromURL = async(url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
        });
    };

    let y = 5;

    const logoUrl = `${ infoHeader.business?.["logo_url"] }?t=${ Date.now() }`;
    const logoBase64 = await getImageBase64FromURL(logoUrl);

    if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, y-3, 60, 50);
        y += 48;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`RUC: ${infoHeader.business.ruc}`, 40, y, { align: "center" });
    y += 2;
    const businessNameLines = doc.splitTextToSize(infoHeader.business.name, 70);
    businessNameLines.forEach(line => {
        y += 4;
        doc.text(line, 40, y, { align: "center" });
    });

    if (infoHeader.business.commercial_name) {
        [ infoHeader.business.commercial_name ].forEach(line => {
            y += 4;
            doc.text(line, 40, y, { align: "center" });
        });
    }
    y += 4;
    doc.text(infoHeader.business.fiscal_address, 40, y, { align: "center" });
    y += 4;

    [ title() ].forEach(line => {
        // y += 3;
        doc.text(line, 40, y, { align: "center" });
    });
    y += 3;

    doc.setFontSize(10);
    doc.text(`${ data?.["serie_documento"] }-${ data?.["numero_documento"] }`, 40, y, { align: "center" });
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.text(`F. EMISIÓN: ${ data?.["fecha_de_emision"] } ${ data?.["hora_de_emision"] }`, 5, y);
    y += 4;

    doc.text(`F. VENCIMIENTO: ${ data?.["fecha_de_vencimiento"] }`, 5, y);
    y += 4;

    doc.text(`DNI / RUC: ${ dataCustomer?.["numero_documento"] }`, 5, y);
    y += 4;

    const clienteText = `CLIENTE: ${ dataCustomer?.["apellidos_y_nombres_o_razon_social"] }`;
    const direccionText = `DIRECCIÓN: ${ dataCustomer?.["direccion"] }`;

    const clienteLines = doc.splitTextToSize(clienteText, 70); // 70mm de ancho
    clienteLines.forEach(line => {
        doc.text(line, 5, y);
        y += 4;
    });

    const direccionLines = doc.splitTextToSize(direccionText, 70);
    direccionLines.forEach(line => {
        doc.text(line, 5, y);
        y += 4;
    });

    // autoTable(doc, {
    //     startY: y,
    //     head: [ [ "CANT", "DESCRIPCIÓN", "PRECIO", "TOTAL" ] ],
    //     body: data.items.map(item => [
    //         String(item?.["cantidad"]),
    //         doc.splitTextToSize(item.descripcion, 40),
    //         item?.["valor_unitario"].toFixed(2),
    //         item?.["total_item"].toFixed(2)
    //     ]),
    //     theme: "grid",
    //     styles: { fontSize: 6, cellPadding: 0.5 },
    //     headStyles: { fillColor: "FFFFFF", fontSize: 6.5, cellPadding: 0.5, textColor: "000000" },
    //     bodyStyles: { fontSize: 7, fontStyle: "bold", cellPadding: 0.5, textColor: "000000" },
    //     margin: { left: 3, right: 3 },
    //     columnStyles: {
    //         0: { cellWidth: 10 },
    //         1: { cellWidth: 40 },
    //         2: { cellWidth: 12 },
    //         3: { cellWidth: 12 }
    //     }
    // });

    // Si es por consumo (impresión simplificada)
    if (byConsumption) {
    const head = [[ "DESCRIPCIÓN", "TOTAL" ]];
    const totalVenta = Number(totales?.["total_venta"] ?? 0).toFixed(2);
    const body = [["POR CONSUMO DE ALIMENTOS", totalVenta]];

    autoTable(doc, {
        startY: y,
        head,
        body,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 0.6 },
        headStyles: { fillColor: "FFFFFF", fontSize: 7.5, textColor: "000000" },
        bodyStyles: { fontSize: 7, fontStyle: "normal", textColor: "000000" },
        margin: { left: 3, right: 3 },
        columnStyles: {
        0: { cellWidth: 55 }, // ancho para descripción
        1: { cellWidth: 19, halign: "left" } // ancho para total y alineado a la derecha
        }
    });

    } else {
    // comportamiento original de 4 columnas (ajustado para usar join en descripciones)
    autoTable(doc, {
        startY: y,
        head: [[ "CANT", "DESCRIPCIÓN", "PRECIO", "TOTAL" ]],
        body: (data.items || []).map(item => [
        String(item?.["cantidad"] ?? ""),
        (doc.splitTextToSize(item?.descripcion ?? "", 40) || []).join("\n"),
        Number(item?.["valor_unitario"] ?? 0).toFixed(2),
        Number(item?.["total_item"] ?? item?.total ?? 0).toFixed(2)
        ]),
        theme: "grid",
        styles: { fontSize: 6, cellPadding: 0.5 },
        headStyles: { fillColor: "FFFFFF", fontSize: 6.5, cellPadding: 0.5, textColor: "000000" },
        bodyStyles: { fontSize: 7, fontStyle: "bold", cellPadding: 0.5, textColor: "000000" },
        margin: { left: 3, right: 3 },
        columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 12, halign: "right" },
        3: { cellWidth: 12, halign: "right" }
        }
    });
    }

    // actualizar y usando lastAutoTable (fallback por si no se creó)
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : y + 4;

    y = doc?.["lastAutoTable"].finalY + 4;
    if (totales?.["total_operaciones_gravadas"]) {
        doc.text(`OP. GRAVADAS: S/ ${ totales?.["total_operaciones_gravadas"].toFixed(2) }`, 35, y);
        y += 4;
    }
    if (totales?.["total_operaciones_exoneradas"]) {
        doc.text(`OP. EXONERADA: S/ ${ totales?.["total_operaciones_exoneradas"].toFixed(2) }`, 33, y);
        y += 4;
    }
    if (totales?.["total_operaciones_gratuitas"]) {
        doc.text(`OP. GRATUITAS: S/ ${ totales?.["total_operaciones_gratuitas"].toFixed(2) }`, 34.5, y);
        y += 4;
    }
    if (totales?.["total_descuentos"]) {
        doc.text(`DESCUENTO TOTAL: S/ ${ totales?.["total_descuentos"]?.toFixed(2) || "0.00" }`, 28.5, y);
        y += 4;
    }
    if (totales?.["total_impuestos_bolsa_plastica"]) {
        doc.text(`ICBPER: S/ ${ totales?.["total_impuestos_bolsa_plastica"].toFixed(2) }`, 46, y);
        y += 4;
    }
    if (totales?.["total_igv"]) {
        doc.text(`I.G.V. : S/ ${ totales?.["total_igv"].toFixed(2) }`, 48.5, y);
        y += 4;
    }
    doc.text(`IMPORTE TOTAL : S/ ${ totales?.["total_venta"].toFixed(2) }`, 33, y);
    y += 4;

    doc.text(`EFECTIVO: S/ ${ dataOrder.payment_condition === 1
                              ? parseFloat(dataOrder.given_amount).toFixed(2) : totales?.["total_venta"].toFixed(2) }`, 42.5, y);
    y += 4;

    doc.text(`SON: ${ totalSale }`, 3, y);
    y += 6;

    doc.addImage(generateQR(), "PNG", 0, y - 5, 30, 30);
    let rightY = y + (generateQR() ? 0 : 0);

    doc.text(`CONDICIÓN PAGO: ${ info[1] }`, 30, rightY);
    rightY += 4;

    doc.text(`MÉTODO PAGO: ${ info[2] }`, 30, rightY);
    rightY += 4;

    // doc.text(`S/ ${ totales?.["total_venta"].toFixed(2) }`, 30, rightY);
    // rightY += 4;

    doc.text(`USUARIO: ${ info[0] }`, 30, rightY);
    rightY += 4;
    if (dataOrder.order_id) {
        doc.text(`ORDEN N°: ${ dataOrder.order_id }`, 30, rightY);
        rightY += 4;
    }
    if (data?.["serie_documento"].includes("FL") && data?.["serie_documento"].includes("BL")) { 
        doc.text(`${ !orderData?.table ? !orderData.delivery_info ? "PARA LLEVAR" : "DELIVERY"
                                       : tableStore.getTableByID(orderData.table).description }`, 30, rightY);
    }
        y = Math.max(y + 25, rightY + 6);

    const footer = [
        "Representación impresa del comprobante electrónico. Puede verificar utilizando su clave SOL o ingresando a:",
        `${ infoHeader.business.website }/buscar`,
        "BIENES CONSUMIDOS/SERVICIOS PRESTADOS EN LA AMAZONIA PARA SER CONSUMIDAS EN LA MISMA"
    ];

    if (footer) {
        doc.setFontSize(6);
        footer.forEach(line => {
            doc.text(doc.splitTextToSize(line, 70), 40, y, { align: "center" });
            y += 5;
        });
    }
    // doc.save("xd.pdf");
    return doc.output("blob");
};
