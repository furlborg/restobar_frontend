import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { printPDFDoc } from "@/hooks/PrintPdf.js";

import { useBusinessStore } from "@/store/modules/business";

import qr from "qrcode";

export const CreatePdfFile = async(props, format) => {
    let formatDoc = [
        !format ? 80 : format,
        props.auto ? Math.round(props.lengthOfData) : 350
    ];

    if ( !!format && !props.auto) {
        formatDoc = [
            format,
            !!props.lengthOfData && props.lengthOfData > format
            ? Math.round(props.lengthOfData)
            : format
        ];
    }

    const doc = new jsPDF({
        orientation: "p",
        format: formatDoc,
        unit: "mm"
    });

    //Redimensiona de la imagen
    const createNewImage = (newWidthImg, oldImg) => {
        let img = doc.getImageProperties(oldImg);

        let widthOriginal = img.width;
        let heightOriginal = img.height;

        let newWidth = newWidthImg;

        let newHeight = (heightOriginal * newWidth) / widthOriginal;
        return { newHeight, newWidth };
    };

    //Creación de QR

    let code_qr = null;

    if (props.objSunat) {
        qr.toDataURL(props.objSunat, function(err, code) {
            if (err) return console.error("error occurred");
            code_qr = code;
        });
    }

    //Creación del Documento
    props.data.map((val, index) => {
        if ( !!val) {
            console.log(doc);
            let finalY = doc.lastAutoTable?.finalY || 3;

            if (index === 0 && !!props.addImages) {
                const businessStore = useBusinessStore();

                let newImgProps = createNewImage(50, businessStore.business?.["logo_url"]);

                doc.addImage(
                    businessStore.business?.["logo_url"],
                    "png",
                    15,
                    finalY,
                    newImgProps.newWidth,
                    newImgProps.newHeight
                );
                finalY += newImgProps.newHeight;
            }

            if (
                index === props.data.length - 2 &&
                !!props.addImages &&
                !!props.objSunat
            ) {
                let newImgProps = createNewImage(30, code_qr);

                doc.addImage(
                    code_qr,
                    "png",
                    25,
                    finalY,
                    newImgProps.newWidth,
                    newImgProps.newHeight
                );

                finalY += newImgProps.newHeight;
            }

            if (val.line) {
                doc.setLineDash([ 1, 1 ], 1);
                doc.setDrawColor(0, 0, 0);
                doc.line(1, finalY + 2, 77, finalY + 2);
                finalY += 3;
            }
            console.log(finalY);
            autoTable(doc, {
                startY: finalY,
                theme: "plain",
                pageBreak: "auto",
                showHead: "firstPage",
                margin: { left: 1, right: 1 },
                columns: val.col ?? null,
                body: val.dat,
                cellWidth: "auto",

                headStyles: {
                    fontSize: val.fontSize ?? 7,
                    font: "helvetica"
                },
                bodyStyles: {
                    fontSize: val.fontSize ?? 7,
                    font: "helvetica",
                    cellPadding: 0.5,
                    overflow: "linebreak"
                },
                columnStyles: {
                    amount: {
                        halign: "center"
                    },
                    tittle: {
                        fontStyle: "bold",
                        fontSize: val.fontSize ?? 7
                    },
                    cont: {
                        fontStyle: "bold",
                        fontSize: val.fontSize ?? 7
                    },
                    tittleSec: {
                        fontStyle: "bold",
                        fontSize: val.fontSize ?? 7
                    }
                }
            });
        }
    });

    if ( !!props.show) {
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
        if (props.auto)
            printPDFDoc(doc.output("datauristring").split(",")[1], formatDoc[1]);
        return doc.output("datauristring").split(",")[1];
    }
};
