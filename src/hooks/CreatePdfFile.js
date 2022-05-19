import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import { useBusinessStore } from "@/store/modules/business";

import qr from "qrcode";

export const CreatePdfFile = async (props, format) => {
  let formatDoc = [80, 350];

  if (!!format) {
    formatDoc = [
      format,
      !!props.lengthOfData && props.lengthOfData > format
        ? Math.round(props.lengthOfData)
        : format,
    ];
  }

  const doc = new jspdf({
    orientation: "p",
    format: formatDoc,
    unit: "mm",
  });

  let code_qr = null;

  if (props.objSunat) {
    qr.toDataURL(props.objSunat, function (err, code) {
      if (err) return console.log("error occurred");
      code_qr = code;
    });
  }

  props.data.map((val, index) => {
    if (!!val) {
      let finalY = doc.lastAutoTable.finalY || 0;

      const businnessStore = useBusinessStore();
      if (index === 0 && !!props.addImages) {
        let img = doc.getImageProperties(businnessStore.business.logo_url);

        let anchooriginal = img.width;
        let altooriginal = img.height;

        let anchonuevo = 50;

        let altonuevo = (altooriginal * anchonuevo) / anchooriginal;

        doc.addImage(
          businnessStore.business.logo_url,
          "png",
          15,
          finalY,
          anchonuevo,
          altonuevo
        );
        finalY += altonuevo + 1.5;
      }

      if (index === 5 && !!props.addImages && !!props.objSunat) {
        doc.addImage(code_qr, "png", 25, finalY + 5, 30, 30);
        finalY += 30;
      }

      if (val.line) {
        doc.setLineDash([1, 1], 1);
        doc.setDrawColor(0, 0, 0);
        doc.line(3, finalY + 5, 77, finalY + 5);
        finalY += 5;
      }

      doc.autoTable({
        startY: finalY,
        theme: "plain",
        pageBreak: "auto",
        showHead: "firstPage",
        margin: { left: 1, right: 1 },
        /* !!format === false ? { left: 1, right: 1 } : { left: 3, right: 3 }, */
        columns: !!val.col ? val.col : null,
        styles: {
          cellPadding: 0.7,
        },
        body: val.dat,
        cellWidth: "auto",
        headStyles: { fontSize: 7, font: "helvetica" },

        columnStyles: {
          fontSize: 7,
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
    }
  });

  if (!!props.show) {
    doc.autoPrint();

    const hiddFrame = document.createElement("iframe");
    hiddFrame.style.position = "fixed";

    hiddFrame.style.width = "1px";
    hiddFrame.style.height = "1px";
    hiddFrame.style.opacity = "0.01";
    hiddFrame.src = doc.output("bloburl");
    document.body.appendChild(hiddFrame);

    return hiddFrame;
  } else {
    return doc.output("datauristring").split(",")[1];
  }
};
