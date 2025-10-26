<script setup>
import { useChartOptions } from '@/composables/useChartOptions';
import { useDashboardState } from '@/composables/useDashboardState';
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

const loading = ref(false);
const period = ref('month');
const periodOptions = PERIOD_OPTIONS;

// Dashboard data
const dashboardData = ref({
    total_orders: 0,
    total_spend: 0,
    pending_orders: 0,
    completed_orders: 0,
    supplier_count: 0,
    average_order_value: 0,
    top_suppliers: [],
    category_breakdown: [],
    order_trends: [],
    spend_analysis: []
});

// Chart data
const orderTrendsChartData = ref(null);
const categoryBreakdownChartData = ref(null);
const spendAnalysisChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;
    try {
        const result = await executeDataFetch(
            () => dashboardService.getProcurementDashboardData(period.value),
            null,
            `Procurement data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
        );

        if (result) {
            dashboardData.value = result.data || result;
            processChartData();
        }
    } catch (error) {
        console.error('Error loading procurement dashboard:', error);
    } finally {
        loading.value = false;
    }
};

// Process chart data for visualization
const processChartData = () => {
    // Order trends chart
    if (dashboardData.value.order_trends?.length > 0) {
        orderTrendsChartData.value = {
            labels: dashboardData.value.order_trends.map((item) => item.period),
            datasets: [
                {
                    label: 'Orders',
                    data: dashboardData.value.order_trends.map((item) => item.count),
                    borderColor: '#42A5F5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Category breakdown chart
    if (dashboardData.value.category_breakdown?.length > 0) {
        categoryBreakdownChartData.value = {
            labels: dashboardData.value.category_breakdown.map((item) => item.category),
            datasets: [
                {
                    data: dashboardData.value.category_breakdown.map((item) => item.amount),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF']
                }
            ]
        };
    }

    // Spend analysis chart
    if (dashboardData.value.spend_analysis?.length > 0) {
        spendAnalysisChartData.value = {
            labels: dashboardData.value.spend_analysis.map((item) => item.period),
            datasets: [
                {
                    label: 'Spend',
                    data: dashboardData.value.spend_analysis.map((item) => item.amount),
                    borderColor: '#66BB6A',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }
};

// Navigation functions
const navigateToPurchaseOrders = () => {
    router.push('/procurement/purchase-orders');
};

const navigateToSuppliers = () => {
    router.push('/procurement/suppliers');
};

const navigateToRequisitions = () => {
    router.push('/procurement/requisitions');
};

const navigateToContracts = () => {
    router.push('/procurement/contracts');
};

// Watch for period changes
watch(period, () => {
    loadDashboardData();
});

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="procurement-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Procurement Dashboard</h1>
            <Dropdown v-model="period" :options="periodOptions" option-label="label" option-value="value" placeholder="Select Period" class="w-48" />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Orders</span>
                            <i class="pi pi-shopping-cart text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_orders }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Spend</span>
                            <i class="pi pi-dollar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.total_spend) }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Pending Orders</span>
                            <i class="pi pi-clock text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.pending_orders }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Suppliers</span>
                            <i class="pi pi-users text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.supplier_count }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
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

                <!-- Category Breakdown -->
                <Card>
                    <template #title>Spend by Category</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="categoryBreakdownChartData" type="doughnut" :data="categoryBreakdownChartData" :options="currencyChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No category data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Spend Analysis Chart -->
            <Card>
                <template #title>Spend Analysis</template>
                <template #content>
                    <div class="h-80">
                        <Chart v-if="spendAnalysisChartData" type="line" :data="spendAnalysisChartData" :options="currencyChartOptions" class="h-full" />
                        <div v-else class="flex items-center justify-center h-full text-gray-500">No spend data available</div>
                    </div>
                </template>
            </Card>

            <!-- Top Suppliers Table -->
            <Card>
                <template #title>Top Suppliers</template>
                <template #content>
                    <DataTable :value="dashboardData.top_suppliers" :rows="5" striped-rows class="p-datatable-sm">
                        <Column field="name" header="Supplier Name" sortable></Column>
                        <Column field="total_spend" header="Total Spend" sortable>
                            <template #body="slotProps">
                                {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(slotProps.data.total_spend) }}
                            </template>
                        </Column>
                        <Column field="order_count" header="Orders" sortable></Column>
                        <Column field="rating" header="Rating" sortable>
                            <template #body="slotProps">
                                <div class="flex items-center">
                                    <span class="text-yellow-500">
                                        <i class="pi pi-star-fill" v-for="n in Math.floor(slotProps.data.rating)" :key="n"></i>
                                    </span>
                                    <span class="ml-2">{{ slotProps.data.rating }}</span>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Quick Actions -->
            <Card>
                <template #title>Quick Actions</template>
                <template #content>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button label="Purchase Orders" icon="pi pi-shopping-cart" class="p-button-outlined" @click="navigateToPurchaseOrders" />
                        <Button label="Manage Suppliers" icon="pi pi-users" class="p-button-outlined" @click="navigateToSuppliers" />
                        <Button label="Requisitions" icon="pi pi-file" class="p-button-outlined" @click="navigateToRequisitions" />
                        <Button label="Contracts" icon="pi pi-file-edit" class="p-button-outlined" @click="navigateToContracts" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.procurement-dashboard {
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
