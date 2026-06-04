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

// ---------------------------------------------------------------------------
// App routes that live under the AppLayout shell. These are authored with
// absolute-looking paths ('/payroll', '/hrm/…') so the existing 70+ hardcoded
// <router-link to="/…"> / router.push('/…') calls and the ROUTE_PERMISSIONS map
// (keyed on unprefixed paths) keep working unchanged.
//
// The app is tenant-scoped: the canonical URL is /{orgSlug}/…  (mirrors
// ordering-frontend's Next.js [orgSlug] segment). We achieve that WITHOUT
// rewriting every child path by mounting this same tree twice:
//   • a flat `/` parent (legacy / backward-compat — the guard redirects these
//     to the scoped URL), and
//   • a `/:orgSlug` parent whose children are the SAME route objects with their
//     leading '/' stripped so they resolve to /{orgSlug}/payroll, etc.
// ---------------------------------------------------------------------------
const appChildren = [
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
];

/**
 * Turn an absolute child route into a relative one so it can be mounted under
 * the /:orgSlug parent (Vue Router treats a leading '/' as absolute and ignores
 * the parent prefix). Names get an `org-` prefix to stay unique across the two
 * trees, and the original name is kept on meta.flatName for redirect mapping.
 */
function toScopedChild(route, depth = 0) {
    const scoped = { ...route };
    if (typeof scoped.path === 'string') {
        // Only the top level of each child needs de-absolutising; nested children
        // are already relative in this codebase, but handle them defensively.
        scoped.path = depth === 0 ? scoped.path.replace(/^\//, '') : scoped.path;
    }
    if (scoped.name) {
        scoped.meta = { ...(scoped.meta || {}), flatName: scoped.name };
        scoped.name = `org-${scoped.name}`;
    }
    if (Array.isArray(scoped.children)) {
        scoped.children = scoped.children.map((c) => toScopedChild(c, depth + 1));
    }
    return scoped;
}

const scopedAppChildren = appChildren.map((r) => toScopedChild(r, 0));

const routes = [
    //#################### TENANT-SCOPED APP (/{orgSlug}/…) ###################
    // Real source of truth for URLs. The :orgSlug param is captured by the
    // global guard into the auth store / axios tenant context.
    {
        path: '/:orgSlug',
        component: AppLayout,
        children: scopedAppChildren
    },
    //#################### LEGACY FLAT APP (/…) ###############################
    // Kept so existing unprefixed links resolve; the guard redirects them to
    // their /{orgSlug}/… equivalent.
    {
        path: '/',
        component: AppLayout,
        children: appChildren
    },
    //#################### SSO CALLBACK (no layout) ###########################
    // Tenant-scoped + legacy callback both supported.
    {
        path: '/:orgSlug/auth/callback',
        name: 'sso-callback',
        component: () => import('@/views/pages/auth/AuthCallback.vue'),
        meta: { title: 'Signing in', requiresAuth: false }
    },
    {
        path: '/auth/callback',
        name: 'sso-callback-flat',
        component: () => import('@/views/pages/auth/AuthCallback.vue'),
        meta: { title: 'Signing in', requiresAuth: false }
    },
    //#################### AUTH ROUTES #########################################
    ...authRoutes
];

export default routes;
export { appChildren, scopedAppChildren };
