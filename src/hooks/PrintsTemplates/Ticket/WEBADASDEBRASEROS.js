import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";
import { format as formatter } from "date-fns";

import { printPdf } from "@/hooks/PrintPdf.js";

const settingsStore = useSettingsStore();
const productStore = useProductStore();
const tableStore = useTableStore();

let dateNow = formatter(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss");

const printWEBADASDEBRASEROS = (props) => {
  let arrayDataPrint = [];

  if (!!props.created && !!props.updateOrder === false) dateNow = props.created;

  productStore.places.forEach(async (place) => {
    let format = place.printer_format;

    let vuleto = props.changing || 0.0;
    vuleto -= vuleto * 2;

    let lengthData = 0;

    const createNewText = (textToFormat = "") => {
      let text = textToFormat;
      lengthData += 10;

      let formatNewText = "";

      let rowFormatNewText = "";

      text.split(" ").map((valString, indx) => {
        let FutureLength = rowFormatNewText.length + `${valString}`.length;

        let jumpInd = format === 58 ? 12 : 20;

        if ((FutureLength + jumpInd) / format <= 0.5) {
          if (text.split(" ").length - 1 === indx) {
            formatNewText += `${rowFormatNewText} ${valString}`;

            rowFormatNewText = "";
          } else {
            rowFormatNewText += `${valString} `;
          }
        } else {
          formatNewText += `${rowFormatNewText}\n${valString} `;

          lengthData += 10;

          rowFormatNewText = "";
        }
      });

      return formatNewText;
    };

    let structure = [
      {
        dat: [
          !!props.data.ask_for && [
            {
              content: `Cliente: ${props.data.ask_for}`,
              styles: {
                fontStyle: "bold",
                halign: "left",
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
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

    !!props.updateOrder &&
      structure.push({
        dat: [
          [
            {
              content: "ACTUALIZACION:",
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

    !!props.table &&
      structure.push({
        dat: [
          [
            {
              content: `${tableStore.getTableByID(props.table).description}`,
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

    settingsStore.business_settings.printer.show_delivery_kitchen &&
      !!props.saleInf &&
      !!props.saleInf.delivery_info &&
      structure.push({
        dat: [
          [
            {
              content: props.saleInf.delivery_info.phone,
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
              content: "LLEVAR",
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

    info.map((val) => {
      if (!!val.preparation_place) {
        let ind = "";

        lengthData += 10;
        val.indication.map((v) => {
          if (!!v.description) {
            ind += `${createNewText(`*** ${v.description}`)}`;

            if (v.takeAway) {
              if (ind.length + ` [llevar]`.length > 30) {
                ind += `\n[llevar]`;
              } else {
                ind += ` [llevar]`;
              }
            }

            lengthData += 10;
          } else {
            if (v.takeAway) {
              ind = "*** [llevar]";
            }
          }

          lengthData += 10;
        });

        structure.push(
          {
            line: true,
            dat: [
              [
                {
                  content: createNewText(`${val.quantity}x${val.product_name}`),
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
                      settingsStore.business_settings.printer.body_font_size,
                    fontStyle: "italic",
                  },
                },
              ],
            ],
          }
        );
      }
    });

    if (
      settingsStore.business_settings.printer.show_delivery_kitchen &&
      !!props.saleInf &&
      !!props.saleInf.delivery_info
    ) {
      lengthData += 50;
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
          line: true,
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
        },
        {
          dat: [
            [
              {
                content: `Vuelto:${vuleto}`,
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
        formatTemp: place.printer_format,
      });
    }
  });

  if (arrayDataPrint.length > 0) printPdf(arrayDataPrint);
};

export default printWEBADASDEBRASEROS;
