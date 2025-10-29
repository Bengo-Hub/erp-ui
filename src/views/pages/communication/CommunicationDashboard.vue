<script setup>
import { useToast } from '@/composables/useToast';
import { communicationService } from '@/services/shared/communicationService';
import { onMounted, ref } from 'vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

// PrimeVue components
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const dashboardData = ref({});
const analyticsData = ref({});
const recentActivity = ref([]);
const bounceRecords = ref([]);
const spamRules = ref([]);

// Dialog states
const showContentTestDialog = ref(false);
const showABTestDialog = ref(false);
const showBouncesDialog = ref(false);
const showSpamRulesDialog = ref(false);
const showAddRuleDialog = ref(false);
const showPeriodMenu = ref(false);

// Loading states
const testingContent = ref(false);
const creatingTest = ref(false);
const loadingBounces = ref(false);
const loadingSpamRules = ref(false);

// Form data
const contentTest = ref({
    type: 'email',
    content: ''
});
const contentTestResult = ref(null);
const abTest = ref({
    name: '',
    test_type: 'content_test',
    variant_a: { content: '' },
    variant_b: { content: '' },
    success_metric: 'open_rate',
    minimum_sample_size: 100,
    significance_level: 0.05
});

// Options
const selectedPeriod = ref('Last 30 Days');
const periodOptions = ref([
    { label: 'Last 7 Days', command: () => setPeriod(7) },
    { label: 'Last 30 Days', command: () => setPeriod(30) },
    { label: 'Last 90 Days', command: () => setPeriod(90) }
]);

const contentTypes = ref([
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' }
]);

const testTypes = ref([
    { label: 'Content Test', value: 'content_test' },
    { label: 'Template Test', value: 'template_test' },
    { label: 'A/B Test', value: 'ab_test' }
]);

const successMetrics = ref([
    { label: 'Open Rate', value: 'open_rate' },
    { label: 'Click Rate', value: 'click_rate' },
    { label: 'Delivery Rate', value: 'delivery_rate' }
]);

// Methods
const loadDashboardData = async () => {
    try {
        loading.value = true;
        const data = await communicationService.getDashboardData();
        dashboardData.value = data;

        // Load analytics by type
        const { startDate, endDate } = communicationService.getDateRange(30);
        const analytics = await communicationService.getAnalyticsByType(startDate, endDate);
        analyticsData.value = analytics;

        // Mock recent activity (replace with actual API call)
        recentActivity.value = [
            { type: 'email', description: 'Order confirmation sent', timestamp: new Date(), status: 'sent' },
            { type: 'sms', description: 'Payment reminder sent', timestamp: new Date(Date.now() - 3600000), status: 'delivered' },
            { type: 'bounce', description: 'Hard bounce recorded', timestamp: new Date(Date.now() - 7200000), status: 'failed' }
        ];
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('error', 'Failed to load dashboard data');
    } finally {
        loading.value = false;
    }
};

const testContent = async () => {
    try {
        testingContent.value = true;
        const result = await communicationService.testContent(contentTest.value.content, contentTest.value.type);
        contentTestResult.value = result;

        showToast({
            severity: result.is_spam ? 'warn' : 'success',
            summary: result.is_spam ? 'Content Blocked' : 'Content Passed',
            detail: result.reason,
            life: 3000
        });
    } catch (error) {
        console.error('Error testing content:', error);
        showToast('error', 'Failed to test content');
    } finally {
        testingContent.value = false;
    }
};

const createABTest = async () => {
    try {
        creatingTest.value = true;
        const test = await communicationService.createABTest(abTest.value);

        showToast('success', 'A/B test created successfully');

        showABTestDialog.value = false;
        // Reset form
        abTest.value = {
            name: '',
            test_type: 'content_test',
            variant_a: { content: '' },
            variant_b: { content: '' },
            success_metric: 'open_rate',
            minimum_sample_size: 100,
            significance_level: 0.05
        };
    } catch (error) {
        console.error('Error creating A/B test:', error);
        showToast('error', 'Failed to create A/B test');
    } finally {
        creatingTest.value = false;
    }
};

const loadBounceData = async () => {
    try {
        loadingBounces.value = true;
        const { startDate, endDate } = communicationService.getDateRange(30);
        const summary = await communicationService.getBounceSummary(startDate, endDate);
        const suppressed = await communicationService.getSuppressedRecipients();

        // Mock bounce records (replace with actual API call)
        bounceRecords.value = [
            { recipient: 'test@example.com', communication_type: 'email', bounce_type: 'hard', is_suppressed: true, created_at: new Date() },
            { recipient: '+254700000000', communication_type: 'sms', bounce_type: 'soft', is_suppressed: false, created_at: new Date(Date.now() - 3600000) }
        ];
    } catch (error) {
        console.error('Error loading bounce data:', error);
        showToast('error', 'Failed to load bounce data');
    } finally {
        loadingBounces.value = false;
    }
};

const loadSpamRules = async () => {
    try {
        loadingSpamRules.value = true;
        const rules = await communicationService.getSpamRules();
        spamRules.value = rules;
    } catch (error) {
        console.error('Error loading spam rules:', error);
        showToast('error', 'Failed to load spam rules');
    } finally {
        loadingSpamRules.value = false;
    }
};

const setPeriod = (days) => {
    selectedPeriod.value = `Last ${days} Days`;
    loadDashboardData();
};

const getSeverity = (type) => {
    const severities = {
        email: 'info',
        sms: 'warning',
        bounce: 'danger'
    };
    return severities[type] || 'info';
};

const getStatusSeverity = (status) => {
    const severities = {
        sent: 'success',
        delivered: 'success',
        failed: 'danger',
        pending: 'warning'
    };
    return severities[status] || 'info';
};

const getBounceSeverity = (bounceType) => {
    const severities = {
        hard: 'danger',
        soft: 'warning',
        spam: 'danger',
        unsubscribed: 'info'
    };
    return severities[bounceType] || 'info';
};

const getActionSeverity = (action) => {
    const severities = {
        block: 'danger',
        flag: 'warning',
        quarantine: 'warning',
        allow: 'success'
    };
    return severities[action] || 'info';
};

// Lifecycle
onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="communication-dashboard">
        <div class="grid">
            <!-- Header -->
            <div class="col-12">
                <div class="card">
                    <h1 class="text-3xl font-bold mb-4">
                        <i class="pi pi-envelope mr-2"></i>
                        Communication Dashboard
                    </h1>
                    <p class="text-gray-600 mb-4">Monitor and manage all communication activities including analytics, bounce handling, spam prevention, and testing.</p>
                </div>
            </div>

            <!-- Overview Cards -->
            <div class="col-12 md:col-3">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Total Sent</span>
                            <div class="text-900 font-medium text-xl">{{ dashboardData.analytics?.total_sent || 0 }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-send text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">+{{ dashboardData.analytics?.delivery_rate || 0 }}% </span>
                    <span class="text-500">delivery rate</span>
                </div>
            </div>

            <div class="col-12 md:col-3">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Bounces</span>
                            <div class="text-900 font-medium text-xl">{{ dashboardData.bounces?.total_bounces || 0 }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">{{ dashboardData.bounces?.hard_bounces || 0 }} </span>
                    <span class="text-500">hard bounces</span>
                </div>
            </div>

            <div class="col-12 md:col-3">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Active Tests</span>
                            <div class="text-900 font-medium text-xl">{{ dashboardData.active_tests || 0 }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-chart-line text-purple-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-purple-500 font-medium">{{ dashboardData.spam_rules || 0 }} </span>
                    <span class="text-500">spam rules</span>
                </div>
            </div>

            <div class="col-12 md:col-3">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Suppressed</span>
                            <div class="text-900 font-medium text-xl">{{ dashboardData.bounces?.suppressed_recipients || 0 }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-red-100 border-round" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-ban text-red-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">Suppressed </span>
                    <span class="text-500">recipients</span>
                </div>
            </div>

            <!-- Analytics Chart -->
            <div class="col-12 md:col-8">
                <div class="card">
                    <h5 class="text-xl font-bold mb-4">Communication Analytics</h5>
                    <div class="flex align-items-center justify-content-between mb-4">
                        <div class="flex gap-2">
                            <Button :label="selectedPeriod" icon="pi pi-calendar" @click="showPeriodMenu = true" class="p-button-outlined" />
                            <Menu ref="periodMenu" :model="periodOptions" :popup="true" />
                        </div>
                        <div class="flex gap-2">
                            <Button label="Refresh" icon="pi pi-refresh" @click="loadDashboardData" :loading="loading" class="p-button-outlined" />
                        </div>
                    </div>

                    <div v-if="analyticsData" class="grid">
                        <div class="col-12 md:col-6">
                            <h6 class="text-lg font-semibold mb-3">Email Analytics</h6>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span>Delivery Rate:</span>
                                    <span class="font-semibold">{{ analyticsData.email?.delivery_rate || 0 }}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Open Rate:</span>
                                    <span class="font-semibold">{{ analyticsData.email?.open_rate || 0 }}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Click Rate:</span>
                                    <span class="font-semibold">{{ analyticsData.email?.click_rate || 0 }}%</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <h6 class="text-lg font-semibold mb-3">SMS Analytics</h6>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span>Delivery Rate:</span>
                                    <span class="font-semibold">{{ analyticsData.sms?.delivery_rate || 0 }}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Total Sent:</span>
                                    <span class="font-semibold">{{ analyticsData.sms?.total_sent || 0 }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Failed:</span>
                                    <span class="font-semibold text-red-500">{{ analyticsData.sms?.total_failed || 0 }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="col-12 md:col-4">
                <div class="card">
                    <h5 class="text-xl font-bold mb-4">Quick Actions</h5>
                    <div class="space-y-3">
                        <Button label="Test Content" icon="pi pi-search" @click="showContentTestDialog = true" class="w-full p-button-outlined" />
                        <Button label="Create A/B Test" icon="pi pi-plus" @click="showABTestDialog = true" class="w-full p-button-outlined" />
                        <Button label="View Bounces" icon="pi pi-exclamation-triangle" @click="showBouncesDialog = true" class="w-full p-button-outlined" />
                        <Button label="Spam Rules" icon="pi pi-shield" @click="showSpamRulesDialog = true" class="w-full p-button-outlined" />
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="col-12">
                <div class="card">
                    <h5 class="text-xl font-bold mb-4">Recent Activity</h5>
                    <DataTable :value="recentActivity" :loading="loading" responsiveLayout="scroll">
                        <Column field="type" header="Type">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.type" :severity="getSeverity(slotProps.data.type)" />
                            </template>
                        </Column>
                        <Column field="description" header="Description" />
                        <Column field="timestamp" header="Time">
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.timestamp) }}
                            </template>
                        </Column>
                        <Column field="status" header="Status">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Content Test Dialog -->
        <Dialog v-model:visible="showContentTestDialog" header="Test Content" :style="{ width: '50vw' }" :modal="true">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Content Type</label>
                    <Dropdown v-model="contentTest.type" :options="contentTypes" optionLabel="label" optionValue="value" placeholder="Select content type" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Content</label>
                    <Textarea v-model="contentTest.content" rows="5" placeholder="Enter content to test..." class="w-full" />
                </div>
                <div v-if="contentTestResult" class="p-4 border-round" :class="contentTestResult.is_spam ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'">
                    <div class="flex align-items-center gap-2 mb-2">
                        <i :class="contentTestResult.is_spam ? 'pi pi-exclamation-triangle text-red-500' : 'pi pi-check-circle text-green-500'"></i>
                        <span class="font-semibold">{{ contentTestResult.is_spam ? 'Content Blocked' : 'Content Passed' }}</span>
                    </div>
                    <p class="text-sm">{{ contentTestResult.reason }}</p>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="showContentTestDialog = false" class="p-button-text" />
                <Button label="Test" icon="pi pi-search" @click="testContent" :loading="testingContent" />
            </template>
        </Dialog>

        <!-- A/B Test Dialog -->
        <Dialog v-model:visible="showABTestDialog" header="Create A/B Test" :style="{ width: '70vw' }" :modal="true">
            <div class="space-y-4">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label class="block text-sm font-medium mb-2">Test Name</label>
                        <InputText v-model="abTest.name" placeholder="Enter test name" class="w-full" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block text-sm font-medium mb-2">Test Type</label>
                        <Dropdown v-model="abTest.test_type" :options="testTypes" optionLabel="label" optionValue="value" placeholder="Select test type" class="w-full" />
                    </div>
                </div>
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label class="block text-sm font-medium mb-2">Variant A</label>
                        <Textarea v-model="abTest.variant_a.content" rows="4" placeholder="Enter variant A content..." class="w-full" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block text-sm font-medium mb-2">Variant B</label>
                        <Textarea v-model="abTest.variant_b.content" rows="4" placeholder="Enter variant B content..." class="w-full" />
                    </div>
                </div>
                <div class="grid">
                    <div class="col-12 md:col-4">
                        <label class="block text-sm font-medium mb-2">Success Metric</label>
                        <Dropdown v-model="abTest.success_metric" :options="successMetrics" optionLabel="label" optionValue="value" placeholder="Select metric" class="w-full" />
                    </div>
                    <div class="col-12 md:col-4">
                        <label class="block text-sm font-medium mb-2">Minimum Sample Size</label>
                        <InputNumber v-model="abTest.minimum_sample_size" placeholder="100" class="w-full" />
                    </div>
                    <div class="col-12 md:col-4">
                        <label class="block text-sm font-medium mb-2">Significance Level</label>
                        <InputNumber v-model="abTest.significance_level" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.05" class="w-full" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="showABTestDialog = false" class="p-button-text" />
                <Button label="Create Test" icon="pi pi-plus" @click="createABTest" :loading="creatingTest" />
            </template>
        </Dialog>

        <!-- Bounces Dialog -->
        <Dialog v-model:visible="showBouncesDialog" header="Bounce Records" :style="{ width: '80vw' }" :modal="true">
            <div class="space-y-4">
                <div class="flex justify-content-between align-items-center">
                    <h6 class="text-lg font-semibold">Recent Bounces</h6>
                    <Button label="Refresh" icon="pi pi-refresh" @click="loadBounceData" :loading="loadingBounces" class="p-button-outlined" />
                </div>
                <DataTable :value="bounceRecords" :loading="loadingBounces" responsiveLayout="scroll">
                    <Column field="recipient" header="Recipient" />
                    <Column field="communication_type" header="Type">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.communication_type" :severity="slotProps.data.communication_type === 'email' ? 'info' : 'warning'" />
                        </template>
                    </Column>
                    <Column field="bounce_type" header="Bounce Type">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.bounce_type" :severity="getBounceSeverity(slotProps.data.bounce_type)" />
                        </template>
                    </Column>
                    <Column field="is_suppressed" header="Suppressed">
                        <template #body="slotProps">
                            <i :class="slotProps.data.is_suppressed ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                        </template>
                    </Column>
                    <Column field="created_at" header="Date">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.created_at) }}
                        </template>
                    </Column>
                </DataTable>
            </div>
        </Dialog>

        <!-- Spam Rules Dialog -->
        <Dialog v-model:visible="showSpamRulesDialog" header="Spam Prevention Rules" :style="{ width: '80vw' }" :modal="true">
            <div class="space-y-4">
                <div class="flex justify-content-between align-items-center">
                    <h6 class="text-lg font-semibold">Active Rules</h6>
                    <Button label="Add Rule" icon="pi pi-plus" @click="showAddRuleDialog = true" />
                </div>
                <DataTable :value="spamRules" :loading="loadingSpamRules" responsiveLayout="scroll">
                    <Column field="name" header="Rule Name" />
                    <Column field="rule_type" header="Type">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.rule_type" severity="info" />
                        </template>
                    </Column>
                    <Column field="is_active" header="Active">
                        <template #body="slotProps">
                            <i :class="slotProps.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                        </template>
                    </Column>
                    <Column field="priority" header="Priority" />
                    <Column field="action" header="Action">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.action" :severity="getActionSeverity(slotProps.data.action)" />
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editRule(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" @click="deleteRule(slotProps.data.id)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.communication-dashboard {
    padding: 1rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}
</style>
