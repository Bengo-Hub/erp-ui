<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Chart from 'chart.js/auto';
import { computed, onMounted, reactive, ref, watch } from 'vue';

// Composables
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const error = ref(null);
const dateRange = ref(null);
const selectedBranch = ref(null);
const selectedPeriod = ref('month');
const branches = ref([]);
const summary = reactive({
    total_inflows: 0,
    total_outflows: 0,
    net_cash: 0,
    current_balance: 0,
    inflow_change: 0,
    outflow_change: 0,
    net_change: 0,
    breakdown: {}
});

// Chart references
const cashFlowChart = ref(null);
const breakdownChart = ref(null);
let cashFlowChartInstance = null;
let breakdownChartInstance = null;

// Computed properties
const breakdownData = computed(() => {
    if (!summary.breakdown) return [];

    const total = summary.total_inflows + summary.total_outflows;
    return Object.entries(summary.breakdown).map(([category, amount], index) => ({
        id: index,
        category: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
        type: getCategoryType(category),
        amount: amount || 0,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        date: new Date()
    }));
});

// Helper function to determine category type
const getCategoryType = (category) => {
    const inflowCategories = ['income', 'refund'];
    const outflowCategories = ['expense', 'payment', 'transfer'];

    if (inflowCategories.includes(category)) return 'inflow';
    if (outflowCategories.includes(category)) return 'outflow';
    return 'other';
};

const periodOptions = [
    { label: 'Last 7 Days', value: 'week' },
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Last 90 Days', value: 'quarter' },
    { label: 'Last 12 Months', value: 'year' },
    { label: 'Custom Range', value: 'custom' }
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
            period: selectedPeriod.value,
            start_date: dateRange.value?.[0]?.toISOString().split('T')[0],
            end_date: dateRange.value?.[1]?.toISOString().split('T')[0]
        };

        if (selectedBranch.value) {
            params.branch_id = selectedBranch.value;
        }

        const response = await financeService.getCashFlowSummary(params);

        // Update summary data
        Object.assign(summary, response.data);

        // Update charts
        updateCharts();

        showToast('success', 'Cash flow data has been updated successfully');
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load cash flow data';
        showToast('error', error.value);
    } finally {
        loading.value = false;
    }
};

const updateCharts = () => {
    updateCashFlowChart();
    updateBreakdownChart();
};

const updateCashFlowChart = () => {
    if (!cashFlowChart.value) return;

    if (cashFlowChartInstance) {
        cashFlowChartInstance.destroy();
    }

    const ctx = cashFlowChart.value.getContext('2d');
    cashFlowChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Inflows', 'Outflows', 'Net Cash'],
            datasets: [
                {
                    label: 'Amount (KES)',
                    data: [summary.total_inflows || 0, summary.total_outflows || 0, summary.net_cash || 0],
                    backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                    borderColor: ['#10b981', '#ef4444', '#3b82f6'],
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
};

const updateBreakdownChart = () => {
    if (!breakdownChart.value) return;

    if (breakdownChartInstance) {
        breakdownChartInstance.destroy();
    }

    const ctx = breakdownChart.value.getContext('2d');
    const chartData = breakdownData.value;

    cashFlowChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map((item) => item.category),
            datasets: [
                {
                    data: chartData.map((item) => item.amount),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
};

const onDateRangeChange = () => {
    if (dateRange.value?.length === 2) {
        selectedPeriod.value = 'custom';
    }
};

const onBranchChange = () => {
    loadData();
};

const onPeriodChange = () => {
    if (selectedPeriod.value !== 'custom') {
        dateRange.value = null;
    }
    loadData();
};

const clearFilters = () => {
    dateRange.value = null;
    selectedBranch.value = null;
    selectedPeriod.value = 'month';
    loadData();
};

const exportData = () => {
    // Implementation for data export
    showToast('info', 'Export functionality will be implemented soon');
};

const getNetCashClass = () => {
    const net = summary.net_cash || 0;
    return net >= 0 ? 'text-green-600' : 'text-red-600';
};

const getNetCashChangeClass = () => {
    const change = summary.net_change || 0;
    return change >= 0 ? 'card-change positive' : 'card-change negative';
};

const getNetCashChangeIcon = () => {
    const change = summary.net_change || 0;
    return change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
};

const getCategoryIcon = (category) => {
    const icons = {
        Sales: 'pi pi-shopping-cart',
        Expenses: 'pi pi-credit-card',
        Payments: 'pi pi-money-bill',
        Taxes: 'pi pi-percentage',
        Investments: 'pi pi-chart-line',
        Loans: 'pi pi-bank',
        Other: 'pi pi-circle'
    };
    return icons[category] || icons['Other'];
};

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
