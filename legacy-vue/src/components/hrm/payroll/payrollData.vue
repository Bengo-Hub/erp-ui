<script setup>
import BenefitsTable from '@/components/hrm/payroll/parts/BenefitsTable.vue';
import DeductionsTable from '@/components/hrm/payroll/parts/DeductionsTable.vue';
import EarningsTable from '@/components/hrm/payroll/parts/EarningsTable.vue';
import LoansTable from '@/components/hrm/payroll/parts/LoansTable.vue';

import { employeeService } from '@/services/hrm/employeeService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

// Props from parent component
const props = defineProps({
    parentEmployees: {
        type: Array,
        default: () => []
    },
    filters: {
        type: Object,
        default: () => ({})
    }
});

const toast = useToast();

const activeTab = ref('deductions');
const data = ref([]);
const employees = ref([]);
const selectedEmployee = ref(null);
const isLoading = ref(false);
const showComponentsSelector = ref(false);
const selectedEmployeeForComponents = ref(null);
const items = ref([
    {
        route: 'deductions',
        label: 'Deductions',
        icon: 'pi pi-minus'
    },
    {
        route: 'earnings',
        label: 'Earnings',
        icon: 'pi pi-plus'
    },
    {
        route: 'benefits',
        label: 'Benefits',
        icon: 'pi pi-receipt'
    },
    {
        route: 'loans',
        label: 'Loans',
        icon: 'pi pi-money-bill'
    }
]);
const totalRecords = ref(0);
const loading = ref(false);

// Watch for changes in props.parentEmployees
watch(
    () => props.parentEmployees,
    (newEmployees) => {
        if (newEmployees && newEmployees.length > 0) {
            // Use employees from parent component
            employees.value = newEmployees;
        } else {
            // Fallback to fetching employees if not provided by parent
            fetchEmployees();
        }
    },
    { immediate: true }
);

onMounted(() => {
    // If no employees provided by parent, fetch them
    if (!props.parentEmployees || props.parentEmployees.length === 0) {
        fetchEmployees();
    } else {
        employees.value = props.parentEmployees;
    }
});

const getData = () => {
    if (selectedEmployee.value) {
        selectTab(activeTab.value);
    } else {
        data.value = [];
        totalRecords.value = 0;
    }
};

const fetchDataForTab = async (tabRoute) => {
    loading.value = true;
    try {
        let response;
        const params = { emp_id: selectedEmployee.value };
        switch (tabRoute) {
            case 'deductions':
                response = await employeeService.listEmployeeDeductions(params);
                break;
            case 'earnings':
                response = await employeeService.listEmployeeEarnings(params);
                break;
            case 'benefits':
                response = await employeeService.listEmployeeBenefits(params);
                break;
            case 'loans':
                response = await employeeService.listEmployeeLoans(params);
                break;
            default:
                response = { data: [] };
        }
        data.value = response?.data?.results || response?.data || [];
        totalRecords.value = response?.data?.count ?? data.value.length ?? 0;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.toString(),
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const selectTab = (tabRoute) => {
    activeTab.value = tabRoute;

    // If we have a selected employee and parent data, use that instead of fetching
    if (selectedEmployee.value && employees.value.length > 0) {
        const employee = employees.value.find((emp) => emp.id === selectedEmployee.value);
        if (employee) {
            switch (tabRoute) {
                case 'deductions':
                    data.value = employee.deductions || [];
                    break;
                case 'earnings':
                    data.value = employee.earnings || [];
                    break;
                case 'benefits':
                    data.value = employee.benefits || [];
                    break;
                case 'loans':
                    data.value = employee.loans || [];
                    break;
                default:
                    data.value = [];
            }
            totalRecords.value = data.value.length;
            return;
        }
    }

    // Fallback to fetching data if no parent data available
    const selectedTab = items.value.find((tab) => tab.route === tabRoute);
    if (selectedTab) fetchDataForTab(selectedTab.route);
};

const fetchEmployees = () => {
    // Use filters from parent component or default to empty object
    const params = props.filters || {};

    employeeService
        .getEmployees(params)
        .then((response) => {
            employees.value = response.data?.results || response.data || [];
        })
        .catch((error) => {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.toString(),
                life: 3000
            });
            console.error('Error fetching employees:', error);
        })
        .finally(() => {
            isLoading.value = false; // Always hide the loading spinner
        });
};

const openComponentsSelector = (employee) => {
    selectedEmployeeForComponents.value = employee;
    showComponentsSelector.value = true;
};

const handleComponentsUpdated = (components) => {
    // Update the employee data with new components
    if (selectedEmployeeForComponents.value) {
        const employeeIndex = employees.value.findIndex((emp) => emp.id === selectedEmployeeForComponents.value.id);
        if (employeeIndex !== -1) {
            employees.value[employeeIndex] = {
                ...employees.value[employeeIndex],
                deductions: components.deductions || [],
                earnings: components.earnings || [],
                benefits: components.benefits || [],
                loans: components.loans || []
            };
        }
    }

    // Refresh the current tab data
    if (selectedEmployee.value) {
        selectTab(activeTab.value);
    }

    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Employee components updated successfully!',
        life: 3000
    });
};
</script>

<template>
    <div class="card">
        <div class="row mb-4">
            <div class="flex items-center gap-4">
                <Dropdown v-model="selectedEmployee" :options="employees" @change="getData" optionLabel="name" optionValue="id" placeholder="Select Employee" class="w-full md:w-56" />
                <Button v-if="selectedEmployee" icon="pi pi-cog" label="Manage Components" @click="openComponentsSelector(employees.find((emp) => emp.id === selectedEmployee))" severity="secondary" />
            </div>
        </div>
        <Tabs v-model:value="activeTab">
            <TabList>
                <Tab v-for="tab in items" :key="tab.label" :value="tab.route">
                    <a v-ripple @click="selectTab(tab.route)" class="flex items-center gap-2 text-inherit">
                        <i :class="tab.icon" />
                        <span>{{ tab.label }}</span>
                    </a>
                </Tab>
            </TabList>
        </Tabs>

        <div v-if="loading" class="loading">Loading...</div>
        <div v-else>
            <div v-if="error" class="error">{{ error }}</div>
            <div v-else>
                <div v-if="activeTab === 'deductions' && selectedEmployee !== null">
                    <DeductionsTable :payrollData="data" :totalRecords="totalRecords" :empid="selectedEmployee" />
                </div>
                <div v-else-if="activeTab === 'earnings'">
                    <EarningsTable :payrollData="data" :totalRecords="totalRecords" :empid="selectedEmployee" />
                </div>
                <div v-else-if="activeTab === 'benefits'">
                    <BenefitsTable :payrollData="data" :totalRecords="totalRecords" :empid="selectedEmployee" />
                </div>
                <div v-else-if="activeTab === 'loans'">
                    <LoansTable :payrollData="data" :totalRecords="totalRecords" :empid="selectedEmployee" />
                </div>
            </div>
        </div>

        <!-- Payroll Components Selector Dialog -->
        <Dialog v-model:visible="showComponentsSelector" :style="{ width: '90vw', maxWidth: '1200px' }" header="Manage Employee Payroll Components" :modal="true" :closable="true">
            <PayrollComponentsSelector
                v-if="selectedEmployeeForComponents"
                :employeeId="selectedEmployeeForComponents.id"
                :employeeName="selectedEmployeeForComponents.name || selectedEmployeeForComponents.user?.first_name"
                @components-updated="handleComponentsUpdated"
            />
        </Dialog>
    </div>
</template>

<style scoped>
.loading,
.error {
    padding: 10px;
    text-align: center;
}
</style>
