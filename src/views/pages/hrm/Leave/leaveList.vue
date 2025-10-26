<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { leaveService } from '@/services/hrm/leaveService';
import { formatDate } from '@/utils/formatters';
import { format, parseISO } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import LeaveDetails from './LeaveDetails.vue';
import NewLeave from './newLeave.vue';

const { showToast } = useToast();
const { hasPermission, hasAnyPermission, canRead, canCreate, canUpdate, canDelete } = usePermissions();
const store = useStore();

// Current user
const currentUser = computed(() => store.state.auth.user);
const showNewLeaveModal = ref(false);
const showDetailsModal = ref(false);
const loading = ref(false);
const leaveData = ref([]);
const selectedLeaves = ref([]);
// employeeOptions
const employeeOptions = ref([]);
const currentLeave = ref(null);
const searchText = ref('');

// Filters
const fromDate = ref('');
const toDate = ref('');
const isDropdownVisible = ref(false);
const selectedLeaveType = ref(null);
const selectedStatus = ref(null);
const leaveTypes = ref([]);
const selectedEmployees = ref([]);

// Status options
const statusOptions = ref([
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
]);

// Actions with permissions
const publishActions = computed(() => {
    const actions = [];
    if (hasPermission('change_leaverequest')) {
        actions.push(
            { label: 'Publish All', icon: 'pi pi-send', command: () => publishLeaves(true) },
            { label: 'Publish Selected', icon: 'pi pi-send', command: () => publishLeaves(false) }
        );
    }
    return actions;
});

const approvalActions = computed(() => {
    const actions = [];
    if (hasPermission('change_leaverequest')) {
        actions.push(
            { label: 'Approve All', icon: 'pi pi-check', command: () => approveLeaves(true) },
            { label: 'Approve Selected', icon: 'pi pi-check', command: () => approveLeaves(false) },
            { label: 'Reject All', icon: 'pi pi-times', command: () => rejectLeaves(true) },
            { label: 'Reject Selected', icon: 'pi pi-times', command: () => rejectLeaves(false) }
        );
    }
    return actions;
});

// Fetch data
const fetchLeaveData = async () => {
    loading.value = true;
    try {
        // Check if user has managerial permissions (can view/approve all leave requests)
        const hasManagerialPerms = hasAnyPermission(['change_leaverequest', 'delete_leaverequest', 'change_leave', 'delete_leave']);
        
        const params = {
            start_date: fromDate.value,
            end_date: toDate.value,
            category_id: selectedLeaveType.value?.id,
            status: selectedStatus.value?.value
        };

        // If user doesn't have managerial permissions, filter by their employee ID
        if (!hasManagerialPerms && !selectedEmployees.value.length) {
            const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
            params.employee_id = employeeId;
            console.log('fetchLeaveData: Filtering for current user employee ID:', employeeId);
        }

        // Add employee IDs if any are selected (managers can filter by specific employees)
        if (selectedEmployees.value.length && hasManagerialPerms) {
            params.employee_id = selectedEmployees.value.map((e) => e.id).join(',');
        }

        const response = await leaveService.getRequests(params);
        leaveData.value = response.data.results;
    } catch (error) {
        showToast('error', 'Error', 'Failed to fetch leave requests', 3000);
    } finally {
        loading.value = false;
    }
};

// Fetch leave categories
const fetchLeaveCategories = async () => {
    try {
        const response = await leaveService.getCategories();
        console.log(response.data.results);
        leaveTypes.value = response.data.results;
    } catch (error) {
        showToast('error', 'Error', 'Failed to fetch leave categories', 3000);
    }
};

// Fetch employees for filter
const fetchEmployees = async () => {
    try {
        // Replace with actual employee service call
        const response = await employeeService.getEmployees();
        employeeOptions.value = response.data.results || response.data || [];
    } catch (error) {
        showToast('error', 'Error', 'Failed to fetch employees', 3000);
    }
};

// Computed properties
const filteredLeaveData = computed(() => {
    let data = leaveData.value;

    // Apply search filter
    if (searchText.value) {
        const search = searchText.value.toLowerCase();
        data = data.filter(
            (leave) => leave.employee.user.first_name.toLowerCase().includes(search) || leave.employee.user.last_name.toLowerCase().includes(search) || leave.category.name.toLowerCase().includes(search) || leave.status.toLowerCase().includes(search)
        );
    }

    return data;
});

const totalApplications = computed(() => leaveData.value.length);

const statusCounts = computed(() => {
    return leaveData.value.reduce(
        (acc, leave) => {
            acc[leave.status] = (acc[leave.status] || 0) + 1;
            return acc;
        },
        { pending: 0, approved: 0, rejected: 0 }
    );
});

const formattedDateRange = computed(() => {
    if (!fromDate.value && !toDate.value) return 'Select Date Range';
    const from = fromDate.value ? format(parseISO(fromDate.value), 'MMM dd, yyyy') : '...';
    const to = toDate.value ? format(parseISO(toDate.value), 'MMM dd, yyyy') : '...';
    return `${from} - ${to}`;
});

// Methods
const getStatusSeverity = (status) => {
    switch (status) {
        case 'approved':
            return 'success';
        case 'pending':
            return 'warning';
        case 'rejected':
            return 'danger';
        default:
            return 'info';
    }
};

const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
};

const setFilter = (filter) => {
    const today = new Date();
    let from, to;

    switch (filter) {
        case 'today':
            from = new Date(today);
            to = new Date(today);
            break;
        case 'yesterday':
            from = new Date(today);
            from.setDate(from.getDate() - 1);
            to = new Date(from);
            break;
        case 'last7days':
            from = new Date(today);
            from.setDate(from.getDate() - 6);
            to = new Date(today);
            break;
        case 'last30days':
            from = new Date(today);
            from.setDate(from.getDate() - 29);
            to = new Date(today);
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

    fromDate.value = from ? format(from, 'yyyy-MM-dd') : '';
    toDate.value = to ? format(to, 'yyyy-MM-dd') : '';
    applyFilters();
};

const submitDates = () => {
    applyFilters();
    isDropdownVisible.value = false;
};

const cancelDates = () => {
    fromDate.value = '';
    toDate.value = '';
    isDropdownVisible.value = false;
    applyFilters();
};

const applyFilters = () => {
    fetchLeaveData();
};

const refreshData = () => {
    fromDate.value = '';
    toDate.value = '';
    selectedLeaveType.value = null;
    selectedStatus.value = null;
    selectedEmployees.value = [];
    searchText.value = '';
    fetchLeaveData();
};

const openModal = () => {
    showNewLeaveModal.value = true;
};

const viewDetails = (leave) => {
    currentLeave.value = leave;
    showDetailsModal.value = true;
};

const editLeave = (leave) => {
    currentLeave.value = leave;
    showNewLeaveModal.value = true;
};

const handleLeaveSaved = () => {
    showNewLeaveModal.value = false;
    fetchLeaveData();
};

const deleteSelected = async () => {
    if (!selectedLeaves.value.length) return;

    try {
        await leaveService.deleteRequests(selectedLeaves.value.map((l) => l.id));
        showToast('success', 'Success', 'Selected leaves deleted successfully', 3000);
        selectedLeaves.value = [];
        fetchLeaveData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete leaves', 3000);
    }
};

const publishLeaves = (all) => {
    const leaves = all ? leaveData.value : selectedLeaves.value;
    console.log('Publishing leaves:', leaves);
    // Implement publish logic
};

const approveLeaves = async (all) => {
    const leaves = all ? leaveData.value : selectedLeaves.value;
    if (!leaves.length) return;

    try {
        await Promise.all(leaves.map((leave) => leaveService.approveRequest(leave.id)));
        showToast('success', 'Success', 'Leaves approved successfully', 3000);
        fetchLeaveData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to approve leaves', 3000);
    }
};

const rejectLeaves = async (all) => {
    const leaves = all ? leaveData.value : selectedLeaves.value;
    if (!leaves.length) return;

    // In a real app, you might want to show a dialog to collect rejection reason
    const reason = 'Rejected by administrator';

    try {
        await Promise.all(leaves.map((leave) => leaveService.rejectRequest(leave.id, reason)));
        showToast('success', 'Success', 'Leaves rejected successfully', 3000);
        fetchLeaveData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to reject leaves', 3000);
    }
};

// Initialize
onMounted(() => {
    fetchLeaveCategories();
    fetchLeaveData();
});

// Watch for leave data changes to update employee filter options
watch(
    leaveData,
    () => {
        fetchEmployees();
    },
    { deep: true }
);
</script>

<template>
    <PermissionWrapper permission="view_leaverequest">
        <div class="leave-management-container">
            <!-- First Toolbar for Filters -->
            <Toolbar class="mb-4 bg-gray-100 p-2 md:p-4 rounded-lg">
                <template #start>
                    <div class="flex flex-wrap gap-2 items-center justify-start w-full">
                        <!-- Date Filter Dropdown -->
                        <div class="relative filter-item w-full md:w-auto">
                            <Button :label="formattedDateRange || 'Select Date Range'" class="p-button-outlined w-full" @click="toggleDropdown" />
                            <div v-if="isDropdownVisible" class="absolute z-10 bg-white shadow-lg border rounded-lg p-2 mt-2 w-full md:w-auto" @click.stop>
                                <!-- Dropdown Filters -->
                                <div class="w-full p-2 md:p-4 gap-2 md:gap-6 flex flex-col md:flex-row">
                                    <div class="flex flex-col gap-2">
                                        <Button label="Today" class="p-button-text w-full text-left" @click="setFilter('today')" />
                                        <Button label="Yesterday" class="p-button-text w-full text-left" @click="setFilter('yesterday')" />
                                        <Button label="Last 7 Days" class="p-button-text w-full text-left" @click="setFilter('last7days')" />
                                        <Button label="Last 30 Days" class="p-button-text w-full text-left" @click="setFilter('last30days')" />
                                        <Button label="This Month" class="p-button-text w-full text-left" @click="setFilter('thisMonth')" />
                                    </div>
                                    <div class="w-full md:w-auto pl-0 md:pl-4">
                                        <label class="block text-sm font-medium text-gray-700">From:</label>
                                        <Calendar v-model="fromDate" dateFormat="yy-mm-dd" class="w-full" />
                                        <label class="block text-sm font-medium text-gray-700">To:</label>
                                        <Calendar v-model="toDate" dateFormat="yy-mm-dd" class="w-full" />
                                        <div class="flex justify-between mt-2 gap-2">
                                            <Button label="Submit" class="p-button-sm p-button-primary flex-1" @click="submitDates" />
                                            <Button label="Cancel" class="p-button-sm p-button-secondary flex-1" @click="cancelDates" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Responsive Filters -->
                        <Dropdown v-model="selectedLeaveType" :options="leaveTypes" optionLabel="name" placeholder="Leave Category" class="w-full md:w-48" @change="applyFilters" />
                        <Dropdown v-model="selectedStatus" :options="statusOptions" optionLabel="label" placeholder="Status" class="w-full md:w-32" @change="applyFilters" />
                        <MultiSelect v-model="selectedEmployees" :options="employeeOptions" optionLabel="name" placeholder="Employees" class="w-full md:w-48" :filter="true" :showToggleAll="false" />
                        <Button icon="pi pi-refresh" class="p-button-sm p-button-text" @click="refreshData" v-tooltip="'Refresh data'" />
                    </div>
                </template>

                <template #end>
                    <PermissionButton 
                        permission="view_leavecategory"
                        icon="pi pi-plus" 
                        label="Categories" 
                        class="p-button-sm md:p-button" 
                        @click="$router.push({ name: 'leaveCategories' })" 
                    />
                    <PermissionButton 
                        permission="add_leaverequest"
                        icon="pi pi-plus" 
                        label="New Leave" 
                        class="p-button-sm md:p-button" 
                        @click="openModal" 
                    />
                </template>
            </Toolbar>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card class="shadow-sm">
                <template #content>
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="block text-500 font-medium mb-1">Total Applications</span>
                            <div class="text-900 font-medium text-xl">{{ totalApplications }}</div>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="pi pi-file text-blue-500 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>
            <Card class="shadow-sm">
                <template #content>
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="block text-500 font-medium mb-1">Pending</span>
                            <div class="text-900 font-medium text-xl">{{ statusCounts.pending }}</div>
                        </div>
                        <div class="bg-orange-100 p-3 rounded-full">
                            <i class="pi pi-clock text-orange-500 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>
            <Card class="shadow-sm">
                <template #content>
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="block text-500 font-medium mb-1">Approved</span>
                            <div class="text-900 font-medium text-xl">{{ statusCounts.approved }}</div>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="pi pi-check-circle text-green-500 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>
            <Card class="shadow-sm">
                <template #content>
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="block text-500 font-medium mb-1">Rejected</span>
                            <div class="text-900 font-medium text-xl">{{ statusCounts.rejected }}</div>
                        </div>
                        <div class="bg-red-100 p-3 rounded-full">
                            <i class="pi pi-times-circle text-red-500 text-xl"></i>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Second Toolbar for Table Controls -->
        <Toolbar class="mb-2 p-2">
            <template #start>
                <div class="flex flex-wrap gap-2 items-center">
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSelected" class="p-button-sm" :disabled="!selectedLeaves.length" />
                    <SplitButton label="Publish" icon="pi pi-send" severity="info" class="p-button-sm" :model="publishActions" :disabled="!selectedLeaves.length" />
                    <SplitButton label="Approval" icon="pi pi-check" severity="success" class="p-button-sm" :model="approvalActions" :disabled="!selectedLeaves.length" />
                </div>
            </template>
            <template #end>
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="p-input-icon-left w-full sm:w-auto">
                        <i class="pi pi-search" />
                        <InputText v-model="searchText" placeholder="Search..." class="w-full" />
                    </span>
                    <Button icon="pi pi-print" class="p-button-sm p-button-help" v-tooltip="'Print'" />
                    <Button icon="pi pi-file-excel" class="p-button-sm p-button-help" v-tooltip="'Export to Excel'" />
                    <Button icon="pi pi-file-pdf" class="p-button-sm p-button-help" v-tooltip="'Export to PDF'" />
                </div>
            </template>
        </Toolbar>

        <!-- Data Table -->
        <DataTable
            ref="dt"
            :value="filteredLeaveData"
            v-model:selection="selectedLeaves"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25, 50]"
            :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            :globalFilterFields="['employee.user.first_name', 'employee.user.last_name', 'category.name', 'status']"
            responsiveLayout="scroll"
            class="p-datatable-md"
        >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="employee.name" header="Employee" :sortable="true">
                <template #body="{ data }"> {{ data.employee.user.first_name }} {{ data.employee.user.last_name }} </template>
            </Column>
            <Column field="category.name" header="Leave Type" :sortable="true"></Column>
            <Column field="created_at" header="Applied On" :sortable="true">
                <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                </template>
            </Column>
            <Column header="Leave Dates">
                <template #body="{ data }">
                    <div class="flex flex-col">
                        <span>{{ formatDate(data.start_date) }}</span>
                        <span>to</span>
                        <span>{{ formatDate(data.end_date) }}</span>
                    </div>
                </template>
            </Column>
            <Column field="days_requested" header="Duration" :sortable="true">
                <template #body="{ data }"> {{ data.days_requested }} days </template>
            </Column>
            <Column field="status" header="Status" :sortable="true">
                <template #body="{ data }">
                    <Badge :value="data.status" :severity="getStatusSeverity(data.status)" />
                </template>
            </Column>
            <Column header="Actions" headerStyle="width: 8rem">
                <template #body="{ data }">
                    <div class="flex gap-1">
                        <Button icon="pi pi-eye" class="p-button-sm p-button-text" v-tooltip="'View details'" @click="viewDetails(data)" />
                        <Button icon="pi pi-pencil" class="p-button-sm p-button-text" v-tooltip="'Edit'" @click="editLeave(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- New Leave Dialog -->
        <Dialog v-model:visible="showNewLeaveModal" header="New Leave Application" :modal="true" :style="{ width: '90vw', maxWidth: '800px' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <NewLeave @close="showNewLeaveModal = false" @saved="handleLeaveSaved" :employees="employeeOptions" :categories="leaveTypes" />
        </Dialog>

        <!-- Leave Details Dialog -->
        <Dialog v-model:visible="showDetailsModal" header="Leave Application Details" :modal="true" :style="{ width: '90vw', maxWidth: '800px' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <LeaveDetails v-if="currentLeave" :leave="currentLeave" @close="showDetailsModal = false" />
        </Dialog>
        </div>
    </PermissionWrapper>
</template>

<style scoped>
.leave-management-container {
    padding: 1rem;
}

.filter-item {
    min-width: 200px;
}

@media (max-width: 640px) {
    .p-toolbar-group-start,
    .p-toolbar-group-end {
        width: 100%;
    }

    .p-toolbar-group-end {
        margin-top: 1rem;
        justify-content: flex-start;
    }
}

/* Badge styling */
.p-badge {
    min-width: 6rem;
    text-transform: capitalize;
}

/* Card styling */
.p-card {
    border-radius: 0.5rem;
}

/* Table styling */
.p-datatable .p-datatable-thead > tr > th {
    background-color: #f8f9fa;
}

.p-datatable .p-datatable-tbody > tr {
    transition: background-color 0.2s;
}

.p-datatable .p-datatable-tbody > tr:hover {
    background-color: #f8f9fa;
}
</style>
