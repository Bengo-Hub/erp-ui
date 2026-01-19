<script setup>
import { inventoryService } from '@/services/ecommerce/inventoryService';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { useToast } from '@/composables/useToast';
import { onMounted, ref } from 'vue';

const { formatCurrencySync } = useGlobalCurrency();

// Helper function for currency formatting
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

const { showError } = useToast();

const props = defineProps({
    locationId: {
        type: Number,
        default: null
    }
});

const emit = defineEmits(['close']);

const valuationData = ref({
    total_valuation: 0,
    valuation_by_category: []
});

const loading = ref(false);

// Helper functions
const fetchValuation = async () => {
    try {
        loading.value = true;
        const params = {};
        if (props.branchCode) params.branch_code = props.branchCode;

        const response = await inventoryService.getStockValuation(params);
        valuationData.value = response.data;
    } catch (error) {
        handleError('Error fetching valuation', error);
    } finally {
        loading.value = false;
    }
};

const handleError = (message, error) => {
    console.error(message, error);
    showError('Failed to fetch stock valuation data.');
};

// Lifecycle
onMounted(() => {
    fetchValuation();
});
</script>

<template>
    <div class="stock-valuation">
        <div class="grid">
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Total Valuation</template>
                    <template #content>
                        <div class="text-center py-4">
                            <div class="text-4xl font-bold text-primary">
                                {{ formatCurrency(valuationData.total_valuation) }}
                            </div>
                            <div class="text-sm text-gray-500 mt-2">Current stock value at cost price</div>
                        </div>
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Valuation by Category</template>
                    <template #content>
                        <DataTable :value="valuationData.valuation_by_category" :rows="5" scrollable scrollHeight="200px">
                            <Column field="product__category__name" header="Category"></Column>
                            <Column field="category_value" header="Value">
                                <template #body="{ data }">
                                    {{ formatCurrency(data.category_value) }}
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <div class="flex justify-end mt-4">
            <Button label="Close" @click="$emit('close')" class="p-button-text" />
        </div>
    </div>
</template>
