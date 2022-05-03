import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import { useBusinessStore } from "@/store/modules/business";

import qr from "qrcode";

export const generatePrint = (objSunat, structure, addImages) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, 350],
  });

  let code_qr = null;

  qr.toDataURL(objSunat, function (err, code) {
    if (err) return console.log("error occurred");
    code_qr = code;
  });

  structure.map((val, index) => {
    var finalY = doc.lastAutoTable.finalY - 5 || 10;

    const businnessStore = useBusinessStore();
    if (index === 0 && addImages) {
      doc.addImage(businnessStore.business.logo_url, "png", 5, finalY, 65, 18);
      finalY += 20;
    }
    if (index === 5 && addImages) {
      doc.addImage(code_qr, "png", 25, finalY + 5, 30, 30);
      finalY += 30;
    }

    if (val.line) {
      doc.setLineDash([1, 1], 1);
      doc.setDrawColor(0, 0, 0);
      doc.line(3, finalY + 5, 77, finalY + 5);
      finalY += 5;
    }

    if (index === structure.length - 1) {
      finalY += 5;
    }

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
      headStyles: { fontSize: 8, font: "helvetica" },
      bodyStyles: { fontSize: 8, font: "helvetica", fontStyle: "bold" },

      columnStyles: {
        fontSize: 8,
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
    });
  });

  doc.autoPrint();

  const hiddFrame = document.createElement("iframe");
  hiddFrame.style.position = "fixed";

  hiddFrame.style.width = "1px";
  hiddFrame.style.height = "1px";
  hiddFrame.style.opacity = "0.01";
  hiddFrame.src = doc.output("bloburl");
  document.body.appendChild(hiddFrame);
};
