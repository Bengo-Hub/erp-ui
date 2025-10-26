<script setup>
import { useHrmFilters } from '@/composables/useHrmFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { formatCurrency } from '@/utils/formatters';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const { showToast } = useToast();
const { hasAnyPermission } = usePermissions();
const store = useStore();

// Current user
const currentUser = computed(() => store.state.auth.user);

// State Management
const dt = ref();
const isDropdownVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
const selectedEmployee = ref([]);
const selectedDepartment = ref([]);
const selectedRegion = ref(null);
const selectedProject = ref(null);
const lossesAndDamages = ref([]);
const expandedKeys = ref({});
const selectedNodes = ref([]);
const isNodeExpanded = ref(false);
const showLossDamageDialog = ref(false);
const selectedLossDamageId = ref(null);
const isLoading = ref(false);
const spinner_title = ref('Loading...');
const employees = ref([]);

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();

// Lifecycle
onMounted(() => {
    fromDate.value = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0];
    toDate.value = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
    loadFilters();
    fetchEmployees();
    fetchLossesAndDamages();
});

// Status filter tabs
const statusTabs = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' }
];

// Computed properties
const dialogTitle = computed(() => (selectedLossDamageId.value ? 'Edit Loss/Damage' : 'New Loss/Damage'));

const formattedDateRange = computed(() => {
    if (!fromDate.value || !toDate.value) return '';
    return `${moment(fromDate.value).format('DD/MM/YYYY')} - ${moment(toDate.value).format('DD/MM/YYYY')}`;
});

// Function to count losses by status
const countStatus = (status) => {
    if (status === 'all') {
        return lossesAndDamages.value.length;
    } else {
        return lossesAndDamages.value.filter((loss) => loss.approved === status).length;
    }
};

// Filter losses by the selected status
const filterByStatus = (status) => {
    if (status === 'all') {
        lossesAndDamages.value = lossesAndDamages.value;
    } else {
        lossesAndDamages.value = lossesAndDamages.value.filter((loss) => loss.approved === status);
    }
};

// Expand node on interaction
function onNodeExpand(event) {
    console.log(event.key);
    isNodeExpanded.value = true;
    const key = event.key;
    expandedKeys.value = { ...expandedKeys.value, [key]: true };
    console.log(expandedKeys.value);
}

const onNodeCollapse = (event) => {
    const key = event.key;
    isNodeExpanded.value = false;
    delete expandedKeys.value[key];
};

const fetchEmployees = () => {
    const params = {
        department: selectedDepartment.value.length > 0 ? selectedDepartment.value : null,
        region: selectedRegion.value ? selectedRegion.value : null,
        project: selectedProject.value ? selectedProject.value : null,
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

const fetchLossesAndDamages = async () => {
    isLoading.value = true;
    try {
        // Check if user has managerial permissions (can view/approve all losses & damages)
        const hasManagerialPerms = hasAnyPermission(['change_lossesdamages', 'delete_lossesdamages', 'change_lossesanddamages', 'delete_lossesanddamages']);
        
        const params = {
            from_date: fromDate.value,
            to_date: toDate.value,
            employee: selectedEmployee.value.length > 0 ? selectedEmployee.value : null,
            department: selectedDepartment.value.length > 0 ? selectedDepartment.value : null,
            region: selectedRegion.value ? selectedRegion.value : null,
            project: selectedProject.value ? selectedProject.value : null
        };

        // If user doesn't have managerial permissions, filter by their employee ID
        if (!hasManagerialPerms && (!params.employee || params.employee.length === 0)) {
            const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
            params.employee = [employeeId];
            console.log('fetchLossesAndDamages: Filtering for current user employee ID:', employeeId);
        }

        const res = await employeeService.getLossesAndDamages(params);
        let data = res.data?.results || res.data || [];
        console.log(data);

        lossesAndDamages.value = formatAdvanceData(data);
    } catch (error) {
        console.error('Error fetching losses and damages:', error);
        showToast('error', 'Error', 'Failed to fetch losses and damages', 3000);
    } finally {
        isLoading.value = false;
    }
};

// Function to format data for the TreeTable
function formatAdvanceData(data) {
    // Group losses by formattedMonthYear(loss.issue_date)
    const groupedData = data.reduce((groups, loss) => {
        const monthYear = formattedMonthYear(loss.issue_date);
        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(loss);
        return groups;
    }, {});

    // Map grouped data into treeview format
    return Object.entries(groupedData).map(([monthYear, losses]) => ({
        key: `node_${monthYear.toString().replace(' ', '_')}`,
        data: {
            monthYear,
            totalLosses: losses.length,
            totalDamageAmount: formatCurrency(losses.reduce((total, item) => total + Number(item.repay_option.amount), 0)),
            totalRepaid: formatCurrency(losses.reduce((total, item) => total + Number(item.amount_repaid), 0)),
            totalbalance: formatCurrency(losses.reduce((total, item) => total + (Number(item.repay_option.amount) - Number(item.amount_repaid)), 0))
        },
        children: losses.map((item) => ({
            key: `child_${item.id}`,
            id: item.id,
            data: {
                approved: item.approved,
                issue_date: item.issue_date,
                next_payment_date: item.next_payment_date,
                staffNo: item.employee.staffNo,
                empid: item.employee.id,
                name: item.employee.name,
                damageAmount: new Intl.NumberFormat().format(item.repay_option.amount),
                amount_repaid: new Intl.NumberFormat().format(item.amount_repaid),
                balance: new Intl.NumberFormat().format(item.repay_option.amount - item.amount_repaid)
            }
        }))
    }));
}

const formattedMonthYear = (date) => {
    return moment(date).format('MMMM YYYY');
};

const printLossesAndDamages = () => {};

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
    isDropdownVisible.value = false;
};

const submitDates = () => {
    fetchLossesAndDamages();
    isDropdownVisible.value = false;
};

const cancelDates = () => {
    fromDate.value = '';
    toDate.value = '';
    isDropdownVisible.value = false;
};

// Additional functions for template
const filters = ref({
    global: { value: null, matchMode: 'contains' }
});

const showNewLossDamageDialog = () => {
    selectedLossDamageId.value = null;
    showLossDamageDialog.value = true;
};

const closeLossDamageDialog = () => {
    showLossDamageDialog.value = false;
    selectedLossDamageId.value = null;
};

const editLossDamage = (id) => {
    selectedLossDamageId.value = id;
    showLossDamageDialog.value = true;
};

const showAdvance = (id) => {
    console.log(id);
    selectedLossDamageId.value = id;
    showLossDamageDialog.value = true;
};

const exportCSV = () => {
    // Handle CSV export
};

const bulkActions = [
    {
        label: 'Pause Payments',
        icon: 'pi pi-pause',
        command: () => bulkUpdateLossDamages('pause')
    },
    {
        label: 'Restart Payments',
        icon: 'pi pi-play',
        command: () => bulkUpdateLossDamages('restart')
    },
    {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => bulkUpdateLossDamages('delete'),
        class: 'p-button-danger'
    }
];

const bulkUpdateLossDamages = async (action, update_fields = {}) => {
    if (!selectedNodes.value.length) return;
    isLoading.value = true;
    try {
        const ids = selectedNodes.value.map((node) => node.id || node.data?.id).filter(Boolean);
        await employeeService.bulkUpdateLossDamages(ids, action, update_fields);
        showToast('success', 'Success', `${action.charAt(0).toUpperCase() + action.slice(1)} action completed.`, 3000);
        fetchLossesAndDamages();
    } catch (error) {
        showToast('error', 'Error', error.message || 'Bulk action failed.', 3000);
    } finally {
        isLoading.value = false;
    }
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
                        @change="fetchLossesAndDamages"
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
                        @change="fetchLossesAndDamages"
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
                        @change="fetchLossesAndDamages"
                    />

                    <!-- Refresh Button -->
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchLossesAndDamages" />
                </div>
            </template>
        </Toolbar>

        <!-- Add New Loss/Damage and Bulk Actions Toolbar -->
        <Toolbar class="mb-2 bg-gray-100 p-4 rounded-lg">
            <template #start>
                <Button label="New Loss/Damage" icon="pi pi-plus" class="p-button-success p-button-sm mr-2" @click="showNewLossDamageDialog" />
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
                    <Button label="" icon="pi pi-file-pdf" severity="danger" @click="printLossesAndDamages" class="m-1" />
                    <Button label="" icon="pi pi-file-excel" severity="warning" @click="exportCSV($event)" class="m-1" />
                </div>
                <!-- Bulk Action Buttons -->
                <div class="bulk-actions">
                    <SplitButton label="With Selected.." icon="pi pi-cog" class="p-button-sm" :model="bulkActions" :disabled="selectedNodes.length === 0"></SplitButton>
                </div>
            </template>
        </Toolbar>

        <!-- Payroll Data Table -->
        <TreeTable
            ref="dt"
            dataKey="id"
            :paginator="true"
            :rows="5"
            :rowsPerPageOptions="[1, 2, 5, 10, 25, 50, 100]"
            :value="LossesAndDamages"
            v-model:expandedKeys="expandedKeys"
            v-model:selection="selectedNodes"
            selectionMode="checkbox"
            :metaKeySelection="false"
            @node-expand="onNodeExpand"
            @node-collapse="onNodeCollapse"
        >
            <!-- Root/Node Level -->
            <Column selectionMode="multiple" style="width: 3rem"></Column>
            <Column field="monthYear" header="Month" expander v-if="!isNodeExpanded" style="width: 250px" />
            <Column field="totalLossesAndDamages" header="No. Of" v-if="!isNodeExpanded" />
            <Column field="totalDamageAmount" header="Amount Issued" v-if="!isNodeExpanded" />
            <Column field="totalRepaid" header="Amount Repaid" v-if="!isNodeExpanded" />
            <Column field="totalbalance" header="Balance" v-if="!isNodeExpanded" />

            <!-- Children Level -->
            <Column field="Status" header="Status" sortable filterField="Status" v-if="isNodeExpanded">
                <template #body="{ node }">
                    <div class="flex items-center gap-2">
                        <IconField>
                            <InputIcon class="p-1">
                                <i :class="node.data.approved ? 'pi pi-check text-green-400' : 'pi pi-file text-gray-400'" />
                            </InputIcon>
                        </IconField>
                    </div>
                </template>
            </Column>
            <Column field="issue_date" header="Date Issued" v-if="isNodeExpanded" />
            <Column field="next_payment_date" header="Next Payment Date" v-if="isNodeExpanded" />
            <Column field="staffNo" class="text-blue-600 font-medium hover:underline" header="Staff No" v-if="isNodeExpanded" expander style="width: 250px">
                <template #body="{ node }">
                    <a href="#" class="link" @click="showAdvance(node.id)">{{ node.data.staffNo }}</a>
                </template>
            </Column>
            <Column field="name" class="text-blue-600 font-medium hover:underline" header="Name" v-if="isNodeExpanded" style="width: 250px">
                <template #body="{ node }">
                    <a href="#" class="link" @click="showAdvance(node.id)">{{ node.data.name }}</a>
                </template>
            </Column>
            <Column field="damageAmount" header="Damage Amount" v-if="isNodeExpanded" />
            <Column field="amount_repaid" header="Amount Repaid" v-if="isNodeExpanded" />
            <Column field="balance" header="Balance" v-if="isNodeExpanded" />
            <Column v-if="isNodeExpanded">
                <template #body="{ node }">
                    <div class="inline-flex items-center gap-2">
                        <Button label="Edit" icon="pi pi-pencil" v-if="node.id" @click="showAdvance(node.id)" rounded />
                        <Button label="Print" icon="pi pi-print" v-if="node.id" @click="showAdvance(node.id)" rounded />
                    </div>
                    <!--modals-->
                    <Dialog v-model:visible="showAdvanceDialog" header="Losses & Damages" :style="{ width: '900px' }" :modal="true">
                        <div class="container-fluid">
                            <!-- Payslip Section -->
                            <LossDamage :id="selectedAdvanceId" :employees="employees" ref="lossdamageRef" />
                        </div>
                    </Dialog>
                </template>
            </Column>
        </TreeTable>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
        <Dialog v-model:visible="showLossDamageDialog" :header="dialogTitle" :style="{ width: '90vw', maxWidth: '900px' }" :modal="true">
            <LossDamage :id="selectedLossDamageId" :employees="employees" ref="lossdamageRef" @close="closeLossDamageDialog" @refresh="fetchLossesAndDamages" />
        </Dialog>
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
