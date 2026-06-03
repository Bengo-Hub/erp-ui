import AppLayout from '@/layout/AppLayout.vue';
import { appraisalRoutes } from './appraisalRoutes';
import { authRoutes } from './authRoutes';
import { dashboardRoutes } from './dashboardRoutes';
import { employeeRoutes } from './employeeRoutes';
import { leaveRoutes } from './leaveRoutes';
import { payrollRoutes } from './payrollRoutes';
import { reportsRoutes } from './reportsRoutes';
import { securityRoutes } from './securityRoutes';
import { settingsRoutes } from './settingsRoutes';
import { userManagementRoutes } from './userManagementRoutes';

const routes = [
    {
        path: '/',
        component: AppLayout,
        children: [
            //################### DASHBOARDS ####################################
            ...dashboardRoutes,
            //################### APPRAISALS ####################################
            ...appraisalRoutes,
            //#################### PAYROLL #######################################
            ...payrollRoutes,
            //#################### REPORTS #######################################
            ...reportsRoutes,
            //#################### EMPLOYEES #######################################
            ...employeeRoutes,
            //#################### LEAVE #######################################
            ...leaveRoutes,
            //#################### USER MANAGEMENT #######################################
            ...userManagementRoutes,
            //#################### SECURITY #######################################
            ...securityRoutes,
            //#################### SETTINGS #####################################
            ...settingsRoutes,
            //#################### UTILITY PAGES ################################
            {
                path: '/calendar',
                name: 'calendar',
                component: () => import('@/views/pages/Calendar.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Calendar'
                }
            },
            {
                path: '/messages',
                name: 'messages',
                component: () => import('@/views/pages/Messages.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Messages'
                }
            }
        ]
    },
    //#################### SSO CALLBACK (no layout) ###########################
    {
        path: '/auth/callback',
        name: 'sso-callback',
        component: () => import('@/views/pages/auth/AuthCallback.vue'),
        meta: { title: 'Signing in' }
    },
    //#################### AUTH ROUTES #########################################
    ...authRoutes
];

export default routes;
