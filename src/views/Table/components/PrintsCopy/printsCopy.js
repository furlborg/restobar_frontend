import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import qz from "qz-tray";

import rs from "jsrsasign";

export const generatePrintCopy = (structure, height) => {
  console.log();
  const doc = new jspdf({
    orientation: "p",
    unit: "mm",
    format: [80, !!height && height > 80 ? Math.round(height) : 80],
  });
  structure.map((val) => {
    let finalY = doc.lastAutoTable.finalY || 0;

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

  qz.security.setCertificatePromise(function (resolve, reject) {
    resolve(
      "-----BEGIN CERTIFICATE-----MIIECzCCAvOgAwIBAgIGAX/g844XMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTIyMDMzMDE3MDg1MloXDTQyMDMzMDE3MDg1MlowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCYt7GW9zqci1txnBIww953de5VSpmovUrCM7nWGSXG6jq00L7PWbvcjIc3+Iorvm27dMZBrRtuM2jIaqVVLPsg6T3dDRrRd8Ez+Sqiyu/IbVX3KP6R2CJm6qAe9f6qD9T5R5v5W0Ublhz0YM5gQLT4YPSMstP4SUfNhmMiAqJzeeb2FNcN8usj7CBXGtaEk0T1Y5jcRgDsN9+dCdDIKPnF9hEaeCGgDTSpfbivAsDByZ3fjgmQ1+2IyUzXvNS8QdX66ift6Ox/oR7x0iohMQ6mdqjRBGdMzJ+eLMKUcKkllU8rkBSyXaL21gG6GN63yxXX/q1T7gzU/ZXJAQf0Pvm5AgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBQnbIILjpFCcwqJomskIIBrbYk7wzANBgkqhkiG9w0BAQsFAAOCAQEAhulhMeectLKU3AwDqdyVgCX2jtB976Y+vAchRVZY6O5hibGTsrHqLZcCew5B7kxMEhNVyPTQa4EpVkJRf/qKAtVr5hEHGYuQl5PjvxRl1jMoNG8PrDPnK0380soIpcBzIlzrWJ5plGMet8ZMLitvVXbNsvY0ihElDivMCuV+sC9bzGRzYl9yUA5HO5B89MR24Ih1mfLVCAcURD0+gB+0i/oiWy5s8jo65MEl8g0a8zqfMUjEIzpL508Tf3baaLRiaB2hxr6XqVEGWd1iUWbs4ib85EHBh+kCGO5kouiazGqWcbNMh9TKvTzmYhrCU2sb6Icnh0uiaxgTQMrJJWFdhw==-----END CERTIFICATE-----"
    );
  });

  let privateKey =
    "-----BEGIN PRIVATE KEY-----MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCYt7GW9zqci1txnBIww953de5VSpmovUrCM7nWGSXG6jq00L7PWbvcjIc3+Iorvm27dMZBrRtuM2jIaqVVLPsg6T3dDRrRd8Ez+Sqiyu/IbVX3KP6R2CJm6qAe9f6qD9T5R5v5W0Ublhz0YM5gQLT4YPSMstP4SUfNhmMiAqJzeeb2FNcN8usj7CBXGtaEk0T1Y5jcRgDsN9+dCdDIKPnF9hEaeCGgDTSpfbivAsDByZ3fjgmQ1+2IyUzXvNS8QdX66ift6Ox/oR7x0iohMQ6mdqjRBGdMzJ+eLMKUcKkllU8rkBSyXaL21gG6GN63yxXX/q1T7gzU/ZXJAQf0Pvm5AgMBAAECggEAAJpXPwOmy9vdSCC2VF80Yc4Zp/6xbKbWDiSp+7m4Ci9q4ynnGonN02HYirZMv4q2Fr0wDa3fMhNablHrQtLYqUFgEav1zCsmYsjdm/L3ZdGjR94io1gb0NwL0DqtVYXjU9Pn3mdRKbOKyN7lEODC6u9npvKk4jtroN8oxWD57w3QwiBervwiyzdxr5HvIgKJ7djBueDcXhLIBCwZqjNrOIdIwYvC7KUBoCV315P2/Z/GHi7PRiw7HctpAjf83nkeNROOFBk+MO/iGLyOflOFEDFl/ipk+0UvowSp7drSZH4Zb/YZ2c4qJuHxzHOq6R/l9RG9m3aA5RYIRBfflNKVwQKBgQDOD+VRq6kpFwmACnEdlXdTmONpWUvCe9o4dd5dT56AdFfjklhcfNpaIAj+SRxcdVauHi1vWWvswPvC4bQa74tHikzLotlISNGxs6pOvDzOX6QTPhzF1I02cL9a5RyY1bsNOJVlhVmxhKHQYIjo163AXEBea+i5y9KUram1OWbUQQKBgQC9ukyzULSw58R4QvJMBjdvqA+DHJShNBVumfTSCcLtI4D0Vd3Z9boYDe1bCr0JzExnmRQove9dl5CVoggk7GnkWyGMbV/ZEkyvS4KivVNAF0RjGN3WfZkftInhLFJotOKdHjSuCB4h1XN2ir9eS/Ut789ZqcwgHQEygWP2yZ7neQKBgAlhEdgIzzdOlCEe2I03K2pDsD4wUVF137XoL4nhwN4p7YIvPBRhnnKxuJcSbtcKhDqCpyDFWjM5iXwSV+dN9fH4qowuSmOO5PSIr/zLdp0SH1682gRrK05KDXuuqAGQ4OW2KJ6pVi7NUawxaKnof0EdMdTaZopma5xW1z2ncjXBAoGADVoC88uGK7zjsqLjcj4twInPLabhPsbviy0CcZWGRjHtbURtrF0Cj5bLUVDcJMhfyBqZtJRJOAjmf+E7OX35pbxUDBHWYOxMwTlLJDC2nxgEFAU391Q3ZmfKHDKGSiAQooXxpx2jITZoPbtd5EDsLCNoMCMm3kusPeWlJ0ThDeECgYBv15WilEknnWDyObaBwfgzuhdJ6jk1TcaIoND8xhI/3RbMnd0B4rTQmdZIQYwvjIuKgbcgi0i8M+Bem+idH8aoCD6E0abxUp0+jpHgK//UqBlVqprszrNf2MHgSyzXZ82fj4JMBwh7iudv5ZVqEngNUWVQzlmFJ/9WUOfdk23Pgg==-----END PRIVATE KEY-----";

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

  qz.networking("192.168.1.222", 8082);
  
  qz.socket.open("192.168.1.222", 8082);

  qz.websocket
    .connect({ host: "192.168.1.222" })
    .then(() => {
      return qz.printers.find();
    })

    .then((printers) => {
      if (!!printers) {
        let searchPrinter = printers.find(
          (val) => val.toLowerCase() === "POS-80-Series".toLowerCase()
        );

        if (!!searchPrinter) {
          let a = doc.output("datauristring").split(",")[1];

          let config = qz.configs.create(searchPrinter);
          return qz.print(config, [
            {
              type: "pixel",
              format: "pdf",
              flavor: "base64",
              data: a,
            },
          ]);
        } else {
          console.log("impresora no encontrada");
        }
      } else {
        console.log("no hay impresoras");
      }
    })
    .then(() => {
      return qz.websocket.disconnect();
    })
    .then(() => {
      // process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      // process.exit(1);
    })
    .finally(() => {
      return qz.websocket.disconnect();
    });

  qz.socket.close("192.168.1.222", 8082);
};
