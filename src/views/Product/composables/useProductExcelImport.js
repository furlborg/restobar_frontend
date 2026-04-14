import { computed, ref } from "vue";
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import { useMessage } from "naive-ui";
import { createProduct } from "@/api/modules/products";
import { getBranchs } from "@/api/modules/business";
import { getMeasureUnit } from "@/api/modules/supplies";
import { useProductStore } from "@/store/modules/product";
import { useUserStore } from "@/store/modules/user";

const HEADER_ALIASES = {
  code: ["codigo"],
  name: ["nombre"],
  prices: ["precio venta"],
  purchase_price: ["precio compra"],
  category: ["categoria"],
  preparation_place: ["lugar preparacion"],
  measure_unit: ["unidad de medida", "uniudad de medida"],
  affectation: ["afectacion"],
  igv_tax: ["igv"],
  stock: ["stock inicial"],
  control_stock: ["controlarstock", "controlar stock"],
  quick_indications: ["indicacionesrapidas", "indicaciones rapidas"],
};

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .trim();

const getCellText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text;
    }

    if (Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text).join("");
    }

    if (value.result !== undefined && value.result !== null) {
      return String(value.result);
    }
  }

  return String(value).trim();
};

const parseDecimal = (value) => {
  const text = getCellText(value).replace(/,/g, ".");
  if (!text) {
    return null;
  }

  const numericValue = Number(text);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value);
  if (["1", "TRUE", "SI", "S", "YES", "Y", "X"].includes(normalized)) {
    return true;
  }

  if (["0", "FALSE", "NO", "N"].includes(normalized)) {
    return false;
  }

  return Boolean(normalized);
};

const normalizeIgv = (value) => {
  const numericValue = parseDecimal(value);
  if (numericValue === null) {
    return 0;
  }

  return numericValue > 1 ? numericValue / 100 : numericValue;
};

const resolveByIdOrLabel = (collection, rawValue, labelKeys = ["description", "name"]) => {
  if (!Array.isArray(collection) || rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const rawText = getCellText(rawValue);
  const rawNumeric = Number(rawText);

  if (!Number.isNaN(rawNumeric)) {
    const byId = collection.find((item) => Number(item.id) === rawNumeric);
    if (byId) {
      return byId.id;
    }
  }

  const normalizedRaw = normalizeText(rawText);
  const match = collection.find((item) =>
    labelKeys.some((key) => normalizeText(item?.[key]) === normalizedRaw),
  );

  return match ? match.id : null;
};

const resolveHeaderMap = (headerRow) => {
  const map = new Map();

  headerRow.eachCell((cell, columnNumber) => {
    const normalizedHeader = normalizeText(getCellText(cell.value));
    if (normalizedHeader) {
      map.set(normalizedHeader, columnNumber);
    }
  });

  return map;
};

const getHeaderColumn = (headerMap, aliases) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    if (headerMap.has(normalizedAlias)) {
      return headerMap.get(normalizedAlias);
    }
  }

  return null;
};

const normalizeSourceRows = (worksheet, headerMap) => {
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const source = {};
    let hasData = false;

    Object.entries(HEADER_ALIASES).forEach(([key, aliases]) => {
      const columnNumber = getHeaderColumn(headerMap, aliases);
      if (columnNumber) {
        const cellValue = row.getCell(columnNumber).value;
        const normalizedValue = getCellText(cellValue);
        source[key] = normalizedValue;
        if (normalizedValue !== "") {
          hasData = true;
        }
      }
    });

    if (hasData) {
      rows.push({ rowNumber, source });
    }
  });

  return rows;
};

const buildProductPayload = ({ source, productStore, measureUnits }) => {
  const errors = [];

  const code = getCellText(source.code);
  const name = getCellText(source.name);
  const prices = parseDecimal(source.prices);
  const purchasePrice = parseDecimal(source.purchase_price) ?? 0;
  const category = resolveByIdOrLabel(productStore.categories, source.category);
  const preparationPlace = resolveByIdOrLabel(productStore.places, source.preparation_place);
  const measureUnit = resolveByIdOrLabel(measureUnits, source.measure_unit);
  const affectation = resolveByIdOrLabel(productStore.affectations, source.affectation);
  const igvTax = normalizeIgv(source.igv_tax);
  const controlStock = parseBoolean(source.control_stock);
  const stock = parseDecimal(source.stock);
  const quickIndications = getCellText(source.quick_indications);

  if (!code) errors.push("Código requerido");
  if (!name) errors.push("Nombre requerido");
  if (prices === null) errors.push("Precio de venta inválido");
  if (category === null) errors.push("Categoría no encontrada");
  if (measureUnit === null) errors.push("Unidad de medida no encontrada");
  if (affectation === null) errors.push("Afectación no encontrada");

  if (controlStock && (stock === null || stock <= 0)) {
    errors.push("Stock inicial debe ser mayor a 0 cuando se controla stock");
  }

  if (prices !== null && prices < 0) {
    errors.push("Precio de venta no puede ser negativo");
  }

  if (purchasePrice !== null && purchasePrice < 0) {
    errors.push("Precio de compra no puede ser negativo");
  }

  return {
    isValid: errors.length === 0,
    errors,
    payload: {
      code,
      name,
      prices,
      purchase_price: purchasePrice,
      category,
      preparation_place: preparationPlace,
      measure_unit: measureUnit,
      affectation,
      igv_tax: igvTax,
      stock: controlStock ? stock : "",
      control_stock: controlStock,
      quick_indications: quickIndications,
      control_supplie: false,
      icbper: false,
      supplies: [],
    },
  };
};

export function useProductExcelImport() {
  const message = useMessage();
  const productStore = useProductStore();
  const userStore = useUserStore();

  const isParsing = ref(false);
  const isImporting = ref(false);
  const selectedFile = ref(null);
  const fileList = ref([]);
  const branchOptions = ref([]);
  const selectedBranchOffice = ref(null);
  const measureUnits = ref([]);
  const parsedRows = ref([]);
  const importResults = ref({
    total: 0,
    valid: 0,
    imported: 0,
    failed: 0,
    skipped: 0,
    details: [],
  });
  const progress = ref(0);

  const validRows = computed(() => parsedRows.value.filter((row) => row.isValid));
  const invalidRows = computed(() => parsedRows.value.filter((row) => !row.isValid));

  const ensureReferenceData = async () => {
    if (
      !Array.isArray(productStore.categories) ||
      productStore.categories.length === 0 ||
      !Array.isArray(productStore.places) ||
      productStore.places.length === 0 ||
      !Array.isArray(productStore.affectations) ||
      productStore.affectations.length === 0
    ) {
      await productStore.initializeStore();
    }

    if (!measureUnits.value.length) {
      const response = await getMeasureUnit();
      measureUnits.value = Array.isArray(response.data) ? response.data : [];
    }

    if (!branchOptions.value.length) {
      const response = await getBranchs();
      const options = [];

      response.data.forEach((branch) => {
        if (userStore.user.branchoffice === null || userStore.user.role === "ADMINISTRADOR") {
          options.push({ label: branch.description, value: branch.id });
        } else if (userStore.user.branchoffice === branch.id) {
          options.push({ label: branch.description, value: branch.id });
        }
      });

      branchOptions.value = options;
      if (!selectedBranchOffice.value && options.length > 0) {
        selectedBranchOffice.value = options[0].value;
      }
    }
  };

  const resetImportState = () => {
    selectedFile.value = null;
    fileList.value = [];
    parsedRows.value = [];
    importResults.value = {
      total: 0,
      valid: 0,
      imported: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };
    progress.value = 0;
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Productos");

    worksheet.columns = [
      { header: "CODIGO", key: "code", width: 18 },
      { header: "NOMBRE", key: "name", width: 30 },
      { header: "PRECIO VENTA", key: "prices", width: 14 },
      { header: "PRECIO COMPRA", key: "purchase_price", width: 14 },
      { header: "CATEGORIA", key: "category", width: 22 },
      { header: "LUGAR PREPARACION", key: "preparation_place", width: 24 },
      { header: "UNIDAD DE MEDIDA", key: "measure_unit", width: 22 },
      { header: "AFECTACION", key: "affectation", width: 18 },
      { header: "IGV", key: "igv_tax", width: 10 },
      { header: "STOCK INICIAL", key: "stock", width: 14 },
      { header: "CONTROLARSTOCK", key: "control_stock", width: 16 },
      { header: "INDICACIONESRAPIDAS", key: "quick_indications", width: 26 },
    ];

    worksheet.addRow({
      code: "PRO-001",
      name: "PRODUCTO DE EJEMPLO",
      prices: 12.5,
      purchase_price: 8.2,
      category: "BEBIDAS",
      preparation_place: "BAR",
      measure_unit: "UND",
      affectation: "GRAVADO - OPERACIÓN ONEROSA",
      igv_tax: 18,
      stock: 10,
      control_stock: "SI",
      quick_indications: "SIN HIELO",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
    });

    saveAs(blob, "plantilla_productos.xlsx");
  };

  const parseFile = async (file) => {
    if (!file) {
      return;
    }

    isParsing.value = true;
    try {
      await ensureReferenceData();

      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        message.error("El archivo Excel no contiene hojas válidas.");
        resetImportState();
        return;
      }

      const headerMap = resolveHeaderMap(worksheet.getRow(1));
      const sourceRows = normalizeSourceRows(worksheet, headerMap);

      parsedRows.value = sourceRows.map(({ rowNumber, source }) => {
        const result = buildProductPayload({
          source,
          productStore,
          measureUnits: measureUnits.value,
        });

        return {
          rowNumber,
          source,
          ...result,
        };
      });

      importResults.value = {
        total: parsedRows.value.length,
        valid: validRows.value.length,
        imported: 0,
        failed: 0,
        skipped: invalidRows.value.length,
        details: [],
      };

      if (parsedRows.value.length === 0) {
        message.warning("No se encontraron filas con datos en el Excel.");
      } else if (validRows.value.length === 0) {
        message.warning("No hay filas válidas para importar.");
      }
    } catch (error) {
      console.error(error);
      message.error("No se pudo leer el archivo Excel.");
      resetImportState();
    } finally {
      isParsing.value = false;
    }
  };

  const onFileChange = ({ file, fileList: nextFileList }) => {
    fileList.value = nextFileList.slice(0, 1);
    selectedFile.value = file?.file || null;

    if (selectedFile.value) {
      parseFile(selectedFile.value);
    } else {
      resetImportState();
    }
  };

  const importRows = async () => {
    if (!selectedBranchOffice.value) {
      message.warning("Debes seleccionar una sucursal para importar.");
      return { success: false };
    }

    if (!validRows.value.length) {
      message.warning("No hay filas válidas para procesar.");
      return { success: false };
    }

    isImporting.value = true;
    progress.value = 0;
    const details = [];
    let imported = 0;
    let failed = 0;

    try {
      for (let index = 0; index < validRows.value.length; index += 1) {
        const row = validRows.value[index];
        try {
          const response = await createProduct({
            ...row.payload,
            branchoffice: selectedBranchOffice.value,
          });

          if (response.status === 201) {
            imported += 1;
            details.push({
              rowNumber: row.rowNumber,
              status: "success",
              message: "Producto creado",
            });
          } else {
            failed += 1;
            details.push({
              rowNumber: row.rowNumber,
              status: "error",
              message: `Respuesta inesperada (${response.status})`,
            });
          }
        } catch (error) {
          failed += 1;
          details.push({
            rowNumber: row.rowNumber,
            status: "error",
            message: error?.response?.data?.detail || "No se pudo crear el producto",
          });
        }

        progress.value = Math.round(((index + 1) / validRows.value.length) * 100);
      }

      importResults.value = {
        total: parsedRows.value.length,
        valid: validRows.value.length,
        imported,
        failed,
        skipped: invalidRows.value.length,
        details,
      };

      if (imported > 0) {
        message.success(`Importación finalizada: ${imported} producto(s) creado(s).`);
      }

      if (failed > 0) {
        message.warning(`Hubo ${failed} producto(s) que no pudieron crearse.`);
      }

      return { success: failed === 0, imported, failed, details };
    } finally {
      isImporting.value = false;
    }
  };

  const onSelectBranchOffice = (value) => {
    selectedBranchOffice.value = value;
  };

  return {
    branchOptions,
    selectedBranchOffice,
    fileList,
    importResults,
    invalidRows,
    isImporting,
    isParsing,
    parsedRows,
    progress,
    selectedFile,
    validRows,
    downloadTemplate,
    ensureReferenceData,
    importRows,
    onFileChange,
    onSelectBranchOffice,
    resetImportState,
  };
}