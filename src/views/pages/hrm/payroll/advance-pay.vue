<script setup>
import AdvancePay from '@/components/hrm/payroll/AdvancePay.vue';
import { useEmployeeFilters } from '@/composables/useEmployeeFilters';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { payrollService } from '@/services/hrm/payrollService';
import { formatCurrency } from '@/utils/formatters';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

// State Management
const dt = ref();
const isDropdownVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
const selectedEmployee = ref(null);
const selectedDepartment = ref([]);
const selectedRegion = ref(null);
const selectedProject = ref(null);
const advances = ref([]);
const expandedKeys = ref({});
const selectedNodes = ref([]);
const isNodeExpanded = ref(false);
const showAdvanceDialog = ref(false);
const selectedAdvanceId = ref(null);
const isLoading = ref(false);
const spinner_title = ref('Loading...');
const employees = ref([]);

// Composables
const { departments, regions, projects, loadFilters } = useHrmFilters();
const { buildEmployeeFilterParams } = useEmployeeFilters();
const { showToast } = useToast();
const { hasAnyPermission } = usePermissions();
const store = useStore();

// Current user
const currentUser = computed(() => store.state.auth.user);

// Lifecycle
onMounted(() => {
    loadFilters();
    fetchAdvances();
    fetchMasterData();
});

// Computed Properties
const dialogTitle = computed(() => (selectedAdvanceId.value ? 'Edit Advance Pay' : 'New Advance Pay'));

const formattedDateRange = computed(() => {
    if (!fromDate.value || !toDate.value) return '';
    return `${moment(fromDate.value).format('DD/MM/YYYY')} - ${moment(toDate.value).format('DD/MM/YYYY')}`;
});

// Methods
const fetchAdvances = async () => {
    isLoading.value = true;
    try {
        // Check if user has managerial permissions
        const hasManagerialPerms = hasAnyPermission(['change_advance', 'delete_advance', 'change_advancepay', 'delete_advancepay']);
        
    const params = buildEmployeeFilterParams({
        includeEmployeeFromStore: !hasManagerialPerms && !selectedEmployee.value?.length,
        employee: selectedEmployee.value?.length ? selectedEmployee.value : undefined,
        department: selectedDepartment.value,
        region: selectedRegion.value ? [selectedRegion.value] : null,
        project: selectedProject.value ? [selectedProject.value] : null,
        extra: {
            from_date: fromDate.value ? moment(fromDate.value).format('YYYY-MM-DD') : undefined,
            to_date: toDate.value ? moment(toDate.value).format('YYYY-MM-DD') : undefined
        }
    });

        const response = await payrollService.listAdvances(params);
        const results = response?.data?.results || response?.data || [];

        // Group advances by month
        const groupedAdvances = {};
        results.forEach((advance) => {
            const monthYear = moment(advance.issue_date).format('MMMM YYYY');
            if (!groupedAdvances[monthYear]) {
                groupedAdvances[monthYear] = [];
            }
            groupedAdvances[monthYear].push(advance);
        });

        // Transform into tree structure
        advances.value = Object.entries(groupedAdvances).map(([monthYear, monthAdvances]) => ({
            key: monthYear,
            data: {
                monthYear,
                totalAdvances: monthAdvances.length,
                totalIssued: formatCurrency(monthAdvances.reduce((sum, adv) => sum + Number(adv.repay_option.amount), 0)),
                totalRepaid: formatCurrency(monthAdvances.reduce((sum, adv) => sum + Number(adv.amount_repaid), 0)),
                totalbalance: formatCurrency(monthAdvances.reduce((sum, adv) => sum + (Number(adv.repay_option.amount) - Number(adv.amount_repaid)), 0))
            },
            children: monthAdvances.map((advance) => ({
                key: `adv_${advance.id}`,
                id: advance.id,
                data: {
                    staffNo: advance.employee.staffNo,
                    name: advance.employee.name,
                    issue_date: moment(advance.issue_date).format('DD/MM/YYYY'),
                    next_payment_date: moment(advance.next_payment_date).format('DD/MM/YYYY'),
                    amount_issued: formatCurrency(advance.repay_option.amount),
                    amount_repaid: formatCurrency(advance.amount_repaid),
                    balance: formatCurrency(advance.repay_option.amount - advance.amount_repaid)
                }
            }))
        }));
    } catch (error) {
        console.error('Error fetching advances:', error);
    } finally {
        isLoading.value = false;
    }
};

const fetchMasterData = async () => {
    try {
        const response = await employeeService.getEmployees();
        employees.value = response.results.map((employee) => ({
            id: employee.id,
            name: `${employee.user.first_name} ${employee.user.last_name}`
        }));
        // Departments and regions are now loaded by useHrmFilters
    } catch (error) {
        showToast('error', 'Error', 'Failed to fetch master data', 3000);
    }
};

const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
};

const setFilter = (filter) => {
    const today = new Date();
    switch (filter) {
        case 'today':
            fromDate.value = toDate.value = today;
            break;
        case 'yesterday':
            fromDate.value = toDate.value = new Date(today.setDate(today.getDate() - 1));
            break;
        case 'last7days':
            fromDate.value = new Date(today.setDate(today.getDate() - 6));
            toDate.value = new Date();
            break;
        case 'last30days':
            fromDate.value = new Date(today.setDate(today.getDate() - 29));
            toDate.value = new Date();
            break;
        case 'thisMonth':
            fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'lastMonth':
            fromDate.value = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            toDate.value = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'thisYear':
            fromDate.value = new Date(today.getFullYear(), 0, 1);
            toDate.value = new Date(today.getFullYear(), 11, 31);
            break;
    }
    isDropdownVisible.value = false;
    fetchAdvances();
};

const submitDates = () => {
    if (fromDate.value && toDate.value) {
        fetchAdvances();
    }
    isDropdownVisible.value = false;
};

const cancelDates = () => {
    fromDate.value = toDate.value = null;
    isDropdownVisible.value = false;
};

const onNodeExpand = (node) => {
    isNodeExpanded.value = true;
    expandedKeys.value[node.key] = true;
};

const onNodeCollapse = (node) => {
    isNodeExpanded.value = false;
    expandedKeys.value[node.key] = false;
};

const showNewAdvanceDialog = () => {
    selectedAdvanceId.value = null;
    showAdvanceDialog.value = true;
};

const editAdvance = (id) => {
    selectedAdvanceId.value = id;
    showAdvanceDialog.value = true;
};

const closeAdvanceDialog = () => {
    showAdvanceDialog.value = false;
    selectedAdvanceId.value = null;
};

const printAdvance = (id) => {
    // Implement print functionality
    console.log('Printing advance:', id);
};

// Lifecycle Hooks
onMounted(async () => {
    await fetchMasterData();
    await fetchAdvances();

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (isDropdownVisible.value && !e.target.closest('.filter-item')) {
            isDropdownVisible.value = false;
        }
    });
});
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
                                <Button label="Yesterday" class="p-button-text w-full text-left" @click="setFilter('yesterday')" />
                                <Button label="Last 7 Days" class="p-button-text w-full text-left" @click="setFilter('last7days')" />
                                <Button label="Last 30 Days" class="p-button-text w-full text-left" @click="setFilter('last30days')" />
                                <Button label="This Month" class="p-button-text w-full text-left" @click="setFilter('thisMonth')" />
                                <Button label="Last Month" class="p-button-text w-full text-left" @click="setFilter('lastMonth')" />
                                <Button label="This Year" class="p-button-text w-full text-left" @click="setFilter('thisYear')" />
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

                    <!-- Responsive Filters -->
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
                        @change="fetchAdvances"
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
                        @change="fetchAdvances"
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
                        @change="fetchAdvances"
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
                        @change="fetchAdvances"
                    />

                    <!-- Action Buttons -->
                    <Button label="New Advance" icon="pi pi-plus" class="p-button-success p-button-sm" @click="showNewAdvanceDialog" />
                    <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm" @click="fetchAdvances" />
                </div>
            </template>
        </Toolbar>

        <!-- Data Table -->
        <TreeTable
            ref="dt"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25, 50]"
            :value="advances"
            v-model:expandedKeys="expandedKeys"
            v-model:selection="selectedNodes"
            selectionMode="checkbox"
            :metaKeySelection="false"
            @node-expand="onNodeExpand"
            @node-collapse="onNodeCollapse"
            class="p-datatable-sm"
        >
            <!-- Table Columns -->
            <Column selectionMode="multiple" style="width: 3rem"></Column>
            <Column field="monthYear" header="Month" expander v-if="!isNodeExpanded" style="width: 250px" />
            <Column field="totalAdvances" header="Total Advances" v-if="!isNodeExpanded">
                <template #body="{ node }">
                    {{ node.data.totalAdvances }}
                </template>
            </Column>
            <Column field="totalIssued" header="Total Issued" v-if="!isNodeExpanded">
                <template #body="{ node }">
                    {{ node.data.totalIssued }}
                </template>
            </Column>
            <Column field="totalRepaid" header="Total Repaid" v-if="!isNodeExpanded">
                <template #body="{ node }">
                    {{ node.data.totalRepaid }}
                </template>
            </Column>
            <Column field="totalbalance" header="Balance" v-if="!isNodeExpanded">
                <template #body="{ node }">
                    {{ node.data.totalbalance }}
                </template>
            </Column>

            <!-- Expanded Row Columns -->
            <Column field="staffNo" header="Staff No" v-if="isNodeExpanded" expander style="width: 150px">
                <template #body="{ node }">
                    <span class="text-blue-600 font-medium">{{ node.data.staffNo }}</span>
                </template>
            </Column>
            <Column field="name" header="Name" v-if="isNodeExpanded" />
            <Column field="issue_date" header="Date Issued" v-if="isNodeExpanded" />
            <Column field="next_payment_date" header="Next Payment" v-if="isNodeExpanded" />
            <Column field="amount_issued" header="Amount" v-if="isNodeExpanded" />
            <Column field="amount_repaid" header="Repaid" v-if="isNodeExpanded" />
            <Column field="balance" header="Balance" v-if="isNodeExpanded" />
            <Column field="actions" header="Actions" v-if="isNodeExpanded">
                <template #body="{ node }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" class="p-button-sm p-button-warning" @click="editAdvance(node.id)" />
                        <Button icon="pi pi-print" class="p-button-sm" @click="printAdvance(node.id)" />
                    </div>
                </template>
            </Column>
        </TreeTable>

        <!-- Advance Pay Dialog -->
        <Dialog v-model:visible="showAdvanceDialog" :header="dialogTitle" :style="{ width: '90vw', maxWidth: '1200px' }" :modal="true">
            <AdvancePay :advanceId="selectedAdvanceId" :employees="employees" ref="advanceRef" @close="closeAdvanceDialog" @refresh="fetchAdvances" />
        </Dialog>

        <!-- Loading Spinner -->
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
.container-fluid {
    padding: 1rem;
}

.p-treetable {
    font-size: 0.875rem;
}

.filter-item {
    position: relative;
}

.shadow-lg {
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
