<script setup>
import logoImage from '@/assets/images/logos/logo.png';
import PayslipItem from '@/components/hrm/payroll/payslip.vue';
import { generatePayslip } from '@/components/hrm/payroll/payslipGenerator';
import { coreService } from '@/services/shared/coreService';
import { useHrmFilters } from '@/composables/useHrmFilters';

const { filters, departments, regions, projects, loadFilters, resetFilters, getFilterParams } = useHrmFilters();
import { payrollService } from '@/services/hrm/payrollService';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const payslip = ref(null);
const logo = ref(logoImage);
const isLoading = ref(false);
const showpayslipDialog = ref(false);
const spinner_title = ref('Please wait...! Fetching data...!');
const dt = ref();
// Check if the node is expanded (for rendering child columns)
const employees = ref([]);
// Department filter options
const selectedDateFilter = ref(null);
const selectedEmployee = ref(null);
const selectedRegion = ref(null);
const selectedDepartment = ref(null);
const isDropdownVisible = ref(false);
const isCustomDatePickerVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
const date = ref('');
const payslips = ref([]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
// Process Payroll actions
onMounted(async () => {
    if (route.params) {
        fromDate.value = route.params.fromDate;
        toDate.value = route.params.toDate;
        console.log(route.params);
    }
    fetchEmployees();
    await loadFilters();
    fetchPayslips();
});
const fetchEmployees = () => {
    const params = {
        department: selectedDepartment.value ? selectedDepartment.value : null,
        region: selectedRegion.value ? selectedRegion.value : null,
        fromdate: fromDate.value ? fromDate.value : null,
        todate: toDate.value ? toDate.value : null
    };
    payrollService
        .listPayroll({ ...params, employees: true })
        .then((response) => {
            employees.value = response.data;
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
const fetchPayslips = async () => {
    const params = {
        department: selectedDepartment.value ? selectedDepartment.value : null,
        region: selectedRegion.value ? selectedRegion.value : null,
        fromdate: fromDate.value ? fromDate.value : null,
        todate: toDate.value ? toDate.value : null,
        employee_ids: selectedEmployee.value ? selectedEmployee.value : null
    };
    const response = await payrollService.listPayroll(params);
    const data = response.data;
    if (data) {
        payslips.value = [];
        data.forEach((payroll) => {
            payroll.payslips.forEach((payslip) => {
                payslips.value.push(payslip);
            });
        });
    }
};

function printPayslips() {
    generatePayslip(payslips.value);
}
const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
    isCustomDatePickerVisible.value = false; // Hide custom date picker when dropdown is toggled
};

const showCustomDatePicker = () => {
    isCustomDatePickerVisible.value = !isCustomDatePickerVisible.value;
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
    fetchPayslips();
    isDropdownVisible.value = false; // Close dropdown after submission
};

const cancelDates = () => {
    fromDate.value = '';
    toDate.value = '';
    isDropdownVisible.value = false; // Close dropdown on cancel
};

const formattedMonthYear = (payroll_date) => {
    const date = new Date(payroll_date);
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' });
};

// Toggle Process Payroll dropdown visibility
const toggleProcessDropdown = () => {
    processDropdownVisible.value = !processDropdownVisible.value;
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
                        @change="fetchPayslips"
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
                        @change="fetchPayslips"
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
                        @change="fetchPayslips"
                    />
                    <!-- Refresh Button -->
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fet" />
                </div>
            </template>
            <template #center>
                <h3>Total Payslips <Badge :value="payslips.slice(0, inf).length"></Badge></h3>
                <Button label="Print" icon="pi pi-print" severity="secondary" class="m-1" @click="printPayslips" />
                <Button label="Export PDF" icon="pi pi-file-pdf" severity="secondary" @click="printPayslips" />
            </template>
        </Toolbar>
        <div class="card">
            <ScrollPanel
                style="width: 100%; height: 800px"
                :dt="{
                    bar: {
                        background: '{primary.color}'
                    }
                }"
            >
                <!-- Payslip Container -->
                <div class="" v-if="payslips.length">
                    <div v-for="payslip in payslips" :key="payslip" class="space-y-6 mx-2 p-1 mx-auto bg-white rounded-xl shadow-md space-y-2 border border-gray-300 mb-8 pb-8 p-2">
                        <PayslipItem :id="selectedPayslipId" :payslip="payslip" @payslip-info="getPaySlipInfo" ref="payslipRef" />
                    </div>
                </div>
            </ScrollPanel>
        </div>
    </div>
</template>
