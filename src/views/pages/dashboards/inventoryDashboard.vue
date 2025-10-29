<script setup>
import { useChartOptions } from '@/composables/useChartOptions';
import { useDashboardState } from '@/composables/useDashboardState';
import { useToast } from '@/composables/useToast';
import { PERIOD_OPTIONS } from '@/utils/constants';
import Chart from 'primevue/chart';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { barChartOptions } = useChartOptions();
const { state, executeDataFetch } = useDashboardState();

const loading = ref(false);
const period = ref('month');
const periodOptions = PERIOD_OPTIONS;

// Dashboard data
const dashboardData = ref({
    total_products: 0,
    total_stock_value: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    stock_turnover_rate: 0,
    average_stock_level: 0,
    top_products: [],
    category_breakdown: [],
    stock_movements: [],
    reorder_alerts: []
});

// Chart data
const stockMovementsChartData = ref(null);
const categoryBreakdownChartData = ref(null);
const stockLevelsChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;
    try {
        const { dashboardService } = await import('@/services/shared/dashboardService');

        const result = await executeDataFetch(
            () => dashboardService.getInventoryDashboardData(period.value),
            null,
            `Inventory data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
        );

        if (result && (result.data || result)) {
            dashboardData.value = result.data || result || {
                total_products: 0,
                total_stock_value: 0,
                low_stock_items: 0,
                out_of_stock_items: 0,
                stock_turnover_rate: 0,
                average_stock_level: 0,
                top_products: [],
                category_breakdown: [],
                stock_movements: [],
                reorder_alerts: []
            };
            processChartData();
        }
        } catch (error) {
            console.error('Error loading inventory dashboard:', error);
            showToast('error', 'Failed to load inventory data', 'Error');
        } finally {
            loading.value = false;
        }
    };

// Process chart data for visualization
const processChartData = () => {
    // Stock movements chart
    if (dashboardData.value.stock_movements?.length > 0) {
        stockMovementsChartData.value = {
            labels: dashboardData.value.stock_movements.map((item) => item.period),
            datasets: [
                {
                    label: 'Stock In',
                    data: dashboardData.value.stock_movements.map((item) => item.stock_in),
                    borderColor: '#42A5F5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Stock Out',
                    data: dashboardData.value.stock_movements.map((item) => item.stock_out),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
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
                    data: dashboardData.value.category_breakdown.map((item) => item.stock_value),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF']
                }
            ]
        };
    }

    // Stock levels chart
    if (dashboardData.value.top_products?.length > 0) {
        stockLevelsChartData.value = {
            labels: dashboardData.value.top_products.map((item) => item.name),
            datasets: [
                {
                    label: 'Current Stock',
                    data: dashboardData.value.top_products.map((item) => item.current_stock),
                    backgroundColor: '#66BB6A',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }
            ]
        };
    }
};

// Navigation functions
const navigateToProducts = () => {
    router.push('/inventory/products');
};

const navigateToStock = () => {
    router.push('/inventory/stock');
};

const navigateToCategories = () => {
    router.push('/inventory/categories');
};

const navigateToSuppliers = () => {
    router.push('/procurement/suppliers');
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
    <div class="inventory-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
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
                            <span>Total Products</span>
                            <i class="pi pi-box text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_products.toLocaleString() }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Stock Value</span>
                            <i class="pi pi-dollar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(dashboardData.total_stock_value) }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Low Stock Items</span>
                            <i class="pi pi-exclamation-triangle text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.low_stock_items }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Out of Stock</span>
                            <i class="pi pi-times-circle text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.out_of_stock_items }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Performance Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Stock Turnover Rate</span>
                            <i class="pi pi-refresh text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.stock_turnover_rate.toFixed(2) }}
                        </div>
                        <div class="text-sm opacity-75">times per year</div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Average Stock Level</span>
                            <i class="pi pi-chart-bar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.average_stock_level.toLocaleString() }}
                        </div>
                        <div class="text-sm opacity-75">units</div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Stock Movements -->
                <Card>
                    <template #title>Stock Movements</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="stockMovementsChartData" type="line" :data="stockMovementsChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No movement data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Category Breakdown -->
                <Card>
                    <template #title>Stock Value by Category</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="categoryBreakdownChartData" type="doughnut" :data="categoryBreakdownChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No category data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Stock Levels Chart -->
            <Card>
                <template #title>Top Products Stock Levels</template>
                <template #content>
                    <div class="h-80">
                        <Chart v-if="stockLevelsChartData" type="bar" :data="stockLevelsChartData" :options="barChartOptions" class="h-full" />
                        <div v-else class="flex items-center justify-center h-full text-gray-500">No product data available</div>
                    </div>
                </template>
            </Card>

            <!-- Reorder Alerts Table -->
            <Card>
                <template #title>Reorder Alerts</template>
                <template #content>
                    <DataTable :value="dashboardData.reorder_alerts" :rows="5" striped-rows class="p-datatable-sm">
                        <Column field="product_name" header="Product Name" sortable></Column>
                        <Column field="current_stock" header="Current Stock" sortable></Column>
                        <Column field="reorder_level" header="Reorder Level" sortable></Column>
                        <Column field="supplier" header="Supplier" sortable></Column>
                        <Column field="last_restock" header="Last Restock" sortable>
                            <template #body="slotProps">
                                {{ new Date(slotProps.data.last_restock).toLocaleDateString() }}
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body>
                                <Button icon="pi pi-shopping-cart" class="p-button-sm p-button-outlined" @click="navigateToSuppliers" title="Order from Supplier" />
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
                        <Button label="Manage Products" icon="pi pi-box" class="p-button-outlined" @click="navigateToProducts" />
                        <Button label="Stock Management" icon="pi pi-chart-bar" class="p-button-outlined" @click="navigateToStock" />
                        <Button label="Categories" icon="pi pi-tags" class="p-button-outlined" @click="navigateToCategories" />
                        <Button label="Suppliers" icon="pi pi-building" class="p-button-outlined" @click="navigateToSuppliers" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.inventory-dashboard {
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
