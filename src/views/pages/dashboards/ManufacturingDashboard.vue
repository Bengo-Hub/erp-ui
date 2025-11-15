<script setup>
import { useChartOptions } from '@/composables/useChartOptions';
import { useDashboardState } from '@/composables/useDashboardState';
import { useToast } from '@/composables/useToast';
import { usePermissions } from '@/composables/usePermissions';
import { dashboardService } from '@/services/shared/dashboardService';
import { PERIOD_OPTIONS } from '@/utils/constants';
import Chart from 'primevue/chart';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { barChartOptions } = useChartOptions();
const { state, executeDataFetch } = useDashboardState();
const { hasPermission } = usePermissions();

const loading = ref(false);
const period = ref('month');
const periodOptions = PERIOD_OPTIONS;

// Manufacturing dashboard data
const dashboardData = ref({
    total_production_orders: 0,
    total_output: 0,
    equipment_utilization: 0,
    production_efficiency: 0,
    waste_percentage: 0,
    defect_rate: 0,
    maintenance_alerts: 0,
    downtime_hours: 0,
    production_by_line: [],
    efficiency_trends: [],
    equipment_status: [],
    quality_metrics: []
});

// Chart data
const productionByLineChartData = ref(null);
const efficiencyTrendsChartData = ref(null);
const equipmentStatusChartData = ref(null);
const qualityMetricsChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;

    const result = await executeDataFetch(
        () => dashboardService.getManufacturingDashboardData(period.value),
        null,
        `Manufacturing data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
    );

    if (result) {
        dashboardData.value = result.data || result;
        processChartData();
    }

    loading.value = false;
};

// Process chart data for visualization
const processChartData = () => {
    // Production by line chart
    if (dashboardData.value.production_by_line?.length > 0) {
        productionByLineChartData.value = {
            labels: dashboardData.value.production_by_line.map((item) => item.line_name),
            datasets: [
                {
                    label: 'Output',
                    data: dashboardData.value.production_by_line.map((item) => item.output),
                    backgroundColor: '#42A5F5',
                    borderColor: '#1E88E5',
                    borderWidth: 1
                }
            ]
        };
    }

    // Efficiency trends chart
    if (dashboardData.value.efficiency_trends?.length > 0) {
        efficiencyTrendsChartData.value = {
            labels: dashboardData.value.efficiency_trends.map((item) => item.period),
            datasets: [
                {
                    label: 'Efficiency %',
                    data: dashboardData.value.efficiency_trends.map((item) => item.efficiency),
                    borderColor: '#66BB6A',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    // Equipment status chart
    if (dashboardData.value.equipment_status?.length > 0) {
        equipmentStatusChartData.value = {
            labels: dashboardData.value.equipment_status.map((item) => item.equipment_name),
            datasets: [
                {
                    label: 'Utilization %',
                    data: dashboardData.value.equipment_status.map((item) => item.utilization),
                    backgroundColor: '#FFA726',
                    borderColor: '#FB8C00',
                    borderWidth: 1
                }
            ]
        };
    }

    // Quality metrics chart
    if (dashboardData.value.quality_metrics?.length > 0) {
        qualityMetricsChartData.value = {
            labels: dashboardData.value.quality_metrics.map((item) => item.metric_name),
            datasets: [
                {
                    label: 'Score',
                    data: dashboardData.value.quality_metrics.map((item) => item.score),
                    backgroundColor: '#EC407A',
                    borderColor: '#C2185B',
                    borderWidth: 1
                }
            ]
        };
    }
};

// Navigation functions
const navigateToOrders = () => {
    router.push('/manufacturing/orders');
};

const navigateToEquipment = () => {
    router.push('/manufacturing/equipment');
};

const navigateToMaintenance = () => {
    router.push('/manufacturing/maintenance');
};

const navigateToQuality = () => {
    router.push('/manufacturing/quality');
};

// Visibility flags
const canViewProduction = hasPermission('view_productionbatch');
const canViewAnalytics = hasPermission('view_manufacturinganalytics') || hasPermission('view_productionbatch');
const canViewQuality = hasPermission('view_qualitycheck');
const canViewMaintenance = hasPermission('view_assetmaintenance') || hasPermission('view_productionbatch');

// Watch for period changes
watch(period, () => {
    loadDashboardData();
});

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="manufacturing-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Manufacturing Dashboard</h1>
            <Dropdown v-model="period" :options="periodOptions" option-label="label" option-value="value" placeholder="Select Period" class="w-48" />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card v-if="canViewProduction" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Production Orders</span>
                            <i class="pi pi-list text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_production_orders }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewProduction" class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Output</span>
                            <i class="pi pi-chart-bar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_output.toLocaleString() }}
                        </div>
                        <div class="text-sm opacity-75">units</div>
                    </template>
                </Card>

                <Card v-if="canViewProduction" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Equipment Utilization</span>
                            <i class="pi pi-cog text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ (dashboardData.equipment_utilization * 100).toFixed(1) }}%
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewAnalytics" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Production Efficiency</span>
                            <i class="pi pi-bolt text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ (dashboardData.production_efficiency * 100).toFixed(1) }}%
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Quality & Maintenance Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card v-if="canViewQuality" class="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Defect Rate</span>
                            <i class="pi pi-exclamation-triangle text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ (dashboardData.defect_rate * 100).toFixed(2) }}%
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewProduction" class="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Waste Percentage</span>
                            <i class="pi pi-trash text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ (dashboardData.waste_percentage * 100).toFixed(1) }}%
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewMaintenance" class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Maintenance Alerts</span>
                            <i class="pi pi-bell text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.maintenance_alerts }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Production by Line -->
                <Card v-if="canViewProduction">
                    <template #title>Production by Line</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="productionByLineChartData" type="bar" :data="productionByLineChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No production data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Efficiency Trends -->
                <Card v-if="canViewAnalytics">
                    <template #title>Efficiency Trends</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="efficiencyTrendsChartData" type="line" :data="efficiencyTrendsChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No efficiency data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Additional Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Equipment Status -->
                <Card v-if="canViewProduction">
                    <template #title>Equipment Utilization</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="equipmentStatusChartData" type="bar" :data="equipmentStatusChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No equipment data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Quality Metrics -->
                <Card v-if="canViewQuality">
                    <template #title>Quality Metrics</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="qualityMetricsChartData" type="bar" :data="qualityMetricsChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No quality data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Quick Actions -->
            <Card>
                <template #title>Quick Actions</template>
                <template #content>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button v-if="canViewProduction" label="Production Orders" icon="pi pi-list" class="p-button-outlined" @click="navigateToOrders" />
                        <Button v-if="canViewProduction" label="Equipment" icon="pi pi-cog" class="p-button-outlined" @click="navigateToEquipment" />
                        <Button v-if="canViewMaintenance" label="Maintenance" icon="pi pi-wrench" class="p-button-outlined" @click="navigateToMaintenance" />
                        <Button v-if="canViewQuality" label="Quality Control" icon="pi pi-check-circle" class="p-button-outlined" @click="navigateToQuality" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.manufacturing-dashboard {
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
