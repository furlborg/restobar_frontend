import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";
import { format as formatter } from "date-fns";

import { printPdf } from "@/hooks/PrintPdf.js";

const settingsStore = useSettingsStore();
const productStore = useProductStore();
const tableStore = useTableStore();

const dateNow = formatter(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss");

let format = settingsStore.business_settings.printer.kitchen_printer_format;

const printWEBADASDEBRASEROS = (props) => {
  let arrayDataPrint = [];

  productStore.places.forEach(async (place) => {
    let lengthData = 0;

    const createName = () => {
      if (props.updateOrder && !!props.table) {
        lengthData += 7 * 6.5;
        return `ACTUALIZACION: ${
          tableStore.getTableByID(props.table).description
        }`;
      } else {
        return `MESA: ${tableStore.getTableByID(props.table).description}`;
      }
    };

    let structure = [
      {
        dat: [
          [
            {
              content: `ORDEN: ${props.data.id}`,
              styles: {
                fontStyle: "bold",
                halign: "center",
                fontSize:
                  settingsStore.business_settings.printer.header_font_size,
              },
            },
          ],
        ],
      },
    ];

    !!props.saleInf === false &&
      structure.push({
        dat: [
          [
            {
              content: createName(),
              styles: {
                fontStyle: "bold",
                halign: "center",
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
        ],
      });

    !!props.saleInf &&
      !!props.saleInf.delivery_info &&
      structure.push({
        dat: [
          [
            {
              content: "N° DE TELEFONO",
              styles: {
                fontStyle: "bold",
                halign: "center",
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
        ],
      });

    !!props.saleInf &&
      !!props.saleInf.delivery_info === false &&
      structure.push({
        dat: [
          [
            {
              content: "PARA LLEVAR",
              styles: {
                fontStyle: "bold",
                halign: "center",
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
        ],
      });

    if (!!props.saleInf && !!props.saleInf.delivery_info) {
      lengthData += 10;
      structure.push({
        dat: [
          [
            {
              content: "DELIVERY",
              styles: {
                fontStyle: "bold",
                halign: "center",
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
        ],
      });
    }

    structure.push({
      dat: [
        [
          {
            content: ` ${dateNow}`,
            styles: {
              fontSize:
                settingsStore.business_settings.printer.sub_header_font_size,
            },
          },
        ],
      ],
    });

    if (!!props.data.username) {
      structure.push({
        dat: [
          [
            {
              content: `${props.data.username}`,
              styles: {
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
        ],
      });
    }

    let info = props.data.order_details.filter(
      (detail) => detail.preparation_place === place.description
    );

    info.map((val, index) => {
      if (!!val.preparation_place) {
        let newNameProd = `${val.quantity} x ${val.product_name}`;

        let formatNewNameProd = "";

        let rowFormatNewName = "";

        newNameProd.split(" ").map((valString, indx) => {
          if (indx === newNameProd.split(" ").length - 1) {
            if (rowFormatNewName.length + `${valString} `.length <= 30) {
              formatNewNameProd += `${rowFormatNewName} ${valString}`;
            } else {
              formatNewNameProd += `\n${rowFormatNewName} ${valString}`;
            }
          } else {
            if (rowFormatNewName.length + `${valString} `.length >= 30) {
              formatNewNameProd += `${rowFormatNewName}\n`;

              return (rowFormatNewName = `${valString}`);
            } else {
              return (rowFormatNewName += `${valString} `);
            }
          }
        });

        let ind = "";

        val.indication.map((v) => {
          if (!!v.description) {
            ind = "*** ";

            let rowInd = "";

            v.description.split(" ").map((valString, indx) => {
              if (indx === v.description.split(" ").length - 1) {
                if (rowInd.length + `${valString} `.length <= 30) {
                  ind += `${rowInd} ${valString}`;
                } else {
                  ind += `\n${rowInd} ${valString}`;
                }
              } else {
                if (rowInd.length + `${valString} `.length >= 30) {
                  ind += `${rowInd}\n`;

                  return (rowInd = `${valString}`);
                } else {
                  return (rowInd += `${valString} `);
                }
              }
            });

            if (v.takeAway) {
              if (ind.length + ` [llevar]`.length > 30) {
                ind += `\n[llevar]`;
              } else {
                ind += ` [llevar]`;
              }
            }

            lengthData += lengthData * 6.5;
          } else {
            if (v.takeAway) {
              ind = "*** [llevar]";
            }
          }

          lengthData += lengthData * 6.5;
        });

        structure.push(
          {
            line: true,
            dat: [
              [
                {
                  content: formatNewNameProd,
                  styles: {
                    fontStyle: "bold",
                    fontSize:
                      settingsStore.business_settings.printer.body_font_size,
                    rowSpan: 0.5,
                  },
                },
              ],
            ],
          },

          !!ind && {
            dat: [
              [
                {
                  content: ind.toLowerCase(),
                  styles: {
                    fontSize:
                      settingsStore.business_settings.printer.body_font_size -
                      2,
                    fontStyle: "italic",
                  },
                },
              ],
            ],
          }
        );
      }
    });

    if (!!props.saleInf && !!props.saleInf.delivery_info) {
      lengthData += 4 * 6.75;
      structure.push(
        {
          dat: [
            [
              {
                content: props.saleInf.delivery_info.address,
                styles: {
                  fontStyle: "italic",
                  fontSize:
                    settingsStore.business_settings.printer.footer_font_size,
                },
              },
            ],
          ],
        },
        {
          dat: [
            [
              {
                content: props.saleInf.delivery_info.amount,
                styles: {
                  fontStyle: "italic",
                  fontSize:
                    settingsStore.business_settings.printer.footer_font_size,
                },
              },
            ],
          ],
        },
        {
          dat: [
            [
              {
                content: props.saleInf.delivery_info.deliveryman,
                styles: {
                  fontStyle: "italic",
                  fontSize:
                    settingsStore.business_settings.printer.footer_font_size,
                },
              },
            ],
          ],
        },
        {
          dat: [
            [
              {
                content: props.saleInf.delivery_info.person,
                styles: {
                  fontStyle: "italic",
                  fontSize:
                    settingsStore.business_settings.printer.footer_font_size,
                },
              },
            ],
          ],
        }
      );
    }

    if (info.length > 0) {
      arrayDataPrint.push({
        data: structure,
        lengthOfData: lengthData,
        printerName: place.printer_name,
      });
    }
  });

  printPdf(arrayDataPrint);
};

export default printWEBADASDEBRASEROS;
