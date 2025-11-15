<template>
    <div class="p-4 md:p-6">
        <div class="mb-6">
            <h1 class="text-2xl md:text-3xl font-bold">ICT Dashboard</h1>
            <p class="text-surface-500 mt-1">Systems overview, security, integrations and performance.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card v-if="true">
                <template #title>System Health</template>
                <template #content>
                    <div class="flex items-center gap-3">
                        <i class="pi pi-heart text-green-500 text-3xl"></i>
                        <div>
                            <p class="text-sm text-surface-500">Status</p>
                            <p class="text-lg font-semibold">Operational</p>
                        </div>
                    </div>
                </template>
            </Card>
            <Card v-if="true">
                <template #title>API Latency</template>
                <template #content>
                    <div class="flex items-center gap-3">
                        <i class="pi pi-bolt text-yellow-500 text-3xl"></i>
                        <div>
                            <p class="text-sm text-surface-500">P95</p>
                            <p class="text-lg font-semibold">OK</p>
                        </div>
                    </div>
                </template>
            </Card>
            <Card v-if="canViewSecurity">
                <template #title>Security Settings</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings')">
                        <i class="pi pi-shield text-blue-500 text-3xl"></i>
                        <div>
                            <p class="text-sm text-surface-500">Access & Policies</p>
                            <p class="text-lg font-semibold">Manage Security</p>
                        </div>
                    </button>
                </template>
            </Card>
            <Card v-if="canViewIntegrations">
                <template #title>Integrations</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings/integrations/kra')">
                        <i class="pi pi-cog text-purple-500 text-3xl"></i>
                        <div>
                            <p class="text-sm text-surface-500">KRA eTIMS</p>
                            <p class="text-lg font-semibold">Configure Integration</p>
                        </div>
                    </button>
                </template>
            </Card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card v-if="canViewApprovals" class="lg:col-span-2">
                <template #title>Approval Workflows</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings/approvals')">
                        <i class="pi pi-check-square text-2xl text-green-500"></i>
                        <div>
                            <p class="text-sm text-surface-500">Workflows</p>
                            <p class="text-lg font-semibold">Configure Steps</p>
                        </div>
                    </button>
                </template>
            </Card>
            <Card v-if="canViewBranding">
                <template #title>Branding</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings/branding')">
                        <i class="pi pi-sliders-h text-2xl text-indigo-500"></i>
                        <div>
                            <p class="text-sm text-surface-500">Theme & Logos</p>
                            <p class="text-lg font-semibold">Branding & UI</p>
                        </div>
                    </button>
                </template>
            </Card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card v-if="canViewDepartments">
                <template #title>HR Structure</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings/hrm/departments')">
                        <i class="pi pi-sitemap text-2xl text-emerald-500"></i>
                        <div>
                            <p class="text-sm text-surface-500">Departments & Regions</p>
                            <p class="text-lg font-semibold">Manage structure</p>
                        </div>
                    </button>
                </template>
            </Card>
            <Card v-if="canViewTaxes">
                <template #title>Finance Taxes</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings/finance/taxes')">
                        <i class="pi pi-percentage text-2xl text-rose-500"></i>
                        <div>
                            <p class="text-sm text-surface-500">Taxes</p>
                            <p class="text-lg font-semibold">Configure tax rules</p>
                        </div>
                    </button>
                </template>
            </Card>
            <Card v-if="canViewSystemSettings">
                <template #title>System Settings</template>
                <template #content>
                    <button class="flex items-center gap-3" @click="navigateTo('/settings')">
                        <i class="pi pi-cog text-2xl text-sky-500"></i>
                        <div>
                            <p class="text-sm text-surface-500">Configuration</p>
                            <p class="text-lg font-semibold">System Configuration</p>
                        </div>
                    </button>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { useRouter } from 'vue-router';
const router = useRouter();
const { hasAnyPermission } = usePermissions();

const canViewSystemSettings = hasAnyPermission(['view_appsettings', 'change_appsettings']);
const canViewBranding = hasAnyPermission(['view_brandingsettings', 'change_brandingsettings']);
const canViewApprovals = hasAnyPermission(['view_approvalworkflow', 'change_approvalworkflow']);
const canViewIntegrations = hasAnyPermission(['view_integrations', 'view_krasettings']);
const canViewSecurity = hasAnyPermission(['view_securitysettings', 'change_securitysettings']);
const canViewDepartments = hasAnyPermission(['view_departments', 'view_regions']);
const canViewTaxes = hasAnyPermission(['view_tax', 'view_taxrates']);

const navigateTo = (path) => router.push(path);
</script>

<style scoped>
</style>


