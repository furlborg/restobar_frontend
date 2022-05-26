import { useSettingsStore } from "@/store/modules/settings";

import qz from "qz-tray";

import rs from "jsrsasign";
import { CreatePdfFile } from "./CreatePdfFile";

const SettingsStore = useSettingsStore();

export const printPdf = async (objOrArry) => {
  let format = SettingsStore.business_settings.printer.kitchen_printer_format;

  if (!!objOrArry.formatTemp) format = objOrArry.formatTemp;

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

  const android = /(android)/i.test(navigator.userAgent);

  let props = {
    host: SettingsStore.business_settings.qz_config.host,
  };

  if (android) props = { ...props, usingSecure: false };

  qz.websocket
    .connect(props)
    .then(() => {
      return qz.printers.find();
    })
    .then((printers) => {
      if (!!printers) {
        objOrArry.map(async (props) => {
          let dataPdf = await CreatePdfFile(props, props.formatTemp);

          let printerFindResult = printers.find(
            (printer) => printer === props.printerName
          );

          if (!!printerFindResult) {
            let config = qz.configs.create(printerFindResult, {
              scaleContent: true,
              size: {
                width: props.formatTemp,
                height:
                  !!props.lengthOfData && props.lengthOfData > props.formatTemp
                    ? Math.round(props.lengthOfData)
                    : props.formatTemp,
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
