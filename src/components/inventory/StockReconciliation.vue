<script setup>
import { inventoryService } from '@/services/ecommerce/inventoryService';
import { formatCurrency } from '@/utils/formatters.js';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
    branchId: {
        type: Number,
        default: null
    }
});

const emit = defineEmits(['close']);

const toast = useToast();

// Data
const reconciliationItems = ref([]);
const loading = ref(false);
const reconciliationDate = ref(new Date());
const reconciliationNotes = ref('');

const adjustmentTypes = [
    { label: 'Increase Stock', value: 'increase' },
    { label: 'Decrease Stock', value: 'decrease' }
];

// Computed properties
const hasDiscrepancies = computed(() => {
    return reconciliationItems.value.some((item) => item.difference !== 0);
});

const totalDiscrepancies = computed(() => {
    return reconciliationItems.value.reduce((sum, item) => sum + Math.abs(item.difference), 0);
});

const totalDiscrepancyValue = computed(() => {
    return reconciliationItems.value.reduce((sum, item) => sum + (Math.abs(item.difference) * item.buying_price, 0), 0);
});

const itemsToAdjust = computed(() => {
    return reconciliationItems.value.filter((item) => item.difference !== 0).length;
});

// Methods
const fetchStockItems = async () => {
    try {
        loading.value = true;
        const params = {};
        if (props.branchId) params.branch_code = props.branchId;

        const response = await inventoryService.getStockInventory(params);

        reconciliationItems.value = response.data.results.map((item) => ({
            ...item,
            physical_count: item.stock_level,
            difference: 0,
            adjustment_type: 'increase',
            reason: ''
        }));
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch stock items',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const calculateDiscrepancy = (item) => {
    item.difference = item.physical_count - item.stock_level;
};

const getDiscrepancySeverity = (difference) => {
    if (difference > 0) return 'success';
    if (difference < 0) return 'danger';
    return 'info';
};

const saveReconciliation = async () => {
    try {
        loading.value = true;

        const adjustments = reconciliationItems.value
            .filter((item) => item.difference !== 0)
            .map((item) => ({
                stock_item: item.id,
                adjustment_type: item.adjustment_type,
                quantity_adjusted: Math.abs(item.difference),
                reason: item.reason || 'Stock reconciliation',
                branch: props.branchId || item.branch?.id
            }));

        await inventoryService.saveReconciliation({
            date: reconciliationDate.value,
            notes: reconciliationNotes.value,
            adjustments
        });

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Stock reconciliation saved successfully',
            life: 3000
        });
        emit('close');
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save reconciliation',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const exportTemplate = () => {
    const header = ['Product', 'Variation', 'Branch', 'System Qty', 'Physical Count'];
    const data = reconciliationItems.value.map((item) => [item.product.name, item.variation?.name || 'N/A', item.branch?.name || 'N/A', item.stock_level, '']);

    const csvContent = [header.join(','), ...data.map((row) => row.join(','))].join('\n');

    // Using native browser API
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Lifecycle hooks
onMounted(() => {
    fetchStockItems();
});
</script>

<template>
    <div class="stock-reconciliation">
        <div class="grid">
            <div class="col-12">
                <Card>
                    <template #title>
                        <div class="flex justify-between items-center">
                            <span>Stock Reconciliation</span>
                            <div class="flex gap-2">
                                <Button label="Save Reconciliation" icon="pi pi-save" :disabled="!hasDiscrepancies" @click="saveReconciliation" />
                                <Button icon="pi pi-file-excel" label="Export Template" class="p-button-outlined" @click="exportTemplate" />
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <div class="mb-4">
                            <div class="flex items-center gap-4">
                                <div class="field">
                                    <label class="block font-medium mb-2">Reconciliation Date</label>
                                    <Calendar v-model="reconciliationDate" dateFormat="yy-mm-dd" showIcon />
                                </div>
                                <div class="field">
                                    <label class="block font-medium mb-2">Notes</label>
                                    <InputText v-model="reconciliationNotes" placeholder="Enter reconciliation notes..." class="w-full" />
                                </div>
                            </div>
                        </div>

                        <DataTable :value="reconciliationItems" :loading="loading" stripedRows responsiveLayout="scroll">
                            <Column field="product.title" header="Product">
                                <template #body="{ data }">
                                    <div class="flex items-center gap-2">
                                        <img v-if="data.product?.images" :src="data.product?.images[0]?.image" :alt="data.product.title" class="w-8 h-8 rounded-full object-cover" />
                                        <span>{{ data.product.title }}</span>
                                        <Tag v-if="data.variation" :value="data.variation.name" severity="info" class="text-xs" />
                                    </div>
                                </template>
                            </Column>
                            <Column field="branch.name" header="Branch" />
                            <Column field="stock_level" header="System Qty">
                                <template #body="{ data }">
                                    <Tag :value="data.stock_level" />
                                </template>
                            </Column>
                            <Column header="Physical Count">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.physical_count" mode="decimal" :min="0" class="w-full" @update:modelValue="calculateDiscrepancy(data)" />
                                </template>
                            </Column>
                            <Column header="Difference">
                                <template #body="{ data }">
                                    <Tag :value="data.difference" :severity="getDiscrepancySeverity(data.difference)" />
                                </template>
                            </Column>
                            <Column header="Adjustment Type" v-if="hasDiscrepancies">
                                <template #body="{ data }">
                                    <Dropdown v-model="data.adjustment_type" :options="adjustmentTypes" optionLabel="label" optionValue="value" class="w-full" :disabled="data.difference === 0" />
                                </template>
                            </Column>
                            <Column header="Reason" v-if="hasDiscrepancies">
                                <template #body="{ data }">
                                    <InputText v-model="data.reason" placeholder="Enter reason..." class="w-full" :disabled="data.difference === 0" />
                                </template>
                            </Column>
                        </DataTable>

                        <div v-if="hasDiscrepancies" class="mt-4 p-4 border-round bg-gray-100">
                            <div class="grid">
                                <div class="col-12 md:col-4">
                                    <div class="text-sm font-medium">Total Discrepancies:</div>
                                    <div class="text-xl font-bold">{{ totalDiscrepancies }}</div>
                                </div>
                                <div class="col-12 md:col-4">
                                    <div class="text-sm font-medium">Value of Discrepancies:</div>
                                    <div class="text-xl font-bold">{{ formatCurrency(totalDiscrepancyValue) }}</div>
                                </div>
                                <div class="col-12 md:col-4">
                                    <div class="text-sm font-medium">Items to Adjust:</div>
                                    <div class="text-xl font-bold">{{ itemsToAdjust }}</div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stock-reconciliation {
    padding: 1rem;
}

:deep(.p-datatable) {
    font-size: 0.9rem;
}

:deep(.p-datatable-tbody td) {
    padding: 0.5rem 1rem;
}
</style>
