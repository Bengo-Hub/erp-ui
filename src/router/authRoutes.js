// Auth related routes - these are mostly public routes that don't require authentication
export const authRoutes = [
    {
        path: '/landing',
        name: 'landing',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/Landing.vue')
    },
    // Service-level outlet selector (post-login). Tenant-aware path per
    // sso-integration-guide → Outlet/Branch Context. No layout; requires auth.
    {
        path: '/:orgSlug/auth/select-outlet',
        name: 'selectOutlet',
        meta: { requiresAuth: true, title: 'Select Outlet' },
        component: () => import('@/views/pages/auth/SelectOutlet.vue')
    },
    {
        path: '/auth/select-outlet',
        name: 'selectOutletNoSlug',
        meta: { requiresAuth: true, title: 'Select Outlet' },
        component: () => import('@/views/pages/auth/SelectOutlet.vue')
    },
    {
        path: '/auth/login',
        name: 'login',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Login.vue')
    },
    {
        path: '/auth/forgot-password',
        name: 'forgotPassword',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/ForgotPassword.vue')
    },
    {
        path: '/auth/reset-password/:uid/:token',
        name: 'resetPassword',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/ResetPassword.vue')
    },
    {
        path: '/auth/access',
        name: 'accessDenied',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Access.vue')
    },
    {
        path: '/auth/error',
        name: 'error',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Error.vue')
    },
    {
        path: '/unauthorized',
        name: 'unauthorized',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/Unauthorized.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notfound',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/NotFound.vue')
    }
];
