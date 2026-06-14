<script setup>
import { useToast } from '@/composables/useToast';
import { hrmReportsService } from '@/services/reports/reportsService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

// State
const loading = ref(true);
const analyticsData = ref(null);
const netPayChart = ref(null);
const payeChart = ref(null);
const nssfChart = ref(null);
const nhifChart = ref(null);

// Fetch analytics data from backend
const fetchAnalyticsData = async () => {
    loading.value = true;
    try {
        // Fetch payroll analytics from backend
        const response = await hrmReportsService.getPayrollAnalytics({
            period: 'month'
        });

        if (response.success || response.data) {
            analyticsData.value = response.data;
            populateCharts();
        } else {
            throw new Error(response.message || 'Failed to fetch analytics');
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        // Set mock data if backend fails
        setMockAnalyticsData();
        populateCharts();
    } finally {
        loading.value = false;
    }
};

// Set mock data for development
const setMockAnalyticsData = () => {
    analyticsData.value = {
        net_pay: {
            current: 300000,
            previous: 500000,
            trend: -40
        },
        paye: {
            current: 300000,
            previous: 200000,
            trend: 50
        },
        nssf: {
            current: 150000,
            previous: 180000,
            trend: -16.67
        },
        nhif: {
            current: 200000,
            previous: 170000,
            trend: 17.65
        },
        total_employees: 50,
        last_payroll_month: 'Jan, 2025',
        payroll_status: 'Processed'
    };
};

// Populate chart data
const populateCharts = () => {
    const data = analyticsData.value || {};

    // Net Pay Chart
    netPayChart.value = {
        labels: ['Previous', 'Current'],
        datasets: [
            {
                label: 'Net Pay (KES)',
                data: [data.net_pay?.previous || 0, data.net_pay?.current || 0],
                backgroundColor: ['rgba(135, 206, 235, 0.8)', 'rgba(70, 180, 210, 0.8)'],
                borderColor: ['rgb(0, 100, 205)', 'rgb(0, 100, 205)'],
                borderWidth: 1
            }
        ]
    };

    // PAYE Chart
    payeChart.value = {
        labels: ['Previous', 'Current'],
        datasets: [
            {
                label: 'PAYE (KES)',
                data: [data.paye?.previous || 0, data.paye?.current || 0],
                backgroundColor: ['rgba(255, 165, 0, 0.8)', 'rgba(255, 140, 0, 0.8)'],
                borderColor: ['rgb(200, 100, 0)', 'rgb(200, 100, 0)'],
                borderWidth: 1
            }
        ]
    };

    // NSSF Chart
    nssfChart.value = {
        labels: ['Previous', 'Current'],
        datasets: [
            {
                label: 'NSSF (KES)',
                data: [data.nssf?.previous || 0, data.nssf?.current || 0],
                backgroundColor: ['rgba(144, 238, 144, 0.8)', 'rgba(100, 200, 100, 0.8)'],
                borderColor: ['rgb(50, 150, 50)', 'rgb(50, 150, 50)'],
                borderWidth: 1
            }
        ]
    };

    // NHIF Chart
    nhifChart.value = {
        labels: ['Previous', 'Current'],
        datasets: [
            {
                label: 'NHIF (KES)',
                data: [data.nhif?.previous || 0, data.nhif?.current || 0],
                backgroundColor: ['rgba(186, 85, 211, 0.8)', 'rgba(147, 112, 219, 0.8)'],
                borderColor: ['rgb(100, 50, 150)', 'rgb(100, 50, 150)'],
                borderWidth: 1
            }
        ]
    };
};

// Chart options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
        plugins: {
            legend: {
            display: true,
            position: 'bottom'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                callback: function (value) {
                    return 'KES ' + (value / 1000).toFixed(0) + 'k';
                }
            }
        }
    }
};

// Trend indicator color
const getTrendColor = (trend) => {
    if (trend > 0) return 'text-red-600'; // Increase might be bad (cost-related)
    return 'text-green-600'; // Decrease is good (for costs)
};

const getTrendIcon = (trend) => {
    return trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
};

// Navigate to reports
const navigateToReport = (reportName) => {
    router.push(`/hrm/reports/${reportName}`);
};

onMounted(() => {
    fetchAnalyticsData();
});
</script>

<template>
    <div class="payroll-analytics-container p-6 bg-gray-50 min-h-screen">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Payroll Analytics</h1>
                    <p class="text-gray-600">
                        Last payroll run:
                        <span class="font-semibold">{{ analyticsData?.last_payroll_month || 'Loading...' }}</span>
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-4xl font-bold text-primary">{{ analyticsData?.total_employees || 0 }}</div>
                    <div class="text-sm text-gray-600">Total Active Employees</div>
    </div>
            </div>
            <div v-if="analyticsData?.payroll_status" class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                Status: {{ analyticsData.payroll_status }}
            </div>
        </div>

        <!-- Analytics Charts (Trends) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Net Pay Analytics -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-money-bill text-blue-600 text-xl"></i>
                        <span>NET PAY</span>
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="space-y-2">
                        <Skeleton height="1rem"></Skeleton>
                        <Skeleton height="8rem"></Skeleton>
                    </div>
                    <div v-else class="space-y-4">
                        <Chart type="bar" :data="netPayChart" :options="chartOptions" style="height: 150px" />
                        <div v-if="analyticsData?.net_pay" class="border-t pt-3">
                            <div class="text-sm text-gray-600 mb-2">Trend vs Previous Period</div>
                            <div :class="getTrendColor(analyticsData.net_pay.trend)" class="flex items-center gap-2 text-lg font-bold">
                                <i :class="getTrendIcon(analyticsData.net_pay.trend)" class="pi"></i>
                                {{ Math.abs(analyticsData.net_pay.trend).toFixed(1) }}%
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- PAYE Analytics -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-chart-bar text-orange-600 text-xl"></i>
                        <span>PAYE</span>
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="space-y-2">
                        <Skeleton height="1rem"></Skeleton>
                        <Skeleton height="8rem"></Skeleton>
                    </div>
                    <div v-else class="space-y-4">
                        <Chart type="bar" :data="payeChart" :options="chartOptions" style="height: 150px" />
                        <div v-if="analyticsData?.paye" class="border-t pt-3">
                            <div class="text-sm text-gray-600 mb-2">Trend vs Previous Period</div>
                            <div :class="getTrendColor(analyticsData.paye.trend)" class="flex items-center gap-2 text-lg font-bold">
                                <i :class="getTrendIcon(analyticsData.paye.trend)" class="pi"></i>
                                {{ Math.abs(analyticsData.paye.trend).toFixed(1) }}%
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- NSSF Analytics -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-shield text-green-600 text-xl"></i>
                        <span>NSSF</span>
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="space-y-2">
                        <Skeleton height="1rem"></Skeleton>
                        <Skeleton height="8rem"></Skeleton>
                    </div>
                    <div v-else class="space-y-4">
                        <Chart type="bar" :data="nssfChart" :options="chartOptions" style="height: 150px" />
                        <div v-if="analyticsData?.nssf" class="border-t pt-3">
                            <div class="text-sm text-gray-600 mb-2">Trend vs Previous Period</div>
                            <div :class="getTrendColor(analyticsData.nssf.trend)" class="flex items-center gap-2 text-lg font-bold">
                                <i :class="getTrendIcon(analyticsData.nssf.trend)" class="pi"></i>
                                {{ Math.abs(analyticsData.nssf.trend).toFixed(1) }}%
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- NHIF Analytics -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-heart text-purple-600 text-xl"></i>
                        <span>NHIF/SHIF</span>
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="space-y-2">
                        <Skeleton height="1rem"></Skeleton>
                        <Skeleton height="8rem"></Skeleton>
                    </div>
                    <div v-else class="space-y-4">
                        <Chart type="bar" :data="nhifChart" :options="chartOptions" style="height: 150px" />
                        <div v-if="analyticsData?.nhif" class="border-t pt-3">
                            <div class="text-sm text-gray-600 mb-2">Trend vs Previous Period</div>
                            <div :class="getTrendColor(analyticsData.nhif.trend)" class="flex items-center gap-2 text-lg font-bold">
                                <i :class="getTrendIcon(analyticsData.nhif.trend)" class="pi"></i>
                                {{ Math.abs(analyticsData.nhif.trend).toFixed(1) }}%
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Reports Section -->
        <div class="mt-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Available Reports</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- KRA Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('p9')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-file-pdf text-red-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">KRA Reports</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">P9, P10A, Withholding Tax, CBS</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- SHA/NHIF Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('nhif')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-heart text-green-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">SHA Reports</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">NHIF/SHIF Contributions</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- NSSF Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('nssf')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-shield text-blue-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">NSSF Reports</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">NSSF Contributions</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- NITA Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('nita')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-briefcase text-orange-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">NITA Levy</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">Industrial Training Authority</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- Bank/Net Pay Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('bank-net-pay')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-building text-purple-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">Bank/Net Pay</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">Grouped by Bank Accounts</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- Muster Roll -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('muster-roll')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-list text-indigo-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">Muster Roll</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">Complete Payroll Register</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- Variance Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateToReport('variance')">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-chart-line text-cyan-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">Variance Report</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">Period Comparison Analysis</p>
                            <Button label="View Reports" icon="pi pi-arrow-right" class="w-full p-button-sm p-button-text" />
                        </div>
                    </template>
                </Card>

                <!-- Custom Reports -->
                <Card class="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <template #content>
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="pi pi-cog text-gray-600 mb-3" style="font-size: 2.5rem"></i>
                            <h3 class="text-lg font-bold text-center mb-2">Custom Reports</h3>
                            <p class="text-sm text-gray-600 text-center mb-3">Build Custom Reports</p>
                            <Button label="Coming Soon" icon="pi pi-lock" class="w-full p-button-sm p-button-secondary" disabled />
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.payroll-analytics-container {
    font-family: var(--font-family);
}

:deep(.p-card) {
    border-radius: 8px;
}

:deep(.p-card:hover) {
    transform: translateY(-2px);
}
</style>
