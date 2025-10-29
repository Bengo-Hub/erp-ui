<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import { usePermissions } from '@/composables/usePermissions';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { formatCurrency, formatDate } from '@/utils/formatters';

const router = useRouter();
const { canRead, canUpdate, canCreate, canDelete } = usePermissions();

const isLoading = ref(false);
const stats = ref({
    totalPayslips: 0,
    pendingApproval: 0,
    approved: 0,
    totalAmount: 0
});

const recentActivity = ref([]);



const getStatusSeverity = (status) => {
    const statusMap = {
        draft: 'secondary',
        pending: 'warning',
        approved: 'success',
        rejected: 'danger'
    };
    return statusMap[status] || 'secondary';
};

const processPayroll = () => {
    router.push('/payroll/process');
};

const viewPayslips = () => {
    router.push('/payroll/payslips');
};

const manageSettings = () => {
    router.push('/payroll/settings');
};

const manageComponents = () => {
    router.push('/payroll/components');
};

const viewAudit = () => {
    router.push('/payroll/audit');
};

const viewReports = () => {
    router.push('/payroll/reports');
};

const viewPayslip = (id) => {
    router.push(`/payroll/payslips/${id}`);
};

const editPayslip = (id) => {
    router.push(`/payroll/payslips/${id}/edit`);
};

const loadStats = async () => {
    // Load payroll statistics
    // This would typically make API calls
    stats.value = {
        totalPayslips: 150,
        pendingApproval: 12,
        approved: 135,
        totalAmount: 2500000
    };
};

const loadRecentActivity = async () => {
    // Load recent payroll activity
    recentActivity.value = [
        {
            id: 1,
            date: '2024-01-15',
            action: 'Payslip Generated',
            employee: 'John Doe',
            amount: 45000,
            status: 'approved'
        },
        {
            id: 2,
            date: '2024-01-15',
            action: 'Payslip Generated',
            employee: 'Jane Smith',
            amount: 52000,
            status: 'pending'
        }
    ];
};

onMounted(() => {
    loadStats();
    loadRecentActivity();
});
</script>

<template>
    <div class="payroll-management">
        <div class="page-header mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p class="text-gray-600 mt-2">Manage employee payroll, payslips, and payroll settings</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <PermissionWrapper permission="view_payslip">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Payslips</p>
                                <p class="text-2xl font-bold text-blue-600">{{ stats.totalPayslips }}</p>
                            </div>
                            <i class="pi pi-file text-3xl text-blue-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_payslip">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Pending Approval</p>
                                <p class="text-2xl font-bold text-orange-600">{{ stats.pendingApproval }}</p>
                            </div>
                            <i class="pi pi-clock text-3xl text-orange-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_payslip">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Approved</p>
                                <p class="text-2xl font-bold text-green-600">{{ stats.approved }}</p>
                            </div>
                            <i class="pi pi-check-circle text-3xl text-green-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_payslip">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Amount</p>
                                <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(stats.totalAmount) }}</p>
                            </div>
                            <i class="pi pi-money-bill text-3xl text-purple-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>
        </div>

        <!-- Action Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <!-- Process Payroll -->
            <PermissionWrapper permission="add_payslip">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="processPayroll">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-calculator text-4xl text-blue-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Process Payroll</h3>
                            <p class="text-gray-600 text-sm">Generate payslips for all employees</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- View Payslips -->
            <PermissionWrapper permission="view_payslip">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewPayslips">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-list text-4xl text-green-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">View Payslips</h3>
                            <p class="text-gray-600 text-sm">Browse and manage payslips</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Payroll Settings -->
            <PermissionWrapper permission="view_defaultpayrollsettings">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="manageSettings">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-cog text-4xl text-orange-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payroll Settings</h3>
                            <p class="text-gray-600 text-sm">Configure payroll parameters</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Payroll Components -->
            <PermissionWrapper permission="view_payrollcomponents">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="manageComponents">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-sitemap text-4xl text-purple-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payroll Components</h3>
                            <p class="text-gray-600 text-sm">Manage earnings and deductions</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Payroll Audit -->
            <PermissionWrapper permission="view_payslipaudit">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewAudit">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-shield text-4xl text-red-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payroll Audit</h3>
                            <p class="text-gray-600 text-sm">Review payroll audit logs</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Reports -->
            <PermissionWrapper permission="view_payslip">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewReports">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-chart-bar text-4xl text-indigo-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payroll Reports</h3>
                            <p class="text-gray-600 text-sm">Generate payroll reports</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>
        </div>

        <!-- Recent Activity -->
        <PermissionWrapper permission="view_payslip">
            <Card>
                <template #title>Recent Payroll Activity</template>
                <template #content>
                    <DataTable :value="recentActivity" :paginator="true" :rows="10" :loading="isLoading" class="p-datatable-sm">
                        <Column field="date" header="Date" sortable>
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.date) }}
                            </template>
                        </Column>
                        <Column field="action" header="Action" sortable></Column>
                        <Column field="employee" header="Employee" sortable></Column>
                        <Column field="amount" header="Amount" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.amount) }}
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="slotProps">
                                <div class="flex gap-2">
                                    <PermissionButton permission="view_payslip" icon="pi pi-eye" size="small" @click="viewPayslip(slotProps.data.id)" />
                                    <PermissionButton permission="change_payslip" icon="pi pi-pencil" size="small" severity="info" @click="editPayslip(slotProps.data.id)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </PermissionWrapper>
    </div>
</template>

<style scoped>
.payroll-management {
    @apply max-w-7xl mx-auto p-6;
}

.stat-card {
    @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.action-card {
    @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.page-header {
    @apply border-b border-gray-200 pb-4;
}
</style>
