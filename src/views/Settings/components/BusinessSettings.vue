<template>
  <div id="BusinessSettings">
        <n-page-header class="mb-2" @back="handleBack">
            <template #title>
                <n-h1 class="m-0">Configuración de Empresa</n-h1>
            </template>
        </n-page-header>
        <n-grid responsive="screen" cols="12 s:12 m:12 l:12 xl:24 2xl:24" :x-gap="12">
            <n-gi :span="12">
                <n-card title="Información de la empresa" :segmented="{content:'hard'}">
                    <n-form>
                        <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:18 2xl:18" :x-gap="12" :y-gap="12">
                            <n-form-item-gi :span="6" label="RUC">
                                <n-input :maxlength="11" show-count />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Nombre">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Nombre Comercial">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Dirección">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Representante legal">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Celular">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Email">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="Sitio web">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi :span="6" label="URL CPE">
                                <n-input />
                            </n-form-item-gi>
                        </n-grid>
                    </n-form>
                    <template #action>
                        <n-space justify="end">
                            <n-button type="warning">Guardar</n-button>
                        </n-space>
                    </template>
                </n-card>
            </n-gi>
            <n-gi :span="12">
                <n-card title="Sucursales" :segmented="{content:'hard'}">
                    <template #header-extra>
                        <n-button type="success">Agregar</n-button>
                    </template>
                    <n-collapse accordion>
                        <n-collapse-item title="Sucursal 1">
                            <n-form>
                                <n-grid responsive="screen" cols="12 s:12 m:12 l:12 xl:24 2xl:24" :x-gap="12">
                                    <n-form-item-gi :span="12" label="Descripción">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="6" label="Celular">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="6" label="Email">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Dirección fiscal">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Dirección comercial">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Sitio web">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Información adicional">
                                        <n-input type="textarea" />
                                    </n-form-item-gi>
                                </n-grid>
                                <n-space justify="end">
                                    <n-button type="warning">Guardar</n-button>
                                </n-space>
                            </n-form>
                        </n-collapse-item>
                        <n-collapse-item title="Sucursal 2">
                            <n-form>
                                <n-grid responsive="screen" cols="12 s:12 m:12 l:12 xl:24 2xl:24" :x-gap="12">
                                    <n-form-item-gi :span="12" label="Descripción">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="6" label="Celular">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="6" label="Email">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Dirección fiscal">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Dirección comercial">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Sitio web">
                                        <n-input />
                                    </n-form-item-gi>
                                    <n-form-item-gi :span="12" label="Información adicional">
                                        <n-input type="textarea" />
                                    </n-form-item-gi>
                                </n-grid>
                                <n-space justify="end">
                                    <n-button type="warning">Guardar</n-button>
                                </n-space>
                            </n-form>
                        </n-collapse-item>
                    </n-collapse>
                </n-card>
            </n-gi>
        </n-grid>
  </div>
</template>

<script>
import { defineComponent } from "vue"
import { useRouter } from "vue-router"

export default defineComponent({
    name: "BusinessSettings",
    setup() {
        const router = useRouter()

        const handleBack = () => {
            router.push({ name: "HomeSettings" })
        }

        return {
            handleBack,
        }
    }
})
</script>

<style>

</style>