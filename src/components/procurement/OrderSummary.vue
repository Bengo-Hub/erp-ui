<script setup>
import { formatCurrency } from '@/utils/formatters';
const props = defineProps({
    order: {
        type: Object,
        required: true
    }
});
</script>

<template>
    <Card>
        <template #title>Order Summary</template>
        <template #content>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{{ formatCurrency(order.subtotal) }}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax ({{ order.taxRate }}%):</span>
                    <span>{{ formatCurrency(order.taxAmount) }}</span>
                </div>
                <Divider />
                <div class="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{{ formatCurrency(order.grandTotal) }}</span>
                </div>
            </div>
        </template>
    </Card>
</template>
