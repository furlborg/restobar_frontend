import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { getBusinessBranchs } from "@/api/modules/business";
import { ref } from "vue";
// import layout_store from "@/store/modules/layout";
// import AuthStore from "@/store/modules/auth";

applyPlugin(jsPDF);

// const useGlobalDataInformationStore = layout_store.GlobalDataInformationStore();
// const useAuthStore = AuthStore();

export class printTicketOrderAnulate {
    constructor(doc) {
        // this.company = useGlobalDataInformationStore.params_system?.company_info;
        // this.user = useAuthStore.user_detail?.username;
        this.doc = doc;
        this.doc = new jsPDF({
            unit: "mm",
            format: [80, 666]
        });
        // this.doc.addFileToVFS("WorkSans-normal.ttf", font_voucher);
        // this.doc.addFont("WorkSans-normal.ttf", "tahoma", "normal");
        // this.doc.setFont("tahoma");
        //
        // this.doc.addFileToVFS("tahomabd.ttf", fontbold_voucher);
        // this.doc.addFont("tahomabd.ttf", "tahoma", "bold");
        // this.doc.setFont("tahoma");
        
        this.x = 2;
        this.y = 2;
        this.columns = [
            // { header: "Código", dataKey: "itemCode" },
            { header: "Cant.", dataKey: "quantity" },
            { header: "Producto", dataKey: "product_name" },
            { header: "T. Orden", dataKey: "sub_total" }
        
        ];
        this.colWidth = {
            0: { halign: "center", cellWidth: 10 },
            1: { halign: "left", cellWidth: 51 },
            2: { halign: "center", cellWidth: 15 }
        };
    }
    
    async add_header(doc, type) {
        let x = 2;
        let y = 2;
        // let w = 60;
        
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
        this.doc.text(`${business.value.commercial_name || "xd"}`.toUpperCase(), x + 10, y + 2);
        y += 6;
        
        this.doc.setFontSize(10);
        let addressSplitText = this.doc.splitTextToSize(business.value.fiscal_address || "ekizde", 75);
        for(let i = 0; i < addressSplitText.length; i++) {
            this.doc.text(addressSplitText[i], x + 10, y + 2);
            y += 5;
        }
        y += 1;
        
        this.doc.setFontSize(11).setFont(undefined, "bold");
        this.doc.text(`REPORTE ${type === "T" ? "TOTAL" : "PARCIAL"} DE ORDENES \n ANULADAS`, x + 38, y + 2, "center");
        y += 3;
        
        this.y = y + 4;
    }
    
    addInformation(dataPrint, type) {
        dataPrint?.forEach((v) => {
            
            const x = this.x + 1;
            let y = this.y;
            let dots_x = x + 22;
            let data_x = dots_x + 2;
            
            this.doc.setLineWidth(0.3);
            this.doc.setDrawColor(0, 0, 0);
            this.doc.line(x, y + 1, 78, y + 1);
            y += 5;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Responsable", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v.username, data_x, y);
            y += 5;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Fecha", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v.modified, data_x, y);
            y += 5;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Mesa", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v?.["table_description"] || "yape dany sube el cambio de las mesas", data_x, y);
            y += 5;
            
            if(type === "T") {
                this.doc.setFontSize(8).setFont(undefined, "bold");
                this.doc.text("Para llevar ", x, y);
                this.doc.text(": ", dots_x, y);
                this.doc.setFont(undefined, "normal");
                this.doc.text("SI", data_x, y);
                y += 5;
                
                this.doc.setFontSize(8).setFont(undefined, "bold");
                this.doc.text("Delivery", x, y);
                this.doc.text(" :", dots_x - 1, y);
                this.doc.setFont(undefined, "normal");
                this.doc.text("SI", data_x, y);
                y += 5;
                
                this.doc.setFontSize(8).setFont(undefined, "bold");
                this.doc.text("En mesa", x, y);
                this.doc.text(":", dots_x, y);
                this.doc.setFont(undefined, "normal");
                this.doc.text("SI", data_x, y);
                y += 5;
            }
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Tipo Anulación", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text(v?.["canceled_type_description"], data_x, y);
            y += 5;
            
            this.doc.setFontSize(8).setFont(undefined, "bold");
            this.doc.text("Total", x, y);
            this.doc.text(":", dots_x, y);
            this.doc.setFont(undefined, "normal");
            this.doc.text("S/. " + v.amount.toFixed(2), data_x, y);
            y += 5;
            
            // this.doc.setLineWidth(0.3);
            // this.doc.setDrawColor(56, 165, 218);
            // this.doc.line(x, y - 8, x + 190, y - 8);
            //
            // y += 5;
            // this.doc.setFont("Tahoma "bold");
            // this.doc.text("Observaciones", x, y - 9);
            // this.doc.text(":", dots_x, y - 9);
            // this.doc.setFont("Tahoma "normal");
            // let textObservation = this.doc.splitTextToSize(doc.observation, 160);
            // for(let i = 0; i < textObservation.length; i++) {
            //     this.doc.text(textObservation[i], data_x, y - 9);
            //     y += 5;
            // }
            this.y = y + 2;
            
            let height = 0;
            this.doc.setFont(undefined, "bold");
            
            this.doc?.["autoTable"]({
                columns: this.columns,
                body: v?.["order_canceleddetails"],
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
                    lineWidth: 0
                },
                tableLineColor: [0, 0, 0],
                tableLineWidth: 0.2,
                // alternateRowStyles: { fillColor: [235, 245, 255] },
                headStyles: {
                    fontSize: 7,
                    minCellHeight: 0,
                    fontStyle: "bold",
                    halign: "center",
                    text: { minCellWidth: "wrap" },
                    fillColor: [255, 255, 255],
                    textColor: [27, 27, 27],
                    cellPadding: 1,
                    cellMargin: 1,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0]
                }
            });
            this.y = height;
        });
    }
    
    async generate(data, type = String) {
        
        await this.add_header(data);
        this.doc.setFont(undefined, "normal");
        this.addInformation(data, type);
        // this.doc.save("ReporteGeneral.pdf");
        window.open(URL?.["createObjectURL"](this.doc.output("blob")));
    }
    
    wrap(client) {
        return client.replace(/(?![^\n]{1,80}$)([^\n]{1,80})\s/g, "$1\n");
    }
    
}
