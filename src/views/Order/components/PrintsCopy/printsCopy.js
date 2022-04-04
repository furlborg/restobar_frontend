import jspdf from "jspdf";
import autoTable from "jspdf-autotable";

import qz from "qz-tray";

export const generatePrintCopy = (structure, height) => {
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
      "-----BEGIN CERTIFICATE-----MIIECzCCAvOgAwIBAgIGAX/gTjTZMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTIyMDMzMDE0MDgxNloXDTQyMDMzMDE0MDgxNlowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCce8QQfbhmHtJIOQFGYgUBDXnkh03bwzvgbWecncfJjIiIZaR/0yCwzL9MK9GcXxvBO0XATRgWPzwCVCp/n9ALlJ2gLw/5H4azyDeNmhXc+r7WI6hKQaGx2jF8pkxI56YU7ucMmOOtvpIV8unS3PWMPRQpyPD+W/+YPuKukY+PpuFg7XoSlsWB9psUVGoMAyDeDVJIMo/hCQIhvXeYFOcC1HMsjGL4AHNlDXqo55mI36Gpg9RPPTdLJKmPfli/PjxbASBvcqaQFczaGvzhVCLccrZurMOXh3pAHE3W+4HlFf5GvPcuGSzkkUadOcixANHXB54tialiALWeAQAD2FyVAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBTLaN+YNF4ubJfoRuRtE/4U8vN8rDANBgkqhkiG9w0BAQsFAAOCAQEAC21hVCrHr2dkozHLe3B1EX7sWaLpSn02RmvZYoeAMuIHBnwCWVISD7Ck1WDcsXaSA+i964/7OdF6a8MEQwtRPUKneMR3147GMibdaw3h8MLPthjsorZBHTxcNBlwmbBDTBYfbmpoj6HHYuETWkJhNpdEb7SlSjGfpSsol+JVJc9yOpRtRqa5rT+FS9JmvHbXgZEF4GBK+vZK9joYpjETeEgd/qDzaXrUuu9JUE5WENhQ/N+jMVEOz6ZfLkReuYAlxUPO4G4ageULaYiisTSzCi77nufdemXn9bhGC2rDNhLIAxNa/haWyjfoyjqrfsvVzfn0ixPiJxIYxDaTnHhPvQ==-----END CERTIFICATE-----"
    );
  });

  let privateKey =
    "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCce8QQfbhmHtJIOQFGYgUBDXnkh03bwzvgbWecncfJjIiIZaR/0yCwzL9MK9GcXxvBO0XATRgWPzwCVCp/n9ALlJ2gLw/5H4azyDeNmhXc+r7WI6hKQaGx2jF8pkxI56YU7ucMmOOtvpIV8unS3PWMPRQpyPD+W/+YPuKukY+PpuFg7XoSlsWB9psUVGoMAyDeDVJIMo/hCQIhvXeYFOcC1HMsjGL4AHNlDXqo55mI36Gpg9RPPTdLJKmPfli/PjxbASBvcqaQFczaGvzhVCLccrZurMOXh3pAHE3W+4HlFf5GvPcuGSzkkUadOcixANHXB54tialiALWeAQAD2FyVAgMBAAECggEALfh6F/InGvERC6CbjEa9e5qu5YEOUXJgg8UAPFVp3P8JGTDrC5ZFs0rjJAh3cr3KFJFKI31Chz6abYC2X3nej5hgWi+ZPLGTS/uUvme25o1PRO+CwBXZ37re8OSV4pETDHFGtT+xG1ix5/rN0GGTTVigNMpQahky1FIdG/WtPCDvdCZ4657t6DZmwIsVTkVOBCxoPxbHBjPGbEzcnaNP9Nnlxf2yY29uG7vsEPxRbEbPjFeaI1zhcIXoRN5uymESTuBGUJ2aViaXKjKiD1rK5rF90xnqaJK5RC02cvu830qYNoLXcS2JX/USMMddU4r8MxP8F6KeF27ldJGXkmuZvQKBgQDZSlgL2EzPmBX0iTCEiMQp0UVCoYPYFlIDaXxOfJZSQoyG2zBhwJayJFO+VAQVWdqfgEpWdsphaOTOqtVGNiXNZhWgbEHPDM5inHRbz3ykWP91N6bk5+iTRxOfROUhWFxeDTJ4NYBfbQXNHB9lW5Sx3cGWDLprIN1zJnQByg/GlwKBgQC4XEkeytoTY+xWuX6U4JEe//wINjFUR7gXHjj7+NTDDDu1YKu9Vd1jcWQKovzvHtxt8QSJu7AOSGBQnHoc/Trjnz3zLRAelilBCZIYg3M79RdePzQs3RtSKIKCtzxXSBTp8Ju3OpadVwPtREpLXHBX5gSA8kZzeuzPuWUgvlynswKBgQCzhsQWDUDxJ6PEJXELn4ALWNbThWTMLSzXmtjUdAUys78tUH251gfr6S2zi/DPvyxtKe7BX2Y4cxTQV77cQrKa8KQfpjH9IoSGXuOYU2aU1t9BdpiSebTjsg7ZQW/aTAoMvvSa8wE8VnQ7keeys6a4ChL+qUeAaWft0rB4Jf1AwwKBgBkcCKF3A2isrV3KeeERDPLp7ou3xdQyyHHtndlDtMaz/dXgSsPI1BRdN0Dznft7eo5Gy1VvCLWJSgTwqvkTzFeAMtHSC2X/EbNX+Fv6W1GJOhuOBC8wFi6EcfIXvtIscRzDtpGoGydm2JQSPwQwnOR74ZUmak4EKgjIuWtSQhBdAoGAL0ypBqaWZ7q7gCZQDUk3uuLFDBqFDrbBCDRAQD5i1KbQe9K5w3CD77NXqUL39e/JBghbIJ82DmlgIAPVn81QVQ6mxuP/+NQgLqtP9KnMy+i0jVfQJyToHlB/l9IJCMxbhfOCFVMFvyK3m0cwq3Kf2foxMhNkd8x6d70HhU7KXBE=-----END PRIVATE KEY-----";

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
    .catch((a) => {
      console.log(a);
    })
    .then((printers) => {
      let a = doc.output("datauristring").split(",")[1];
      let config = qz.configs.create(printers[1]);
      return qz.print(config, [
        {
          type: "pixel",
          format: "pdf",
          flavor: "base64",
          data: a,
        },
      ]);
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
};
