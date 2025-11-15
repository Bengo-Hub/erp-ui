<script setup>
import Payslip from '@/components/hrm/payroll/payslip.vue';
import { generatePayslip } from '@/components/hrm/payroll/payslipGenerator';
import Spinner from '@/components/ui/Spinner.vue';
import { useEmployeeMapping } from '@/composables/useEmployeeMapping';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { formatCurrency } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { processPayrollRequest } from './processPayrollRequest';

const { showToast } = useToast();
const { departments, regions, loadFilters } = useHrmFilters();
const { hasAnyPermission, hasPermission } = usePermissions();
const store = useStore();
const router = useRouter();

// Current user
const currentUser = computed(() => store.state.auth.user);
const roles = computed(() => Array.isArray(currentUser.value?.roles) ? currentUser.value.roles.map((r) => String(r).toLowerCase()) : []);
const isManagerial = computed(() => hasAnyPermission(['change_payslip', 'delete_payslip', 'add_payslip']));
const isStaffOnly = computed(() => {
    const r = roles.value;
    if (!r || r.length === 0) return false;
    const elevated = ['admin', 'superusers', 'hr', 'finance', 'procurement', 'inventory', 'cto', 'ceo', 'manager', 'system'];
    const hasElevated = elevated.some((er) => r.includes(er));
    return r.includes('staff') && !hasElevated && !isManagerial.value;
});
const { hasEmployeeMapping, requireEmployeeMapping } = useEmployeeMapping();
const isLoading = ref(false);
const selectedPayslipId = ref();
const showpayslipDialog = ref(false);
const spinner_title = ref('Please wait...! Fetching data...!');
const dt = ref();
const isNodeExpanded = ref(false);
const employees = ref([]);
const payslipAudits = ref([]);
// const selectedDateFilter = ref(null);
const selectedEmployee = ref(null);
const selectedRegion = ref(null);
const selectedDepartment = ref(null);
const filtersLocked = computed(() => isStaffOnly.value && hasEmployeeMapping.value);
// const processDropdownVisible = ref(false);
// const filteredSlips = ref([]);
// const statusfilteredPayslips = ref([]);
const isDropdownVisible = ref(false);
const isCustomDatePickerVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
// const date = ref('');
const payslips = ref([]);
const payslipRef = ref('payslipRef');
const payslipstoPrint = ref([]);
// const successMessage = ref('');
// const errorMessage = ref('');
// const confirm = useConfirm();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const deletePayslipDialog = ref(false);
const payslipInfo = ref(null);
const selectedNodes = ref([]);
const getPaySlipInfo = (info) => {
    payslipInfo.value = info;
    const params = {
        payslipid: selectedPayslipId.value
    };
    payrollService
        .getPayrollAudits(params)
        .then((res) => {
            payslipAudits.value = res.data;
        })
        .catch((e) => {
            console.log(e);
        });
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
        label: 'Process Payroll',
        icon: 'pi pi-money-bill',
        command: () => {
            router.push({ name: 'process-payroll', params: { employment_type: 'regular' } });
        }
    },
    {
        label: 'Email Pay Slips',
        icon: 'pi pi-envelope',
        command: () => {
            router.push({ name: 'emailPayslips' });
        }
    },
    {
        label: 'Print Pay Slips',
        icon: 'pi pi-print',
        command: () => {
            router.push({
                name: 'regularpayroll-printpayslips',
                params: {
                    fromDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0],
                    toDate: new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0]
                }
            });
        }
    }
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

// Computed property for formatted payslips data
const formattedPayslips = computed(() => {
    if (!payslips.value || !Array.isArray(payslips.value)) {
        console.log('formattedPayslips: No data available', payslips.value);
        return [];
    }
    console.log('formattedPayslips: Processing data', payslips.value);
    const formatted = formatPayrollData(payslips.value);
    console.log('formattedPayslips: Formatted result', formatted);
    return formatted;
});

// Function to count payslips by status
const countStatus = (status) => {
    if (!payslips.value || !Array.isArray(payslips.value)) {
        return 0;
    }

    if (status === 'all') {
        // Count total payslips across all months
        let totalCount = 0;
        payslips.value.forEach((monthData) => {
            if (monthData.payslips && Array.isArray(monthData.payslips)) {
                totalCount += monthData.payslips.length;
            }
        });
        return totalCount;
    } else {
        // Count payslips by status across all months
        let totalCount = 0;
        payslips.value.forEach((monthData) => {
            if (monthData.payslips && Array.isArray(monthData.payslips)) {
                totalCount += monthData.payslips.filter((payslip) => payslip.approval_status === status).length;
            }
        });
        return totalCount;
    }
};

// Filter payslips by the selected status
const filterByStatus = (status) => {
    if (!payslips.value || !Array.isArray(payslips.value)) {
        return;
    }

    if (status === 'all') {
        // Show all payslips
        return;
    }

    // Filter payslips by status across all months
    const filteredData = payslips.value.map((monthData) => {
        if (monthData.payslips && Array.isArray(monthData.payslips)) {
            const filteredPayslips = monthData.payslips.filter((payslip) => payslip.approval_status === status);
            return {
                ...monthData,
                payslips: filteredPayslips,
                total_payslips: filteredPayslips.length
            };
        }
        return monthData;
    });

    // Update the payslips data with filtered results
    payslips.value = filteredData;
};

onMounted(async () => {
    console.log('onMounted: Component mounted');
    // Centralized mapping guard
    if (isStaffOnly.value) {
        const ok = await requireEmployeeMapping(true);
        if (!ok) return;
    }
    fromDate.value = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0];
    toDate.value = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
    console.log('onMounted: Date range set', { fromDate: fromDate.value, toDate: toDate.value });
    await loadFilters();
    // If staff-only and mapped to an employee, lock filters to user's scope
    if (isStaffOnly.value && hasEmployeeMapping.value) {
        try {
            const employeeId = currentUser.value?.employee_id;
            selectedEmployee.value = [employeeId];
            const hrDetails = await employeeService.getEmployeeHRDetails(employeeId);
            if (hrDetails) {
                selectedDepartment.value = hrDetails?.department_id || hrDetails?.department || selectedDepartment.value;
                selectedRegion.value = hrDetails?.region_id || hrDetails?.region || selectedRegion.value;
            }
        } catch (e) {
            console.warn('Failed to load employee HR details for staff scoping', e);
        }
    }
    fetchEmployees();
    fetchPayslips();
});
const fetchEmployees = () => {
    const toArray = (val) => {
        if (val == null) return [];
        if (Array.isArray(val)) return val;
        return [val];
    };
    const params = {
        'department[]': toArray(selectedDepartment.value),
        'region[]': toArray(selectedRegion.value),
        fromdate: fromDate.value ? fromDate.value : null,
        todate: toDate.value ? toDate.value : null
    };
    payrollService
        .getEmployees(params)
        .then((response) => {
            const resp = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            if (isStaffOnly.value) {
                const selfId = currentUser.value?.employee_id || currentUser.value?.id;
                employees.value = resp.filter((e) => e.id === selfId);
            } else {
                employees.value = resp;
            }
        })
        .catch((error) => {
            showToast('error', 'Error', error.toString(), 3000);
            console.error('Error fetching employees:', error);
        })
        .finally(() => {
            isLoading.value = false; // Always hide the loading spinner
        });
};
// Removed: fetchDepartments and fetchRegions - now using useHrmFilters composable
function showPayslip(id) {
    selectedPayslipId.value = id;
    showpayslipDialog.value = true;
    // Find the payslip info from the current data
    const payslipData = findPayslipById(id);
    if (payslipData) {
        // Pass the existing payslip data to avoid redundant API calls
        getPaySlipInfo(payslipData);
    } else {
        showToast('error', 'Error', 'Payslip data not found', 3000);
    }
}

// Helper function to find payslip by ID
const findPayslipById = (id) => {
    if (!payslips.value || !Array.isArray(payslips.value)) {
        return null;
    }

    for (const monthData of payslips.value) {
        if (monthData.payslips && Array.isArray(monthData.payslips)) {
            const payslip = monthData.payslips.find((p) => p.id === id);
            if (payslip) {
                return payslip;
            }
        }
    }
    return null;
};
const fetchPayslips = async (params = {}) => {
    try {
        const toArray = (val) => {
            if (val == null) return [];
            if (Array.isArray(val)) return val;
            return [val];
        };
        const hasManagerialPerms = isManagerial.value;

        // Compose filter params from UI selections
        const filterParams = {
            ...params,
            'department[]': toArray(selectedDepartment.value),
            'region[]': toArray(selectedRegion.value)
        };

        // If managerial and employees selected, pass them through
        if (hasManagerialPerms && selectedEmployee.value && selectedEmployee.value.length) {
            filterParams.employee = selectedEmployee.value;
        }

        // If not managerial but mapped to employee, always scope to self
        if (!hasManagerialPerms && hasEmployeeMapping.value) {
            const employeeId = currentUser.value?.employee_id;
            filterParams.employee = employeeId;
            console.log('fetchPayslips: Filtering for current user employee ID:', employeeId);
        } else {
            console.log('fetchPayslips: User has managerial permissions, applying optional filters');
        }

        const response = await payrollService.listPayroll(filterParams);
        console.log('fetchPayslips: API response', response);
        console.log('fetchPayslips: response.data', response.data);
        payslips.value = response.data;
    } catch (error) {
        console.error('Error fetching payslips:', error);
    }
};

const deletePayslip = async (payslipId) => {
    try {
        await payrollService.deletePayrollRecord(payslipId);
        showToast('success', 'Success', 'Payslip deleted successfully!', 3000);
        fetchPayslips();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete payslip', 3000);
    }
};
const confirmDeletePayslip = () => {
    deletePayslipDialog.value = true;
};
// Expand logic
const expandedKeys = ref({});

// Function to format data for the TreeTable
function formatPayrollData(data) {
    console.log('formatPayrollData: Input data', data);

    const formatted = data.map((payroll) => {
        console.log('formatPayrollData: Processing payroll month', payroll);

        return {
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
            children: payroll.payslips.map((payslip) => {
                console.log('formatPayrollData: Processing payslip', payslip);

                return {
                    key: `payslip-${payslip.id}`,
                    id: payslip.id,
                    data: {
                        staffNo: payslip.employee.staffNo,
                        name: payslip.employee.name,
                        basicPay: new Intl.NumberFormat().format(payslip.employee.basic_salary),
                        netPay: new Intl.NumberFormat().format(payslip.net_pay),
                        approvalStatus: payslip.approval_status || 'pending',
                        published: payslip.published || false
                    }
                };
            })
        };
    });

    console.log('formatPayrollData: Final formatted result', formatted);
    return formatted;
}

// Action Handlers

const printPayslips = () => {
    spinner_title.value = 'Please wait...! Generating Payslips!';
    isLoading.value = true;
    generatePayslip(payslipstoPrint.value, showToast, false);
    isLoading.value = false;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const submitApproval = async () => {
    try {
        isLoading.value = true;
        spinner_title.value = 'Submitting for approval...';

        // TODO: Implement submit approval API call
        // const response = await payrollService.submitForApproval(selectedPayslipId.value);

        showToast('success', 'Success', 'Payslip submitted for approval successfully!', 3000);
        showpayslipDialog.value = false;
        fetchPayslips(); // Refresh the list
    } catch (error) {
        console.error('Error submitting for approval:', error);
        showToast('error', 'Error', 'Failed to submit for approval', 3000);
    } finally {
        isLoading.value = false;
    }
};

const editSlip = () => {
    // Navigate to edit payslip page or open edit modal
    router.push({
        name: 'edit-payslip',
        params: {
            id: selectedPayslipId.value,
            employment_type: 'regular'
        }
    });
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
        onSuccess: () => {
            showpayslipDialog.value = false;
            isLoading.value = false;
            fetchPayslips();
        },
        onError: (error) => {
            isLoading.value = false;
            showToast('error', 'Error', error.summary, 10000);
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

// Helper function to safely display approval status
const getApprovalStatusDisplay = (approvalStatus) => {
    if (!approvalStatus) {
        return 'N/A';
    }

    // If it's a string containing a slash (parent node format: "approved/unapproved")
    if (typeof approvalStatus === 'string' && approvalStatus.includes('/')) {
        const parts = approvalStatus.split('/');
        return `${parts[0]}/${parts[1]}`;
    }

    // If it's a simple status string (child node format: "approved", "pending", etc.)
    return approvalStatus.toString();
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
                        :disabled="filtersLocked"
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
                        :disabled="filtersLocked"
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
                        :disabled="filtersLocked"
                    />

                    <!-- Refresh Button -->
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchPayslips" />
                </div>
            </template>

            <template #end>
                <SplitButton
                    v-if="isManagerial"
                    label="Process Payroll"
                    icon="pi pi-money-bill"
                    class="p-button-primary"
                    @click="applyPayrollAction"
                    :model="payrollProcessActions"
                />
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
                    <Button v-if="isManagerial || hasPermission('view_payslip')" label="" icon="pi pi-file-pdf" severity="danger" @click="printPayslips" class="m-1" />
                    <Button v-if="isManagerial || hasPermission('view_payslip')" label="" icon="pi pi-file-excel" severity="warning" @click="exportCSV($event)" class="m-1" />
                </div>
            </template>
        </Toolbar>

        <!-- Payroll Data Table -->
        <TreeTable
            ref="dt"
            dataKey="id"
            :paginator="true"
            :rows="5"
            v-model:expandedKeys="expandedKeys"
            v-model:selection="selectedNodes"
            selectionMode="checkbox"
            :metaKeySelection="false"
            :rowsPerPageOptions="[1, 2, 5, 10, 25, 50, 100]"
            :value="formattedPayslips"
            @node-expand="onNodeExpand"
            @node-collapse="onNodeCollapse"
        >
            <Column selectionMode="multiple" style="width: 3rem"></Column>
            <Column field="monthYear" header="Month" expander v-if="!isNodeExpanded" style="width: 250px"></Column>
            <Column field="staffNo" class="text-blue-600 font-medium hover:underline" header="Staff No" v-if="isNodeExpanded" expander style="width: 250px">
                <template #body="{ node }">
                    <a href="#" class="link" @click="showPayslip(node.id)">{{ node.data.staffNo }}</a></template
                >
            </Column>
            <Column field="name" class="text-blue-600 font-medium hover:underline" header="Name" v-if="isNodeExpanded" style="width: 250px">
                <template #body="{ node }">
                    <a href="#" class="link" @click="showPayslip(node.id)">{{ node.data.name }}</a></template
                ></Column
            >
            <Column field="totalPayslips" header="No. Of Payslips" v-if="!isNodeExpanded" />
            <Column field="basicPay" header="Basic Pay" />
            <Column field="netPay" header="Net Pay" />
            <Column field="approvalStatus" header="Approval Status" sortable filterField="approvalStatus" style="min-width: 12rem">
                <template #body="{ node }">
                    <div class="flex items-center gap-2">
                        <IconField>
                            <span class="text-bg p-1">
                                {{ getApprovalStatusDisplay(node.data.approvalStatus) }}
                            </span>
                            <InputIcon class="p-1">
                                <i :class="node.data.published ? 'pi pi-check text-green-400' : 'pi pi-file text-gray-400'" />
                            </InputIcon>
                        </IconField>
                    </div>
                </template>
            </Column>
            <Column field="published" header="Published Status" v-if="isNodeExpanded" sortable filterField="published" style="min-width: 12rem">
                <template #body="{ node }">
                    <div class="flex items-center gap-2">
                        <IconField>
                            <InputIcon>
                                <!-- Conditional icon based on published status -->
                                <i :class="node.data.published ? 'pi pi-check text-green-400' : 'pi pi-times text-red-400'" />
                            </InputIcon>
                        </IconField>
                    </div>
                </template>
            </Column>
            <Column v-if="!isNodeExpanded">
                <template #body="{ node }">
                    <div class="inline-flex items-center gap-2" v-if="isManagerial">
                        <router-link
                            :to="{
                                name: 'regularpayroll-printpayslips',
                                params: {
                                    fromDate: getMonthStartDate(node.data.monthYear),
                                    toDate: getMonthEndDate(node.data.monthYear)
                                }
                            }"
                        >
                            <Button label="View Muster Roll" icon="pi pi-eye" rounded />
                        </router-link>

                        <router-link
                            :to="{
                                name: 'regularpayroll-printpayslips',
                                params: {
                                    fromDate: getMonthStartDate(node.data.monthYear),
                                    toDate: getMonthEndDate(node.data.monthYear)
                                }
                            }"
                        >
                            <Button label="Print" icon="pi pi-print" rounded />
                        </router-link>
                    </div>
                </template>
            </Column>
        </TreeTable>

        <!--modals-->
        <Dialog v-model:visible="showpayslipDialog" header="Pay Slip" :style="{ width: '1200px' }" :modal="true">
            <div class="container-fluid flex">
                <!-- Payslip Section -->
                <div class="flex-grow p-4 w-6/10">
                    <!-- 60% width -->
                    <Payslip :id="selectedPayslipId" :payslip="findPayslipById(selectedPayslipId)" @payslip-info="getPaySlipInfo" ref="payslipRef" />
                </div>

                <!-- Toolbar Section -->
                <div v-if="payslipInfo" class="w-4/10 flex flex-col space-y-2 p-4">
                    <div v-if="payslipInfo.approval_status === 'approved'" class="mb-4">
                        <!-- 40% width -->
                        <a href="#" class="text-sm rounded-lg bg-green-200 p-1 mb-2 block">Payslip Approver</a>
                        <Button v-if="hasPermission('view_payslip')" label="Print Payslip" icon="pi pi-print" @click="printPayslip" class="w-full mb-2" />
                        <Button v-if="hasPermission('view_payslip')" label="Email Payslip" icon="pi pi-send" @click="emailPayslip" class="w-full" />
                    </div>
                    <div v-if="payslipAudits.length > 0" class="space-y-2">
                        <!-- Find and display the "Created" action -->
                        <a href="#" class="text-sm rounded-lg items-center bg-gray-20 p-1 block" v-if="payslipAudits.find((audit) => audit.action === 'Created')">
                            Created on
                            {{ payslipAudits.find((audit) => audit.action === 'Created').action_date.split('T')[0] }}:
                            {{ payslipAudits.find((audit) => audit.action === 'Created').action_by.name }}
                        </a>
                        <!-- Find and display the "Draft" action -->
                        <a href="#" class="text-sm rounded-lg items-center bg-blue-300 p-1 block" v-if="payslipAudits.find((audit) => audit.action === 'Draft')">
                            {{ payslipAudits.find((audit) => audit.action === 'Draft').action_by.name }}
                            [{{ payslipAudits.find((audit) => audit.action === 'Draft').action_by.email }}] submitted [{{ payslipAudits.find((audit) => audit.action === 'Draft').action_date.split('T')[0] }}]
                        </a>
                        <!-- Display approver information -->
                        <a href="#" class="text-sm rounded-lg bg-gold-200 p-1 block" v-if="payslipInfo.approver"> {{ payslipInfo.approver.name }} [{{ payslipInfo.approver.email }}] {{ payslipInfo.approved }} {{ payslipInfo.approval_date }} </a>
                        <!-- Action Buttons -->
                        <Button
                            v-if="isManagerial && payslipInfo.approval_submitted_by === null"
                            label="Submit for Approval"
                            icon="pi pi-send"
                            class="p-button-secondary w-full"
                            @click="submitApproval"
                        />
                        <Button v-if="hasPermission('change_payslip')" label="Edit Slip" icon="pi pi-pencil" class="p-button-secondary w-full" @click="editSlip" />
                        <Button v-if="hasPermission('change_payslip')" label="Re-run Slip" icon="pi pi-sync" class="p-button-secondary w-full" @click="rerunPayslip" />
                        <Button
                            v-if="hasPermission('delete_payslip')"
                            label="Delete Slip"
                            icon="pi pi-trash"
                            class="p-button-danger w-full"
                            @click="confirmDeletePayslip(selectedPayslipId)"
                        />
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
