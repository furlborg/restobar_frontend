import { h } from "vue";
import {
  NButton,
  NTag,
  NPopover,
  NDropdown,
  NText,
  NSpace,
  NPopselect,
} from "naive-ui";
import { renderIcon, lighten } from "@/utils";
import { useUserStore } from "@/store/modules/user";
import { useSaleStore } from "@/store/modules/sale";
import { useTillStore } from "@/store/modules/till";
import { useGenericsStore } from "@/store/modules/generics";
import { useSettingsStore } from "@/store/modules/settings";
import { useTableStore } from "@/store/modules/table";

const userStore = useUserStore();

const tillStore = useTillStore();

const saleStore = useSaleStore();

const tableStore = useTableStore();

const genericsStore = useGenericsStore();

const settingsStore = useSettingsStore();

export const businessRules = {
  ruc: {
    required: true,
    trigger: ["blur", "input"],
    message: "RUC requeridos",
  },
  name: {
    required: true,
    trigger: ["blur", "input"],
    message: "Nombre requerido",
  },
  commercial_name: {
    required: true,
    trigger: ["blur", "input"],
    message: "Nombre comercial requerido",
  },
  fiscal_address: {
    required: true,
    trigger: ["blur", "input"],
    message: "Dirección requerido",
  },
  legal_representative: {
    required: true,
    trigger: ["blur", "input"],
    message: "Representante requerido",
  },
};

export const branchOfficeRules = {
  description: {
    required: true,
    trigger: ["blur", "input"],
    message: "RUC requeridos",
  },
  ubigeo: {
    required: true,
    trigger: ["blur", "input"],
    message: "Nombre requerido",
  },
  commercial_address: {
    required: true,
    trigger: ["blur", "input"],
    message: "Nombre comercial requerido",
  },
};

export const getDocTypeByNumber = (v) => {
  switch (v) {
    case "0":
      return "SIN DOCUMENTO";
    case "1":
      return "L.E / DNI";
    case "4":
      return "CARNET EXT.";
    case "6":
      return "RUC";
    case "7":
      return "PASAPORTE";
    default:
      console.error("Error: Tipo de Documento inválido");
      break;
  }
};

export const documentOptions = [
  {
    label: "SIN DOCUMENTO",
    value: "0",
  },
  {
    label: "L.E / DNI",
    value: "1",
  },
  {
    label: "CARNET EXT.",
    value: "4",
  },
  {
    label: "RUC",
    value: "6",
  },
  {
    label: "PASAPORTE",
    value: "7",
  },
];

export const measureUnitOptions = [
  {
    label: "UND",
    value: "1",
  },
  {
    label: "SERV",
    value: "2",
  },
];

export const getmeasureUnitByNumber = (v) => {
  switch (v) {
    case "1":
      return "UND";
    case "2":
      return "SERV";
    default:
      console.error("Error: Unidad de medida inválido");
      break;
  }
};

export const getSaleDocumentByNumber = (v) => {
  switch (v) {
    case "1":
      return "FACTURA ELECTRÓNICA";
    case "3":
      return "BOLETA DE VENTA ELECTRÓNICA";
    /* case "7":
            return 'NOTA DE CRÉDITO'
        case "8":
            return 'NOTA DE DÉBITO' */
    case "80":
      return "NOTA DE VENTA";
    default:
      console.error("Error: Tipo de Documento inválido");
      break;
  }
};

export const saleDocumentOptions = [
  {
    label: "FACTURA ELECTRÓNICA",
    value: "1",
  },
  {
    label: "BOLETA DE VENTA ELECTRÓNICA",
    value: "3",
  },
  /* {
        label: 'NOTA DE CRÉDITO',
        value: "7"
    },
    {
        label: 'NOTA DE DÉBITO',
        value: "8"
    }, */
  {
    label: "NOTA DE VENTA",
    value: "80",
  },
];

export const createCustomerColumns = ({ editCustomer, deleteCustomer }) => {
  return [
    {
      title: "ID",
      key: "id",
      align: "center",
      width: 50,
    },
    {
      title: "Documento",
      key: "doc_num",
      align: "center",
      width: 150,
    },
    {
      title: "Tipo",
      key: "doc_type",
      align: "center",
      width: 100,
      render(row) {
        return getDocTypeByNumber(row.doc_type);
      },
    },
    {
      title: "Nombre",
      key: "names",
      align: "center",
      width: 300,
    },
    {
      title: "Dirección",
      key: "addresses",
      align: "center",
      width: 200,
      render(row) {
        if (row.addresses.length > 0) {
          return !row.addresses[0].description
            ? "-----"
            : row.addresses[0].description;
        }
        return "-----";
      },
    },
    {
      title: "Género",
      key: "gender",
      align: "center",
      width: 100,
    },
    {
      title: "F. Nacimiento",
      key: "birthdate",
      align: "center",
      width: 125,
    },
    {
      title: "Celular",
      key: "phone",
      align: "center",
      width: 150,
    },
    {
      title: "Correo",
      key: "email",
      align: "center",
      width: 200,
    },
    {
      title: "Estado",
      key: "is_disabled",
      align: "center",
      width: 100,
      render(row) {
        let type, text;
        if (row.is_disabled) {
          type = "error";
          text = "Inactivo";
        } else {
          type = "success";
          text = "Activo";
        }

        return h(
          NTag,
          {
            size: "small",
            type: type,
            round: true,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      width: 150,
      render(row) {
        return [
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "warning",
              secondary: true,
              disabled: !userStore.hasPermission("change_customer"),
              onClick: () => editCustomer(row),
            },
            renderIcon("la-user-edit-solid")
          ),
          h(
            NButton,
            {
              size: "small",
              type: row.is_disabled ? "success" : "error",
              secondary: true,
              disabled: !userStore.hasPermission("delete_customer"),
              onClick: () => deleteCustomer(row),
            },
            row.is_disabled
              ? renderIcon("la-user-check-solid")
              : renderIcon("la-user-times-solid")
          ),
        ];
      },
    },
  ];
};

export const customerRules = {
  names: {
    required: true,
    trigger: ["blur", "input"],
    message: "Nombres requeridos",
  },
  doc_type: {
    required: true,
    trigger: ["blur", "change"],
    message: "Tipo documento requerido",
  },
  doc_num: {
    required: true,
    trigger: ["blur", "input"],
    message: "Número documento requerido",
  },
};

export const productRules = {
  name: {
    required: true,
    trigger: ["blur", "input"],
    message: "Nombre requeridos",
  },
  prices: {
    required: true,
    trigger: ["blur", "input"],
    message: "Precio requerido",
  },
  purchase_price: {
    required: true,
    trigger: ["blur", "input"],
    message: "Precio requerido",
  },
  category: {
    type: "number",
    required: true,
    trigger: ["blur", "input"],
    message: "Categoría requerido",
  },
};

export const createUserColumns = ({
  editUser,
  changePermissions,
  deleteUser,
  changePassword,
}) => {
  return [
    {
      title: "#",
      key: "num",
      width: 50,
      render(row, index) {
        return index + 1;
      },
    },
    {
      title: "DNI",
      key: "dni",
    },
    {
      title: "Nombres",
      key: "names",
    },
    {
      title: "Correo",
      key: "email",
    },
    {
      title: "Perfil",
      key: "role",
    },
    {
      title: "Sucursal",
      key: "branchoffice_des",
    },
    {
      title: "Estado",
      render(row) {
        let type, text;
        if (row.is_active) {
          type = "success";
          text = "Activo";
        } else {
          type = "error";
          text = "Inactivo";
        }

        return h(
          NTag,
          {
            size: "small",
            type: type,
            round: true,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: 200,
      render(row) {
        return [
          userStore.hasPermission("change_user") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "warning",
                secondary: true,
                onClick: () => editUser(row),
              },
              renderIcon("la-user-edit-solid")
            ),
          userStore.hasPermission("change_permissions") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                color: "#8a2be2",
                type: "primary",
                secondary: true,
                onClick: () => changePermissions(row),
              },
              renderIcon("md-factcheck-twotone")
            ),
          userStore.hasPermission("change_passwords") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "info",
                secondary: true,
                onClick: () => changePassword(row),
              },
              renderIcon("ri-rotate-lock-fill")
            ),
          userStore.hasPermission("delete_user") &&
            h(
              NButton,
              {
                size: "small",
                type: row.is_active ? "error" : "success",
                secondary: true,
                onClick: () => deleteUser(row),
              },
              renderIcon("la-user-slash-solid")
            ),
        ];
      },
    },
  ];
};

export const createTillColumns = ({
  viewDetails,
  makeTillReport,
  makeSimpleTillReport,
  makeSaleReport,
  makeMethodsReport,
  makeAreaKardexReport,
  requestExcel,
  sendReportMail,
  closeTill,
}) => {
  return [
    /* {
            title: 'Usuario',
            key: 'user'
        },
        {
            title: 'Sucursal',
            key: 'branch'
        }, */
    {
      title: "Responsable Apertura",
      key: "opening_responsable",
      width: 160,
      render(row) {
        return !row.opening_responsable ? "-----" : row.opening_responsable;
      },
    },
    {
      title: "Apertura",
      key: "created",
      align: "center",
      width: 200,
      render(row) {
        return !row.created ? "--/--/---- --:--:--" : row.created;
      },
    },
    {
      title: "Saldo inicial",
      key: "opening_amount",
      align: "center",
      width: 100,
      render(row) {
        return !row.opening_amount ? "S/. --.--" : `S/. ${row.opening_amount}`;
      },
    },
    {
      title: "Responsable Cierre",
      key: "closing_responsable",
      align: "center",
      width: 100,
      render(row) {
        return !row.closing_responsable ? "-----" : row.closing_responsable;
      },
    },
    {
      title: "Cierre",
      key: "modified",
      align: "center",
      width: 200,
      render(row) {
        return row.modified === row.created
          ? "--/--/---- --:--:--"
          : row.modified;
      },
    },
    {
      title: "Saldo final",
      key: "closing_amount",
      align: "center",
      width: 100,
      render(row) {
        return !row.closing_amount ? "S/. --.--" : `S/. ${row.closing_amount}`;
      },
    },
    {
      title: "Estado",
      key: "status",
      align: "center",
      width: 100,
      render(row) {
        let type, text;
        if (row.status === true) {
          type = "success";
          text = "Abierto";
        } else if (row.status === false) {
          type = "error";
          text = "Cerrado";
        }

        return h(
          NTag,
          {
            size: "small",
            type: type,
            round: true,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      width: 150,
      render(row) {
        return [
          !row.status &&
            userStore.hasPermission("view_tilldetails") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "info",
                secondary: true,
                onClick: () => viewDetails(row),
              },
              renderIcon("bi-eye")
            ),
          !row.status &&
            h(
              NDropdown,
              {
                trigger: "click",
                options: [
                  {
                    label: "Imprimir",
                    key: 1,
                    disabled: !userStore.hasPermission("make_ticket_report"),
                    children: [
                      {
                        key: 11,
                        label: "Reporte de caja",
                      },
                      {
                        key: 12,
                        label: "Reporte simple de caja",
                      },
                      {
                        key: 13,
                        label: "Reporte de ventas",
                      },
                      {
                        key: 14,
                        label: "Reporte por método de pago",
                      },
                      {
                        key: 15,
                        label: "Productos por Area",
                      },
                    ],
                  },
                  {
                    label: "Excel",
                    key: 2,
                    disabled: !userStore.hasPermission("make_excel_report"),
                    children: [
                      {
                        key: 21,
                        label: "Caja",
                        children: [
                          {
                            label: "Movimientos",
                            key: 211,
                          },
                          {
                            label: "Ingresos",
                            key: 212,
                          },
                          {
                            label: "Egresos",
                            key: 213,
                          },
                        ],
                      },
                      {
                        key: 22,
                        label: "Pedidos",
                        children: [
                          {
                            label: "General",
                            key: 221,
                          },
                          {
                            label: "Usuarios",
                            key: 222,
                          },
                        ],
                      },
                      {
                        label: "Ventas",
                        key: 23,
                        children: [
                          {
                            label: "Ventas",
                            key: 231,
                          },
                          {
                            label: "Productos",
                            key: 232,
                          },
                          {
                            label: "Categorías",
                            key: 233,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: "divider",
                    key: "d1",
                  },
                  {
                    label: "Enviar al correo",
                    key: 3,
                  },
                ],
                onSelect: (key) => {
                  switch (key) {
                    case 11:
                      makeTillReport(row);
                      break;
                    case 12:
                      makeSimpleTillReport(row);
                      break;
                    case 13:
                      makeSaleReport(row);
                      break;
                    case 14:
                      makeMethodsReport(row);
                      break;
                    case 15:
                      makeAreaKardexReport(row);
                      break;
                    case 211:
                      requestExcel(row.id, "details", "Movimientos");
                      break;
                    case 212:
                      requestExcel(row.id, "income", "Ingresos");
                      break;
                    case 213:
                      requestExcel(row.id, "outcome", "Egresos");
                      break;
                    case 221:
                      requestExcel(row.id, "orders", "Pedidos");
                      break;
                    case 222:
                      requestExcel(row.id, "users_details", "Usuarios");
                      break;
                    case 231:
                      requestExcel(row.id, "sales", "Ventas");
                      break;
                    case 232:
                      requestExcel(row.id, "products", "Productos");
                      break;
                    case 233:
                      requestExcel(row.id, "categories", "Categorías");
                      break;
                    case 3:
                      sendReportMail(row);
                      break;
                    default:
                      console.error("Algo salió mal...");
                      break;
                  }
                },
              },
              {
                default: () =>
                  h(
                    NButton,
                    {
                      class: "me-2",
                      size: "small",
                      type: "warning",
                      secondary: true,
                    },
                    renderIcon("md-insertchart-outlined")
                  ),
              }
            ),
          /* h(
              NButton,
              {
                  class: 'me-2',
                  size: 'small',
                  type: 'warning',
                  secondary: true,
                  onClick: () => generateReport(row)
              },
              renderIcon('md-insertchart-outlined')
          ), */
          userStore.hasPermission("delete_till") &&
            h(
              NButton,
              {
                size: "small",
                type: "error",
                secondary: true,
                disabled: !row.status,
                onClick: () => closeTill(row),
              },
              renderIcon("md-lock-round")
            ),
        ];
      },
    },
  ];
};

export const movementRules = {
  description: {
    required: true,
    trigger: ["blur", "input"],
    message: "Este campo es requerido",
  },
  payment_method: {
    type: "number",
    required: true,
    trigger: ["blur", "input"],
    message: "Este campo es requerido",
  },
  amount: {
    type: "number",
    required: true,
    validator(rule, value) {
      if (!value) {
        return new Error("Monto requerido");
      }
      return true;
    },
    trigger: ["blur", "input"],
    message: "Monto requerido",
  },
  concept: {
    type: "number",
    required: true,
    trigger: ["blur", "input"],
    message: "Este campo es requerido",
  },
};

export const createMovementsColumns = ({
  hasSells,
  editMovement,
  deleteMovement,
}) => {
  const cols = [
    {
      title: "Documento",
      key: "document",
      align: "center",
      width: 100,
    },
    /* {
            title: 'Usuario',
            key: 'user'
        },
        {
            title: 'Sucursal',
            key: 'sucursal'
        }, */
    {
      title: "Descripción",
      key: "description",
      align: "center",
      width: 200,
    },
    {
      title: "Ingreso",
      key: "income",
      align: "center",
      width: 100,
      render(row) {
        let concept_type = tillStore.getConceptType(row.concept);
        return concept_type == "0" ? row.amount : "----";
      },
    },
    {
      title: "Egreso",
      key: "outcome",
      align: "center",
      width: 100,
      render(row) {
        let concept_type = tillStore.getConceptType(row.concept);
        return concept_type == "1" ? row.amount : "----";
      },
    },
    {
      title: "Concepto",
      key: "concept",
      align: "center",
      width: 225,
      render(row) {
        return tillStore.getConceptDescription(row.concept);
      },
    },
    {
      title: "Tipo",
      key: "concept_type",
      align: "center",
      width: 100,
      render(row) {
        let concept_type = tillStore.getConceptType(row.concept);

        return h(
          NTag,
          {
            size: "small",
            type: concept_type == "0" ? "success" : "error",
            round: true,
          },
          {
            default: () => (concept_type == "0" ? "INGRESO" : "EGRESO"),
          }
        );
      },
    },
    {
      title: "Fecha",
      key: "created",
      align: "center",
      width: 200,
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      width: 125,
      render(row) {
        return [
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "info",
              secondary: true,
              onClick: () => editMovement(row),
            },
            renderIcon("md-print-round")
          ),
          userStore.hasPermission("null_tilldetails")
            ? !(
                String(row.document).startsWith("B") ||
                String(row.document).startsWith("F") ||
                String(row.document).startsWith("N")
              )
              ? h(
                  NButton,
                  {
                    size: "small",
                    type: "error",
                    secondary: true,
                    disabled:
                      row.status ||
                      row.concept === 4 ||
                      row.concept === 5 ||
                      row.concept === 6 ||
                      row.concept === 7
                        ? true
                        : row.concept === 1 && hasSells(),
                    onClick: () => deleteMovement(row),
                  },
                  renderIcon("md-notinterested-round")
                )
              : null
            : null,
        ];
      },
    },
  ];
  if (!settingsStore.business_settings.till.closure_cash_total) {
    cols.splice(2, 0, {
      title: "Método Pago",
      key: "payment_method",
      align: "center",
      width: 200,
      render(row) {
        return saleStore.getPaymentMethodDescription(row.payment_method);
      },
    });
  }
  return cols;
};

export const createTillDetailsColumns = () => {
  return [
    {
      title: "Documento",
      key: "document",
      align: "center",
      width: 100,
    },
    /* {
            title: 'Usuario',
            key: 'user'
        },
        {
            title: 'Sucursal',
            key: 'sucursal'
        }, */
    {
      title: "Descripción",
      key: "description",
      align: "center",
      width: 200,
    },
    {
      title: "Método Pago",
      key: "payment_method",
      align: "center",
      width: 200,
      render(row) {
        return saleStore.getPaymentMethodDescription(row.payment_method);
      },
    },
    {
      title: "Ingreso",
      key: "income",
      align: "center",
      width: 100,
      render(row) {
        let concept_type = tillStore.getConceptType(row.concept);
        return concept_type == "0" ? row.amount : "----";
      },
    },
    {
      title: "Egreso",
      key: "outcome",
      align: "center",
      width: 100,
      render(row) {
        let concept_type = tillStore.getConceptType(row.concept);
        return concept_type == "1" ? row.amount : "----";
      },
    },
    {
      title: "Concepto",
      key: "concept",
      align: "center",
      width: 225,
      render(row) {
        return tillStore.getConceptDescription(row.concept);
      },
    },
    {
      title: "Tipo",
      key: "concept_type",
      align: "center",
      width: 100,
      render(row) {
        let concept_type = tillStore.getConceptType(row.concept);

        return h(
          NTag,
          {
            size: "small",
            type: concept_type == "0" ? "success" : "error",
            round: true,
          },
          {
            default: () => (concept_type == "0" ? "INGRESO" : "EGRESO"),
          }
        );
      },
    },
    {
      title: "Fecha",
      key: "created",
      align: "center",
      width: 200,
    },
  ];
};

export const createSuppliersColumns = ({ editSupplier, deleteSupplier }) => {
  return [
    {
      title: "#",
      key: "num",
      width: 50,
      render(row, index) {
        return index + 1;
      },
    },
    {
      title: "Documento",
      key: "document",
    },
    {
      title: "Nombres",
      key: "names",
    },
    {
      title: "Representante",
      key: "representative",
    },
    {
      title: "Email",
      key: "email",
    },
    {
      title: "Teléfono",
      key: "phone",
    },
    {
      title: "Estado",
      key: "state",
      render(row) {
        let type, text;
        if (row.state === true) {
          type = "success";
          text = "Activo";
        } else if (row.state === false) {
          type = "error";
          text = "Inactivo";
        }

        return h(
          NTag,
          {
            size: "small",
            type: type,
            round: true,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      render(row) {
        return [
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "warning",
              onClick: () => editSupplier(row),
            },
            renderIcon("la-user-edit-solid")
          ),
          h(
            NButton,
            {
              size: "small",
              type: row.state ? "error" : "success",
              onClick: () => deleteSupplier(row),
            },
            renderIcon("la-user-slash-solid")
          ),
        ];
      },
    },
  ];
};

export const createSuppliesColumns = ({ editSupplies, deleteSupplies }) => {
  return [
    {
      title: "#",
      key: "num",
      width: 50,
      render(row, index) {
        return index + 1;
      },
    },
    {
      title: "Nombres",
      key: "name",
    },
    {
      title: "Unidad medida",
      key: "measureunit_des",
    },
    {
      title: "Precio compra",
      key: "purchase_price",
      render(row) {
        return "S/." + row.purchase_price;
      },
    },
    {
      title: "Stock",
      align: "center",
      render(row) {
        return h(
          NPopover,
          { trigger: "click" },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  type: "success",
                  circle: true,
                },
                renderIcon("md-search-round")
              ),
            default: () =>
              h(
                NSpace,
                { vertical: true },
                {
                  default: () =>
                    row.amount.map((v) => {
                      return [h(NText, {}, { default: () => v.amount })];
                    }),
                }
              ),
          }
        );
      },
    },
    {
      title: "Estado",
      key: "state",
      render(row) {
        let type, text;
        if (row.state === true) {
          type = "success";
          text = "Activo";
        } else if (row.state === false) {
          type = "error";
          text = "Inactivo";
        }

        return h(
          NTag,
          {
            size: "small",
            type: type,
            round: true,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      render(row) {
        return [
          userStore.hasPermission("change_supplies") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "warning",
                secondary: true,
                onClick: () => editSupplies(row),
              },
              renderIcon("md-edit")
            ),
          userStore.hasPermission("delete_supplies") &&
            h(
              NButton,
              {
                size: "small",
                type: row.state ? "error" : "success",
                secondary: true,
                onClick: () => deleteSupplies(row),
              },
              renderIcon("md-delete")
            ),
        ];
      },
    },
  ];
};

export const createProductKardexColumns = () => {
  return [
    {
      title: "Código",
      key: "code",
      width: 150,
    },
    {
      title: "Producto/Insumo",
      key: "name",
      width: 250,
    },
    {
      title: "Stock",
      key: "amount",
      width: 150,
    },
  ];
};

export const createKardexBySupplyColumns = () => {
  return [
    {
      title: "",
      align: "center",
      width: 20,
      render(row, index) {
        return index + 1;
      },
    },
    {
      title: "Almacen",
      key: "branchoffice_des",
    },
    {
      title: "Fecha",
      key: "created",
      align: "center",
    },
    {
      title: "Concepto",
      key: "concept_des",
    },
    {
      title: "Documento",
      key: "document",
      align: "center",
    },
    {
      title: "Entrada",
      key: "ingress",
      align: "center",
    },
    {
      title: "Salida",
      key: "egress",
      align: "center",
      // render(row) {
      //     if (row.output) {
      //         return row.output
      //     } else {
      //         return '-'
      //     }
      // }
    },
    {
      title: "Stock",
      key: "balance",
      align: "center",
    },
  ];
};

export const saleRules = {
  customer: {
    type: "number",
    required: true,
    trigger: ["blur"],
    message: "Cliente es requerido",
  },
  delivery_info: null,
};

export const createSaleColumns = ({
  printSale,
  updateSale,
  sendSale,
  nullifySale,
}) => {
  return [
    {
      title: "#",
      key: "id",
    },
    {
      title: "Cliente",
      key: "customer",
    },
    {
      title: "Documento",
      key: "document",
      render(row) {
        return `${row.serie}-${row.number}`;
      },
    },
    {
      title: "Método Pago",
      key: "payment_method",
    },
    {
      title: "Monto",
      key: "amount",
      render(row) {
        return `S/. ${row.amount}`;
      },
    },
    {
      title: "Emisión",
      key: "date_sale",
    },
    {
      title: "Estado",
      key: "status",
      render(row) {
        let type, text;
        if (row.status === "N") {
          type = "info";
          text = "NUEVO";
        } else if (row.status === "E") {
          type = "success";
          text = "ENVIADO";
        } else if (row.status === "A") {
          type = "error";
          text = "ANULADO";
        } else if (row.status === "X") {
          type = "warning";
          text = "¡ERROR!";
        } else {
          type = "warning";
          text = "-";
        }

        return h(
          NPopover,
          {
            trigger: "hover",
            disabled: !row.null_reason,
          },
          {
            default: () => row.null_reason,
            trigger: () =>
              h(
                NTag,
                {
                  size: "small",
                  type: type,
                  round: true,
                },
                {
                  default: () => text,
                }
              ),
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: 250,
      render(row) {
        return [
          userStore.hasPermission("send_sale") && row.invoice_type !== "80"
            ? h(
                NButton,
                {
                  class: "me-2",
                  size: "small",
                  type: "info",
                  secondary: true,
                  disabled: row.status === "E" || row.status === "A",
                  onClick: () => sendSale(row),
                },
                renderIcon("ri-send-plane-fill")
              )
            : null,
          userStore.hasPermission("delete_sale") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "error",
                secondary: true,
                disabled:
                  row.invoice_type !== "80"
                    ? row.status !== "E"
                    : row.status === "A",
                onClick: () => nullifySale(row),
              },
              renderIcon("md-cancel-twotone")
            ),
          userStore.hasPermission("change_sale") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "info",
                secondary: true,
                disabled: row.status !== "A",
                onClick: () => updateSale(row),
              },
              renderIcon("gi-card-exchange")
            ),
          h(
            NButton,
            {
              size: "small",
              type: "warning",
              secondary: true,
              onClick: () => printSale(row),
            },
            renderIcon("md-print-round")
          ),
        ];
      },
    },
  ];
};
/* { printSale, miscSale, sendSale, nullifySale } */
export const createTillSalesColumns = () => {
  return [
    {
      title: "Cliente",
      key: "customer",
    },
    {
      title: "Documento",
      key: "document",
      render(row) {
        return `${row.serie}-${row.number}`;
      },
    },
    {
      title: "Método Pago",
      key: "payment_method",
    },
    {
      title: "Monto",
      key: "amount",
      render(row) {
        return `S/. ${row.amount}`;
      },
    },
    {
      title: "Emisión",
      key: "date_sale",
    },
    {
      title: "Estado",
      key: "status",
      render(row) {
        let type, text;
        if (row.status === "N") {
          type = "info";
          text = "NUEVO";
        } else if (row.status === "E") {
          type = "success";
          text = "ENVIADO";
        } else if (row.status === "A") {
          type = "error";
          text = "ANULADO";
        } else if (row.status === "X") {
          type = "warning";
          text = "¡ERROR!";
        } else {
          type = "warning";
          text = "-";
        }

        return h(
          NPopover,
          {
            trigger: "hover",
            disabled: !row.null_reason,
          },
          {
            default: () => row.null_reason,
            trigger: () =>
              h(
                NTag,
                {
                  size: "small",
                  type: type,
                  round: true,
                },
                {
                  default: () => text,
                }
              ),
          }
        );
      },
    } /* {
            title: 'Acciones',
            key: 'actions',
            width: 200,
            render(row) {
                return [
                    row.invoice_type !== "80" ? h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'info',
                            secondary: true,
                            disabled: row.status === 'E' || row.status === 'A',
                            onClick: () => sendSale(row)
                        },
                        renderIcon('ri-send-plane-fill')
                    ) : null,
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'error',
                            secondary: true,
                            disabled: row.status !== 'E',
                            onClick: () => nullifySale(row)
                        },
                        renderIcon('md-cancel-twotone')
                    ),
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            secondary: true,
                            onClick: () => printSale(row)
                        },
                        renderIcon('md-print-round')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'success',
                            secondary: true,
                            onClick: () => miscSale(row)
                        },
                        renderIcon('ri-mail-send-fill')
                    )
                ]
            }
        }, */,
  ];
};

export const createOrderColumns = ({
  showDetails,
  showDeliveryInfo,
  payDeliver,
  printOrder,
  nullifyOrder,
}) => {
  return [
    {
      title: "#",
      key: "id",
      width: "auto",
    },
    {
      title: "Cliente",
      key: "sale_customer",
      align: "center",
      width: genericsStore.device !== "desktop" ? 200 : "auto",
    },
    {
      title: "Usuario",
      key: "user",
      align: "center",
      width: genericsStore.device !== "desktop" ? 200 : "auto",
    },
    {
      title: "Monto",
      key: "initial_amount",
      align: "center",
      width: genericsStore.device !== "desktop" ? 100 : "auto",
      render(row) {
        return `S/. ${parseFloat(row.initial_amount).toFixed(2)}`;
      },
    },
    {
      title: "Fecha",
      key: "created",
      align: "center",
      width: genericsStore.device !== "desktop" ? 200 : "auto",
    },
    {
      title: "Mesa",
      key: "type",
      align: "center",
      width: genericsStore.device !== "desktop" ? 150 : "auto",
      render(row) {
        switch (row.order_type) {
          case "M":
            return tableStore.getTableByID(row.table).description;
          case "P":
            return "-";
          case "D":
            return "-";
          default:
            return "¡ERROR!";
        }
      },
    },
    {
      title: "Tipo",
      key: "type",
      align: "center",
      width: genericsStore.device !== "desktop" ? 150 : "auto",
      render(row) {
        let color, text;
        switch (row.order_type) {
          case "M":
            color = "#3B689F";
            text = "EN MESA";
            break;
          case "P":
            color = "#926ED7";
            text = "PARA LLEVAR";
            break;
          case "D":
            color = "#995C4E";
            text = "DELIVERY";
            break;
          default:
            color = "#D03050";
            text = "ERROR";
            break;
        }

        return h(
          NTag,
          {
            size: "small",
            color: {
              color: lighten(color, 48),
              textColor: color,
              borderColor: lighten(color, 24),
            },
            round: false,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Estado",
      key: "status",
      align: "center",
      width: genericsStore.device !== "desktop" ? 100 : "auto",
      render(row) {
        let type, text;
        switch (row.status) {
          case "1":
            type = "warning";
            text = "PENDIENTE";
            break;
          case "2":
            type = "success";
            text = "COBRADO";
            break;
          case "3":
            type = "error";
            text = "ANULADO";
            break;
          default:
            break;
        }

        return h(
          NPopover,
          {
            trigger: "hover",
            disabled: !row.null_reason,
          },
          {
            default: () => row.null_reason,
            trigger: () =>
              h(
                NTag,
                {
                  size: "small",
                  type: type,
                  round: true,
                },
                {
                  default: () => text,
                }
              ),
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: genericsStore.device !== "desktop" ? 250 : "auto",
      align: "center",
      render(row) {
        return [
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "info",
              secondary: true,
              onClick: () => showDetails(row),
            },
            renderIcon("md-feed-round")
          ),
          row.is_delivery
            ? h(
                NButton,
                {
                  class: "me-2",
                  size: "small",
                  type: "warning",
                  secondary: true,
                  onClick: () => showDeliveryInfo(row),
                },
                renderIcon("md-deliverydining-round")
              )
            : null,
          userStore.hasPermission("charge_order") && !row.table
            ? h(
                NButton,
                {
                  class: "me-2",
                  size: "small",
                  type: "success",
                  secondary: true,
                  disabled: row.status !== "1",
                  onClick: () => payDeliver(row),
                },
                renderIcon("fa-dollar-sign")
              )
            : null,
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "warning",
              secondary: true,
              onClick: () => printOrder(row),
            },
            renderIcon("md-print-round")
          ),
          userStore.hasPermission("delete_order") &&
            h(
              NButton,
              {
                class: "me-2",
                size: "small",
                type: "error",
                secondary: true,
                disabled: row.status !== "1",
                onClick: () => nullifyOrder(row),
              },
              renderIcon("md-cancel-twotone")
            ),
        ];
      },
    },
  ];
};

export const createTillOrderColumns = ({ showDetails, showDeliveryInfo }) => {
  return [
    {
      title: "#",
      key: "number",
      width: "auto",
      render(row, index) {
        return index + 1;
      },
    },
    {
      title: "Cliente",
      key: "sale_customer",
      align: "center",
      width: genericsStore.device !== "desktop" ? 200 : "auto",
    },
    {
      title: "Usuario",
      key: "user",
      align: "center",
      width: genericsStore.device !== "desktop" ? 200 : "auto",
    },
    {
      title: "Monto",
      key: "initial_amount",
      align: "center",
      width: genericsStore.device !== "desktop" ? 100 : "auto",
      render(row) {
        return `S/. ${parseFloat(row.initial_amount).toFixed(2)}`;
      },
    },
    {
      title: "Fecha",
      key: "created",
      align: "center",
      width: genericsStore.device !== "desktop" ? 200 : "auto",
    },
    {
      title: "Tipo",
      key: "type",
      align: "center",
      width: genericsStore.device !== "desktop" ? 150 : "auto",
      render(row) {
        let color, text;
        switch (row.order_type) {
          case "M":
            color = "#3B689F";
            text = "EN MESA";
            break;
          case "P":
            color = "#926ED7";
            text = "PARA LLEVAR";
            break;
          case "D":
            color = "#995C4E";
            text = "DELIVERY";
            break;
          default:
            color = "#D03050";
            text = "ERROR";
            break;
        }

        return h(
          NTag,
          {
            size: "small",
            color: {
              color: lighten(color, 48),
              textColor: color,
              borderColor: lighten(color, 24),
            },
            round: false,
          },
          {
            default: () => text,
          }
        );
      },
    },
    {
      title: "Estado",
      key: "status",
      align: "center",
      width: genericsStore.device !== "desktop" ? 100 : "auto",
      render(row) {
        let type, text;
        switch (row.status) {
          case "1":
            type = "warning";
            text = "PENDIENTE";
            break;
          case "2":
            type = "success";
            text = "COBRADO";
            break;
          case "3":
            type = "error";
            text = "ANULADO";
            break;
          default:
            break;
        }

        return h(
          NPopover,
          {
            trigger: "hover",
            disabled: !row.null_reason,
          },
          {
            default: () => row.null_reason,
            trigger: () =>
              h(
                NTag,
                {
                  size: "small",
                  type: type,
                  round: true,
                },
                {
                  default: () => text,
                }
              ),
          }
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: genericsStore.device !== "desktop" ? 250 : "auto",
      align: "center",
      render(row) {
        return [
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "info",
              secondary: true,
              onClick: () => showDetails(row),
            },
            renderIcon("md-feed-round")
          ),
          h(
            NButton,
            {
              class: "me-2",
              size: "small",
              type: "warning",
              secondary: true,
              disabled: !row.is_delivery,
              onClick: () => showDeliveryInfo(row),
            },
            renderIcon("md-deliverydining-round")
          ),
        ];
      },
    },
  ];
};

export const permissionsLabels = {
  business: "Empresa",
  customer: "Clientes",
  order: "Pedidos",
  products: "Productos",
  sale: "Ventas",
  table: "Mesas",
  till: "Caja",
  users: "Usuarios",
  add_branchoffice: "Agregar Sucursal",
  change_branchoffice: "Editar Sucursal",
  delete_branchoffice: "Eliminar Sucursal",
  view_branchoffice: "Ver Sucursal",
  add_business: "Agregar Empresa",
  change_business: "Editar Empresa",
  delete_business: "Eliminar Empresa",
  view_business: "Ver Empresa",
  add_documentseries: "Agregar Series",
  change_documentseries: "Editar Series",
  delete_documentseries: "Eliminar Series",
  view_documentseries: "Ver Series",
  add_address: "Agregar Direcciones",
  change_address: "Editar Direcciones",
  delete_address: "Eliminar Direcciones",
  view_address: "Ver Direcciones",
  add_customer: "Agregar Clientes",
  change_customer: "Editar Clientes",
  delete_customer: "Eliminar Clientes",
  view_customer: "Ver Clientes",
  add_supplier: "Agregar Proveedores",
  change_supplier: "Editar Proveedores",
  delete_supplier: "Eliminar Proveedores",
  view_supplier: "Ver Proveedores",
  add_order: "Agregar Pedidos",
  change_order: "Editar Pedidos",
  delete_order: "Eliminar Pedidos",
  print_order_prebill: "Imprimir Pre-cuenta",
  view_order: "Ver Pedidos",
  charge_order: "Cobrar Pedidos",
  take_away_order: "Realizar pedidos para llevar",
  take_delivery_order: "Realizar pedidos delivery",
  take_order: "Realizar pedidos en mesa",
  add_orderdetail: "Agregar Detalle de Pedido",
  change_orderdetail: "Editar Detalle de Pedido",
  delete_orderdetail: "Eliminar Detalle de Pedido",
  view_orderdetail: "Ver Detalle de Pedido",
  add_productpreparation: "Agregar Lista de Preparación",
  change_productpreparation: "Editar Lista de Preparación",
  delete_productpreparation: "Eliminar Lista de Preparación",
  view_productpreparation: "Ver Lista de Preparación",
  add_inventoryconcept: "Agregar Concepto de Inventario",
  change_inventoryconcept: "Editar Concepto de Inventario",
  delete_inventoryconcept: "Eliminar Concepto de Inventario",
  view_inventoryconcept: "Ver Concepto de Inventario",
  add_kardex: "Agregar Kardex",
  change_kardex: "Editar Kardex",
  delete_kardex: "Eliminar Kardex",
  view_kardex: "Ver Kardex",
  add_kardexproduct: "Agregar Kardex de Producto",
  change_kardexproduct: "Editar Kardex de Producto",
  delete_kardexproduct: "Eliminar Kardex de Producto",
  view_kardexproduct: "Ver Kardex de Producto",
  add_measureunit: "Agregar Unidades de Medida",
  change_measureunit: "Editar Unidades de Medida",
  delete_measureunit: "Eliminar Unidades de Medida",
  view_measureunit: "Ver Unidades de Medida",
  add_preparationplace: "Agregar Lugares de Preparación",
  change_preparationplace: "Editar Lugares de Preparación",
  delete_preparationplace: "Eliminar Lugares de Preparación",
  view_preparationplace: "Ver Lugares de Preparación",
  add_product: "Agregar Producto",
  change_product: "Editar Producto",
  delete_product: "Eliminar Producto",
  view_product: "Ver Producto",
  add_stock: "Añadir stock",
  remove_stock: "Disminuir stock",
  add_productcategory: "Agregar Categoría de Productos",
  change_productcategory: "Editar Categoría de Productos",
  delete_productcategory: "Eliminar Categoría de Productos",
  view_productcategory: "Ver Categoría de Productos",
  add_productmovements: "Agregar Movimientos de Producto",
  change_productmovements: "Editar Movimientos de Producto",
  delete_productmovements: "Eliminar Movimientos de Producto",
  view_productmovements: "Ver Movimientos de Producto",
  add_suppliedetails: "Agregar Detalles de Insumo",
  change_suppliedetails: "Editar Detalles de Insumo",
  delete_suppliedetails: "Eliminar Detalles de Insumo",
  view_suppliedetails: "Ver Detalles de Insumo",
  add_suppliemovements: "Agregar Movimientos de Producto",
  change_suppliemovements: "Editar Movimientos de Producto",
  delete_suppliemovements: "Eliminar Movimientos de Producto",
  view_suppliemovements: "Ver Movimientos de Producto",
  add_supplies: "Agregar Insumos",
  change_supplies: "Editar Insumos",
  delete_supplies: "Eliminar Insumos",
  view_supplies: "Ver Insumos",
  add_supplies_stock: "Añadir stock de Insumo",
  remove_supplies_stock: "Disminuir stock de Insumo",
  make_supplies_report: "Crear reporte de Insumos",
  add_invoicetype: "Agregar Tipos de Documento",
  change_invoicetype: "Editar Tipos de Documento",
  delete_invoicetype: "Eliminar Tipos de Documento",
  view_invoicetype: "Ver Tipos de Documento",
  add_paymentcondition: "Agregar Condiciones de Pago",
  change_paymentcondition: "Editar Condiciones de Pago",
  delete_paymentcondition: "Eliminar Condiciones de Pago",
  view_paymentcondition: "Ver Condiciones de Pago",
  add_paymentmethodtype: "Agregar Métodos de Pago",
  change_paymentmethodtype: "Editar Métodos de Pago",
  delete_paymentmethodtype: "Eliminar Métodos de Pago",
  view_paymentmethodtype: "Ver Métodos de Pago",
  add_sale: "Agregar Ventas",
  change_sale: "Editar Ventas",
  delete_sale: "Eliminar Ventas",
  view_sale: "Ver Ventas",
  send_sale: "Enviar Ventas",
  add_saledetail: "Agregar Detalles de Venta",
  change_saledetail: "Editar Detalles de Venta",
  delete_saledetail: "Eliminar Detalles de Venta",
  view_saledetail: "Ver Detalles de Venta",
  add_area: "Agregar Areas",
  change_area: "Editar Areas",
  delete_area: "Eliminar Areas",
  view_area: "Ver Areas",
  add_table: "Agregar Mesas",
  change_table: "Editar Mesas",
  delete_table: "Eliminar Mesas",
  view_table: "Ver Mesas",
  null_orders: "Anular Pedidos",
  add_concept: "Agregar Conceptos de Caja",
  change_concept: "Editar Conceptos de Caja",
  delete_concept: "Eliminar Conceptos de Caja",
  view_concept: "Ver Conceptos de Caja",
  add_till: "Agregar Cajas",
  change_till: "Editar Cajas",
  delete_till: "Eliminar Cajas",
  view_till: "Ver Cajas",
  make_ticket_report: "Crear reporte de Caja(ticket)",
  make_excel_report: "Crear reporte de Caja(excel)",
  add_tilldetails: "Agregar Detalles de Caja",
  change_tilldetails: "Editar Detalles de Caja",
  delete_tilldetails: "Eliminar Detalles de Caja",
  view_tilldetails: "Ver Detalles de Caja",
  make_income_details: "Crear Ingreso de Caja",
  make_outcome_details: "Crear Egreso de Caja",
  null_tilldetails: "Anular Detalles de Caja",
  add_user: "Agregar Usuarios",
  change_user: "Editar Usuarios",
  delete_user: "Eliminar Usuarios",
  view_user: "Ver Usuarios",
  change_passwords: "Cambiar contraseñas de Usuarios",
  change_permissions: "Cambiar permisos de Usuarios",
  change_product_affectation: "Cambiar afectación de producto en venta",
};
