import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import qz from "qz-tray";

import rs from "jsrsasign";

export const generatePrintCopy = (structure, height) => {
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, !!height && height > 80 ? Math.round(height) : 80],
  });
  structure.map((val) => {
    if (!!val) {
      let finalY = doc.lastAutoTable.finalY || 0;
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
        margin: { left: 3, right: 3 },
        columns: !!val.col ? val.col : null,
        styles: {
          cellPadding: 0.7,
        },
        body: val.dat,
        cellWidth: "auto",
        headStyles: { fontSize: 9, font: "helvetica" },

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
    }
  });

  qz.security.setCertificatePromise(function (resolve, reject) {
    resolve(
      "-----BEGIN CERTIFICATE-----MIIECzCCAvOgAwIBAgIGAYAPJ8PdMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTIyMDQwODE2MjgyNVoXDTQyMDQwODE2MjgyNVowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDZKGBqTw2AbKTHXfj3+a3ke6YFFXIUSWOVZrm9RKINDUb9QiFIlnFkeJ4oLxJYPBKEpLAPztDSw7xIPK1YNCvq6fnp6Jfznt0QgG57wOj00xrb8kSmfqaAPI301OlOc1hwjDY5xdcQ/JJnRSS10evCjI9eiROh8uK7Ke8jnRrT46DtuN8HBbArw5+DZtaHwfpV+usvuOtIb7O8sREWeabTc+sN6G7aS49CsPoAKdw5zYALKcqRzjbC+SImWYUCY9Fc3nGLXJ18XwroPA9ctumUbb3X4VYAjtbKQCLtFHK9SlZDu2S4Vd+MsnCSPD6rbSfO3liJn6n83nBo9INTvnc3AgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBStCJjWXPU5XVVrXG2YsIQ75BOSTzANBgkqhkiG9w0BAQsFAAOCAQEADT7gOnZ/Y4QTaA2EAtsmRR6qiVWsPtG+Kw9HCJvKPg4E8EoX/Ma8O4spM52HqmzX5Tyfi+OY6th9aUTKo0DOBzbCPc4I2tGYlhpVznnt89z18H9prLzs6305oQH5zXqL8HJc3lNxOev5H3YHbD1M227uCYT1Mwu51e3uocA/uea+IL8/OWYzWC7Kf1K3agSAlpreNULM4QN9KkJZA08VOO4zy34x7UPhYGUrLl1m7nxy/e8V8hXO6atjWUjmCI97lN8qLBNeRqOmUSWJBMgnk3xg1Vzgq2jASHR/EIDT3EWmpPFhLem3wmARJ0XWnjCkxkR1Wsa7FrhiiOG96QU4UQ==-----END CERTIFICATE-----"
    );
  });

  const privateKey =
    "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZKGBqTw2AbKTHXfj3+a3ke6YFFXIUSWOVZrm9RKINDUb9QiFIlnFkeJ4oLxJYPBKEpLAPztDSw7xIPK1YNCvq6fnp6Jfznt0QgG57wOj00xrb8kSmfqaAPI301OlOc1hwjDY5xdcQ/JJnRSS10evCjI9eiROh8uK7Ke8jnRrT46DtuN8HBbArw5+DZtaHwfpV+usvuOtIb7O8sREWeabTc+sN6G7aS49CsPoAKdw5zYALKcqRzjbC+SImWYUCY9Fc3nGLXJ18XwroPA9ctumUbb3X4VYAjtbKQCLtFHK9SlZDu2S4Vd+MsnCSPD6rbSfO3liJn6n83nBo9INTvnc3AgMBAAECggEARrGdSZ54n8E+l2ShQ2D12jbioi8MF0yY7a8mclYghy02WgYoPbA0M+gMXLqON0k/Ig1W/55tXt+3sLCIIfnB/lSzNhGxPe8OumuFDCaN7/21dbrV3HnIjGCqOfUCCrcEKIeMs5wTWoVOx+27eLFhFdGabsUjLgqbAyEwp6Bidm2/IDWjER5kjnwHz/qj49wUuV6JdNv58SNOgO5Nkx84HYA0H/fdUoE+RUVvqVNluiZS2unJeTSJHmzsOJ7mSJXrN1KoS8M6p9S/TpMnawTPg3TazMQDNeF+PqGmgNNKnSrf/XVekRVBRhK7+o/kEedegMBVplROD1kv4/EhwNWaAQKBgQD+25PKxJSCFd+OBAYYK8TdlB4M2RQhuK5EY5Yo7LNOct/TCt/2uenTIY3c0cwuBVqJvkban3KtixTgVi6oeMY240pMO0IziIpS09ZQG4Iw9k6c7QpAL26eZfsqspj5OVpfbS96n5HiRKyWQA3KG49in3RH6a6cFyR6n8nI0OzgNwKBgQDaIYrgOPgmPVY2PRPhEQ4PXGVDkd2qUIqjuJujhgCGnO4RN+OayY/QYLAOR/iiwE89p+podyOav9o9+ptOS3tokWLn+wwqfRt85XzSRWo044UOuzfYkB5VvWllrZ2kidvpcXApCdQyIh4jZ1yDG3hZa5FMDFRm3+RTb9uM5ymhAQKBgQCeoV2kYCdvsN2tL6P7d4LZyE/L/3IgaytNNg9I+cvBkI7wdVxh3eZEnCYIxC0ql/p6sgy4F3bxvhgIapwwELyPfXnJaTkTinFOjLxgsD6g6y6TTpeKy/s2bJOhR/kfZytxKizbTmcnR0eFXek3W2AsKsPd3v3n+h+ik8KtVB2ckQKBgEV3XynPGr/a0sTNKLKJYufjbeBZ6LTfl3dSSEaIW0yDV5GmMdbOj/01fXve0cDK67Ff81e3cWBL7u3EDIefpDqF6nCkU5iIZSOeVeUE9DDJsEsjtkJCi1aUzqbx5n1K5fzvAmAfYDNjCCQQO7cJHYekqQ4F8y8b6DPmMI4r4+cBAoGAM/b9NuqU8+NK9tSleyfm++APOXJDB5shgpjq4HBlwrmxFWV8E+GJr3os3/5rsZINJU0Qu8nr9YffsUtvMOSf03OgQDRTDQfx4v+bbUQEMpeuCL7B10ZN99loxTGP7fn65KanFl0GEaxqXrmzzjYJ2p77xS1XhFJmxXwk06NCAKQ=-----END PRIVATE KEY-----";

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
    .connect({ host: "192.168.1.222" })
    .then(() => {
      return qz.printers.find();
    })
    .then((printers) => {
      if (!!printers) {
        let searchPrinter = printers.find((val) => val === "POS-80-Series");
        console.log("writer mode");
        if (!!searchPrinter) {
          let dataPdf = doc.output("datauristring").split(",")[1];
          let a = !!height && height > 100 ? Math.round(height) : 100;
          console.log("MODOMOZO");
          let config = qz.configs.create(searchPrinter, {
            scaleContent: true,
            size: {
              width: 70,
              height: !!height && height > 100 ? Math.round(height) : 200,
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
