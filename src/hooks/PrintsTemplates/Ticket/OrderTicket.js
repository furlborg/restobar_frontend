import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";

import { printPdf } from "@/hooks/PrintPdf.js";

const settingsStore = useSettingsStore();
const productStore = useProductStore();
const tableStore = useTableStore();

// let format = settingsStore.business_settings.printer.kitchen_printer_format;

const printOrderTicket = (props) => {
  let arrayDataPrint = [];

  productStore.places.forEach(async (place) => {
    let format = place.printer_format;

    let lengthData = 0;

    const createNewText = (textToFormat = "") => {
      let text = textToFormat;
      lengthData += 10;

      let formatNewText = "";

      let rowFormatNewText = "";

      text.split(" ").map((valString, indx) => {
        let FutureLength = rowFormatNewText.length + `${valString}`.length;

        let jumpInd = format === 58 ? 12 : 20;

        if ((FutureLength + jumpInd) / format <= 0.57) {
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

    lengthData += 10;

    let structure = [
      !!props.data.ask_for && {
        dat: [
          [
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
        ],
      },
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

    lengthData += 10;

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

    lengthData += 10;

    !!props.table &&
      structure.push({
        dat: [
          [
            {
              content: !!props.table
                ? `${tableStore.getTableByID(props.table).description}`
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
      });

    let info = props.data.order_details.filter(
      (detail) => detail.preparation_place === place.description
    );

    info.map((val) => {
      if (!!val.preparation_place) {
        let ind = "";

        lengthData += 10;

        val.indication.map((v) => {
          let desc = "";
          if (!!v.quick_indications.length) {
            v.quick_indications.forEach((ind) => {
              desc += `${ind}, `;
            });
          }
          v.description = !!v.description
            ? desc + v.description
            : desc.slice(0, -2);
          if (!!v.description) {
            ind = createNewText(v.description);

            if (v.takeAway) {
              if (ind.length + ` [PARA LLEVAR]`.length > 30) {
                ind += `\n[PARA LLEVAR]`;
              } else {
                ind += ` [PARA LLEVAR]`;
              }
            }

            lengthData += 10;
          } else {
            if (v.takeAway) {
              ind = "[PARA LLEVAR]";
            }
          }

          lengthData += 10;
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
            lengthData += 10;
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

    lengthData += 20;
    structure.push({
      line: true,

      dat: [
        [
          {
            content: `Fecha : ${
              !props.updateOrder ? props.data.created : props.data.modified
            }`,
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

  if (arrayDataPrint.length > 0) printPdf(arrayDataPrint);
};

export default printOrderTicket;
