<script setup>
import { useToast } from '@/composables/useToast';
import { coreService } from '@/services/shared/coreService';
import { onMounted, onUnmounted, ref } from 'vue';

// Components
const { showToast } = useToast();

            // Reactive data
            const loading = ref(false);
            const cacheLoading = ref(false);
            const systemMetrics = ref({});
            const cacheMetrics = ref({});
            const cacheData = ref({});
            const optimizationData = ref({});
            const recommendations = ref([]);
            const performanceHistory = ref([]);
            const backgroundJobStats = ref({});
            const activeJobs = ref([]);

// Auto-refresh interval
let refreshInterval = null;

// Methods
const loadPerformanceMetrics = async () => {
    try {
        const response = await coreService.getPerformanceMetrics();
        systemMetrics.value = response.system || {};
        cacheMetrics.value = response.cache || {};
        recommendations.value = response.recommendations || [];

        // Add to history
        performanceHistory.value.unshift({
            timestamp: new Date().toISOString(),
            cpu_percent: systemMetrics.value.cpu_percent,
            memory_percent: systemMetrics.value.memory_percent,
            response_time: response.performance?.response_time || 0
        });

        // Keep only last 50 entries
        if (performanceHistory.value.length > 50) {
            performanceHistory.value = performanceHistory.value.slice(0, 50);
        }
    } catch (error) {
        console.error('Failed to load performance metrics:', error);
        showToast('error', 'Failed to load performance metrics');
    }
};

const loadOptimizationData = async () => {
    try {
        loading.value = true;
        const response = await coreService.getDatabaseOptimization();
        optimizationData.value = response;
    } catch (error) {
        console.error('Failed to load optimization data:', error);
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load optimization data',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const loadCacheData = async () => {
    try {
        cacheLoading.value = true;
        const response = await coreService.getCacheManagement();
        cacheData.value = response;
    } catch (error) {
        console.error('Failed to load cache data:', error);
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load cache data',
            life: 3000
        });
    } finally {
        cacheLoading.value = false;
    }
};

const loadBackgroundJobStats = async () => {
    try {
        const data = await coreService.getBackgroundJobStatus();
        backgroundJobStats.value = data.queue_statistics || {};
        activeJobs.value = data.active_jobs || [];
    } catch (error) {
        console.error('Error loading background job stats:', error);
    }
};

const refreshOptimization = () => {
    loadOptimizationData();
};

const refreshCacheStats = () => {
    loadCacheData();
};

const clearCache = async () => {
    try {
        cacheLoading.value = true;
        await coreService.clearCache();
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: 'Cache cleared successfully',
            life: 3000
        });
        loadCacheData();
    } catch (error) {
        console.error('Failed to clear cache:', error);
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to clear cache',
            life: 3000
        });
    } finally {
        cacheLoading.value = false;
    }
};

// Utility methods
const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
};

const getResponseTimeClass = (responseTime) => {
    if (responseTime < 100) return 'text-green-500';
    if (responseTime < 500) return 'text-orange-500';
    return 'text-red-500';
};

const getRecommendationClass = (type) => {
    switch (type) {
        case 'critical':
            return 'bg-red-50 border-red-200';
        case 'warning':
            return 'bg-orange-50 border-orange-200';
        case 'info':
            return 'bg-blue-50 border-blue-200';
        default:
            return 'bg-gray-50 border-gray-200';
    }
};

const getRecommendationIcon = (type) => {
    switch (type) {
        case 'critical':
            return 'pi pi-exclamation-triangle text-red-500';
        case 'warning':
            return 'pi pi-exclamation-circle text-orange-500';
        case 'info':
            return 'pi pi-info-circle text-blue-500';
        default:
            return 'pi pi-info-circle text-gray-500';
    }
};

const getPrioritySeverity = (priority) => {
    switch (priority) {
        case 'high':
            return 'danger';
        case 'medium':
            return 'warning';
        case 'low':
            return 'info';
        default:
            return 'info';
    }
};

const getJobStatusSeverity = (status) => {
    switch (status) {
        case 'completed': return 'success';
        case 'running': return 'info';
        case 'queued': return 'warning';
        case 'failed': return 'danger';
        default: return 'info';
    }
};

// Lifecycle
onMounted(() => {
    loadPerformanceMetrics();
    loadOptimizationData();
    loadCacheData();
    loadBackgroundJobStats();

    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(() => {
        loadPerformanceMetrics();
        loadBackgroundJobStats();
    }, 30000);
});

onUnmounted(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
</script>

<template>
    <div class="performance-dashboard">
        <div class="card">
            <h5>Performance Dashboard</h5>

            <!-- System Health Overview -->
            <div class="grid">
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="surface-card shadow-2 p-4 border-round">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">CPU Usage</span>
                                <div class="text-900 font-medium text-xl">{{ systemMetrics.cpu_percent || 0 }}%</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-desktop text-blue-500 text-xl"></i>
                            </div>
                        </div>
                        <span class="text-green-500 font-medium">Active</span>
                        <span class="text-500">since last update</span>
                    </div>
                </div>

                <div class="col-12 md:col-6 lg:col-3">
                    <div class="surface-card shadow-2 p-4 border-round">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Memory Usage</span>
                                <div class="text-900 font-medium text-xl">{{ systemMetrics.memory_percent || 0 }}%</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-memory text-orange-500 text-xl"></i>
                            </div>
                        </div>
                        <span class="text-green-500 font-medium">Available</span>
                        <span class="text-500">{{ systemMetrics.memory_available_gb || 0 }} GB</span>
                    </div>
                </div>

                <div class="col-12 md:col-6 lg:col-3">
                    <div class="surface-card shadow-2 p-4 border-round">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Disk Usage</span>
                                <div class="text-900 font-medium text-xl">{{ systemMetrics.disk_percent || 0 }}%</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-hdd text-cyan-500 text-xl"></i>
                            </div>
                        </div>
                        <span class="text-green-500 font-medium">Free</span>
                        <span class="text-500">{{ systemMetrics.disk_free_gb || 0 }} GB</span>
                    </div>
                </div>

                <div class="col-12 md:col-6 lg:col-3">
                    <div class="surface-card shadow-2 p-4 border-round">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Cache Hit Rate</span>
                                <div class="text-900 font-medium text-xl">{{ cacheMetrics.hit_rate || 0 }}%</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-bolt text-purple-500 text-xl"></i>
                            </div>
                        </div>
                        <span class="text-green-500 font-medium">Efficient</span>
                        <span class="text-500">cache performance</span>
                    </div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="grid mt-4">
                <div class="col-12 lg:col-8">
                    <div class="card">
                        <h5>System Performance</h5>
                        <DataTable :value="performanceHistory" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" responsiveLayout="scroll">
                            <Column field="timestamp" header="Time" sortable>
                                <template #body="slotProps">
                                    {{ formatTime(slotProps.data.timestamp) }}
                                </template>
                            </Column>
                            <Column field="cpu_percent" header="CPU %" sortable>
                                <template #body="slotProps">
                                    <div class="flex align-items-center">
                                        <ProgressBar :value="slotProps.data.cpu_percent" :showValue="false" style="width: 60px; margin-right: 10px" />
                                        {{ slotProps.data.cpu_percent }}%
                                    </div>
                                </template>
                            </Column>
                            <Column field="memory_percent" header="Memory %" sortable>
                                <template #body="slotProps">
                                    <div class="flex align-items-center">
                                        <ProgressBar :value="slotProps.data.memory_percent" :showValue="false" style="width: 60px; margin-right: 10px" />
                                        {{ slotProps.data.memory_percent }}%
                                    </div>
                                </template>
                            </Column>
                            <Column field="response_time" header="Response Time (ms)" sortable>
                                <template #body="slotProps">
                                    <span :class="getResponseTimeClass(slotProps.data.response_time)"> {{ slotProps.data.response_time }}ms </span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>

                <div class="col-12 lg:col-4">
                    <div class="card">
                        <h5>Performance Recommendations</h5>
                        <div v-if="recommendations.length === 0" class="text-center p-4">
                            <i class="pi pi-check-circle text-green-500 text-4xl mb-3"></i>
                            <p class="text-500">All systems are performing optimally!</p>
                        </div>
                        <div v-else>
                            <div v-for="rec in recommendations" :key="rec.message" class="mb-3 p-3 border-round" :class="getRecommendationClass(rec.type)">
                                <div class="flex align-items-start">
                                    <i :class="getRecommendationIcon(rec.type)" class="mr-2 mt-1"></i>
                                    <div>
                                        <p class="font-medium mb-1">{{ rec.message }}</p>
                                        <p class="text-sm text-500">{{ rec.action }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Database Optimization -->
            <div class="grid mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="flex justify-content-between align-items-center mb-4">
                            <h5>Database Optimization</h5>
                            <Button label="Refresh Analysis" icon="pi pi-refresh" @click="refreshOptimization" :loading="loading" />
                        </div>

                        <div class="grid">
                            <div class="col-12 md:col-6">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Index Suggestions</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ optimizationData.total_suggestions || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-green-500 font-medium">{{ optimizationData.high_priority_suggestions || 0 }}</span>
                                        <span class="text-500 ml-2">high priority</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-6">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Slow Queries</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ optimizationData.slow_queries?.length || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-orange-500 font-medium">Detected</span>
                                        <span class="text-500 ml-2">queries > 1s</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="optimizationData.index_suggestions?.length > 0" class="mt-4">
                            <h6>Recommended Indexes</h6>
                            <DataTable :value="optimizationData.index_suggestions" :paginator="true" :rows="5" responsiveLayout="scroll" class="mt-3">
                                <Column field="table" header="Table" sortable></Column>
                                <Column field="fields" header="Fields">
                                    <template #body="slotProps">
                                        <Chip :label="slotProps.data.fields.join(', ')" />
                                    </template>
                                </Column>
                                <Column field="priority" header="Priority" sortable>
                                    <template #body="slotProps">
                                        <Tag :value="slotProps.data.priority" :severity="getPrioritySeverity(slotProps.data.priority)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cache Management -->
            <div class="grid mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="flex justify-content-between align-items-center mb-4">
                            <h5>Cache Management</h5>
                            <div class="flex gap-2">
                                <Button label="Clear All Cache" icon="pi pi-trash" severity="danger" @click="clearCache" :loading="cacheLoading" />
                                <Button label="Refresh Stats" icon="pi pi-refresh" @click="refreshCacheStats" :loading="cacheLoading" />
                            </div>
                        </div>

                        <div class="grid">
                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Cache Status</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ cacheData.status || 'Unknown' }}</div>
                                    <div class="flex align-items-center">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <span class="text-500">Active</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Cache Keys</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ cacheData.keys_count || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-blue-500 font-medium">Total</span>
                                        <span class="text-500 ml-2">cached items</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Memory Usage</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ cacheData.memory_usage_mb || 0 }} MB</div>
                                    <div class="flex align-items-center">
                                        <span class="text-purple-500 font-medium">Approximate</span>
                                        <span class="text-500 ml-2">usage</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Hit Rate</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ cacheMetrics.hit_rate || 0 }}%</div>
                                    <div class="flex align-items-center">
                                        <ProgressBar :value="cacheMetrics.hit_rate || 0" :showValue="false" style="width: 60px" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Background Job Monitoring -->
            <div class="grid mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="flex justify-content-between align-items-center mb-4">
                            <h5>Background Job Monitoring</h5>
                            <Button label="Refresh Jobs" icon="pi pi-refresh" @click="loadBackgroundJobStats" :loading="loading" />
                        </div>

                        <div class="grid">
                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Total Jobs</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ backgroundJobStats.total_jobs || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-blue-500 font-medium">Processed</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Active Jobs</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ backgroundJobStats.active_jobs || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-orange-500 font-medium">Running</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Completed Jobs</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ backgroundJobStats.completed_jobs || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-green-500 font-medium">Success</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 md:col-3">
                                <div class="surface-card shadow-1 p-4 border-round">
                                    <h6>Failed Jobs</h6>
                                    <div class="text-900 font-medium text-xl mb-2">{{ backgroundJobStats.failed_jobs || 0 }}</div>
                                    <div class="flex align-items-center">
                                        <span class="text-red-500 font-medium">Errors</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="activeJobs.length > 0" class="mt-4">
                            <h6>Active Jobs</h6>
                            <DataTable :value="activeJobs" :paginator="true" :rows="5" responsiveLayout="scroll" class="mt-3">
                                <Column field="id" header="Job ID" sortable></Column>
                                <Column field="function" header="Function" sortable></Column>
                                <Column field="status" header="Status" sortable>
                                    <template #body="slotProps">
                                        <Tag :value="slotProps.data.status" :severity="getJobStatusSeverity(slotProps.data.status)" />
                                    </template>
                                </Column>
                                <Column field="submitted_at" header="Submitted" sortable>
                                    <template #body="slotProps">
                                        {{ formatTime(slotProps.data.submitted_at) }}
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.performance-dashboard {
    padding: 1rem;
}

.card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
}

.surface-card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.shadow-1 {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.shadow-2 {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
