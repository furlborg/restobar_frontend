import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePrint = (structure) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, 80],
  });

  structure.map((val, index) => {
    var finalY = doc.lastAutoTable.finalY || 10;

    doc.autoTable({
      startY: finalY,
      theme: !!val.theme ? val.theme : "plain",
      pageBreak: "auto",
      margin: { left: 3, right: 3 },
      columns: !!val.col ? val.col : null,
      styles: {
        cellPadding: 0.7,
      },
      body: val.dat,
      cellWidth: "auto",
      headStyles: { fontSize: 7.5, font: "helvetica" },
      bodyStyles: { fontSize: 7.5, font: "helvetica" },

      columnStyles: {
        fontSize: 8,
        tittle: {
          fontStyle: "bold",
        },
        tittleSec: {
          fontStyle: "bold",
        },
        img: {
          fontStyle: "bold",
          halign: "center",
        },
      },

      didDrawCell: (data) => {
        if (!!data.row.raw.img) {
          // let img = data.row.raw.img;
          // let dim = data.cell.height - data.cell.padding("vertical");
          // let textPos = data.cell.textPos;
          // doc.addImage(img.src, textPos.x, textPos.y, dim, dim);
        }

        // if (!!data.row.raw.img === false) {
        //   doc.setLineDash([1, 1], 1);
        //   doc.setDrawColor(183, 226, 255);
        //   doc.line(3, finalY, 77, finalY);
        // }
      },
    });
  });

  doc.save("ReporteGeneral.pdf");
};
