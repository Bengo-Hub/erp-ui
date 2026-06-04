<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { EXTERNAL_SERVICES } from '@/config/externalServices';
import { filterMenuItems } from '@/services/auth/permissionService';
import { onBeforeMount, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const { isPlatformOwner } = usePermissions();

const originalModel = ref([
    {
        label: 'Home',
        items: [
            {
                label: 'Home',
                icon: 'pi pi-fw pi-palette',
                permission: 'view_analyticssnapshot',
                to: '/'
            },
            {
                label: 'My Dashboard',
                icon: 'pi pi-fw pi-user',
                to: '/ess'
                // No permission required - available to all authenticated users
            }
        ]
    },  
    {
        label: 'AUTH',
        items: [
            {
                label: 'User Management',
                icon: 'pi pi-fw pi-users',
                permission: 'view_customuser',
                items: [
                    {
                        label: 'User Management',
                        permission: 'view_customuser',
                        icon: 'pi pi-fw pi-users',
                        to: '/users'
                    },
                ]
            }
        ]
    },
    {
        label: 'HRM',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-chart-line',
                permission: 'view_employee',
                to: '/hrm'
            },
            {
                        label: 'Payroll Analytics',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/hrm/analytics'
            },
            {
                label: 'Payroll',
                icon: 'pi pi-fw pi-money-bill',
                permission: 'view_payslip',
                items: [
                    {
                        label: 'Advance Pay',
                        permission: 'view_advances',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/hrm/payroll/advance-pay'
                    },
                    {
                        label: 'Losses/Damage',
                        permission: 'view_lossesanddamages',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        to: '/hrm/payroll/loss-damages'
                    },
                    {
                        label: 'Expense Claims',
                        permission: 'view_expenseclaims',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/payroll/claims'
                    },
                    {
                        label: 'Regular Employees',
                        icon: 'pi pi-fw pi-briefcase',
                        items: [
                            {
                                label: 'View Payslips',
                                permission: 'view_payslip',
                                icon: 'pi pi-fw pi-file-export',
                                to: '/hrm/payroll/regular/view-payslips'
                            },
                            {
                                label: 'Process Payroll',
                                permission: 'change_payslip',
                                icon: 'pi pi-fw pi-credit-card',
                                to: '/hrm/payroll/process-payroll/regular'
                            }
                        ]
                    },
                    {
                        label: 'Casual Employees',
                        permission: 'change_employee',
                        icon: 'pi pi-fw pi-users',
                        to: '/hrm/payroll/casualEmployees'
                    },
                    {
                        label: 'Consultants',
                        permission: 'change_employee',
                        icon: 'pi pi-fw pi-users',
                        to: '/hrm/payroll/consultants'
                    },
                    {
                        label: 'Email Payslips',
                        permission: 'change_payslip',
                        icon: 'pi pi-fw pi-envelope',
                        to: '/hrm/payroll/email-payslips'
                    },
                    {
                        label: 'Scheduled Payslips',
                        permission: 'view_scheduledpayslip',
                        icon: 'pi pi-fw pi-clock',
                        to: '/hrm/payroll/scheduled-emails'
                    }
                ]
            },
            {
                label: 'Employees',
                icon: 'pi pi-fw pi-user-plus',
                permission: 'view_employee',
                items: [
                    {
                        label: 'Manage Employees',
                        permission: 'view_employee',
                        icon: 'pi pi-fw pi-wrench',
                        to: '/hrm/employees/view-employees'
                    },
                    {
                        label: 'Manage Contracts',
                        permission: 'view_contract',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/employees/manageContracts'
                    },
                    {
                        label: 'Payroll Data',
                        icon: 'pi pi-fw pi-server',
                        permission: 'change_payrollcomponents',
                        items: [
                            {
                                label: 'Basic Pay',
                                permission: 'change_payrollcomponents',
                                icon: 'pi pi-fw pi-dollar',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'BasicPay',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Benefits',
                                permission: 'change_benefits',
                                icon: 'pi pi-fw pi-plus-circle',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Benefits',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Deductions',
                                permission: 'change_deductions',
                                icon: 'pi pi-fw pi-minus-circle',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Deductions',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Earnings',
                                permission: 'change_earnings',
                                icon: 'pi pi-fw pi-plus',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Earnings',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Loans',
                                permission: 'change_employeloans',
                                icon: 'pi pi-fw pi-money-bill',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Loans',
                                        filter: 'all'
                                    }
                                }
                            }
                        ]
                    },
                    {
                        label: 'Employee Documents',
                        icon: 'pi pi-fw pi-folder-open',
                        permission: 'view_documents',
                        items: [
                            {
                                label: 'Document Library',
                                permission: 'view_documents',
                                icon: 'pi pi-fw pi-folder'
                            },
                            {
                                label: 'Templates',
                                permission: 'view_documents',
                                icon: 'pi pi-fw pi-file-edit'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Training',
                icon: 'pi pi-fw pi-book',
                permission: 'change_trainingcourse',
                items: [
                    {
                        label: 'Courses',
                        permission: 'view_trainingcourse',
                        icon: 'pi pi-fw pi-book',
                        to: '/hrm/training/courses'
                    },
                    {
                        label: 'Enrollments',
                        permission: 'view_trainingenrollment',
                        icon: 'pi pi-fw pi-user',
                        to: '/hrm/training/enrollments'
                    },
                    {
                        label: 'Evaluations',
                        permission: 'view_trainingevaluation',
                        icon: 'pi pi-fw pi-star',
                        to: '/hrm/training/evaluations'
                    }
                ]
            },
            {
                label: 'Leave',
                icon: 'pi pi-fw pi-flag',
                permission: 'view_leaverequest',
                items: [
                    {
                        label: 'Leave List',
                        permission: 'view_leaverequest',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/hrm/Leave/leaveList'
                    },
                    {
                        label: 'Leave Balances',
                        permission: 'view_leavebalance',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/Leave/leaveBalances'
                    },
                    {
                        label: 'Leave Entitlement',
                        permission: 'view_leaveentitlement',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/Leave/leaveEntitlement'
                    },
                    {
                        label: 'Leave Types',
                        permission: 'view_leavecategory',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/Leave/leaveCategories'
                    }
                ]
            },
            {
                label: 'Attendance',
                icon: 'pi pi-fw pi-calendar',
                permission: 'view_attendancerecord',
                items: [
                    {
                        label: 'Shift Planner',
                        permission: 'view_workshift',
                        icon: 'pi pi-fw pi-th-large',
                        to: '/hrm/attendance/shift-planner'
                    },
                    {
                        label: 'Attendance Records',
                        permission: 'view_attendancerecord',
                        icon: 'pi pi-fw pi-calendar',
                        to: '/hrm/attendance/attendanceRecords'
                    },
                    {
                        label: 'Attendance Rules',
                        permission: 'view_attendancerule',
                        icon: 'pi pi-fw pi-cog',
                        to: '/hrm/attendance/attendanceRules'
                    }, // timesheet
                    {
                        label: 'Timesheet',
                        permission: 'view_timesheet',
                        icon: 'pi pi-fw pi-clock',
                        to: '/hrm/attendance/timesheets'
                    },
                    {
                        label: 'Timesheet Approvals',
                        permission: 'view_timesheet',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/hrm/attendance/timesheetApprovals'
                    }
                ]
            },
            {
                label: 'Appraisals',
                icon: 'pi pi-fw pi-briefcase',
                permission: 'view_appraisal',
                items: [
                    {
                        label: 'Performance Reviews',
                        permission: 'view_performancereview',
                        icon: 'pi pi-fw pi-chart-line',
                        to: '/hrm/performance/reviews'
                    },
                    {
                        label: 'Appraisal List',
                        permission: 'view_appraisal',
                        icon: 'pi pi-fw pi pi-list',
                        to: '/hrm/appraisals'
                    },
                    {
                        label: 'Appraisal Questions',
                        permission: 'view_appraisalquestion',
                        icon: 'pi pi-fw pi-plus-circle',
                        to: '/hrm/appraisals/questions'
                    },
                    {
                        label: 'Appraisal Configuration',
                        permission: 'view_appraisaltemplate',
                        icon: 'pi pi-fw pi-plus-circle',
                        to: '/hrm/appraisals/appraisalConfiguration'
                    },
                    {
                        label: 'Appraisal Cycles',
                        permission: 'view_appraisalcycle',
                        icon: 'pi pi-fw pi pi-calendar',
                        to: '/hrm/appraisals/appraisalCycles'
                    },
                    {
                        label: 'Goals',
                        icon: 'pi pi-fw pi-briefcase',
                        permission: 'view_goal',
                        items: [
                            {
                                label: 'Goals List',
                                permission: 'view_goal',
                                icon: 'pi pi-fw pi pi-list',
                                to: '/hrm/appraisals/goalsList'
                            },
                            {
                                label: 'Goals Library',
                                permission: 'view_goal',
                                icon: 'pi pi-fw pi pi-list',
                                to: '/hrm/appraisals/goalsLibrary'
                            },
                            {
                                label: 'My Goals',
                                permission: 'view_goal',
                                icon: 'pi pi-fw pi pi-list',
                                to: '/hrm/appraisals/myGoals'
                            }
                        ]
                    },
                    {
                        label: 'Templates List',
                        permission: 'view_appraisaltemplate',
                        icon: 'pi pi-fw pi pi-list',
                        to: '/hrm/appraisals/templates'
                    }
                ]
            },
            {
                label: 'Reports',
                icon: 'pi pi-fw pi-file-import',
                permission: 'view_payslip',
                items: [
                    {
                        label: 'All Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-th-large',
                        to: '/hrm/reports'
                    },
                    {
                        label: 'KRA Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-file-pdf',
                        items: [
                            {
                                label: 'P9 Tax Card',
                                permission: 'view_payslip',
                                to: '/hrm/reports/p9'
                            },
                            {
                                label: 'P10A Annual Return',
                                permission: 'view_payslip',
                                to: '/hrm/reports/p10a'
                            },
                            {
                                label: 'Withholding Tax',
                                permission: 'view_payslip',
                                to: '/hrm/reports/withholding-tax'
                            },
                            {
                                label: 'CBS Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/cbs'
                            }
                        ]
                    },
                    {
                        label: 'Statutory Deductions',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-shield',
                        items: [
                            {
                                label: 'NSSF Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/nssf'
                            },
                            {
                                label: 'NHIF (SHA) Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/nhif'
                            },
                            {
                                label: 'NITA Levy',
                                permission: 'view_payslip',
                                to: '/hrm/reports/nita'
                            }
                        ]
                    },
                    {
                        label: 'Payroll Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-chart-bar',
                        items: [
                            {
                                label: 'Bank Net Pay',
                                permission: 'view_payslip',
                                to: '/hrm/reports/bank-net-pay'
                            },
                            {
                                label: 'Muster Roll',
                                permission: 'view_payslip',
                                to: '/hrm/reports/muster-roll'
                            },
                            {
                                label: 'Variance Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/variance'
                            },
                            {
                                label: 'Approvers Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/approvers'
                            }
                        ]
                    },
                    {
                        label: 'Custom Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-cog',
                        to: '/hrm/reports/custom'
                    }
                ]
            }
        ]
    },
    {
        // Other business domains now live in their own microservice frontends.
        // These entries open the owning service's UI in a new browser tab.
        label: 'EXTERNAL SERVICES',
        items: [
            {
                label: 'Finance',
                icon: 'pi pi-fw pi-dollar',
                url: EXTERNAL_SERVICES.finance,
                target: '_blank'
            },
            {
                label: 'CRM',
                icon: 'pi pi-fw pi-users',
                url: EXTERNAL_SERVICES.crm,
                target: '_blank'
            },
            {
                label: 'Inventory & Products',
                icon: 'pi pi-fw pi-box',
                url: EXTERNAL_SERVICES.inventory,
                target: '_blank'
            },
            {
                label: 'Procurement',
                icon: 'pi pi-fw pi-shopping-bag',
                url: EXTERNAL_SERVICES.inventory,
                target: '_blank'
            },
            {
                label: 'Manufacturing',
                icon: 'pi pi-fw pi-cog',
                url: EXTERNAL_SERVICES.inventory,
                target: '_blank'
            },
            {
                label: 'Assets',
                icon: 'pi pi-fw pi-desktop',
                url: EXTERNAL_SERVICES.inventory,
                target: '_blank'
            },
            {
                label: 'Point of Sale',
                icon: 'pi pi-fw pi-shopping-cart',
                url: EXTERNAL_SERVICES.pos,
                target: '_blank'
            },
            {
                label: 'Orders & Shop',
                icon: 'pi pi-fw pi-shopping-cart',
                url: EXTERNAL_SERVICES.ordering,
                target: '_blank'
            },
            {
                label: 'Notifications',
                icon: 'pi pi-fw pi-bell',
                url: EXTERNAL_SERVICES.notifications,
                target: '_blank'
            },
            {
                label: 'Projects',
                icon: 'pi pi-fw pi-folder',
                url: EXTERNAL_SERVICES.projects,
                target: '_blank'
            },
            {
                label: 'Billing & Subscriptions',
                icon: 'pi pi-fw pi-credit-card',
                url: EXTERNAL_SERVICES.billing,
                target: '_blank'
            }
        ]
    },
    {
        label: 'Settings',
        items: [
            {
                label: 'HRM Settings',
                icon: 'pi pi-fw pi-users',
                permission: 'view_employee',
                items: [
                    {
                        label: 'Job Titles',
                        permission: 'view_jobtitle',
                        icon: 'pi pi-fw pi-briefcase',
                        to: '/settings/hrm/job-titles'
                    },
                    {
                        label: 'Departments & Regions',
                        permission: 'view_departments',
                        icon: 'pi pi-fw pi-building',
                        to: '/settings/hrm/departments'
                    },
                    {
                        label: 'Job Groups',
                        permission: 'view_jobgroup',
                        icon: 'pi pi-fw pi-sitemap',
                        to: '/settings/hrm/job-groups'
                    },
                    {
                        label: 'Projects',
                        permission: 'view_projects',
                        icon: 'pi pi-fw pi-folder',
                        to: '/settings/hrm/projects'
                    },
                    {
                        label: 'Workers Unions',
                        permission: 'view_workersunion',
                        icon: 'pi pi-fw pi-users',
                        to: '/settings/hrm/unions'
                    },
                    {
                        label: 'Work Shift Settings',
                        permission: 'view_workshift',
                        icon: 'pi pi-fw pi-clock',
                        to: '/hrm/attendance/work-shifts'
                    },
                    {
                        label: 'Holidays',
                        permission: 'view_publicholiday',
                        icon: 'pi pi-fw pi-calendar',
                        to: '/settings/hrm/holidays'
                    },
                    {
                        label: 'ESS Settings',
                        permission: 'view_esssettings',
                        icon: 'pi pi-fw pi-cog',
                        to: '/settings/hrm/ess'
                    }
                ]
            },
            {
                label: 'Payroll Settings',
                icon: 'pi pi-fw pi-money-bill',
                permission: 'view_payrollcomponents',
                items: [
                    {
                        label: 'Approvals',
                        permission: 'view_approvalworkflow',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/settings/payroll/approvals'
                    },
                    {
                        label: 'Deductions',
                        permission: 'view_deductions',
                        icon: 'pi pi-fw pi-minus-circle',
                        to: '/settings/payroll/deductions'
                    },
                    {
                        label: 'Loans',
                        permission: 'view_loans',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/settings/payroll/loans'
                    },
                    {
                        label: 'Earnings',
                        permission: 'view_earnings',
                        icon: 'pi pi-fw pi-plus-circle',
                        to: '/settings/payroll/earnings'
                    },
                    {
                        label: 'Benefits',
                        permission: 'view_benefits',
                        icon: 'pi pi-fw pi-gift',
                        to: '/settings/payroll/benefits'
                    },
                    {
                        label: 'Default Payroll Settings',
                        permission: 'view_defaultpayrollsettings',
                        icon: 'pi pi-fw pi-cog',
                        to: '/settings/payroll/defaults'
                    },
                    {
                        label: 'Formulas',
                        permission: 'view_formulas',
                        icon: 'pi pi-fw pi-calculator',
                        to: '/settings/payroll/formulas'
                    },
                    {
                        label: 'Banks',
                        permission: 'view_bankinstitution',
                        icon: 'pi pi-fw pi-building',
                        to: '/settings/payroll/banks'
                    },
                    {
                        label: 'Customize Payslip',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-file-edit',
                        to: '/settings/payroll/customize-payslip'
                    }
                ]
            },
            {
                label: 'Expense Claims Settings',
                icon: 'pi pi-fw pi-file',
                permission: 'view_expenseclaims',
                to: '/settings/expense-claims'
            },
            {
                label: 'General HR',
                permission: 'view_generalhrsettings',
                icon: 'pi pi-fw pi-id-card',
                to: '/settings/general-hr'
            },
            {
                label: 'Business Settings',
                icon: 'pi pi-fw pi-building',
                permission: 'view_bussiness',
                to: '/settings/business'
            },
            {
                label: 'Currency & Time',
                permission: 'view_appsettings',
                icon: 'pi pi-fw pi-globe',
                to: '/settings/currency-time'
            },
            {
                label: 'Look & Feel',
                permission: 'view_brandingsettings',
                icon: 'pi pi-fw pi-palette',
                to: '/settings/branding'
            },
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                permission: 'view_approvalworkflow',
                items: [
                    {
                        label: 'Approval Workflows',
                        permission: 'view_approvalworkflow',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/settings/approvals'
                    },
                    {
                        label: 'Security Settings',
                        permission: 'view_securitysettings',
                        icon: 'pi pi-fw pi-shield',
                        to: '/security/settings'
                    },
                    {
                        label: 'Backup Management',
                        permission: 'view_backup',
                        icon: 'pi pi-fw pi-database',
                        to: '/security/backups'
                    }
                ]
            },
            {
                label: 'API Settings',
                icon: 'pi pi-fw pi-link',
                permission: 'view_integrations',
                items: [
                    {
                        label: 'KRA iTax',
                        permission: 'view_krasettings',
                        icon: 'pi pi-fw pi-building',
                        to: '/settings/integrations/kra'
                    },
                    {
                        label: 'Payment Gateways',
                        permission: 'view_mpesasettings',
                        icon: 'pi pi-fw pi-credit-card',
                        to: '/settings/integrations/payment'
                    }
                ]
            }
        ]
    }
]);

const model = ref([]);

// Platform-admin-only section. Mirrors ordering-frontend's "Platform Admin" entry
// (user-menu-drawer.tsx) — visible ONLY to platform owners (CodeVertex). Platform
// owners administer tenants cross-tenant via the auth-service UI; the in-app
// TenantFilter (header) scopes API reads to a chosen tenant via ?tenantId.
const platformAdminSection = {
    label: 'PLATFORM ADMIN',
    items: [
        {
            label: 'Tenant Management',
            icon: 'pi pi-fw pi-building-columns',
            url: EXTERNAL_SERVICES.auth,
            target: '_blank'
        },
        {
            label: 'All Tenants',
            icon: 'pi pi-fw pi-globe',
            url: EXTERNAL_SERVICES.auth ? `${EXTERNAL_SERVICES.auth}/tenants` : EXTERNAL_SERVICES.auth,
            target: '_blank'
        },
        {
            label: 'Subscriptions',
            icon: 'pi pi-fw pi-credit-card',
            url: EXTERNAL_SERVICES.billing,
            target: '_blank'
        }
    ]
};

onBeforeMount(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    // Pass the full user object so isSuperUser check can access roles
    const filtered = filterMenuItems(originalModel.value, user);
    // Surface the platform-admin section only for platform owners.
    model.value = isPlatformOwner.value ? [platformAdminSection, ...filtered] : filtered;
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
