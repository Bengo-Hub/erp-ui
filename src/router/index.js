import permissionMiddleware from '@/middleware/permission';
import routes from '@/router/routes';
import { createRouter, createWebHistory } from 'vue-router';
import { isSSOEnabled, loginRedirect } from '@/services/auth/ssoService';

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    // Allow the SSO callback through without auth.
    if (to.path === '/auth/callback') {
        next();
        return;
    }

    // Check authentication first
    if (to.matched.some((record) => record.meta.requiresAuth) && !sessionStorage.getItem('isAuthenticated')) {
        // SSO mode: redirect to the auth-service login instead of the local login page.
        if (isSSOEnabled()) {
            loginRedirect(to.fullPath);
            return;
        }
        next('/auth/login');
        return;
    }

    // Check permissions
    permissionMiddleware(to, from, next);
});

export default router;
