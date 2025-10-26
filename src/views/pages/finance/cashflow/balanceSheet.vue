<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, reactive, ref, watch } from 'vue';

// Composables
const { toast } = useToast();

// Reactive data
const loading = ref(false);
const error = ref(null);
const selectedDate = ref(new Date());
const selectedBranch = ref(null);
const selectedViewType = ref('standard');
const branches = ref([]);

const summary = reactive({
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
    assets_change: 0,
    liabilities_change: 0,
    equity_change: 0,
    debt_to_equity_ratio: 0,
    current_ratio: 0,
    asset_turnover: 0,
    return_on_assets: 0
});

const assetsData = ref([]);
const liabilitiesData = ref([]);
const equityData = ref([]);

// Computed properties
const viewTypeOptions = [
    { label: 'Standard View', value: 'standard' },
    { label: 'Comparative View', value: 'comparative' },
    { label: 'Detailed View', value: 'detailed' }
];

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
            view_type: selectedViewType.value
        };

        const response = await financeService.getBalanceSheet(params);

        // Update balance sheet data
        const data = response.data;
        assetsData.value = data.assets || [];
        liabilitiesData.value = data.liabilities || [];
        equityData.value = data.equity || [];

        // Update summary
        Object.assign(summary, data.summary || {});

        toast.add({
            severity: 'success',
            summary: 'Report Generated',
            detail: 'Balance sheet has been generated successfully',
            life: 3000
        });
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to generate balance sheet';
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.value,
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const onDateChange = () => {
    loadData();
};

const onBranchChange = () => {
    loadData();
};

const onViewTypeChange = () => {
    loadData();
};

const clearFilters = () => {
    selectedDate.value = new Date();
    selectedBranch.value = null;
    selectedViewType.value = 'standard';
    loadData();
};

const exportData = () => {
    // Implementation for data export
    toast.add({
        severity: 'info',
        summary: 'Export',
        detail: 'Export functionality will be implemented soon',
        life: 3000
    });
};

const getEquityChangeClass = () => {
    const change = summary.equity_change || 0;
    return change >= 0 ? 'card-change positive' : 'card-change negative';
};

const getEquityChangeIcon = () => {
    const change = summary.equity_change || 0;
    return change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
};

const getRatioStatus = () => {
    const ratio = summary.debt_to_equity_ratio || 0;
    if (ratio <= 0.5) return 'Excellent';
    if (ratio <= 1) return 'Good';
    if (ratio <= 2) return 'Fair';
    return 'High Risk';
};

const getRatioSeverity = () => {
    const ratio = summary.debt_to_equity_ratio || 0;
    if (ratio <= 0.5) return 'success';
    if (ratio <= 1) return 'info';
    if (ratio <= 2) return 'warning';
    return 'danger';
};

const getCurrentRatioStatus = () => {
    const ratio = summary.current_ratio || 0;
    if (ratio >= 2) return 'Excellent';
    if (ratio >= 1.5) return 'Good';
    if (ratio >= 1) return 'Fair';
    return 'Poor';
};

const getCurrentRatioSeverity = () => {
    const ratio = summary.current_ratio || 0;
    if (ratio >= 2) return 'success';
    if (ratio >= 1.5) return 'info';
    if (ratio >= 1) return 'warning';
    return 'danger';
};

const getAssetTurnoverStatus = () => {
    const turnover = summary.asset_turnover || 0;
    if (turnover >= 2) return 'Excellent';
    if (turnover >= 1) return 'Good';
    if (turnover >= 0.5) return 'Fair';
    return 'Poor';
};

const getAssetTurnoverSeverity = () => {
    const turnover = summary.asset_turnover || 0;
    if (turnover >= 2) return 'success';
    if (turnover >= 1) return 'info';
    if (turnover >= 0.5) return 'warning';
    return 'danger';
};

const getROAStatus = () => {
    const roa = summary.return_on_assets || 0;
    if (roa >= 15) return 'Excellent';
    if (roa >= 10) return 'Good';
    if (roa >= 5) return 'Fair';
    return 'Poor';
};

const getROASeverity = () => {
    const roa = summary.return_on_assets || 0;
    if (roa >= 15) return 'success';
    if (roa >= 10) return 'info';
    if (roa >= 5) return 'warning';
    return 'danger';
};

const getAssetIcon = (type) => {
    const icons = {
        current_assets: 'pi pi-money-bill',
        fixed_assets: 'pi pi-building',
        intangible_assets: 'pi pi-copyright',
        investments: 'pi pi-chart-line'
    };
    return icons[type?.toLowerCase()] || 'pi pi-wallet';
};

const getLiabilityIcon = (type) => {
    const icons = {
        current_liabilities: 'pi pi-credit-card',
        long_term_liabilities: 'pi pi-bank',
        contingent_liabilities: 'pi pi-exclamation-triangle'
    };
    return icons[type?.toLowerCase()] || 'pi pi-credit-card';
};

const getEquityIcon = (type) => {
    const icons = {
        shareholders_equity: 'pi pi-users',
        retained_earnings: 'pi pi-chart-line',
        capital_reserves: 'pi pi-save'
    };
    return icons[type?.toLowerCase()] || 'pi pi-chart-line';
};

// Lifecycle
onMounted(async () => {
    await loadBranches();
    await loadData();
});

// Watch for changes
watch(selectedDate, () => {
    if (selectedDate.value) {
        loadData();
    }
});
</script>

<template>
    <div class="balance-sheet-dashboard">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-chart-pie text-primary mr-3"></i>
                        Balance Sheet
                    </h1>
                    <p class="page-subtitle">View your financial position with assets, liabilities, and equity</p>
                </div>
                <div class="header-actions">
                    <Button icon="pi pi-refresh" label="Refresh" severity="secondary" outlined :loading="loading" @click="loadData" />
                    <Button icon="pi pi-download" label="Export" severity="success" outlined @click="exportData" />
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <Card class="filters-card">
            <template #content>
                <div class="filters-grid">
                    <div class="filter-group">
                        <label class="filter-label">As of Date</label>
                        <Calendar v-model="selectedDate" :showIcon="true" placeholder="Select date" class="w-full" @date-select="onDateChange" />
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">Branch</label>
                        <Dropdown v-model="selectedBranch" :options="branches" optionLabel="branch_name" optionValue="id" placeholder="All Branches" class="w-full" @change="onBranchChange" />
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">View Type</label>
                        <Dropdown v-model="selectedViewType" :options="viewTypeOptions" optionLabel="label" optionValue="value" placeholder="Select view type" class="w-full" @change="onViewTypeChange" />
                    </div>

                    <div class="filter-actions">
                        <Button icon="pi pi-search" label="Generate Report" :loading="loading" @click="loadData" />
                        <Button icon="pi pi-times" label="Clear" severity="secondary" outlined @click="clearFilters" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <ProgressSpinner size="large" />
            <p class="loading-text">Generating balance sheet...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <i class="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h3 class="error-title">Unable to generate report</h3>
            <p class="error-message">{{ error }}</p>
            <Button icon="pi pi-refresh" label="Try Again" @click="loadData" />
        </div>

        <!-- Main Content -->
        <div v-else class="dashboard-content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <Card class="summary-card assets-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-wallet text-green-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Total Assets</h3>
                                <p class="card-amount text-green-600">
                                    {{ formatCurrency(summary.total_assets || 0) }}
                                </p>
                                <p class="card-change positive">
                                    <i class="pi pi-arrow-up"></i>
                                    +{{ summary.assets_change || 0 }}% from last period
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card liabilities-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-credit-card text-red-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Total Liabilities</h3>
                                <p class="card-amount text-red-600">
                                    {{ formatCurrency(summary.total_liabilities || 0) }}
                                </p>
                                <p class="card-change negative">
                                    <i class="pi pi-arrow-down"></i>
                                    {{ summary.liabilities_change || 0 }}% from last period
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card equity-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-chart-line text-blue-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Total Equity</h3>
                                <p class="card-amount text-blue-600">
                                    {{ formatCurrency(summary.total_equity || 0) }}
                                </p>
                                <p class="card-change" :class="getEquityChangeClass()">
                                    <i :class="getEquityChangeIcon()"></i>
                                    {{ summary.equity_change || 0 }}% from last period
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card ratio-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-percentage text-purple-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Debt-to-Equity</h3>
                                <p class="card-amount text-purple-600">{{ summary.debt_to_equity_ratio || 0 }}:1</p>
                                <p class="card-subtitle">
                                    {{ getRatioStatus() }}
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Balance Sheet Sections -->
            <div class="balance-sheet-sections">
                <!-- Assets Section -->
                <Card class="section-card assets-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-wallet text-green-500 mr-2"></i>
                            Assets
                        </div>
                    </template>
                    <template #content>
                        <div class="section-content">
                            <DataTable
                                :value="assetsData"
                                :loading="loading"
                                dataKey="id"
                                class="section-table"
                                stripedRows
                                showGridlines
                                responsiveLayout="scroll"
                                :paginator="true"
                                :rows="10"
                                :rowsPerPageOptions="[5, 10, 20, 50]"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            >
                                <Column field="account_name" header="Account Name" sortable>
                                    <template #body="{ data }">
                                        <div class="account-cell">
                                            <i :class="getAssetIcon(data.account_type)" class="mr-2"></i>
                                            <span class="account-name">{{ data.account_name }}</span>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="account_type" header="Type" sortable>
                                    <template #body="{ data }">
                                        <Tag :value="data.account_type" severity="success" />
                                    </template>
                                </Column>

                                <Column field="balance" header="Balance (KES)" sortable>
                                    <template #body="{ data }">
                                        <span class="balance-amount positive">
                                            {{ formatCurrency(data.balance) }}
                                        </span>
                                    </template>
                                </Column>

                                <Column field="percentage" header="% of Total" sortable>
                                    <template #body="{ data }">
                                        <div class="percentage-bar">
                                            <div class="percentage-text">{{ data.percentage }}%</div>
                                            <div class="percentage-track">
                                                <div class="percentage-fill bg-green-500" :style="{ width: data.percentage + '%' }"></div>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="last_updated" header="Last Updated" sortable>
                                    <template #body="{ data }">
                                        {{ formatDate(data.last_updated) }}
                                    </template>
                                </Column>
                            </DataTable>

                            <div class="section-total">
                                <div class="total-item">
                                    <span class="total-label">Total Assets:</span>
                                    <span class="total-value positive">{{ formatCurrency(summary.total_assets || 0) }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Liabilities Section -->
                <Card class="section-card liabilities-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-credit-card text-red-500 mr-2"></i>
                            Liabilities
                        </div>
                    </template>
                    <template #content>
                        <div class="section-content">
                            <DataTable
                                :value="liabilitiesData"
                                :loading="loading"
                                dataKey="id"
                                class="section-table"
                                stripedRows
                                showGridlines
                                responsiveLayout="scroll"
                                :paginator="true"
                                :rows="10"
                                :rowsPerPageOptions="[5, 10, 20, 50]"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            >
                                <Column field="account_name" header="Account Name" sortable>
                                    <template #body="{ data }">
                                        <div class="account-cell">
                                            <i :class="getLiabilityIcon(data.account_type)" class="mr-2"></i>
                                            <span class="account-name">{{ data.account_name }}</span>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="account_type" header="Type" sortable>
                                    <template #body="{ data }">
                                        <Tag :value="data.account_type" severity="danger" />
                                    </template>
                                </Column>

                                <Column field="balance" header="Balance (KES)" sortable>
                                    <template #body="{ data }">
                                        <span class="balance-amount negative">
                                            {{ formatCurrency(data.balance) }}
                                        </span>
                                    </template>
                                </Column>

                                <Column field="percentage" header="% of Total" sortable>
                                    <template #body="{ data }">
                                        <div class="percentage-bar">
                                            <div class="percentage-text">{{ data.percentage }}%</div>
                                            <div class="percentage-track">
                                                <div class="percentage-fill bg-red-500" :style="{ width: data.percentage + '%' }"></div>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="last_updated" header="Last Updated" sortable>
                                    <template #body="{ data }">
                                        {{ formatDate(data.last_updated) }}
                                    </template>
                                </Column>
                            </DataTable>

                            <div class="section-total">
                                <div class="total-item">
                                    <span class="total-label">Total Liabilities:</span>
                                    <span class="total-value negative">{{ formatCurrency(summary.total_liabilities || 0) }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Equity Section -->
                <Card class="section-card equity-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-chart-line text-blue-500 mr-2"></i>
                            Equity
                        </div>
                    </template>
                    <template #content>
                        <div class="section-content">
                            <DataTable
                                :value="equityData"
                                :loading="loading"
                                dataKey="id"
                                class="section-table"
                                stripedRows
                                showGridlines
                                responsiveLayout="scroll"
                                :paginator="true"
                                :rows="10"
                                :rowsPerPageOptions="[5, 10, 20, 50]"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                            >
                                <Column field="account_name" header="Account Name" sortable>
                                    <template #body="{ data }">
                                        <div class="account-cell">
                                            <i :class="getEquityIcon(data.account_type)" class="mr-2"></i>
                                            <span class="account-name">{{ data.account_name }}</span>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="account_type" header="Type" sortable>
                                    <template #body="{ data }">
                                        <Tag :value="data.account_type" severity="info" />
                                    </template>
                                </Column>

                                <Column field="balance" header="Balance (KES)" sortable>
                                    <template #body="{ data }">
                                        <span class="balance-amount" :class="data.balance >= 0 ? 'positive' : 'negative'">
                                            {{ formatCurrency(data.balance) }}
                                        </span>
                                    </template>
                                </Column>

                                <Column field="percentage" header="% of Total" sortable>
                                    <template #body="{ data }">
                                        <div class="percentage-bar">
                                            <div class="percentage-text">{{ data.percentage }}%</div>
                                            <div class="percentage-track">
                                                <div class="percentage-fill" :class="data.balance >= 0 ? 'bg-blue-500' : 'bg-red-500'" :style="{ width: data.percentage + '%' }"></div>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="last_updated" header="Last Updated" sortable>
                                    <template #body="{ data }">
                                        {{ formatDate(data.last_updated) }}
                                    </template>
                                </Column>
                            </DataTable>

                            <div class="section-total">
                                <div class="total-item">
                                    <span class="total-label">Total Equity:</span>
                                    <span class="total-value" :class="summary.total_equity >= 0 ? 'positive' : 'negative'">
                                        {{ formatCurrency(summary.total_equity || 0) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Financial Ratios -->
            <Card class="ratios-card">
                <template #title>
                    <div class="ratios-title">
                        <i class="pi pi-chart-bar mr-2"></i>
                        Financial Ratios
                    </div>
                </template>
                <template #content>
                    <div class="ratios-grid">
                        <div class="ratio-item">
                            <div class="ratio-header">
                                <h4 class="ratio-name">Current Ratio</h4>
                                <Tag :value="getCurrentRatioStatus()" :severity="getCurrentRatioSeverity()" />
                            </div>
                            <p class="ratio-value">{{ summary.current_ratio || 0 }}</p>
                            <p class="ratio-description">Current Assets / Current Liabilities</p>
                        </div>

                        <div class="ratio-item">
                            <div class="ratio-header">
                                <h4 class="ratio-name">Debt-to-Equity</h4>
                                <Tag :value="getRatioStatus()" :severity="getRatioSeverity()" />
                            </div>
                            <p class="ratio-value">{{ summary.debt_to_equity_ratio || 0 }}</p>
                            <p class="ratio-description">Total Liabilities / Total Equity</p>
                        </div>

                        <div class="ratio-item">
                            <div class="ratio-header">
                                <h4 class="ratio-name">Asset Turnover</h4>
                                <Tag :value="getAssetTurnoverStatus()" :severity="getAssetTurnoverSeverity()" />
                            </div>
                            <p class="ratio-value">{{ summary.asset_turnover || 0 }}</p>
                            <p class="ratio-description">Revenue / Average Total Assets</p>
                        </div>

                        <div class="ratio-item">
                            <div class="ratio-header">
                                <h4 class="ratio-name">Return on Assets</h4>
                                <Tag :value="getROAStatus()" :severity="getROASeverity()" />
                            </div>
                            <p class="ratio-value">{{ summary.return_on_assets || 0 }}%</p>
                            <p class="ratio-description">Net Income / Total Assets</p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.balance-sheet-dashboard {
    @apply p-6 space-y-6;
}

.dashboard-header {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.header-content {
    @apply p-6 flex justify-between items-center;
}

.title-section {
    @apply flex-1;
}

.page-title {
    @apply text-2xl font-bold text-gray-900 flex items-center;
}

.page-subtitle {
    @apply text-gray-600 mt-1;
}

.header-actions {
    @apply flex gap-3;
}

.filters-card {
    @apply bg-white shadow-sm;
}

.filters-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end;
}

.filter-group {
    @apply space-y-2;
}

.filter-label {
    @apply block text-sm font-medium text-gray-700;
}

.filter-actions {
    @apply flex gap-2;
}

.loading-container {
    @apply flex flex-col items-center justify-center py-12;
}

.loading-text {
    @apply text-gray-600 mt-4;
}

.error-container {
    @apply flex flex-col items-center justify-center py-12;
}

.error-title {
    @apply text-xl font-semibold text-gray-900 mb-2;
}

.error-message {
    @apply text-gray-600 mb-4 text-center;
}

.dashboard-content {
    @apply space-y-6;
}

.summary-cards {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.summary-card {
    @apply bg-white shadow-sm border-0;
}

.card-content {
    @apply flex items-center space-x-4;
}

.card-icon {
    @apply text-2xl;
}

.card-details {
    @apply flex-1;
}

.card-title {
    @apply text-sm font-medium text-gray-600 mb-1;
}

.card-amount {
    @apply text-2xl font-bold mb-1;
}

.card-change {
    @apply text-xs flex items-center;
}

.card-change.positive {
    @apply text-green-600;
}

.card-change.negative {
    @apply text-red-600;
}

.card-subtitle {
    @apply text-xs text-gray-500;
}

.balance-sheet-sections {
    @apply space-y-6;
}

.section-card {
    @apply bg-white shadow-sm;
}

.section-title {
    @apply flex items-center text-lg font-semibold text-gray-900;
}

.section-content {
    @apply space-y-4;
}

.section-table {
    @apply w-full;
}

.account-cell {
    @apply flex items-center;
}

.account-name {
    @apply font-medium;
}

.balance-amount {
    @apply font-medium;
}

.balance-amount.positive {
    @apply text-green-600;
}

.balance-amount.negative {
    @apply text-red-600;
}

.percentage-bar {
    @apply flex items-center space-x-2;
}

.percentage-text {
    @apply text-sm font-medium text-gray-700 min-w-[3rem];
}

.percentage-track {
    @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.percentage-fill {
    @apply h-full rounded-full transition-all duration-300;
}

.section-total {
    @apply border-t border-gray-200 pt-4;
}

.total-item {
    @apply flex justify-between items-center p-3 bg-gray-50 rounded-lg;
}

.total-label {
    @apply text-lg font-semibold text-gray-900;
}

.total-value {
    @apply text-xl font-bold;
}

.total-value.positive {
    @apply text-green-600;
}

.total-value.negative {
    @apply text-red-600;
}

.ratios-card {
    @apply bg-white shadow-sm;
}

.ratios-title {
    @apply flex items-center text-lg font-semibold text-gray-900;
}

.ratios-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.ratio-item {
    @apply p-4 border border-gray-200 rounded-lg;
}

.ratio-header {
    @apply flex justify-between items-center mb-2;
}

.ratio-name {
    @apply text-sm font-semibold text-gray-900;
}

.ratio-value {
    @apply text-2xl font-bold text-gray-900 mb-1;
}

.ratio-description {
    @apply text-xs text-gray-600;
}

@media (max-width: 768px) {
    .header-content {
        @apply flex-col items-start space-y-4;
    }

    .header-actions {
        @apply w-full justify-end;
    }

    .filters-grid {
        @apply grid-cols-1;
    }

    .summary-cards {
        @apply grid-cols-1;
    }

    .ratios-grid {
        @apply grid-cols-1;
    }
}
</style>
