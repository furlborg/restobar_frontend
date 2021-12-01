<template>
    <n-grid cols="3" :x-gap="6" :y-gap="6">
        <n-gi v-for="index in 24" :key="index">
            <router-link class="text-decoration-none" :to="{name: 'WOrder', params: {table: index}}">
                <n-card>
                    <n-space align="center" :size="0" vertical>
                        <img src="~@/assets/images/default-table.png" alt="" width="64" height="64" />
                        <n-text>MESA {{index}}</n-text>
                    </n-space>
                </n-card>
            </router-link>
        </n-gi>
    </n-grid>
</template>

<script>
import { defineComponent } from "vue"

export default defineComponent({
    name: 'WHome',
    setup() {


        return {}
    }
})
</script>

<style>

</style>