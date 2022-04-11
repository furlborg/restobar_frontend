import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import { useBusinessStore } from "@/store/modules/business";

export const generatePrint = (structure) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, 150],
  });

  structure.map((val, index) => {
    var finalY = doc.lastAutoTable.finalY || 10;

    const businnessStore = useBusinessStore();
    if (index === 0) {
      doc.addImage(businnessStore.business.logo_url, "png", 8, finalY, 65, 25);
      finalY += 30;
    }

    if (val.line) {
      doc.setLineDash([1, 1], 1);
      doc.setDrawColor(0, 0, 0);
      doc.line(3, finalY + 2, 77, finalY + 2);
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
