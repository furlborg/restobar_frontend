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

  //!Redimencion de imagen
  const createNewImage = (newWidthImg, oldImg) => {
    let img = doc.getImageProperties(oldImg);

    let widthOriginal = img.width;
    let heightOriginal = img.height;

    let newWidth = newWidthImg;

    let newHeigth = (heightOriginal * newWidth) / widthOriginal;
    return { newHeigth, newWidth };
  };

  //!Creacion de QR

  let code_qr = null;

  if (props.objSunat) {
    qr.toDataURL(props.objSunat, function (err, code) {
      if (err) return console.error("error occurred");
      code_qr = code;
    });
  }

  //!Creacion del Documento
  props.data.map((val, index) => {
    if (!!val) {
      let finalY = doc.lastAutoTable.finalY || 3;

      if (index === 0 && !!props.addImages) {
        const businnessStore = useBusinessStore();

        let newImgprops = createNewImage(50, businnessStore.business.logo_url);

        doc.addImage(
          businnessStore.business.logo_url,
          "png",
          15,
          finalY,
          newImgprops.newWidth,
          newImgprops.newHeigth
        );
        finalY += newImgprops.newHeigth;
      }

      if (
        index === props.data.length - 1 &&
        !!props.addImages &&
        !!props.objSunat
      ) {
        let newImgprops = createNewImage(30, code_qr);

        doc.addImage(
          code_qr,
          "png",
          25,
          finalY,
          newImgprops.newWidth,
          newImgprops.newHeigth
        );

        finalY += newImgprops.newHeigth;
      }

      if (val.line) {
        doc.setLineDash([1, 1], 1);
        doc.setDrawColor(0, 0, 0);
        doc.line(1, finalY + 2, 77, finalY + 2);
        finalY += 3;
      }

      doc.autoTable({
        startY: finalY,
        theme: "plain",
        pageBreak: "auto",
        showHead: "firstPage",
        margin: { left: 1, right: 1 },
        columns: !!val.col ? val.col : null,
        body: val.dat,
        cellWidth: "auto",

        headStyles: {
          fontSize: !!val.fontSize ? val.fontSize : 7,
          font: "helvetica",
        },
        bodyStyles: {
          fontSize: !!val.fontSize ? val.fontSize : 7,
          font: "helvetica",
          cellPadding: 0.5,
          overflow: "linebreak",
        },
        columnStyles: {
          amount: {
            halign: "center",
          },
          tittle: {
            fontStyle: "bold",
            fontSize: !!val.fontSize ? val.fontSize : 7,
          },
          cont: {
            fontStyle: "bold",
            fontSize: !!val.fontSize ? val.fontSize : 7,
          },
          tittleSec: {
            fontStyle: "bold",
            fontSize: !!val.fontSize ? val.fontSize : 7,
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
