import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePrint = async (structure, height) => {
  console.log(Math.round(height));
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, !!height && height > 80 ? Math.round(height) : 80],
  });
  structure.map((val) => {
    let finalY = doc.lastAutoTable.finalY || 5;

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

        // console.log(data.row.raw.indication);

        if (!!data.row.raw.img === false) {
          doc.setLineDash([1, 1], 1);
          doc.setDrawColor(0, 0, 0);
          doc.line(3, finalY, 77, finalY);
        }
      },
    });
  });

  let docName = `ReportTable${Math.floor(Math.random() * (10 - 1)) + 1}.pdf`;

  doc.save(docName);

  setTimeout(() => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let requestOptions = {
      method: "POST",

      headers: myHeaders,
      body: JSON.stringify({
        nameFile: docName,
        printerName: "POS-80-Series",
      }),
      redirect: "follow",
    };

    return fetch("http://localhost:3000/printer", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  }, 1000);
};
