// HRM Reports Routes
export const reportsRoutes = [
    {
        path: '/hrm/reports',
        name: 'hrm-reports',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/index.vue')
    },
    {
        path: '/hrm/reports/p9',
        name: 'p9-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/P9Report.vue')
    },
    {
        path: '/hrm/reports/p10a',
        name: 'p10a-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/P10AReport.vue')
    },
    {
        path: '/hrm/reports/withholding-tax',
        name: 'withholding-tax-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/WithholdingTaxReport.vue')
    },
    {
        path: '/hrm/reports/nssf',
        name: 'nssf-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/NSSFReport.vue')
    },
    {
        path: '/hrm/reports/nhif',
        name: 'nhif-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/NHIFReport.vue')
    },
    {
        path: '/hrm/reports/nita',
        name: 'nita-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/NITAReport.vue')
    },
    {
        path: '/hrm/reports/bank-net-pay',
        name: 'bank-net-pay-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/BankNetPayReport.vue')
    },
    {
        path: '/hrm/reports/muster-roll',
        name: 'muster-roll-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/MusterRollReport.vue')
    },
    {
        path: '/hrm/reports/variance',
        name: 'variance-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/VarianceReport.vue')
    },
    {
        path: '/hrm/reports/approvers',
        name: 'approvers-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/ApproversReport.vue')
    },
    {
        path: '/hrm/reports/cbs',
        name: 'cbs-report',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/CBSReport.vue')
    },
    {
        path: '/hrm/reports/custom',
        name: 'custom-reports',
        meta: { 
            requiresAuth: true,
            permission: 'view_payslip'
        },
        component: () => import('@/views/pages/hrm/reports/CustomReports.vue')
    }
];

