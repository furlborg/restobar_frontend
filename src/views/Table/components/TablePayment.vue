<template>
    <div id="TablePayment">
        <n-card>
            <template #header>
                <n-space align="center" justify="space-between">
                    <div class="d-flex align-items-center">
                        <n-text class="fs-4">BO-001</n-text>
                        <n-dropdown trigger="click" :options="docOptions" :show-arrow="true" placement="bottom-end" size="huge">
                            <n-button type="info" text>
                                <v-icon class="p-0" name="md-arrowdropdown-round" scale="1.75" />
                            </n-button>
                        </n-dropdown>
                    </div>
                    <n-radio-group v-model:value="doc_type" name="docType" size="small">
                        <n-radio-button :value="1" :key="1">FACTURA</n-radio-button>
                        <n-radio-button :value="2" :key="2">BOLETA</n-radio-button>
                        <n-radio-button :value="3" :key="3">N. VENTA</n-radio-button>
                    </n-radio-group>
                    <n-radio-group v-model:value="sale_type" name="saleType" size="small">
                        <n-radio-button :value="1" :key="1">CONTADO</n-radio-button>
                        <n-radio-button :value="2" :key="2">CRÉDITO</n-radio-button>
                    </n-radio-group>
                </n-space>
            </template>
            <n-form>
                <n-grid responsive="screen" cols="12 s:12 m:12 l:12 xl:12 2xl:12" :x-gap="12">
                    <n-form-item-gi :span="2" label="Documento">
                        <n-input />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4" label="Cliente">
                        <n-input-group>
                            <n-input />
                            <n-button type="info">
                                <v-icon name="md-add-round" />
                            </n-button>
                        </n-input-group>
                    </n-form-item-gi>
                    <n-form-item-gi :span="6" label="Dirección">
                        <n-input />
                    </n-form-item-gi>
                </n-grid>
            </n-form>
            <!-- <n-divider />
            <n-table class="fs-4 m-auto text-center" :bordered="false" :single-column="true" :bottom-bordered="false">
                <tbody>
                    <tr>
                        <td width="25%">
                            <n-input-number :value="1" />
                        </td>
                        <td width="50%">Product</td>
                        <td width="25%">S/. 10.00</td>
                    </tr>
                    <tr>
                        <td width="25%">
                            <n-input-number :value="1" />
                        </td>
                        <td width="50%">Product</td>
                        <td width="25%">S/. 10.00</td>
                    </tr>
                </tbody>
            </n-table> -->
            <!-- <n-divider />
            <n-grid responsive="screen" cols="4 s:4 m:4 l:4 xl:4 2xl:4" :x-gap="12">
                <n-gi>
                    <n-card style="background-color: HoneyDew;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-6">SubTotal</span>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card style="background-color: LavenderBlush;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-6">IGV</span>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card style="background-color: Ivory;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-6">ICBPER</span>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card style="background-color: Lavender;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-6">Descuento</span>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
            </n-grid>
            <n-grid class="mt-2" responsive="screen" cols="3 s:3 m:3 l:3 xl:3 2xl:3" :x-gap="12">
                <n-gi>
                    <n-card style="background-color: PaleGoldenRod;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-4">Total</span>
                            <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card style="background-color: PaleGreen;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-4">Pago</span>
                            <div class="fs-5">S/. <span class="fs-1" @keypress.enter.prevent="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card style="background-color: PaleTurquoise;" :bordered="false" hoverable>
                        <n-space align="center" vertical>
                            <span class="fs-4">Vuelto</span>
                            <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
            </n-grid> -->
            <!-- <n-divider />
            <n-grid responsive="screen" cols="4 s:4 m:4 l:4 xl:4 2xl:4" :x-gap="12">
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'HoneyDew', textColor: '#555', borderColor: 'LightGreen' }">SbT</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'LavenderBlush', textColor: '#555', borderColor: 'LightPink' }">IGV</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'Ivory', textColor: '#555', borderColor: 'Wheat' }">ICBPER</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'Lavender', textColor: '#555', borderColor: 'MediumPurple' }">DSC</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span>50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
            </n-grid>
            <n-grid class="mt-2" responsive="screen" cols="3 s:3 m:3 l:3 xl:3 2xl:3" :x-gap="12">
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'PaleGoldenRod', textColor: '#555', borderColor: 'GoldenRod' }">TOTAL</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'PaleGreen', textColor: '#555', borderColor: 'Green' }">PAGO</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span class="fs-1" @keypress.enter.prevent="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
                <n-gi>
                    <n-card :bordered="false" embedded hoverable>
                        <n-tag size="small" :color="{ color: 'PaleTurquoise', textColor: '#555', borderColor: 'Turquoise' }">VUELTO</n-tag>
                        <n-space align="center" vertical>
                            <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                        </n-space>
                    </n-card>
                </n-gi>
            </n-grid> -->
            <!-- <n-divider />
            <n-table :single-line="false" :bordered="false" :bottom-bordered="false">
                <tbody>
                    <tr>
                        <td class="position-relative" rowspan="2" style="bottom-border: none;">
                            <n-tag class="position-absolute top-0 start-0" size="large" :color="{ color: 'PaleGreen', textColor: '#555', borderColor: 'PaleGreen' }">PAGO</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1" @keypress.enter.prevent="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                            </n-space>
                        </td>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'HoneyDew', textColor: '#555', borderColor: 'HoneyDew' }">SUBTOTAL</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                    </tr>
                    <tr>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'LavenderBlush', textColor: '#555', borderColor: 'LavenderBlush' }">IGV</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                    </tr>
                    <tr>
                        <td class="position-relative" rowspan="2">
                            <n-tag class="position-absolute top-0 start-0" size="large" :color="{ color: 'PaleTurquoise', textColor: '#555', borderColor: 'PaleTurquoise' }">VUELTO</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                            </n-space>
                        </td>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'Ivory', textColor: '#555', borderColor: 'Ivory' }">ICBPER</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                    </tr>
                    <tr>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'Lavender', textColor: '#555', borderColor: 'Lavender' }">DSCT</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                    </tr>
                </tbody>
            </n-table> -->
            <n-table class="fs-6 m-auto text-center" :bordered="false">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cantidad</th>
                        <th>Producto</th>
                        <th>Precio</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>1</td>
                        <td>Sopa</td>
                        <td>S/. 10.00</td>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td>3</td>
                        <td>Arroz con pollo</td>
                        <td>S/. 30.00</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>2</td>
                        <td>Chaufon</td>
                        <td>S/. 20.00</td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td>1</td>
                        <td>Huevos</td>
                        <td>S/. 10.00</td>
                    </tr>
                    <tr>
                        <td>5</td>
                        <td>2</td>
                        <td>Caldo de pelos</td>
                        <td>S/. 20.00</td>
                    </tr>
                </tbody>
            </n-table>
            <n-space align="center" justify="space-around">
                <n-space  align="center" vertical>
                    <span class="fs-4">Pago</span>
                    <div class="fs-5">S/. <span class="fs-1" @keypress.enter.prevent="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                </n-space>
                <n-space align="center" vertical>
                    <span class="fs-4">Vuelto</span>
                    <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                </n-space>
                <n-space class=" mt-2 fs-6 fw-bold" align="end" vertical>
                    <div>SUBTOTAL: <span>S/. 50.00</span></div>
                    <div>ICBPER: <span>S/. 0.00</span></div>
                    <div>IGV: <span>S/. 9.00</span></div>
                    <div>DSCT: <span>S/. 0.00</span></div>
                    <div>TOTAL: <span>S/. 50.00</span></div>
                </n-space>
            </n-space>
            <!-- <n-divider />
            <n-table :single-line="false" :bordered="false" :bottom-bordered="false">
                <tbody>
                    <tr>
                        <td class="position-relative" rowspan="2" style="bottom-border: none;">
                            <n-tag class="position-absolute top-0 start-0" size="large" :color="{ color: 'PaleGreen', textColor: '#555', borderColor: 'PaleGreen' }">PAGO</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1" @keypress.enter.prevent="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                            </n-space>
                        </td>
                        <td class="position-relative" rowspan="2">
                            <n-tag class="position-absolute top-0 start-0" size="large" :color="{ color: 'PaleTurquoise', textColor: '#555', borderColor: 'PaleTurquoise' }">VUELTO</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                            </n-space>
                        </td>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'HoneyDew', textColor: '#555', borderColor: 'HoneyDew' }">SUBTOTAL</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'Ivory', textColor: '#555', borderColor: 'Ivory' }">ICBPER</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                    </tr>
                    <tr>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'LavenderBlush', textColor: '#555', borderColor: 'LavenderBlush' }">IGV</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                        <td class="position-relative">
                            <n-tag class="position-absolute top-0 start-0" size="small" :color="{ color: 'Lavender', textColor: '#555', borderColor: 'Lavender' }">DSCT</n-tag>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span>50.00</span></div>
                            </n-space>
                        </td>
                    </tr>
                </tbody>
            </n-table> -->
            <!-- <n-table :bordered="false" :single-line="false" :single-column="true" :bottom-bordered="false">
                <tbody>
                    <tr>
                        <td>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                                <span class="fs-4">Total</span>
                            </n-space>
                        </td>
                        <td>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1" @input="onInput" contenteditable>{{amount.toFixed(2)}}</span></div>
                                <span class="fs-4">Pago</span>
                            </n-space>
                        </td>
                        <td>
                            <n-space align="center" vertical>
                                <div class="fs-5">S/. <span class="fs-1">50.00</span></div>
                                <span class="fs-4">Vuelto</span>
                            </n-space>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <n-space justify="center" align="center">
                                <n-switch />
                                <span>Aplicar Descuento</span>
                                <n-input value="0.00" />
                            </n-space>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <n-space justify="space-between" align="center">
                                <n-text class="fs-6">Pagos Agregados</n-text>
                                <n-button-group>
                                    <n-button color="#87CEFA" ghost round>S/. 10</n-button>
                                    <n-button color="#87CEFA" ghost>S/. 20</n-button>
                                    <n-button color="#87CEFA" ghost>S/. 50</n-button>
                                    <n-button color="#87CEFA" ghost round>S/. 100</n-button>
                                </n-button-group>
                                <n-button type="info" text>
                                    <v-icon name="md-add-round" />
                                    Agregar
                                </n-button>
                            </n-space>
                            <n-table class="fs-1 m-auto text-center" :bordered="false" :single-column="true" :bottom-bordered="false">
                                <tbody>
                                    <tr>
                                        <td>1</td>
                                        <td>Efectivo</td>
                                        <td>S/. 1.00</td>
                                    </tr>
                                </tbody>
                            </n-table>
                        </td>
                    </tr>
                </tbody>
            </n-table> -->
        </n-card>
    </div>
</template>

<script>
import { defineComponent, ref } from "vue"

export default defineComponent({
    name: "TablePayment",
    setup() {
        const doc_type = ref(2)
        const sale_type = ref(1)
        const amount = ref(0.00)
        const docOptions = [
            {
            label: 'BO-001',
            key: 'BO-001',
            },
            {
            label: "BO-002",
            key: "BO-002",
            },
            {
            label: 'BO-003',
            key: 'BO-003',
            },
            {
            label: 'BO-004',
            key: 'BO-004',
            }
        ]

        const onInput = (e) => {
            amount.value = Number(e.target.innerText)
        }

        return {
            doc_type,
            sale_type,
            amount,
            onInput,
            docOptions,
        }
    }
})
</script>

<style>

</style>