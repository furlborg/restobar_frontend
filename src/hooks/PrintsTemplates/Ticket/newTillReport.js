import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ref } from "vue";
import { getBusinessBranchs } from "@/api/modules/business";

export const generateDynamicCajaReport = async(dataTill) => {
    let x = 2;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [ 80, 1000 ]
    });

    const business = ref({ commercial_name: "", fiscal_address: "", ruc: "" });
    await getBusinessBranchs().then((response) => {
        business.value = response.data;
    }).catch((error) => {
        console.error(error);
    });

    const safe = (val) => parseFloat(val ?? "0").toFixed(2);

    const sectionTitle = (text, y, fontSize = 9, defaultAdorn = "--------") => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, "bold");
        doc.text(`${ defaultAdorn } ${ text.toUpperCase() } ${ defaultAdorn }`, 35, y, { align: "center" });
    };

    let currentY = 3;

    doc.setFontSize(10);
    let nameBusinessSplitText = doc.splitTextToSize(business.value.commercial_name || "boobs", 75);
    for (let i = 0; i < nameBusinessSplitText.length; i++) {
        doc.text(nameBusinessSplitText[i], x + 15, currentY + 2);
        currentY += 5;
    }
    currentY += 1;

    doc.setFontSize(10);
    let addressSplitText = doc.splitTextToSize(business.value.fiscal_address || "boobs", 75);
    for (let i = 0; i < addressSplitText.length; i++) {
        doc.text(addressSplitText[i], x + 7, currentY + 2);
        currentY += 3;
    }
    currentY += 3;

    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text(`RUC: ${ business.value.ruc }`, x + 20, currentY + 1);
    currentY += 7;

    sectionTitle("RESUMEN CIERRE CAJA", currentY, 10, "*****");
    currentY += 5;

    // Sección: VENTAS
    sectionTitle("Ventas", currentY);
    currentY += 3;

    const tipoVentaBody = Object.entries(dataTill?.["tipos_ventas"] ?? {}).map(
        ([ key, val ]) => [ key, safe(val) || {} ]
    );

    const totalVentas = tipoVentaBody.reduce((acc, row) => acc + parseFloat(row[1]), 0);
    tipoVentaBody.push([ { content: "----------------------------", styles: { fontStyle: "bold" } }, { content: "-------------" } ]);
    tipoVentaBody.push([ { content: "TOTAL", styles: { fontStyle: "bold" } }, totalVentas.toFixed(2) ]);

    autoTable(doc, {
        startY: currentY,
        head: [ [ "TIPO", "TOTAL" ] ],
        body: tipoVentaBody,
        theme: "plain",
        styles: { fontSize: 8 },
        margin: { horizontal: 0.5, vertical: 0.1 },
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } }
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;
    sectionTitle("Caja", currentY);
    currentY += 3;

    const methodPagoBody = Object.entries(dataTill?.["metodo_pago"] ?? {}).map(([ key, value ]) => ({
        name: key,
        amount: value
    }));

    const totalMethodPago = methodPagoBody.reduce((acc, row) => acc + parseFloat(row.amount), 0);

    methodPagoBody.push(
        { name: "----------------------------", amount: "-------------" },
        { name: "TOTAL", amount: totalMethodPago.toFixed(2) }
    );

    autoTable(doc, {
        body: methodPagoBody,
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } },
        columnStyles: {
            amount: { cellWidth: 24 },
            name: { cellWidth: 55 }
        },
        columns: [
            { header: "MÉTODO", dataKey: "name" },
            { header: "TOTAL", dataKey: "amount" }
        ],
        margin: { horizontal: 0.5, vertical: 0.1 },
        startY: currentY,
        styles: { fontSize: 8 },
        theme: "plain"
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // RESUMEN EFECTIVO
    sectionTitle("Resumen Efectivo", currentY);
    currentY += 3;

    const ventas = parseFloat(dataTill?.["resumen_efectivo"]?.["ventas"] ?? 0);
    const otros = parseFloat(dataTill?.["resumen_efectivo"]?.["otros_ingresos"] ?? 0);
    const egresos = parseFloat(dataTill?.["resumen_efectivo"]?.["egresos"] ?? 0);
    const totalResumen = ventas + otros - egresos;

    autoTable(doc, {
        body: [
            [ { content: "VENTAS" }, { content: safe(ventas) } ],
            [ { content: "(+) OTROS INGRESOS" }, { content: safe(otros) } ],
            [ { content: "(-) EGRESOS" }, { content: safe(egresos) } ],
            [ { content: "----------------------------" }, { content: "-------------" } ],
            [ { content: "TOTAL", styles: { fontStyle: "bold" } }, safe(totalResumen) ]
        ],
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 24 }
        },
        columns: [
            { header: "DETALLE", dataKey: "concept__description" },
            { header: "MONTO", dataKey: "amount" }
        ],
        margin: { horizontal: 0.5, vertical: 0.1 },
        startY: currentY,
        styles: { fontSize: 8 },
        theme: "plain"
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // RESUMEN INGRESOS
    sectionTitle("Resumen Ingresos", currentY);
    currentY += 3;

    const ingresoOpen = parseFloat(dataTill?.["resumen_ingresos"]?.["open_till"] ?? 0);
    const ingresoVentas = parseFloat(dataTill?.["resumen_ingresos"]?.["ventas"] ?? 0);
    const ingresoOtros = parseFloat(dataTill?.["resumen_ingresos"]?.["otros_ingresos"] ?? 0);
    const totalIngresos = ingresoOpen + ingresoVentas + ingresoOtros;

    autoTable(doc, {
        startY: currentY,
        body: [
            [ { content: "APERTURA DE CAJA" }, { content: safe(ingresoOpen) } ],
            [ { content: "VENTAS" }, { content: safe(ingresoVentas) } ],
            [ { content: "OTROS INGRESOS" }, { content: safe(ingresoOtros) } ],
            [ { content: "----------------------------" }, { content: "---------------" } ],
            [ { content: "TOTAL", styles: { fontStyle: "bold" } }, safe(totalIngresos) ]
        ],
        columns: [
            { header: "INGRESOS", dataKey: "concept__description" },
            { header: "MONTO", dataKey: "amount" }
        ],
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 24 }
        },
        theme: "plain",
        styles: { fontSize: 8 },
        margin: { horizontal: 0.5, vertical: 0.1 },
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } }
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // EGRESOS
    sectionTitle("Egresos", currentY);
    currentY += 3;

    const egresosBody = (dataTill?.["otros_egresos"] ?? []).map(e => [
        e?.["concept__description"] ?? " - ",
        safe(e?.amount)
    ]);

    const totalEgresos = egresosBody.reduce((acc, row) => acc + parseFloat(row[1]), 0);
    egresosBody.push([ { content: "----------------------------", styles: { fontStyle: "bold" } }, { content: "---------------" } ]);
    egresosBody.push([ { content: "TOTAL", styles: { fontStyle: "bold" } }, safe(totalEgresos) ]);

    autoTable(doc, {
        startY: currentY,
        columns: [
            { header: "CONCEPTO", dataKey: "concept__description" },
            { header: "MONTO", dataKey: "amount" }
        ],
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 24 }
        },
        body: egresosBody,
        theme: "plain",
        styles: { fontSize: 8 },
        margin: { horizontal: 0.5, vertical: 0.1 },
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } }
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // RESUMEN CAJA
    sectionTitle("Resumen Caja", currentY);
    currentY += 3;

    const ingresoCaja = parseFloat(dataTill?.["resumen_caja"]?.["ingresos"] ?? 0);
    const egresoCaja = parseFloat(dataTill?.["resumen_caja"]?.["egresos"] ?? 0);
    const totalCaja = ingresoCaja - egresoCaja;

    autoTable(doc, {
        body: [
            [ { content: "INGRESOS" }, { content: safe(ingresoCaja) } ],
            [ { content: "EGRESOS" }, { content: safe(egresoCaja) } ],
            [ { content: "----------------------------" }, { content: "---------------" } ],
            [ { content: "TOTAL", styles: { fontStyle: "bold" } }, safe(totalCaja) ]
        ],
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 24 }
        },
        columns: [
            { dataKey: "ingresos", header: "DETALLE" },
            { dataKey: "egresos", header: "MONTO" }
        ],
        margin: { horizontal: 0.5, vertical: 0.1 },
        startY: currentY,
        styles: { fontSize: 8 },
        theme: "plain"
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // CRÉDITOS
    sectionTitle("Créditos", currentY);
    currentY += 3;

    const creditSales = (dataTill?.["credit_sales"] ?? []).map(e => {
        return {
            customer__names: e?.["customer__names"] ?? "",
            amount: safe(e.amount) || ""
        };
    });
    const totalCreditSales = creditSales.reduce((acc, row) => acc + parseFloat(row.amount || 0), 0);
    creditSales.push({ customer__names: "----------------------------", amount: "---------------" });
    creditSales.push({ customer__names: "TOTAL", amount: safe(totalCreditSales) });

    autoTable(doc, {
        body: creditSales,
        // head: [ [ "CLIENTE", "MONTO" ] ],
        bodyStyles: { cellPadding: { horizontal: 1, vertical: 0.1 } },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 24 }
        },
        columns: [
            { header: "CLIENTE", dataKey: "customer__names" },
            { header: "MONTO", dataKey: "amount" }
        ],
        margin: { horizontal: 0.5, vertical: 0.1 },
        startY: currentY,
        styles: { fontSize: 8 },
        theme: "plain"
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // VENTAS LIBRES
    sectionTitle("Ventas Libres", currentY);
    currentY += 3;

    const freeSales = (dataTill?.["ventas_libres"] ?? []).map(e => {
        return {
            customer__names: e?.["customer__names"] ?? "",
            amount: safe(e.amount) || ""
        };
    });

    const totalFreeSales = freeSales.reduce((acc, row) => acc + parseFloat(row.amount || 0), 0);
    freeSales.push({ customer__names: "----------------------------", amount: "---------------" });
    freeSales.push({ customer__names: "TOTAL", amount: safe(totalFreeSales) });

    autoTable(doc, {
        body: freeSales,
        bodyStyles: { cellPadding: { vertical: 0.1, horizontal: 1 } },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 24 }
        },
        columns: [
            { header: "CLIENTE", dataKey: "customer__names" },
            { header: "MONTO", dataKey: "amount" }
        ],
        margin: { horizontal: 0.5, vertical: 0.1 },
        startY: currentY,
        styles: { fontSize: 8 },
        theme: "plain"
    });

    currentY = doc?.["lastAutoTable"].finalY + 3;

    // VENTAS ANULADAS
    sectionTitle("Ventas Anuladas", currentY);
    currentY += 3;

    const anulaciones = dataTill?.["anulaciones"] ?? [];

    autoTable(doc, {
        body: [ anulaciones ].map(e => ({
            amount: safe(e?.amount),
            cantity: safe(e?.cantity),
            concept: e?.["concept"] ?? "Sin descripción"
        })),
        bodyStyles: { cellPadding: { horizontal: 1, vertical: 0.1 } },
        columnStyles: {
            amount: { cellWidth: 24 },
            cantity: { cellWidth: 22 },
            concept: { cellWidth: 33 }
        },
        columns: [
            { dataKey: "concept", header: "CONCEPTO" },
            { dataKey: "cantity", header: "CANTIDAD" },
            { dataKey: "amount", header: "MONTO" }
        ],
        margin: { horizontal: 0.5, vertical: 0.1 },
        startY: currentY,
        styles: { fontSize: 8 },
        theme: "plain"
    });


    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    doc.autoPrint();
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0.01";
    iframe.src = doc.output("bloburl");
    document.body.appendChild(iframe);
};
