<script setup>
import { useToast } from '@/composables/useToast';
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { formatCurrency } from '@/utils/formatters';
import { manufacturingService } from '@/services/manufacturingService';

const { showToast } = useToast();
const router = useRouter();

// Breadcrumb
const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
// Data states
const loading = ref(true);
const generating = ref(false);
const forecastedMaterials = ref([]);
const tableFilter = ref('');
const filterMenu = ref();

// Period selection
const selectedPeriod = ref({ name: 'Next 30 Days', value: '30days', days: 30 });
const periodOptions = [
    { name: 'Next 7 Days', value: '7days', days: 7 },
    { name: 'Next 30 Days', value: '30days', days: 30 },
    { name: 'Next 90 Days', value: '90days', days: 90 }
];

// Table filters
const filters = reactive({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    current_inventory: { value: null, matchMode: FilterMatchMode.LESS_THAN }
});

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Sufficient', value: 'Sufficient' },
    { label: 'Low Stock', value: 'Low Stock' },
    { label: 'Critical', value: 'Critical' }
];

const filterItems = ref([{ label: 'Clear Filters', icon: 'pi pi-filter-slash', command: clearFilters }]);

// Chart data
const forecastChart = reactive({
    data: { labels: [], datasets: [] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.raw} ${context.dataset.unit || 'units'}`
                }
            }
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Quantity' } },
            x: { title: { display: true, text: 'Date' } }
        }
    }
});

// History dialog
const historyDialog = reactive({
    visible: false,
    loading: false,
    title: '',
    materialId: null,
    currentStock: 0,
    reorderLevel: 0,
    avgUsage: 0,
    daysInventory: 0,
    unit: '',
    chartData: { labels: [], datasets: [] },
    forecastData: [],
    chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Quantity' } } }
    }
});

// Computed properties
const filteredMaterials = computed(() => {
    return forecastedMaterials.value.filter((material) => {
        const matchesSearch = !tableFilter.value || material.material.toLowerCase().includes(tableFilter.value.toLowerCase());
        const matchesStatus = !filters.status.value || material.status === filters.status.value;
        const matchesStock = !filters.current_inventory.value || material.current_inventory < filters.current_inventory.value;

        return matchesSearch && matchesStatus && matchesStock;
    });
});

const reorderNeededCount = computed(() => {
    return forecastedMaterials.value.filter((m) => m.reorder_needed).length;
});

const criticalCount = computed(() => {
    return forecastedMaterials.value.filter((m) => m.status === 'Critical').length;
});

const totalEstimatedCost = computed(() => {
    return forecastedMaterials.value.reduce((sum, mat) => {
        // Simple estimation - could be enhanced with actual material costs
        return sum + (mat.predicted_shortage || 0) * 10; // Assuming $10 per unit for demo
    }, 0);
});

// Methods
async function loadForecastData() {
    try {
        loading.value = true;
        const response = await manufacturingService.getMaterialForecast(selectedPeriod.value.value);
        forecastedMaterials.value = response.data;
        updateForecastChart();
    } catch (error) {
        console.error('Error loading forecast data:', error);
        showToast('error', 'Error', 'Failed to load forecast data');
    } finally {
        loading.value = false;
    }
}

async function generateForecast() {
    try {
        generating.value = true;
        const response = await manufacturingService.generateMaterialForecast(selectedPeriod.value.value);
        forecastedMaterials.value = response.data;
        updateForecastChart();
        showToast('success', 'Success', 'Forecast generated successfully');
    } catch (error) {
        console.error('Error generating forecast:', error);
        showToast('error', 'Error', 'Failed to generate forecast');
    } finally {
        generating.value = false;
        clearFilters();
    }
}

async function viewHistory(material) {
    try {
        historyDialog.loading = true;
        historyDialog.visible = true;
        historyDialog.title = `Usage History: ${material.material}`;
        historyDialog.materialId = material.material_id;
        historyDialog.currentStock = material.current_inventory;
        historyDialog.reorderLevel = material.reorder_level || 0;
        historyDialog.avgUsage = material.average_daily_usage;
        historyDialog.unit = material.unit;
        historyDialog.daysInventory = material.days_until_shortage;

        // Load usage history
        const usageResponse = await manufacturingService.getMaterialUsageHistory(material.material_id);
        historyDialog.chartData = formatUsageHistoryChart(usageResponse.data);

        // Set forecast data
        historyDialog.forecastData = material.forecast || [];
    } catch (error) {
        console.error('Error loading usage history:', error);
        showToast('error', 'Error', 'Failed to load usage history');
    } finally {
        historyDialog.loading = false;
    }
}

function createPurchase(material) {
    router.push({
        path: '/procurement/purchases/create',
        query: {
            material_id: material.material_id,
            quantity: material.predicted_shortage,
            unit: material.unit
        }
    });
}

function exportToExcel() {
    showToast('info', 'Export Started', 'Preparing Excel export...');
    // Actual export logic would go here
}

function toggleFilterMenu(event) {
    filterMenu.value.toggle(event);
}

function clearFilters() {
    tableFilter.value = '';
    filters.status.value = null;
    filters.current_inventory.value = null;
}

function updateForecastChart() {
    if (!forecastedMaterials.value.length) return;

    // Get top 3 materials by predicted shortage
    const topMaterials = [...forecastedMaterials.value].sort((a, b) => b.predicted_shortage - a.predicted_shortage).slice(0, 3);

    if (!topMaterials.length) return;

    // Create chart data
    const chartData = {
        labels: topMaterials[0].forecast.map((item) => formatDate(item.date, 'short')),
        datasets: topMaterials.map((material, index) => ({
            label: material.material,
            data: material.forecast.map((item) => item.predicted_usage),
            borderColor: ['#3B82F6', '#10B981', '#F59E0B'][index],
            backgroundColor: ['#3B82F620', '#10B98120', '#F59E0B20'][index],
            tension: 0.4,
            unit: material.unit,
            fill: true
        }))
    };

    forecastChart.data = chartData;
}

function formatUsageHistoryChart(usageData) {
    // Group by month for the chart
    const monthlyUsage = {};

    usageData.forEach((item) => {
        const date = new Date(item.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!monthlyUsage[monthYear]) {
            monthlyUsage[monthYear] = {
                date: `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`,
                quantity: 0
            };
        }

        monthlyUsage[monthYear].quantity += item.quantity;
    });

    const sortedMonths = Object.values(monthlyUsage).sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    return {
        labels: sortedMonths.map((item) => item.date),
        datasets: [
            {
                label: 'Monthly Usage',
                data: sortedMonths.map((item) => item.quantity),
                backgroundColor: '#3B82F6'
            }
        ]
    };
}

function getStatusSeverity(status) {
    switch (status) {
        case 'Sufficient':
            return 'success';
        case 'Low Stock':
            return 'warning';
        case 'Critical':
            return 'danger';
        default:
            return 'info';
    }
}

function getDaysSeverity(days) {
    if (days <= 7) return 'danger';
    if (days <= 30) return 'warning';
    return 'success';
}

function getDaysSeverityClass(days) {
    if (days <= 7) return 'text-red-500';
    if (days <= 30) return 'text-yellow-500';
    return 'text-green-500';
}

function formatNumber(value) {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat().format(value);
}

function formatDate(dateString, format = 'medium') {
    if (!dateString) return '';
    const date = new Date(dateString);

    if (format === 'short') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getEndDate() {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedPeriod.value.days);
    return endDate;
}

onMounted(() => {
    loadForecastData();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header with Breadcrumb -->
        <div class="bg-white shadow-sm">
            <div class="container mx-auto px-4 py-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <i class="pi pi-chart-bar text-primary"></i>
                            Raw Material Forecasting
                        </h1>
                        <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="border-none p-0" />
                    </div>

                    <div class="flex flex-col sm:flex-row gap-2">
                        <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="name" placeholder="Select Period" class="w-full sm:w-48" />
                        <Button label="Generate Forecast" icon="pi pi-refresh" class="p-button-primary w-full sm:w-auto" @click="generateForecast" :loading="generating" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-6">
            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center h-64">
                <ProgressSpinner />
            </div>

            <!-- Content -->
            <div v-else class="grid grid-cols-1 gap-6">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card class="shadow-sm border-0">
                        <template #content>
                            <div class="flex items-center gap-4">
                                <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                    <i class="pi pi-box text-xl"></i>
                                </div>
                                <div>
                                    <span class="block text-gray-500">Forecasted Materials</span>
                                    <span class="block text-2xl font-semibold">{{ forecastedMaterials.length }}</span>
                                    <span class="text-sm text-gray-500"> Next {{ selectedPeriod.days }} days </span>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card class="shadow-sm border-0">
                        <template #content>
                            <div class="flex items-center gap-4">
                                <div class="p-3 rounded-full bg-orange-100 text-orange-600">
                                    <i class="pi pi-money-bill text-xl"></i>
                                </div>
                                <div>
                                    <span class="block text-gray-500">Estimated Cost</span>
                                    <span class="block text-2xl font-semibold">{{ formatCurrency(totalEstimatedCost) }}</span>
                                    <span class="text-sm text-gray-500"> Potential purchases </span>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card class="shadow-sm border-0">
                        <template #content>
                            <div class="flex items-center gap-4">
                                <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                    <i class="pi pi-exclamation-triangle text-xl"></i>
                                </div>
                                <div>
                                    <span class="block text-gray-500">Reorder Needed</span>
                                    <span class="block text-2xl font-semibold">{{ reorderNeededCount }}</span>
                                    <span class="text-sm text-gray-500">
                                        <span class="text-red-500 font-medium">{{ criticalCount }}</span> urgent
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card class="shadow-sm border-0">
                        <template #content>
                            <div class="flex items-center gap-4">
                                <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                    <i class="pi pi-chart-line text-xl"></i>
                                </div>
                                <div>
                                    <span class="block text-gray-500">Forecast Period</span>
                                    <span class="block text-2xl font-semibold">{{ selectedPeriod.name }}</span>
                                    <span class="text-sm text-gray-500"> {{ formatDate(new Date()) }} - {{ formatDate(getEndDate()) }} </span>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Chart Section -->
                <Card class="shadow-sm border-0">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-chart-line text-primary"></i>
                            <span>Material Usage Forecast</span>
                        </div>
                    </template>
                    <template #subtitle> Projected material requirements for the selected period </template>
                    <template #content>
                        <div class="h-80">
                            <Chart type="line" :data="forecastChart.data" :options="forecastChart.options" />
                        </div>
                    </template>
                </Card>

                <!-- Materials Table -->
                <Card class="shadow-sm border-0">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-list text-primary"></i>
                            <span>Material Requirements</span>
                        </div>
                    </template>
                    <template #subtitle> Detailed breakdown of forecasted material needs </template>
                    <template #content>
                        <div class="mb-4 flex flex-col sm:flex-row justify-between gap-4">
                            <span class="p-input-icon-left w-full sm:w-64">
                                <i class="pi pi-search" />
                                <InputText v-model="tableFilter" placeholder="Search materials..." class="w-full" />
                            </span>
                            <div class="flex gap-2">
                                <Button icon="pi pi-file-excel" label="Export" class="p-button-outlined" @click="exportToExcel" />
                                <Button icon="pi pi-filter" label="Filter" class="p-button-outlined" @click="toggleFilterMenu" />
                                <Menu ref="filterMenu" :model="filterItems" :popup="true" />
                            </div>
                        </div>

                        <DataTable
                            :value="filteredMaterials"
                            :paginator="true"
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 25, 50]"
                            :globalFilter="tableFilter"
                            v-model:filters="filters"
                            filterDisplay="menu"
                            :loading="loading"
                            stripedRows
                            responsiveLayout="scroll"
                            class="p-datatable-sm"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        >
                            <Column field="material" header="Material" sortable>
                                <template #body="{ data }">
                                    <div class="font-medium">{{ data.material }}</div>
                                    <div class="text-xs text-gray-500">ID: {{ data.material_id }}</div>
                                </template>
                            </Column>

                            <Column field="current_inventory" header="Current Stock" sortable>
                                <template #body="{ data }">
                                    <div class="flex items-center gap-2">
                                        <span>{{ formatNumber(data.current_inventory) }}</span>
                                        <span class="text-gray-500 text-sm">{{ data.unit }}</span>
                                        <span v-if="data.reorder_level" class="text-xs text-gray-400"> (Reorder: {{ formatNumber(data.reorder_level) }}) </span>
                                    </div>
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputNumber v-model="filterModel.value" @input="filterCallback()" placeholder="Search" class="p-column-filter" />
                                </template>
                            </Column>

                            <Column field="total_predicted_usage" header="Forecasted Need" sortable>
                                <template #body="{ data }">
                                    <div class="flex items-center gap-2">
                                        <span>{{ formatNumber(data.total_predicted_usage) }}</span>
                                        <span class="text-gray-500 text-sm">{{ data.unit }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="predicted_shortage" header="Recommended Order" sortable>
                                <template #body="{ data }">
                                    <div class="flex items-center gap-2">
                                        <span :class="{ 'font-bold': data.predicted_shortage > 0 }">
                                            {{ formatNumber(data.predicted_shortage) }}
                                        </span>
                                        <span class="text-gray-500 text-sm">{{ data.unit }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Days Until Shortage" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.days_until_shortage" :severity="getDaysSeverity(data.days_until_shortage)" />
                                </template>
                            </Column>

                            <Column field="status" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <Dropdown v-model="filterModel.value" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" @change="filterCallback()" class="p-column-filter" />
                                </template>
                            </Column>

                            <Column header="Actions" style="width: 120px">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-history" class="p-button-rounded p-button-text p-button-sm" @click="viewHistory(data)" v-tooltip.top="'View usage history'" />
                                        <Button icon="pi pi-shopping-cart" class="p-button-rounded p-button-text p-button-sm p-button-success" @click="createPurchase(data)" v-tooltip.top="'Create purchase order'" :disabled="!data.reorder_needed" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- History Dialog -->
        <Dialog v-model:visible="historyDialog.visible" :header="historyDialog.title" :style="{ width: '70vw' }" :breakpoints="{ '960px': '95vw', '640px': '95vw' }">
            <div v-if="historyDialog.loading" class="flex justify-center items-center h-64">
                <ProgressSpinner />
            </div>
            <div v-else>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                        <h5 class="font-medium mb-2">Usage Trend</h5>
                        <div class="h-64">
                            <Chart type="bar" :data="historyDialog.chartData" :options="historyDialog.chartOptions" />
                        </div>
                    </div>

                    <div>
                        <h5 class="font-medium mb-2">Current Stock</h5>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-600">Available Quantity</span>
                                <span class="font-semibold"> {{ formatNumber(historyDialog.currentStock) }} {{ historyDialog.unit }} </span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-600">Reorder Level</span>
                                <span class="font-semibold"> {{ formatNumber(historyDialog.reorderLevel) }} {{ historyDialog.unit }} </span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-600">Average Daily Usage</span>
                                <span class="font-semibold"> {{ formatNumber(historyDialog.avgUsage) }} {{ historyDialog.unit }} </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Days of Inventory</span>
                                <span class="font-semibold" :class="getDaysSeverityClass(historyDialog.daysInventory)"> {{ historyDialog.daysInventory }} days </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 class="font-medium mb-2">Forecast Details</h5>
                        <DataTable :value="historyDialog.forecastData" :rows="5" scrollable scrollHeight="200px" class="p-datatable-sm">
                            <Column field="date" header="Date" sortable>
                                <template #body="{ data }">
                                    {{ formatDate(data.date) }}
                                </template>
                            </Column>
                            <Column field="predicted_usage" header="Predicted" sortable>
                                <template #body="{ data }"> {{ formatNumber(data.predicted_usage) }} {{ historyDialog.unit }} </template>
                            </Column>
                            <Column header="Range">
                                <template #body="{ data }"> {{ formatNumber(data.lower_bound) }} - {{ formatNumber(data.upper_bound) }} </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Close" icon="pi pi-times" @click="historyDialog.visible = false" class="p-button-text" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Custom styles */
:deep(.p-card) {
    border-radius: 0.75rem;
}

:deep(.p-card-title) {
    font-size: 1.1rem;
}

:deep(.p-datatable) {
    font-size: 0.9rem;
}

:deep(.p-datatable .p-column-header-content) {
    justify-content: center;
}

:deep(.p-datatable-tbody td) {
    padding: 0.75rem 1rem;
}

@media (max-width: 640px) {
    :deep(.p-datatable-tbody td) {
        padding: 0.5rem;
    }
}
</style>
