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
        value: 0
    },
    {
        label: 'L.E / DNI',
        value: 1
    },
    {
        label: 'CARNET EXT.',
        value: 4
    },
    {
        label: 'RUC',
        value: 6
    },
    {
        label: 'PASAPORTE',
        value: 7
    },
]
export const createCostumerColumns = ({ editCustomer, deleteCustomer }) => {
    return [
        {
            title: 'ID',
            key: 'id'
        },
        {
            title: 'Nombre',
            key: 'names'
        },
        {
            title: 'Documento',
            key: 'doc_num'
        },
        {
            title: 'Tipo',
            key: 'doc_type'
        },
        {
            title: 'Dirección',
            key: 'address'
        },
        {
            title: 'Celular',
            key: 'phone'
        },
        {
            title: 'F. Nacimiento',
            key: 'birthdate'
        },
        {
            title: 'Correo',
            key: 'email'
        },
        {
            title: 'Estado',
            key: 'status',
            render (row) {
                let type, text
                if (row.status) {
                    type="info"
                    text="Activo"
                }
                else {
                    type="error"
                    text="Inactivo"
                }

                return h(
                    NTag,
                    {
                        type: type
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
                        renderIcon('md-deleteforever')
                    )
                ]
            }
        }
    ]
}