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
const { currencyChartOptions, barChartOptions } = useChartOptions();
const { state, executeDataFetch } = useDashboardState();
const { hasPermission } = usePermissions();

const loading = ref(false);
const period = ref('month');
const periodOptions = [...PERIOD_OPTIONS, { label: 'Custom Date', value: 'custom' }];

// POS dashboard data
const dashboardData = ref({
    total_sales: 0,
    total_transactions: 0,
    average_transaction_value: 0,
    product_sold: 0,
    discount_given: 0,
    payment_methods: [],
    sales_by_time: [],
    top_products: [],
    top_sales_staff: [],
    recent_transactions: []
});

// Chart data
const paymentMethodsChartData = ref(null);
const salesByTimeChartData = ref(null);
const topProductsChartData = ref(null);
const topStaffChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;

    const result = await executeDataFetch(
        () => dashboardService.getPOSDashboardData(period.value),
        null,
        `POS data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
    );

    if (result) {
        dashboardData.value = result.data || result;
        processChartData();
    }

    loading.value = false;
};

// Process chart data for visualization
const processChartData = () => {
    // Payment methods chart
    if (dashboardData.value.payment_methods?.length > 0) {
        paymentMethodsChartData.value = {
            labels: dashboardData.value.payment_methods.map((item) => item.method),
            datasets: [
                {
                    data: dashboardData.value.payment_methods.map((item) => item.count),
                    backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A', '#AB47BC']
                }
            ]
        };
    }

    // Sales by time chart
    if (dashboardData.value.sales_by_time?.length > 0) {
        salesByTimeChartData.value = {
            labels: dashboardData.value.sales_by_time.map((item) => item.time),
            datasets: [
                {
                    label: 'Sales',
                    data: dashboardData.value.sales_by_time.map((item) => item.amount),
                    borderColor: '#42A5F5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Top products chart
    if (dashboardData.value.top_products?.length > 0) {
        topProductsChartData.value = {
            labels: dashboardData.value.top_products.map((item) => item.name),
            datasets: [
                {
                    label: 'Quantity Sold',
                    data: dashboardData.value.top_products.map((item) => item.quantity_sold),
                    backgroundColor: '#66BB6A',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }
            ]
        };
    }

    // Top staff chart
    if (dashboardData.value.top_sales_staff?.length > 0) {
        topStaffChartData.value = {
            labels: dashboardData.value.top_sales_staff.map((item) => item.name),
            datasets: [
                {
                    label: 'Sales',
                    data: dashboardData.value.top_sales_staff.map((item) => item.total_sales),
                    backgroundColor: '#FFA726',
                    borderColor: '#FB8C00',
                    borderWidth: 1
                }
            ]
        };
    }
};

// Navigation functions
const navigateToProducts = () => {
    router.push('/ecommerce/products');
};

const navigateToTransactions = () => {
    router.push('/pos/transactions');
};

const navigateToPaymentMethods = () => {
    router.push('/pos/payment-methods');
};

const navigateToReports = () => {
    router.push('/pos/reports');
};

// Visibility flags
const canViewSales = hasPermission('view_sales');
const canViewProducts = hasPermission('view_products');
const canViewPaymentMethods = hasPermission('view_paymentmethod');

// Watch for period changes
watch(period, () => {
    loadDashboardData();
});

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="pos-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">POS Dashboard</h1>
            <Dropdown v-model="period" :options="periodOptions" option-label="label" option-value="value" placeholder="Select Period" class="w-48" />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card v-if="canViewSales" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Sales</span>
                            <i class="pi pi-dollar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.total_sales) }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewSales" class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Transactions</span>
                            <i class="pi pi-shopping-cart text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_transactions.toLocaleString() }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewSales" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Avg Transaction</span>
                            <i class="pi pi-chart-bar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.average_transaction_value) }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewSales" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Discounts Given</span>
                            <i class="pi pi-percentage text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.discount_given) }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Payment Methods -->
                <Card v-if="canViewPaymentMethods">
                    <template #title>Payment Methods</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="paymentMethodsChartData" type="pie" :data="paymentMethodsChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No payment data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Sales by Time -->
                <Card v-if="canViewSales">
                    <template #title>Sales by Time of Day</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="salesByTimeChartData" type="line" :data="salesByTimeChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No time-based sales data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Additional Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Products -->
                <Card v-if="canViewProducts">
                    <template #title>Top Selling Products</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="topProductsChartData" type="bar" :data="topProductsChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No product data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Top Sales Staff -->
                <Card v-if="canViewSales">
                    <template #title>Top Sales Staff</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="topStaffChartData" type="bar" :data="topStaffChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No staff sales data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Quick Actions -->
            <Card>
                <template #title>Quick Actions</template>
                <template #content>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button v-if="canViewProducts" label="Products" icon="pi pi-box" class="p-button-outlined" @click="navigateToProducts" />
                        <Button v-if="canViewSales" label="Transactions" icon="pi pi-list" class="p-button-outlined" @click="navigateToTransactions" />
                        <Button v-if="canViewPaymentMethods" label="Payment Methods" icon="pi pi-credit-card" class="p-button-outlined" @click="navigateToPaymentMethods" />
                        <Button v-if="canViewSales" label="Reports" icon="pi pi-chart-bar" class="p-button-outlined" @click="navigateToReports" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.pos-dashboard {
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
