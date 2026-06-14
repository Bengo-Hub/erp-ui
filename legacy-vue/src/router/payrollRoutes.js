// Payroll related routes
export const payrollRoutes = [
    {
        path: '/hrm/payroll/advance-pay',
        name: 'advances',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/advance-pay.vue'),
        props: true // Allows params to be passed as props
    },
    {
        path: '/hrm/payroll/loss-damages',
        name: 'lossDamages',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/loss-damages.vue'),
        props: true // Allows params to be passed as props
    },
    {
        path: '/hrm/payroll/casualEmployees',
        name: 'casualEmployees',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/casualEmployees.vue'),
        props: true
    },
    {
        path: '/hrm/payroll/consultants',
        name: 'consultants',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/consultants.vue'),
        props: true
    },
    {
        path: '/hrm/payroll/claims',
        name: 'claims',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/claims.vue'),
        props: true // Allows params to be passed as props
    },
    {
        path: '/hrm/payroll/employee_spreadsheet/:employment_type/:components/:filter',
        name: 'employee_spreadsheet',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/employee_spreadsheet.vue'),
        props: true // Allows params to be passed as props
    },
    {
        path: '/hrm/payroll/email-payslips',
        name: 'emailPayslips',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/email-payslips.vue'),
        props: true // Allows params to be passed as props
    },
    {
        path: '/hrm/payroll/scheduled-emails',
        name: 'schedulePayslips',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/scheduled-emails.vue'),
        props: true // Allows params to be passed as props
    },
    {
        path: '/hrm/payroll/regular/view-payslips',
        name: 'regular-payslips',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/regular/view-payslips.vue')
    },
    {
        path: '/hrm/payroll/process-payroll/:employment_type',
        name: 'process-payroll',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/process-payroll.vue')
    },
    {
        path: '/regularpayroll/printpayslips/:fromDate/:toDate',
        name: 'regularpayroll-printpayslips',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/regular/print-payslips.vue'),
        props: true
    },
    {
        path: '/hrm/payroll/formula-management',
        name: 'formula-management',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/payroll/formula-management.vue')
    }
];
