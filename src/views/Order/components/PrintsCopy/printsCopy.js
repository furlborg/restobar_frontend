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
      "-----BEGIN CERTIFICATE-----MIIECzCCAvOgAwIBAgIGAYAJxgv9MA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTIyMDQwNzE1MjMzNVoXDTQyMDQwNzE1MjMzNVowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDQ3KQ2Xsi1nMd9swchLG0/UfyWTl4xUtqAVgt+8p04vnMdP0osDoUA0G84Ji+gxmBOy3/OLO8278Eh54Awh6IiDHwE62uYIwQUb6wXLZNLg+3gSxaxMVBhunY1TO/nUC458d9BLCyjn5uTCAUge7EVMwKRmlxzK5sXLfCSBV6DaT8sbeevpQDqLavxkkMVog2f5zMUi82biifHrwkdTIx4BGIibfToleLEVP3kR3Iu2jrxnFz0x+SPHQG/q5Kt4hGt+e20XiQjGIINOYHI03CKfymRAjvhtoKUmcT37GeguWWd3ammG7YppNvWWAG5xCSFiDjLT2gsIbDU7xTcxIyXAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBR/dm5yehlLwZTlnkomSzCbh4GA7TANBgkqhkiG9w0BAQsFAAOCAQEAS0F+kRp2G4K2p4GGZ3VmU1SuLpHuLSHz9GBdSD85knSSmDx9esVvJZRIMTyybqDQFIe9BJiIBDE8reexq2nmOeh/g9wEErP7Y+TsPWZPOar2fT+aWCG+7GqtCFvVBkIUY+37ozmi9SLboIf5StNcqEVM7sbG9DP+Uv3Cxa7GiQfPjAbpjjJPBRURCnK1vfoEAEOAienb0vVGlZOsu9Cg2iCiKYA5PZ6/mQCrHX3kippDFh7VDWs4W2gn3O8XVfoATH3khwSpZIEOC8VnU6V+2mDGQObkeOIwqH8tz9bBVQFjqAHaEqg2c5gv51ufWKAmImgBZoi0HyoM8xwtFydSPw==-----END CERTIFICATE-----"
    );
  });

  const privateKey =
    "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQ3KQ2Xsi1nMd9swchLG0/UfyWTl4xUtqAVgt+8p04vnMdP0osDoUA0G84Ji+gxmBOy3/OLO8278Eh54Awh6IiDHwE62uYIwQUb6wXLZNLg+3gSxaxMVBhunY1TO/nUC458d9BLCyjn5uTCAUge7EVMwKRmlxzK5sXLfCSBV6DaT8sbeevpQDqLavxkkMVog2f5zMUi82biifHrwkdTIx4BGIibfToleLEVP3kR3Iu2jrxnFz0x+SPHQG/q5Kt4hGt+e20XiQjGIINOYHI03CKfymRAjvhtoKUmcT37GeguWWd3ammG7YppNvWWAG5xCSFiDjLT2gsIbDU7xTcxIyXAgMBAAECggEAOX2aZ+rkNXVvxg5a9osrkSPospjkvY/wXCYTKQDwPPfTaOgMax8eBjDZhGuibY9dYCMMzXw55nXNRB9cfj8/Zj7oflQs/CYbT+LDTGf7pOwuNLCGkQShex0fv6ErYhEEgGevC9n0eZ+L68dn3d6eSlcNrHWAYCVPHezDzPXUY7g7VPuNupVC7ue1nuA+z8Jg8wpNgDZV2uOwllLAB976DFuJGJlajrGp5CnSFUJcXMAXY5dIMGe68AS2IboORVjZi2DNT2wRFTiLGVWEVbOIO+7stZn9KwrullURyglCk8lnTaLl4/WzuZq+S/mYq/8/QSvdCC4qjOTNtBRZ9bt7YQKBgQD9zcMEhrgBxK2ApMhgfmVSc4LqDVkFb0QJW3dupj1skzCRu9wSU3KHaNErIIuNr2OkPx0NejwsPayfVgZfsGK8x83e0ysJvJEBjzD2d3bOD0n/Xk0xc9cu57zJWhi4A6QsAP0mj38/adYqTHoXV+hkFec3tISefNTEs75xyVIV4QKBgQDSq1KAljCsd4XouKZa5xZ2QW0rFbCVvBJM6ZrUWUk8+xeOS/SIPAA0UCxaYzpyaDnbH8JUugt/q7+5gRRHp2CJ3TSc2BVmsAteNVoj+auCd3khiLdtmJQ5zumY1obTUyXMiFGARf5vvAhz3jv+RQ05r5Cufw7sS8Qs/dxKsVaBdwKBgQDd1bT5Bc9bLE8CPAUv4gopkPECJfyDNYdgLmQrgH37ooM3Pd3S3sEh/cmlSmLvyjbrXobEOuzRNm7lLcmQZZlHq9QTSLs7XWfY1xFSu4RKAy8IV6Jc8QVJ6B8oVul4HSanl42s4Iu2H4mjmwiz0pA6urJIDC5GYJGQBBMXXYGzwQKBgH27dm/8M2yboTY2DkMurH9DqS4PseaL6rgwrBGUgFt+2J46wuUUOmL+fporotRpVC5tlAQRTY+TJ8hFO59QTBO8DAyYAp3Y78/4M6ZI+o3RVGApQqCMcdrWnSB02N8DPwoFSe8u1x5EsR7GQjQNbklBeS5L8tIgniLkGDgUAzcdAoGAVPEm5SqAWwl5YyuTkeVMBXY+IwkOfNHJTSEzH71Gn7SKUpCxulMoivxvbuVrA1Rq5JKrSaP+kKjhBRdSFI3cewim7+2tITvYx70QO45oNOM6huGwQ24PP9+lgFz03x1Ma9QpE5v+wii3cPbTEnM3WnJyDuOAJJjWHAnnPa+3lkk=-----END PRIVATE KEY-----";

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

        if (!!searchPrinter) {
          let dataPdf = doc.output("datauristring").split(",")[1];

          let config = qz.configs.create(searchPrinter, {
            scaleContent: true,
            size: { width: 70, height: height },
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
