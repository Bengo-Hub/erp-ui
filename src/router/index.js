import permissionMiddleware from '@/middleware/permission';
import routes from '@/router/routes';
import { createRouter, createWebHistory } from 'vue-router';
import { isSSOEnabled, loginRedirect } from '@/services/auth/ssoService';
import { resolveOrgSlug, setOrgSlug, splitOrgPath, isOrgSlugSegment } from '@/utils/tenantContext';

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes
});

// Paths that are intentionally NOT tenant-scoped (no /{orgSlug} prefix needed):
// the SSO callback and the public landing page. Everything else is rewritten to
// /{orgSlug}/… so the URL always carries the tenant (mirrors ordering-frontend's
// [orgSlug] App Router segment).
function isUnscopedPath(pathOnly) {
    return (
        pathOnly === '/auth/callback' ||
        /^\/[^/]+\/auth\/callback\/?$/.test(pathOnly) ||
        pathOnly === '/landing'
    );
}

router.beforeEach((to, from, next) => {
    const pathOnly = to.path;

    // 1) Capture the org slug from the path into the tenant context (localStorage
    //    tenant_slug) so axios + later navigations inherit it. This is the Vue
    //    equivalent of ordering-frontend's OrgSlugProvider useEffect that does
    //    localStorage.setItem("tenantSlug", orgSlug).
    const routeSlug = to.params?.orgSlug;
    if (routeSlug && isOrgSlugSegment(routeSlug)) {
        setOrgSlug(routeSlug);
    }

    // 2) Let the SSO callback + landing through unscoped & without auth.
    if (isUnscopedPath(pathOnly)) {
        next();
        return;
    }

    // 3) Normalise bare/legacy (unprefixed) paths → /{orgSlug}/… so the URL is
    //    always tenant-scoped. The first segment decides:
    //      • reserved (auth, landing, unauthorized…) or empty → needs a slug
    //        prefix resolved from the stored tenant (default 'codevertex').
    //      • already an org slug → leave as-is (it matched the scoped tree).
    const { orgSlug: pathSlug, rest } = splitOrgPath(pathOnly);
    if (!pathSlug) {
        const slug = resolveOrgSlug();
        // Build the scoped target, preserving query + hash.
        const target = `/${slug}${rest === '/' ? '' : rest}`;
        // Guard against redirect loops / invalid slugs.
        if (slug && isOrgSlugSegment(slug) && target !== pathOnly) {
            next({ path: target || `/${slug}`, query: to.query, hash: to.hash, replace: true });
            return;
        }
    }

    // 4) Authentication gate (same policy as before, but tenant-aware redirects).
    if (to.matched.some((record) => record.meta.requiresAuth) && !sessionStorage.getItem('isAuthenticated')) {
        // SSO mode: redirect to the auth-service login. Pass the resolved org slug
        // as the tenant so auth-api mints a token for the right org.
        if (isSSOEnabled()) {
            loginRedirect(to.fullPath, resolveOrgSlug(to.params?.orgSlug));
            return;
        }
        // Legacy mode: go to the tenant-scoped login page.
        const slug = resolveOrgSlug(to.params?.orgSlug);
        next({ path: `/${slug}/auth/login`, query: { redirect: to.fullPath } });
        return;
    }

    // 5) Permission check. The ROUTE_PERMISSIONS map + getDashboardRedirectPath
    //    are keyed on UNPREFIXED paths, so hand the middleware a normalised copy
    //    of the route with the /{orgSlug} prefix stripped from the path.
    const normalised = buildNormalisedRoute(to);
    permissionMiddleware(normalised, from, (result) => {
        // The middleware may call next() with no args (allow), or with a path /
        // location to redirect to. Re-scope any string redirect it returns.
        if (result === undefined) {
            next();
            return;
        }
        if (typeof result === 'string') {
            next(rescopeRedirect(result, to.params?.orgSlug));
            return;
        }
        if (result && typeof result === 'object' && typeof result.path === 'string') {
            next({ ...result, path: rescopeRedirect(result.path, to.params?.orgSlug) });
            return;
        }
        next(result);
    });
});

/**
 * Produce a shallow copy of the destination route whose `path` has the
 * /{orgSlug} prefix stripped, so the permission middleware (which matches on
 * unprefixed paths) resolves the correct required permissions.
 */
function buildNormalisedRoute(to) {
    const { orgSlug, rest } = splitOrgPath(to.path);
    if (!orgSlug) return to;
    return { ...to, path: rest, fullPath: rest + (to.fullPath.slice(to.path.length) || '') };
}

/**
 * Re-add the /{orgSlug} prefix to a redirect target returned by the permission
 * middleware. The middleware always returns UNPREFIXED app paths ('/', '/ess',
 * '/unauthorized', '/finance', …), so we always prefix unless the path is
 * already scoped to the resolved slug (idempotent, avoids /{slug}/{slug}/…).
 */
function rescopeRedirect(path, explicitSlug) {
    if (!path || typeof path !== 'string') return path;
    const slug = resolveOrgSlug(explicitSlug);
    if (path === `/${slug}` || path.startsWith(`/${slug}/`)) return path;
    if (path === '/') return `/${slug}`;
    return `/${slug}${path.startsWith('/') ? path : `/${path}`}`;
}

export default router;
