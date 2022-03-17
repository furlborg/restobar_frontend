import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePrint = (structure) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, 350],
  });

  structure.map((val, index) => {
    var finalY = doc.lastAutoTable.finalY || 10;

    doc.autoTable({
      startY: finalY,
      theme: "plain",
      pageBreak: "auto",
      margin: { left: 3, right: 3 },
      columns: !!val.col ? val.col : null,
      styles: {
        cellPadding: 0.7,
      },
      body: val.dat,
      cellWidth: "auto",
      headStyles: { fontSize: 9, font: "helvetica" },
      bodyStyles: { fontSize: 9, font: "helvetica", fontStyle: "bold" },

      columnStyles: {
        fontSize: 9,
        tittle: {
          fontStyle: "bold",
        },
        cont: {
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

        if (!!data.row.raw.img === false) {
          doc.setLineDash([1, 1], 1);
          doc.setDrawColor(0, 0, 0);
          doc.line(3, finalY, 77, finalY);
        }
      },
    });
  });

  // doc.save("ReporteGeneral.pdf");
  window.open(URL.createObjectURL(doc.output("blob")));
};
