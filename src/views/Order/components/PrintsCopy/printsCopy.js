import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import qz from "qz-tray";

export const generatePrintCopy = (structure, height) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, !!height && height > 80 ? Math.round(height) : 80],
  });
  structure.map((val) => {
    let finalY = doc.lastAutoTable.finalY || 0;

    doc.autoTable({
      startY: finalY,
      theme: "plain",
      pageBreak: "auto",
      showHead: "firstPage",
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
      },

      didDrawCell: (data) => {
        if (!!data.row.raw.img) {
          // let img = data.row.raw.img;
          // let dim = data.cell.height - data.cell.padding("vertical");
          // let textPos = data.cell.textPos;
          // doc.addImage(img.src, textPos.x, textPos.y, dim, dim);
        }

        // console.log(data.row.raw.indication);

        if (!!data.row.raw.img === false) {
          doc.setLineDash([1, 1], 1);
          doc.setDrawColor(0, 0, 0);
          doc.line(3, finalY, 77, finalY);
        }
      },
    });
  });

  qz.websocket
    .connect({ host: "192.168.1.222" })
    .then(() => {
      return qz.printers.find();
    })
    .then((printers) => {
      let a = doc.output("datauristring").split(",")[1];
      let config = qz.configs.create(printers[1]);
      return qz.print(config, [
        {
          type: "pixel",
          format: "pdf",
          flavor: "base64",
          data: a,
        },
      ]);
    })
    .then(() => {
      return qz.websocket.disconnect();
    })
    .then(() => {
      // process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      // process.exit(1);
    })
    .finally(() => {
      return qz.websocket.disconnect();
    });
};
