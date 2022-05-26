import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";
import { format as formatter } from "date-fns";

import { printPdf } from "@/hooks/PrintPdf.js";

const settingsStore = useSettingsStore();
const productStore = useProductStore();
const tableStore = useTableStore();

const dateNow = formatter(new Date(Date.now()), "dd/MM/yyyy HH:mm:ss");

// let format = settingsStore.business_settings.printer.kitchen_printer_format;

const printOrderTicket = (props) => {
  let arrayDataPrint = [];

  productStore.places.forEach(async (place) => {
    let jumpLimiter = place.printer_format === 58 ? 10 : 60;

    let lengthData = 0;

    const createNewText = (textToFormat = "") => {
      let text = "";

      if (!!textToFormat) {
        text = textToFormat;

        lengthData += lengthData * 6.5;
      }

      if (props.updateOrder && !!props.table && !!textToFormat === false) {
        lengthData += lengthData * 6.5;
        text = `ACTUALIZACION: ${
          tableStore.getTableByID(props.table).description
        }`;
      }

      if (
        !!props.updateOrder === false &&
        !!props.table &&
        !!textToFormat === false
      ) {
        text = `MESA: ${tableStore.getTableByID(props.table).description}`;
      }

      let formatNewText = "";

      let rowFormatNewText = "";

      text.split(" ").map((valString, indx) => {
        if (indx === text.split(" ").length - 1) {
          if (
            rowFormatNewText.length + `${valString} `.length <= jumpLimiter &&
            `${valString} `.length >= 5
          ) {
            formatNewText += `${rowFormatNewText} ${valString}`;
          } else {
            formatNewText += `\n${rowFormatNewText} ${valString}`;
          }
        } else {
          if (
            rowFormatNewText.length + `${valString} `.length >= jumpLimiter &&
            `${valString} `.length >= 5
          ) {
            formatNewText += `${rowFormatNewText}\n`;

            return (rowFormatNewText = `${valString}`);
          } else {
            return (rowFormatNewText += `${valString} `);
          }
        }
      });

      return formatNewText;
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
      {
        dat: [
          [
            {
              content: !!props.table
                ? createNewText()
                : !!props.saleInf.delivery_info
                ? "DELIVERY"
                : "PARA LLEVAR",
              styles: {
                fontStyle: "bold",
                halign: "center",
                fontSize:
                  settingsStore.business_settings.printer.sub_header_font_size,
              },
            },
          ],
        ],
      },
    ];

    let info = props.data.order_details.filter(
      (detail) => detail.preparation_place === place.description
    );

    info.map((val) => {
      if (!!val.preparation_place) {
        let ind = "";

        val.indication.map((v) => {
          if (!!v.description) {
            ind = createNewText(v.description);

            if (v.takeAway) {
              if (ind.length + ` [PARA LLEVAR]`.length > 30) {
                ind += `\n[PARA LLEVAR]`;
              } else {
                ind += ` [PARA LLEVAR]`;
              }
            }

            lengthData += lengthData * 6.5;
          } else {
            if (v.takeAway) {
              ind = "[PARA LLEVAR]";
            }
          }

          lengthData += lengthData * 6.5;
        });

        let prodDetail = !!val.product_description
          ? val.product_description.split(",")
          : val.product_description;

        let verifyNameCombo = "";

        let newName = val.product_name;

        if (
          (val.product_category.toLowerCase().includes("combo") ||
            val.product_category.toLowerCase().includes("menu") ||
            val.product_category.toLowerCase().includes("menus") ||
            val.product_category.toLowerCase().includes("combos")) &&
          !!prodDetail &&
          prodDetail.length > 0
        ) {
          prodDetail.map((v, index) => {
            verifyNameCombo += `${index !== 0 ? "\n-" : "-"} ${v.trim()}`;
            lengthData += 6.5;
          });
        }
        if (settingsStore.business_settings.printer.show_cat) {
          if (
            val.product_category.toLowerCase().includes("menu") ||
            val.product_category.toLowerCase().includes("menus")
          ) {
            newName = `[MENU] ${newName}`;
          } else if (
            (!!val.product_category.toLowerCase().includes("menu") === false ||
              !!val.product_category.toLowerCase().includes("menus") ===
                false) &&
            (!!val.product_category.toLowerCase().includes("combo") === false ||
              !!val.product_category.toLowerCase().includes("combo") === false)
          ) {
            newName = `[CARTA] ${newName}`;
          }
        }

        structure.push(
          {
            line: true,
            dat: [
              [
                {
                  content: createNewText(`*${newName}`),
                  styles: {
                    fontStyle: "bold",
                    fontSize:
                      settingsStore.business_settings.printer.body_font_size,
                  },
                },
              ],
            ],
          },
          verifyNameCombo && {
            dat: [
              [
                {
                  content: createNewText(verifyNameCombo),
                  styles: {
                    fontSize:
                      settingsStore.business_settings.printer.body_font_size,
                  },
                },
              ],
            ],
          },
          !!ind && {
            dat: [
              [
                {
                  content: ind.toUpperCase(),
                  styles: {
                    fontStyle: "bold",
                    fontSize:
                      settingsStore.business_settings.printer.body_font_size,
                  },
                },
              ],
            ],
          },
          {
            dat: [
              [
                {
                  content: `Cant.: ${val.quantity}`,
                  styles: {
                    fontStyle: "bold",
                    fontSize:
                      settingsStore.business_settings.printer.body_font_size,
                  },
                },
              ],
            ],
          }
        );
      }
    });

    structure.push({
      line: true,

      dat: [
        [
          {
            content: `Fecha : ${dateNow}`,
            styles: {
              fontStyle: "bold",
              fontSize:
                settingsStore.business_settings.printer.footer_font_size,
            },
          },
        ],
      ],
    });

    if (!!props.data.username) {
      lengthData += 10;
      structure.push({
        dat: [
          [
            {
              content: `MOZO: ${props.data.username}`,
              styles: {
                fontStyle: "bold",
                fontSize:
                  settingsStore.business_settings.printer.footer_font_size,
              },
            },
          ],
        ],
      });
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

  printPdf(arrayDataPrint);
};

export default printOrderTicket;
