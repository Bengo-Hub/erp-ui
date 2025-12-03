<template>
    <div class="ess-dashboard">
        <!-- Welcome Header -->
        <Card class="mb-6 welcome-card">
            <template #content>
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <Avatar
                            :image="userAvatarUrl"
                            size="xlarge"
                            shape="circle"
                            class="border-4 border-primary-200 dark:border-primary-700"
                        />
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0">
                                Welcome back, {{ currentUser?.first_name || 'User' }}!
                            </h1>
                            <p class="text-surface-600 dark:text-surface-400 mt-1">
                                {{ formatDate(new Date(), 'long') }} • {{ currentUser?.email }}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <Badge :value="currentUser?.is_active ? 'Active' : 'Inactive'" :severity="currentUser?.is_active ? 'success' : 'danger'" class="text-lg" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- My Profile - Always visible -->
            <Card class="action-card" @click="navigateTo('/users/account')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-blue-100 dark:bg-blue-900">
                            <i class="pi pi-user text-2xl text-blue-600 dark:text-blue-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">My Profile</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">View & Edit</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Payslips - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canViewPayslips && canAccessPayslips" class="action-card" @click="navigateTo('/hrm/payroll/regular/view-payslips')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-green-100 dark:bg-green-900">
                            <i class="pi pi-money-bill text-2xl text-green-600 dark:text-green-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">My Payslips</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ payslipsCount }} Available</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- P9 Tax Card - available if user can view payslips -->
            <Card v-if="canViewPayslips && hasPermission('view_payslip')" class="action-card" @click="navigateTo('/hrm/reports/p9')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-emerald-100 dark:bg-emerald-900">
                            <i class="pi pi-file-pdf text-2xl text-emerald-600 dark:text-emerald-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">P9 Tax Card</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">View & Download</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Leave - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canApplyLeave && canAccessLeaveRequests" class="action-card" @click="navigateTo('/hrm/Leave/newLeave')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-orange-100 dark:bg-orange-900">
                            <i class="pi pi-calendar text-2xl text-orange-600 dark:text-orange-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Leave Balance</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ leaveBalance }} Days</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Timesheet - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canSubmitTimesheet && canAccessTimesheets" class="action-card" @click="navigateTo('/hrm/attendance/timesheets')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-purple-100 dark:bg-purple-900">
                            <i class="pi pi-clock text-2xl text-purple-600 dark:text-purple-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Timesheet</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">Submit Hours</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Overtime - ESS Setting + User Permission -->
            <Card v-if="canApplyOvertime && hasAnyPermission(['add_overtimerate', 'view_overtimerate'])" class="action-card" @click="navigateTo('/hrm/payroll/overtime')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-indigo-100 dark:bg-indigo-900">
                            <i class="pi pi-stopwatch text-2xl text-indigo-600 dark:text-indigo-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Overtime</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">Apply</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Advance Salary - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canRequestAdvanceSalary && canAccessAdvances" class="action-card" @click="navigateTo('/hrm/payroll/advance-pay')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-teal-100 dark:bg-teal-900">
                            <i class="pi pi-wallet text-2xl text-teal-600 dark:text-teal-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Salary Advance</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">Request</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Losses/Damage - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canReportLossesDamage && canAccessLossesAndDamages" class="action-card" @click="navigateTo('/hrm/payroll/loss-damages')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-red-100 dark:bg-red-900">
                            <i class="pi pi-exclamation-triangle text-2xl text-red-600 dark:text-red-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Losses/Damage</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">Report</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Expense Claims - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canSubmitExpenseClaims && canAccessExpenseClaims" class="action-card" @click="navigateTo('/hrm/payroll/claims')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-cyan-100 dark:bg-cyan-900">
                            <i class="pi pi-receipt text-2xl text-cyan-600 dark:text-cyan-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Expense Claims</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">Submit</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Attendance - If has view permission -->
            <Card v-if="hasPermission('view_attendancerecord')" class="action-card" @click="navigateTo('/hrm/attendance/records')">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="icon-wrapper bg-pink-100 dark:bg-pink-900">
                            <i class="pi pi-check-circle text-2xl text-pink-600 dark:text-pink-300"></i>
                        </div>
                        <div>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Attendance</p>
                            <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">View Records</p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Recent Activity & Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent Payslips - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canViewPayslips && canAccessPayslips">
                <template #title>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-semibold">Recent Payslips</span>
                        <Button
                            label="View All"
                            icon="pi pi-arrow-right"
                            text
                            size="small"
                            @click="navigateTo('/hrm/payroll/regular/view-payslips')"
                        />
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="text-center py-8">
                        <ProgressSpinner style="width: 50px; height: 50px" />
                    </div>
                    <div v-else class="space-y-3">
                        <div
                            v-for="payslip in recentPayslips"
                            :key="payslip.id"
                            class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer"
                            @click="viewPayslip(payslip)"
                        >
                            <div class="flex items-center gap-3">
                                <i class="pi pi-file-pdf text-red-500 text-xl"></i>
                                <div>
                                    <p class="font-medium text-surface-900 dark:text-surface-0">{{ payslip.period }}</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">{{ formatDate(payslip.date, 'short') }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-primary-600 dark:text-primary-400">{{ formatCurrency(payslip.net_pay) }}</p>
                                <Badge :value="payslip.status" severity="success" class="text-xs" />
                            </div>
                        </div>
                        <div v-if="recentPayslips.length === 0" class="text-center py-8 text-surface-500">
                            <i class="pi pi-inbox text-4xl mb-2"></i>
                            <p>No payslips available</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Leave Requests - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canApplyLeave && canAccessLeaveRequests">
                <template #title>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-semibold">Leave Requests</span>
                        <Button
                            label="Apply"
                            icon="pi pi-plus"
                            text
                            size="small"
                            @click="navigateTo('/hrm/Leave/newLeave')"
                        />
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="text-center py-8">
                        <ProgressSpinner style="width: 50px; height: 50px" />
                    </div>
                    <div v-else class="space-y-3">
                        <div
                            v-for="leave in recentLeaveRequests"
                            :key="leave.id"
                            class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                        >
                            <div class="flex items-center gap-3">
                                <i class="pi pi-calendar text-orange-500 text-xl"></i>
                                <div>
                                    <p class="font-medium text-surface-900 dark:text-surface-0">{{ leave.category }}</p>
                                    <p class="text-xs text-surface-500 dark:text-surface-400">
                                        {{ formatDate(leave.start_date, 'short') }} - {{ formatDate(leave.end_date, 'short') }}
                                    </p>
                                </div>
                            </div>
                            <div class="text-right">
                                <Badge :value="leave.status" :severity="getLeaveStatusSeverity(leave.status)" />
                                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ leave.days }} days</p>
                            </div>
                        </div>
                        <div v-if="recentLeaveRequests.length === 0" class="text-center py-8 text-surface-500">
                            <i class="pi pi-calendar text-4xl mb-2"></i>
                            <p>No recent leave requests</p>
                            <Button
                                label="Apply for Leave"
                                icon="pi pi-plus"
                                class="mt-4"
                                @click="navigateTo('/hrm/Leave/newLeave')"
                            />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Timesheet Status - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canSubmitTimesheet && canAccessTimesheets">
                <template #title>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-semibold">Timesheet</span>
                        <Button
                            label="Submit"
                            icon="pi pi-plus"
                            text
                            size="small"
                            @click="navigateTo('/hrm/attendance/timesheets')"
                        />
                    </div>
                </template>
                <template #content>
                    <div class="text-center py-8">
                        <i class="pi pi-clock text-6xl text-purple-500 mb-4"></i>
                        <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Submit Your Hours</h4>
                        <p class="text-surface-500 dark:text-surface-400 mb-4">
                            Track your working hours and submit timesheets
                        </p>
                        <Button
                            label="Go to Timesheet"
                            icon="pi pi-arrow-right"
                            @click="navigateTo('/hrm/attendance/timesheets')"
                        />
                    </div>
                </template>
            </Card>

            <!-- Attendance Summary -->
            <Card v-if="hasPermission('view_attendancerecord')">
                <template #title>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-semibold">Attendance</span>
                        <Button
                            label="View Records"
                            icon="pi pi-arrow-right"
                            text
                            size="small"
                            @click="navigateTo('/hrm/attendance/records')"
                        />
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div class="stat-item">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-surface-500 dark:text-surface-400">This Month</span>
                                <i class="pi pi-check-circle text-green-500"></i>
                            </div>
                            <div class="flex items-center gap-2">
                                <p class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ attendanceRate }}%</p>
                                <span class="text-sm text-surface-500">Attendance Rate</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Additional ESS Features -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <!-- Overtime Applications - ESS Setting + User Permission -->
            <Card v-if="canApplyOvertime && hasAnyPermission(['add_overtimerate', 'view_overtimerate'])">
                <template #title>
                    <span class="text-xl font-semibold">Overtime</span>
                </template>
                <template #content>
                    <div class="text-center py-6">
                        <i class="pi pi-stopwatch text-5xl text-indigo-500 mb-3"></i>
                        <p class="text-surface-600 dark:text-surface-400 mb-4">Apply for overtime hours</p>
                        <Button
                            label="Apply for Overtime"
                            icon="pi pi-plus"
                            @click="navigateTo('/hrm/payroll/overtime')"
                        />
                    </div>
                </template>
            </Card>

            <!-- Advance Salary - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canRequestAdvanceSalary && canAccessAdvances">
                <template #title>
                    <span class="text-xl font-semibold">Salary Advance</span>
                </template>
                <template #content>
                    <div class="text-center py-6">
                        <i class="pi pi-wallet text-5xl text-teal-500 mb-3"></i>
                        <p class="text-surface-600 dark:text-surface-400 mb-4">Request salary advance</p>
                        <Button
                            label="Request Advance"
                            icon="pi pi-plus"
                            @click="navigateTo('/hrm/payroll/advance-pay')"
                        />
                    </div>
                </template>
            </Card>

            <!-- Expense Claims - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canSubmitExpenseClaims && canAccessExpenseClaims">
                <template #title>
                    <span class="text-xl font-semibold">Expense Claims</span>
                </template>
                <template #content>
                    <div class="text-center py-6">
                        <i class="pi pi-receipt text-5xl text-cyan-500 mb-3"></i>
                        <p class="text-surface-600 dark:text-surface-400 mb-4">Submit expense claims</p>
                        <PermissionButton
                            :permission="['add_expenseclaims', 'change_expenseclaims']"
                            mode="any"
                            label="New Claim"
                            icon="pi pi-plus"
                            @click="navigateTo('/hrm/payroll/claims')"
                        />
                    </div>
                </template>
            </Card>

            <!-- Losses & Damage - ESS Setting + User Permission + Sensitive Access -->
            <Card v-if="canReportLossesDamage && canAccessLossesAndDamages">
                <template #title>
                    <span class="text-xl font-semibold">Losses & Damage</span>
                </template>
                <template #content>
                    <div class="text-center py-6">
                        <i class="pi pi-exclamation-triangle text-5xl text-red-500 mb-3"></i>
                        <p class="text-surface-600 dark:text-surface-400 mb-4">Report losses or damages</p>
                        <Button
                            label="Report"
                            icon="pi pi-plus"
                            @click="navigateTo('/hrm/payroll/loss-damages')"
                        />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { useESSPermissions } from '@/composables/useESSPermissions';
import { usePermissions } from '@/composables/usePermissions';
import { useSensitiveModules } from '@/composables/useSensitiveModules';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { getUserAvatarUrl } from '@/utils/avatarHelper';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import PermissionButton from '@/components/common/PermissionButton.vue';

const router = useRouter();
const store = useStore();
const { showToast } = useToast();

// Use ESS permissions composable
const {
    loadSettings: loadESSSettings,
    canViewPayslips,
    canApplyLeave,
    canSubmitTimesheet,
    canApplyOvertime,
    canRequestAdvanceSalary,
    canReportLossesDamage,
    canSubmitExpenseClaims
} = useESSPermissions();

// Use user permissions composable
const { hasPermission, hasAnyPermission } = usePermissions();

// Use sensitive modules composable for enhanced security
const {
    canAccessPayslips,
    canAccessAdvances,
    canAccessExpenseClaims,
    canAccessLossesAndDamages,
    canAccessLeaveRequests,
    canAccessTimesheets,
    canViewAllPayslips,
    canViewAllLeaveRequests,
    canViewAllTimesheets
} = useSensitiveModules();

// State
const loading = ref(false);
const recentPayslips = ref([]);
const recentLeaveRequests = ref([]);
const payslipsCount = ref(0);
const leaveBalance = ref(0);
const attendanceRate = ref(0);

// Current user from store
const currentUser = computed(() => store.state.auth.user);
const hasEmployeeMapping = computed(() => !!(currentUser.value?.employee_id));

// User avatar with initials
const userAvatarUrl = computed(() => {
    return getUserAvatarUrl(currentUser.value, 200);
});

// Methods
const loadESSData = async () => {
    loading.value = true;
    try {
        // Load ESS settings first
        await loadESSSettings();
        
        // Load payslips if allowed
        if (canViewPayslips.value && hasPermission('view_payslip')) {
            await loadPayslips();
        }
        
        // Load leave data if allowed
        if (canApplyLeave.value && hasPermission('view_leaverequest')) {
            await loadLeaveData();
        }
        
        // Load attendance data if allowed
        if (hasPermission('view_attendancerecord')) {
            await loadAttendanceData();
        }
        
    } catch (error) {
        console.error('Error loading ESS data:', error);
        showToast('error', 'Error', 'Failed to load dashboard data');
    } finally {
        loading.value = false;
    }
};

const loadPayslips = async () => {
    try {
        // Get current user's employee ID
        const employeeId = currentUser.value?.employee_id || currentUser.value?.id;
        
        // Check if user has managerial permissions
        const hasManagerialPerms = hasAnyPermission(['change_payslip', 'delete_payslip', 'add_payslip']);
        
        // Fetch payslips from backend - filter by employee unless user is manager
        const params = hasManagerialPerms 
            ? { limit: 5, ordering: '-date' }  // Managers can see all
            : { employee: employeeId, limit: 5, ordering: '-date' };  // Staff only see their own
        
        const response = await payrollService.getPayslips(params);
        
        recentPayslips.value = response.results || response.data || [];
        payslipsCount.value = response.count || recentPayslips.value.length;
    } catch (error) {
        console.error('Error loading payslips:', error);
        recentPayslips.value = [];
        payslipsCount.value = 0;
    }
};

const loadLeaveData = async () => {
    try {
        // This would call the leave service to get user's leave data
        // For now, using placeholder until leave service is available
        recentLeaveRequests.value = [];
        leaveBalance.value = 0;
    } catch (error) {
        console.error('Error loading leave data:', error);
    }
};

const loadAttendanceData = async () => {
    try {
        // This would call attendance service
        // For now, using placeholder
        attendanceRate.value = 0;
    } catch (error) {
        console.error('Error loading attendance data:', error);
    }
};

const navigateTo = (path) => {
    router.push(path);
};

const viewPayslip = (payslip) => {
    router.push(`/hrm/payroll/regular/view-payslips?id=${payslip.id}`);
};

const getLeaveStatusSeverity = (status) => {
    const severityMap = {
        approved: 'success',
        pending: 'warning',
        rejected: 'danger',
        cancelled: 'secondary'
    };
    return severityMap[status?.toLowerCase()] || 'info';
};

onMounted(() => {
    if (!hasEmployeeMapping.value) {
        showToast('warn', 'Incomplete Setup', 'Your account is not linked to an employee record. Please contact HR or complete your profile.', 6000);
        router.replace('/users/account');
        return;
    }
    loadESSData();
});
</script>

<style scoped>
.ess-dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem;
}

.welcome-card {
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
}

.dark .welcome-card {
    background: linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%);
}

.action-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.action-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.dark .action-card:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.icon-wrapper {
    padding: 1rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-item {
    padding: 1rem;
    border-radius: 8px;
    background: var(--surface-50);
}

.dark .stat-item {
    background: var(--surface-800);
}

@media (max-width: 768px) {
    .ess-dashboard {
        padding: 1rem;
    }
    
    .welcome-card h1 {
        font-size: 1.5rem;
    }
}
</style>
