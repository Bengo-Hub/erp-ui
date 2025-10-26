<script setup>
import Payslip from '@/components/hrm/payroll/payslip.vue';
import { generatePayslip } from '@/components/hrm/payroll/payslipGenerator';
import Spinner from '@/components/ui/Spinner.vue';
import { payrollService } from '@/services/hrm/payrollService';
import { formatCurrency } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm'; // PrimeVue confirm dialog
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router'; // Import Vue Router

const { showToast } = useToast();
const router = useRouter(); // Get the router instance
const isLoading = ref(false);
const selectedPayslipId = ref();
const showpayslipDialog = ref(false);
const spinner_title = ref('Please wait...! Fetching data...!');
const dt = ref();
// Check if the node is expanded (for rendering child columns)
const isNodeExpanded = ref(false);
const employees = ref([]);
// Department filter options
const selectedDateFilter = ref(null);
const selectedEmployee = ref(null);
const selectedRegion = ref(null);
const selectedDepartment = ref(null);
const processDropdownVisible = ref(false);
const filteredSlips = ref([]);
const statusfilteredPayslips = ref([]);
const isDropdownVisible = ref(false);
const isCustomDatePickerVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
const date = ref('');
const payslips = ref([]);
const payslipRef = ref('payslipRef');
const payslipstoPrint = ref([]);
const successMessage = ref('');
const errorMessage = ref('');
const confirm = useConfirm();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const deletePayslipDialog = ref(false);
const payslipInfo = ref(null);
const getPaySlipInfo = (info) => {
    payslipInfo.value = info;
};
function getMonthStartDate(monthYear) {
    // Parse the monthYear (e.g., "September 2024")
    const [month, year] = monthYear.split(' ');
    const startDate = new Date(new Date(`${month} 1, ${year}`).getFullYear(), new Date(`${month} 1, ${year}`).getMonth(), 2);
    return startDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}
function getMonthEndDate(monthYear) {
    // Parse the monthYear (e.g., "September 2024")
    const [month, year] = monthYear.split(' ');
    const endDate = new Date(new Date(`${month} 1, ${year}`).getFullYear(), new Date(`${month} 1, ${year}`).getMonth() + 1, 1); // Get last date of the month
    return endDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}
// Process Payroll actions
const payrollProcessActions = ref([
    {
        label: 'Payment Voucher',
        icon: 'pi pi-file',
        command: () => {
            router.push({ name: 'process-payroll', params: { employment_type: 'casual' } });
        }
    }
]);
const payrollDataActions = ref([
    {
        label: 'Earnings',
        icon: 'pi pi-file',
        command: () => {
            router.push({ name: 'employee_spreadsheet', params: { employment_type: 'casual', item: 'earnings' } });
        }
    },
    {
        label: 'Deductions',
        icon: 'pi pi-file',
        command: () => {
            router.push({ name: 'employee_spreadsheet', params: { employment_type: 'casual', item: 'deductions' } });
        }
    },
    {
        label: 'Loans',
        icon: 'pi pi-file',
        command: () => {
            router.push({ name: 'employee_spreadsheet', params: { employment_type: 'casual', item: 'loans' } });
        }
    }
]);
const publishActions = ref([
    {
        label: 'Publish',
        icon: 'pi pi-paperclip',
        command: () => {}
    },
    { label: 'Unpublish', icon: 'pi pi-history', command: () => {} }
]);
const approvalActions = ref([
    { label: 'Submit for approval', icon: 'pi pi-send', command: () => {} },
    { label: 'Approve', icon: 'pi pi-check', command: () => {} },
    { label: 'Disapprove', icon: 'pi pi-ban', command: () => {} },
    { label: 'Submit for Disapproval', icon: 'pi pi-send', command: () => {} }
]);
// Status filter tabs
// Tabs for status filtering with count
const statusTabs = computed(() => [
    { label: `All (${countStatus('all')})`, value: 'all' },
    { label: `Approved (${countStatus('approved')})`, value: 'approved' },
    { label: `Pending (${countStatus('pending')})`, value: 'pending' },
    { label: `Draft (${countStatus('draft')})`, value: 'draft' },
    { label: `Disapproved (${countStatus('disapproved')})`, value: 'disapproved' }
]);

// Function to count payslips by status
const countStatus = (status) => {
    if (status === 'all') {
        return payslips.value.payslips.length;
    } else {
        return payslips.value.payslips.filter((payslip) => payslip.approval_status === status).length;
    }
};

// Filter payslips by the selected status
const filterByStatus = (status) => {
    if (status === 'all') {
        payslips.value = statusfilteredPayslips.value.length;
    } else {
        payslips.value = statusfilteredPayslips.value.filter((payslip) => payslip.children.filter((item) => item.approval_status === status));
    }
};

onMounted(async () => {
    fromDate.value = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0];
    toDate.value = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
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
            showToast('error', 'Error', error.toString(), 3000);
            console.error('Error fetching employees:', error);
        })
        .finally(() => {
            isLoading.value = false; // Always hide the loading spinner
        });
};
function showPayslip(id) {
    selectedPayslipId.value = id;
    showpayslipDialog.value = true;
    getPaySlipInfo();
}
const fetchPayslips = async () => {
    const params = {
        department: selectedDepartment.value ? selectedDepartment.value : null,
        region: selectedRegion.value ? selectedRegion.value : null,
        fromdate: fromDate.value ? fromDate.value : null,
        todate: toDate.value ? toDate.value : null,
        employee_ids: selectedEmployee.value ? selectedEmployee.value : null
    };
    await payrollService.listPayroll(params).then((response) => {
        let data = response.data;
        if (data) {
            payslipstoPrint.value = [];
            data.forEach((payroll) => {
                payroll.payslips.forEach((payslip) => {
                    payslipstoPrint.value.push(payslip);
                });
            });
        }
        payslips.value = formatPayrollData(data);
        filteredSlips.value = formatPayrollData(data);
    });
};
const deletePayslip = async (payslipId) => {
    isLoading.value = true;
    successMessage.value = '';
    errorMessage.value = '';

    try {
        const response = await payrollService.deletePayrollRecord(payslipId);

        if (response.data.success) {
            successMessage.value = response.data.data.message;
            fetchPayslips();
            deletePayslipDialog.value = false;
            showpayslipDialog.value = false;
            showToast('success', 'Success', successMessage.value, 5000);
        } else {
            errorMessage.value = response.data.detail || 'An error occurred.';
            showToast('error', 'Error', errorMessage.value, 3000);
        }
    } catch (error) {
        errorMessage.value = error.response?.data?.detail || error.message || 'An unexpected error occurred.';
        showToast('error', 'Error', errorMessage.value, 3000);
    } finally {
        isLoading.value = false;
    }
};
const confirmDeletePayslip = () => {
    deletePayslipDialog.value = true;
};
// Expand logic
const expandedKeys = ref({});

// Function to format data for the TreeTable
function formatPayrollData(data) {
    return data.map((payroll) => ({
        key: `${payroll.year}-${payroll.month}`, // Unique key for each node
        data: {
            monthYear: new Date(payroll.year, payroll.month - 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric'
            }),
            totalPayslips: payroll.total_payslips,
            basicPay: formatCurrency(payroll.total_basic_pay),
            netPay: formatCurrency(payroll.total_net_pay),
            approvalStatus: `${payroll.approved_payslips}/${payroll.unapproved_payslips}`
        },
        children: payroll.payslips.map((payslip) => ({
            key: `payslip-${payslip.id}`,
            id: payslip.id,
            data: {
                staffNo: payslip.employee.staffNo,
                name: payslip.employee.name,
                basicPay: new Intl.NumberFormat().format(payslip.employee.basic_salary),
                netPay: new Intl.NumberFormat().format(payslip.net_pay),
                approvalStatus: payslip.approval_status,
                published: payslip.published
            }
        }))
    }));
}

// Action Handlers
function viewMusterRoll(node) {
    console.log(`Viewing muster roll for month: ${node.data.monthYear}`);
}

const printPayslips = () => {
    spinner_title.value = 'Please wait...! Generating Payslips!';
    isLoading.value = true;
    generatePayslip(payslipstoPrint.value, showToast, false);
    isLoading.value = false;
};
const printPayslip = () => {
    const event = new CustomEvent('print-payslip');
    window.dispatchEvent(event);
};
const emailPayslip = () => {
    const event = new CustomEvent('email-payslip');
    window.dispatchEvent(event);
};

const rerunPayslip = async () => {
    const payload = {
        project: [],
        department: [],
        region: [],
        payment_period: moment(new Date(payslipInfo.value.payroll_period)).format('YYYY-MM'),
        employee_ids: [payslipInfo.value.empid],
        recover_advances: true,
        command: 'rerun',
        onSuccess: (data) => {
            showpayslipDialog.value = false;
            isLoading.value = false;
            fetchPayslips();
        },
        onError: (error) => {
            isLoading.value = false;
            showToast('error', error.summary, error.detail, 10000);
        }
    };
    spinner_title.value = `Please wait! Re-running payslip...!`;
    isLoading.value = true;
    await processPayrollRequest(payload);
};

// Expand node on interaction
function onNodeExpand(event) {
    console.log(event.key);
    isNodeExpanded.value = true;
    const key = event.key;
    expandedKeys.value = { ...expandedKeys.value, [key]: true };
}
const onNodeCollapse = (event) => {
    const key = event.key;
    isNodeExpanded.value = false;
    delete expandedKeys.value[key];
};
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

const applyPayrollAction = (event) => {
    // Implement action for selected items
    console.log('Action applied to selected items:' + event);
};

// Toggle Process Payroll dropdown visibility
const toggleProcessDropdown = () => {
    processDropdownVisible.value = !processDropdownVisible.value;
};

// Remove local formatCurrency since we're importing it from utils/formatters
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
                        placeholder="All Contacts"
                        v-model="selectedEmployee"
                        :filter="true"
                        filterPlaceholder="Search Contacts"
                        @change="fetchPayslips"
                    />
                    <MultiSelect
                        :options="departments"
                        optionLabel="title"
                        optionValue="id"
                        display="chip"
                        :maxSelectedLabels="3"
                        class="w-full md:w-64"
                        placeholder="All Users"
                        v-model="selectedDepartment"
                        :filter="true"
                        filterPlaceholder="Search User"
                        @change="fetchPayslips"
                    />
                    <!-- Refresh Button -->
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchPayslips" />
                </div>
            </template>
            <template #end>
                <div class="flex flex-wrap gap-3 items-center justify-start">
                    <SplitButton label="Create New.." icon="pi pi-money-bill" class="p-button-primary" @click="applyPayrollAction" :model="payrollProcessActions"></SplitButton>
                    <SplitButton label="Process Payroll" icon="pi pi-money-bill" class="p-button-primary" @click="applyPayrollAction" :model="payrollDataActions"></SplitButton>
                    <router-link :to="{ name: 'emailPayslips', params: { item: 'consultants' } }">
                        <Button label="Email Payment Vouchers" icon="pi pi-message" class="p-button-primary" />
                    </router-link>
                    <router-link :to="{ name: 'payrollFormulas' }">
                        <Button label="Formulas" icon="pi pi-sliders-h" class="p-button-secondary" />
                    </router-link>
                    <router-link :to="{ name: 'payrollComponents' }">
                        <Button label="Components" icon="pi pi-list" class="p-button-secondary" />
                    </router-link>
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
                    <Button label="" icon="pi pi-file-pdf" severity="danger" @click="printPayslips" class="m-1" />
                    <Button label="" icon="pi pi-file-excel" severity="warning" @click="exportCSV($event)" class="m-1" />
                </div>
            </template>
        </Toolbar>

        <!--modals-->
        <Dialog v-model:visible="showpayslipDialog" header="Pay Slip" :style="{ width: '1200px' }" :modal="true">
            <div class="container-fluid flex">
                <!-- Payslip Section -->
                <div class="flex-grow p-4 w-6/10">
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
