<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrency } from '@/utils/formatters.js';
import { formatCurrency, formatDate } from '@/utils/formatters';

const toast = useToast();
const props = defineProps({
    locationId: {
        type: Number,
        default: null
    }
});

const emit = defineEmits(['close']);

// Data
const movements = ref([]);
const loading = ref(false);
const selectedDays = ref(30);
const selectedType = ref(null);

// Options
const daysOptions = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
    { label: 'Last year', value: 365 }
];

const typeOptions = [
    { label: 'All Types', value: null },
    { label: 'Purchases', value: 'PURCHASE' },
    { label: 'Sales', value: 'SALE' },
    { label: 'Returns', value: 'RETURN' },
    { label: 'Adjustments', value: 'ADJUSTMENT' },
    { label: 'Transfers', value: 'TRANSFER' }
];

// Methods
const fetchMovements = async () => {
    try {
        loading.value = true;
        movements.value = [];

        const params = {
            days: selectedDays.value
        };

        if (props.branchCode) params.branch_code = props.branchCode;
        if (selectedType.value) params.type = selectedType.value;

        const response = await inventoryService.getStockMovement(params);

        // Ensure the response data is properly formatted
        movements.value = response.data.map((item) => ({
            date: item.date,
            type: item.type,
            quantity: item.quantity
        }));
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load stock movements',
            life: 3000
        });
        console.error('Error fetching stock movements:', error);
    } finally {
        loading.value = false;
    }
};

const exportData = () => {
    // Implementation for exporting data
    console.log('Export functionality to be implemented');
};

const getTypeSeverity = (type) => {
    switch (type) {
        case 'PURCHASE':
            return 'info';
        case 'SALE':
            return 'success';
        case 'ADJUSTMENT':
            return 'warning';
        case 'TRANSFER':
            return 'help';
        default:
            return null;
    }
};

// Lifecycle
onMounted(() => {
    fetchMovements();
});
</script>

<template>
    <div class="stock-movements">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-4">
                <Dropdown v-model="selectedDays" :options="daysOptions" optionLabel="label" optionValue="value" placeholder="Last 30 days" @change="fetchMovements" />

                <Dropdown v-model="selectedType" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="All Types" @change="fetchMovements" />
            </div>

            <Button icon="pi pi-download" label="Export" class="p-button-outlined p-button-sm" @click="exportData" />
        </div>

        <DataTable
            :value="movements"
            :paginator="true"
            :rows="10"
            :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        >
            <Column field="date" header="Date" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
            </Column>

            <Column field="type" header="Type" sortable>
                <template #body="{ data }">
                    <Tag :value="data.type" :severity="getTypeSeverity(data.type)" />
                </template>
            </Column>

            <Column field="quantity" header="Quantity" sortable>
                <template #body="{ data }">
                    <Tag :value="data.quantity" :severity="data.quantity > 0 ? 'success' : 'danger'" />
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-end mt-4">
            <Button label="Close" @click="$emit('close')" class="p-button-text" />
        </div>
    </div>
</template>

<style scoped>
.stock-movements {
    padding: 1rem;
}

:deep(.p-datatable) {
    font-size: 0.9rem;
}

:deep(.p-datatable-tbody td) {
    padding: 0.5rem 1rem;
}
</style>
