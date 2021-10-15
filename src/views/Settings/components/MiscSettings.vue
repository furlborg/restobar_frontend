<template>
    <div id="MiscSettings">
        <n-page-header class="mb-2" @back="handleBack">
            <template #title>
                <n-h1 class="m-0">Configuración de Empresa</n-h1>
            </template>
        </n-page-header>
        <n-grid responsive="screen" cols="12 s:12 m:12 l:12 xl:24 2xl:24" :x-gap="12">
            <n-gi :span="12">
                <n-card title="Configuración de documentos" :segmented="{content:'hard'}">
                    
                </n-card>
            </n-gi>
        </n-grid>
    </div>
</template>

<script>
import { defineComponent } from "vue"
import { useRouter } from "vue-router"

export default defineComponent({
    name: "MiscSettings",
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