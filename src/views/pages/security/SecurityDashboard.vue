<template>
    <div class="security-dashboard">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Security Dashboard</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Monitor system security and audit logs</p>
            </div>
            <Button
                icon="pi pi-refresh"
                label="Refresh"
                severity="secondary"
                outlined
                @click="loadSecurityData"
                :loading="loading"
            />
        </div>

        <!-- Security Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <KPICard
                title="Active Users"
                :value="securityMetrics.active_users || 0"
                subtitle="Currently active"
                icon="pi pi-users"
                :colors="{ from: '#3b82f6', to: '#1e40af' }"
                :formatter="v => v"
            />

            <KPICard
                title="Failed Logins (24h)"
                :value="securityMetrics.failed_logins_24h || 0"
                subtitle="Last 24 hours"
                icon="pi pi-exclamation-triangle"
                :colors="{ from: '#ef4444', to: '#dc2626' }"
                :formatter="v => v"
            />

            <KPICard
                title="2FA Enabled"
                :value="securityMetrics.users_with_2fa_percentage || 0"
                subtitle="Users with 2FA"
                icon="pi pi-shield"
                :colors="{ from: '#10b981', to: '#059669' }"
                :formatter="v => v.toFixed(1) + '%'"
            />

            <KPICard
                title="Security Score"
                :value="securityMetrics.security_score || 0"
                subtitle="Overall security"
                icon="pi pi-check-circle"
                :colors="{ from: '#8b5cf6', to: '#7c3aed' }"
                :formatter="v => v + '/100'"
            />
        </div>

        <!-- Audit Logs -->
        <Card>
            <template #title>
                <div class="flex items-center justify-between">
                    <span>Recent Security Events</span>
                    <div class="flex gap-2">
                        <Dropdown
                            v-model="logFilter"
                            :options="logFilterOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Filter events"
                            class="w-48"
                        />
                        <Button
                            icon="pi pi-download"
                            label="Export"
                            severity="secondary"
                            outlined
                            size="small"
                            @click="exportAuditLogs"
                        />
                    </div>
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="filteredAuditLogs"
                    :loading="loading"
                    :paginator="true"
                    :rows="10"
                    responsiveLayout="scroll"
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-shield text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">No security events found</p>
                        </div>
                    </template>

                    <Column field="timestamp" header="Time" sortable>
                        <template #body="{ data }">
                            <span class="text-sm">{{ formatDateTime(data.timestamp) }}</span>
                        </template>
                    </Column>

                    <Column field="event_type" header="Event" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <i :class="getEventIcon(data.event_type)" :style="{ color: getEventColor(data.event_type) }"></i>
                                <span>{{ data.event_type }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="user" header="User" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <Avatar
                                    :label="data.user?.substring(0, 2).toUpperCase()"
                                    size="small"
                                    shape="circle"
                                />
                                <span>{{ data.user }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="ip_address" header="IP Address" sortable />

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <Badge
                                :value="data.status"
                                :severity="data.status === 'success' ? 'success' : 'danger'"
                            />
                        </template>
                    </Column>

                    <Column field="details" header="Details">
                        <template #body="{ data }">
                            <span class="text-sm text-gray-600 dark:text-gray-400">{{ data.details }}</span>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

<script setup>
import { KPICard } from '@/components/charts';
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { formatDateTime } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();

// State
const loading = ref(false);
const securityMetrics = ref({});
const auditLogs = ref([]);
const logFilter = ref('all');

const logFilterOptions = [
    { label: 'All Events', value: 'all' },
    { label: 'Login Attempts', value: 'login' },
    { label: 'Failed Logins', value: 'failed_login' },
    { label: 'Logout Events', value: 'logout' },
    { label: 'Permission Changes', value: 'permission_change' },
    { label: 'User Changes', value: 'user_change' }
];

// Computed
const filteredAuditLogs = computed(() => {
    if (logFilter.value === 'all') return auditLogs.value;
    return auditLogs.value.filter(log => log.event_type === logFilter.value);
});

// Methods
const loadSecurityData = async () => {
    loading.value = true;
    try {
        const [dashboardRes, logsRes] = await Promise.all([
            userManagementService.getSecurityDashboard(),
            userManagementService.getSecurityAuditLogs()
        ]);

        securityMetrics.value = dashboardRes.data || {};
        auditLogs.value = logsRes.data?.results || logsRes.data || [];
        
        showToast('success', 'Security data loaded', 'Success');
    } catch (error) {
        console.error('Error loading security data:', error);
        showToast('error', 'Failed to load security data', 'Error');
        
        // Use fallback data
        securityMetrics.value = {
            active_users: 0,
            failed_logins_24h: 0,
            users_with_2fa_percentage: 0,
            security_score: 0
        };
        auditLogs.value = [];
    } finally {
        loading.value = false;
    }
};

const getEventIcon = (eventType) => {
    const iconMap = {
        login: 'pi pi-sign-in',
        logout: 'pi pi-sign-out',
        failed_login: 'pi pi-times-circle',
        permission_change: 'pi pi-lock',
        user_change: 'pi pi-user-edit',
        password_change: 'pi pi-key'
    };
    return iconMap[eventType] || 'pi pi-info-circle';
};

const getEventColor = (eventType) => {
    const colorMap = {
        login: '#10b981',
        logout: '#3b82f6',
        failed_login: '#ef4444',
        permission_change: '#f59e0b',
        user_change: '#8b5cf6',
        password_change: '#06b6d4'
    };
    return colorMap[eventType] || '#6b7280';
};

const exportAuditLogs = () => {
    const csvContent = [
        ['Timestamp', 'Event', 'User', 'IP Address', 'Status', 'Details'],
        ...filteredAuditLogs.value.map(log => [
            formatDateTime(log.timestamp),
            log.event_type,
            log.user,
            log.ip_address,
            log.status,
            log.details
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showToast('success', 'Audit logs exported', 'Success');
};

onMounted(() => {
    loadSecurityData();
});
</script>

<style scoped>
.security-dashboard {
    @apply max-w-7xl mx-auto p-6;
}

/* Dark mode support */
:global(.dark) .security-dashboard {
    @apply text-gray-100;
}

:global(.dark) :deep(.p-card) {
    @apply bg-gray-800 border-gray-700;
}

:global(.dark) :deep(.p-datatable) {
    @apply bg-gray-800;
}

:global(.dark) :deep(.p-datatable .p-datatable-thead > tr > th) {
    @apply bg-gray-900 border-gray-700;
}

:global(.dark) :deep(.p-datatable .p-datatable-tbody > tr) {
    @apply bg-gray-800 border-gray-700;
}
</style>

