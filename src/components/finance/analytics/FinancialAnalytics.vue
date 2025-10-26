<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/FinanceService';
import { onMounted, reactive, ref } from 'vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();

// State
const loading = ref(false);
const selectedPeriod = ref('month');
const analyticsData = ref({});

// Period options
const periodOptions = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' }
];

// KPIs
const kpis = reactive({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashFlow: 0,
    revenueChange: 0,
    expenseChange: 0,
    profitChange: 0,
    cashFlowChange: 0
});

// Chart data
const revenueExpenseData = ref({
    labels: [],
    datasets: [
        {
            label: 'Revenue',
            data: [],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
        },
        {
            label: 'Expenses',
            data: [],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
        }
    ]
});

const profitMarginData = ref({
    labels: ['Net Profit', 'Expenses'],
    datasets: [
        {
            data: [0, 0],
            backgroundColor: ['#10B981', '#EF4444'],
            borderWidth: 0
        }
    ]
});

const taxCollectedData = ref({
    labels: [],
    datasets: [
        {
            label: 'Tax Collected',
            data: [],
            backgroundColor: '#8B5CF6',
            borderColor: '#7C3AED',
            borderWidth: 1
        }
    ]
});

// Chart options
const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function (value) {
                    return new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(value);
                }
            }
        }
    }
};

const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    }
};

const barChartOptions = {
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
                    return new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(value);
                }
            }
        }
    }
};

// Sample data for demonstration
const topRevenueSources = ref([
    { name: 'Product Sales', category: 'Sales', amount: 2500000, percentage: 45 },
    { name: 'Service Fees', category: 'Services', amount: 1800000, percentage: 32 },
    { name: 'Consulting', category: 'Services', amount: 800000, percentage: 14 },
    { name: 'Licensing', category: 'Other', amount: 400000, percentage: 7 },
    { name: 'Support', category: 'Services', amount: 200000, percentage: 2 }
]);

const expenseBreakdown = ref([
    { category: 'Personnel', amount: 1800000, count: 45, percentage: 40 },
    { category: 'Operations', amount: 900000, count: 120, percentage: 20 },
    { category: 'Marketing', amount: 675000, count: 25, percentage: 15 },
    { category: 'Technology', amount: 450000, count: 30, percentage: 10 },
    { category: 'Administration', amount: 225000, count: 15, percentage: 5 }
]);

const cashFlowSummary = reactive({
    operating: 0,
    investing: 0,
    financing: 0,
    net: 0
});

const taxSummary = reactive({
    vatCollected: 0,
    vatPaid: 0,
    netVat: 0,
    withholdingTax: 0
});

// Load analytics data
const loadAnalytics = async () => {
    loading.value = true;
    try {
        const response = await financeService.getAnalyticsData(selectedPeriod.value);
        analyticsData.value = response.data;

        // Update KPIs
        updateKPIs();

        // Update charts
        updateCharts();
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('error', 'Failed to load financial analytics');
    } finally {
        loading.value = false;
    }
};

// Update KPIs
const updateKPIs = () => {
    const data = analyticsData.value;

    kpis.totalRevenue = data.total_revenue || 0;
    kpis.totalExpenses = data.total_expenses || 0;
    kpis.netProfit = data.net_profit || 0;
    kpis.cashFlow = data.cash_flow || 0;

    // Calculate changes (this would come from backend in real implementation)
    kpis.revenueChange = data.revenue_change || 5.2;
    kpis.expenseChange = data.expense_change || -2.1;
    kpis.profitChange = data.profit_change || 12.5;
    kpis.cashFlowChange = data.cash_flow_change || 8.3;
};

// Update charts
const updateCharts = () => {
    const data = analyticsData.value;

    // Revenue vs Expenses chart
    if (data.revenue_expense_trend) {
        revenueExpenseData.value.labels = data.revenue_expense_trend.labels || [];
        revenueExpenseData.value.datasets[0].data = data.revenue_expense_trend.revenue || [];
        revenueExpenseData.value.datasets[1].data = data.revenue_expense_trend.expenses || [];
    }

    // Profit margin chart
    if (data.profit_margin) {
        profitMarginData.value.datasets[0].data = [data.profit_margin.net_profit || 0, data.profit_margin.expenses || 0];
    }

    // Tax collected chart
    if (data.tax_trend) {
        taxCollectedData.value.labels = data.tax_trend.labels || [];
        taxCollectedData.value.datasets[0].data = data.tax_trend.tax_collected || [];
    }

    // Update other data
    if (data.cash_flow_summary) {
        Object.assign(cashFlowSummary, data.cash_flow_summary);
    }

    if (data.tax_summary) {
        Object.assign(taxSummary, data.tax_summary);
    }
};

// Utility functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// Load data on mount
onMounted(() => {
    loadAnalytics();
});
</script>

<template>
    <div class="space-y-6">
        <!-- KPIs Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <template #content>
                    <div class="text-center">
                        <div class="text-2xl font-bold">{{ formatCurrency(kpis.totalRevenue) }}</div>
                        <div class="text-blue-100">Total Revenue</div>
                        <div class="text-sm mt-2" :class="kpis.revenueChange >= 0 ? 'text-green-200' : 'text-red-200'">{{ kpis.revenueChange >= 0 ? '+' : '' }}{{ kpis.revenueChange }}% vs last period</div>
                    </div>
                </template>
            </Card>

            <Card class="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <template #content>
                    <div class="text-center">
                        <div class="text-2xl font-bold">{{ formatCurrency(kpis.totalExpenses) }}</div>
                        <div class="text-red-100">Total Expenses</div>
                        <div class="text-sm mt-2" :class="kpis.expenseChange >= 0 ? 'text-red-200' : 'text-green-200'">{{ kpis.expenseChange >= 0 ? '+' : '' }}{{ kpis.expenseChange }}% vs last period</div>
                    </div>
                </template>
            </Card>

            <Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <template #content>
                    <div class="text-center">
                        <div class="text-2xl font-bold">{{ formatCurrency(kpis.netProfit) }}</div>
                        <div class="text-green-100">Net Profit</div>
                        <div class="text-sm mt-2" :class="kpis.profitChange >= 0 ? 'text-green-200' : 'text-red-200'">{{ kpis.profitChange >= 0 ? '+' : '' }}{{ kpis.profitChange }}% vs last period</div>
                    </div>
                </template>
            </Card>

            <Card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <template #content>
                    <div class="text-center">
                        <div class="text-2xl font-bold">{{ formatCurrency(kpis.cashFlow) }}</div>
                        <div class="text-purple-100">Cash Flow</div>
                        <div class="text-sm mt-2" :class="kpis.cashFlowChange >= 0 ? 'text-green-200' : 'text-red-200'">{{ kpis.cashFlowChange >= 0 ? '+' : '' }}{{ kpis.cashFlowChange }}% vs last period</div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Revenue vs Expenses Chart -->
            <Card>
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Revenue vs Expenses Trend</span>
                        <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" class="w-32" @change="loadAnalytics" />
                    </div>
                </template>
                <template #content>
                    <Chart type="line" :data="revenueExpenseData" :options="lineChartOptions" class="h-80" />
                </template>
            </Card>

            <!-- Profit Margin Chart -->
            <Card>
                <template #title>
                    <span>Profit Margin Analysis</span>
                </template>
                <template #content>
                    <Chart type="doughnut" :data="profitMarginData" :options="doughnutChartOptions" class="h-80" />
                </template>
            </Card>
        </div>

        <!-- Detailed Analytics -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Top Revenue Sources -->
            <Card>
                <template #title>
                    <span>Top Revenue Sources</span>
                </template>
                <template #content>
                    <div class="space-y-3">
                        <div v-for="source in topRevenueSources" :key="source.name" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div class="font-medium">{{ source.name }}</div>
                                <div class="text-sm text-gray-600">{{ source.category }}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold">{{ formatCurrency(source.amount) }}</div>
                                <div class="text-sm text-gray-600">{{ source.percentage }}%</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Expense Breakdown -->
            <Card>
                <template #title>
                    <span>Expense Breakdown</span>
                </template>
                <template #content>
                    <div class="space-y-3">
                        <div v-for="expense in expenseBreakdown" :key="expense.category" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div class="font-medium">{{ expense.category }}</div>
                                <div class="text-sm text-gray-600">{{ expense.count }} transactions</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold">{{ formatCurrency(expense.amount) }}</div>
                                <div class="text-sm text-gray-600">{{ expense.percentage }}%</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Cash Flow Summary -->
            <Card>
                <template #title>
                    <span>Cash Flow Summary</span>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Operating Cash Flow</span>
                            <span class="font-bold text-green-600">{{ formatCurrency(cashFlowSummary.operating) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Investing Cash Flow</span>
                            <span class="font-bold text-blue-600">{{ formatCurrency(cashFlowSummary.investing) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Financing Cash Flow</span>
                            <span class="font-bold text-purple-600">{{ formatCurrency(cashFlowSummary.financing) }}</span>
                        </div>
                        <div class="border-t pt-3">
                            <div class="flex justify-between items-center">
                                <span class="font-bold">Net Cash Flow</span>
                                <span class="font-bold text-lg" :class="cashFlowSummary.net >= 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ formatCurrency(cashFlowSummary.net) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Tax Analysis -->
        <Card>
            <template #title>
                <span>Tax Analysis</span>
            </template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium mb-3">Tax Collected</h4>
                        <Chart type="bar" :data="taxCollectedData" :options="barChartOptions" class="h-64" />
                    </div>
                    <div>
                        <h4 class="font-medium mb-3">Tax Summary</h4>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>VAT Collected</span>
                                <span class="font-bold text-green-600">{{ formatCurrency(taxSummary.vatCollected) }}</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>VAT Paid</span>
                                <span class="font-bold text-red-600">{{ formatCurrency(taxSummary.vatPaid) }}</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>Net VAT</span>
                                <span class="font-bold" :class="taxSummary.netVat >= 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ formatCurrency(taxSummary.netVat) }}
                                </span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>Withholding Tax</span>
                                <span class="font-bold text-blue-600">{{ formatCurrency(taxSummary.withholdingTax) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
