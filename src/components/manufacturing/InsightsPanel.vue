<script setup>
import { onMounted, ref } from 'vue';
import { manufacturingService } from '@/services/manufacturing/manufacturingService';

const insights = ref([]);
const insightsData = ref(null);
const loading = ref(false);

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

const severity = (priority) => {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'info';
};

const timeTrendClass = (trend) => (trend === 'decreasing' ? 'text-green-500' : 'text-red-500');
const trendIcon = (trend) => (trend === 'decreasing' ? 'pi-arrow-down' : 'pi-arrow-up');
const qualityClass = (rate) => (rate >= 95 ? 'text-green-500' : 'text-red-500');

const fetchInsights = async () => {
    loading.value = true;
    try {
        const response = await manufacturingService.getInsights();
        insightsData.value = response.data;
        insights.value =
            insightsData.value.recommendations?.map((r) => ({
                type: r.type,
                title: r.title,
                description: r.description,
                priority: r.priority
            })) || [];
    } catch (error) {
        console.error('Error fetching insights:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load insights', life: 3000 });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // Fetch insights data when the component is mounted
    fetchInsights();
    console.log('InsightsPanel mounted', insightsData.value, insights.value);
});
</script>

<template>
    <Card class="shadow-lg p-4"
        >{{ insightsData }}
        <div class="flex items-center justify-between mb-3">
            <h5 class="m-0">AI-Powered Insights</h5>
            <Button v-if="!loading" icon="pi pi-refresh" class="p-button-rounded p-button-text" @click="$emit('refresh')" tooltip="Refresh Insights" tooltipOptions="{ position: 'left' }" />
        </div>

        <div v-if="loading" class="flex items-center justify-center p-4">
            <ProgressSpinner />
        </div>

        <div v-else-if="!insights || insights.length === 0" class="p-4 text-center">
            <i class="pi pi-lightbulb text-yellow-500 text-2xl"></i>
            <p class="text-700 mt-3">
                <span v-if="insightsData">System analyzed data but found no significant issues.</span>
                <span v-else>No insights available. Generate insights to receive recommendations.</span>
            </p>
            <Button label="Generate Insights" icon="pi pi-bolt" class="p-button-outlined mt-3" @click="$emit('refresh')" />
        </div>

        <div v-else class="p-3">
            <!-- Performance Metrics -->
            <div v-if="insightsData?.performance_metrics" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div class="p-3 rounded-lg bg-blue-50">
                    <div class="text-sm text-600">Average Production Time</div>
                    <div class="text-xl font-medium">{{ insightsData.performance_metrics.avg_production_time }} hrs</div>
                    <div :class="timeTrendClass(insightsData.performance_metrics.time_trend)" class="text-xs mt-1">
                        <i :class="trendIcon(insightsData.performance_metrics.time_trend) + ' mr-1'"></i>
                        {{ insightsData.performance_metrics.time_trend === 'decreasing' ? 'Improving' : 'Increasing' }}
                    </div>
                </div>
                <div class="p-3 rounded-lg bg-green-50">
                    <div class="text-sm text-600">Quality Pass Rate</div>
                    <div class="text-xl font-medium">{{ insightsData.performance_metrics.quality_pass_rate }}%</div>
                    <div :class="qualityClass(insightsData.performance_metrics.quality_pass_rate)" class="text-xs mt-1">
                        {{ insightsData.performance_metrics.quality_pass_rate >= 95 ? 'Target Met' : 'Below Target' }}
                    </div>
                </div>
                <div class="p-3 rounded-lg bg-yellow-50">
                    <div class="text-sm text-600">Batches Analyzed</div>
                    <div class="text-xl font-medium">{{ insightsData.performance_metrics.batches_analyzed }}</div>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="text-lg font-medium mb-2">AI Recommendations</div>
            <div v-if="insights.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div v-for="(insight, i) in insights" :key="i" class="rounded-lg shadow hover:shadow-lg transition p-4 bg-white">
                    <div class="flex items-center mb-3">
                        <i :class="getInsightIcon(insight.type) + ' text-xl mr-2'"></i>
                        <div class="flex items-center">
                            <div class="font-medium text-900">{{ insight.title }}</div>
                            <Tag :value="insight.priority" class="ml-2" :severity="severity(insight.priority)" />
                        </div>
                    </div>
                    <p class="text-sm mb-3">{{ insight.description }}</p>
                    <Button v-if="insight.action" :label="insight.action.label" icon="pi pi-arrow-right" class="p-button-sm p-button-outlined" />
                </div>
            </div>
            <div v-else class="p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                    <i class="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                    <span class="text-600">No critical issues. Processes are within parameters.</span>
                </div>
            </div>

            <!-- Material Insights -->
            <div v-if="insightsData?.material_insights" class="mt-4">
                <div class="text-lg font-medium mb-2">Material Inventory Status</div>
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div class="p-3 rounded-lg bg-red-50">
                        <div class="text-sm text-600">Critical Stock</div>
                        <div class="text-xl font-medium">{{ insightsData.material_insights.critical_stock_count }}</div>
                        <div v-if="insightsData.material_insights.critical_stock_count > 0" class="text-xs text-red-700 mt-1">Immediate reorder required</div>
                    </div>
                    <div class="p-3 rounded-lg bg-yellow-50">
                        <div class="text-sm text-600">Low Stock</div>
                        <div class="text-xl font-medium">{{ insightsData.material_insights.low_stock_count }}</div>
                        <div v-if="insightsData.material_insights.low_stock_count > 0" class="text-xs text-yellow-700 mt-1">Consider reordering soon</div>
                    </div>
                    <div class="p-3 rounded-lg bg-green-50">
                        <div class="text-sm text-600">Optimal Stock</div>
                        <div class="text-xl font-medium">{{ insightsData.material_insights.total_materials - insightsData.material_insights.low_stock_count - insightsData.material_insights.excess_stock_count }}</div>
                    </div>
                    <div class="p-3 rounded-lg bg-blue-50">
                        <div class="text-sm text-600">Excess Stock</div>
                        <div class="text-xl font-medium">{{ insightsData.material_insights.excess_stock_count }}</div>
                        <div v-if="insightsData.material_insights.excess_stock_count > 0" class="text-xs text-blue-700 mt-1">Capital tied in inventory</div>
                    </div>
                </div>
                <div v-if="insightsData.material_insights.total_materials === 0" class="p-3 bg-gray-100 rounded-lg mt-2 flex items-center">
                    <i class="pi pi-info-circle text-blue-500 mr-2"></i>
                    <span>No raw materials found. Add inventory to track levels.</span>
                </div>
            </div>
        </div>
    </Card>
</template>

<style scoped>
/* Responsive padding tweaks */
@media (max-width: 640px) {
    .p-datatable-sm .p-datatable-thead > tr > th,
    .p-datatable-sm .p-datatable-tbody > tr > td {
        padding: 0.5rem 0.25rem;
    }
}
</style>
