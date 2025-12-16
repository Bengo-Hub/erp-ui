<script setup>
import { useChartOptions } from '@/composables/useChartOptions';
import { useDashboardState } from '@/composables/useDashboardState';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { dashboardService } from '@/services/shared/dashboardService';
import { PERIOD_OPTIONS } from '@/utils/constants';
import Chart from 'primevue/chart';
import { formatCurrency, safeNumber } from '@/utils/formatters';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { barChartOptions, pieChartOptions } = useChartOptions();
const { state, executeDataFetch } = useDashboardState();
const { hasPermission, hasAnyPermission } = usePermissions();

const loading = ref(false);
const period = ref('month');
const periodOptions = PERIOD_OPTIONS;

// CRM dashboard data
const dashboardData = ref({
    total_contacts: 0,
    total_leads: 0,
    total_deals: 0,
    deal_value: 0,
    conversion_rate: 0,
    average_deal_size: 0,
    pipeline_value: 0,
    win_rate: 0,
    top_sales_representatives: [],
    lead_sources: [],
    deal_stages: [],
    recent_activities: [],
    sales_pipeline: []
});

// Chart data
const leadSourcesChartData = ref(null);
const dealStagesChartData = ref(null);
const salesPipelineChartData = ref(null);
const representativesChartData = ref(null);

// Load dashboard data
const loadDashboardData = async () => {
    loading.value = true;

    const result = await executeDataFetch(
        () => dashboardService.getCRMDashboardData(period.value),
        null,
        `CRM data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`
    );

    if (result) {
        dashboardData.value = result.data || result;
        processChartData();
    }

    loading.value = false;
};

// Process chart data for visualization
const processChartData = () => {
    // Lead sources chart (pie)
    if (dashboardData.value.lead_sources?.length > 0) {
        leadSourcesChartData.value = {
            labels: dashboardData.value.lead_sources.map((item) => item.source),
            datasets: [
                {
                    data: dashboardData.value.lead_sources.map((item) => item.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF']
                }
            ]
        };
    }

    // Deal stages chart (bar)
    if (dashboardData.value.deal_stages?.length > 0) {
        dealStagesChartData.value = {
            labels: dashboardData.value.deal_stages.map((item) => item.stage),
            datasets: [
                {
                    label: 'Deal Value',
                    data: dashboardData.value.deal_stages.map((item) => item.value),
                    backgroundColor: '#42A5F5',
                    borderColor: '#1E88E5',
                    borderWidth: 1
                }
            ]
        };
    }

    // Sales pipeline chart
    if (dashboardData.value.sales_pipeline?.length > 0) {
        salesPipelineChartData.value = {
            labels: dashboardData.value.sales_pipeline.map((item) => item.rep_name),
            datasets: [
                {
                    label: 'Pipeline Value',
                    data: dashboardData.value.sales_pipeline.map((item) => item.pipeline_value),
                    backgroundColor: '#66BB6A',
                    borderColor: '#43A047',
                    borderWidth: 1
                }
            ]
        };
    }

    // Top representatives chart
    if (dashboardData.value.top_sales_representatives?.length > 0) {
        representativesChartData.value = {
            labels: dashboardData.value.top_sales_representatives.map((item) => item.name),
            datasets: [
                {
                    label: 'Revenue',
                    data: dashboardData.value.top_sales_representatives.map((item) => item.revenue),
                    backgroundColor: '#FFA726',
                    borderColor: '#FB8C00',
                    borderWidth: 1
                }
            ]
        };
    }
};

// Navigation functions
const navigateToLeads = () => {
    router.push('/crm/leads');
};

const navigateToDealss = () => {
    router.push('/crm/deals');
};

const navigateToContacts = () => {
    router.push('/crm/contacts');
};

const navigateToCampaigns = () => {
    router.push('/crm/campaigns');
};

// Permission-gated visibility
const canViewContacts = hasPermission('view_contact');
const canViewLeads = hasPermission('view_lead');
const canViewDeals = hasPermission('view_deal');
const canViewCampaigns = hasPermission('view_campaign');
const canViewPipeline = hasAnyPermission(['view_deal', 'view_pipelinestage']);

// Watch for period changes
watch(period, () => {
    loadDashboardData();
});

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="crm-dashboard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
            <Dropdown v-model="period" :options="periodOptions" option-label="label" option-value="value" placeholder="Select Period" class="w-48" />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else class="space-y-6">
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card v-if="canViewContacts" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Total Contacts</span>
                            <i class="pi pi-users text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_contacts.toLocaleString() }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewLeads" class="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Active Leads</span>
                            <i class="pi pi-inbox text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_leads.toLocaleString() }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewDeals" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Open Deals</span>
                            <i class="pi pi-briefcase text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ dashboardData.total_deals.toLocaleString() }}
                        </div>
                    </template>
                </Card>

                <Card v-if="canViewDeals" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Pipeline Value</span>
                            <i class="pi pi-dollar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ formatCurrency(safeNumber(dashboardData.pipeline_value, 0)) }}
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Performance Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Conversion Rate</span>
                            <i class="pi pi-chart-line text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ (Number.isFinite(Number(dashboardData.conversion_rate)) ? (Number(dashboardData.conversion_rate) * 100).toFixed(1) : '0.0') }}%
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Average Deal Size</span>
                            <i class="pi pi-chart-bar text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ formatCurrency(safeNumber(dashboardData.average_deal_size, 0)) }}
                        </div>
                    </template>
                </Card>

                <Card class="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Win Rate</span>
                            <i class="pi pi-check-circle text-2xl opacity-75"></i>
                        </div>
                    </template>
                    <template #content>
                        <div class="text-3xl font-bold">
                            {{ (dashboardData.win_rate * 100).toFixed(1) }}%
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Lead Sources -->
                <Card v-if="canViewLeads">
                    <template #title>Lead Sources</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="leadSourcesChartData" type="pie" :data="leadSourcesChartData" :options="pieChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No lead data available</div>
                        </div>
                    </template>
                </Card>

                <!-- Deal Stages -->
                <Card v-if="canViewDeals">
                    <template #title>Deal Stages</template>
                    <template #content>
                        <div class="h-80">
                            <Chart v-if="dealStagesChartData" type="bar" :data="dealStagesChartData" :options="barChartOptions" class="h-full" />
                            <div v-else class="flex items-center justify-center h-full text-gray-500">No deal data available</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Sales Pipeline Chart -->
            <Card v-if="canViewPipeline">
                <template #title>Sales Pipeline by Representative</template>
                <template #content>
                    <div class="h-80">
                        <Chart v-if="salesPipelineChartData" type="bar" :data="salesPipelineChartData" :options="barChartOptions" class="h-full" />
                        <div v-else class="flex items-center justify-center h-full text-gray-500">No pipeline data available</div>
                    </div>
                </template>
            </Card>

            <!-- Top Representatives Table -->
            <Card v-if="canViewDeals || canViewLeads">
                <template #title>Top Sales Representatives</template>
                <template #content>
                    <DataTable :value="dashboardData.top_sales_representatives" :rows="5" striped-rows class="p-datatable-sm">
                        <Column field="name" header="Representative" sortable></Column>
                        <Column field="deals_closed" header="Deals Closed" sortable></Column>
                        <Column field="revenue" header="Revenue" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(safeNumber(slotProps.data.revenue, 0)) }}
                            </template>
                        </Column>
                        <Column field="conversion_rate" header="Conversion %" sortable>
                            <template #body="slotProps">
                                {{ (Number.isFinite(Number(slotProps.data.conversion_rate)) ? (Number(slotProps.data.conversion_rate) * 100).toFixed(1) : '0.0') }}%
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
                        <Button v-if="canViewLeads" label="Manage Leads" icon="pi pi-inbox" class="p-button-outlined" @click="navigateToLeads" />
                        <Button v-if="canViewDeals" label="View Deals" icon="pi pi-briefcase" class="p-button-outlined" @click="navigateToDealss" />
                        <Button v-if="canViewContacts" label="Contacts" icon="pi pi-users" class="p-button-outlined" @click="navigateToContacts" />
                        <Button v-if="canViewCampaigns" label="Campaigns" icon="pi pi-send" class="p-button-outlined" @click="navigateToCampaigns" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.crm-dashboard {
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
