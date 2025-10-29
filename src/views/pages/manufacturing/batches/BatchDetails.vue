<script setup>
import BreadcrumbNav from '@/components/manufacturing/BreadcrumbNav.vue';
import ManufacturingToolbar from '@/components/manufacturing/ManufacturingToolbar.vue';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const batch = ref({});
const loading = ref(true);

const completeDialog = reactive({
    visible: false,
    actual_quantity: null
});

const cancelDialog = reactive({
    visible: false,
    reason: ''
});

// Fetch batch details from the API
const fetchBatch = async () => {
    loading.value = true;
    try {
        const response = await manufacturingService.getBatch(route.params.id);
        batch.value = response.data;
    } catch (error) {
        console.error('Error fetching batch details:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load batch details',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Format status string for display
const formatStatus = (status) => {
    if (!status) return '';
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

//strat batch
const startBatch = async (batch) => {
    //alert(batch.id)
    try {
        loading.value = true;
        const response = await manufacturingService.startBatch(batch.id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Production started successfully', life: 3000 });
        // Refresh data from API
        await fetchBatch();
    } catch (error) {
        console.error('Error starting batch:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to start batch', life: 3000 });
    } finally {
        loading.value = false;
    }
};

// Get severity class for status tag
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

// Helper functions for formatting display values

const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat().format(num);
};

onMounted(() => {
    // Fetch the batch data from the API
    fetchBatch();
});

const completeBatch = () => {
    completeDialog.actual_quantity = batch.value.planned_quantity;
    completeDialog.visible = true;
};

const confirmCompleteBatch = async () => {
    try {
        loading.value = true;
        await manufacturingService.completeBatch(batch.value.id, {
            actual_quantity: completeDialog.actual_quantity
        });

        toast.add({ severity: 'success', summary: 'Success', detail: 'Batch completed successfully', life: 3000 });

        // Refresh data from API
        await fetchBatch();
        completeDialog.visible = false;
    } catch (error) {
        console.error('Error completing batch:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete batch', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const cancelBatch = () => {
    cancelDialog.reason = '';
    cancelDialog.visible = true;
};

const confirmCancelBatch = async () => {
    try {
        await manufacturingService.cancelBatch(batch.value.id, {
            reason: cancelDialog.reason
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.add({ severity: 'success', summary: 'Success', detail: 'Batch cancelled successfully', life: 3000 });

        batch.value.status = 'cancelled';
        batch.value.notes = batch.value.notes ? `${batch.value.notes}\n\nCancellation reason: ${cancelDialog.reason}` : `Cancellation reason: ${cancelDialog.reason}`;

        cancelDialog.visible = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel batch', life: 3000 });
    }
};

const printBatchDetails = () => {
    window.print();
};

const goBack = () => {
    router.push('/manufacturing/batches');
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <!-- Breadcrumb -->
            <BreadcrumbNav :items="[{ label: 'Manufacturing', to: '/manufacturing' }, { label: 'Batches', to: '/manufacturing/batches' }, { label: 'Batch Details' }]" />

            <!-- Toolbar -->
            <ManufacturingToolbar title="Batch Details" icon="pi pi-box">
                <template #actions>
                    <Button label="Back to Batches" icon="pi pi-arrow-left" outlined @click="goBack" class="w-full sm:w-auto" />
                </template>
            </ManufacturingToolbar>

            <div class="card shadow-2 border-round-xl p-4">
                <div v-if="loading" class="flex justify-content-center">
                    <ProgressSpinner />
                </div>

                <div v-else>
                    <!-- Batch Header -->
                    <div class="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between mb-3 gap-3">
                        <div>
                            <div class="text-2xl font-bold">{{ batch.batch_number }}</div>
                            <div class="text-lg text-500">{{ batch.formula_details?.name }} (v{{ batch.formula_details?.version }})</div>
                        </div>
                        <Tag :value="formatStatus(batch.status)" :severity="getStatusSeverity(batch.status)" size="large" />
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-column sm:flex-row justify-content-end mb-4 gap-2">
                        <Button v-if="batch.status === 'planned'" label="Start Production" icon="pi pi-play" class="p-button-raised w-full sm:w-auto" @click="startBatch(batch)" />
                        <Button v-if="batch.status === 'in_progress'" label="Complete Batch" icon="pi pi-check" class="p-button-raised p-button-success w-full sm:w-auto" @click="completeBatch" />
                        <Button v-if="['planned', 'in_progress'].includes(batch.status)" label="Cancel Batch" icon="pi pi-times" severity="danger" outlined class="w-full sm:w-auto" @click="cancelBatch" />
                        <Button icon="pi pi-print" label="Print Details" outlined class="w-full sm:w-auto" @click="printBatchDetails" />
                    </div>

                    <!-- Batch Details Tabs -->
                    <TabView>
                        <TabPanel header="Overview">
                            <div class="grid flex-column md:flex-row gap-3">
                                <!-- Batch Info Column -->
                                <div class="col-12 md:col-6">
                                    <Panel header="Batch Information">
                                        <div class="grid flex-column md:flex-row gap-3">
                                            <div class="col-12 md:col-4 mb-3">
                                                <div class="text-500 font-medium mb-1">Status</div>
                                                <div>{{ formatStatus(batch.status) }}</div>
                                            </div>
                                            <div class="col-12 md:col-4 mb-3">
                                                <div class="text-500 font-medium mb-1">Branch</div>
                                                <div>{{ batch.branch_details?.name }}</div>
                                            </div>
                                            <div class="col-12 md:col-y the     4 mb-3">
                                                <div class="text-500 font-medium mb-1">Scheduled Date</div>
                                                <div>{{ formatDate(batch.scheduled_date) }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Created By</div>
                                                <div>{{ batch.created_by_details?.username }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Supervisor</div>
                                                <div>{{ batch.supervisor_details?.username || 'N/A' }}</div>
                                            </div>
                                            <div class="col-12 mb-3">
                                                <div class="text-500 font-medium mb-1">Notes</div>
                                                <div>{{ batch.notes || 'No notes available' }}</div>
                                            </div>
                                        </div>
                                    </Panel>
                                </div>

                                <!-- Production Info Column -->
                                <div class="col-12 md:col-6">
                                    <Panel header="Production Information">
                                        <div class="grid">
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Planned Quantity</div>
                                                <div>{{ formatNumber(batch.planned_quantity) }} {{ batch.formula_details?.output_unit_details?.title }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Actual Quantity</div>
                                                <div>{{ batch.actual_quantity ? formatNumber(batch.actual_quantity) : 'N/A' }} {{ batch.actual_quantity ? batch.formula_details?.output_unit_details?.title : '' }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Start Date</div>
                                                <div>{{ formatDate(batch.start_date) || 'Not started' }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">End Date</div>
                                                <div>{{ formatDate(batch.end_date) || 'Not completed' }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Raw Material Cost</div>
                                                <div>{{ formatCurrency(batch.raw_material_cost) }}</div>
                                            </div>
                                            <div class="col-12 md:col-6 mb-3">
                                                <div class="text-500 font-medium mb-1">Unit Cost</div>
                                                <div>{{ formatCurrency(batch.unit_cost) }}</div>
                                            </div>
                                        </div>
                                    </Panel>
                                </div>
                            </div>

                            <!-- Product Info -->
                            <Panel header="Product Information" class="mt-3">
                                <div class="grid">
                                    <div class="col-12 md:col-4 mb-3">
                                        <div class="text-500 font-medium mb-1">Product</div>
                                        <div>{{ batch.formula_details?.final_product_details?.product?.title }}</div>
                                    </div>
                                    <div class="col-12 md:col-4 mb-3">
                                        <div class="text-500 font-medium mb-1">Formula</div>
                                        <div>{{ batch.formula_details?.name }} (v{{ batch.formula_details?.version }})</div>
                                    </div>
                                    <div class="col-12 md:col-4 mb-3">
                                        <div class="text-500 font-medium mb-1">Expected Output</div>
                                        <div>{{ formatNumber(batch.formula_details?.expected_output_quantity) }} {{ batch.formula_details?.output_unit_details?.title }}</div>
                                    </div>
                                </div>
                            </Panel>
                        </TabPanel>

                        <TabPanel header="Raw Materials">
                            <DataTable :value="batch.formula_details.ingredients" responsiveLayout="stack" breakpoint="960px" class="p-datatable-sm" stripedRows showGridlines>
                                <Column field="raw_material_details.product.title" header="Material">
                                    <template #body="slotProps">
                                        {{ slotProps.data.raw_material_details?.product?.title || 'N/A' }}
                                    </template>
                                </Column>

                                <Column field="planned_quantity" header="Planned Qty">
                                    <template #body="slotProps"> {{ formatNumber(slotProps.data.planned_quantity) }} {{ slotProps.data.unit_details?.title || '' }} </template>
                                </Column>

                                <Column field="actual_quantity" header="Actual Qty">
                                    <template #body="slotProps">
                                        {{ slotProps.data.actual_quantity ? formatNumber(slotProps.data.actual_quantity) : 'N/A' }}
                                        {{ slotProps.data.actual_quantity ? slotProps.data.unit_details?.title : '' }}
                                    </template>
                                </Column>

                                <Column field="cost" header="Cost">
                                    <template #body="slotProps">
                                        {{ formatCurrency(slotProps.data.cost) }}
                                    </template>
                                </Column>

                                <Column field="notes" header="Notes">
                                    <template #body="slotProps">
                                        {{ slotProps.data.notes || '-' }}
                                    </template>
                                </Column>
                            </DataTable>
                        </TabPanel>

                        <TabPanel header="Quality Checks">
                            <div v-if="batch.quality_checks && batch.quality_checks.length">
                                <DataTable :value="batch.quality_checks" responsiveLayout="scroll" class="p-datatable-sm">
                                    <Column field="check_date" header="Date">
                                        <template #body="slotProps">
                                            <Tag :value="formatDate(slotProps.data.check_date)" :severity="slotProps.data.result === 'pass' ? 'success' : 'danger'" />
                                        </template>
                                    </Column>
                                    <Column field="result" header="Status">
                                        <template #body="slotProps">
                                            <Tag :value="slotProps.data.result" :severity="slotProps.data.result === 'pass' ? 'success' : 'danger'" />
                                        </template>
                                    </Column>
                                    <Column field="inspector_name" header="Checked By" />
                                    <Column field="check_date" header="Checked On">
                                        <template #body="slotProps">
                                            {{ formatDate(slotProps.data.check_date) }}
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                            <div v-else class="p-3 text-center text-500">No quality checks recorded for this batch</div>
                        </TabPanel>
                    </TabView>
                </div>

                <!-- Complete Batch Dialog -->
                <Dialog v-model:visible="completeDialog.visible" header="Complete Batch" modal style="width: 30vw" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" class="p-dialog-md">
                    <div class="flex flex-column gap-3">
                        <div>Enter the actual quantity produced:</div>
                        <InputNumber v-model="completeDialog.actual_quantity" :min="0" :max="batch.planned_quantity * 1.2" class="w-full" />
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" outlined @click="completeDialog.visible = false" />
                        <Button label="Complete Batch" icon="pi pi-check" @click="confirmCompleteBatch" :disabled="!completeDialog.actual_quantity" />
                    </template>
                </Dialog>

                <!-- Cancel Batch Dialog -->
                <Dialog v-model:visible="cancelDialog.visible" header="Cancel Batch" modal style="width: 30vw" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" class="p-dialog-md">
                    <div class="flex flex-column gap-3">
                        <div>Are you sure you want to cancel this batch?</div>
                        <div>
                            <label for="cancel_reason" class="block mb-2">Reason (optional):</label>
                            <Textarea id="cancel_reason" v-model="cancelDialog.reason" rows="3" class="w-full" />
                        </div>
                    </div>
                    <template #footer>
                        <Button label="No, Keep Batch" icon="pi pi-times" outlined @click="cancelDialog.visible = false" />
                        <Button label="Yes, Cancel Batch" icon="pi pi-check" class="p-button-danger" @click="confirmCancelBatch" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>
