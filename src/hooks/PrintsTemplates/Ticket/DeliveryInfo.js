import { CreatePdfFile } from "@/hooks/CreatePdfFile.js";
import { useSettingsStore } from "@/store/modules/settings";
const settingsStore = useSettingsStore();

const printDeliveryInfo = (props) => {
  let dataForPrint = JSON.parse(props.data.json_sale);

  let vuleto = props.changing || 0.0;
  vuleto -= vuleto * 2;

  const structure = [
    {
      dat: [
        [
          {
            content: `DELIVERY ${dataForPrint.serie_documento}-${dataForPrint.numero_documento}`,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize:
                settingsStore.business_settings.printer
                  .delivery_ticket_font_size + 2,
            },
          },
        ],
        [
          {
            content: "ORDEN: " + props.data.id,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize:
                settingsStore.business_settings.printer
                  .delivery_ticket_font_size + 2,
            },
          },
        ],
      ],
    },
    {
      line: true,
      fontSize:
        settingsStore.business_settings.printer.delivery_ticket_font_size,
      dat: [
        {
          tittle: "CLIENTE",
          twoPoints: ":",
          cont: dataForPrint.datos_del_cliente_o_receptor
            .apellidos_y_nombres_o_razon_social,
        },
        {
          tittle: "PREGUNTAR POR",
          twoPoints: ":",
          cont: props.data.delivery_info.person,
        },

        {
          tittle: "TELEFONO",
          twoPoints: ":",
          cont: props.data.delivery_info.phone,
        },

        {
          tittle: "DIRECCION",
          twoPoints: ":",
          cont: props.data.delivery_info.address,
        },

        {
          tittle: "F.EMISIÓN",
          twoPoints: ":",
          cont: `${dataForPrint.fecha_de_emision} ${dataForPrint.hora_de_emision}`,
        },
        {
          tittle: "PAGARA CON",
          twoPoints: ":",
          cont: props.data.given_amount,
        },
        {
          tittle: "VUELTO",
          twoPoints: ":",
          cont: vuleto.toFixed("2"),
        },
      ],
    },
    {
      line: true,
      fontSize:
        settingsStore.business_settings.printer.delivery_ticket_font_size,
      col: [
        {
          header: "CANT.",
          dataKey: "amount",
        },
        {
          header: "U.M",
          dataKey: "unit",
        },

        {
          header: "DESCRIPCIÓN",
          dataKey: "description",
        },
        {
          header: "P.U",
          dataKey: "price",
        },

        {
          header: "TOTAL",
          dataKey: "total",
        },
      ],
      dat: !props.data.by_consumption
        ? dataForPrint.items.map((val) => {
            return {
              amount: val.cantidad,
              unit: val.unidad_de_medida,
              description: val.descripcion,
              price: parseFloat(val.precio_unitario).toFixed("2"),
              total: parseFloat(val.total_item).toFixed("2"),
            };
          })
        : [
            {
              amount: 1,
              description: "POR CONSUMO DE ALIMENTOS",
              total: dataForPrint.totales.total_venta.toFixed("2"),
            },
          ],
    },
    {
      dat: [
        {
          tittle: "TOTAL",
          twoPoints: ":",
          cont: dataForPrint.totales.total_venta.toFixed("2"),
        },
      ],
      fontSize:
        settingsStore.business_settings.printer.delivery_ticket_font_size,
      line: true,
    },
    {
      dat: [
        [
          {
            content: `REPARTIDOR: ${props.data.delivery_info.deliveryman}`,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize:
                settingsStore.business_settings.printer
                  .delivery_ticket_font_size,
            },
          },
        ],
      ],
    },
  ];

  CreatePdfFile({
    show: true,
    data: structure,
  });
};

export default printDeliveryInfo;
