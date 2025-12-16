<script setup>
import { useChartOptions } from '@/composables/useChartOptions';
import { formatCurrency, safeNumber } from '@/utils/formatters';
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
const { hasAnyPermission } = usePermissions();

const loading = ref(false);
const period = ref('month');
const periodOptions = PERIOD_OPTIONS;

// Executive dashboard data
const dashboardData = ref({
    // Financial KPIs
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    profit_margin: 0,

    // Operational KPIs
    total_orders: 0,
    total_customers: 0,
    total_employees: 0,
    total_suppliers: 0,

    // Performance metrics
    order_fulfillment_rate: 0,
    customer_satisfaction: 0,
    employee_productivity: 0,
    inventory_turnover: 0,

    // Trends
    revenue_trends: [],
    profit_trends: [],
    order_trends: [],
    customer_growth: []
});

// Chart data
const revenueTrendsChartData = ref(null);
const profitTrendsChartData = ref(null);
const orderTrendsChartData = ref(null);
const customerGrowthChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;
    
    const result = await executeDataFetch(
        () => dashboardService.getExecutiveDashboardData(period.value),
        null,
        `Executive dashboard updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
    );

    if (result) {
        dashboardData.value = result.data || result;
        processChartData();
    }

    loading.value = false;
};

// Generate trend data for charts
const generateTrendData = (baseValue, periods, isInteger = false) => {
    const data = [];
    for (let i = 0; i < periods; i++) {
        const month = new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' });
        const value = baseValue + (Math.random() - 0.5) * baseValue * 0.3;
        data.push({
            period: month,
            value: isInteger ? Math.floor(value) : value
        });
    }
    return data;
};

// Process chart data for visualization
const processChartData = () => {
    // Revenue trends chart
    if (dashboardData.value.revenue_trends?.length > 0) {
        revenueTrendsChartData.value = {
            labels: dashboardData.value.revenue_trends.map((item) => item.period),
            datasets: [
                {
                    label: 'Revenue',
                    data: dashboardData.value.revenue_trends.map((item) => safeNumber(item.value, 0)),
                    borderColor: '#42A5F5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Profit trends chart
    if (dashboardData.value.profit_trends?.length > 0) {
        profitTrendsChartData.value = {
            labels: dashboardData.value.profit_trends.map((item) => item.period),
            datasets: [
                {
                    label: 'Profit',
                    data: dashboardData.value.profit_trends.map((item) => safeNumber(item.value, 0)),
                    borderColor: '#66BB6A',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Order trends chart
    if (dashboardData.value.order_trends?.length > 0) {
        orderTrendsChartData.value = {
            labels: dashboardData.value.order_trends.map((item) => item.period),
            datasets: [
                {
                    label: 'Orders',
                    data: dashboardData.value.order_trends.map((item) => safeNumber(item.value, 0)),
                    borderColor: '#FFA726',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Customer growth chart
    if (dashboardData.value.customer_growth?.length > 0) {
        customerGrowthChartData.value = {
            labels: dashboardData.value.customer_growth.map((item) => item.period),
            datasets: [
                {
                    label: 'Customers',
                    data: dashboardData.value.customer_growth.map((item) => safeNumber(item.value, 0)),
                    borderColor: '#EC407A',
                    backgroundColor: 'rgba(236, 64, 122, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }
};

// Navigation functions
const navigateToFinance = () => {
    router.push('/finance');
};

const navigateToSales = () => {
    router.push('/pos');
};

const navigateToHRM = () => {
    router.push('/hrm');
};

const navigateToProcurement = () => {
    router.push('/procurement');
};

const navigateToManufacturing = () => {
    router.push('/manufacturing');
};

// Role/module-based visibility
const canFinance = hasAnyPermission(['view_payment', 'view_expense', 'view_budget', 'view_tax', 'view_transaction']);
const canSales = hasAnyPermission(['view_sales']);
const canHRM = hasAnyPermission(['view_employee', 'view_payslip']);
const canCRM = hasAnyPermission(['view_contact', 'view_customergroup', 'view_customersegment']);
const canProcurement = hasAnyPermission(['view_purchaseorder', 'view_procurementrequest', 'view_purchase']);
const canManufacturing = hasAnyPermission(['view_productionbatch', 'view_formulas', 'view_qualitycheck']);
const canAnalytics = hasAnyPermission(['view_analyticssnapshot']);

// Watch for period changes
watch(period, () => {
    loadDashboardData();
});

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="executive-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
            <Dropdown v-model="period" :options="periodOptions" option-label="label" option-value="value" placeholder="Select Period" class="w-48" />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Financial KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card v-if="canFinance" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Revenue</span>
                            <i class="pi pi-dollar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ formatCurrency(safeNumber(dashboardData.total_revenue, 0)) }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canFinance" class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Net Profit</span>
                            <i class="pi pi-chart-line text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ formatCurrency(safeNumber(dashboardData.net_profit, 0)) }}
                        </div>
                        <div class="text-sm opacity-75">Margin: {{ (Number.isFinite(Number(dashboardData.profit_margin)) ? (Number(dashboardData.profit_margin) * 100).toFixed(1) : '0.0') }}%</div>
                    </template>
                </Card>

                <Card v-if="canSales || canProcurement" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Orders</span>
                            <i class="pi pi-shopping-cart text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_orders.toLocaleString() }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canCRM" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Customers</span>
                            <i class="pi pi-users text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_customers.toLocaleString() }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Operational KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card v-if="canHRM" class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Employees</span>
                            <i class="pi pi-user text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_employees }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canProcurement" class="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Suppliers</span>
                            <i class="pi pi-building text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_suppliers }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canSales || canProcurement" class="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Fulfillment Rate</span>
                            <i class="pi pi-check-circle text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">{{ (dashboardData.order_fulfillment_rate * 100).toFixed(1) }}%</div>
                    </template>
                </Card>

                <Card v-if="canCRM" class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Customer Satisfaction</span>
                            <i class="pi pi-star text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">{{ safeNumber(dashboardData.customer_satisfaction, 0).toFixed(1) }}/5.0</div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Revenue Trends -->
                <Card>
                    <template #title>Revenue Trends</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="revenueTrendsChartData" type="line" :data="revenueTrendsChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No revenue data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Profit Trends -->
                <Card>
                    <template #title>Profit Trends</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="profitTrendsChartData" type="line" :data="profitTrendsChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No profit data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Additional Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Order Trends -->
                <Card>
                    <template #title>Order Trends</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="orderTrendsChartData" type="line" :data="orderTrendsChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No order data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Customer Growth -->
                <Card>
                    <template #title>Customer Growth</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="customerGrowthChartData" type="line" :data="customerGrowthChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No customer data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Module Navigation -->
            <Card>
                <template #title>Module Access</template>
                <template #content>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Button v-if="canFinance" label="Finance" icon="pi pi-dollar" class="p-button-outlined" @click="navigateToFinance" />
                        <Button v-if="canSales" label="Sales" icon="pi pi-shopping-cart" class="p-button-outlined" @click="navigateToSales" />
                        <Button v-if="canHRM" label="HRM" icon="pi pi-users" class="p-button-outlined" @click="navigateToHRM" />
                        <Button v-if="canProcurement" label="Procurement" icon="pi pi-shopping-bag" class="p-button-outlined" @click="navigateToProcurement" />
                        <Button v-if="canManufacturing" label="Manufacturing" icon="pi pi-cog" class="p-button-outlined" @click="navigateToManufacturing" />
                        <Button v-if="canAnalytics" label="Analytics" icon="pi pi-chart-bar" class="p-button-outlined" @click="() => router.push('/analytics')" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.executive-dashboard {
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
