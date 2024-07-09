<script setup>

import OrdersAnulate from "@/views/Anulate/ordersAnulate.vue";
import SalesAnulate from "@/views/Anulate/salesAnulate.vue";
</script>

<template>
    <n-card size="small" >
        <h2 style="margin: 5px">Ventas y ordenes anuladas</h2>
        <n-tabs type="line" default-value="sale's">
            <n-tab-pane name="sale's" tab="Ventas Anuladas">
                <sales-anulate/>
            </n-tab-pane>
            <n-tab-pane name="orders" tab="Ordenes Anuladas">
                <orders-anulate/>
            </n-tab-pane>
        </n-tabs>
    </n-card>
</template>