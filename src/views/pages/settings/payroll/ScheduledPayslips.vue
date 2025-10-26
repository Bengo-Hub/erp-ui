<script setup>
import { useToast } from '@/composables/useToast';
import { coreService } from '@/services/shared/coreService';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref, computed } from 'vue';

const { showToast } = useToast();
const items = ref([]);
const isLoading = ref(false);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Form data for create/edit
const formData = ref({
    document_type: '',
    payroll_period: null,
    scheduled_time: null,
    recipients: [],
    comments: ''
});

// Available employees for selection
const employees = ref([]);
const departments = ref([]);
const regions = ref([]);

// Computed property for dialog visibility
const dialogVisible = computed({
    get: () => showCreateDialog.value || showEditDialog.value,
    set: (value) => {
        if (!value) {
            showCreateDialog.value = false;
            showEditDialog.value = false;
            selectedItem.value = null;
        }
    }
});

const fetchItems = async () => {
    isLoading.value = true;
    try {
        const response = await payrollService.getScheduledPayslips();
        items.value = response.data;
    } catch (error) {
        console.error('Error fetching scheduled payslips:', error);
        showToast('error', 'Error', 'Failed to fetch scheduled payslips', 3000);
    } finally {
        isLoading.value = false;
    }
};

const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees();
        employees.value = response.data;
    } catch (error) {
        console.error('Error fetching employees:', error);
        showToast('error', 'Error', 'Failed to fetch employees', 3000);
    }
};

const fetchDepartments = async () => {
    try {
        const response = await coreService.getDepartmentsV1();
        departments.value = response.data;
    } catch (error) {
        console.error('Error fetching departments:', error);
        showToast('error', 'Error', 'Failed to fetch departments', 3000);
    }
};

const fetchRegions = async () => {
    try {
        const response = await coreService.getRegionsV1();
        regions.value = response.data;
    } catch (error) {
        console.error('Error fetching regions:', error);
        showToast('error', 'Error', 'Failed to fetch regions', 3000);
    }
};

const openCreateDialog = () => {
    formData.value = {
        document_type: 'Payslips',
        payroll_period: '',
        scheduled_time: new Date().toISOString().slice(0, 16),
        recipients: [],
        comments: ''
    };
    showCreateDialog.value = true;
};

const openEditDialog = (item) => {
    selectedItem.value = item;
    formData.value = {
        document_type: item.document_type,
        payroll_period: item.payroll_period,
        scheduled_time: new Date(item.scheduled_time).toISOString().slice(0, 16),
        recipients: item.recipients || [],
        comments: item.comments || ''
    };
    showEditDialog.value = true;
};

const saveScheduledPayslip = async () => {
    try {
        if (selectedItem.value) {
            // Edit existing
            await payrollService.updateScheduledPayslip(selectedItem.value.id, formData.value);
            showToast('success', 'Success', 'Scheduled payslip updated successfully!');
        } else {
            // Create new
            await payrollService.schedulePayslipDistribution(formData.value);
            showToast('success', 'Success', 'Scheduled payslip created successfully!');
        }

        dialogVisible.value = false;
        await fetchItems();
    } catch (error) {
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to save scheduled payslip', 3000);
    }
};

const deleteScheduledPayslip = async (item) => {
    if (confirm(`Are you sure you want to delete this scheduled payslip?`)) {
        try {
            await payrollService.deleteScheduledPayslip(item.id);
            showToast('success', 'Success', 'Scheduled payslip deleted successfully!');
            await fetchItems();
        } catch (error) {
            showToast('error', 'Error', 'Failed to delete scheduled payslip', 3000);
        }
    }
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'Pending':
            return 'warning';
        case 'Sent':
            return 'success';
        case 'Failed':
            return 'danger';
        default:
            return 'info';
    }
};

const getDeliverySeverity = (status) => {
    switch (status) {
        case 'Delivered':
            return 'success';
        case 'Failed':
            return 'danger';
        default:
            return 'info';
    }
};

onMounted(() => {
    fetchItems();
    fetchEmployees();
    fetchDepartments();
    fetchRegions();
});
</script>

<template>
    <div class="card p-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Scheduled Payslips</h2>
            <Button label="Schedule New" icon="pi pi-plus" @click="openCreateDialog" class="p-button-primary" />
        </div>

        <!-- Filters -->
        <div class="mb-4">
            <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Search..." class="w-full" />
            </span>
        </div>

        <!-- Data Table -->
        <DataTable :value="items" :paginator="true" :rows="10" :loading="isLoading" :filters="filters" filterDisplay="menu" :globalFilterFields="['document_type', 'payroll_period', 'comments']" class="p-datatable-sm">
            <Column field="document_type" header="Type" sortable />
            <Column field="payroll_period" header="Period" sortable>
                <template #body="{ data }">
                    {{ new Date(data.payroll_period).toLocaleDateString() }}
                </template>
            </Column>
            <Column field="scheduled_time" header="Scheduled Time" sortable>
                <template #body="{ data }">
                    {{ new Date(data.scheduled_time).toLocaleString() }}
                </template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                </template>
            </Column>
            <Column field="delivery_status" header="Delivery" sortable>
                <template #body="{ data }">
                    <Tag :value="data.delivery_status" :severity="getDeliverySeverity(data.delivery_status)" />
                </template>
            </Column>
            <Column field="comments" header="Comments" />
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="openEditDialog(data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="deleteScheduledPayslip(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Create/Edit Dialog -->
        <Dialog v-model:visible="dialogVisible" :header="selectedItem ? 'Edit Scheduled Payslip' : 'Schedule New Payslip'" :style="{ width: '600px' }" modal>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                    <InputText v-model="formData.document_type" class="w-full" />
                </div>

                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Payroll Period</label>
                    <Calendar v-model="formData.payroll_period" view="month" dateFormat="yy-mm" class="w-full" />
                </div>

                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
                    <Calendar v-model="formData.scheduled_time" showTime hourFormat="24" class="w-full" />
                </div>

                <div class="field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <MultiSelect v-model="formData.recipients" :options="employees" optionLabel="name" optionValue="id" display="chip" class="w-full" placeholder="Select employees" />
                </div>

                <div class="field md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                    <Textarea v-model="formData.comments" rows="3" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    text
                    @click="
                        showCreateDialog = false;
                        showEditDialog = false;
                    "
                />
                <Button label="Save" icon="pi pi-check" @click="saveScheduledPayslip" class="p-button-primary" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
}
</style>
