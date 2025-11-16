<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useEmployeeFilters } from '@/composables/useEmployeeFilters';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { formatDate, formatMonthForAPI, getMonthDateRange } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

// State Management
const dt = ref();
const isLoading = ref(false);
const isProcessing = ref(false);
const selectedMonth = ref(null);
const selectedDepartment = ref([]);
const selectedRegion = ref(null);
const selectedProject = ref(null);
const payslips = ref([]);
const selectedPayslips = ref([]);
const schedulePayslips = ref(false);
const scheduleTime = ref(null);
const notify = ref(false);
const spinner_title = ref('Processing...');

// Filters for DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();
const { buildEmployeeFilterParams } = useEmployeeFilters();

// Lifecycle
onMounted(() => {
    loadFilters();
    // Set default month to current month if not set
    if (!selectedMonth.value) {
        const now = new Date();
        selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    fetchpaySlips();
});

const fetchpaySlips = async () => {
    if (!selectedMonth.value) return;

    isLoading.value = true;
    try {
        // Get the date range for the selected month (first and last day)
        const dateRange = getMonthDateRange(selectedMonth.value);

    const params = buildEmployeeFilterParams({
        includeEmployeeFromStore: true,
        department: selectedDepartment.value,
        region: selectedRegion.value ? [selectedRegion.value] : null,
        project: selectedProject.value ? [selectedProject.value] : null,
        extra: {
            payment_period: dateRange.fromdate
        }
    });

        console.log('fetchpaySlips: API params', params);
        const response = await employeeService.getEmployees(params);
        console.log('fetchpaySlips: API response', response);
        console.log('fetchpaySlips: response.data', response.data);

        payslips.value = response.data || [];

        console.log('fetchpaySlips: payslips.value', payslips.value);
    } catch (error) {
        console.error('fetchpaySlips: Error', error);
        showToast('error', 'Error', 'Failed to fetch payslips', 3000);
    } finally {
        isLoading.value = false;
    }
};

const emailPayslips = async () => {
    if (selectedPayslips.value.length === 0) {
        showToast('warning', 'Warning', 'Please select payslips to send', 3000);
        return;
    }

    isProcessing.value = true;
    spinner_title.value = 'Sending payslips via email...';
    try {
        // Format the selected month to YYYY-MM-DD format for the first day of the month
        const formattedDate = formatMonthForAPI(selectedMonth.value);

        const params = {
            payslip_ids: selectedPayslips.value.map((p) => p.id),
            payment_period: formattedDate
        };

        await payrollService.sendPayslips(params);
        showToast('success', 'Success', 'Payslips sent successfully', 3000);
        selectedPayslips.value = [];
    } catch (error) {
        showToast('error', 'Error', 'Failed to send payslips', 3000);
    } finally {
        isProcessing.value = false;
    }
};

const emailDocs = async () => {
    if (!scheduleTime.value) {
        showToast('warning', 'Warning', 'Please select a schedule time', 3000);
        return;
    }

    isProcessing.value = true;
    spinner_title.value = 'Scheduling payslip emails...';
    try {
        const params = {
            payslip_ids: selectedPayslips.value.map((p) => p.id),
            payment_period: formatMonthForAPI(selectedMonth.value),
            schedule_time: scheduleTime.value,
            notify_user: notify.value
        };

        // TODO: Implement scheduled email functionality
        await payrollService.schedulePayslips(params);
        showToast('success', 'Success', 'Payslips scheduled successfully', 3000);

        // Reset form
        selectedPayslips.value = [];
        scheduleTime.value = null;
        schedulePayslips.value = false;
        notify.value = false;
    } catch (error) {
        showToast('error', 'Error', 'Failed to schedule payslips', 3000);
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <!-- Header Section -->
        <div class="max-w-7xl mx-auto mb-8">
            <div class="text-center mb-8">
                <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Email Payslips</h1>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Select employees and send their payslips via email or schedule for later delivery</p>
            </div>

            <!-- Quick Actions -->
            <div class="flex flex-wrap justify-center gap-4 mb-8">
                <router-link
                    :to="{ name: 'schedulePayslips' }"
                    class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 shadow-sm"
                >
                    <i class="pi pi-calendar-plus mr-2 text-blue-600"></i>
                    View Scheduled Emails
                </router-link>
            </div>
        </div>

        <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <!-- Main Content: Employee Selection -->
                <div class="xl:col-span-2">
                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <!-- Card Header -->
                        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                        <i class="pi pi-users text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <h2 class="text-xl font-semibold text-white">Select Employees</h2>
                                        <p class="text-blue-100 text-sm">Choose employees to send payslips</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-white text-2xl font-bold">{{ selectedPayslips.length }}</div>
                                    <div class="text-blue-100 text-sm">Selected</div>
                                </div>
                            </div>
                        </div>

                        <!-- Filters Section -->
                        <div class="p-6 border-b border-gray-100">
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Month Selection -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        <i class="pi pi-calendar mr-2 text-blue-600"></i>
                                        Payroll Month
                                    </label>
                                    <input
                                        type="month"
                                        v-model="selectedMonth"
                                        @change="fetchpaySlips"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                    />
                                </div>

                                <!-- Department Filter -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        <i class="pi pi-building mr-2 text-green-600"></i>
                                        Department
                                    </label>
                                    <MultiSelect
                                        :options="departments"
                                        optionLabel="title"
                                        optionValue="id"
                                        display="chip"
                                        :maxSelectedLabels="2"
                                        class="w-full"
                                        placeholder="All Departments"
                                        v-model="selectedDepartment"
                                        :filter="true"
                                        filterPlaceholder="Search Department"
                                        @change="fetchpaySlips"
                                    />
                                </div>

                                <!-- Region Filter -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        <i class="pi pi-map-marker mr-2 text-red-600"></i>
                                        Region
                                    </label>
                                    <MultiSelect
                                        :options="regions"
                                        optionLabel="name"
                                        optionValue="id"
                                        class="w-full"
                                        display="chip"
                                        :maxSelectedLabels="2"
                                        placeholder="All Regions"
                                        v-model="selectedRegion"
                                        :filter="true"
                                        filterPlaceholder="Search Region"
                                        @change="fetchpaySlips"
                                    />
                                </div>

                                <!-- Project Filter -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        <i class="pi pi-briefcase mr-2 text-purple-600"></i>
                                        Project
                                    </label>
                                    <MultiSelect :options="projects" optionLabel="title" optionValue="id" class="w-full" placeholder="All Projects" v-model="selectedProject" :filter="true" filterPlaceholder="Search Project" @change="fetchpaySlips" />
                                </div>
                            </div>

                            <!-- Search Bar -->
                            <div class="mt-6">
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="pi pi-search text-gray-400"></i>
                                    </div>
                                    <InputText
                                        v-model="filters['global'].value"
                                        placeholder="Search employees by name or staff number..."
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Data Table -->
                        <div class="p-6">
                            <DataTable
                                ref="dt"
                                dataKey="id"
                                :value="payslips"
                                v-model:selection="selectedPayslips"
                                selectionMode="multiple"
                                :paginator="true"
                                :rows="15"
                                :loading="isLoading"
                                :filters="filters"
                                :rowsPerPageOptions="[10, 15, 25, 50]"
                                class="p-datatable-sm"
                                responsiveLayout="scroll"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                                stripedRows
                                showGridlines
                                size="small"
                            >
                                <template #empty>
                                    <div class="text-center py-8">
                                        <i class="pi pi-users text-4xl text-gray-300 mb-4"></i>
                                        <p class="text-gray-500 text-lg mb-2">No employees found</p>
                                        <p class="text-gray-400 text-sm">No employees with active contracts for {{ formatDate(selectedMonth) }}</p>
                                    </div>
                                </template>

                                <template #loading>
                                    <div class="text-center py-8">
                                        <i class="pi pi-spin pi-spinner text-2xl text-blue-600 mb-2"></i>
                                        <p class="text-gray-600">Loading employee data...</p>
                                    </div>
                                </template>

                                <Column selectionMode="multiple" headerStyle="width: 3rem;" />
                                <Column field="staffNo" header="Staff No." :sortable="true" style="min-width: 120px">
                                    <template #body="slotProps">
                                        <span class="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                            {{ slotProps.data.staffNo }}
                                        </span>
                                    </template>
                                </Column>
                                <Column field="name" header="Employee Name" :sortable="true" style="min-width: 200px">
                                    <template #body="slotProps">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                                {{ slotProps.data.name.charAt(0).toUpperCase() }}
                                            </div>
                                            <span class="font-medium text-gray-900">{{ slotProps.data.name }}</span>
                                        </div>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar: Actions -->
                <div class="xl:col-span-1">
                    <div class="space-y-6">
                        <!-- Payroll Month Card -->
                        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                        <i class="pi pi-calendar text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-white">Payroll Period</h3>
                                        <p class="text-green-100 text-sm">Select month for payslips</p>
                                    </div>
                                </div>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            <i class="pi pi-calendar mr-2 text-green-600"></i>
                                            Month & Year
                                        </label>
                                        <input
                                            type="month"
                                            v-model="selectedMonth"
                                            @change="fetchpaySlips"
                                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 text-center text-lg font-medium"
                                        />
                                    </div>

                                    <div class="text-center">
                                        <p class="text-sm text-gray-500">Current Selection</p>
                                        <p class="text-lg font-semibold text-gray-900">{{ formatDate(selectedMonth) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Email Actions Card -->
                        <div v-if="selectedPayslips.length > 0" class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                                            <i class="pi pi-envelope text-white text-xl"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-semibold text-white">Send Payslips</h3>
                                            <p class="text-purple-100 text-sm">{{ selectedPayslips.length }} selected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="p-6 space-y-4">
                                <!-- Immediate Send -->
                                <Button
                                    label="Send Now"
                                    icon="pi pi-send"
                                    class="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                                    @click="emailPayslips"
                                    :loading="isProcessing"
                                />

                                <div class="relative">
                                    <div class="absolute inset-0 flex items-center">
                                        <div class="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div class="relative flex justify-center text-sm">
                                        <span class="px-2 bg-white text-gray-500">or</span>
                                    </div>
                                </div>

                                <!-- Schedule Option -->
                                <div class="space-y-3">
                                    <div class="flex items-center">
                                        <input type="checkbox" id="schedulePayslips" v-model="schedulePayslips" class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                                        <label for="schedulePayslips" class="ml-2 text-sm font-medium text-gray-700"> Schedule for later </label>
                                    </div>

                                    <div v-if="schedulePayslips" class="space-y-3 pl-6 border-l-2 border-purple-200">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                <i class="pi pi-clock mr-2 text-purple-600"></i>
                                                Send Time
                                            </label>
                                            <DatePicker v-model="scheduleTime" showTime hourFormat="12" class="w-full" placeholder="Select date & time" />
                                        </div>

                                        <div class="flex items-center">
                                            <input type="checkbox" id="notify" v-model="notify" class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                                            <label for="notify" class="ml-2 text-sm text-gray-700"> Notify me when done </label>
                                        </div>

                                        <Button
                                            label="Schedule Send"
                                            icon="pi pi-calendar-plus"
                                            class="w-full p-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 border-0 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                                            @click="emailDocs"
                                            :loading="isProcessing"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- No Selection State -->
                        <div v-if="selectedPayslips.length === 0" class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div class="p-6 text-center">
                                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="pi pi-users text-2xl text-gray-400"></i>
                                </div>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">No Employees Selected</h3>
                                <p class="text-gray-500 text-sm">Select employees from the table to send payslips</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading Overlay -->
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
