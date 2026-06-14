<script setup>
import Claim from '@/components/hrm/payroll/claim.vue';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useSensitiveModules } from '@/composables/useSensitiveModules';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const { showToast } = useToast();

// State Management
const dt = ref();
const isLoading = ref(false);
const selectedClaimId = ref(null);
const showClaimDialog = ref(false);
const editmode = ref(false);
const spinner_title = ref('Loading...');
const employees = ref([]);
const selectedEmployee = ref([]);
const selectedDepartment = ref([]);
const selectedRegion = ref(null);
const selectedProject = ref(null);
const filteredClaims = ref([]);
const isDropdownVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
const claimsData = ref([]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();
const { hasPermission, hasAnyPermission } = usePermissions();
const { canAccessExpenseClaims, canViewAllRecords } = useSensitiveModules();
const store = useStore();

// Current user
const currentUser = computed(() => store.state.auth.user);

// Check if user can view all claims or only their own
const canViewAllClaims = computed(() => canViewAllRecords('payroll', 'expenseclaims'));

// Process Actions for bulk operations
const ProcessActions = ref([
    {
        label: 'Approve',
        icon: 'pi pi-check',
        command: async () => {
            try {
                await payrollService.bulkUpdateClaims({
                    update_fields: { approved: true },
                    claim_ids: filteredClaims.value.map((item) => item.id)
                });
                showToast('success', 'Success', 'Claims Approved Successfully!', 3000);
                fetchClaims();
            } catch (error) {
                showToast('error', 'Error', 'An error occurred while updating claims', 3000);
            }
        }
    },
    {
        label: 'Decline',
        icon: 'pi pi-times',
        command: async () => {
            try {
                await payrollService.bulkUpdateClaims({
                    update_fields: { approved: false },
                    claim_ids: filteredClaims.value.map((item) => item.id)
                });
                showToast('success', 'Success', 'Claims Declined Successfully!', 3000);
                fetchClaims();
            } catch (error) {
                showToast('error', 'Error', 'An error occurred while updating claims', 3000);
            }
        }
    },
    {
        label: 'Schedule to Payroll',
        icon: 'pi pi-calendar-plus',
        command: async () => {
            try {
                await payrollService.bulkUpdateClaims({
                    update_fields: { schedule_to_payroll: true },
                    claim_ids: filteredClaims.value.map((item) => item.id)
                });
                showToast('success', 'Success', 'Claims scheduled to payroll Successfully!', 3000);
                fetchClaims();
            } catch (error) {
                showToast('error', 'Error', 'An error occurred while updating claims', 3000);
            }
        }
    }
]);

// Lifecycle
onMounted(() => {
    fromDate.value = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0];
    toDate.value = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
    loadFilters();
    fetchEmployees();
    fetchClaims();
});

// Fetch Data
const fetchEmployees = () => {
    const params = {
        department: selectedDepartment.value ? selectedDepartment.value : null,
        region: selectedRegion.value ? selectedRegion.value : null,
        fromdate: fromDate.value ? fromDate.value : null,
        todate: toDate.value ? toDate.value : null
    };
    employeeService
        .getEmployees(params)
        .then((response) => {
            employees.value = response.data?.results || response.data || [];
        })
        .catch((error) => {
            showToast('error', 'Error', error.toString(), 3000);
            console.error('Error fetching employees:', error);
        })
        .finally(() => {
            isLoading.value = false;
        });
};

function showClaim(id) {
    console.log(id);
    selectedClaimId.value = id;
    showClaimDialog.value = true;
    editmode.value = true;
}

const fetchClaims = async () => {
    const params = {
        department: selectedDepartment.value ? selectedDepartment.value : null,
        region: selectedRegion.value ? selectedRegion.value : null,
        project: selectedProject.value ? selectedProject.value : null,
        fromdate: fromDate.value ? fromDate.value : null,
        todate: toDate.value ? toDate.value : null,
        employee_ids: selectedEmployee.value ? selectedEmployee.value : null
    };
    
    // If user doesn't have elevated permissions, filter by their employee ID
    // Backend will also filter, but this ensures UI consistency
    if (!canViewAllClaims.value && !params.employee_ids) {
        const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
        params.employee_ids = employeeId;
        console.log('fetchClaims: Filtering for current user employee ID:', employeeId);
    }
    
    await payrollService.listClaims(params).then((response) => {
        let data = response.data.results;
        claimsData.value = data;
        filteredClaims.value = data;
    });
};

const printClaims = () => {};

const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
};

const formattedDateRange = computed(() => {
    const from = fromDate.value ? new Date(fromDate.value).toLocaleDateString() : 'Start Date';
    const to = toDate.value ? new Date(toDate.value).toLocaleDateString() : 'End Date';
    return `${from} - ${to}`;
});

const setFilter = (filter) => {
    const today = new Date();
    let from, to;

    switch (filter) {
        case 'today':
            from = new Date(today);
            to = new Date(today);
            break;
        case 'yesterday':
            from = new Date(today.setDate(today.getDate() - 1));
            to = new Date(from);
            break;
        case 'last7days':
            from = new Date(today.setDate(today.getDate() - 6));
            to = new Date();
            break;
        case 'last30days':
            from = new Date(today.setDate(today.getDate() - 29));
            to = new Date();
            break;
        case 'thisMonth':
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'lastMonth':
            from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            to = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'thisYear':
            from = new Date(today.getFullYear(), 0, 1);
            to = new Date(today.getFullYear(), 11, 31);
            break;
        default:
            from = '';
            to = '';
    }

    fromDate.value = moment(from).format('YYYY-MM-DD');
    toDate.value = moment(to).format('YYYY-MM-DD');
    isDropdownVisible.value = false; // Close dropdown after selection
};

const submitDates = () => {
    fetchClaims();
    isDropdownVisible.value = false; // Close dropdown after submission
};

const cancelDates = () => {
    fromDate.value = '';
    toDate.value = '';
    isDropdownVisible.value = false; // Close dropdown on cancel
};
</script>

<template>
    <div class="container-fluid">
        <!-- First Toolbar for Filters -->
        <Toolbar class="mb-4 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <div class="flex flex-wrap gap-3 items-center justify-start">
                    <!-- Date Filter Dropdown -->
                    <div class="relative filter-item w-full md:w-auto">
                        <Button :label="formattedDateRange || 'Select Date Range'" class="p-button-outlined w-full" @click="toggleDropdown" />
                        <div v-if="isDropdownVisible" class="absolute z-10 bg-white shadow-lg border rounded-lg p-2 mt-2 w-100 flex" @click.stop>
                            <!-- Dropdown Filters -->
                            <div class="w-100 p-4 gap-6">
                                <Button label="Today" class="p-button-text w-full text-left" @click="setFilter('today')" />
                                <!-- Add other predefined filter options here -->
                                <div class="w-full md:w-auto pl-4">
                                    <label class="block text-sm font-medium text-gray-700">From:</label>
                                    <Calendar v-model="fromDate" dateFormat="yy-mm-dd" class="w-full" />
                                    <label class="block text-sm font-medium text-gray-700">To:</label>
                                    <Calendar v-model="toDate" dateFormat="yy-mm-dd" class="w-full" />
                                    <div class="flex justify-between mt-4">
                                        <Button label="Submit" class="p-button-sm p-button-primary" @click="submitDates" />
                                        <Button label="Cancel" class="p-button-sm p-button-secondary" @click="cancelDates" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Responsive Filters with Full Width on Mobile -->
                    <MultiSelect
                        :options="employees"
                        optionLabel="name"
                        optionValue="id"
                        display="chip"
                        :maxSelectedLabels="3"
                        class="w-full md:w-64"
                        placeholder="All Employees"
                        v-model="selectedEmployee"
                        :filter="true"
                        filterPlaceholder="Search Employees"
                        @change="fetchClaims"
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
                        @change="fetchClaims"
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
                        @change="fetchClaims"
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
                        @change="fetchClaims"
                    />

                    <!-- Refresh Button -->
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchClaims" />
                </div>
            </template>
        </Toolbar>

        <!-- Second Toolbar for Table Status Tabs -->
        <Toolbar class="mb-2 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <Tabs value="0">
                    <TabList v-if="false">
                        <Tab v-for="tab in statusTabs" :key="tab.label" :value="tab.value" @click="filterByStatus(tab.value)">{{ tab.label }}</Tab>
                    </TabList>
                </Tabs>
            </template>
            <template #end>
                <div class="flex flex-wrap gap-2 items-center">
                    <IconField class="w-full md:w-auto">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </IconField>
                    <Button label="" icon="pi pi-file-pdf" severity="danger" @click="printClaims" class="m-1" />
                    <!-- Add button - only if user has add permission -->
                    <Button 
                        v-if="hasPermission('payroll.add_expenseclaims')"
                        label="Add" 
                        icon="pi pi-plus" 
                        severity="warning" 
                        @click="showClaimDialog = true" 
                        class="m-1" 
                    />
                </div>
                <!-- Bulk Action Buttons - only for users with change/delete permissions -->
                <div class="bulk-actions" v-if="canViewAllClaims">
                    <SplitButton label="With Selected.." :disabled="filteredClaims.length === 0" icon="pi pi-cog" class="p-button-text bg-gray-10" :model="ProcessActions"></SplitButton>
                </div>
            </template>
        </Toolbar>

        <!-- claims Data Table -->
        <DataTable
            ref="dt"
            dataKey="id"
            v-model:selection="filteredClaims"
            :value="claimsData"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            class="p-datatable-sm mt-4"
            responsiveLayout="scroll"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} loans"
        >
            <template #header>
                <div class="flex justify-between">
                    <div class="flex justify-start">
                        <Button label="Active" class="mr-2" severity="success" />
                        <Button label="Inactive" severity="warning" />
                    </div>
                </div>
            </template>
            <Column selectionMode="multiple" headerStyle="width: 3em" />
            <Column field="id" class="text-blue-600 font-medium hover:underline" header="Doc No.">
                <template #body="{ data }">
                    <a href="#" class="link" @click="showClaim(data.id)">{{ data.id }}</a></template
                ></Column
            >
            <Column field="application_date" header="Date" />
            <Column field="employee.staffNo" class="text-blue-600 font-medium hover:underline" header="Staff No.">
                <template #body="{ data }">
                    <a href="#" class="link" @click="showClaim(data.id)">{{ data.employee.staffNo }}</a></template
                ></Column
            >
            <Column field="employee.name" class="text-blue-600 font-medium hover:underline" header="Name">
                <template #body="{ data }">
                    <a href="#" class="link" @click="showClaim(data.id)">{{ data.employee.name }}</a></template
                ></Column
            >
            <Column field="category" header="Expense Category" />
            <Column field="amount" header="Amount" />
            <Column field="" class="text-blue-600 font-medium hover:underline" header="Actions">
                <template #body="{ data }">
                    <!-- Delete button - only for users with delete permission -->
                    <Button 
                        v-if="hasPermission('payroll.delete_expenseclaims')"
                        label="" 
                        icon="pi pi-trash" 
                        severity="danger" 
                        @click="deletClaim(data.id)" 
                        class="m-1 p-0" 
                    />
                    <Button label="" icon="pi pi-file-pdf" severity="danger" @click="printClaims" class="p-0" /> </template
            ></Column>
        </DataTable>
        <!--modals-->
        <Dialog v-model:visible="showClaimDialog" header="Expense Claim" :style="{ width: '1200px' }" :modal="true">
            <div class="container-fluid">
                <!-- Payslip Section -->
                <Claim :id="selectedClaimId" :employees="employees" :editmode="editmode" ref="claimRef" />
            </div>
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
