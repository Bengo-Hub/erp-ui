<script setup>
import { useToast } from '@/composables/useToast';
import { leaveService } from '@/services/hrm/leaveService';
import { FilterMatchMode } from '@primevue/core/api';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const dt = ref();
const loading = ref(false);
const resetting = ref(false);
const leaveData = ref([]);
const totalRecords = ref(0);
const showResetDialog = ref(false);

// Filters
const selectedDepartments = ref([]);
const selectedRegions = ref([]);
const selectedLeaveType = ref(null);
const selectedYear = ref(new Date().getFullYear());
const resetLeaveType = ref(null);
const resetYear = ref(new Date().getFullYear());

// Data options
const departments = ref([]);
const regions = ref([]);
const leaveTypes = ref([]);
const years = ref(Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i));

// Table filters
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Computed properties
const filteredCount = computed(() => leaveData.value.length);

// Methods
const fetchLeaveBalances = async () => {
    loading.value = true;
    try {
        const params = {
            department: filters.value.department,
            region: filters.value.region,
            category_id: selectedLeaveType.value?.id,
            year: selectedYear.value
        };

        const response = await leaveService.getBalances(params);
        leaveData.value = response.data.results;
        totalRecords.value = response.data.count;
    } catch (error) {
        console.error('Error fetching leave balances:', error);
        showToast('error', 'Error', 'Failed to fetch leave balances', 3000);
    } finally {
        loading.value = false;
    }
};

// Removed: fetchDepartments and fetchRegions - now using useHrmFilters composable

const fetchLeaveCategories = async () => {
    try {
        const response = await leaveService.getCategories();
        leaveTypes.value = response.data.results;
    } catch (error) {
        console.error('Error fetching leave categories:', error);
        showToast('error', 'Error', 'Failed to fetch leave categories', 3000);
    }
};

const applyFilters = () => {
    fetchLeaveBalances();
};

const refreshData = () => {
    resetFilters();
    selectedLeaveType.value = null;
    selectedYear.value = new Date().getFullYear();
    fetchLeaveBalances();
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const exportExcel = () => {
    // Implement Excel export logic
    showToast('info', 'Export', 'Excel export functionality will be implemented', 3000);
};

const exportPDF = () => {
    // Implement PDF export logic
    showToast('info', 'Export', 'PDF export functionality will be implemented', 3000);
};

const printTable = () => {
    // Implement print logic
    window.print();
};

const resetBalances = async () => {
    resetting.value = true;
    try {
        // Implement reset logic
        await leaveService.resetBalances({
            category_id: resetLeaveType.value?.id,
            year: resetYear.value
        });

        showToast('success', 'Success', 'Leave balances reset successfully', 3000);

        showResetDialog.value = false;
        fetchLeaveBalances();
    } catch (error) {
        console.error('Error resetting leave balances:', error);
        showToast('error', 'Error', 'Failed to reset leave balances', 3000);
    } finally {
        resetting.value = false;
    }
};

const viewDetails = (data) => {
    // Implement view details logic
    showToast('info', 'View Details', `Viewing details for ${data.employee.user.first_name}`, 3000);
};

const editBalance = (data) => {
    // Implement edit balance logic
    showToast('info', 'Edit Balance', `Editing balance for ${data.employee.user.first_name}`, 3000);
};

const getLeaveTypeSeverity = (type) => {
    switch (type) {
        case 'Annual Leave':
            return 'info';
        case 'Sick Leave':
            return 'warning';
        case 'Maternity Leave':
            return 'help';
        case 'Paternity Leave':
            return 'success';
        default:
            return null;
    }
};

// Initialize data
onMounted(async () => {
    await loadFilters();
    fetchLeaveCategories();
    fetchLeaveBalances();
});
</script>

<template>
    <div class="container mx-auto px-2 py-4">
        <!-- Filters Section -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <!-- Department Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <Dropdown v-model="filters.department" :options="departments" optionLabel="title" optionValue="id" placeholder="All Departments" class="w-full" @change="applyFilters" />
                </div>

                <!-- Region Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <Dropdown v-model="filters.region" :options="regions" optionLabel="title" optionValue="id" placeholder="All Regions" class="w-full" @change="applyFilters" />
                </div>

                <!-- Leave Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                    <Dropdown v-model="selectedLeaveType" :options="leaveTypes" optionLabel="name" placeholder="All Types" class="w-full" @change="applyFilters" />
                </div>

                <!-- Year Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <Dropdown v-model="selectedYear" :options="years" placeholder="Select Year" class="w-full" @change="applyFilters" />
                </div>
            </div>

            <div class="flex flex-wrap justify-between items-center gap-2">
                <div class="flex items-center space-x-4">
                    <span class="text-sm font-medium"> Total Records: <Badge :value="totalRecords" severity="info" /> </span>
                    <span class="text-sm font-medium" v-if="filteredCount !== totalRecords"> Filtered: <Badge :value="filteredCount" severity="success" /> </span>
                </div>

                <div class="flex space-x-2">
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm p-button-outlined" @click="refreshData" />
                    <Button label="Export" icon="pi pi-download" class="p-button-sm p-button-outlined" @click="exportCSV" />
                    <Button label="Reset Balances" icon="pi pi-replay" class="p-button-sm p-button-outlined" severity="warning" @click="showResetDialog = true" />
                </div>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="bg-white rounded-lg shadow-md p-4">
            <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                <div class="w-full md:w-auto">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Search..." class="w-full" />
                    </span>
                </div>

                <div class="flex space-x-2">
                    <Button icon="pi pi-file-excel" v-tooltip="'Export to Excel'" class="p-button-sm p-button-outlined" @click="exportExcel" />
                    <Button icon="pi pi-file-pdf" v-tooltip="'Export to PDF'" class="p-button-sm p-button-outlined" severity="danger" @click="exportPDF" />
                    <Button icon="pi pi-print" v-tooltip="'Print Table'" class="p-button-sm p-button-outlined" @click="printTable" />
                </div>
            </div>

            <DataTable
                ref="dt"
                :value="leaveData"
                v-model:filters="filters"
                :paginator="true"
                :rows="10"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                responsiveLayout="scroll"
                dataKey="id"
                class="p-datatable-sm"
                stripedRows
            >
                <Column field="employee.user.first_name" header="First Name" :sortable="true">
                    <template #body="{ data }">
                        {{ data.employee.user.first_name }}
                    </template>
                </Column>
                <Column field="employee.user.last_name" header="Last Name" :sortable="true">
                    <template #body="{ data }">
                        {{ data.employee.user.last_name }}
                    </template>
                </Column>
                <Column field="employee.national_id" header="ID Number" :sortable="true">
                    <template #body="{ data }">
                        {{ data.employee.national_id || 'N/A' }}
                    </template>
                </Column>
                <Column field="category.name" header="Leave Type" :sortable="true">
                    <template #body="{ data }">
                        <Tag :value="data.category.name" :severity="getLeaveTypeSeverity(data.category.name)" />
                    </template>
                </Column>
                <Column field="days_entitled" header="Entitled" :sortable="true">
                    <template #body="{ data }"> {{ data.days_entitled }} days </template>
                </Column>
                <Column field="days_taken" header="Taken" :sortable="true">
                    <template #body="{ data }">
                        <span :class="{ 'text-red-500': parseFloat(data.days_taken) > 0 }"> {{ data.days_taken }} days </span>
                    </template>
                </Column>
                <Column field="days_remaining" header="Remaining" :sortable="true">
                    <template #body="{ data }">
                        <span :class="{ 'text-green-500': parseFloat(data.days_remaining) > 0 }"> {{ data.days_remaining }} days </span>
                    </template>
                </Column>
                <Column header="Actions" style="width: 120px">
                    <template #body="{ data }">
                        <Button icon="pi pi-eye" class="p-button-sm p-button-rounded p-button-text" @click="viewDetails(data)" />
                        <Button icon="pi pi-pencil" class="p-button-sm p-button-rounded p-button-text" severity="warning" @click="editBalance(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Reset Balances Dialog -->
        <Dialog v-model:visible="showResetDialog" header="Reset Leave Balances" :modal="true" :style="{ width: '50vw' }">
            <div class="grid grid-cols-1 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                    <Dropdown v-model="resetLeaveType" :options="leaveTypes" optionLabel="name" placeholder="Select Leave Type" class="w-full" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <Dropdown v-model="resetYear" :options="years" placeholder="Select Year" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showResetDialog = false" />
                <Button label="Reset" icon="pi pi-check" severity="danger" @click="resetBalances" :loading="resetting" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
@media print {
    .no-print {
        display: none !important;
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .p-datatable {
        font-size: 0.875rem;
    }

    .p-button {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }
}
</style>
