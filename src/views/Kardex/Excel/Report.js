import ExcelJS from "exceljs";
import saveAs from "file-saver";

export const generateExcel = (header, columns, data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("sheet");
  // worksheet.columns = columns;
  // worksheet.addRows(data);

  //Cabezera del reporte
  worksheet.mergeCells("B3:I3");
  worksheet.getCell("B3").value = header.title;
  worksheet.getCell("B3").alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  // let date = Date.now();
  // let datestart = new Date(date).toLocaleString();

  worksheet.mergeCells("B5:C5");
  worksheet.getCell("B5").value = "Producto : " + header.description;
  // worksheet.getCell("E3").value = "Fecha Reporte : " + datestart;

  // worksheet.mergeCells("B4:C4");
  // worksheet.getCell("B4").value = "Fecha de Inicio : " + header.startdate;
  // worksheet.getCell("E4").value = "Fecha de Final : " + header.enddate;

  // worksheet.mergeCells("B5:C5");
  // worksheet.getCell("B5").value = "Material : " + header.material;

  // worksheet.mergeCells("B6:C6");
  // worksheet.getCell("B6").value = "Entrada : " + header.ingress;
  // worksheet.getCell("E6").value = "Salidas : " + header.egress;
  // worksheet.getCell("G6").value = "Stock Actual : " + header.total;

  //Tabla de datos
  columns.forEach(function (c, i) {
    //Pintar columnas
    worksheet.getCell(c["col"] + 8).value = c["header"];
    worksheet.getCell(c["col"] + 8).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "34C5A1" },
    };
    worksheet.getCell(c["col"] + 8).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getColumn(c["col"]).width = c["width"];

    let col = c["key"];
    //Pintar Datos
    data.forEach(function (d, i) {
      worksheet.getCell(c["col"] + (i + 9)).value = d[col];
      worksheet.getCell(c["col"] + (i + 9)).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell(c["col"] + (i + 9)).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  workbook.xlsx.writeBuffer().then((data) => {
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
    });
    saveAs(blob, "reporteExcel.xlsx");
  });
};
