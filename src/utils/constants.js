import { h } from "vue"
import { NButton, NTag, NPopover, NText, NSpace } from "naive-ui"
import { renderIcon, lighten } from "@/utils"
import { useSaleStore } from '@/store/modules/sale';
import { useTillStore } from '@/store/modules/till';
import { useGenericsStore } from "@/store/modules/generics";

const tillStore = useTillStore()

const saleStore = useSaleStore()

const genericsStore = useGenericsStore();

export const businessRules = {
    ruc: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'RUC requeridos'
    },
    name: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Nombre requerido'
    },
    commercial_name: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Nombre comercial requerido'
    },
    fiscal_address: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Dirección requerido'
    },
    legal_representative: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Representante requerido'
    },
}

export const branchOfficeRules = {
    description: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'RUC requeridos'
    },
    ubigeo: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Nombre requerido'
    },
    commercial_address: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Nombre comercial requerido'
    }
}

export const getDocTypeByNumber = (v) => {
    switch (v) {
        case "0":
            return 'SIN DOCUMENTO'
        case "1":
            return 'L.E / DNI'
        case "4":
            return 'CARNET EXT.'
        case "6":
            return 'RUC'
        case "7":
            return 'PASAPORTE'
        default:
            console.error('Error: Tipo de Documento inválido')
            break
    }
}

export const documentOptions = [
    {
        label: 'SIN DOCUMENTO',
        value: "0"
    },
    {
        label: 'L.E / DNI',
        value: "1"
    },
    {
        label: 'CARNET EXT.',
        value: "4"
    },
    {
        label: 'RUC',
        value: "6"
    },
    {
        label: 'PASAPORTE',
        value: "7"
    },
]

export const measureUnitOptions = [
    {
        label: 'UND',
        value: "1"
    },
    {
        label: 'SERV',
        value: "2"
    },
]

export const getmeasureUnitByNumber = (v) => {
    switch (v) {
        case "1":
            return 'UND'
        case "2":
            return 'SERV'
        default:
            console.error('Error: Unidad de medida inválido')
            break
    }
}

export const getSaleDocumentByNumber = (v) => {
    switch (v) {
        case "1":
            return 'FACTURA ELECTRÓNICA'
        case "3":
            return 'BOLETA DE VENTA ELECTRÓNICA'
        /* case "7":
            return 'NOTA DE CRÉDITO'
        case "8":
            return 'NOTA DE DÉBITO' */
        case "80":
            return 'NOTA DE VENTA'
        default:
            console.error('Error: Tipo de Documento inválido')
            break
    }
}

export const saleDocumentOptions = [
    {
        label: 'FACTURA ELECTRÓNICA',
        value: "1"
    },
    {
        label: 'BOLETA DE VENTA ELECTRÓNICA',
        value: "3"
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
        label: 'NOTA DE VENTA',
        value: "80"
    },
]

export const createCustomerColumns = ({ editCustomer, deleteCustomer }) => {
    return [
        {
            title: 'ID',
            key: 'id',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 50 : 'auto'
        },
        {
            title: 'Documento',
            key: 'doc_num',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 150 : 'auto'
        },
        {
            title: 'Tipo',
            key: 'doc_type',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                return getDocTypeByNumber(row.doc_type)
            }
        },
        {
            title: 'Nombre',
            key: 'names',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 300 : 'auto'
        },
        {
            title: 'Dirección',
            key: 'addresses',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
            render(row) {
                if (row.addresses.length > 0) {
                    return !row.addresses[0].description ? '-----' : row.addresses[0].description
                }
                return '-----'
            }
        },
        {
            title: 'Género',
            key: 'gender',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 50 : 'auto'
        },
        {
            title: 'F. Nacimiento',
            key: 'birthdate',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto'
        },
        {
            title: 'Celular',
            key: 'phone',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 150 : 'auto'
        },
        {
            title: 'Correo',
            key: 'email',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto'
        },
        {
            title: 'Estado',
            key: 'is_disabled',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                let type, text
                if (row.is_disabled) {
                    type = "error"
                    text = "Inactivo"
                } else {
                    type = "success"
                    text = "Activo"
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 150 : 'auto',
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            secondary: true,
                            onClick: () => editCustomer(row),
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: row.is_disabled ? 'success' : 'error',
                            secondary: true,
                            onClick: () => deleteCustomer(row)
                        },
                        row.is_disabled ? renderIcon('la-user-check-solid') : renderIcon('la-user-times-solid')
                    )
                ]
            }
        }
    ]
}

export const customerRules = {
    names: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Nombres requeridos'
    },
    doc_type: {
        required: true,
        trigger: ['blur', 'change'],
        message: 'Tipo documento requerido'
    },
    doc_num: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Número documento requerido'
    },
}

export const productRules = {
    name: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Nombre requeridos'
    },
    prices: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Precio requerido'
    },
    purchase_price: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Precio requerido'
    },
    category: {
        type: 'number',
        required: true,
        trigger: ['blur', 'input'],
        message: 'Categoría requerido'
    },
}

export const createUserColumns = ({ editUser, deleteUser, changePassword }) => {
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
            title: 'DNI',
            key: 'dni'
        },
        {
            title: 'Nombres',
            key: 'names'
        },
        {
            title: 'Correo',
            key: 'email'
        },
        {
            title: 'Perfil',
            key: 'profile_des'
        },
        {
            title: 'Sucursal',
            key: 'branchoffice_des',
        },
        {
            title: 'Estado',
            render(row) {
                let type, text;
                if (row.is_active) {
                    type = "success"
                    text = "Activo"
                } else {
                    type = "error"
                    text = "Inactivo"
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 140,
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            secondary: true,
                            onClick: () => editUser(row)
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'info',
                            secondary: true,
                            onClick: () => changePassword(row)
                        },
                        renderIcon('ri-rotate-lock-fill')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: row.is_active ? 'error' : 'success',
                            secondary: true,
                            onClick: () => deleteUser(row)
                        },
                        renderIcon('la-user-slash-solid')
                    )
                ]
            }
        }
    ]
}

export const createTillColumns = ({ generateReport, closeTill }) => {
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
            title: 'Responsable Apertura',
            key: 'opening_responsable',
            width: genericsStore.device !== 'desktop' ? 160 : 'auto',
            render(row) {
                return !row.opening_responsable ? '-----' : row.opening_responsable
            }
        },
        {
            title: 'Apertura',
            key: 'created',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
            render(row) {
                return !row.created ? '--/--/---- --:--:--' : row.created
            }
        },
        {
            title: 'Saldo inicial',
            key: 'opening_amount',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                return !row.opening_amount ? 'S/. --.--' : `S/. ${row.opening_amount}`
            }
        },
        {
            title: 'Responsable Cierre',
            key: 'closing_responsable',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                return !row.closing_responsable ? '-----' : row.closing_responsable
            }
        },
        {
            title: 'Cierre',
            key: 'modified',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
            render(row) {
                return row.modified === row.created ? '--/--/---- --:--:--' : row.modified
            }
        },
        {
            title: 'Saldo final',
            key: 'closing_amount',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                return !row.closing_amount ? 'S/. --.--' : `S/. ${row.closing_amount}`
            }
        },
        {
            title: 'Estado',
            key: 'status',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                let type, text
                if (row.status === true) {
                    type = "success"
                    text = "Abierto"
                } else if (row.status === false) {
                    type = "error"
                    text = "Cerrado"
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 125 : 'auto',
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            secondary: true,
                            onClick: () => generateReport(row)
                        },
                        renderIcon('md-insertchart-outlined')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
                            secondary: true,
                            disabled: !row.status,
                            onClick: () => closeTill(row)
                        },
                        renderIcon('md-lock-round')
                    )
                ]
            }
        }
    ]
}

export const movementRules = {
    description: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Este campo es requerido'
    },
    payment_method: {
        type: 'number',
        required: true,
        trigger: ['blur', 'input'],
        message: 'Este campo es requerido'
    },
    amount: {
        type: 'number',
        required: true,
        validator(rule, value) {
            if (!value) {
                return new Error("Monto requerido");
            }
            return true;
        },
        trigger: ['blur', 'input'],
        message: 'Monto requerido'
    },
    concept: {
        type: 'number',
        required: true,
        trigger: ['blur', 'input'],
        message: 'Este campo es requerido'
    },
}

export const createMovementsColumns = ({ hasSells, editMovement, deleteMovement }) => {
    return [
        {
            title: 'Documento',
            key: 'document',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto'
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
            title: 'Descripción',
            key: 'description',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto'
        },
        {
            title: 'Método Pago',
            key: 'payment_method',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
            render(row) {
                return saleStore.getPaymentMethodDescription(row.payment_method)
            }
        },
        {
            title: 'Ingreso',
            key: 'income',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                let concept_type = tillStore.getConceptType(row.concept)
                return concept_type == '0' ? row.amount : '----'
            }
        },
        {
            title: 'Egreso',
            key: 'outcome',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                let concept_type = tillStore.getConceptType(row.concept)
                return concept_type == '1' ? row.amount : '----'
            }
        },
        {
            title: 'Concepto',
            key: 'concept',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 225 : 'auto',
            render(row) {
                return tillStore.getConceptDescription(row.concept)
            }
        },
        {
            title: 'Tipo',
            key: 'concept_type',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                let concept_type = tillStore.getConceptType(row.concept)

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: concept_type == '0' ? 'success' : 'error',
                        round: true
                    },
                    {
                        default: () => concept_type == '0' ? 'INGRESO' : 'EGRESO'
                    }
                )
            }
        },
        {
            title: 'Fecha',
            key: 'created',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
        },
        {
            title: 'Acciones',
            key: 'actions',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 125 : 'auto',
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'info',
                            secondary: true,
                            onClick: () => editMovement(row)
                        },
                        renderIcon('md-print-round')
                    ),
                    !(String(row.document).startsWith('B') || String(row.document).startsWith('F') || String(row.document).startsWith('N')) ? h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
                            secondary: true,
                            disabled: (row.status || row.concept === 4 || row.concept === 5 || row.concept === 6 || row.concept === 7) ? true : row.concept === 1 && hasSells(),
                            onClick: () => deleteMovement(row)
                        },
                        renderIcon('md-notinterested-round')
                    ) : null
                ]
            }
        }
    ]
}


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
            title: 'Documento',
            key: 'document'
        },
        {
            title: 'Nombres',
            key: 'names'
        },
        {
            title: 'Representante',
            key: 'representative'
        },
        {
            title: 'Email',
            key: 'email'
        },
        {
            title: 'Teléfono',
            key: 'phone'
        },
        {
            title: 'Estado',
            key: 'state',
            render(row) {
                let type, text
                if (row.state === true) {
                    type = "success"
                    text = "Activo"
                } else if (row.state === false) {
                    type = "error"
                    text = "Inactivo"
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            onClick: () => editSupplier(row)
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: row.state ? 'error' : 'success',
                            onClick: () => deleteSupplier(row)
                        },
                        renderIcon('la-user-slash-solid')
                    )
                ]
            }
        }
    ]
}

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
            title: 'Nombres',
            key: 'name'
        },
        {
            title: 'Unidad medida',
            key: 'measureunit_des'
        },
        {
            title: 'Precio compra',
            key: 'purchase_price',
            render(row) {
                return "S/." + row.purchase_price
            }
        },
        {
            title: 'Stock',
            align: 'center',
            render(row) {
                return h(NPopover,
                    { trigger: "click" },
                    {
                        trigger: () => h(NButton,
                            {
                                size: 'small',
                                type: 'success',
                                circle: true
                            },
                            renderIcon('md-search-round')),
                        default: () => h(NSpace, { vertical: true }, {
                            default: () => row.amount.map((v) => {
                                return [h(NText, {}, { default: () => v.amount })]
                            })
                        })
                    }
                )
            }
        },
        {
            title: 'Estado',
            key: 'state',
            render(row) {
                let type, text
                if (row.state === true) {
                    type = "success"
                    text = "Activo"
                } else if (row.state === false) {
                    type = "error"
                    text = "Inactivo"
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            onClick: () => editSupplies(row)
                        },
                        renderIcon('md-edit')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: row.state ? 'error' : 'success',
                            onClick: () => deleteSupplies(row)
                        },
                        renderIcon('md-delete')
                    )
                ]
            }
        }
    ]
}

export const createKardexListColumns = () => {
    return [
        {
            title: 'Código',
            key: 'code',
            align: 'center'
        },
        {
            title: 'Insumo',
            key: 'name',
            align: 'center'
        },
        {
            title: 'Fecha',
            key: 'date',
            align: 'center'
        },
        {
            title: 'Descripción',
            key: 'description',
            align: 'center'
        },
        {
            title: 'Documento',
            key: 'document',
            align: 'center',
        },
        {
            title: 'Entrada',
            key: 'input',
            align: 'center',
            render(row) {
                if (row.input) {
                    return row.input
                } else {
                    return '-'
                }
            }
        },
        {
            title: 'Salida',
            key: 'output',
            align: 'center',
            render(row) {
                if (row.output) {
                    return row.output
                } else {
                    return '-'
                }
            }
        },
        {
            title: 'Stock',
            key: 'stock',
            align: 'center'
        },
    ]
}

export const createKardexBySupplyColumns = () => {
    return [
        {
            title: "",
            align: 'center',
            width: 20,
            render(row, index) {
                return index + 1;
            },
        },
        {
            title: 'Almacen',
            key: 'branchoffice_des',
        },
        {
            title: 'Fecha',
            key: 'created',
            align: 'center'
        },
        {
            title: 'Concepto',
            key: 'concept_des'
        },
        {
            title: 'Documento',
            key: 'document',
            align: 'center',
        },
        {
            title: 'Entrada',
            key: 'ingress',
            align: 'center',
        },
        {
            title: 'Salida',
            key: 'egress',
            align: 'center',
            // render(row) {
            //     if (row.output) {
            //         return row.output
            //     } else {
            //         return '-'
            //     }
            // }
        },
        {
            title: 'Stock',
            key: 'balance',
            align: 'center'
        },
    ]
}

export const saleRules = {
    customer: {
        type: 'number',
        required: true,
        trigger: ['blur'],
        message: 'Cliente es requerido'
    },
    delivery_info: null
}

export const createSaleColumns = ({ printSale, miscSale, sendSale, nullifySale }) => {
    return [
        {
            title: 'Cliente',
            key: 'customer'
        },
        {
            title: 'Documento',
            key: 'document',
            render(row) {
                return `${row.serie}-${row.number}`
            }
        },
        {
            title: 'Método Pago',
            key: 'payment_method',
        },
        {
            title: 'Monto',
            key: 'amount',
        },
        {
            title: 'Emisión',
            key: 'date_sale',
        },
        {
            title: 'Estado',
            key: 'status',
            render(row) {
                let type, text
                if (row.status === 'N') {
                    type = "info"
                    text = "NUEVO"
                } else if (row.status === 'E') {
                    type = "success"
                    text = "ENVIADO"
                } else if (row.status === 'A') {
                    type = "error"
                    text = "ANULADO"
                } else if (row.status === 'X') {
                    type = "warning"
                    text = "¡ERROR!"
                } else {
                    type = "warning"
                    text = "-"
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
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
        },
    ]
}

export const createOrderColumns = ({ showDetails, showDeliveryInfo, payDeliver, nullifyOrder }) => {
    return [
        {
            title: '#',
            key: 'number',
            width: 'auto',
            render(row, index) {
                return index + 1
            }
        },
        {
            title: 'Cliente',
            key: 'sale_customer',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
        },
        {
            title: 'Usuario',
            key: 'user',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
        },
        {
            title: 'Monto',
            key: 'amount',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                return `S/. ${parseFloat(row.amount).toFixed(2)}`
            }
        },
        {
            title: 'Fecha',
            key: 'created',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 200 : 'auto',
        },
        {
            title: 'Tipo',
            key: 'type',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 150 : 'auto',
            render(row) {
                let color, text;
                switch (row.order_type) {
                    case 'M':
                        color = "#3B689F"
                        text = "EN MESA"
                        break;
                    case 'P':
                        color = "#926ED7"
                        text = "PARA LLEVAR"
                        break;
                    case 'D':
                        color = "#995C4E"
                        text = "DELIVERY"
                        break;
                    default:
                        color = "#D03050"
                        text = "ERROR"
                        break;
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        color: { color: lighten(color, 48), textColor: color, borderColor: lighten(color, 24) },
                        round: false
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Estado',
            key: 'status',
            align: 'center',
            width: genericsStore.device !== 'desktop' ? 100 : 'auto',
            render(row) {
                let type, text;
                switch (row.status) {
                    case '1':
                        type = "warning"
                        text = "PENDIENTE"
                        break
                    case '2':
                        type = "success"
                        text = "COBRADO"
                        break
                    case '3':
                        type = "error"
                        text = "ANULADO"
                        break
                    default:
                        break
                }

                return h(
                    NTag,
                    {
                        size: 'small',
                        type: type,
                        round: true
                    },
                    {
                        default: () => text
                    }
                )
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: genericsStore.device !== 'desktop' ? 250 : 'auto',
            align: 'center',
            render(row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'info',
                            secondary: true,
                            onClick: () => showDetails(row)
                        },
                        renderIcon('md-feed-round')
                    ),
                    row.is_delivery ? h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            secondary: true,
                            onClick: () => showDeliveryInfo(row)
                        },
                        renderIcon('md-deliverydining-round')
                    ) : null,
                    !row.table ? h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'success',
                            secondary: true,
                            disabled: row.status === '2',
                            onClick: () => payDeliver(row)
                        },
                        renderIcon('fa-dollar-sign')
                    ) : null,
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'error',
                            secondary: true,
                            disabled: row.status !== '1',
                            onClick: () => nullifyOrder(row)
                        },
                        renderIcon('md-cancel-twotone')
                    )
                ]
            }
        },
    ]
}
