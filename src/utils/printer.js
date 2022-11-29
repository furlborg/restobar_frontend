import { useSettingsStore } from "@/store/modules/settings";
import qz from "qz-tray";
import rs from "jsrsasign";

export function printPdf(pdf, format) {
  const settingsStore = useSettingsStore();

  qz.security.setCertificatePromise(function (resolve) {
    resolve(settingsStore.business_settings.qz_config.certificate);
  });

  const privateKey = settingsStore.business_settings.qz_config.signature;

  qz.security.setSignatureAlgorithm("SHA512");

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
    .connect({
      host: settingsStore.business_settings.qz_config.host,
    })
    .then(async () => {
      const printer = await qz.printers.getDefault();
      //console.log(printer);
      const config = qz.configs.create(printer, {
        size: {
          width: format[0] * 0.2645833333,
          height: format[1] * 0.2645833333,
        },
        units: "mm",
      });
      qz.print(config, [
        {
          type: "pixel",
          format: "pdf",
          flavor: "base64",
          data: pdf.output("datauristring").split(",")[1],
        },
      ]).then(() => {
        qz.websocket.disconnect();
      });
    })
    .catch((error) => {
      console.error(error);
      qz.websocket.disconnect();
    });
}
