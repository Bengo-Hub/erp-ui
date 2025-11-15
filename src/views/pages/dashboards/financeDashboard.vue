<script setup>
import { useChartOptions } from '@/composables/useChartOptions';
import { useDashboardState } from '@/composables/useDashboardState';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { dashboardService } from '@/services/shared/dashboardService';
import { PERIOD_OPTIONS } from '@/utils/constants';
import Chart from 'primevue/chart';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { currencyChartOptions } = useChartOptions();
const { state, executeDataFetch } = useDashboardState();
const { hasPermission, hasAnyPermission } = usePermissions();

const loading = ref(false);
const period = ref('month');
const periodOptions = PERIOD_OPTIONS;

// Dashboard data
const dashboardData = ref({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    cash_flow: 0,
    outstanding_invoices: 0,
    overdue_payments: 0,
    tax_summary: {},
    expense_breakdown: [],
    revenue_trends: [],
    cash_flow_data: []
});

// Chart data
const revenueChartData = ref(null);
const expenseChartData = ref(null);
const cashFlowChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;
    try {
        const result = await executeDataFetch(
            () => dashboardService.getFinanceDashboardData(period.value),
            null,
            `Finance data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
        );

        if (result) {
            dashboardData.value = result.data || result;
            processChartData();
        }
    } catch (error) {
        console.error('Error loading finance dashboard:', error);
    } finally {
        loading.value = false;
    }
};

// Process chart data for visualization
const processChartData = () => {
    // Revenue trends chart
    if (dashboardData.value.revenue_trends?.length > 0) {
        revenueChartData.value = {
            labels: dashboardData.value.revenue_trends.map((item) => item.period),
            datasets: [
                {
                    label: 'Revenue',
                    data: dashboardData.value.revenue_trends.map((item) => item.amount),
                    borderColor: '#42A5F5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Expense breakdown chart
    if (dashboardData.value.expense_breakdown?.length > 0) {
        expenseChartData.value = {
            labels: dashboardData.value.expense_breakdown.map((item) => item.category),
            datasets: [
                {
                    data: dashboardData.value.expense_breakdown.map((item) => item.amount),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF']
                }
            ]
        };
    }

    // Cash flow chart
    if (dashboardData.value.cash_flow_data?.length > 0) {
        cashFlowChartData.value = {
            labels: dashboardData.value.cash_flow_data.map((item) => item.period),
            datasets: [
                {
                    label: 'Cash Flow',
                    data: dashboardData.value.cash_flow_data.map((item) => item.amount),
                    borderColor: '#66BB6A',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }
};

// Navigation functions
const navigateToExpenses = () => {
    router.push('/finance/expenses');
};

const navigateToBilling = () => {
    router.push('/finance/billing');
};

const navigateToReports = () => {
    router.push('/finance/reports');
};

const navigateToTaxes = () => {
    router.push('/finance/taxes');
};

// Visibility flags by permission
const canViewFinance = hasAnyPermission(['view_payment', 'view_expense', 'view_budget', 'view_tax', 'view_transaction', 'view_billingdocument']);
const canSeeRevenue = hasAnyPermission(['view_payment', 'view_transaction']);
const canSeeExpenses = hasPermission('view_expense');
const canSeeCashFlow = hasAnyPermission(['view_payment', 'view_transaction']);
const canSeeTaxes = hasAnyPermission(['view_tax', 'view_taxrates']);
const canSeeBilling = hasAnyPermission(['view_billingdocument', 'view_payment']);

// Watch for period changes
watch(period, () => {
    loadDashboardData();
});

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="finance-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
            <Dropdown v-model="period" :options="periodOptions" option-label="label" option-value="value" placeholder="Select Period" class="w-48" />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card v-if="canSeeRevenue" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Revenue</span>
                            <i class="pi pi-dollar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.total_revenue) }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canSeeExpenses" class="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Expenses</span>
                            <i class="pi pi-credit-card text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.total_expenses) }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canSeeRevenue" class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Net Profit</span>
                            <i class="pi pi-chart-line text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.net_profit) }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canSeeCashFlow" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Cash Flow</span>
                            <i class="pi pi-wallet text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.cash_flow) }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Revenue Trends -->
                <Card v-if="canSeeRevenue">
                    <template #title>Revenue Trends</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="revenueChartData" type="line" :data="revenueChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No revenue data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Expense Breakdown -->
                <Card v-if="canSeeExpenses">
                    <template #title>Expense Breakdown</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="expenseChartData" type="doughnut" :data="expenseChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No expense data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Cash Flow Chart -->
            <Card v-if="canSeeCashFlow">
                <template #title>Cash Flow Overview</template>
                <template #content>
                    <div class="h-80">
                        <Chart v-if="cashFlowChartData" type="line" :data="cashFlowChartData" :options="currencyChartOptions" class="h-full" />
                        <div v-else class="flex items-center justify-center h-full text-gray-500">No cash flow data available</div>
                    </div>
                </template>
            </Card>

            <!-- Quick Actions -->
            <Card>
                <template #title>Quick Actions</template>
                <template #content>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button v-if="hasPermission('view_expense')" label="Manage Expenses" icon="pi pi-credit-card" class="p-button-outlined" @click="navigateToExpenses" />
                        <Button v-if="canSeeBilling" label="Billing Documents" icon="pi pi-file" class="p-button-outlined" @click="navigateToBilling" />
                        <Button v-if="canViewFinance" label="Generate Reports" icon="pi pi-chart-bar" class="p-button-outlined" @click="navigateToReports" />
                        <Button v-if="canSeeTaxes" label="Tax Management" icon="pi pi-calculator" class="p-button-outlined" @click="navigateToTaxes" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.finance-dashboard {
    padding: 1.5rem;
}

:deep(.p-card) {
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.p-card.p-card--gradient) {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
}
</style>
