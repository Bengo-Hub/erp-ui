<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';
import BreadcrumbNav from '@/components/manufacturing/BreadcrumbNav.vue';
import ManufacturingToolbar from '@/components/manufacturing/ManufacturingToolbar.vue';
import InsightsPanel from '@/components/manufacturing/InsightsPanel.vue';
import StatCard from '@/components/manufacturing/StatsCard.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();

const loading = ref(false);
const dateRange = ref(null);
const selectedProduct = ref(null);
const topMaterials = ref([]);
const productProfitability = ref([]);

const productOptions = ref([
    { name: 'All Products', value: null },
    { name: 'Liquid Detergent', value: 1 },
    { name: 'Bar Soap', value: 2 },
    { name: 'Multipurpose Cleaner', value: 3 }
]);

const summaryStats = ref({
    totalProduction: 0,
    totalRawMaterialCost: 0,
    totalLaborCost: 0,
    totalOverheadCost: 0,
    avgUnitCost: 0,
    efficiencyRate: 0,
    rawMaterialCostPercent: 0
});

const costChartData = ref({ labels: [], datasets: [] });
const costDistributionData = ref({ labels: [], datasets: [] });
const trendChartData = ref({ labels: [], datasets: [] });

const costChartOptions = ref({
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;
                    return `${label}: ${formatCurrency(value)}`;
                }
            }
        }
    },
    scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { beginAtZero: true, title: { display: true, text: 'Cost (KES)' } }
    }
});

const pieChartOptions = ref({
    plugins: { legend: { position: 'bottom' } },
    maintainAspectRatio: false
});

const trendChartOptions = ref({
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { beginAtZero: true, title: { display: true, text: 'Units Produced' } }
    }
});

const fetchAnalyticsData = async () => {
    loading.value = true;
    try {
        const params = {
            date_from: dateRange.value?.[0]?.toISOString(),
            date_to: dateRange.value?.[1]?.toISOString(),
            product_id: selectedProduct.value?.value
        };

        const { data } = await manufacturingService.getAnalytics(params);

        // Process summary stats
        const stats = data.results.reduce(
            (acc, curr) => ({
                totalProduction: acc.totalProduction + parseFloat(curr.total_production_quantity),
                totalRawMaterialCost: acc.totalRawMaterialCost + parseFloat(curr.total_raw_material_cost),
                totalLaborCost: acc.totalLaborCost + parseFloat(curr.total_labor_cost),
                totalOverheadCost: acc.totalOverheadCost + parseFloat(curr.total_overhead_cost),
                totalBatches: acc.totalBatches + parseInt(curr.total_batches),
                completedBatches: acc.completedBatches + parseInt(curr.completed_batches)
            }),
            {
                totalProduction: 0,
                totalRawMaterialCost: 0,
                totalLaborCost: 0,
                totalOverheadCost: 0,
                totalBatches: 0,
                completedBatches: 0
            }
        );

        const totalCost = stats.totalRawMaterialCost + stats.totalLaborCost + stats.totalOverheadCost;

        summaryStats.value = {
            ...stats,
            avgUnitCost: stats.totalProduction ? totalCost / stats.totalProduction : 0,
            efficiencyRate: stats.totalBatches ? stats.completedBatches / stats.totalBatches : 0,
            rawMaterialCostPercent: totalCost ? (stats.totalRawMaterialCost / totalCost) * 100 : 0
        };

        // Generate chart data
        generateCostChartData(data.results);
        generateCostDistribution(stats);
        await fetchProductionTrends();
        await fetchTopMaterials();
    } catch (error) {
        console.error('Error fetching analytics:', error);
        showToast('error', 'Failed to load analytics data');
    } finally {
        loading.value = false;
    }
};

const generateCostChartData = (results) => {
    costChartData.value = {
        labels: results.map((r) => r.date),
        datasets: [
            {
                type: 'bar',
                label: 'Raw Materials',
                backgroundColor: '#42A5F5',
                data: results.map((r) => parseFloat(r.total_raw_material_cost))
            },
            {
                type: 'bar',
                label: 'Labor',
                backgroundColor: '#66BB6A',
                data: results.map((r) => parseFloat(r.total_labor_cost))
            },
            {
                type: 'bar',
                label: 'Overhead',
                backgroundColor: '#FFA726',
                data: results.map((r) => parseFloat(r.total_overhead_cost))
            },
            {
                type: 'line',
                label: 'Unit Cost',
                borderColor: '#EC407A',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                data: results.map((r) => parseFloat(r.average_cost_per_unit))
            }
        ]
    };
};

const generateCostDistribution = (stats) => {
    const total = stats.totalRawMaterialCost + stats.totalLaborCost + stats.totalOverheadCost;
    costDistributionData.value = {
        labels: ['Raw Materials', 'Labor', 'Overhead'],
        datasets: [
            {
                data: [(stats.totalRawMaterialCost / total) * 100 || 0, (stats.totalLaborCost / total) * 100 || 0, (stats.totalOverheadCost / total) * 100 || 0],
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726']
            }
        ]
    };
};

const fetchTopMaterials = async () => {
    try {
        const { data } = await manufacturingService.getMaterialUsageAnalysis();
        topMaterials.value =
            data.material_summary?.map((m) => ({
                material: m.raw_material,
                usage: m.total_usage,
                unit: 'units',
                cost: m.total_cost,
                efficiency: m.avg_efficiency
            })) || [];
    } catch (error) {
        console.error('Error fetching materials:', error);
    }
};

const fetchProductionTrends = async () => {
    try {
        const { data } = await manufacturingService.getProductionTrends();
        const dates = [...new Set(data.map((item) => item.date))].sort();
        const products = [...new Set(data.map((item) => item.product))];
        const colors = ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A'];

        trendChartData.value = {
            labels: dates,
            datasets: products.map((product, i) => ({
                label: product,
                data: dates.map((date) => data.find((d) => d.date === date && d.product === product)?.quantity || 0),
                borderColor: colors[i % colors.length],
                tension: 0.4
            }))
        };
    } catch (error) {
        console.error('Error fetching trends:', error);
    }
};

const onProductChange = () => {
    fetchAnalyticsData();
};

const exportData = () => {
    // Implement export logic
    alert('Data export would be implemented here. This would generate a CSV or Excel file with detailed analytics data.');
};

// Helper functions

const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat().format(num);
};

const getEfficiencyClass = (efficiency) => {
    if (efficiency >= 0.95) return 'bg-green-500';
    if (efficiency >= 0.9) return 'bg-blue-500';
    if (efficiency >= 0.8) return 'bg-orange-500';
    return 'bg-red-500';
};

const getMarginSeverity = (margin) => {
    if (margin >= 0.5) return 'success';
    if (margin >= 0.4) return 'info';
    if (margin >= 0.3) return 'warning';
    return 'danger';
};

const getInsightIcon = (type) => {
    switch (type) {
        case 'optimization':
            return 'pi pi-cog text-blue-500';
        case 'trend':
            return 'pi pi-chart-line text-green-500';
        case 'quality':
            return 'pi pi-check-circle text-purple-500';
        case 'inventory':
            return 'pi pi-inbox text-orange-500';
        default:
            return 'pi pi-info-circle text-primary';
    }
};

onMounted(() => {
    fetchAnalyticsData();
});
</script>

<template>
    <div class="flex flex-col p-4 space-y-4">
        <!-- Breadcrumbs -->
        <BreadcrumbNav :items="[{ label: 'Manufacturing', to: '/manufacturing' }, { label: 'Analytics' }]" class="mb-2" />

        <!-- Toolbar with Filters -->
        <ManufacturingToolbar title="Manufacturing Analytics" icon="pi pi-chart-bar">
            <template #actions>
                <div class="flex flex-wrap gap-3 items-center">
                    <Calendar v-model="dateRange" selectionMode="range" placeholder="Select Date Range" class="w-48" @date-select="onDateSelect" />
                    <Dropdown v-model="selectedProduct" :options="productOptions" optionLabel="name" placeholder="Filter by Product" class="w-48" @change="onProductChange" />
                    <Button label="Export" icon="pi pi-download" class="p-button-rounded p-button-outlined" @click="exportData" />
                </div>
            </template>
        </ManufacturingToolbar>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <StatCard title="Total Production" :value="formatNumber(summaryStats.totalProduction)" unit="units produced" icon="pi pi-box" bgColor="bg-blue-100" textColor="text-blue-500" />
            <StatCard
                title="Raw Material Cost"
                :value="formatCurrency(summaryStats.totalRawMaterialCost)"
                :subtitle="`${summaryStats.rawMaterialCostPercent.toFixed(1)}% of total cost`"
                icon="pi pi-dollar"
                bgColor="bg-green-100"
                textColor="text-green-500"
            />
            <StatCard title="Average Unit Cost" :value="formatCurrency(summaryStats.avgUnitCost)" unit="per unit produced" icon="pi pi-tag" bgColor="bg-orange-100" textColor="text-orange-500" />
            <StatCard title="Efficiency Rate" :value="(summaryStats.efficiencyRate * 100).toFixed(1) + '%'" unit="actual vs planned" icon="pi pi-chart-line" bgColor="bg-purple-100" textColor="text-purple-500" />
            <StatCard title="Labor Cost" :value="formatCurrency(summaryStats.totalLaborCost)" unit="total labor cost" icon="pi pi-users" bgColor="bg-blue-100" textColor="text-blue-500" />
            <StatCard title="Overhead Cost" :value="formatCurrency(summaryStats.totalOverheadCost)" unit="total overhead cost" icon="pi pi-building" bgColor="bg-yellow-100" textColor="text-yellow-500" />
        </div>

        <!-- Charts and Tables Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Production Cost Analysis -->
            <Card class="shadow-lg">
                <h5 class="mb-2">Production Cost Analysis</h5>
                <Chart type="bar" :data="costChartData" :options="costChartOptions" class="h-20rem" />
            </Card>

            <!-- Cost Distribution -->
            <Card class="shadow-lg flex flex-col items-center p-4">
                <h5 class="mb-2">Cost Distribution</h5>
                <Chart type="doughnut" :data="costDistributionData" :options="pieChartOptions" class="w-64 h-64" />
            </Card>

            <!-- Production Trends (full width) -->
            <Card class="col-span-1 lg:col-span-2 shadow-lg">
                <h5 class="mb-2">Production Trends</h5>
                <Chart type="line" :data="trendChartData" :options="trendChartOptions" class="h-64" />
            </Card>

            <!-- Data Tables -->
            <Card class="shadow-lg">
                <h5 class="mb-2">Top Raw Materials by Usage</h5>
                <DataTable :value="topMaterials" class="p-datatable-sm" responsiveLayout="scroll">
                    <Column field="material" header="Material" />
                    <Column field="usage" header="Quantity Used">
                        <template #body="{ data }"> {{ formatNumber(data.usage) }} {{ data.unit }} </template>
                    </Column>
                    <Column field="cost" header="Total Cost">
                        <template #body="{ data }">
                            {{ formatCurrency(data.cost) }}
                        </template>
                    </Column>
                    <Column field="efficiency" header="Usage Efficiency">
                        <template #body="{ data }">
                            <ProgressBar :value="data.efficiency * 100" :class="getEfficiencyClass(data.efficiency)" />
                        </template>
                    </Column>
                </DataTable>
            </Card>

            <Card class="shadow-lg">
                <h5 class="mb-2">Product Profitability</h5>
                <DataTable :value="productProfitability" class="p-datatable-sm" responsiveLayout="scroll">
                    <Column field="product" header="Product" />
                    <Column field="quantity" header="Quantity">
                        <template #body="{ data }">{{ formatNumber(data.quantity) }}</template>
                    </Column>
                    <Column field="avgCost" header="Avg Cost">
                        <template #body="{ data }">{{ formatCurrency(data.avgCost) }}</template>
                    </Column>
                    <Column field="avgPrice" header="Avg Price">
                        <template #body="{ data }">{{ formatCurrency(data.avgPrice) }}</template>
                    </Column>
                    <Column field="margin" header="Margin">
                        <template #body="{ data }">
                            <Tag :value="(data.margin * 100).toFixed(1) + '%'" :severity="getMarginSeverity(data.margin)" />
                        </template>
                    </Column>
                </DataTable>
            </Card>
        </div>

        <!-- AI-Powered Insights -->
        <InsightsPanel />
    </div>
</template>

<style scoped>
.customized-timeline .p-timeline-event-marker {
    width: 1.5rem;
    height: 1.5rem;
    line-height: 1.5rem;
    background-color: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.customized-timeline .p-timeline-event-content {
    line-height: 1.5;
}

.customized-timeline .p-timeline-event-opposite {
    flex: 0;
}
</style>
