<script setup>
import addEmployee from '@/components/hrm/employees/addEmployee.vue';
import importEmployees from '@/components/hrm/employees/importEmployees.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { formatDate } from '@/utils/formatters';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const isLoading = ref(false);
const spinner_title = ref('Please wait! Fetching employee data...');
const lastFetchTime = ref(0);
const requestCounter = ref(0);
const { showToast } = useToast();
const route = useRoute();

// Enhanced HRM Filters
const { filters, departments, regions, projects, employmentTypes, contractStatuses, loadFilters, resetFilters, getFilterParams, hasActiveFilters, activeFilterCount } = useHrmFilters();

// Enhanced Pagination with data accumulation
const {
    currentPage,
    pageSize,
    totalRecords,
    allData: employees,
    currentPageData,
    paginationInfo,
    updateData,
    goToPage,
    nextPage,
    previousPage,
    reset: resetPagination,
    getPaginationParams,
    handleDataTablePagination,
    setLoading
} = usePagination({
    pageSize: 100, // Standard 100 records per page
    enableAccumulation: true, // Accumulate data across pages
    resetOnRefresh: true
});

const dt = ref();
const editmode = ref(false);
const employeeDialog = ref(false);
const importEmployeesDialog = ref(false);
const deleteEmployeeDialog = ref(false);
const deleteEmployeesDialog = ref(false);
const employeeData = ref({});
const selectedEmployees = ref([]);

// Enhanced filters with HRM filter integration;

// Sorting
const sortField = ref('');
const sortOrder = ref('');

// DataTable filters for PrimeVue DataTable
const dataTableFilters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
    'user.first_name': {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    'user.last_name': {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    'user.middle_name': {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    national_id: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    date_of_birth: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }]
    }
});

// Enhanced fetch employees with proper pagination and filter integration
const fetchEmployees = async (force = false) => {
    const currentRequestId = ++requestCounter.value;

    if (isLoading.value && !force) {
        console.log('Request already in progress, skipping...');
        return; // Prevent concurrent requests
    }

    // Add a guard to prevent excessive calls
    if (!force && Date.now() - lastFetchTime.value < 1000) {
        console.log('Throttling fetch requests...');
        return;
    }

    setLoading(true);
    lastFetchTime.value = Date.now();

    try {
        // Get filter parameters from useHrmFilters
        const filterParams = getFilterParams();

        const params = {
            ...getPaginationParams(), // Use pagination composable
            search: dataTableFilters.value.global.value || filters.value.global.value || '',
            sortField: sortField.value,
            sortOrder: sortOrder.value,
            ...filterParams // Include HRM filters
        };

        console.log('Fetching employees with params:', params);
        const response = await employeeService.getEmployees(params);

        // Check if this request is still the latest one
        if (currentRequestId !== requestCounter.value) {
            console.log('Request outdated, ignoring response');
            return;
        }

        // Update pagination data using the composable
        updateData(response.data);

        if (employees.value.length > 0) {
            showToast('success', `Loaded ${employees.value.length} employees (Page ${currentPage.value}/${paginationInfo.value.totalPages})`);
        } else {
            showToast('info', 'No employees found');
        }
    } catch (error) {
        // Check if this request is still the latest one
        if (currentRequestId !== requestCounter.value) {
            console.log('Request outdated, ignoring error');
            return;
        }

        console.error('Error fetching employees:', error);
        employees.value = [];
        totalRecords.value = 0;
        showToast('error', error?.response?.data?.detail || error.message || 'Failed to fetch employees');
    } finally {
        // Only update loading state if this is the latest request
        if (currentRequestId === requestCounter.value) {
            setLoading(false);
        }
    }
};

// Handle pagination change using the composable
const onPage = (event) => {
    handleDataTablePagination(event);
    // Add delay to prevent rapid successive calls
    setTimeout(() => {
        fetchEmployees();
    }, 100);
};

// Handle sorting
const onSort = (event) => {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder;
    // Add delay to prevent rapid successive calls
    setTimeout(() => {
        fetchEmployees();
    }, 100);
};

// Handle global search
const onGlobalFilter = () => {
    pagination.page = 0; // Reset to first page on global search
    // Add delay to prevent rapid successive calls
    setTimeout(() => {
        fetchEmployees();
    }, 300);
};

// Handle HRM filter changes with debouncing
let hrmFilterTimeout = null;
const onHrmFilterChange = () => {
    // Clear existing timeout
    if (hrmFilterTimeout) {
        clearTimeout(hrmFilterTimeout);
    }

    // Debounce the filter change to prevent rapid API calls
    hrmFilterTimeout = setTimeout(() => {
        pagination.page = 0; // Reset to first page on filter change
        fetchEmployees(true); // Force fetch after filter change
    }, 500); // Increased to 500ms debounce
};

// Single onMounted hook to initialize everything
onMounted(async () => {
    // Load HRM filters
    await loadFilters();

    // Check if we should automatically open the add employee modal
    if (route.query.action === 'add') {
        openAddEmployeeModal();
    }

    // Fetch initial employee data with a delay to ensure everything is properly initialized
    await nextTick();
    setTimeout(() => {
        fetchEmployees(true); // Force initial fetch
    }, 100);
});

// Cleanup on component unmount
onUnmounted(() => {
    if (hrmFilterTimeout) {
        clearTimeout(hrmFilterTimeout);
    }
});

function openAddEmployeeModal() {
    employeeData.value = {};
    editmode.value = false;
    employeeDialog.value = true;
}

function editEmployee(employee) {
    employeeData.value = employee;
    editmode.value = true;
    employeeDialog.value = true;
}

function confirmDeleteEmployee(employee) {
    employeeData.value = employee;
    deleteEmployeeDialog.value = true;
}

async function deleteEmployee() {
    try {
        await employeeService.deleteEmployee(employeeData.value.id);
        employees.value = employees.value.filter((val) => val.id !== employeeData.value.id);
        deleteEmployeeDialog.value = false;
        employeeData.value = {};
        showToast('success', 'Employee Deleted Successfully');
    } catch (error) {
        console.error('Error deleting employee:', error);
        showToast('error', error?.response?.data?.detail || error.message || 'Failed to delete employee');
    }
}

function confirmDeleteSelected() {
    deleteEmployeesDialog.value = true;
}

async function deleteSelectedEmployees() {
    try {
        // Delete each selected employee
        const deletePromises = selectedEmployees.value.map((employee) => employeeService.deleteEmployee(employee.id));
        await Promise.all(deletePromises);

        // Remove from local state
        employees.value = employees.value.filter((val) => !selectedEmployees.value.includes(val));
        deleteEmployeesDialog.value = false;
        selectedEmployees.value = [];
        showToast('success', 'Selected Employees Deleted Successfully');
    } catch (error) {
        console.error('Error deleting employees:', error);
        showToast('error', error?.response?.data?.detail || error.message || 'Failed to delete employees');
    }
}

function exportCSV() {
    dt.value.exportCSV();
}

const clearFilter = () => {
    // Reset DataTable filters
    dataTableFilters.value = {
        global: { value: '', matchMode: FilterMatchMode.CONTAINS },
        'user.first_name': {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
        },
        'user.last_name': {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
        },
        'user.middle_name': {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
        },
        national_id: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
        },
        date_of_birth: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }]
        }
    };

    // Reset HRM filters
    resetFilters();

    // Reset pagination to first page
    pagination.page = 0;

    // Use a timeout to prevent immediate fetch after reset
    setTimeout(() => {
        fetchEmployees();
    }, 100);
};

// Handle employee saved from modal
function handleEmployeeSaved(savedEmployee) {
    employeeDialog.value = false;
    employeeData.value = {};
    editmode.value = false;
    
    // Refresh the employee list
    fetchEmployees(true);
}
</script>
<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Add" icon="pi pi-user-plus" class="bg-blue-500 text-white hover:bg-blue-600 rounded-md px-4 py-2" @click="openAddEmployeeModal" />
                    <Button label="Delete" icon="pi pi-trash" class="bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-2 ml-2" @click="confirmDeleteSelected" :disabled="!selectedEmployees || !selectedEmployees.length" />
                </template>

                <template #end>
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm m-1 bg-gray-500 text-white hover:bg-gray-600 rounded-md px-4 py-2" @click="fetchEmployees" />
                    <Button label="Import" icon="pi pi-file-import" severity="secondary" class="m-1 bg-green-500 text-white hover:bg-green-600 rounded-md px-4 py-2" @click="importEmployeesDialog = true" />
                    <Button label="Export" icon="pi pi-upload" severity="secondary" class="bg-yellow-500 text-white hover:bg-yellow-600 rounded-md px-4 py-2" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                dataKey="id"
                v-model:selection="selectedEmployees"
                :value="employees"
                :rows="pageSize"
                :totalRecords="totalRecords"
                paginator
                :rowsPerPageOptions="[1, 2, 5, 10, 25, 50, 100]"
                v-model:filters="dataTableFilters"
                :loading="isLoading"
                :responsiveLayout="'scroll'"
                :globalFilterFields="['national_id', 'user.first_name', 'user.last_name', 'user.email']"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                filterDisplay="menu"
                @page="onPage"
                @sort="onSort"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                        <h4 class="m-0">Manage Employees</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="dataTableFilters.global.value" placeholder="Search..." @input="onGlobalFilter" />
                        </IconField>
                    </div>

                    <!-- Enhanced HRM Filters -->
                    <div class="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div class="flex flex-wrap gap-4 items-center">
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium text-gray-700">Department</label>
                                <Dropdown v-model="filters.department" :options="departments" optionLabel="title" optionValue="id" placeholder="All Departments" class="w-40" @change="onHrmFilterChange" />
                            </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium text-gray-700">Region</label>
                                <Dropdown v-model="filters.region" :options="regions" optionLabel="title" optionValue="id" placeholder="All Regions" class="w-40" @change="onHrmFilterChange" />
                            </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium text-gray-700">Project</label>
                                <Dropdown v-model="filters.project" :options="projects" optionLabel="title" optionValue="id" placeholder="All Projects" class="w-40" @change="onHrmFilterChange" />
                            </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium text-gray-700">Employment Type</label>
                                <Dropdown v-model="filters.employmentType" :options="employmentTypes" optionLabel="label" optionValue="value" placeholder="All Types" class="w-40" @change="onHrmFilterChange" />
                            </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium text-gray-700">Contract Status</label>
                                <Dropdown v-model="filters.contractStatus" :options="contractStatuses" optionLabel="label" optionValue="value" placeholder="All Statuses" class="w-40" @change="onHrmFilterChange" />
                            </div>

                            <div class="flex items-end">
                                <Button label="Reset Filters" icon="pi pi-refresh" severity="secondary" size="small" @click="clearFilter" :disabled="!hasActiveFilters" />
                            </div>
                        </div>

                        <!-- Active Filters Summary -->
                        <div v-if="hasActiveFilters" class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <i class="pi pi-filter"></i>
                                <span>{{ activeFilterCount }} active filter(s):</span>
                                <div class="flex flex-wrap gap-2">
                                    <span v-if="filters.department" class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"> Dept: {{ departments.find((d) => d.id === filters.department)?.title }} </span>
                                    <span v-if="filters.region" class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"> Region: {{ regions.find((r) => r.id === filters.region)?.title }} </span>
                                    <span v-if="filters.project" class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"> Project: {{ projects.find((p) => p.id === filters.project)?.title }} </span>
                                    <span v-if="filters.employmentType" class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"> Type: {{ employmentTypes.find((t) => t.value === filters.employmentType)?.label }} </span>
                                    <span v-if="filters.contractStatus" class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs"> Status: {{ contractStatuses.find((s) => s.value === filters.contractStatus)?.label }} </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <template #empty> No employees found. </template>
                <template #loading> Loading employee data. Please wait. </template>
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="national_id" header="National ID" sortable filterField="national_id" style="min-width: 12rem">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <span>{{ data.national_id }}</span>
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by national id" />
                    </template>
                    <template #filterclear="{ filterCallback }">
                        <Button type="button" icon="pi pi-times" @click="filterCallback()" severity="secondary"></Button>
                    </template>
                    <template #filterapply="{ filterCallback }">
                        <Button type="button" icon="pi pi-check" @click="filterCallback()" severity="success"></Button>
                    </template>
                </Column>

                <Column field="user.first_name" sortable header="First Name" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.user?.first_name || 'N/A' }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by first name" />
                    </template>
                </Column>
                <Column field="user.last_name" sortable header="Last Name" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.user?.last_name || 'N/A' }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by last name" />
                    </template>
                </Column>
                <Column field="user.middle_name" sortable header="Middle Name" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.user?.middle_name || 'N/A' }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by middle name" />
                    </template>
                </Column>
                <Column field="user.email" header="Email" sortable style="min-width: 16rem">
                    <template #body="{ data }">
                        {{ data.user?.email || 'N/A' }}
                    </template>
                </Column>
                <Column header="Gender" field="gender" sortable :showFilterMatchModes="false" :filterMenuStyle="{ width: '14rem' }" style="min-width: 14rem"> </Column>
                <Column header="D.O.B" filterField="date_of_birth" dataType="date" style="min-width: 10rem">
                    <template #body="{ data }">
                        {{ data.date_of_birth ? formatDate(new Date(data.date_of_birth)) : 'N/A' }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                    </template>
                </Column>
                <Column field="pin_no" header="PIN NO" sortable style="min-width: 12rem"></Column>
                <Column field="nhif_no" header="NHIF NO" sortable style="min-width: 12rem"></Column>
                <Column field="nssf_no" header="NSSF NO" sortable style="min-width: 12rem"></Column>

                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editEmployee(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteEmployee(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="deleteEmployeeDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="employeeData"
                    >Are you sure you want to delete <b>{{ employeeData.user?.first_name || 'this employee' }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteEmployeeDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteEmployee" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteEmployeesDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="employeeData">Are you sure you want to delete the selected employees?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteEmployeesDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedEmployees" />
            </template>
        </Dialog>

        <Dialog 
            v-model:visible="employeeDialog" 
            :style="{ width: '90vw', maxWidth: '1200px' }" 
            :header="editmode ? 'Edit Employee' : 'Add Employee'" 
            :modal="true"
            :closable="true"
        >
            <addEmployee 
                :employee="employeeData" 
                :edit-mode="editmode"
                @save="handleEmployeeSaved"
                @cancel="employeeDialog = false"
            />
        </Dialog>

        <Dialog v-model:visible="importEmployeesDialog" :style="{ width: '1200px' }" header="Import Employees" :modal="true">
            <importEmployees />
        </Dialog>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>
