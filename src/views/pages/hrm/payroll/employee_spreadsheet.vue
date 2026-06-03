<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'; // Import Vue Router

const { showToast } = useToast();
const route = useRoute();
const routeParams = ref(null);

// State Management
const dt = ref();
const isLoading = ref(false);
// const selectedEmployee = ref([]); // Removed unused variable
const selectedDepartment = ref([]);
const selectedRegion = ref(null);
const selectedProject = ref(null);
const payrollData = ref([]);
const filteredPayrollData = ref([]);
const selectedComponent = ref(null);
const selectedCategory = ref(null);
const payrollcomponents = ref([]);

// Payroll component categories
const payrollCategories = ref([
    { label: 'Basic Pay', value: 'Basic Pay', icon: 'pi pi-dollar' },
    { label: 'Earnings', value: 'Earnings', icon: 'pi pi-plus' },
    { label: 'Deductions', value: 'Deductions', icon: 'pi pi-minus' },
    { label: 'Loans', value: 'Loans', icon: 'pi pi-credit-card' }
]);

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();
const pagination = ref({
    page: 0,
    rows: 10
});
// Lifecycle
onMounted(() => {
    loadFilters();
    fetchPayrollComponents();
    fetchPayrollData();
});

// Handle pagination change
const onPage = (event) => {
    pagination.value.page = event.page;
    pagination.value.rows = event.rows;
    fetchPayrollData(); // Fetch employees for the new page
};
// Handle filter change
const onFilter = () => {
    pagination.value.page = 0; // Reset to first page on filter change
    //fetchEmployees(); // Fetch filtered data
};

watch(
    () => route.params,
    (newParams) => {
        console.log('Route params changed:', newParams);
        routeParams.value = newParams;
        fetchPayrollComponents();
    },
    { deep: true } // Ensure deep watch for nested param changes
);
const fetchPayrollComponents = async (category = null) => {
    try {
        const params = {
            category: category || routeParams.value?.components || 'Earnings',
            taxable_status: routeParams.value?.filter !== 'all' ? routeParams.value.filter : null,
            is_active: true
        };
        const response = await payrollService.listPayrollComponents(params);
        payrollcomponents.value = response.data || [];
    } catch (error) {
        console.error('Error fetching payroll components:', error);
        showToast('error', 'Error', 'Failed to fetch payroll components', 3000);
        payrollcomponents.value = [];
    }
};
const onCategoryChange = async () => {
    selectedComponent.value = null; // Reset selected component
    payrollData.value = [];
    filteredPayrollData.value = [];

    if (selectedCategory.value) {
        await fetchPayrollComponents(selectedCategory.value);
    } else {
        payrollcomponents.value = [];
    }
};

const fetchPayrollData = async () => {
    if (!selectedComponent.value) return;

    isLoading.value = true;
    try {
        const params = {
            component_id: selectedComponent.value,
            department: selectedDepartment.value.length > 0 ? selectedDepartment.value : null,
            region: selectedRegion.value ? [selectedRegion.value] : null,
            project: selectedProject.value ? [selectedProject.value] : null
        };

        const response = await payrollService.getEmployeePayrollData(params);
        payrollData.value = response.data?.results || response.data || [];
        filteredPayrollData.value = [...payrollData.value];
    } catch (error) {
        console.error('Error fetching payroll data:', error);
        showToast('error', 'Error', 'Failed to fetch payroll data', 3000);
        payrollData.value = [];
        filteredPayrollData.value = [];
    } finally {
        isLoading.value = false;
    }
};

// Additional variables and functions for template
const totalRecords = ref(0);
const filters = ref({
    global: { value: null, matchMode: 'contains' }
});
const showpayslipDialog = ref(false);
const selectedPayslipId = ref(null);
const payslipInfo = ref(null);
const deletePayslipDialog = ref(false);
const spinner_title = ref('Loading...');

const onSort = () => {
    // Handle sorting
};

const getPaySlipInfo = (info) => {
    payslipInfo.value = info;
};

const printPayslip = () => {
    // Handle print payslip
};

const emailPayslip = () => {
    // Handle email payslip
};

const submitApproval = () => {
    // Handle submit approval
};

const editSlip = () => {
    // Handle edit slip
};

const rerunPayslip = () => {
    // Handle rerun payslip
};

const confirmDeletePayslip = (id) => {
    selectedPayslipId.value = id;
    deletePayslipDialog.value = true;
};

const deletePayslip = async (id) => {
    try {
        await payrollService.deletePayslipRecord(id);
        showToast('success', 'Success', 'Payslip deleted successfully', 3000);
        deletePayslipDialog.value = false;
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete payslip', 3000);
    }
};

const updateData = () => {
    if (selectedComponent.value) {
        fetchPayrollData();
    } else {
        showToast('warn', 'Warning', 'Please select a component first', 3000);
    }
};
</script>

<template>
    <div class="container-fluid">
        <!-- First Toolbar for Filters -->
        <Toolbar class="mb-4 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <div class="flex flex-wrap gap-3 items-center justify-start">
                    <!-- Category Selection -->
                    <Dropdown
                        :options="payrollCategories"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full md:w-64"
                        placeholder="Select Category"
                        v-model="selectedCategory"
                        @change="onCategoryChange"
                        :filter="true"
                        filterPlaceholder="Search Category"
                    />

                    <!-- Component Selection -->
                    <MultiSelect
                        :options="payrollcomponents"
                        optionLabel="title"
                        optionValue="id"
                        display="chip"
                        :maxSelectedLabels="1"
                        class="w-full md:w-64"
                        placeholder="Select an item"
                        v-model="selectedComponent"
                        :filter="true"
                        filterPlaceholder="Search Item"
                        @change="fetchPayrollData"
                        :disabled="!selectedCategory"
                    />
                    <MultiSelect
                        :options="departments"
                        optionLabel="title"
                        optionValue="id"
                        display="chip"
                        :maxSelectedLabels="3"
                        class="w-full md:w-64"
                        placeholder="All Departments"
                        v-model="selectedDepartment"
                        :filter="true"
                        filterPlaceholder="Search Department"
                        @change="fetchPayrollData"
                    />
                    <MultiSelect
                        :options="regions"
                        optionLabel="name"
                        optionValue="id"
                        class="w-full md:w-64"
                        display="chip"
                        :maxSelectedLabels="3"
                        placeholder="All Regions"
                        v-model="selectedRegion"
                        :filter="true"
                        filterPlaceholder="Search Region"
                        @change="fetchPayrollData"
                    />
                    <MultiSelect
                        :options="projects"
                        optionLabel="name"
                        optionValue="id"
                        class="w-full md:w-64"
                        display="chip"
                        :maxSelectedLabels="3"
                        placeholder="All Projects"
                        v-model="selectedProject"
                        :filter="true"
                        filterPlaceholder="Search Project"
                        @change="fetchPayrollData"
                    />

                    <!-- Refresh Button -->
                    <Button label="Update Data" icon="pi pi-check" class="p-button-sm" @click="updateData" />
                </div>
            </template>
        </Toolbar>

        <!-- Second Toolbar for Table Status Tabs -->
        <Toolbar class="mb-2 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <div class="flex flex-wrap gap-2 items-center">
                    <IconField class="w-full md:w-auto">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </IconField>
                    <Button label="" icon="pi pi-file-pdf" severity="danger" @click="printPayslips" class="m-1" />
                    <Button label="" icon="pi pi-file-excel" severity="warning" @click="exportCSV($event)" class="m-1" />
                </div>
            </template>
            <template #end> </template>
        </Toolbar>
        <div class="overflow-x-auto" v-if="routeParams && payrollData.length > 0">
            <DataTable
                ref="dt"
                dataKey="id"
                :value="payrollData"
                v-model:selection="filteredPayrollData"
                :rows="pagination.rows"
                :totalRecords="totalRecords"
                paginator
                :rowsPerPageOptions="[1, 2, 5, 10, 25, 50, 100]"
                v-model:filters="filters"
                :loading="isLoading"
                :responsiveLayout="'scroll'"
                :globalFilterFields="['national_id', 'user.first_name', 'user.last_name', 'user.email']"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                filterDisplay="menu"
                @filter="onFilter"
                @page="onPage"
                @sort="onSort"
            >
                <!-- Table Header -->
                <template #header>
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">Employee {{ selectedCategory || 'Payroll Data' }}</h3>
                        <InputText v-model="filters['global']" placeholder="Search..." class="p-inputtext-sm w-64" />
                    </div>
                </template>

                <!-- Column Definitions -->
                <Column field="employee.staffNo" header="Staff No" sortable />
                <Column field="employee.name" header="Employee" sortable />
                <Column field="data.wb_code" header="Registration No" sortable />
                <Column header="On">
                    <template #body="{ data }">
                        <Checkbox v-model="data.data.is_active" :binary="true" />
                    </template>
                </Column>
                <Column field="data.amount" header="Fixed Amount (KES)" sortable :filter="true" filterField="amount" filterPlaceholder="Filter by Amount" />
                <Column field="data.quantity" header="% of Basic Pay" sortable :filter="true" filterField="quantity" filterPlaceholder="Filter by %" />
                <Column field="data.employer_amount" header="Employer Fixed Amount (KES)" sortable />
                <Column field="data.quantity" header="Employer % of Basic Pay" sortable />
                <Column field="data.paid_to_date" header="Paid to Date" sortable />
                <Column header="Checkoff">
                    <template #body="{ data }">
                        <Checkbox v-model="data.data.checkoff" :binary="true" />
                    </template>
                </Column>
            </DataTable>
            <!-- Table Body -->
        </div>
        <!--modals-->
        <Dialog v-model:visible="showpayslipDialog" header="Pay Slip" :style="{ width: '1200px' }" :modal="true">
            <div class="container-fluid flex">
                <!-- Payslip Section -->
                <div class="grow p-4 w-6/10">
                    <!-- 60% width -->
                    <Payslip :id="selectedPayslipId" @payslip-info="getPaySlipInfo" ref="payslipRef" />
                </div>

                <!-- Toolbar Section -->
                <div v-if="payslipInfo">
                    <div class="w-4/10 flex flex-col space-y-2 p-4" v-if="payslipInfo.approval_status === 'approved'">
                        <!-- 40% width -->
                        <a href="#" class="text-sm rounded-lg bg-green-200 p-1">Payslip Approver</a>
                        <Button label="Print Payslip" icon="pi pi-print" @click="printPayslip" />
                        <Button label="Email Payslip" icon="pi pi-send" @click="emailPayslip" />
                    </div>
                    <div class="w-4/10 flex flex-col space-y-2 p-4" v-else>
                        <!-- 40% width -->
                        <a href="#" class="text-sm rounded-lg items-center bg-gray-20 p-1" v-if="payslipInfo.created_by && !payslipInfo.approval_submitted_by"
                            >Created on {{ payslipInfo.create_date }}:
                            {{ payslipInfo.approval_submitted_by.name }}
                        </a>
                        <a href="#" class="text-sm rounded-lg items-center bg-blue-300 p-1" v-if="payslipInfo.approval_submitted_by"
                            >{{ payslipInfo.approval_submitted_by.name }}[{{ payslipInfo.approval_submitted_by.email }}]submitted[{{ payslipInfo.approval_submit_date }}]</a
                        >
                        <a href="#" class="text-sm rounded-lg bg-gold-200 p-1" v-if="payslipInfo.approver">{{ payslipInfo.approver.name }}[{{ payslipInfo.approver.email }}]{{ payslipInfo.approved }}{{ payslipInfo.approval_date }}</a>
                        <Button label="Submit for Approval" icon="pi pi-send" class="p-button-secondary" v-if="payslipInfo.approval_submitted_by === null" @click="submitApproval" />
                        <Button label="Edit Slip" icon="pi pi-pencil text-blue-500" class="p-button-secondary m-0 p-0" @click="editSlip" />
                        <Button label="Re-run Slip" icon="pi pi-sync text-blue-300" class="p-button-secondary m-0 p-0" @click="rerunPayslip" />
                        <Button label="Delete Slip" icon="pi pi-trash text-red-500" class="p-button-secondary m-0 p-0" @click="confirmDeletePayslip(selectedPayslipId)" />
                    </div>
                </div>
            </div>
        </Dialog>
        <Dialog v-model:visible="deletePayslipDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="payslipInfo"
                    >Are you sure you want to delete payslip for <b>{{ payslipInfo.employee }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deletePayslipDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deletePayslip(selectedPayslipId)" />
            </template>
        </Dialog>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
.payroll-container {
    background-color: #f9fafb;
}

.shadow-lg {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
