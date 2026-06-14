<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { leaveService } from '@/services/hrm/leaveService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const { filters, departments, regions, loadFilters, resetFilters, getFilterParams } = useHrmFilters();

const dt = ref();
const loading = ref(false);
const leaveData = ref([]);
const totalRecords = ref(0);

// Leave-specific filters
const selectedLeaveType = ref(null);

// Data options
const employees = ref([]);
const leaveTypes = ref([]);

// Methods
const fetchLeaveEntitlements = async (page = 1) => {
    loading.value = true;
    try {
        const filterParams = getFilterParams();
        const params = {
            page,
            category_id: selectedLeaveType.value?.id,
            ...filterParams
        };

        const response = await leaveService.getEntitlements(params);
        leaveData.value = response.data.results;
        totalRecords.value = response.data.count;
    } catch (error) {
        console.error('Error fetching leave entitlements:', error);
        showToast('error', 'Error', 'Failed to fetch leave entitlements', 3000);
    } finally {
        loading.value = false;
    }
};

// Balances view handled in leaveBalances.vue

const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees();
        employees.value = response.data;
    } catch (error) {
        console.error('Error fetching employees:', error);
        showToast('error', 'Error', 'Failed to fetch employees', 3000);
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

// Autocomplete handlers (not used currently)

const applyFilters = () => {
    fetchLeaveEntitlements();
};

const refreshData = () => {
    selectedLeaveType.value = null;
    selectedDepartments.value = [];
    selectedRegions.value = [];
    selectedEmployees.value = [];
    fetchLeaveEntitlements();
};

const exportExcel = () => {
    dt.value.exportCSV();
    showToast('success', 'Export Started', 'Excel export will begin shortly', 3000);
};

const exportPDF = () => {
    showToast('info', 'PDF Export', 'PDF export functionality will be implemented', 3000);
};

const viewDetails = (data) => {
    showToast('info', 'View Details', `Viewing ${data.employee.user.first_name}'s leave entitlement`, 3000);
};

const editEntitlement = (data) => {
    showToast('info', 'Edit Entitlement', `Editing ${data.employee.user.first_name}'s leave entitlement`, 3000);
};

const getLeaveSeverity = (leaveType) => {
    switch (leaveType) {
        case 'Annual Leave':
            return 'success';
        case 'Sick Leave':
            return 'warning';
        case 'Maternity Leave':
            return 'help';
        default:
            return null;
    }
};

// Initialize data
onMounted(async () => {
    await loadFilters();
    fetchLeaveCategories();
    fetchEmployees();
    fetchLeaveEntitlements();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-primary text-white py-2 shadow-md">
            <div class="container mx-auto px-4">
                <h2 class="text-xl font-bold">Leave Entitlement</h2>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-6">
            <!-- Filter Toolbar -->
            <Card class="mb-4">
                <template #content>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        <!-- Leave Category - Full width on mobile, then normal -->
                        <div class="sm:col-span-2 lg:col-span-1">
                            <Dropdown v-model="selectedLeaveType" :options="leaveTypes" optionLabel="name" placeholder="Leave Category" class="w-full" @change="applyFilters" />
                        </div>

                        <!-- Departments -->
                        <div>
                            <Dropdown v-model="filters.department" :options="departments" optionLabel="title" optionValue="id" placeholder="All Departments" class="w-full" @change="applyFilters" />
                        </div>

                        <!-- Regions -->
                        <div>
                            <Dropdown v-model="filters.region" :options="regions" optionLabel="title" optionValue="id" placeholder="All Regions" class="w-full" @change="applyFilters" />
                        </div>

                        <!-- Employees -->
                        <div>
                            <Dropdown v-model="filters.employee" :options="employees" optionLabel="user.first_name" optionValue="id" placeholder="All Employees" class="w-full" @change="applyFilters" />
                        </div>

                        <!-- Update Button - Full width on mobile, then auto -->
                        <div class="flex items-end sm:col-span-2 lg:col-span-1">
                            <Button label="Update Data" icon="pi pi-sync" class="w-full lg:w-auto" @click="refreshData" :loading="loading" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Data Table Card -->
            <Card>
                <template #header>
                    <div class="flex flex-wrap justify-between items-center">
                        <div class="flex items-center">
                            <span class="text-sm font-semibold mr-2">Total Records:</span>
                            <Badge :value="totalRecords" severity="info" />
                        </div>
                        <div class="flex space-x-2 mt-2 sm:mt-0">
                            <Button icon="pi pi-refresh" class="p-button-sm p-button-text" @click="refreshData" v-tooltip="'Refresh'" />
                            <Button icon="pi pi-file-excel" class="p-button-sm p-button-text" @click="exportExcel" v-tooltip="'Export to Excel'" />
                            <Button icon="pi pi-file-pdf" class="p-button-sm p-button-text" @click="exportPDF" v-tooltip="'Export to PDF'" />
                        </div>
                    </div>
                </template>

                <template #content>
                    <DataTable
                        ref="dt"
                        :value="leaveData"
                        :paginator="true"
                        :rows="10"
                        :rowsPerPageOptions="[5, 10, 25, 50]"
                        :loading="loading"
                        dataKey="id"
                        responsiveLayout="scroll"
                        class="p-datatable-sm"
                        stripedRows
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    >
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <Column field="employee.user.first_name" header="Employee" :sortable="true">
                            <template #body="{ data }">
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ data.employee.user.first_name }} {{ data.employee.user.last_name }}</span>
                                    <span class="text-xs text-gray-500">ID: {{ data.employee.national_id || 'N/A' }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="category.name" header="Leave Type" :sortable="true">
                            <template #body="{ data }">
                                <Tag :value="data.category.name" :severity="getLeaveSeverity(data.category.name)" />
                            </template>
                        </Column>

                        <Column field="days_entitled" header="Days Entitled" :sortable="true">
                            <template #body="{ data }">
                                <span class="font-medium">{{ data.days_entitled }}</span>
                            </template>
                        </Column>

                        <Column field="year" header="Year" :sortable="true"></Column>

                        <Column header="Actions" :exportable="false" style="min-width: 8rem">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" @click="viewDetails(data)" v-tooltip="'View details'" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm p-button-warning" @click="editEntitlement(data)" v-tooltip="'Edit entitlement'" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
/* Responsive adjustments */
@media screen and (max-width: 960px) {
    :deep(.p-datatable) {
        font-size: 0.875rem;
    }

    :deep(.p-datatable .p-column-header-content) {
        flex-wrap: wrap;
    }

    :deep(.p-datatable .p-button) {
        padding: 0.25rem 0.5rem;
    }
}

/* Print styles */
@media print {
    .no-print {
        display: none !important;
    }

    :deep(.p-datatable) {
        font-size: 10pt !important;
    }
}
</style>
