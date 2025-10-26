<script setup>
import BulkContractActions from '@/components/hrm/contracts/BulkContractActions.vue';
import ContractForm from '@/components/hrm/contracts/ContractForm.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { employeeService } from '@/services/hrm/employeeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';

const isLoading = ref(false);
const spinner_title = ref('Please wait! Fetching contract data...');
const toast = useToast();
const dt = ref();
const editmode = ref(false);
const contracts = ref([]);
const contractDialog = ref(false);
const deleteContractDialog = ref(false);
const deleteContractsDialog = ref(false);
const bulkActionsDialog = ref(false);
const bulkActionType = ref('renew');
const contractData = ref({});
const selectedContracts = ref([]);
const totalRecords = ref(0);

// Pagination and filters
const pagination = reactive({
    page: 0,
    rows: 10
});
const filters = ref();

// Sorting
const sortField = ref('');
const sortOrder = ref('');

const submitted = ref(false);

// Contract status options
const statuses = ref([
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Terminated', value: 'terminated' },
    { label: 'Expired', value: 'expired' }
]);

// Get severity for status tags
const getSeverity = (status) => {
    switch (status) {
        case 'active':
            return 'success';
        case 'suspended':
            return 'warning';
        case 'terminated':
            return 'danger';
        case 'expired':
            return 'secondary';
        default:
            return 'info';
    }
};

// Fetch contracts when the component mounts
onMounted(() => {
    fetchContracts();
});

// Fetch contracts from the server
const fetchContracts = async () => {
    if (isLoading.value) return; // Prevent concurrent requests

    isLoading.value = true;
    try {
        const params = {
            page: pagination.page + 1, // API expects 1-based page index
            limit: pagination.rows,
            search: filters.value ? filters.value['global'].value : '',
            sortField: sortField.value,
            sortOrder: sortOrder.value
        };

        const response = await employeeService.listContracts(params);

        // Handle different response structures
        let list = [];
        if (response && response.data) {
            if (response.data.results) {
                list = response.data.results;
                totalRecords.value = response.data.count || 0;
            } else if (Array.isArray(response.data)) {
                list = response.data;
                totalRecords.value = list.length;
            } else {
                list = [response.data];
                totalRecords.value = 1;
            }
        }

        console.log('Contracts API Response:', response);
        console.log('Processed contracts list:', list);
        console.log('Total records:', totalRecords.value);

        contracts.value = list;

        if (list.length > 0) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `Loaded ${list.length} contracts`,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'info',
                summary: 'Info',
                detail: 'No contracts found',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error fetching contracts:', error);
        contracts.value = [];
        totalRecords.value = 0;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.detail || error.message || 'Failed to fetch contracts',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

// Handle pagination change
const onPage = (event) => {
    pagination.page = event.page;
    pagination.rows = event.rows;
    fetchContracts(); // Fetch contracts for the new page
};

// Handle sorting
const onSort = (event) => {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder;
    fetchContracts(); // Fetch sorted data
};
// Handle filter change
const onFilter = () => {
    pagination.page = 0; // Reset to first page on filter change
    fetchContracts(); // Fetch filtered data
};

// Handle global search
const onGlobalFilter = () => {
    pagination.page = 0; // Reset to first page on global search
    fetchContracts();
};

function hideDialog() {
    contractDialog.value = false;
    submitted.value = false;
}

function editContract(data) {
    contractData.value = data;
    editmode.value = true;
    contractDialog.value = true;
}

function confirmDeleteContract(data) {
    contractData.value = data;
    deleteContractDialog.value = true;
}

async function deleteContract() {
    try {
        await employeeService.deleteContract(contractData.value.id);
        contracts.value = contracts.value.filter((val) => val.id !== contractData.value.id);
        deleteContractDialog.value = false;
        contractData.value = {};
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Contract deleted successfully',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting contract:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.detail || error.message || 'Failed to delete contract',
            life: 3000
        });
    }
}

function confirmDeleteSelected() {
    deleteContractsDialog.value = true;
}

function openBulkActions(actionType) {
    bulkActionType.value = actionType;
    bulkActionsDialog.value = true;
}

function handleBulkActionCompleted(actionType) {
    fetchContracts();
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Bulk ${actionType} action completed successfully`,
        life: 3000
    });
}

function handleContractSaved() {
    fetchContracts();
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Contract saved successfully',
        life: 3000
    });
}

async function deleteSelectedContracts() {
    try {
        // Delete each selected contract
        const deletePromises = selectedContracts.value.map((contract) => employeeService.deleteContract(contract.id));
        await Promise.all(deletePromises);

        // Remove from local state
        contracts.value = contracts.value.filter((val) => !selectedContracts.value.includes(val));
        deleteContractsDialog.value = false;
        selectedContracts.value = [];
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Selected contracts deleted successfully',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting contracts:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.detail || error.message || 'Failed to delete contracts',
            life: 3000
        });
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
const initFilters = () => {
    filters.value = {
        global: { value: '', matchMode: FilterMatchMode.CONTAINS },
        'employee.name': {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
        },
        'employee.staffNo': {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
        },
        contract_start_date: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }]
        },
        contract_end_date: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }]
        },
        salary: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
        },
        status: {
            operator: FilterOperator.OR,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
        },
        duration: { value: [0, 100], matchMode: FilterMatchMode.BETWEEN }
        // verified: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
    fetchContracts();
};

initFilters();
const clearFilter = () => {
    initFilters();
};
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Add Contract" icon="pi pi-plus" severity="success" @click="editContract({})" />
                <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedContracts || !selectedContracts.length" />

                <!-- Bulk Actions Dropdown -->
                <Dropdown
                    v-model="bulkActionType"
                    :options="[
                        { label: 'Renew Contracts', value: 'renew' },
                        { label: 'Link Contracts', value: 'link' },
                        { label: 'Update Status', value: 'status' },
                        { label: 'Terminate Contracts', value: 'terminate' }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Bulk Actions"
                    class="ml-2"
                    :disabled="!selectedContracts || !selectedContracts.length"
                />
                <Button label="Execute" icon="pi pi-cog" severity="info" @click="openBulkActions(bulkActionType)" :disabled="!selectedContracts || !selectedContracts.length || !bulkActionType" class="ml-2" />
            </template>

            <template #end>
                <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm m-1" @click="fetchContracts" />
                <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
            </template>
        </Toolbar>
        <DataTable
            ref="dt"
            dataKey="id"
            v-model:selection="selectedContracts"
            :value="contracts"
            :rows="pagination.rows"
            :totalRecords="totalRecords"
            paginator
            :rowsPerPageOptions="[1, 2, 5, 10, 25, 50, 100]"
            v-model:filters="filters"
            :loading="isLoading"
            :responsiveLayout="'scroll'"
            :globalFilterFields="['salary', 'employee.name', 'employee.staffNo', 'status']"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} contracts"
            filterDisplay="menu"
            :lazy="true"
            @filter="onFilter"
            @page="onPage"
            @sort="onSort"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                    <h4 class="m-0">Manage Contracts</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." @input="onGlobalFilter" />
                    </IconField>
                </div>
            </template>
            <template #empty> No contracts found. </template>
            <template #loading> Loading contract data. Please wait. </template>

            <!-- Columns for the table -->
            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>

            <Column field="employee.staffNo" header="Staff No" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.employee?.staffNo || 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Staff Number" />
                </template>
            </Column>

            <Column header="Full Name" sortable sortField="employee.name" filterField="employee.name" style="min-width: 14rem">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <span>{{ data.employee?.name || 'N/A' }}</span>
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Name" />
                </template>
            </Column>

            <Column field="contract_start_date" header="Start Date" sortable filterField="contract_start_date" dataType="date" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.contract_start_date ? formatDate(new Date(data.contract_start_date)) : 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <Calendar v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                </template>
            </Column>

            <Column field="contract_end_date" header="End Date" sortable filterField="contract_end_date" dataType="date" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.contract_end_date ? formatDate(new Date(data.contract_end_date)) : 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <Calendar v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                </template>
            </Column>

            <Column field="salary" header="Salary" sortable filterField="salary" dataType="numeric" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.salary ? formatCurrency(parseFloat(data.salary)) : 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="currency" currency="KES" locale="en-US" />
                </template>
            </Column>

            <Column header="Status" field="status" sortable :filterMenuStyle="{ width: '14rem' }" style="min-width: 12rem">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="getSeverity(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="statuses" optionLabel="label" optionValue="value" placeholder="Select Status" showClear>
                        <template #option="slotProps">
                            <Tag :value="slotProps.option.label" :severity="getSeverity(slotProps.option.value)" />
                        </template>
                    </Dropdown>
                </template>
            </Column>

            <Column field="contract_duration" header="Duration (Days)" sortable :showFilterMatchModes="false" style="min-width: 12rem">
                <template #body="{ data }">
                    <span>{{ data.contract_duration ? Math.round(parseFloat(data.contract_duration)) : 0 }} days</span>
                </template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" placeholder="Enter days" />
                </template>
            </Column>

            <Column headerStyle="width: 5rem; text-align: center" bodyStyle="text-align: center; overflow: visible">
                <template #body>
                    <Button type="button" icon="pi pi-cog" rounded />
                </template>
            </Column>

            <Column :exportable="false" style="min-width: 12rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editContract(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteContract(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Delete Contract Dialog -->
        <Dialog v-model:visible="deleteContractDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="contractData">
                    Are you sure you want to delete the contract for <b>{{ contractData.employee?.name || 'this employee' }}</b
                    >?
                </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteContractDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteContract" />
            </template>
        </Dialog>

        <!-- Delete Multiple Contracts Dialog -->
        <Dialog v-model:visible="deleteContractsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Are you sure you want to delete the selected contracts?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteContractsDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteSelectedContracts" />
            </template>
        </Dialog>

        <!-- Contract Form Dialog -->
        <ContractForm v-model:visible="contractDialog" :contractData="contractData" :editMode="editmode" @close="hideDialog" @saved="handleContractSaved" />

        <!-- Bulk Actions Dialog -->
        <BulkContractActions v-model:visible="bulkActionsDialog" :selectedContracts="selectedContracts" :actionType="bulkActionType" @close="bulkActionsDialog = false" @completed="handleBulkActionCompleted" />

        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>
