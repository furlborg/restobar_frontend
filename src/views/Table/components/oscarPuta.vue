<script setup>
import { ref } from "vue";

const props = defineProps({
    infoTable: Object,
    itemIndex: Number,
    showModal: Boolean
});

const emit = defineEmits(["update:itemIndex", "update:showModal"]);

const orderList = ref([...props.infoTable.ordersData]);

function changeWebadasNoseWe(index) {
    emit("update:itemIndex", index);
    emit("update:showModal", true);
}

function handleDeleteOrder(order, index) {
    if (!order.id) {
        orderList.value.splice(index, 1);
        props.infoTable.nullifyTableOrder();
    } else {
        props.infoTable?.deleteOrderDetail(index, order.id);
    }
}

defineExpose({ orderList });

</script>

<template>
    <n-table size="small">
        <thead>
        <tr>
            <th style="width: 5%"></th>
            <th style="width: 45%">Producto</th>
            <th style="width: 25%">Cantidad</th>
            <th style="width: 15%">SubTotal</th>
            <th style="width: 10%"></th>
        </tr>
        </thead>
        <tbody>
        <template v-for="(order, index) in props.infoTable.ordersData" :key="`${index}`">
            <tr v-if="order.quantity > 0" style="cursor: pointer" @click="changeWebadasNoseWe(index)">
                <td>
                    <n-button v-if="!($route.name === 'TablePayment')" type="info" text size="small">
                        <v-icon name="md-listalt-round"/>
                    </n-button>
                </td>
                <td>
                    <span> {{ order.product_name }} </span><br>
                    <span style="font-size: 11px;">{{ order.modified }} </span>
                </td>
                <td>
                    <n-input-number v-if="!($route.name === 'TablePayment')" class="border-top-0" size="small" @click.stop
                                    :min="order.id ? props.infoTable.saleStore.getOrderQuantity(order.id) : 1"
                                    v-model:value="order.quantity"/>
                    <template v-else>
                        {{ order.quantity }}
                    </template>
                </td>
                <td>S/. {{ order.subTotal.toFixed(2) }}</td>
                <td>
                    <n-button v-if="!($route.name === 'TablePayment')" type="error" text @click.stop="handleDeleteOrder(order, index)">
                        <v-icon name="md-disabledbydefault-round"/>
                    </n-button>
                </td>
            </tr>
        </template>
        </tbody>
    </n-table>
</template>
