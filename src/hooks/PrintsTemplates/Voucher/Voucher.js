import { CreatePdfFile } from "@/hooks/CreatePdfFile.js";
import { numeroALetras } from "@/hooks/numberText.js";

const VoucherPrint = (props) => {
  let dataForPrint = JSON.parse(props.data.json_sale);

  let typeDoc = dataForPrint.serie_documento.split("");

  let dataSunat = `${props.businessStore.business.ruc}|${dataForPrint.serie_documento}|${dataForPrint.totales.total_igv}|${dataForPrint.hora_de_EMISIÓN}|${dataForPrint.datos_del_cliente_o_receptor.numero_documento}|${dataForPrint.numero_documento}|${dataForPrint.totales.total_venta}|${dataForPrint.datos_del_cliente_o_receptor.codigo_tipo_documento_identidad}|`;

  let NoNoteSale = false;

  if (typeDoc[0] === "F") {
    typeDoc = "FACTURA ELECTRONICA";
    NoNoteSale = true;
  }

  if (typeDoc[0] === "B") {
    typeDoc = "BOLETA ELECTRONICA";
    NoNoteSale = true;
  }

  if (typeDoc[0] === "N") {
    typeDoc = "NOTA DE VENTA";
    NoNoteSale = false;
  }

  let datTotals = [];

  let subtotal = 0;

  dataForPrint.items.map((val) => {
    subtotal += val.cantidad * parseFloat(val.precio_unitario);
  });

  let newTotal = NoNoteSale
    ? {
        SUBTOTAL: subtotal.toFixed("2"),
        EFECTIVO: props.data.given_amount,
        VUELTO: props.changing.toFixed(2),
        "OP.GRAVADA":
          dataForPrint.totales.total_operaciones_gravadas.toFixed("2"),
        "OP.EXONERADA":
          dataForPrint.totales.total_operaciones_exoneradas.toFixed("2"),
        "OP.GRATUITAS":
          dataForPrint.totales.total_operaciones_gratuitas.toFixed("2"),
        "IGV(18%)": dataForPrint.totales.total_igv.toFixed("2"),
        ICPER: dataForPrint.totales.total_impuestos_bolsa_plastica.toFixed("2"),
        DESCUENTOS: !!props.data.discount
          ? parseFloat(props.data.discount).toFixed("2")
          : "0.00",
        "IMPORTE TOTAL": dataForPrint.totales.total_venta.toFixed("2"),
      }
    : {
        "IMPORTE TOTAL": dataForPrint.totales.total_venta.toFixed("2"),
        ICPER: dataForPrint.totales.total_impuestos_bolsa_plastica.toFixed("2"),
      };
  for (let i in newTotal) {
    if (!!parseFloat(newTotal[i])) {
      datTotals.push({
        tittle: i,
        twoPoints: ":",
        cont: newTotal[i],
      });
    }

    if (i === "IGV(18%)") {
      datTotals.push({
        tittle: i,
        twoPoints: ":",
        cont: newTotal[i],
      });
    }
  }

  let structure = [
    {
      dat: [
        [
          {
            content: props.businessStore.business.commercial_name,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 10,
            },
          },
        ],
        [
          {
            content: props.businessStore.business.ruc,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 10,
            },
          },
        ],
        [
          {
            content: props.businessStore.business.fiscal_address,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],
        [
          {
            content: props.businessStore.business.phone,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 7,
            },
          },
        ],
        [
          {
            content: typeDoc,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],

        [
          {
            content: `${dataForPrint.serie_documento}-${dataForPrint.numero_documento}`,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 10,
            },
          },
        ],
      ],
    },

    {
      dat: [
        {
          tittle: "CLIENTE",
          twoPoints: ":",
          cont: dataForPrint.datos_del_cliente_o_receptor
            .apellidos_y_nombres_o_razon_social,
        },

        {
          tittle: typeDoc[0] === "F" ? "RUC" : "DOCUMENTO",
          twoPoints: ":",
          cont: dataForPrint.datos_del_cliente_o_receptor.numero_documento,
        },

        {
          tittle: "DIRECCION",
          twoPoints: ":",
          cont: dataForPrint.datos_del_cliente_o_receptor.direccion,
        },

        {
          tittle: "F.EMISIÓN",
          twoPoints: ":",
          cont: `${dataForPrint.fecha_de_emision} ${dataForPrint.hora_de_emision}`,
        },
      ],
      line: true,
    },
    {
      col: [
        {
          header: "CANT.",
          dataKey: "amount",
        },

        {
          header: "DESCRIPCIÓN",
          dataKey: "description",
        },
        !props.data.by_consumption && {
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
      line: true,
    },
    {
      dat: datTotals,
      line: true,
    },

    NoNoteSale && {
      line: true,
      dat: [
        [
          {
            content:
              "SON:" +
              numeroALetras(
                dataForPrint.totales.total_venta.toFixed("2"),
                "SOLES"
              ),
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],
        [
          {
            content: "Representacion impresa del comprobante electronico",
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],
        !!props.businessStore.business.website && [
          {
            content: `Puede verificarla usando su clave sol o ingresando a la pagina web: ${props.businessStore.business.website}`,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],
        !!props.businessStore.business.email && [
          {
            content: props.businessStore.business.email,
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],
        [
          {
            content:
              "BIENES TRANSFERIDOS / SERVICIOS PRESTADOS EN LA AMAZONIA PARA SER CONSUMIDOS EN LA MISMA",
            styles: {
              fontStyle: "bold",
              halign: "center",
              fontSize: 8,
            },
          },
        ],
      ],
    },

    {
      line: true,
      dat: [
        {
          tittle: "USUARIO",
          twoPoints: ":",
          cont: props.data.username,
        },
        {
          tittle: "TIPO DE PAGO",
          twoPoints: ":",
          cont: props.saleStore.getPaymentMethodDescription(
            props.data.payment_method
          ),
        },
      ],
    },
  ];

  CreatePdfFile({
    show: true,
    data: structure,
    objSunat: dataSunat,
    addImages: true,
  });
};

export default VoucherPrint;
