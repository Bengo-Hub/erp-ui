// Auth related routes - these are mostly public routes that don't require authentication
export const authRoutes = [
    {
        path: '/landing',
        name: 'landing',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/Landing.vue')
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
