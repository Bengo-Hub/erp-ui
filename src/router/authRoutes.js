// Auth-related routes — public pages that don't require authentication.
//
// The app is tenant-scoped, so the canonical auth URLs are /{orgSlug}/auth/*
// (e.g. /codevertex/auth/login). The legacy flat /auth/* routes are kept so old
// links + the guard's redirects keep working; the guard normalises bare/legacy
// auth URLs to their /{orgSlug}/auth/* equivalent.
export const authRoutes = [
    {
        path: '/landing',
        name: 'landing',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/Landing.vue')
    },

    // ---- Tenant-scoped auth pages (/{orgSlug}/auth/*) ----------------------
    // Service-level outlet selector (post-login). Tenant-aware path per
    // sso-integration-guide → Outlet/Branch Context. No layout; requires auth.
    {
        path: '/:orgSlug/auth/select-outlet',
        name: 'selectOutlet',
        meta: { requiresAuth: true, title: 'Select Outlet' },
        component: () => import('@/views/pages/auth/SelectOutlet.vue')
    },
    {
        path: '/:orgSlug/auth/login',
        name: 'login',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Login.vue')
    },
    {
        path: '/:orgSlug/auth/forgot-password',
        name: 'forgotPassword',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/ForgotPassword.vue')
    },
    {
        path: '/:orgSlug/auth/reset-password/:uid/:token',
        name: 'resetPassword',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/ResetPassword.vue')
    },
    {
        path: '/:orgSlug/auth/access',
        name: 'accessDenied',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Access.vue')
    },
    {
        path: '/:orgSlug/auth/error',
        name: 'error',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Error.vue')
    },
    {
        path: '/:orgSlug/unauthorized',
        name: 'unauthorized',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/Unauthorized.vue')
    },

    // ---- Legacy flat auth pages (kept for backward-compat / guard redirects) -
    {
        path: '/auth/select-outlet',
        name: 'selectOutletFlat',
        meta: { requiresAuth: true, title: 'Select Outlet' },
        component: () => import('@/views/pages/auth/SelectOutlet.vue')
    },
    {
        path: '/auth/login',
        name: 'loginFlat',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Login.vue')
    },
    {
        path: '/auth/forgot-password',
        name: 'forgotPasswordFlat',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/ForgotPassword.vue')
    },
    {
        path: '/auth/reset-password/:uid/:token',
        name: 'resetPasswordFlat',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/ResetPassword.vue')
    },
    {
        path: '/auth/access',
        name: 'accessDeniedFlat',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Access.vue')
    },
    {
        path: '/auth/error',
        name: 'errorFlat',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/auth/Error.vue')
    },
    {
        path: '/unauthorized',
        name: 'unauthorizedFlat',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/Unauthorized.vue')
    },

    // Catch-all (must be last).
    {
        path: '/:pathMatch(.*)*',
        name: 'notfound',
        meta: { requiresAuth: false },
        component: () => import('@/views/pages/NotFound.vue')
    }
];
