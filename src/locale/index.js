import esPE from 'date-fns/locale/es'

const commonEsPE = {
    name: 'es-PE',
    global: {
        undo: 'Deshacer',
        redo: 'Rehacer',
        confirm: 'Confirmar'
    },
    Popconfirm: {
        positiveText: 'Confirmar',
        negativeText: 'Cancelar'
    },
    Cascader: {
        placeholder: 'Por favor seleccione',
        loading: 'Cargando',
        loadingRequiredMessage: (label) => `Cargue todos los descendientes de ${label} antes de verificarlo.`
    },
    Time: {
        dateFormat: 'yyyy-MM-dd',
        dateTimeFormat: 'yyyy-MM-dd hh:mm:ss'
    },
    DatePicker: {
        yearFormat: 'yyyy',
        monthFormat: 'MMM',
        dayFormat: 'eeeeee',
        clear: 'Limpiar',
        now: 'Ahora',
        confirm: 'Confirmar',
        selectTime: 'Seleccionar hora',
        selectDate: 'Seleccione fecha',
        datePlaceholder: 'Seleccione fecha',
        datetimePlaceholder: 'Seleccionar fecha y hora',
        startDatePlaceholder: 'Fecha de inicio',
        endDatePlaceholder: 'Fecha final',
        startDatetimePlaceholder: 'Fecha y hora de inicio',
        endDatetimePlaceholder: 'Fecha y hora de finalización',
        monthBeforeYear: true,
        firstDayOfWeek: 6,
        today: 'Hoy'
    },
    DataTable: {
        checkTableAll: 'Seleccionar todo en la tabla',
        uncheckTableAll: 'Deseleccionar todo en la tabla',
        confirm: 'Confirmar',
        clear: 'Limpiar'
    },
    Transfer: {
        sourceTitle: 'Fuente',
        targetTitle: 'Objetivo'
    },
    Empty: {
        description: 'Sin datos'
    },
    Select: {
        placeholder: 'Por favor seleccione'
    },
    TimePicker: {
        placeholder: 'Seleccionar hora',
        positiveText: 'OK',
        negativeText: 'Cancelar',
        now: 'Ahora'
    },
    Pagination: {
        goto: 'Ir a',
        selectionSuffix: 'página'
    },
    DynamicTags: {
        add: 'Agregar'
    },
    Log: {
        loading: 'Cargando'
    },
    Input: {
        placeholder: 'Por favor ingrese datos'
    },
    InputNumber: {
        placeholder: 'Por favor ingrese datos'
    },
    DynamicInput: {
        create: 'Crear'
    },
    ThemeEditor: {
        title: 'Editor de temas',
        clearAllVars: 'Borrar todas las variables',
        clearSearch: 'Borrar búsqueda',
        filterCompName: 'Filtrar nombre del componente',
        filterVarName: 'Filtrar nombre de la variable',
        import: 'Importar',
        export: 'Exportar',
        restore: 'Restablecer a valores por defecto'
    }
}

const dateEsPE = {
    name: 'es-PE',
    locale: esPE
}

export { commonEsPE, dateEsPE }