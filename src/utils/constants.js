import {h} from "vue"
import {NButton, NTag} from "naive-ui"
import {renderIcon} from "@/utils"

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

export const getSaleDocumentByNumber = (v) => {
    switch (v) {
        case "1":
            return 'FACTURA ELECTRÓNICA'
        case "3":
            return 'BOLETA DE VENTA ELECTRÓNICA'
        case "7":
            return 'NOTA DE CRÉDITO'
        case "8":
            return 'NOTA DE DÉBITO'
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
    {
        label: 'NOTA DE CRÉDITO',
        value: "7"
    },
    {
        label: 'NOTA DE DÉBITO',
        value: "8"
    },
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
                return row.addresses[0].description
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
        },
        {
            title: 'Acciones',
            key: 'actions',
            render (row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            onClick: () => editCustomer(row)
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
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
        trigger: ['blur','input'],
        message: 'Número documento requerido'
    },
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
            render (row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            onClick: () => editUser(row)
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
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
        {
            title: 'Usuario',
            key: 'user'
        },
        {
            title: 'Sucursal',
            key: 'sucursal'
        },
        {
            title: 'Apertura',
            key: 'opening',
        },
        {
            title: 'Cierre',
            key: 'closing',
        },
        {
            title: 'Saldo inicial',
            key: 'opening_amount',
        },
        {
            title: 'Saldo final',
            key: 'closing_amount',
        },
        {
            title: 'Estado',
            key: 'status',
            render (row) {
                let type, text
                if (row.status===true) {
                    type="success"
                    text="Abierto"
                } else if (row.status===false) {
                    type="error"
                    text="Cerrado"
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
            render (row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            onClick: () => generateReport(row)
                        },
                        renderIcon('md-insertchart-outlined')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
                            onClick: () => deleteMovement(row)
                        },
                        renderIcon('md-lock-round')
                    )
                ]
            }
        }
    ]
}

export const createMovementsColumns = ({ editMovement, deleteMovement }) => {
    return [
        {
            title: 'Documento',
            key: 'document'
        },
        {
            title: 'Usuario',
            key: 'user'
        },
        {
            title: 'Sucursal',
            key: 'sucursal'
        },
        {
            title: 'Descripción',
            key: 'description',
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
            title: 'Concepto',
            key: 'concept',
        },
        {
            title: 'Tipo',
            key: 'concept_type',
            render (row) {
                let type, text
                if (row.concept_type===1) {
                    type="success"
                    text="Ingreso"
                } else if (row.concept_type===2) {
                    type="error"
                    text="Egreso"
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
            title: 'Fecha',
            key: 'date',
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
            render (row) {
                return [
                    h(
                        NButton,
                        {
                            class: 'me-2',
                            size: 'small',
                            type: 'warning',
                            onClick: () => editMovement(row)
                        },
                        renderIcon('la-user-edit-solid')
                    ),
                    h(
                        NButton,
                        {
                            size: 'small',
                            type: 'error',
                            onClick: () => deleteMovement(row)
                        },
                        renderIcon('la-user-slash-solid')
                    )
                ]
            }
        }
    ]
}
