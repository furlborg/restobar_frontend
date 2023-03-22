import { defineStore } from "pinia";
import { createDiscreteApi } from "naive-ui";
import qz from "qz-tray";
import rs from "jsrsasign";

const { message, notification } = createDiscreteApi([
  "message",
  "notification",
]);

export const usePrinterStore = defineStore("printer", {
  state: () => ({
    qz: qz,
    host: "localhost",
    printers: [],
    managedPrinters: [],
    message: null,
  }),
  getters: {
    getPrintersOptions() {
      return this.printers.map((option) => ({ label: option, value: option }));
    },
    getConnectionStatus() {
      return this.qz.websocket.isActive();
    },
  },
  actions: {
    initializeStore(qz_config, auto = true) {
      this.host = qz_config.host;
      this.qz.security.setCertificatePromise(function (resolve) {
        resolve(qz_config.certificate);
      });
      const privateKey = qz_config.signature;
      this.qz.security.setSignatureAlgorithm("SHA512");
      this.qz.security.setSignaturePromise(function (toSign) {
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
      if (auto) {
        this.startConnection();
      }
    },
    startConnection() {
      if (!this.qz.websocket.isActive()) {
        this.qz.websocket
          .connect({
            host: this.host,
            usingSecure: !/(android)/i.test(navigator.userAgent),
          })
          .then(() => {
            this.getPrinters();
          })
          .catch((error) => {
            console.error(error);
            message.error(error.message);
          });
      }
    },
    endConnection() {
      if (this.qz.websocket.isActive()) {
        this.qz.websocket.disconnect();
      }
    },
    async getPrinters() {
      this.printers = await this.qz.printers.find();
    },
    startListeningPrinters() {
      this.qz.printers.setPrinterCallbacks((info) => {
        if (
          this.managedPrinters.some((printer) => printer === info.printerName)
        ) {
          if (info.eventType === "JOB") {
            const job = info.jobName.split("_");
            if (job[0] === "QZ") {
              const doc = job[1].split("#");
              switch (doc["0"]) {
                case "SALE":
                  switch (info.statusText) {
                    case "COMPLETE":
                      notification["success"]({
                        title: doc[2],
                        description: `VENTA #${doc[1]}`,
                        duration: 2000,
                      });
                      break;
                    case "ERROR":
                      notification["error"]({
                        title: "Error de impresión",
                        description: doc[2],
                        meta: `VENTA #${doc[1]}`,
                        duration: 2000,
                      });
                      break;
                    case "RESTART":
                      notification["warning"]({
                        title: "Reintentando impresión",
                        description: doc[2],
                        meta: `VENTA #${doc[1]}`,
                        duration: 2000,
                      });
                      break;
                    default:
                      console.warn(info);
                  }
                  break;
                case "ORDER":
                  switch (info.statusText) {
                    case "COMPLETE":
                      notification["success"]({
                        title: `PEDIDO #${doc[1]}`,
                        description: doc[2],
                        duration: 2000,
                      });
                      break;
                    case "ERROR":
                      notification["error"]({
                        title: "Error de impresión",
                        description: `PEDIDO #${doc[1]}`,
                        meta: doc[2],
                        duration: 2000,
                      });
                      break;
                    case "RESTART":
                      notification["warning"]({
                        title: "Reintentando impresión",
                        description: `PEDIDO #${doc[1]}`,
                        meta: doc[2],
                        duration: 2000,
                      });
                      break;
                    default:
                      console.warn(info);
                  }
                  break;
                case "DELIVERY":
                  switch (info.statusText) {
                    case "COMPLETE":
                      notification["success"]({
                        title: `PEDIDO #${doc[1]}`,
                        description: "DELIVERY",
                        duration: 2000,
                      });
                      break;
                    case "ERROR":
                      notification["error"]({
                        title: "Error de impresión",
                        description: `PEDIDO #${doc[1]}`,
                        meta: "DELIVERY",
                        duration: 2000,
                      });
                      break;
                    case "RESTART":
                      notification["warning"]({
                        title: "Reintentando impresión",
                        description: `PEDIDO #${doc[1]}`,
                        meta: "DELIVERY",
                        duration: 2000,
                      });
                      break;
                    default:
                      console.warn(info);
                  }
                  break;
                default:
                  console.warn(info);
              }
            }
          }
        }
      });
      this.qz.printers.startListening(this.managedPrinters);
      this.qz.printers.getStatus();
    },
    stopListeningPrinters() {
      this.qz.printers.stopListening();
    },
    async printTicket(pdf, format, job_name, place = null) {
      this.startConnection();
      const printer = !place
        ? !this.managedPrinters[0]
          ? await this.qz.printers.getDefault()
          : this.managedPrinters[0]
        : place;
      const config = !place
        ? this.qz.configs.create(printer, {
            jobName: `QZ_${job_name.toUpperCase()}`,
            size: {
              width: 80,
              height: 0,
            },
            /* margins: {
              top: 0,
              bottom: 0,
              right: 0,
              left: 0,
            }, */
            orientation: "portrait",
            colorType: "blackwhite",
            units: "mm",
          })
        : this.qz.configs.create(printer, {
            jobName: `QZ_${job_name.toUpperCase()}`,
            size: {
              width: format[0] * 0.2645833333,
              height: format[1] * 0.2645833333,
            },
            units: "mm",
          });
      this.qz.print(config, [
        {
          type: "pixel",
          format: "pdf",
          flavor: "base64",
          data: pdf.output("datauristring").split(",")[1],
        },
      ]);
    },
  },
});
