import jspdf from "jspdf";
import autoTable from "jspdf-autotable";
import { useSettingsStore } from "@/store/modules/settings";
import { useProductStore } from "@/store/modules/product";

import qz from "qz-tray";

import rs from "jsrsasign";

const SettingsStore = useSettingsStore();
const ProductStore = useProductStore();

export const generatePrint58 = async (structure, height, printerName) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [
      /* !!height && height > 80 ? 54 : 45 */ 40,
      !!height && height > 80 ? Math.round(height) : 80,
    ],
  });
  structure.map((val, index) => {
    if (!!val) {
      let finalY = doc.lastAutoTable.finalY || 0;
      if (val.line) {
        doc.setLineDash([1, 1], 1);
        doc.setDrawColor(0, 0, 0);
        doc.line(3, finalY + 5, 77, finalY + 5);
        finalY += 5;
      }

      if (structure.length === index) {
        doc.setLineDash([1, 1], 1);
        doc.setDrawColor(0, 0, 0);
        doc.line(3, finalY + 30, 77, finalY + 30);
      }

      doc.autoTable({
        startY: finalY,
        theme: "plain",
        pageBreak: "auto",
        showHead: "firstPage",
        margin: { left: 1, right: 1 },
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

  console.log(ProductStore.getPlacePrinterName());
  qz.security.setCertificatePromise(function (resolve, reject) {
    resolve(SettingsStore.business_settings.qz_config.certificate);
  });

  const privateKey = SettingsStore.business_settings.qz_config.signature;

  qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
  qz.security.setSignaturePromise(function (toSign) {
    return function (resolve, reject) {
      try {
        let pk = rs.KEYUTIL.getKey(privateKey);
        let sig = new rs.KJUR.crypto.Signature({ alg: "SHA512withRSA" }); // Use "SHA1withRSA" for QZ Tray 2.0 and older
        sig.init(pk);
        sig.updateString(toSign);
        let hex = sig.sign();
        resolve(rs.stob64(rs.hextorstr(hex)));
      } catch (err) {
        console.error(err);
        reject(err);
      }
    };
  });

  const printer = await ProductStore.getPlacePrinterName(printerName);

  qz.websocket
    .connect({ host: SettingsStore.business_settings.qz_config.host })
    .then(() => {
      return qz.printers.find();
    })
    .then((printers) => {
      if (!!printers) {
        let searchPrinter = printers.find((val) => val === printer);

        if (!!searchPrinter) {
          let dataPdf = doc.output("datauristring").split(",")[1];

          let config = qz.configs.create(searchPrinter, {
            scaleContent: true,
            size: {
              width: 70,
              height: !!height && height > 100 ? Math.round(height) : 100,
            },
            units: "mm",
          });

          return qz.print(config, [
            {
              type: "pixel",
              format: "pdf",
              flavor: "base64",
              data: dataPdf,
            },
          ]);
        } else {
          console.log("impresora no encontrada");
        }
      } else {
        console.log("no hay impresoras");
      }
    })
    .catch((error) => {
      console.error(error);
      // process.exit(1);
    })
    .finally(() => {
      qz.websocket.disconnect();
    });
};
