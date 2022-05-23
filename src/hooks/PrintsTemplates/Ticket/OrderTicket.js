import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";

import { printPdf } from "@/hooks/PrintPdf.js";

const settingsStore = useSettingsStore();
const productStore = useProductStore();
const tableStore = useTableStore();

const fetch = new Date();
const dd = fetch.getDate();
const mm = fetch.getMonth();
const yy = fetch.getFullYear();
const hh = fetch.getHours();
const msms = fetch.getMinutes();

const dateNow = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;

const printOrderTicket = (props) => {
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
      {
        dat: [
          [
            {
              content: !!props.table
                ? createName()
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
        val.indication.map((v, i) => {
          let cadenaConCaracteres = "";
          if (!!v.description) {
            let longitudCadena = v.description.length;

            for (let i = 0; i < longitudCadena; i += 40) {
              if (i + 40 < longitudCadena) {
                cadenaConCaracteres +=
                  v.description.substring(i, i + 40) + "\n";
                lC += v.description.length / 40;
              } else {
                cadenaConCaracteres += v.description.substring(
                  i,
                  longitudCadena
                );
              }
            }

            ind = `${ind}${i + 1}-${cadenaConCaracteres}\n`;
          }
        });

        let prodDetail = !!val.product_description
          ? val.product_description.split(",")
          : val.product_description;

        let newNameProd = val.product_name;

        let heightForNmae = 10;

        let verifyNameCombo = "";

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
            newNameProd = `[MENU] ${newNameProd}`;
          } else if (
            (!!val.product_category.toLowerCase().includes("menu") === false ||
              !!val.product_category.toLowerCase().includes("menus") ===
                false) &&
            (!!val.product_category.toLowerCase().includes("combo") === false ||
              !!val.product_category.toLowerCase().includes("combo") === false)
          ) {
            newNameProd = `[CARTA] ${newNameProd}`;
          }
          lengthData += 10 * heightForNmae;
        }

        structure.push(
          {
            line: true,
            dat: [
              [
                {
                  content: `*${newNameProd}`,
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
                  content: verifyNameCombo,
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
      });
    }
  });

  printPdf(arrayDataPrint);
};

export default printOrderTicket;
