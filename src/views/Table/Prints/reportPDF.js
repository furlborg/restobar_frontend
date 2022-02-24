import jspdf from "jspdf";
import autoTable from "jspdf-autotable";
import store from "@/store/index";

export const generateReportPDF = (headers, columns, colWidth, data) => {
  let verify = store.getters.listCompany;
  //*Fecha del Reporte
  const fetch = new Date();
  const dd = fetch.getDate();
  const mm = fetch.getMonth();
  const yy = fetch.getFullYear();
  const hh = fetch.getHours();
  const msms = fetch.getMinutes();
  //*Intanciamos el documento
  const doc = new jspdf();

  //TODO; Imagen
  const img = verify == undefined ? null : verify.logo;
  if (img != null) {
    doc.addImage(img, "png", 10, 5, 35, 10);
  }

  //?Estilo del header
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");

  //TODO: Header
  doc.text(`${headers.tittle}`, 75, 15);

  //?Estilo para las lineas
  doc.setLineDash([1, 1], 0);
  doc.setDrawColor(1, 181, 60);

  //?Estilo de Sub header
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");

  //TODO:Sub header parte 1
  doc.text("Sucursal", 5, 30);
  // doc.line(5, 31, 205, 31);
  doc.text("RUC", 5, 35);
  // doc.line(5, 36, 205, 36);
  doc.text("Usuario", 5, 40);
  // doc.line(5, 41, 205, 41);

  doc.text(":", 30, 30);
  doc.text(":", 30, 35);
  doc.text(":", 30, 40);

  doc.text(`${headers.branchOff}`, 35, 30);
  doc.text(`${headers.ruc}`, 35, 35);
  doc.text(`${headers.user}`, 35, 40);

  doc.text("Fecha Reporte", 120, 30);
  doc.text("Fecha Apertura", 120, 35);
  doc.text("Fecha Cierre", 120, 40);

  doc.text(":", 150, 30);
  doc.text(":", 150, 35);
  doc.text(":", 150, 40);

  doc.text(`${dd}/${mm}/${yy} ${hh}:${msms}`, 155, 30);
  doc.text(`${headers.dateOpen}`, 155, 35);
  doc.text(`${headers.deadLine}`, 155, 40);

  //TODO:Sub header parte 2
  doc.text("Ingreso", 5, 55);
  // doc.line(5, 56, 205, 56);
  doc.text("Total", 5, 60);
  // doc.line(5, 61, 205, 61);

  doc.text(":", 30, 55);
  doc.text(":", 30, 60);

  doc.text(`${headers.entry}`, 35, 55);
  doc.text(`${headers.total}`, 35, 60);

  doc.text("Egreso", 120, 55);
  doc.text("Total Anulados", 120, 60);

  doc.text(":", 150, 55);
  doc.text(":", 150, 60);

  doc.text(`${headers.egress}`, 155, 55);
  doc.text(`${headers.totalCanceled}`, 155, 60);
  let a = 0;
  doc.setLineDash([0, 0], 0);
  //TODO: Data table
  doc.autoTable({
    columns: columns,
    body: data,
    startY: 71,
    margin: { left: 5, right: 5 },
    theme: "grid",
    rowPageBreak: "avoid",
    showHead: "firstPage",
    columnStyles: colWidth,
    bodyStyles: {
      fontSize: 9,
    },
    headStyles: {
      minCellHeight: 5,
      fontStyle: "bold",
      halign: "center",
      text: { minCellWidth: "wrap" },
      lineWidth: 0.02,
      fillColor: [1, 181, 60],
    },
    didParseCell: (obj) => {
      if (obj.section === "body" && obj.row.raw.state === true) {
        for (const key in obj.row.cells) {
          obj.row.cells[key].styles.textColor = "red";
        }
      }
    },
  });

  doc.save("ReporteGeneral.pdf");
};
