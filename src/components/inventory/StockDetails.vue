<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const { formatCurrencySync } = useGlobalCurrency();

// Helper function for currency formatting
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

const props = defineProps({
    stockItem: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close', 'updated']);

// Helper functions
const getAvailabilitySeverity = (availability) => {
    switch (availability) {
        case 'In Stock':
            return 'success';
        case 'Out of Stock':
            return 'danger';
        case 'Re-Order':
            return 'warning';
        default:
            return 'info';
    }
};

const viewHistory = () => {
    emit('updated', {
        action: 'viewHistory',
        stockItem: props.stockItem
    });
};
</script>

<template>
    <div class="stock-details">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">Stock Details</h3>
            <Button icon="pi pi-times" @click="$emit('close')" class="p-button-rounded p-button-text p-button-sm" />
        </div>

        <div class="grid">
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <div class="p-2 border-round bg-gray-100">{{ stockItem.product?.title }}</div>
                </div>

                <div class="field mt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Variation</label>
                    <div class="p-2 border-round bg-gray-100">
                        {{ stockItem.variation ? stockItem?.variation?.title : 'N/A' }}
                    </div>
                </div>

                <div class="field mt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                            <div class="p-2 border-round bg-gray-100">{{ stockItem?.branch?.name }}</div>
                </div>
            </div>

            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <div class="p-2 border-round bg-gray-100">{{ stockItem.stock_level }}</div>
                </div>

                <div class="field mt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <div class="p-2 border-round bg-gray-100">{{ stockItem.reorder_level }}</div>
                </div>

                <div class="field mt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Tag :value="stockItem.availability" :severity="getAvailabilitySeverity(stockItem.availability)" />
                </div>
            </div>
        </div>

        <Divider />

        <h4 class="text-lg font-medium mb-3">Pricing</h4>
        <div class="grid">
            <div class="col-12 md:col-4">
                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buying Price</label>
                    <div class="p-2 border-round bg-gray-100">{{ formatCurrency(stockItem.buying_price) }}</div>
                </div>
            </div>
            <div class="col-12 md:col-4">
                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <div class="p-2 border-round bg-gray-100">{{ formatCurrency(stockItem.selling_price) }}</div>
                </div>
            </div>
            <div class="col-12 md:col-4">
                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Profit Margin</label>
                    <div class="p-2 border-round bg-gray-100">{{ formatCurrency(stockItem.profit_margin) }}</div>
                </div>
            </div>
        </div>

        <Divider />

        <div class="flex justify-end gap-2 mt-4">
            <Button label="View History" icon="pi pi-history" class="p-button-outlined p-button-sm" @click="viewHistory" />
            <Button label="Close" @click="$emit('close')" class="p-button-text p-button-sm" />
        </div>
    </div>
</template>

<style scoped>
.stock-details {
    padding: 1rem;
}

.field {
    margin-bottom: 1rem;
}
</style>
