<template>
    <div class="system-config-container min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">System Configuration</h1>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage system-wide settings and configurations
                    </p>
                </div>
                <div class="flex gap-3">
                    <Button
                        icon="pi pi-home"
                        label="Home"
                        severity="secondary"
                        outlined
                        @click="router.push('/')"
                    />
                </div>
            </div>
        </div>

        <!-- Configuration Cards Grid -->
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Business Settings -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/business')">
                    <template #header>
                        <div class="bg-gradient-to-r from-blue-500 to-blue-700 p-6">
                            <i class="pi pi-building text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Business Settings</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Configure business details, branches, branding, and operational parameters
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Business Details" severity="info" />
                            <Badge value="Branches" severity="info" />
                            <Badge value="Branding" severity="info" />
                            <Badge value="Taxes" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Configure</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- Departments & Regions -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/departments')">
                    <template #header>
                        <div class="bg-gradient-to-r from-purple-500 to-purple-700 p-6">
                            <i class="pi pi-sitemap text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Organizational Structure</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Manage departments, regions, and organizational hierarchy
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Departments" severity="info" />
                            <Badge value="Regions" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Manage</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- Approval Workflows -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/approvals')">
                    <template #header>
                        <div class="bg-gradient-to-r from-green-500 to-green-700 p-6">
                            <i class="pi pi-check-circle text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Approval Workflows</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Configure approval workflows for different modules and processes
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Workflows" severity="info" />
                            <Badge value="Approvers" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Configure</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- Tax Settings -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/finance/taxes')">
                    <template #header>
                        <div class="bg-gradient-to-r from-amber-500 to-amber-700 p-6">
                            <i class="pi pi-percentage text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Tax Configuration</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Manage tax rates and VAT configurations for transactions
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Tax Rates" severity="info" />
                            <Badge value="VAT" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Manage</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- Payroll Settings -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/payroll/formulas')">
                    <template #header>
                        <div class="bg-gradient-to-r from-pink-500 to-pink-700 p-6">
                            <i class="pi pi-calculator text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Payroll Configuration</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Configure payroll formulas, components, and scheduled payslips
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Formulas" severity="info" />
                            <Badge value="Components" severity="info" />
                            <Badge value="Schedules" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Configure</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- KRA eTIMS Integration -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/integrations/kra')">
                    <template #header>
                        <div class="bg-gradient-to-r from-red-500 to-red-700 p-6">
                            <i class="pi pi-globe text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">KRA eTIMS Integration</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Configure KRA eTIMS credentials and endpoint settings
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Credentials" severity="info" />
                            <Badge value="Endpoints" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Setup</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- HRM Appraisal Config -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/settings/hrm/appraisals/configuration')">
                    <template #header>
                        <div class="bg-gradient-to-r from-teal-500 to-teal-700 p-6">
                            <i class="pi pi-star text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Appraisal Configuration</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Configure employee appraisal cycles, templates, and workflows
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Cycles" severity="info" />
                            <Badge value="Templates" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Configure</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- Security Settings -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/security/settings')">
                    <template #header>
                        <div class="bg-gradient-to-r from-indigo-500 to-indigo-700 p-6">
                            <i class="pi pi-shield text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Security Settings</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Configure 2FA, password policies, and security measures
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="2FA" severity="info" />
                            <Badge value="Password Policy" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Manage</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>

                <!-- Backups -->
                <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/security/backups')">
                    <template #header>
                        <div class="bg-gradient-to-r from-cyan-500 to-cyan-700 p-6">
                            <i class="pi pi-database text-white text-4xl"></i>
                        </div>
                    </template>
                    <template #title>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Backup Management</h3>
                    </template>
                    <template #content>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">
                            Create, restore, and schedule database backups
                        </p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <Badge value="Backups" severity="info" />
                            <Badge value="Schedules" severity="info" />
                            <Badge value="Storage" severity="info" />
                        </div>
                    </template>
                    <template #footer>
                        <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            <span>Manage</span>
                            <i class="pi pi-arrow-right ml-2"></i>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Quick Stats -->
            <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <i class="pi pi-building text-blue-600 dark:text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm">Active Modules</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">12</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <i class="pi pi-sitemap text-purple-600 dark:text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm">Departments</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.departments }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm">Active Workflows</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.workflows }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <i class="pi pi-shield text-indigo-600 dark:text-indigo-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm">Security Score</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.securityScore }}/100</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <Card class="mt-8">
                <template #header>
                    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Configuration Changes</h3>
                    </div>
                </template>
                <template #content>
                    <div v-if="loadingActivity" class="text-center py-8">
                        <ProgressSpinner style="width:50px;height:50px" />
                    </div>
                    <div v-else>
                        <Timeline :value="recentActivity" align="alternate" class="customized-timeline">
                            <template #marker="slotProps">
                                <span :class="['flex items-center justify-center w-8 h-8 rounded-full', getActivityColor(slotProps.item.type)]">
                                    <i :class="getActivityIcon(slotProps.item.type)"></i>
                                </span>
                            </template>
                            <template #content="slotProps">
                                <Card>
                                    <template #title>
                                        <span class="text-sm font-semibold">{{ slotProps.item.title }}</span>
                                    </template>
                                    <template #subtitle>
                                        <span class="text-xs text-gray-600 dark:text-gray-400">{{ slotProps.item.subtitle }}</span>
                                    </template>
                                    <template #content>
                                        <p class="text-sm text-gray-700 dark:text-gray-300">{{ slotProps.item.description }}</p>
                                        <p class="text-xs text-gray-500 mt-2">{{ formatDateTime(slotProps.item.timestamp) }}</p>
                                    </template>
                                </Card>
                            </template>
                        </Timeline>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { formatDateTime } from '@/utils/formatters';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();

// State
const loadingActivity = ref(false);
const stats = ref({
    departments: 0,
    workflows: 0,
    securityScore: 0
});

const recentActivity = ref([
    {
        type: 'business',
        title: 'Business Settings Updated',
        subtitle: 'By Admin',
        description: 'Updated business details and branding',
        timestamp: new Date()
    },
    {
        type: 'security',
        title: 'Password Policy Changed',
        subtitle: 'By System',
        description: 'Updated minimum password length to 12 characters',
        timestamp: new Date(Date.now() - 3600000)
    },
    {
        type: 'approval',
        title: 'New Approval Workflow',
        subtitle: 'By HR Manager',
        description: 'Added approval workflow for leave requests',
        timestamp: new Date(Date.now() - 7200000)
    }
]);

// Methods
const navigateTo = (path) => {
    router.push(path);
};

const loadStats = async () => {
    try {
        const [deptsRes, workflowsRes] = await Promise.all([
            systemConfigService.getDepartments(),
            systemConfigService.getApprovalSettings()
        ]);

        stats.value.departments = deptsRes.data?.length || deptsRes.data?.results?.length || 0;
        stats.value.workflows = Array.isArray(workflowsRes) ? workflowsRes.length : 0;
        stats.value.securityScore = 85; // This would come from security dashboard
    } catch (error) {
        console.error('Error loading stats:', error);
    }
};

const getActivityIcon = (type) => {
    const icons = {
        business: 'pi pi-building text-white',
        security: 'pi pi-shield text-white',
        approval: 'pi pi-check-circle text-white',
        department: 'pi pi-sitemap text-white',
        payroll: 'pi pi-calculator text-white',
        tax: 'pi pi-percentage text-white'
    };
    return icons[type] || 'pi pi-cog text-white';
};

const getActivityColor = (type) => {
    const colors = {
        business: 'bg-blue-500',
        security: 'bg-indigo-500',
        approval: 'bg-green-500',
        department: 'bg-purple-500',
        payroll: 'bg-pink-500',
        tax: 'bg-amber-500'
    };
    return colors[type] || 'bg-gray-500';
};

// Lifecycle
onMounted(() => {
    loadStats();
});
</script>

<style scoped>
.system-config-container {
    min-height: 100vh;
}

:deep(.customized-timeline) .p-timeline-event-content {
    line-height: 1;
}
</style>

