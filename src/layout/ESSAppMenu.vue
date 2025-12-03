<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { getDashboardRedirectPath } from '@/services/auth/permissionService';
import { computed } from 'vue';
import { useStore } from 'vuex';

const { hasPermission, hasAnyPermission } = usePermissions();
const store = useStore();

// Get current user
const currentUser = computed(() => store.state.auth.user);

// Check if user has admin access (can access admin dashboard)
// Only show if user has management/administrative permissions
const hasAdminAccess = computed(() => {
    if (!currentUser.value) return false;
    
    // Superusers always have admin access
    if (currentUser.value.is_superuser || currentUser.value.isSuperuser) return true;
    
    // Check for admin roles
    const roles = Array.isArray(currentUser.value.roles) 
        ? currentUser.value.roles.map(r => String(r).toLowerCase()) 
        : [];
    
    const adminRoles = ['admin', 'superusers', 'hr_manager', 'finance_manager', 'cto', 'ceo', 'manager', 'procurement_manager', 'operations_manager'];
    if (adminRoles.some(role => roles.includes(role))) return true;
    
    // Check for management permissions (any change/delete permissions indicate management role)
    const managementPermissions = [
        'change_employee', 'delete_employee',
        'change_payslip', 'delete_payslip',
        'change_expenseclaims', 'delete_expenseclaims',
        'change_leaverequest', 'delete_leaverequest',
        'change_invoice', 'delete_invoice',
        'change_quotation', 'delete_quotation',
        'change_purchaseorder', 'delete_purchaseorder',
        'view_customuser', 'change_customuser'
    ];
    
    return hasAnyPermission(managementPermissions);
});

// Define base ESS items with optional permission codenames
const baseItems = [
    { label: 'My Dashboard', icon: 'pi pi-home', to: '/ess' },
    { label: 'My Profile', icon: 'pi pi-user', to: '/users/account' },
    { label: 'My Payslips', icon: 'pi pi-money-bill', to: '/hrm/payroll/regular/view-payslips', permission: 'view_payslip' },
    { label: 'P9 Tax Card', icon: 'pi pi-file-pdf', to: '/hrm/reports/p9', permission: 'view_payslip' },
    { label: 'Apply Leave', icon: 'pi pi-send', to: '/hrm/Leave/newLeave', permission: 'view_leaverequest' },
    { label: 'Leave Balance', icon: 'pi pi-calendar', to: '/hrm/Leave/leaveBalances', permission: 'view_leavebalance' },
    { label: 'Timesheets', icon: 'pi pi-clock', to: '/hrm/attendance/timesheets', permission: 'view_timesheet' },
    { label: 'Overtime', icon: 'pi pi-stopwatch', to: '/hrm/payroll/overtime', permission: 'view_overtimerate' },
    { label: 'Salary Advance', icon: 'pi pi-wallet', to: '/hrm/payroll/advance-pay', permission: 'view_advances' },
    { label: 'Expense Claims', icon: 'pi pi-receipt', to: '/hrm/payroll/claims', permission: 'view_expenseclaims' },
    { label: 'Attendance', icon: 'pi pi-check-circle', to: '/hrm/attendance/records', permission: 'view_attendancerecord' }
];

// Only include items user can view (or that have no explicit permission)
const items = computed(() => {
    const filtered = baseItems.filter((item) => !item.permission || hasPermission(item.permission));
    
    // Add "Back to Admin Dashboard" at the end if user has admin access
    if (hasAdminAccess.value) {
        const adminDashboardPath = getDashboardRedirectPath(currentUser.value);
        filtered.push({
            label: 'Back to Admin Dashboard',
            icon: 'pi pi-arrow-left',
            to: adminDashboardPath,
            isAdminLink: true
        });
    }
    
    return filtered;
});
</script>

<template>
    <div class="ess-sidebar">
        <div class="ess-header">
            <i class="pi pi-id-card mr-2"></i>
            <span>My ESS Menu</span>
        </div>
        <ul class="ess-menu">
            <li v-for="(item, idx) in items" :key="idx" class="ess-item" :class="{ 'ess-item-admin': item.isAdminLink }">
                <router-link :to="item.to" class="ess-link" :class="{ 'ess-link-admin': item.isAdminLink }">
                    <i :class="['pi', item.icon, 'ess-icon']"></i>
                    <span class="ess-label">{{ item.label }}</span>
                </router-link>
            </li>
        </ul>
        <div class="ess-footer">
            <span class="ess-hint">Quick access to your self‑service tasks</span>
        </div>
    </div>
</template>

<style scoped>
.ess-sidebar {
    padding: 0.75rem 0.75rem 1rem 0.75rem;
}
.ess-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-color);
    padding: 0.5rem 0.5rem 0.25rem 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.ess-menu {
    list-style: none;
    margin: 0.25rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}
.ess-item {
    border-radius: 10px;
    overflow: hidden;
}
.ess-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    color: var(--text-color);
    background: var(--surface-0);
    border: 1px solid var(--surface-border);
    transition: all 0.15s ease;
}
.ess-link:hover {
    background: var(--surface-50);
    transform: translateX(2px);
}
.ess-icon {
    color: var(--text-color-secondary);
    font-size: 1rem;
}
.ess-label {
    font-weight: 600;
    font-size: 0.95rem;
}
.ess-footer {
    margin-top: 0.75rem;
    padding: 0.25rem 0.5rem;
}
.ess-hint {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

/* Admin Dashboard Link Styling */
.ess-item-admin {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--surface-border);
}

.ess-link-admin {
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
    border-color: var(--primary-200);
    font-weight: 600;
}

.dark .ess-link-admin {
    background: linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%);
    border-color: var(--primary-700);
}

.ess-link-admin:hover {
    background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
    transform: translateX(-2px);
}

.dark .ess-link-admin:hover {
    background: linear-gradient(135deg, var(--primary-800) 0%, var(--primary-700) 100%);
}

.ess-link-admin .ess-icon {
    color: var(--primary-600);
}

.dark .ess-link-admin .ess-icon {
    color: var(--primary-400);
}
</style>

