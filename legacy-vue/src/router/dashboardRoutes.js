// Dashboard related routes - Only general dashboards remain
export const dashboardRoutes = [
    {
        path: '/',
        name: 'executiveDashboard',
        meta: { 
            requiresAuth: true,
            permission: ['view_analyticssnapshot', 'view_sales', 'view_payment', 'add_employee']  // Executives, Managers, Admins
        },
        component: () => import('@/views/pages/dashboards/executiveDashboard.vue')
    },
    {
        path: '/dashboard/ict',
        name: 'ictDashboard',
        meta: {
            requiresAuth: true,
            // Technical roles; permission gate will be handled by middleware/directives
            permission: ['view_securitysettings', 'view_integrations', 'view_appsettings']
        },
        component: () => import('@/views/pages/dashboards/ictDashboard.vue')
    },
    {
        path: '/hrm/analytics',
        name: 'hrmAnalytics',
        meta: { 
            requiresAuth: true,
            permission: ['view_payrollcomponents', 'view_employee', 'add_employee']  // HR personnel
        },
        component: () => import('@/views/pages/dashboards/hrm_analytics.vue')
    }
];
