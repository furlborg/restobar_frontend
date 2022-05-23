import { useSettingsStore } from "@/store/modules/settings";

import qz from "qz-tray";

import rs from "jsrsasign";
import { CreatePdfFile } from "./CreatePdfFile";

const SettingsStore = useSettingsStore();

export const printPdf = async (objOrArry) => {
  let format = SettingsStore.business_settings.printer.kitchen_printer_format;

  qz.security.setCertificatePromise(function (resolve) {
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

  qz.websocket
    .connect({ host: SettingsStore.business_settings.qz_config.host })
    .then(() => {
      return qz.printers.find();
    })
    .then((printers) => {
      if (!!printers) {
        objOrArry.map(async (props) => {
          let dataPdf = await CreatePdfFile(props, format);

          let printerFindResult = printers.find(
            (printer) => printer === props.printerName
          );

          if (!!printerFindResult) {
            let config = qz.configs.create(printerFindResult, {
              scaleContent: true,
              size: {
                width: format,
                height:
                  !!props.lengthOfData && props.lengthOfData > format
                    ? Math.round(props.lengthOfData)
                    : format,
              },
              units: "mm",
            });

            qz.print(config, [
              {
                type: "pixel",
                format: "pdf",
                flavor: "base64",
                data: dataPdf,
              },
            ]).then(() => {
              qz.websocket.disconnect();
            });
          } else {
            console.log("La impresora especificada no se a encontrado");
          }
        });
      } else {
        console.log("no hay impresoras instalada");
      }
    })
    .catch((error) => {
      console.error(error);
    });
};
