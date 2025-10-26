<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Modern Dashboard Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                        <i class="pi pi-chart-line text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-1">Asset Dashboard</h1>
                        <p class="text-gray-600">Comprehensive overview of your asset management system</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        class="p-button-outlined border-gray-300 text-gray-600 hover:bg-gray-50"
                        @click="loadDashboard"
                        :loading="loading"
                    />
                    <Button
                        label="Export Report"
                        icon="pi pi-download"
                        class="p-button-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                    />
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span class="ml-4 text-gray-600">Loading dashboard data...</span>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="space-y-6">
            <!-- Summary Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Assets Card -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600 mb-1">Total Assets</p>
                            <p class="text-3xl font-bold text-gray-900">{{ dashboardData.overview?.total_assets || 0 }}</p>
                            <p class="text-sm text-gray-500 mt-1">All registered assets</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-lg">
                            <i class="pi pi-desktop text-blue-600 text-2xl"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-green-600 font-medium">↗ +12%</span>
                        <span class="text-gray-500 ml-2">from last month</span>
                    </div>
                </div>

                <!-- Active Assets Card -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600 mb-1">Active Assets</p>
                            <p class="text-3xl font-bold text-gray-900">{{ dashboardData.overview?.active_assets || 0 }}</p>
                            <p class="text-sm text-gray-500 mt-1">Currently in use</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-lg">
                            <i class="pi pi-check-circle text-green-600 text-2xl"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-green-600 font-medium">↗ +8%</span>
                        <span class="text-gray-500 ml-2">from last month</span>
                    </div>
                </div>

                <!-- Total Value Card -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                            <p class="text-3xl font-bold text-gray-900">KES {{ formatCurrency(dashboardData.value_analytics?.total_current_value || 0) }}</p>
                            <p class="text-sm text-gray-500 mt-1">Current asset value</p>
                        </div>
                        <div class="bg-orange-100 p-3 rounded-lg">
                            <i class="pi pi-dollar text-orange-600 text-2xl"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-green-600 font-medium">↗ +15%</span>
                        <span class="text-gray-500 ml-2">from last month</span>
                    </div>
                </div>

                <!-- Maintenance Card -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600 mb-1">Under Maintenance</p>
                            <p class="text-3xl font-bold text-gray-900">{{ dashboardData.overview?.maintenance_assets || 0 }}</p>
                            <p class="text-sm text-gray-500 mt-1">Requiring attention</p>
                        </div>
                        <div class="bg-purple-100 p-3 rounded-lg">
                            <i class="pi pi-cog text-purple-600 text-2xl"></i>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-red-600 font-medium">↘ -3%</span>
                        <span class="text-gray-500 ml-2">from last month</span>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Category Distribution Chart -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center space-x-3 mb-6">
                        <div class="bg-blue-100 p-2 rounded-lg">
                            <i class="pi pi-chart-pie text-blue-600 text-lg"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">Assets by Category</h3>
                    </div>
                    <div class="h-80">
                        <Chart type="doughnut" :data="categoryChartData" :options="chartOptions" />
                    </div>
                </div>

                <!-- Status Distribution Chart -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center space-x-3 mb-6">
                        <div class="bg-green-100 p-2 rounded-lg">
                            <i class="pi pi-chart-bar text-green-600 text-lg"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">Asset Status Distribution</h3>
                    </div>
                    <div class="h-80">
                        <Chart type="pie" :data="statusChartData" :options="chartOptions" />
                    </div>
                </div>
            </div>

            <!-- Bottom Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Recent Activity -->
                <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="bg-purple-100 p-2 rounded-lg">
                                <i class="pi pi-clock text-purple-600 text-lg"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        </div>
                        <Button label="View All" icon="pi pi-arrow-right" class="p-button-text text-blue-600 hover:bg-blue-50" />
                    </div>

                    <div class="space-y-4">
                        <div v-for="activity in recentActivity.slice(0, 5)" :key="activity.id"
                             class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div class="flex-shrink-0">
                                <div :class="getActivityIconClass(activity.type)">
                                    <i :class="getActivityIcon(activity.type)"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900">{{ activity.description }}</p>
                                <p class="text-sm text-gray-500">{{ activity.user }} • {{ formatDateTime(activity.date) }}</p>
                            </div>
                            <div class="flex-shrink-0">
                                <Tag :value="activity.type" :severity="getActivitySeverity(activity.type)" />
                            </div>
                        </div>
                    </div>

                    <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
                        <i class="pi pi-inbox text-4xl mb-3"></i>
                        <p>No recent activity</p>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="space-y-6">
                    <!-- Maintenance Alerts -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="bg-orange-100 p-2 rounded-lg">
                                <i class="pi pi-exclamation-triangle text-orange-600 text-lg"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900">Maintenance Alerts</h3>
                        </div>

                        <div v-if="dashboardData.alerts?.maintenance_due_soon > 0">
                            <div class="space-y-3">
                                <div class="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                    <i class="pi pi-wrench text-orange-500"></i>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-900">{{ dashboardData.alerts.maintenance_due_soon }} assets need maintenance</p>
                                        <p class="text-xs text-gray-500">Due within 7 days</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-4 text-gray-500">
                            <i class="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                            <p class="text-sm">No alerts</p>
                        </div>
                    </div>

                    <!-- Depreciation Summary -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="bg-blue-100 p-2 rounded-lg">
                                <i class="pi pi-chart-line text-blue-600 text-lg"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900">Depreciation Summary</h3>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <p class="text-xl font-bold text-green-600">{{ formatCurrency(dashboardData.value_analytics?.total_accumulated_depreciation || 0) }}</p>
                                <p class="text-sm text-gray-500">Total Depreciation</p>
                            </div>
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <p class="text-xl font-bold text-blue-600">{{ dashboardData.value_analytics?.depreciation_rate ? dashboardData.value_analytics.depreciation_rate.toFixed(1) + '%' : '0%' }}</p>
                                <p class="text-sm text-gray-500">Avg Depreciation Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Chart from 'primevue/chart';
import {formatCurrency, formatDateTime, formatDate} from '@/utils/formatters';

import assetService from '@/services/assets/assetService';

// Composables
const toast = useToast();

// Data
const dashboardData = ref({});
const loading = ref(false);
const recentActivity = ref([]);

// Chart data
const categoryChartData = ref({
    labels: [],
    datasets: [{
        data: [],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'],
        borderWidth: 2,
        borderColor: '#ffffff'
    }]
});

const statusChartData = ref({
    labels: ['Active', 'Inactive', 'Maintenance', 'Disposed', 'Lost'],
    datasets: [{
        data: [],
        backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'],
        borderWidth: 2,
        borderColor: '#ffffff'
    }]
});

const chartOptions = ref({
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                    size: 12
                }
            }
        }
    },
    responsive: true,
    maintainAspectRatio: false
});

// Methods
const loadDashboard = async () => {
    loading.value = true;
    try {
        const response = await assetService.getAssetDashboard();
        console.log('Dashboard API Response:', response);
        dashboardData.value = response.data || response;

        console.log('Dashboard Data:', dashboardData.value);

        // Update chart data
        updateCharts();

        // Load recent activity
        await loadRecentActivity();
    } catch (error) {
        console.error('Dashboard loading error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dashboard data',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const loadRecentActivity = async () => {
    try {
        // Transform API data to component format
        const activities = [];

        if (dashboardData.value.recent_activities) {
            const { transfers, maintenance, disposals } = dashboardData.value.recent_activities;

            // Add transfers
            transfers.forEach(transfer => {
                activities.push({
                    id: transfer.id,
                    description: `${transfer.asset_name} transferred from ${transfer.from_user_name} to ${transfer.to_user_name}`,
                    user: transfer.transferred_by_name,
                    date: transfer.transfer_date,
                    type: 'transferred'
                });
            });

            // Add maintenance
            maintenance.forEach(maint => {
                activities.push({
                    id: maint.id,
                    description: `Maintenance completed for ${maint.asset_name}`,
                    user: maint.performed_by,
                    date: maint.completed_date || maint.scheduled_date,
                    type: 'maintenance'
                });
            });

            // Add disposals
            disposals.forEach(disposal => {
                activities.push({
                    id: disposal.id,
                    description: `${disposal.asset_name} ${disposal.disposal_method}`,
                    user: disposal.approved_by_name,
                    date: disposal.disposal_date,
                    type: 'disposed'
                });
            });
        }

        // Sort by date (most recent first) and limit to 10
        recentActivity.value = activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
    } catch (error) {
        console.error('Failed to load recent activity:', error);
    }
};

const updateCharts = () => {
    if (dashboardData.value.category_distribution) {
        categoryChartData.value.labels = dashboardData.value.category_distribution.map(item => item.name || item.category_name);
        categoryChartData.value.datasets[0].data = dashboardData.value.category_distribution.map(item => item.asset_count);
    }

    // Create status distribution data from overview
    if (dashboardData.value.overview) {
        const overview = dashboardData.value.overview;
        statusChartData.value.datasets[0].data = [
            overview.active_assets || 0,
            overview.inactive_assets || 0,
            overview.maintenance_assets || 0,
            overview.disposed_assets || 0,
            0 // Lost assets (not in current data)
        ];
    }
};

const getActivitySeverity = (type) => {
    const severityMap = {
        'created': 'success',
        'updated': 'info',
        'transferred': 'warning',
        'maintenance': 'info',
        'disposed': 'danger'
    };
    return severityMap[type] || 'info';
};

const getActivityIcon = (type) => {
    const iconMap = {
        'created': 'pi pi-plus',
        'updated': 'pi pi-pencil',
        'transferred': 'pi pi-exchange',
        'maintenance': 'pi pi-cog',
        'disposed': 'pi pi-trash'
    };
    return iconMap[type] || 'pi pi-info-circle';
};

const getActivityIconClass = (type) => {
    const colorMap = {
        'created': 'bg-green-100 text-green-600',
        'updated': 'bg-blue-100 text-blue-600',
        'transferred': 'bg-orange-100 text-orange-600',
        'maintenance': 'bg-purple-100 text-purple-600',
        'disposed': 'bg-red-100 text-red-600'
    };
    return `w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[type] || 'bg-gray-100 text-gray-600'}`;
};

// Lifecycle
onMounted(() => {
    loadDashboard();
});
</script>

<style scoped>
/* Custom scrollbar for better UX */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Smooth transitions */
* {
    transition: all 0.2s ease-in-out;
}

/* Hover effects for cards */
.bg-white:hover {
    transform: translateY(-1px);
}

/* Loading animation */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
