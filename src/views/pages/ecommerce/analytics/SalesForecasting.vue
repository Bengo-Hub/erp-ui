<script setup>
import { useToast } from '@/composables/useToast';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const router = useRouter();
const { formatCurrencySync } = useGlobalCurrency();

// Data states
const loading = ref(false);
const generating = ref(false);
const dateRange = ref(null);
const selectedBranch = ref(null);
const selectedProduct = ref(null);
const forecastPeriod = ref({ name: 'Next 30 Days', value: 30 });

// Filter options
const branchOptions = ref([
    { label: 'All Branches', value: null },
    { label: 'Nairobi Main', value: 'nairobi_main' },
    { label: 'Mombasa Branch', value: 'mombasa_branch' },
    { label: 'Kisumu Branch', value: 'kisumu_branch' }
]);

const productOptions = ref([
    { label: 'All Products', value: null },
    { label: 'Liquid Detergent', value: 'liquid_detergent' },
    { label: 'Bar Soap', value: 'bar_soap' },
    { label: 'Multipurpose Cleaner', value: 'multipurpose_cleaner' }
]);

const periodOptions = ref([
    { name: 'Next 7 Days', value: 7 },
    { name: 'Next 30 Days', value: 30 },
    { name: 'Next 90 Days', value: 90 },
    { name: 'Next 6 Months', value: 180 }
]);

// Forecasting data
const forecastStats = ref({
    predictedRevenue: 0,
    predictedOrders: 0,
    confidenceLevel: 0,
    growthRate: 0
});

const salesForecast = ref([]);
const productForecast = ref([]);
const seasonalTrends = ref([]);
const forecastAccuracy = ref([]);

// Chart data
const forecastChart = ref({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Historical Sales',
            data: [120000, 150000, 180000, 200000, 220000, 250000],
            borderColor: '#42A5F5',
            backgroundColor: 'rgba(66, 165, 245, 0.1)',
            tension: 0.4
        },
        {
            label: 'Forecasted Sales',
            data: [null, null, null, null, 240000, 270000],
            borderColor: '#66BB6A',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            borderDash: [5, 5],
            tension: 0.4
        }
    ]
});

const productForecastChart = ref({
    labels: ['Liquid Detergent', 'Bar Soap', 'Multipurpose Cleaner', 'Fabric Softener'],
    datasets: [
        {
            label: 'Predicted Sales',
            data: [45000, 35000, 28000, 22000],
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A']
        }
    ]
});

const seasonalChart = ref({
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
        {
            label: 'Seasonal Factor',
            data: [0.8, 1.1, 1.2, 0.9],
            borderColor: '#FFA726',
            backgroundColor: 'rgba(255, 167, 38, 0.1)',
            tension: 0.4
        }
    ]
});

// Methods
const loadSalesForecast = async () => {
    loading.value = true;
    try {
        // Simulate API call - replace with actual service call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data - replace with actual API response
        forecastStats.value = {
            predictedRevenue: 8500000,
            predictedOrders: 1250,
            confidenceLevel: 85.5,
            growthRate: 12.5
        };

        salesForecast.value = [
            {
                date: '2024-01-15',
                predictedSales: 280000,
                confidence: 0.85,
                actualSales: 275000
            },
            {
                date: '2024-01-16',
                predictedSales: 295000,
                confidence: 0.87,
                actualSales: 290000
            },
            {
                date: '2024-01-17',
                predictedSales: 310000,
                confidence: 0.82,
                actualSales: 305000
            },
            { date: '2024-01-18', predictedSales: 325000, confidence: 0.89, actualSales: null },
            { date: '2024-01-19', predictedSales: 340000, confidence: 0.91, actualSales: null }
        ];

        productForecast.value = [
            {
                product: 'Liquid Detergent',
                predictedSales: 45000,
                growth: 15.2,
                confidence: 0.88
            },
            { product: 'Bar Soap', predictedSales: 35000, growth: 8.5, confidence: 0.85 },
            {
                product: 'Multipurpose Cleaner',
                predictedSales: 28000,
                growth: 22.1,
                confidence: 0.92
            },
            {
                product: 'Fabric Softener',
                predictedSales: 22000,
                growth: 5.8,
                confidence: 0.78
            }
        ];

        seasonalTrends.value = [
            { quarter: 'Q1', factor: 0.8, description: 'Lower demand in early year' },
            { quarter: 'Q2', factor: 1.1, description: 'Spring cleaning season' },
            { quarter: 'Q3', factor: 1.2, description: 'Summer peak season' },
            { quarter: 'Q4', factor: 0.9, description: 'Holiday season adjustment' }
        ];

        forecastAccuracy.value = [
            { metric: 'Revenue Accuracy', accuracy: 94.2, trend: 'positive' },
            { metric: 'Order Volume Accuracy', accuracy: 91.8, trend: 'positive' },
            { metric: 'Product Mix Accuracy', accuracy: 88.5, trend: 'stable' },
            { metric: 'Seasonal Pattern Accuracy', accuracy: 96.1, trend: 'positive' }
        ];
    } catch (error) {
        console.error('Error loading sales forecast:', error);
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load sales forecast data',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const generateForecast = async () => {
    generating.value = true;
    try {
        // Simulate forecast generation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        showToast({
            severity: 'success',
            summary: 'Success',
            detail: 'Sales forecast generated successfully',
            life: 3000
        });

        await loadSalesForecast();
    } catch (error) {
        console.error('Error generating forecast:', error);
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate sales forecast',
            life: 3000
        });
    } finally {
        generating.value = false;
    }
};

const exportForecast = () => {
    showToast({
        severity: 'info',
        summary: 'Export',
        detail: 'Sales forecast exported successfully',
        life: 3000
    });
};

const viewProductDetails = (productName) => {
    router.push({ name: 'product-details', params: { name: productName } });
};

const onDateRangeChange = () => {
    loadSalesForecast();
};

const onBranchChange = () => {
    loadSalesForecast();
};

const onProductChange = () => {
    loadSalesForecast();
};

const onPeriodChange = () => {
    loadSalesForecast();
};

// Computed properties
const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function (value) {
                    return formatCurrencySync(value);
                }
            }
        }
    }
}));

const barChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
}));

const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.8) return 'info';
    if (confidence >= 0.7) return 'warning';
    return 'danger';
};

const getGrowthColor = (growth) => {
    if (growth > 0) return 'success';
    if (growth < 0) return 'danger';
    return 'info';
};

onMounted(() => {
    loadSalesForecast();
});
</script>

<template>
    <div class="sales-forecasting">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="pi pi-chart-line text-primary mr-2"></i>
                    Sales Forecasting
                </h1>
                <div class="header-actions">
                    <Button label="Generate Forecast" icon="pi pi-refresh" @click="generateForecast" :loading="generating" />
                    <Button label="Export Report" icon="pi pi-download" @click="exportForecast" />
                </div>
            </div>

            <!-- Filters -->
            <div class="filter-toolbar">
                <div class="filter-group">
                    <label class="filter-label">Date Range</label>
                    <Calendar v-model="dateRange" selectionMode="range" placeholder="Select Date Range" @date-select="onDateRangeChange" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">Branch</label>
                    <Dropdown v-model="selectedBranch" :options="branchOptions" optionLabel="label" optionValue="value" placeholder="Select Branch" @change="onBranchChange" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">Product</label>
                    <Dropdown v-model="selectedProduct" :options="productOptions" optionLabel="label" optionValue="value" placeholder="Select Product" @change="onProductChange" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">Forecast Period</label>
                    <Dropdown v-model="forecastPeriod" :options="periodOptions" optionLabel="name" optionValue="value" placeholder="Select Period" @change="onPeriodChange" />
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-blue-100 text-blue-600">
                            <i class="pi pi-dollar text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">
                                {{ formatCurrencySync(forecastStats.predictedRevenue) }}
                            </h3>
                            <p class="stat-label">Predicted Revenue</p>
                            <span class="stat-change positive">+{{ forecastStats.growthRate }}% growth</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-green-100 text-green-600">
                            <i class="pi pi-shopping-cart text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">
                                {{ forecastStats.predictedOrders.toLocaleString() }}
                            </h3>
                            <p class="stat-label">Predicted Orders</p>
                            <span class="stat-change positive">Next {{ forecastPeriod.value }} days</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-orange-100 text-orange-600">
                            <i class="pi pi-check-circle text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">{{ forecastStats.confidenceLevel }}%</h3>
                            <p class="stat-label">Confidence Level</p>
                            <span class="stat-change positive">High accuracy</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-purple-100 text-purple-600">
                            <i class="pi pi-trending-up text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">{{ forecastStats.growthRate }}%</h3>
                            <p class="stat-label">Growth Rate</p>
                            <span class="stat-change positive">vs previous period</span>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
            <!-- Sales Forecast Chart -->
            <Card class="chart-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-chart-line text-primary mr-2"></i>
                        Sales Forecast Trend
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <Chart type="line" :data="forecastChart" :options="chartOptions" />
                    </div>
                </template>
            </Card>

            <!-- Product Forecast Chart -->
            <Card class="chart-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-pie-chart text-primary mr-2"></i>
                        Product Sales Forecast
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <Chart type="bar" :data="productForecastChart" :options="barChartOptions" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Data Tables -->
        <div class="tables-grid">
            <!-- Sales Forecast Table -->
            <Card class="table-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-calendar text-primary mr-2"></i>
                        Daily Sales Forecast
                    </div>
                </template>
                <template #content>
                    <DataTable :value="salesForecast" :loading="loading" stripedRows class="p-datatable-sm">
                        <Column field="date" header="Date">
                            <template #body="{ data }">
                                {{ new Date(data.date).toLocaleDateString() }}
                            </template>
                        </Column>
                        <Column field="predictedSales" header="Predicted Sales">
                            <template #body="{ data }">
                                {{ formatCurrencySync(data.predictedSales) }}
                            </template>
                        </Column>
                        <Column field="confidence" header="Confidence">
                            <template #body="{ data }">
                                <Tag :value="(data.confidence * 100).toFixed(1) + '%'" :severity="getConfidenceColor(data.confidence)" />
                            </template>
                        </Column>
                        <Column field="actualSales" header="Actual Sales">
                            <template #body="{ data }">
                                <span v-if="data.actualSales">{{ formatCurrencySync(data.actualSales) }}</span>
                                <span v-else class="text-gray-400">-</span>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Product Forecast Table -->
            <Card class="table-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-box text-primary mr-2"></i>
                        Product Forecast Analysis
                    </div>
                </template>
                <template #content>
                    <DataTable :value="productForecast" :loading="loading" stripedRows class="p-datatable-sm">
                        <Column field="product" header="Product" />
                        <Column field="predictedSales" header="Predicted Sales">
                            <template #body="{ data }">
                                {{ formatCurrencySync(data.predictedSales) }}
                            </template>
                        </Column>
                        <Column field="growth" header="Growth">
                            <template #body="{ data }">
                                <Tag :value="data.growth.toFixed(1) + '%'" :severity="getGrowthColor(data.growth)" />
                            </template>
                        </Column>
                        <Column field="confidence" header="Confidence">
                            <template #body="{ data }">
                                <Tag :value="(data.confidence * 100).toFixed(1) + '%'" :severity="getConfidenceColor(data.confidence)" />
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewProductDetails(data.product)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <!-- Forecast Accuracy Section -->
        <Card class="accuracy-card">
            <template #title>
                <div class="card-title">
                    <i class="pi pi-check-circle text-primary mr-2"></i>
                    Forecast Accuracy Metrics
                </div>
            </template>
            <template #content>
                <div class="accuracy-grid">
                    <div v-for="metric in forecastAccuracy" :key="metric.metric" class="accuracy-item">
                        <div class="accuracy-header">
                            <span class="accuracy-label">{{ metric.metric }}</span>
                            <Tag :value="metric.accuracy.toFixed(1) + '%'" :severity="metric.trend === 'positive' ? 'success' : metric.trend === 'negative' ? 'danger' : 'info'" />
                        </div>
                        <div class="accuracy-bar">
                            <div class="accuracy-fill" :style="{ width: metric.accuracy + '%' }"></div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.sales-forecasting {
    padding: 1rem;
}

.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.filter-toolbar {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-label {
    font-weight: 500;
    color: var(--text-color);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-details {
    flex: 1;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.25rem 0;
}

.stat-label {
    color: var(--text-color-secondary);
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
}

.stat-change {
    font-size: 0.75rem;
    font-weight: 500;
}

.stat-change.positive {
    color: #10b981;
}

.stat-change.negative {
    color: #ef4444;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.chart-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
    display: flex;
    align-items: center;
    font-weight: 600;
}

.chart-container {
    height: 300px;
    position: relative;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.table-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.accuracy-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.accuracy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.accuracy-item {
    padding: 1rem;
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
}

.accuracy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.accuracy-label {
    font-weight: 500;
    color: var(--text-color);
}

.accuracy-bar {
    height: 0.5rem;
    background: var(--surface-200);
    border-radius: 0.25rem;
    overflow: hidden;
}

.accuracy-fill {
    height: 100%;
    background: var(--primary-color);
    border-radius: 0.25rem;
    transition: width 0.3s ease;
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .filter-toolbar {
        flex-direction: column;
    }

    .charts-grid {
        grid-template-columns: 1fr;
    }

    .tables-grid {
        grid-template-columns: 1fr;
    }

    .accuracy-grid {
        grid-template-columns: 1fr;
    }
}
</style>
