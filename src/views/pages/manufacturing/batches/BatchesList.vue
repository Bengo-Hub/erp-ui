<script setup>
import { useToast } from '@/composables/useToast';
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import { manufacturingService } from '@/services/manufacturingService';
import { useConfirm } from 'primevue/useconfirm';
import BreadcrumbNav from '@/components/manufacturing/BreadcrumbNav.vue';
import ManufacturingToolbar from '@/components/manufacturing/ManufacturingToolbar.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const router = useRouter();
const confirm = useConfirm();
const batches = ref([]);
const selectedBatches = ref([]);
const loading = ref(false);
const dateRange = ref(null);

// Status options for filter
const statusOptions = ref([
    { name: 'All Statuses', value: null },
    { name: 'Planned', value: 'planned' },
    { name: 'In Progress', value: 'in_progress' },
    { name: 'Completed', value: 'completed' },
    { name: 'Cancelled', value: 'cancelled' },
    { name: 'Failed', value: 'failed' }
]);

// Filters
const filters = reactive({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    'formula_details.name': { value: null, matchMode: FilterMatchMode.CONTAINS },
    scheduled_date: { value: null, matchMode: FilterMatchMode.DATE_IS }
});

// Dialog states
const completeDialog = reactive({
    visible: false,
    batch: null,
    planned_quantity: 0,
    actual_quantity: null,
    notes: ''
});

const cancelDialog = reactive({
    visible: false,
    batch: null,
    reason: ''
});

// Fetch batches
const fetchBatches = async () => {
    loading.value = true;
    try {
        // Fetch real data from the API
        const response = await manufacturingService.getBatches({
            status: filters.status.value,
            date_from: dateRange.value && dateRange.value[0] ? dateRange.value[0].toISOString() : null,
            date_to: dateRange.value && dateRange.value[1] ? dateRange.value[1].toISOString() : null
        });
        batches.value = response.data.results || [];
    } catch (error) {
        console.error('Error fetching batches:', error);
        showToast('error', 'Error', 'Failed to load batches', 3000);
    } finally {
        loading.value = false;
    }
};

// Filter handling
const onFilterChange = () => {
    fetchBatches();
};

const onDateSelect = () => {
    if (dateRange.value && dateRange.value[1]) {
        fetchBatches();
    }
};

// Navigation functions
const navigateToNewBatch = () => {
    router.push('/manufacturing/batches/new');
};

const viewBatchDetails = (batch) => {
    router.push(`/manufacturing/batches/${batch.id}`);
};

// Batch operations
const startBatch = (batch) => {
    confirm.require({
        message: `Start production for batch ${batch.batch_number}?`,
        header: 'Start Batch',
        icon: 'pi pi-play',
        accept: async () => {
            try {
                // In a real app, would call the API
                // await manufacturingService.startBatch(batch.id);
                showToast('success', 'Success', `Batch ${batch.batch_number} started successfully`, 3000);
                await fetchBatches();
            } catch (error) {
                console.error('Error starting batch:', error);
                showToast('error', 'Error', 'Failed to start batch', 3000);
            }
        }
    });
};

const completeBatch = (batch) => {
    completeDialog.batch = batch;
    completeDialog.planned_quantity = batch.planned_quantity;
    completeDialog.actual_quantity = batch.planned_quantity;
    completeDialog.notes = '';
    completeDialog.visible = true;
};

const confirmCompleteBatch = async () => {
    try {
        await manufacturingService.completeBatch(completeDialog.batch.id, {
            actual_quantity: completeDialog.actual_quantity,
            notes: completeDialog.notes
        });

        // For demonstration, update local state
        const updatedBatch = {
            ...completeDialog.batch,
            status: 'completed',
            end_date: new Date().toISOString(),
            actual_quantity: completeDialog.actual_quantity,
            unit_cost: 75.5 // Mock unit cost calculation
        };

        // Update the batches array with the modified batch
        const index = batches.value.findIndex((b) => b.id === completeDialog.batch.id);
        if (index !== -1) {
            batches.value[index] = updatedBatch;
            // Create a new array reference to trigger reactivity
            batches.value = [...batches.value];
        }

        showToast('success', 'Success', `Batch ${completeDialog.batch.batch_number} has been completed`, 3000);

        completeDialog.visible = false;
        resetCompleteDialog();
    } catch (error) {
        console.error('Error completing batch:', error);
        showToast('error', 'Error', 'Failed to complete batch', 3000);
    }
};

function resetCompleteDialog() {
    completeDialog.batch = null;
    completeDialog.actual_quantity = null;
    completeDialog.notes = null;
}

const cancelBatch = (batch) => {
    cancelDialog.batch = batch;
    cancelDialog.reason = '';
    cancelDialog.visible = true;
};

const confirmCancelBatch = async () => {
    try {
        // In a real app, would call the API
        // await manufacturingService.cancelBatch(cancelDialog.batch.id, {
        //   cancellation_reason: cancelDialog.reason
        // });

        // For demonstration, update local state
        const updatedBatch = { ...cancelDialog.batch, status: 'cancelled' };

        // Update the batches array with the modified batch
        const index = batches.value.findIndex((b) => b.id === cancelDialog.batch.id);
        if (index !== -1) {
            batches.value[index] = updatedBatch;
            // Create a new array reference to trigger reactivity
            batches.value = [...batches.value];
        }

        showToast('success', 'Success', `Batch ${cancelDialog.batch.batch_number} has been cancelled`, 3000);

        cancelDialog.visible = false;
    } catch (error) {
        console.error('Error cancelling batch:', error);
        showToast('error', 'Error', 'Failed to cancel batch', 3000);
    }
};

// Helper functions
const formatStatus = (status) => {
    if (!status) return '';
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'planned':
            return 'info';
        case 'in_progress':
            return 'warning';
        case 'completed':
            return 'success';
        case 'cancelled':
            return 'secondary';
        case 'failed':
            return 'danger';
        default:
            return 'info';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat().format(num);
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    }).format(value);
};

onMounted(() => {
    // Fetch real data from the API
    fetchBatches();
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <!-- Breadcrumb -->
            <BreadcrumbNav :items="[{ label: 'Manufacturing', to: '/manufacturing' }, { label: 'Batches' }]" />

            <!-- Toolbar -->
            <ManufacturingToolbar title="Production Batches" icon="pi pi-box">
                <template #actions>
                    <Dropdown v-model="filters.status.value" :options="statusOptions" optionLabel="name" optionValue="value" placeholder="Filter by Status" class="w-full sm:w-auto mr-2" @change="onFilterChange" />
                    <Calendar v-model="dateRange" selectionMode="range" placeholder="Date Range" class="w-full sm:w-auto mr-2" @date-select="onDateSelect" />
                    <Button label="New Batch" icon="pi pi-plus" class="p-button-raised w-full sm:w-auto" @click="navigateToNewBatch" />
                </template>
            </ManufacturingToolbar>

            <div class="card shadow-2 border-round-xl p-4">
                <DataTable
                    :value="batches"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} batches"
                    responsiveLayout="stack"
                    breakpoint="960px"
                    class="p-datatable-sm"
                    v-model:selection="selectedBatches"
                    :loading="loading"
                    stripedRows
                    showGridlines
                >
                    <Column selectionMode="multiple" headerStyle="width: 3rem" />

                    <Column field="batch_number" header="Batch #" sortable style="width: 140px">
                        <template #body="slotProps">
                            <router-link :to="'/manufacturing/batches/' + slotProps.data.id">
                                {{ slotProps.data.batch_number }}
                            </router-link>
                        </template>
                    </Column>

                    <Column field="formula_details.name" header="Formula" sortable>
                        <template #body="slotProps">
                            <span class="font-medium">{{ slotProps.data.formula_details?.name || 'N/A' }}</span>
                            <span v-if="slotProps.data.formula_details?.version" class="text-sm text-500 ml-2"> v{{ slotProps.data.formula_details?.version }} </span>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable style="width: 120px">
                        <template #body="slotProps">
                            <Tag :value="formatStatus(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>

                    <Column field="scheduled_date" header="Scheduled Date" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.scheduled_date) }}
                        </template>
                    </Column>

                    <Column field="start_date" header="Started" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.start_date) }}
                        </template>
                    </Column>

                    <Column field="end_date" header="Completed" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.end_date) }}
                        </template>
                    </Column>

                    <Column field="planned_quantity" header="Planned Qty" sortable>
                        <template #body="slotProps">
                            {{ formatNumber(slotProps.data.planned_quantity) }}
                        </template>
                    </Column>

                    <Column field="actual_quantity" header="Actual Qty" sortable>
                        <template #body="slotProps">
                            {{ formatNumber(slotProps.data.actual_quantity) }}
                        </template>
                    </Column>

                    <Column field="unit_cost" header="Unit Cost" sortable>
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.unit_cost) }}
                        </template>
                    </Column>

                    <Column header="Actions" style="min-width: 130px">
                        <template #body="slotProps">
                            <div class="flex flex-wrap gap-2">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" tooltip="View Details" tooltipOptions="{position:'top'}" @click="viewBatchDetails(slotProps.data)" />

                                <Button
                                    v-if="slotProps.data.status === 'planned'"
                                    icon="pi pi-play"
                                    class="p-button-rounded p-button-success p-button-text p-button-sm"
                                    tooltip="Start Batch"
                                    tooltipOptions="{position:'top'}"
                                    @click="startBatch(slotProps.data)"
                                />

                                <Button
                                    v-if="slotProps.data.status === 'in_progress'"
                                    icon="pi pi-check"
                                    class="p-button-rounded p-button-success p-button-text p-button-sm"
                                    tooltip="Complete Batch"
                                    tooltipOptions="{position:'top'}"
                                    @click="completeBatch(slotProps.data)"
                                />

                                <Button
                                    v-if="['planned', 'in_progress'].includes(slotProps.data.status)"
                                    icon="pi pi-times"
                                    class="p-button-rounded p-button-danger p-button-text p-button-sm"
                                    tooltip="Cancel Batch"
                                    tooltipOptions="{position:'top'}"
                                    @click="cancelBatch(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Complete Batch Dialog -->
        <Dialog v-model:visible="completeDialog.visible" :header="'Complete Batch ' + completeDialog.batch?.batch_number" modal style="width: 30vw" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" class="p-dialog-md">
            <div class="flex flex-column gap-3">
                <div class="field">
                    <label for="actual_quantity" class="font-bold">Actual Quantity Produced</label>
                    <InputNumber id="actual_quantity" v-model="completeDialog.actual_quantity" :min="0" :max="completeDialog.planned_quantity * 1.2" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" style="width: 100%" />
                    <small>Planned quantity: {{ formatNumber(completeDialog.planned_quantity) }}</small>
                </div>

                <div class="field">
                    <label for="completion_notes" class="font-bold">Notes</label>
                    <Textarea id="completion_notes" v-model="completeDialog.notes" rows="3" style="width: 100%" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="completeDialog.visible = false" />
                <Button label="Complete Batch" icon="pi pi-check" @click="confirmCompleteBatch" :disabled="!completeDialog.actual_quantity" />
            </template>
        </Dialog>

        <!-- Cancel Batch Dialog -->
        <Dialog v-model:visible="cancelDialog.visible" :header="'Cancel Batch ' + cancelDialog.batch?.batch_number" modal style="width: 30vw" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" class="p-dialog-md">
            <div class="flex flex-column gap-3">
                <div class="field">
                    <label for="cancel_reason" class="font-bold">Reason for Cancellation</label>
                    <Textarea id="cancel_reason" v-model="cancelDialog.reason" rows="3" style="width: 100%" />
                </div>
            </div>

            <template #footer>
                <Button label="No, Keep Batch" icon="pi pi-times" class="p-button-text" @click="cancelDialog.visible = false" />
                <Button label="Yes, Cancel Batch" icon="pi pi-check" class="p-button-danger" @click="confirmCancelBatch" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.p-datatable .p-datatable-thead > tr > th {
    background-color: #f8f9fa;
}

.p-datatable .p-datatable-tbody > tr {
    transition: background-color 0.2s;
}

.p-datatable .p-datatable-tbody > tr:hover {
    background-color: #f8f9fa;
}

/* Responsive styles */
@media screen and (max-width: 640px) {
    .p-calendar {
        width: 100%;
        margin-bottom: 0.5rem;
    }

    .p-dropdown {
        width: 100%;
        margin-bottom: 0.5rem;
    }

    .p-button.p-button-raised {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}
</style>
