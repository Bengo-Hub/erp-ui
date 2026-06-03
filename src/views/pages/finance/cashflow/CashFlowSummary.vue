<script setup>
import { useCashFlowSummary } from '@/composables/finance/useCashFlowSummary';
import { formatDate } from '@/utils/formatters';
import { onMounted, watch } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const { formatCurrencySync } = useGlobalCurrency();
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

// Use composable
const {
    loading,
    error,
    dateRange,
    selectedBranch,
    selectedPeriod,
    branches,
    summary,
    cashFlowChart,
    breakdownChart,
    periodOptions,
    breakdownData,
    loadBranches,
    loadData,
    updateCharts,
    updateCashFlowChart,
    updateBreakdownChart,
    onDateRangeChange,
    onBranchChange,
    onPeriodChange,
    clearFilters,
    exportData,
    getNetCashClass,
    getNetCashChangeClass,
    getNetCashChangeIcon,
    getCategoryIcon
} = useCashFlowSummary();

// Lifecycle
onMounted(async () => {
    await loadBranches();
    await loadData();
});

// Watch for changes
watch(dateRange, () => {
    if (dateRange.value?.length === 2) {
        loadData();
    }
});
</script>

<template>
    <div class="finance-dashboard">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-chart-line text-primary mr-3"></i>
                        Cash Flow Summary
                    </h1>
                    <p class="page-subtitle">Monitor your cash inflows and outflows with detailed analytics</p>
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
                        <label class="filter-label">Date Range</label>
                        <Calendar v-model="dateRange" selectionMode="range" :showIcon="true" placeholder="Select date range" class="w-full" @date-select="onDateRangeChange" />
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">Branch</label>
                        <Dropdown v-model="selectedBranch" :options="branches" optionLabel="branch_name" optionValue="id" placeholder="All Branches" class="w-full" @change="onBranchChange" />
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">Period</label>
                        <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" placeholder="Select period" class="w-full" @change="onPeriodChange" />
                    </div>

                    <div class="filter-actions">
                        <Button icon="pi pi-search" label="Apply Filters" :loading="loading" @click="loadData" />
                        <Button icon="pi pi-times" label="Clear" severity="secondary" outlined @click="clearFilters" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <ProgressSpinner size="large" />
            <p class="loading-text">Loading cash flow data...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <i class="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h3 class="error-title">Unable to load data</h3>
            <p class="error-message">{{ error }}</p>
            <Button icon="pi pi-refresh" label="Try Again" @click="loadData" />
        </div>

        <!-- Main Content -->
        <div v-else class="dashboard-content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <Card class="summary-card inflow-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-arrow-down text-green-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Total Inflows</h3>
                                <p class="card-amount text-green-600">
                                    {{ formatCurrency(summary.total_inflows || 0) }}
                                </p>
                                <p class="card-change positive">
                                    <i class="pi pi-arrow-up"></i>
                                    +{{ summary.inflow_change || 0 }}% from last period
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card outflow-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-arrow-up text-red-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Total Outflows</h3>
                                <p class="card-amount text-red-600">
                                    {{ formatCurrency(summary.total_outflows || 0) }}
                                </p>
                                <p class="card-change negative">
                                    <i class="pi pi-arrow-down"></i>
                                    {{ summary.outflow_change || 0 }}% from last period
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card net-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-chart-line text-blue-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Net Cash Flow</h3>
                                <p class="card-amount" :class="getNetCashClass()">
                                    {{ formatCurrency(summary.net_cash || 0) }}
                                </p>
                                <p class="card-change" :class="getNetCashChangeClass()">
                                    <i :class="getNetCashChangeIcon()"></i>
                                    {{ summary.net_change || 0 }}% from last period
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card balance-card">
                    <template #content>
                        <div class="card-content">
                            <div class="card-icon">
                                <i class="pi pi-wallet text-purple-500"></i>
                            </div>
                            <div class="card-details">
                                <h3 class="card-title">Current Balance</h3>
                                <p class="card-amount text-purple-600">
                                    {{ formatCurrency(summary.current_balance || 0) }}
                                </p>
                                <p class="card-subtitle">As of {{ formatDate(new Date()) }}</p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-container">
                    <Card class="chart-card">
                        <template #title>
                            <div class="chart-title">
                                <i class="pi pi-chart-bar mr-2"></i>
                                Cash Flow Trend
                            </div>
                        </template>
                        <template #content>
                            <div class="chart-content">
                                <canvas ref="cashFlowChart" width="400" height="200"></canvas>
                            </div>
                        </template>
                    </Card>
                </div>

                <div class="chart-container">
                    <Card class="chart-card">
                        <template #title>
                            <div class="chart-title">
                                <i class="pi pi-chart-pie mr-2"></i>
                                Cash Flow Breakdown
                            </div>
                        </template>
                        <template #content>
                            <div class="chart-content">
                                <canvas ref="breakdownChart" width="400" height="200"></canvas>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

            <!-- Detailed Breakdown -->
            <Card class="breakdown-card">
                <template #title>
                    <div class="breakdown-title">
                        <i class="pi pi-list mr-2"></i>
                        Detailed Breakdown
                    </div>
                </template>
                <template #content>
                    <DataTable :value="breakdownData" :loading="loading" dataKey="id" class="breakdown-table" stripedRows showGridlines responsiveLayout="scroll">
                        <Column field="category" header="Category" sortable>
                            <template #body="{ data }">
                                <div class="category-cell">
                                    <i :class="getCategoryIcon(data.category)" class="mr-2"></i>
                                    {{ data.category }}
                                </div>
                            </template>
                        </Column>
                        <Column field="type" header="Type" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.type.charAt(0).toUpperCase() + data.type.slice(1)" :severity="data.type === 'inflow' ? 'success' : 'danger'" />
                            </template>
                        </Column>
                        <Column field="amount" header="Amount" sortable>
                            <template #body="{ data }">
                                <span :class="data.type === 'inflow' ? 'text-green-600' : 'text-red-600'">
                                    {{ formatCurrency(data.amount) }}
                                </span>
                            </template>
                        </Column>
                        <Column field="percentage" header="Percentage" sortable>
                            <template #body="{ data }">
                                <div class="percentage-bar">
                                    <div class="percentage-text">{{ data.percentage }}%</div>
                                    <div class="percentage-track">
                                        <div class="percentage-fill" :class="data.type === 'inflow' ? 'bg-green-500' : 'bg-red-500'" :style="{ width: data.percentage + '%' }"></div>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column field="date" header="Date" sortable>
                            <template #body="{ data }">
                                {{ formatDate(data.date) }}
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

.finance-dashboard {
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

.charts-section {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.chart-container {
    @apply bg-white rounded-lg shadow-sm;
}

.chart-card {
    @apply border-0;
}

.chart-title {
    @apply flex items-center text-lg font-semibold text-gray-900;
}

.chart-content {
    @apply p-4 h-80;
}

.breakdown-card {
    @apply bg-white shadow-sm;
}

.breakdown-title {
    @apply flex items-center text-lg font-semibold text-gray-900;
}

.breakdown-table {
    @apply w-full;
}

.category-cell {
    @apply flex items-center;
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

    .charts-section {
        @apply grid-cols-1;
    }
}
</style>
