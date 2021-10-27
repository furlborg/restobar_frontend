<template>
    <n-modal
        :class="{ 'w-100': genericsStore.device === 'mobile', 'w-75': genericsStore.device === 'tablet','w-50': genericsStore.device === 'desktop' }"
        preset="card"
        title="Crear usuario"
        :show="show"
        :on-close="() => $emit('update:show')"
    >
        <n-spin :show="isLoadingData">
            <n-form>
                <n-tabs type="line">
                    <n-tab-pane name="info" tab="Información General">
                        <n-grid responsive="screen" cols="6 s:6 m:12 l:24 xl:24 2xl:24" :x-gap="12">
                            <n-form-item-gi label="Usuario" :span="6">
                                <n-input />
                            </n-form-item-gi>
                            <n-form-item-gi label="Sucursal" :span="6">
                                <n-select />
                            </n-form-item-gi>
                            <n-form-item-gi label="Perfil" :span="6">
                                <n-select />
                            </n-form-item-gi>
                            <n-form-item-gi label="Serie" :span="6">
                                <n-select />
                            </n-form-item-gi>
                            <n-form-item-gi label="Contraseña" :span="6">
                                <n-input type="password" show-password-on="mousedown" />
                            </n-form-item-gi>
                            <n-form-item-gi label="Confirmar Contraseña" :span="6">
                                <n-input type="password" show-password-on="mousedown" />
                            </n-form-item-gi>
                            <n-form-item-gi label="Corrreo Electrónico" :span="12">
                                <n-input />
                            </n-form-item-gi>
                        </n-grid>
                    </n-tab-pane>
                    <n-tab-pane name="permissions" tab="Permisos">
                        <n-tree block-line cascade checkable :data="permissions" :default-expanded-keys="[1,]" :default-checked-keys="[11, 13, 22, 24]" />
                    </n-tab-pane>
                </n-tabs>
            </n-form>
        </n-spin>
        <template #action>
            <n-space justify="end">
                <n-button type="primary">Crear</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue"
import {useGenericsStore} from '@/store/modules/generics'

export default defineComponent({
    name: "UserSettingsModal",
    emits: [
        'update:show',
        'on-success',
    ],
    props: {
        show : {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const isLoadingData = ref(false)
        const genericsStore = useGenericsStore()
        const permissions = ref([
            {
                label: 'Modulo 1',
                key: 1,
                children: [
                    {
                        label: 'Permiso 1',
                        key: 11
                    },
                    {
                        label: 'Permiso 2',
                        key: 12
                    },
                    {
                        label: 'Permiso 3',
                        key: 13
                    },
                    {
                        label: 'Permiso 4',
                        key: 14
                    },
                ]
            },
            {
                label: 'Modulo 2',
                key: 2,
                children: [
                    {
                        label: 'Permiso 1',
                        key: 21
                    },
                    {
                        label: 'Permiso 2',
                        key: 22
                    },
                    {
                        label: 'Permiso 3',
                        key: 23
                    },
                    {
                        label: 'Permiso 4',
                        key: 24
                    },
                ]
            },
        ])

        return {
            genericsStore,
            isLoadingData,
            permissions,
        }
    }
})
</script>

<style lang="scss" scoped>

</style>