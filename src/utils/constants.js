import { h } from "vue"
import { NButton, NTag } from "naive-ui"
import { renderIcon } from "@/utils"
import { OhVueIcon } from '@/plugins/icon'
import { useSaleStore } from '@/store/modules/sale';
import { useTillStore } from '@/store/modules/till';

const tillStore = useTillStore()

const saleStore = useSaleStore()

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
            key: 'id'
        },
        {
            title: 'Documento',
            key: 'doc_num'
        },
        {
            title: 'Tipo',
            key: 'doc_type',
            render(row) {
                return getDocTypeByNumber(row.doc_type)
            }
        },
        {
            title: 'Nombre',
            key: 'names'
        },
        {
            title: 'Dirección',
            key: 'addresses',
            render(row) {
                if (row.addresses.length > 0) {
                    return !row.addresses[0].description ? '-----' : row.addresses[0].description
                }
                return '-----'
            }
        },
        {
            title: 'Género',
            key: 'gender'
        },
        {
            title: 'F. Nacimiento',
            key: 'birthdate'
        },
        {
            title: 'Celular',
            key: 'phone'
        },
        {
            title: 'Correo',
            key: 'email'
        },
        {
            title: 'Estado',
            key: 'isDisabled',
            render(row) {
                let type, text
                if (row.isDisabled) {
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
                            type: 'error',
                            secondary: true,
                            onClick: () => deleteCustomer(row)
                        },
                        renderIcon('la-user-slash-solid')
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
    /* measure_unit: {
        required: true,
        trigger: ['blur', 'change'],
        message: 'Número documento requerido'
    },
    stock: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Número documento requerido'
    },
    number_points: {
        type: 'number',
        required: true,
        trigger: ['blur', 'input'],
        message: 'Número documento requerido'
    },
    redeem_points: {
        type: 'number',
        required: true,
        trigger: ['blur', 'input'],
        message: 'Número documento requerido'
    }, */
}

export const createUserColumns = ({ editUser, deleteUser }) => {
    return [
        {
            title: 'ID',
            key: 'id'
        },
        {
            title: 'Usuario',
            key: 'username'
        },
        {
            title: 'Correo',
            key: 'email'
        },
        {
            title: 'Perfil',
            key: 'profile'
        },
        {
            title: 'Sucursal',
            key: 'sucursal',
        },
        /* {
            title: 'Estado',
            key: 'isDisabled',
            render (row) {
                let type, text
                if (row.isDisabled) {
                    type="error"
                    text="Inactivo"
                } else {
                    type="success"
                    text="Activo"
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
        }, */
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
                            secondary: true,
                            onClick: () => editUser(row)
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
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

export const createTillColumns = ({ generateReport, deleteMovement }) => {
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
            render(row) {
                return !row.opening_responsable ? '-----' : row.opening_responsable
            }
        },
        {
            title: 'Apertura',
            key: 'created',
            render(row) {
                return !row.created ? '--/--/---- --:--:--' : row.created
            }
        },
        {
            title: 'Saldo inicial',
            key: 'opening_amount',
            render(row) {
                return !row.opening_amount ? 'S/. --.--' : `S/. ${row.opening_amount}`
            }
        },
        {
            title: 'Responsable Cierre',
            key: 'closing_responsable',
            render(row) {
                return !row.closing_responsable ? '-----' : row.closing_responsable
            }
        },
        {
            title: 'Cierre',
            key: 'modified',
            render(row) {
                return row.modified === row.created ? '--/--/---- --:--:--' : row.modified
            }
        },
        {
            title: 'Saldo final',
            key: 'closing_amount',
            render(row) {
                return !row.closing_amount ? 'S/. --.--' : `S/. ${row.closing_amount}`
            }
        },
        {
            title: 'Estado',
            key: 'status',
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
                            onClick: () => deleteMovement(row)
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
        required: true,
        trigger: ['blur', 'input'],
        message: 'Este campo es requerido'
    },
    concept: {
        type: 'number',
        required: true,
        trigger: ['blur', 'input'],
        message: 'Este campo es requerido'
    },
}

export const createMovementsColumns = ({ editMovement, deleteMovement }) => {
    return [
        {
            title: 'Documento',
            key: 'document'
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
        },
        {
            title: 'Método Pago',
            key: 'payment_method',
            render(row) {
                return saleStore.getPaymentMethodDescription(row.payment_method)
            }
        },
        {
            title: 'Monto',
            key: 'amount',
        },
        {
            title: 'Concepto',
            key: 'concept',
            render(row) {
                return tillStore.getConceptDescription(row.concept)
            }
        },
        {
            title: 'Tipo',
            key: 'concept_type',
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
                            type: 'info',
                            secondary: true,
                            onClick: () => editMovement(row)
                        },
                        renderIcon('md-print-round')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
                            secondary: true,
                            onClick: () => deleteMovement(row)
                        },
                        renderIcon('md-notinterested-round')
                    )
                ]
            }
        }
    ]
}

export const createSuppliesColumns = ({ removeSupply }) => {
    return [
        {
            title: 'Código',
            key: 'code'
        },
        {
            title: 'Cantidad',
            key: 'quantity'
        },
        {
            title: 'Descripción',
            key: 'description'
        },
        {
            title: 'Precio Unitario',
            key: 'unit_price',
            render(row) {
                return row.unit_price.toFixed(2)
            }
        },
        {
            title: 'SubTotal',
            key: 'subtotal',
            render(row) {
                return row.subtotal.toFixed(2)
            }
        },
        {
            title: 'Acciones',
            key: 'actions',
            render(row) {
                return h(
                    NButton,
                    {
                        size: 'small',
                        type: 'error',
                        secondary: true,
                        onClick: () => removeSupply(row)
                    },
                    renderIcon('md-close-round')
                )
            }
        }
    ]
}

export const createSuppliersColumns = ({ editSupplier, deleteSupplier }) => {
    return [
        {
            title: 'Código',
            key: 'code',
        },
        {
            title: 'RUC',
            key: 'ruc'
        },
        {
            title: 'Nombres',
            key: 'names'
        },
        {
            title: 'Representante',
            key: 'legal_representative'
        },
        {
            title: 'Dirección',
            key: 'address'
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
            key: 'status',
            render(row) {
                let type, text
                if (row.status === true) {
                    type = "success"
                    text = "Activo"
                } else if (row.status === false) {
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
                            type: 'error',
                            onClick: () => deleteSupplier(row)
                        },
                        renderIcon('la-user-slash-solid')
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
