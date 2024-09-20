import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { getBusinessBranchs } from "@/api/modules/business";
import { ref } from "vue";

applyPlugin(jsPDF);

export class printTicketSalesAnulate {
    constructor(doc, size) {
        this.doc = doc;
        this.doc = new jsPDF({
            unit: "mm",
            format: [80, size]
        });
        
        this.x = 2;
        this.y = 2;
        this.columns = [
            { header: "Cant.", dataKey: "cantidad" },
            { header: "Producto", dataKey: "descripcion" },
            { header: "P. Unit", dataKey: "valor_unitario" },
            { header: "Total", dataKey: "total_item" }
        
        ];
        this.columnsOrders = [
            { header: "Cant.", dataKey: "quantity" },
            { header: "Producto", dataKey: "product_name" },
            { header: "P. Unit", dataKey: "price" },
            { header: "Total", dataKey: "sub_total" }
        
        ];
        this.colWidth = {
            0: { halign: "center", cellWidth: 10 },
            1: { halign: "left", cellWidth: 45 },
            2: { halign: "center", cellWidth: 11 },
            3: { halign: "center", cellWidth: 10 }
        };
    }
    
    async add_header() {
        let x = 2;
        let y = 2;
        
        const business = ref({ commercial_name: "", fiscal_address: "", ruc: "" });
        await getBusinessBranchs().then((response) => {
            business.value = response.data;
        }).catch((error) => {
            console.error(error);
        });
        
        this.doc.setFontSize(10);
        this.doc.text(`RUC: ${business.value.ruc}`, x + 22, y + 4);
        y += 8;
        
        this.doc.setFontSize(12);
        this.doc.setFont(undefined, "bold");
        this.doc.text(`${business.value.commercial_name || "xd"}`.toUpperCase(), x + 15, y + 2);
        y += 6;
        
        this.doc.setFontSize(10);
        let addressSplitText = this.doc.splitTextToSize(business.value.fiscal_address || "ekizde", 75);
        for(let i = 0; i < addressSplitText.length; i++) {
            this.doc.text(addressSplitText[i], x + 10, y + 2);
            y += 5;
        }
        y += 1;
        
        this.doc.setFontSize(11).setFont(undefined, "bold");
        this.doc.text(`REPORTE DE VENTAS ANULADAS`, x + 38, y + 2, "center");
        y += 3;
        
        this.y = y + 1.5;
    }
    
    addInformation(dataPrint) {
        dataPrint?.forEach((v) => {
            const x = this.x + 2;
            let y = this.y;
            let dots_x = x + 22;
            let data_x = dots_x + 2;
            
            this.doc.setLineWidth(0.3);
            this.doc.setDrawColor(0, 0, 0);
            this.doc.line(x, y + 1, 78, y + 1);
            y += 3.99;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Documento", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            let textDocument = this.doc.splitTextToSize(`${v?.["invoice_type_description"]} ${v?.["serie"]}-${v?.["number"]}`, 50);
            for(let i = 0; i < textDocument.length; i++) {
                this.doc.text(textDocument[i], data_x, y);
                y += 3.99;
            }
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("F. Venta", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v.date_sale, data_x, y);
            y += 3.99;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Cliente", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            let textCustomer = this.doc.splitTextToSize(v.customer, 50);
            for(let i = 0; i < textCustomer.length; i++) {
                this.doc.text(textCustomer[i], data_x, y);
                y += 3.99;
            }
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Responsable", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v.username, data_x, y);
            y += 3.99;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Met. Pago", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v?.["payment_method"], data_x, y);
            y += 3.99;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("T. Venta", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text("S/. " + parseFloat(v.amount).toFixed(2), data_x, y);
            y += 3.99;
            
            this.doc.setFont(undefined, "bold");
            this.doc.text("Mot. Anulación", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            let textObservation = this.doc.splitTextToSize(v.null_reason || "SIN OBSERVACIONES", 50);
            for(let i = 0; i < textObservation.length; i++) {
                this.doc.text(textObservation[i], data_x, y);
                y += 3.99;
            }
            
            if(v.order?.["table_description"]) {
                this.doc.setFont(undefined, "bold");
                this.doc.text("Mesa", x, y);
                this.doc.text(":", dots_x, y);
                this.doc.setFont(undefined, "normal");
                this.doc.text(v.order?.["table_description"], data_x, y);
                y += 3.99;
            }
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("T. Anulación", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v.order?.["canceled_type_description"] || " - ", data_x, y);
            y += 3.99;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("F. Anulación", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v?.["null_date"] || " - ", data_x, y);
            y += 3.99;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Productos de la Venta", x + 15, y);
            y += 3;
            
            this.y = y + 2;
            
            let height = 0;
            this.doc?.["autoTable"]({
                columns: this.columns,
                body: JSON.parse(v.json_sale).items,
                startY: this.y - 3,
                margin: { left: this.x, right: this.x },
                theme: "plain",
                showHead: "firstPage",
                columnStyles: this.colWidth,
                didDrawPage: function(data) {
                    height = data.cursor.y;
                },
                bodyStyles: {
                    fontSize: 7,
                    cellPadding: 0.4,
                    lineWidth: 0
                },
                tableLineColor: [0, 0, 0],
                tableLineWidth: 0.1,
                // alternateRowStyles: { fillColor: [235, 245, 255] },
                headStyles: {
                    fontSize: 7,
                    minCellHeight: 0,
                    fontStyle: "bold",
                    halign: "center",
                    text: { minCellWidth: "wrap" },
                    fillColor: [255, 255, 255],
                    textColor: [27, 27, 27],
                    cellPadding: 0.5,
                    cellMargin: 1,
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0]
                }
            });
            this.y = height + 2;
            
            if(v.order?.["order_canceleddetails"].length > 0) {
                this.doc.setFontSize(8).setFont(undefined, "bold");
                this.doc.text("Productos de la Venta Eliminados", x + 15, height + 4);
                let heightOrders = 0;
                
                this.doc?.["autoTable"]({
                    columns: this.columnsOrders,
                    body: v.order?.["order_canceleddetails"],
                    startY: this.y + 4,
                    margin: { left: this.x, right: this.x },
                    theme: "plain",
                    showHead: "firstPage",
                    columnStyles: this.colWidth,
                    didDrawPage: function(data) {
                        heightOrders = data.cursor.y;
                    },
                    bodyStyles: {
                        fontSize: 7,
                        cellPadding: 0.4,
                        lineWidth: 0
                    },
                    tableLineColor: [0, 0, 0],
                    tableLineWidth: 0.1,
                    // alternateRowStyles: { fillColor: [235, 245, 255] },
                    headStyles: {
                        fontSize: 7,
                        minCellHeight: 0,
                        fontStyle: "bold",
                        halign: "center",
                        text: { minCellWidth: "wrap" },
                        fillColor: [255, 255, 255],
                        textColor: [27, 27, 27],
                        cellPadding: 0.5,
                        cellMargin: 1,
                        lineWidth: 0.1,
                        lineColor: [0, 0, 0]
                    }
                });
                this.y = heightOrders + 2;
            }
        });
    }
    
    async generate(data) {
        await this.add_header(data);
        this.addInformation(data);
        window.open(URL?.["createObjectURL"](this.doc.output("blob")));
    }
}
