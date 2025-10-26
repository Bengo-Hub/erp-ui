<script setup>
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, reactive, ref, watch } from 'vue';

// Composables
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const error = ref(null);
const selectedDate = ref(new Date());
const selectedBranch = ref(null);
const selectedAccountTypes = ref([]);
const branches = ref([]);
const showFilters = ref(false);
const filter = ref('');

const summary = reactive({
    total_debits: 0,
    total_credits: 0,
    balance_difference: 0,
    debit_count: 0,
    credit_count: 0,
    total_accounts: 0
});

const trialBalanceData = ref([]);

// Computed properties
const accountTypeOptions = [
    { label: 'Asset', value: 'asset' },
    { label: 'Liability', value: 'liability' },
    { label: 'Equity', value: 'equity' },
    { label: 'Revenue', value: 'revenue' },
    { label: 'Expense', value: 'expense' }
];

const filteredData = computed(() => {
    if (!filter.value) return trialBalanceData.value;

    const searchTerm = filter.value.toLowerCase();
    return trialBalanceData.value.filter((item) => {
        return item.account_name?.toLowerCase().includes(searchTerm) || item.account_code?.toLowerCase().includes(searchTerm) || item.account_type?.toLowerCase().includes(searchTerm);
    });
});

const isBalanced = computed(() => {
    return Math.abs(summary.balance_difference) < 0.01; // Allow for small rounding differences
});

// Methods
const loadBranches = async () => {
    try {
        const response = await financeService.getBranches();
        branches.value = response.data.results || [];
    } catch (err) {
        console.error('Error loading branches:', err);
    }
};

const loadData = async () => {
    loading.value = true;
    error.value = null;

    try {
        const params = {
            date: selectedDate.value?.toISOString().split('T')[0],
            branch_id: selectedBranch.value,
            account_types: selectedAccountTypes.value.join(',')
        };

        const response = await financeService.getTrialBalance(params);

        // Update trial balance data
        trialBalanceData.value = response.data.data || [];

        // Calculate summary
        calculateSummary();

        showToast('success', 'Trial balance report has been generated successfully');
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to generate trial balance report';
        showToast('error', error.value);
    } finally {
        loading.value = false;
    }
};

const calculateSummary = () => {
    const data = trialBalanceData.value;

    summary.total_debits = data.reduce((sum, item) => sum + (item.debit_amount || 0), 0);
    summary.total_credits = data.reduce((sum, item) => sum + (item.credit_amount || 0), 0);
    summary.balance_difference = summary.total_debits - summary.total_credits;
    summary.debit_count = data.filter((item) => (item.debit_amount || 0) > 0).length;
    summary.credit_count = data.filter((item) => (item.credit_amount || 0) > 0).length;
    summary.total_accounts = data.length;
};

const exportToCSV = () => {
    const csvRows = [];
    const headers = ['Account Code', 'Account Name', 'Account Type', 'Debit Amount', 'Credit Amount', 'Balance'];
    csvRows.push(headers.join(','));

    trialBalanceData.value.forEach((item) => {
        const values = [item.account_code || '', item.account_name || '', item.account_type || '', item.debit_amount || 0, item.credit_amount || 0, (item.debit_amount || 0) - (item.credit_amount || 0)];
        csvRows.push(values.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${formatDate(selectedDate.value)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('success', 'Trial balance exported successfully');
};

const printReport = () => {
    showToast('info', 'Print functionality coming soon');
};

const clearFilters = () => {
    selectedBranch.value = null;
    selectedAccountTypes.value = [];
    filter.value = '';
    loadData();
};

const getAccountTypeSeverity = (type) => {
    const severityMap = {
        asset: 'info',
        liability: 'warning',
        equity: 'success',
        revenue: 'primary',
        expense: 'danger'
    };
    return severityMap[type?.toLowerCase()] || 'secondary';
};

const getBalanceClass = (debit, credit) => {
    const balance = (debit || 0) - (credit || 0);
    return balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600';
};

// Lifecycle
onMounted(async () => {
    await loadBranches();
    await loadData();
});

// Watch for changes
watch([selectedDate, selectedBranch, selectedAccountTypes], () => {
    if (selectedDate.value) {
        loadData();
    }
});
</script>

<template>
    <div class="trial-balance-page">
        <!-- Page Header -->
        <div class="page-header bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="mb-4 sm:mb-0">
                    <PageBreadcrumb title="Trial Balance" />
                    <h1 class="text-2xl font-bold text-gray-900 mt-2">Trial Balance Report</h1>
                    <p class="text-sm text-gray-600 mt-1">Review account balances and ensure debits equal credits</p>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <Button icon="pi pi-download" label="Export CSV" class="p-button-outlined p-button-secondary" @click="exportToCSV" :disabled="loading" />
                    <Button icon="pi pi-print" label="Print Report" class="p-button-outlined p-button-info" @click="printReport" :disabled="loading" />
                    <Button icon="pi pi-refresh" label="Refresh" class="p-button-primary" @click="loadData" :loading="loading" />
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Filters</h3>
                <Button icon="pi pi-filter" :label="showFilters ? 'Hide Filters' : 'Show Filters'" class="p-button-text" @click="showFilters = !showFilters" />
            </div>

            <div v-if="showFilters" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Date Filter -->
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-700 mb-2">As of Date</label>
                    <Calendar v-model="selectedDate" placeholder="Select date" class="w-full" dateFormat="dd/mm/yy" />
                </div>

                <!-- Branch Filter -->
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                    <Dropdown v-model="selectedBranch" :options="branches" optionLabel="branch_name" optionValue="id" placeholder="All Branches" class="w-full" />
                </div>

                <!-- Account Types Filter -->
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Account Types</label>
                    <MultiSelect v-model="selectedAccountTypes" :options="accountTypeOptions" optionLabel="label" optionValue="value" placeholder="All Account Types" class="w-full" />
                </div>

                <!-- Search Filter -->
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <InputText v-model="filter" placeholder="Search accounts..." class="w-full" icon="pi pi-search" />
                </div>
            </div>

            <!-- Filter Actions -->
            <div v-if="showFilters" class="flex justify-end mt-4 pt-4 border-t">
                <Button icon="pi pi-times" label="Clear Filters" class="p-button-text" @click="clearFilters" />
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-section p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Debits -->
                <Card class="summary-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Debits</p>
                                <p class="text-2xl font-bold text-red-600">{{ formatCurrency(summary.total_debits) }}</p>
                                <p class="text-xs text-gray-500">{{ summary.debit_count }} accounts</p>
                            </div>
                            <div class="p-3 bg-red-100 rounded-full">
                                <i class="pi pi-arrow-down text-red-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Total Credits -->
                <Card class="summary-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Credits</p>
                                <p class="text-2xl font-bold text-green-600">{{ formatCurrency(summary.total_credits) }}</p>
                                <p class="text-xs text-gray-500">{{ summary.credit_count }} accounts</p>
                            </div>
                            <div class="p-3 bg-green-100 rounded-full">
                                <i class="pi pi-arrow-up text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Balance Difference -->
                <Card class="summary-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Balance Difference</p>
                                <p class="text-2xl font-bold" :class="getBalanceClass(summary.balance_difference, 0)">
                                    {{ formatCurrency(Math.abs(summary.balance_difference)) }}
                                </p>
                                <p class="text-xs text-gray-500">
                                    <Tag :value="isBalanced ? 'Balanced' : 'Unbalanced'" :severity="isBalanced ? 'success' : 'danger'" />
                                </p>
                            </div>
                            <div class="p-3" :class="isBalanced ? 'bg-green-100' : 'bg-red-100'">
                                <i class="pi pi-check-circle text-xl" :class="isBalanced ? 'text-green-600' : 'text-red-600'"></i>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Total Accounts -->
                <Card class="summary-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Accounts</p>
                                <p class="text-2xl font-bold text-blue-600">{{ summary.total_accounts }}</p>
                                <p class="text-xs text-gray-500">Active accounts</p>
                            </div>
                            <div class="p-3 bg-blue-100 rounded-full">
                                <i class="pi pi-book text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content p-6">
            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-12">
                <Spinner />
            </div>

            <!-- Data Table -->
            <div v-else class="bg-white rounded-lg shadow">
                <DataTable
                    :value="filteredData"
                    :paginator="true"
                    :rows="25"
                    :totalRecords="filteredData.length"
                    :loading="loading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} accounts"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    stripedRows
                    responsiveLayout="scroll"
                    class="p-datatable-sm"
                >
                    <!-- Account Code -->
                    <Column field="account_code" header="Account Code" sortable style="width: 120px">
                        <template #body="{ data }">
                            <span class="font-mono text-sm font-medium text-gray-900">{{ data.account_code }}</span>
                        </template>
                    </Column>

                    <!-- Account Name -->
                    <Column field="account_name" header="Account Name" sortable>
                        <template #body="{ data }">
                            <span class="font-medium text-gray-900">{{ data.account_name }}</span>
                        </template>
                    </Column>

                    <!-- Account Type -->
                    <Column field="account_type" header="Account Type" sortable style="width: 120px">
                        <template #body="{ data }">
                            <Tag :value="data.account_type?.charAt(0).toUpperCase() + data.account_type?.slice(1)" :severity="getAccountTypeSeverity(data.account_type)" />
                        </template>
                    </Column>

                    <!-- Debit Amount -->
                    <Column field="debit_amount" header="Debit Amount" sortable style="width: 140px">
                        <template #body="{ data }">
                            <span v-if="data.debit_amount > 0" class="font-medium text-red-600">
                                {{ formatCurrency(data.debit_amount) }}
                            </span>
                            <span v-else class="text-gray-400">-</span>
                        </template>
                    </Column>

                    <!-- Credit Amount -->
                    <Column field="credit_amount" header="Credit Amount" sortable style="width: 140px">
                        <template #body="{ data }">
                            <span v-if="data.credit_amount > 0" class="font-medium text-green-600">
                                {{ formatCurrency(data.credit_amount) }}
                            </span>
                            <span v-else class="text-gray-400">-</span>
                        </template>
                    </Column>

                    <!-- Balance -->
                    <Column field="balance" header="Balance" sortable style="width: 140px">
                        <template #body="{ data }">
                            <span class="font-medium" :class="getBalanceClass(data.debit_amount, data.credit_amount)">
                                {{ formatCurrency((data.debit_amount || 0) - (data.credit_amount || 0)) }}
                            </span>
                        </template>
                    </Column>
                </DataTable>

                <!-- Empty State -->
                <div v-if="!loading && filteredData.length === 0" class="text-center py-12">
                    <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No trial balance data found</h3>
                    <p class="text-gray-600 mb-4">Try adjusting your filters or date range</p>
                    <Button icon="pi pi-refresh" label="Refresh Data" class="p-button-primary" @click="loadData" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.trial-balance-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.page-header {
    position: sticky;
    top: 0;
    z-index: 10;
}

.filters-section {
    position: sticky;
    top: 80px;
    z-index: 9;
}

.main-content {
    min-height: calc(100vh - 400px);
}

.summary-card {
    transition: all 0.2s ease;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .page-header {
        padding: 1rem;
    }

    .filters-section {
        padding: 1rem;
    }

    .main-content {
        padding: 1rem;
    }

    .summary-section {
        padding: 1rem;
    }

    .summary-section .grid {
        grid-template-columns: 1fr;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .trial-balance-page {
        background-color: #1a1a1a;
    }

    .page-header,
    .filters-section {
        background-color: #2d2d2d;
        border-color: #404040;
    }
}
</style>
