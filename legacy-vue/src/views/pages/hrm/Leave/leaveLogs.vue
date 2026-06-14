<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { leaveService } from '@/services/hrm/leaveService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const loading = ref(false);
const leaveLogs = ref([]);
const filteredLogs = ref([]);
const buttondisplay = ref(null);
const selectedEmployee = ref(null);
const selectedLeaveType = ref(null);

const employees = ref([]);
const leaveTypes = ref([]);

// Fetch leave logs
const fetchLeaveLogs = async () => {
    loading.value = true;
    try {
        const params = {
            employee_id: selectedEmployee.value?.value,
            category_id: selectedLeaveType.value?.id,
            date: buttondisplay.value
        };

        const response = await leaveService.getLogs(params);
        leaveLogs.value = response.data.results;
    } catch (error) {
        console.error('Error fetching leave logs:', error);
        showToast('error', 'Error', 'Failed to fetch leave logs', 3000);
    } finally {
        loading.value = false;
    }
};

// Fetch employees
const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees();
        employees.value = [
            { label: 'All Employees', value: null },
            ...response.data.results.map((emp) => ({
                label: `${emp.user.first_name} ${emp.user.last_name}`,
                value: emp.id
            }))
        ];
    } catch (error) {
        console.error('Error fetching employees:', error);
        showToast('error', 'Error', 'Failed to fetch employees', 3000);
    }
};

// Fetch leave categories
const fetchLeaveCategories = async () => {
    try {
        const response = await leaveService.getCategories();
        leaveTypes.value = response.data.results.map((category) => ({
            label: category.name,
            value: category.id
        }));
    } catch (error) {
        console.error('Error fetching leave categories:', error);
        showToast('error', 'Error', 'Failed to fetch leave categories', 3000);
    }
};

// Apply filters
const applyFilters = () => {
    fetchLeaveLogs();
};

// Initialize data
onMounted(() => {
    fetchEmployees();
    fetchLeaveCategories();
    fetchLeaveLogs();
});
</script>
<template>
    <div class="flex justify-center font-bold bg-primary text text-white h-10 mb-2">
        <h2 class="text-xl primary-text text-white pt-2">Leave Logs</h2>
    </div>
    <div class="">
        <Toolbar>
            <template #start>
                <div class="flex-auto mr-2">
                    <DatePicker v-model="buttondisplay" showIcon fluid :showOnFocus="false" inputId="buttondisplay" />
                </div>
                <MultiSelect :options="employees" optionLabel="label" class="w-full md:w-40 mr-2" v-model="selectedEmployee" :filter="true" placeholder="Select Employee" filterPlaceholder="Search Employee" @change="applyFilters" />
                <Dropdown v-model="selectedLeaveType" :options="leaveTypes" optionLabel="label" placeholder="Select Leave Category" class="w-full md:w-60" />
            </template>
            <template #end>
                <Button icon="pi pi-refresh" />
            </template>
        </Toolbar>
        <Toolbar class="mt-2">
            <template #end>
                <div class="flex mr-6">
                    <IconField class="w-full md:w-auto">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText placeholder="Search..." />
                    </IconField>
                </div>
                <div>
                    <Button icon="pi pi-file-excel" class="m-1" />
                    <Button icon="pi pi-file-pdf" class="m-1" />
                    <Button icon="pi pi-print" class="m-1" />
                </div>
            </template>
        </Toolbar>

        <!--Data Table-->
        <DataTable
            ref="dt"
            dataKey="id"
            v-model:selection="filteredLogs"
            :value="leaveLogs"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25, 50, 100]"
            class="card p-datatable-sm mt-4"
            responsiveLayout="scroll"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
        >
            <div class="">
                <Column selectionMode="multiple" headerStyle="width: 3em" />
                <Column field="date" header="Date" />
                <Column field="description" header="Description" />
                <Column field="user" header="User" />
                <Column field="days" header="Days" />
                <Column field="balance" header="Balance" />
            </div>
        </DataTable>
    </div>
</template>
