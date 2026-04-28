<template>
    <div class="p-4 w-100">
        <n-space justify="space-between" align="center" style="margin-bottom: 24px;">
            <div>
                <n-h2 style="margin: 0;">Consulta SUNAT por Rango</n-h2>
                <n-text depth="3">
                    Valida un rango de comprobantes de una serie contra SUNAT
                </n-text>
            </div>
        </n-space>

        <n-card title="Datos del comprobante" style="margin-bottom: 24px;">
            <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="140">
                <n-grid x-gap="16" y-gap="16" cols="1 m:3" responsive="screen">
                    <n-gi>
                        <n-form-item label="Serie" path="serie">
                            <n-select v-model:value="formData.serie" :options="seriesOptions"
                                placeholder="Seleccione una serie" :disabled="loading || loadingSeries"
                                :loading="loadingSeries" filterable clearable />
                        </n-form-item>
                    </n-gi>

                    <n-gi>
                        <n-form-item label="Número Inicio" path="numero_inicio">
                            <n-input-number v-model:value="formData.numero_inicio" placeholder="1" :disabled="loading"
                                :min="1" :show-button="false" class="w-100" />
                        </n-form-item>
                    </n-gi>

                    <n-gi>
                        <n-form-item label="Número Fin" path="numero_fin">
                            <n-input-number v-model:value="formData.numero_fin" placeholder="10" :disabled="loading"
                                :min="1" :show-button="false" class="w-100" />
                        </n-form-item>
                    </n-gi>
                </n-grid>

                <n-space justify="end" style="margin-top: 16px;">
                    <n-button @click="HandleReset" :disabled="loading">
                        Limpiar
                    </n-button>
                    <n-button type="info" @click="HandleValidate" :loading="loading">
                        <template #icon>
                            <v-icon name="md-search-round" />
                        </template>
                        Validar con SUNAT
                    </n-button>
                </n-space>
            </n-form>
        </n-card>

        <n-card v-if="validationData" title="Resumen de Validación" style="margin-bottom: 24px;">
            <n-grid x-gap="16" y-gap="16" cols="2 s:3 m:4 l:7" responsive="screen">
                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #f0f8ff; border-color: #bae0ff;">
                        <n-statistic label="Serie">
                            <span style="color: #0958d9; font-weight: bold; font-size: 1.5rem;">{{
                                validationData.summary.serie
                            }}</span>
                        </n-statistic>
                    </n-card>
                </n-gi>

                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #f5f5f5; border-color: #d9d9d9;">
                        <n-statistic label="Rango">
                            <span style="color: #595959; font-weight: bold; font-size: 1.5rem;">
                                {{ validationData.summary.numero_inicio }} - {{ validationData.summary.numero_fin }}
                            </span>
                        </n-statistic>
                    </n-card>
                </n-gi>

                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #f9f0ff; border-color: #d3adf7;">
                        <n-statistic label="Esperados">
                            <span style="color: #531dab; font-weight: bold; font-size: 1.5rem;">{{
                                validationData.summary.total_expected }}</span>
                        </n-statistic>
                    </n-card>
                </n-gi>

                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #f6ffed; border-color: #b7eb8f;">
                        <n-statistic label="Encontrados">
                            <span style="color: #389e0d; font-weight: bold; font-size: 1.5rem;">{{
                                validationData.summary.total_found }}</span>
                        </n-statistic>
                    </n-card>
                </n-gi>

                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #fffbe6; border-color: #ffe58f;">
                        <n-statistic label="Faltantes">
                            <span style="color: #d48806; font-weight: bold; font-size: 1.5rem;">{{
                                validationData.summary.total_missing }}</span>
                        </n-statistic>
                    </n-card>
                </n-gi>

                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #e6fffb; border-color: #87e8de;">
                        <n-statistic label="Aceptados">
                            <span style="color: #08979c; font-weight: bold; font-size: 1.5rem;">{{
                                validationData.summary.total_accepted }}</span>
                        </n-statistic>
                    </n-card>
                </n-gi>

                <n-gi>
                    <n-card size="small" :bordered="true" style="background-color: #fff2f0; border-color: #ffccc7;">
                        <n-statistic label="Errores">
                            <span style="color: #cf1322; font-weight: bold; font-size: 1.5rem;">{{
                                validationData.summary.total_errors }}</span>
                        </n-statistic>
                    </n-card>
                </n-gi>
            </n-grid>
        </n-card>

        <n-card v-if="validationData" title="Resultados de Validación">
            <n-data-table :columns="columns" :data="validationData.results" :pagination="{ pageSize: 10 }"
                :bordered="false" :single-line="false" size="small" striped :scroll-x="1700" />
        </n-card>
    </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue';
import {
    NCard, NForm, NFormItem, NInput, NInputNumber, NButton,
    NIcon, NDataTable, NTag, NBadge, NTooltip, NSelect, useMessage,
    NSpace, NGrid, NGi, NH2, NText, NStatistic
} from 'naive-ui';
import { http } from '@/api';

const message = useMessage();

const formRef = ref(null);
const formData = ref({
    serie: null,
    numero_inicio: null,
    numero_fin: null,
});

const seriesOptions = ref([]);
const loadingSeries = ref(false);

const rules = {
    serie: [
        { required: true, message: 'La serie es requerida', trigger: ['blur', 'change'] },
    ],
    numero_inicio: [
        { required: true, type: 'number', message: 'El número de inicio es requerido', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value && formData.value.numero_fin && value > formData.value.numero_fin) {
                    return new Error('El número de inicio no puede ser mayor al número fin');
                }
                return true;
            },
            trigger: 'blur',
        },
    ],
    numero_fin: [
        {
            validator: (rule, value) => {
                if (value && formData.value.numero_inicio && value < formData.value.numero_inicio) {
                    return new Error('El número fin no puede ser menor al número de inicio');
                }
                if (value && formData.value.numero_inicio && (value - formData.value.numero_inicio) > 100) {
                    return new Error('El rango máximo es de 100 comprobantes');
                }
                return true;
            },
            trigger: 'blur',
        },
    ],
};

const loading = ref(false);
const validationData = ref(null);

const columns = [
    {
        title: 'Documento',
        key: 'document',
        width: 120,
        fixed: 'left',
        render: (row) =>
            h('span', { class: 'font-semibold text-gray-800' }, row.document),
    },
    {
        title: 'Serie',
        key: 'serie',
        width: 100,
    },
    {
        title: 'Número',
        key: 'number',
        width: 90,
    },
    {
        title: 'RUC Empresa',
        key: 'company_ruc',
        width: 120,
    },
    {
        title: 'Fecha Emisión',
        key: 'issue_date',
        width: 110,
    },
    {
        title: 'Cliente',
        key: 'customer',
        width: 200,
        ellipsis: {
            tooltip: true,
        },
    },
    {
        title: 'RUC/DNI',
        key: 'customer_document',
        width: 120,
    },
    {
        title: 'Monto',
        key: 'amount',
        width: 100,
        align: 'right',
        render: (row) => {
            const amount = parseFloat(row.amount ?? 0);
            return h('span', { class: 'font-semibold text-blue-600' }, `S/ ${amount.toFixed(2)}`);
        },
    },
    {
        title: 'Estado Sistema',
        key: 'system_status',
        width: 130,
        render: (row) => h(NTag, { type: GetSystemStatusType(row.system_status) }, () => row.system_status),
    },
    {
        title: 'Estado SUNAT',
        key: 'sunat_status',
        width: 130,
        render: (row) => h(NTag, { type: GetSunatStatusType(row.sunat_status) }, () => row.sunat_status),
    },
    {
        title: 'Respuesta SUNAT',
        key: 'sunat_response',
        width: 180,
        render: (row) => {
            if (!row.sunat_response) {
                return h('span', { class: 'text-gray-500' }, '-');
            }
            const responseText =
                typeof row.sunat_response === 'string'
                    ? row.sunat_response
                    : JSON.stringify(row.sunat_response, null, 2);
            return h(
                NTooltip,
                {},
                {
                    trigger: () => h('span', { class: 'text-blue-600 underline cursor-pointer' }, 'Ver'),
                    default: () => responseText,
                }
            );
        },
    },
    {
        title: 'Error',
        key: 'sunat_error',
        width: 80,
        align: 'center',
        render: (row) => {
            if (!row.sunat_error) return null;
            return h(
                NTooltip,
                {},
                {
                    trigger: () =>
                        h(NIcon, { size: 20, color: '#ef4444' }, () =>
                            h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' }, [
                                h('path', {
                                    'fill-rule': 'evenodd',
                                    d: 'M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z',
                                    'clip-rule': 'evenodd',
                                }),
                            ])
                        ),
                    default: () => row.sunat_error,
                }
            );
        },
    },
    {
        title: 'Ambiente',
        key: 'environment',
        width: 110,
        render: (row) => h(NBadge, { value: row.environment, type: row.environment === 'Produccion' ? 'success' : 'warning' }),
    },

];

const LoadSeries = async () => {
    try {
        loadingSeries.value = true;
        const response = await http.get('series/', { params: { active: true } });
        const responseData = response.data;

        if (responseData) {
            const seriesData = Array.isArray(responseData)
                ? responseData
                : responseData?.results || [];

            seriesOptions.value = seriesData.map((serieInfo) => ({
                label: serieInfo.number || serieInfo.description || 'Sin serie',
                value: serieInfo.number || serieInfo.description || 'Sin serie',
                id: serieInfo.id,
                branch: serieInfo.branch,
                invoiceType: serieInfo.invoiceType,
                internal: serieInfo.internal,
                contingence: serieInfo.contingence,
            }));
        } else {
            message.error('Error al cargar las series');
        }
    } catch (error) {
        console.error('Error loading series:', error);
        message.error('Error al cargar las series');
    } finally {
        loadingSeries.value = false;
    }
};

const HandleValidate = async () => {
    try {
        await formRef.value?.validate();

        loading.value = true;
        validationData.value = null;

        const payload = {
            serie: formData.value.serie,
            numero_inicio: formData.value.numero_inicio,
            numero_fin: formData.value.numero_fin || formData.value.numero_inicio,
        };

        const response = await http.post('sales/validate-range/', payload);
        const responseData = response.data;

        if (responseData && (responseData.success || responseData.results)) {
            validationData.value = responseData;
            if (responseData.success) {
                message.success('Validación completada correctamente');
            } else {
                message.warning(responseData.message || 'Validación completada con observaciones');
            }
        } else {
            const errorMessage = responseData?.message || responseData?.error || 'Error al validar el rango';
            message.error(errorMessage);
        }
    } catch (validationError) {
        console.error('Validation error:', validationError);
    } finally {
        loading.value = false;
    }
};

const HandleReset = () => {
    formData.value = {
        serie: null,
        numero_inicio: null,
        numero_fin: null,
    };
    validationData.value = null;
    formRef.value?.restoreValidation();
};

onMounted(() => {
    LoadSeries();
});

const GetSystemStatusType = (status) => {
    const statusMap = {
        'Enviado': 'success',
        'Nuevo': 'info',
        'Anulado': 'warning',
        'Error': 'error',
        'No encontrado': 'default',
        'Desconocido': 'default',
    };
    return statusMap[status] || 'default';
};

const GetSunatStatusType = (status) => {
    const statusMap = {
        'Aceptado': 'success',
        'Autorizado': 'success',
        'Anulado': 'warning',
        'Rechazado': 'error',
        'Pendiente': 'info',
        'No encontrado': 'default',
        'Sin configurar': 'default',
        'Error': 'error',
        'Desconocido': 'default',
    };
    return statusMap[status] || 'default';
};


</script>
