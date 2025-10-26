// Settings related routes
export const settingsRoutes = [
    {
        path: '/settings',
        name: 'system-configuration',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/SystemConfiguration.vue')
    },
    {
        path: '/settings/approvals',
        name: 'approvalSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/approvals.vue')
    },
    {
        path: '/settings/business',
        name: 'businessSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/business.vue')
    },
    {
        path: '/settings/departments',
        name: 'departments-old',
        redirect: '/settings/hrm/departments'
    },
    
    // HRM Settings
    {
        path: '/settings/hrm/departments',
        name: 'departments',
        meta: { 
            requiresAuth: true,
            permission: 'view_departments'
        },
        component: () => import('@/views/pages/settings/hrm/DepartmentsRegions.vue')
    },
    {
        path: '/settings/hrm/regions',
        name: 'regions',
        meta: { 
            requiresAuth: true,
            permission: 'view_regions'
        },
        component: () => import('@/views/pages/settings/hrm/DepartmentsRegions.vue'),
        props: { defaultTab: 1 }
    },
    {
        path: '/settings/hrm/job-titles',
        name: 'jobTitles',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/JobTitles.vue')
    },
    {
        path: '/settings/hrm/job-groups',
        name: 'jobGroups',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/JobGroups.vue')
    },
    {
        path: '/settings/hrm/projects',
        name: 'projects',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/Projects.vue')
    },
    {
        path: '/settings/hrm/unions',
        name: 'workersUnions',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/WorkersUnions.vue')
    },
    {
        path: '/settings/hrm/holidays',
        name: 'holidays',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/Holidays.vue')
    },
    {
        path: '/settings/hrm/ess',
        name: 'essSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/ESSSettings.vue')
    },
    {
        path: '/settings/hrm/appraisals/configuration',
        name: 'hrmAppraisalConfiguration',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/AppraisalConfiguration.vue')
    },
    
    // Payroll Settings
    {
        path: '/settings/payroll/formulas',
        name: 'payrollFormulas',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Formulas.vue')
    },
    {
        path: '/settings/payroll/formulas/:id',
        name: 'payrollFormulaDetail',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/FormulaDetail.vue'),
        props: true
    },
    {
        path: '/settings/payroll/components',
        name: 'payrollComponents',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Components.vue')
    },
    {
        path: '/settings/payroll/deductions',
        name: 'payrollDeductions',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Deductions.vue')
    },
    {
        path: '/settings/payroll/earnings',
        name: 'payrollEarnings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Earnings.vue')
    },
    {
        path: '/settings/payroll/benefits',
        name: 'payrollBenefits',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Benefits.vue')
    },
    {
        path: '/settings/payroll/loans',
        name: 'payrollLoans',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Loans.vue')
    },
    {
        path: '/settings/payroll/defaults',
        name: 'payrollDefaults',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/DefaultSettings.vue')
    },
    {
        path: '/settings/payroll/banks',
        name: 'payrollBanks',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Banks.vue')
    },
    {
        path: '/settings/expense-claims',
        name: 'expenseClaimsSettings',
        meta: { requiresAuth: true, permission: 'view_expenseclaims' },
        component: () => import('@/views/pages/settings/ExpenseClaimsSettings.vue')
    },
    {
        path: '/settings/currency-time',
        name: 'currencyTimeSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/CurrencyTime.vue')
    },
    {
        path: '/settings/general-hr',
        name: 'generalHRSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/GeneralHR.vue')
    },
    {
        path: '/settings/payroll/customize-payslip',
        name: 'customizePayslip',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/CustomizePayslip.vue')
    },
    {
        path: '/settings/payroll/scheduled',
        name: 'scheduledPayslips',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/ScheduledPayslips.vue')
    },
    {
        path: '/settings/payroll/approvals',
        name: 'payrollApprovals',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/approvals.vue')
    },
    {
        path: '/settings/branding',
        name: 'brandingSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/branding.vue')
    },
    
    // Finance Settings
    {
        path: '/settings/finance/taxes',
        name: 'taxSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/finance/Taxes.vue')
    },
    
    // Integration Settings
    {
        path: '/settings/integrations/kra',
        name: 'kraSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/integrations/KRASettings.vue')
    }
];
