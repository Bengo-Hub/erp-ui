<script setup>
import { KPICard } from '@/components/charts';
import { useHrmFilters } from '@/composables/useHrmFilters';
import { usePermissions } from '@/composables/usePermissions';
import { hrmAnalyticsService } from '@/services/hrm';
import { calculatePercentageChange, formatMetricValue } from '@/utils/analyticsUtils';
import { formatTime } from '@/utils/helpers';
import Chart from 'primevue/chart';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// Router and toast
const router = useRouter();
const toast = useToast();

// Permissions
const { hasPermission, canRead, canCreate } = usePermissions();

// HRM Filters
const { filters, departments, regions, loadFilters, resetFilters, getFilterParams } = useHrmFilters();

// Reactive data
const loading = ref(false);
const navigationLoading = ref(false);
const selectedPeriod = ref('month');
const dashboardData = ref(null);
const chartViews = ref({
    demographics: 'pie',
    departments: 'doughnut',
    attendance: 'line',
    leave: 'pie',
    salary: 'bar',
    age: 'bar',
    education: 'doughnut',
    branch: 'pie',
    region: 'pie',
    contract: 'doughnut'
});

// Employee actions with permissions
const employeeActions = computed(() => [
    { label: 'Add Employee', icon: 'pi pi-user-plus', route: '/hrm/employees/view-employees', action: 'add', permission: 'add_employee' },
    { label: 'View All', icon: 'pi pi-users', route: '/hrm/employees/view-employees', permission: 'view_employee' },
    { label: 'Payroll', icon: 'pi pi-credit-card', route: '/hrm/payroll/regular/view-payslips', permission: 'view_payslip' },
    { label: 'Attendance', icon: 'pi pi-calendar-check', route: '/hrm/attendance/records', permission: 'view_attendancerecord' },
    { label: 'Leave Management', icon: 'pi pi-calendar-times', route: '/hrm/Leave/leaveList', permission: 'view_leaverequest' },
    { label: 'Performance', icon: 'pi pi-chart-line', route: '/hrm/performance/appraisals', permission: 'view_performancereview' },
    { label: 'Training', icon: 'pi pi-graduation-cap', route: '/hrm/training/courses', permission: 'view_trainingcourse' },
    { label: 'Contracts', icon: 'pi pi-file-edit', route: '/hrm/employees/manageContracts', permission: 'view_employee' },
    { label: 'Recruitment', icon: 'pi pi-briefcase', route: '/hrm/recruitment/jobs', permission: 'view_jobposting' },
    { label: 'Org Chart', icon: 'pi pi-sitemap', route: '/hrm/org/orgChart', permission: 'view_employee' }
].filter(action => hasPermission(action.permission)));

// Recent activities (mock data for now)
const recentActivities = ref([
    { id: 1, type: 'employee', icon: 'pi pi-user-plus', text: 'New employee John Doe added', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 2, type: 'leave', icon: 'pi pi-calendar-times', text: 'Leave request approved for Jane Smith', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { id: 3, type: 'payroll', icon: 'pi pi-credit-card', text: 'Payroll processed for 30 employees', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: 4, type: 'attendance', icon: 'pi pi-calendar-check', text: 'Attendance report generated', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
]);

// Chart data computed properties
const demographicsChartData = computed(() => {
    if (!dashboardData.value?.demographics?.gender_distribution) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.demographics.gender_distribution;
    return {
        labels: data.map((item) => item.personal_details__gender || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

const departmentChartData = computed(() => {
    if (!dashboardData.value?.department_breakdown) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.department_breakdown;
    return {
        labels: data.map((item) => item.hr_details__department__name || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

const attendanceChartData = computed(() => {
    // Since the API doesn't provide daily attendance rates, we'll create a simple chart
    // showing the overall attendance metrics
    if (!dashboardData.value?.attendance_metrics) {
        return { labels: [], datasets: [] };
    }

    const metrics = dashboardData.value.attendance_metrics;
    return {
        labels: ['Present', 'Absent', 'Late'],
        datasets: [
            {
                label: 'Days',
                data: [metrics.present_days || 0, metrics.absent_days || 0, metrics.late_days || 0],
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                borderColor: ['#059669', '#DC2626', '#D97706'],
                borderWidth: 2
            }
        ]
    };
});

const leaveChartData = computed(() => {
    if (!dashboardData.value?.leave_metrics?.leave_by_type) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.leave_metrics.leave_by_type;
    return {
        labels: data.map((item) => item.leave_category__name || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

const salaryChartData = computed(() => {
    if (!dashboardData.value?.salary_analysis?.salary_by_department) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.salary_analysis.salary_by_department;
    return {
        labels: data.map((item) => item.employee__hr_details__department__name || 'Unknown'),
        datasets: [
            {
                label: 'Average Salary (KES)',
                data: data.map((item) => item.avg_salary || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3B82F6',
                borderWidth: 2
            }
        ]
    };
});

const ageChartData = computed(() => {
    if (!dashboardData.value?.demographics?.age_distribution) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.demographics.age_distribution;
    return {
        labels: data.map((item) => item.range || 'Unknown'),
        datasets: [
            {
                label: 'Employees',
                data: data.map((item) => item.count || 0),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
                borderColor: ['#1D4ED8', '#DC2626', '#059669', '#D97706', '#7C3AED'],
                borderWidth: 2
            }
        ]
    };
});

const educationChartData = computed(() => {
    if (!dashboardData.value?.demographics?.education_distribution) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.demographics.education_distribution;
    return {
        labels: data.map((item) => item.personal_details__highest_education || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count || 0),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

const branchChartData = computed(() => {
    if (!dashboardData.value?.branch_breakdown) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.branch_breakdown;
    return {
        labels: data.map((item) => item.hr_details__branch__name || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count || 0),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

const regionChartData = computed(() => {
    if (!dashboardData.value?.region_breakdown) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.region_breakdown;
    return {
        labels: data.map((item) => item.hr_details__region__name || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count || 0),
                backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

const contractChartData = computed(() => {
    if (!dashboardData.value?.contract_metrics?.contracts_by_type) {
        return { labels: [], datasets: [] };
    }

    const data = dashboardData.value.contract_metrics.contracts_by_type;
    return {
        labels: data.map((item) => item.contract_type || 'Unknown'),
        datasets: [
            {
                data: data.map((item) => item.count || 0),
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
});

// Chart options
const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12
                }
            }
        }
    }
}));

const lineChartOptions = computed(() => ({
    ...chartOptions.value,
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: {
                callback: function (value) {
                    return value + '%';
                }
            }
        }
    }
}));

// Methods
const fetchDashboardData = async () => {
    loading.value = true;
    try {
        // Get filter parameters from enhanced useHrmFilters
        const filterParams = getFilterParams();

        const response = await hrmAnalyticsService.getHrmDashboard({
            period: selectedPeriod.value,
            business_id: '1', // TODO: Get from auth context
            ...filterParams
        });

        if (response.success) {
            dashboardData.value = response.data;
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Dashboard data refreshed successfully',
                life: 3000
            });
        } else {
            throw new Error(response.message || 'Failed to fetch dashboard data');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch dashboard data. Using fallback data.',
            life: 5000
        });
        // Use fallback data
        const fallbackResponse = await hrmAnalyticsService.getHrmDashboard({
            period: selectedPeriod.value,
            business_id: '1'
        });
        dashboardData.value = fallbackResponse.data;
    } finally {
        loading.value = false;
    }
};

const refreshDashboard = () => {
    fetchDashboardData();
};

const toggleChartView = (chartType) => {
    const currentView = chartViews.value[chartType];
    chartViews.value[chartType] = currentView === 'pie' ? 'bar' : currentView === 'doughnut' ? 'bar' : currentView === 'line' ? 'bar' : 'line';
};

const navigateTo = async (route, action = null) => {
    navigationLoading.value = true;
    try {
        if (action === 'add') {
            // For add employee, navigate to view-employees with a query parameter
            await router.push({ path: route, query: { action: 'add' } });
        } else {
            await router.push(route);
        }
    } catch (error) {
        console.error('Navigation error:', error);
        toast.add({
            severity: 'error',
            summary: 'Navigation Error',
            detail: 'Failed to navigate to the requested page.',
            life: 3000
        });
    } finally {
        navigationLoading.value = false;
    }
};


// Lifecycle
onMounted(() => {
    loadFilters();
    fetchDashboardData();
});

// Watch for period changes
watch(selectedPeriod, () => {
    fetchDashboardData();
});

// Watch for filter changes using enhanced watcher
watch(
    filters,
    () => {
        fetchDashboardData();
    },
    { deep: true }
);
</script>

<template>
    <div class="hrm-dashboard">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="dashboard-title">HRM Dashboard</h1>
                    <p class="dashboard-subtitle">Comprehensive overview of human resources metrics and performance</p>
                </div>
                <div class="header-actions">
                    <div class="period-selector">
                        <label for="period-select" class="period-label">Period:</label>
                        <select id="period-select" v-model="selectedPeriod" @change="refreshDashboard" class="period-select">
                            <option value="week">This Week</option>
                            <option value="month" selected>This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    <button @click="refreshDashboard" :disabled="loading" class="refresh-btn">
                        <i class="pi pi-refresh" :class="{ 'pi-spin': loading }"></i>
                        Refresh
                    </button>
                </div>
            </div>

            <!-- Compact Filters Section -->
            <div class="compact-filters">
                <div class="filters-row">
                    <div class="filter-item">
                        <label for="department-filter">Department:</label>
                        <select id="department-filter" v-model="filters.department" class="compact-filter-select">
                            <option value="">All Departments</option>
                            <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                                {{ dept.title }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <label for="region-filter">Region:</label>
                        <select id="region-filter" v-model="filters.region" class="compact-filter-select">
                            <option value="">All Regions</option>
                            <option v-for="region in regions" :key="region.id" :value="region.id">
                                {{ region.title }}
                            </option>
                        </select>
                    </div>

                    <button @click="resetFilters" class="compact-reset-btn" title="Reset all filters">
                        <i class="pi pi-refresh"></i>
                        Reset
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <div class="loading-spinner">
                <i class="pi pi-spinner pi-spin"></i>
                <p>Loading HRM data...</p>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="dashboard-content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <KPICard
                    title="Total Employees"
                    :value="dashboardData?.headcount_metrics?.total_employees || 0"
                    subtitle="Active employees"
                    icon="pi pi-users"
                    :trend="calculatePercentageChange(dashboardData?.headcount_metrics?.total_employees || 0, dashboardData?.headcount_metrics?.previous_total || 0)"
                    trendLabel="vs previous period"
                    :colors="{ from: '#3b82f6', to: '#1d4ed8' }"
                    :formatter="v => v"
                />

                <KPICard
                    title="Attendance Rate"
                    :value="dashboardData?.attendance_metrics?.attendance_rate || 0"
                    subtitle="Current period"
                    icon="pi pi-calendar-check"
                    :trend="calculatePercentageChange(dashboardData?.attendance_metrics?.attendance_rate || 0, dashboardData?.attendance_metrics?.previous_rate || 0)"
                    trendLabel="vs previous period"
                    :colors="{ from: '#10b981', to: '#059669' }"
                    :formatter="v => v.toFixed(1)"
                    additionalInfo="Higher is better"
                />

                <KPICard
                    title="Total Payroll"
                    :value="dashboardData?.salary_analysis?.salary_statistics?.total_payroll || 0"
                    subtitle="Current month"
                    icon="pi pi-credit-card"
                    :colors="{ from: '#f59e0b', to: '#d97706' }"
                    :formatter="v => formatMetricValue(v, 'currency', 0)"
                />

                <KPICard
                    title="Leave Approval"
                    :value="dashboardData?.leave_metrics?.approval_rate || 0"
                    subtitle="Approval rate"
                    icon="pi pi-calendar-times"
                    :trend="calculatePercentageChange(dashboardData?.leave_metrics?.approval_rate || 0, dashboardData?.leave_metrics?.previous_approval_rate || 0)"
                    trendLabel="vs previous period"
                    :colors="{ from: '#ef4444', to: '#dc2626' }"
                    :formatter="v => v.toFixed(1)"
                    additionalInfo="`${dashboardData?.leave_metrics?.pending_requests || 0} pending`"
                />
            </div>

            <!-- Additional Metrics Grid -->
            <div class="additional-metrics">
                <div class="metrics-grid">
                    <KPICard
                        title="Turnover Rate"
                        :value="dashboardData?.headcount_metrics?.turnover_rate || 0"
                        subtitle="Annual rate"
                        icon="pi pi-chart-line"
                        :colors="{ from: '#8b5cf6', to: '#7c3aed' }"
                        :formatter="v => v.toFixed(1)"
                    />

                    <KPICard
                        title="Expiring Contracts"
                        :value="dashboardData?.headcount_metrics?.expiring_contracts || 0"
                        subtitle="Next 30 days"
                        icon="pi pi-calendar-times"
                        :colors="{ from: '#ec4899', to: '#be185d' }"
                        :formatter="v => v"
                    />

                    <KPICard
                        title="Avg Basic Salary"
                        :value="dashboardData?.salary_analysis?.salary_statistics?.avg_basic_salary || 0"
                        subtitle="Monthly average"
                        icon="pi pi-dollar"
                        :colors="{ from: '#06b6d4', to: '#0891b2' }"
                        :formatter="v => formatMetricValue(v, 'currency', 0)"
                    />

                    <KPICard
                        title="Late Rate"
                        :value="dashboardData?.attendance_metrics?.late_rate || 0"
                        subtitle="Attendance metric"
                        icon="pi pi-clock"
                        :colors="{ from: '#f97316', to: '#ea580c' }"
                        :formatter="v => v.toFixed(1)"
                    />

                    <KPICard
                        title="Performance Reviews"
                        :value="dashboardData?.performance_metrics?.total_reviews || 0"
                        subtitle="Completed"
                        icon="pi pi-check-circle"
                        :colors="{ from: '#84cc16', to: '#65a30d' }"
                        :formatter="v => v"
                    />

                    <KPICard
                        title="Review Completion"
                        :value="dashboardData?.performance_metrics?.review_completion_rate || 0"
                        subtitle="Current cycle"
                        icon="pi pi-percentage"
                        :colors="{ from: '#14b8a6', to: '#0d9488' }"
                        :formatter="v => v.toFixed(1)"
                    />
                </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <!-- Employee Demographics -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Employee Demographics</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('demographics')" class="chart-toggle-btn" :class="{ active: chartViews.demographics === 'pie' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('demographics')" class="chart-toggle-btn" :class="{ active: chartViews.demographics === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.demographics === 'pie' ? 'pie' : 'bar'" :data="demographicsChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Department Distribution -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Department Distribution</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('departments')" class="chart-toggle-btn" :class="{ active: chartViews.departments === 'doughnut' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('departments')" class="chart-toggle-btn" :class="{ active: chartViews.departments === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.departments === 'doughnut' ? 'doughnut' : 'bar'" :data="departmentChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Attendance Trends -->
                <div class="chart-container full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Attendance Trends</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('attendance')" class="chart-toggle-btn" :class="{ active: chartViews.attendance === 'line' }">
                                <i class="pi pi-chart-line"></i>
                            </button>
                            <button @click="toggleChartView('attendance')" class="chart-toggle-btn" :class="{ active: chartViews.attendance === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.attendance === 'line' ? 'line' : 'bar'" :data="attendanceChartData" :options="lineChartOptions" class="chart" />
                    </div>
                </div>

                <!-- Leave Analysis -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Leave Analysis</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('leave')" class="chart-toggle-btn" :class="{ active: chartViews.leave === 'pie' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('leave')" class="chart-toggle-btn" :class="{ active: chartViews.leave === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.leave === 'pie' ? 'pie' : 'bar'" :data="leaveChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Salary Distribution -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Salary Distribution</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('salary')" class="chart-toggle-btn" :class="{ active: chartViews.salary === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                            <button @click="toggleChartView('salary')" class="chart-toggle-btn" :class="{ active: chartViews.salary === 'line' }">
                                <i class="pi pi-chart-line"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.salary === 'line' ? 'line' : 'bar'" :data="salaryChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Age Distribution -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Age Distribution</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('age')" class="chart-toggle-btn" :class="{ active: chartViews.age === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                            <button @click="toggleChartView('age')" class="chart-toggle-btn" :class="{ active: chartViews.age === 'pie' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.age === 'pie' ? 'pie' : 'bar'" :data="ageChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Education Distribution -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Education Distribution</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('education')" class="chart-toggle-btn" :class="{ active: chartViews.education === 'doughnut' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('education')" class="chart-toggle-btn" :class="{ active: chartViews.education === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.education === 'doughnut' ? 'doughnut' : 'bar'" :data="educationChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Branch Breakdown -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Branch Breakdown</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('branch')" class="chart-toggle-btn" :class="{ active: chartViews.branch === 'pie' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('branch')" class="chart-toggle-btn" :class="{ active: chartViews.branch === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.branch === 'pie' ? 'pie' : 'bar'" :data="branchChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Region Breakdown -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Region Breakdown</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('region')" class="chart-toggle-btn" :class="{ active: chartViews.region === 'pie' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('region')" class="chart-toggle-btn" :class="{ active: chartViews.region === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.region === 'pie' ? 'pie' : 'bar'" :data="regionChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>

                <!-- Contract Metrics -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Contract Status</h3>
                        <div class="chart-actions">
                            <button @click="toggleChartView('contract')" class="chart-toggle-btn" :class="{ active: chartViews.contract === 'doughnut' }">
                                <i class="pi pi-chart-pie"></i>
                            </button>
                            <button @click="toggleChartView('contract')" class="chart-toggle-btn" :class="{ active: chartViews.contract === 'bar' }">
                                <i class="pi pi-chart-bar"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <Chart :type="chartViews.contract === 'doughnut' ? 'doughnut' : 'bar'" :data="contractChartData" :options="chartOptions" class="chart" />
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <h3 class="section-title">Quick Actions</h3>
                <div class="action-buttons">
                    <button @click="navigateTo('/hrm')" class="action-btn dashboard-action" title="Return to HRM Dashboard" :disabled="navigationLoading">
                        <i class="pi pi-home" :class="{ 'pi-spin': navigationLoading }"></i>
                        <span>Back to Dashboard</span>
                    </button>
                    <button v-for="action in employeeActions" :key="action.label" @click="navigateTo(action.route, action.action)" class="action-btn" :title="`Navigate to ${action.label}`" :disabled="navigationLoading">
                        <i :class="[action.icon, { 'pi-spin': navigationLoading }]"></i>
                        <span>{{ action.label }}</span>
                    </button>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="recent-activity">
                <h3 class="section-title">Recent Activity</h3>
                <div class="activity-list">
                    <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                        <div class="activity-icon" :class="activity.type">
                            <i :class="activity.icon"></i>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text">{{ activity.text }}</p>
                            <p class="activity-time">{{ formatTime(activity.timestamp) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hrm-dashboard {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 1rem;
}

.dashboard-header {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.filters-section {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.filters-header h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.1rem;
    font-weight: 600;
}

.reset-filters-btn {
    background: var(--surface-100);
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.reset-filters-btn:hover {
    background: var(--surface-200);
    border-color: var(--surface-400);
}

.filters-content {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-color-secondary);
}

.filter-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: var(--surface-card);
    min-width: 200px;
    transition: border-color 0.2s;
}

.filter-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Compact Filters Styles */
.compact-filters {
    background: var(--surface-50);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
    border: 1px solid #e5e7eb;
}

.filters-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.filter-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 180px;
}

.filter-item label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.compact-filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: var(--surface-card);
    font-size: 0.9rem;
    transition: all 0.2s;
    min-width: 160px;
}

.compact-filter-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.compact-reset-btn {
    background: var(--surface-100);
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    height: fit-content;
    margin-top: 1.25rem;
}

.compact-reset-btn:hover {
    background: var(--surface-200);
    border-color: var(--surface-400);
    color: var(--text-color);
}

.compact-reset-btn i {
    font-size: 0.8rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.title-section h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
}

.dashboard-subtitle {
    color: var(--text-color-secondary);
    font-size: 1.1rem;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.period-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.period-label {
    font-weight: 600;
    color: var(--text-color);
}

.period-select {
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: var(--surface-card);
    font-size: 0.9rem;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s;
}

.period-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
    background: var(--primary-600);
    transform: translateY(-1px);
}

.refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.loading-spinner {
    text-align: center;
    color: var(--text-color-secondary);
}

.loading-spinner i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}

.additional-metrics {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.metric-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
}

.metric-card:hover {
    background: var(--surface-100);
    border-color: var(--primary-color);
    transform: translateY(-2px);
}

.metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
}

.metric-content {
    flex: 1;
}

.metric-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.metric-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
}

.summary-card {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

:root.app-dark .summary-card {
    background: var(--surface-800);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

:root.app-dark .summary-card:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
}

.card-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.employees-icon {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}
.attendance-icon {
    background: linear-gradient(135deg, #10b981, #059669);
}
.payroll-icon {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}
.leave-icon {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.card-content {
    flex: 1;
}

.card-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

:root.app-dark .card-title {
    color: var(--surface-400);
}

.card-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
}

:root.app-dark .card-value {
    color: var(--surface-0);
}

.card-change {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

:root.app-dark .card-change {
    color: var(--surface-400);
}

.card-change.positive {
    color: #10b981;
}

.charts-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.chart-container {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:root.app-dark .chart-container {
    background: var(--surface-800);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.chart-container.full-width {
    grid-column: 1 / -1;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.chart-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

:root.app-dark .chart-title {
    color: var(--surface-0);
}

.chart-actions {
    display: flex;
    gap: 0.5rem;
}

.chart-toggle-btn {
    padding: 0.5rem;
    border: 2px solid #e5e7eb;
    background: var(--surface-card);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-color-secondary);
}

.chart-toggle-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.chart-toggle-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}

.chart-content {
    height: 300px;
    position: relative;
}

.chart {
    width: 100% !important;
    height: 100% !important;
}

.quick-actions {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:root.app-dark .quick-actions {
    background: var(--surface-800);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 1rem 0;
}

:root.app-dark .section-title {
    color: var(--surface-0);
}

.action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: var(--surface-50);
    border: 2px solid var(--surface-200);
    border-radius: 12px;
    color: var(--text-color);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

:root.app-dark .action-btn {
    background: var(--surface-700);
    border-color: var(--surface-600);
    color: var(--surface-0);
}

.action-btn:hover:not(:disabled) {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
    transform: translateY(-2px);
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.action-btn.dashboard-action {
    background: #10b981;
    border-color: #10b981;
    color: white;
}

.action-btn.dashboard-action:hover:not(:disabled) {
    background: #059669;
    border-color: #059669;
    color: white;
    transform: translateY(-2px);
}

.action-btn i {
    font-size: 1.1rem;
}

.recent-activity {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:root.app-dark .recent-activity {
    background: var(--surface-800);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 8px;
    transition: all 0.2s;
}

:root.app-dark .activity-item {
    background: var(--surface-700);
}

.activity-item:hover {
    background: var(--surface-100);
    transform: translateX(4px);
}

:root.app-dark .activity-item:hover {
    background: var(--surface-600);
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
}

.activity-icon.employee {
    background: var(--primary-color);
}
.activity-icon.leave {
    background: #10b981;
}
.activity-icon.payroll {
    background: #f59e0b;
}
.activity-icon.attendance {
    background: #8b5cf6;
}

.activity-content {
    flex: 1;
}

.activity-text {
    font-weight: 500;
    color: var(--text-color);
    margin: 0 0 0.25rem 0;
}

:root.app-dark .activity-text {
    color: var(--surface-0);
}

.activity-time {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    margin: 0;
}

:root.app-dark .activity-time {
    color: var(--surface-400);
}

/* Responsive Design */
@media (max-width: 1024px) {
    .charts-section {
        grid-template-columns: 1fr;
    }

    .chart-container.full-width {
        grid-column: 1;
    }
}

@media (max-width: 768px) {
    .hrm-dashboard {
        padding: 0.5rem;
    }

    .dashboard-header {
        padding: 1.5rem;
    }

    .header-content {
        flex-direction: column;
        align-items: flex-start;
    }

    .title-section h1 {
        font-size: 2rem;
    }

    .header-actions {
        width: 100%;
        justify-content: space-between;
    }

    .compact-filters {
        padding: 0.75rem;
    }

    .filters-row {
        gap: 1rem;
    }

    .filter-item {
        min-width: 140px;
    }

    .compact-filter-select {
        min-width: 120px;
    }

    .summary-cards {
        grid-template-columns: 1fr;
    }

    .metrics-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .action-buttons {
        grid-template-columns: 1fr;
    }

    .chart-content {
        height: 250px;
    }
}

@media (max-width: 480px) {
    .dashboard-header {
        padding: 1rem;
    }

    .title-section h1 {
        font-size: 1.75rem;
    }

    .compact-filters {
        padding: 0.5rem;
    }

    .filters-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .filter-item {
        min-width: auto;
    }

    .compact-filter-select {
        min-width: auto;
        width: 100%;
    }

    .compact-reset-btn {
        margin-top: 0.5rem;
        width: 100%;
        justify-content: center;
    }

    .summary-card {
        padding: 1rem;
    }

    .card-icon {
        width: 50px;
        height: 50px;
        font-size: 1.25rem;
    }

    .card-value {
        font-size: 1.5rem;
    }

    .chart-container {
        padding: 1rem;
    }

    .chart-content {
        height: 200px;
    }
}
</style>
