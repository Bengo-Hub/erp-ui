/**
 * Tenant context helpers — the Vue/erp-ui equivalent of ordering-frontend's
 * `src/providers/org-slug-provider.tsx` + `src/lib/routes.ts`.
 *
 * The ERP UI is tenant-scoped: every app URL is prefixed with the org slug, e.g.
 *   https://erp.codevertexitsolutions.com/{orgSlug}/auth/login
 *   https://erp.codevertexitsolutions.com/{orgSlug}/dashboard
 *
 * `orgSlug` is the FIRST path segment. The router guard (src/router/index.js)
 * captures it from the path into localStorage `tenant_slug`, exactly like
 * ordering-frontend's OrgSlugProvider does `localStorage.setItem("tenantSlug", orgSlug)`.
 *
 * Platform owner vs tenant user (mirrors ordering-frontend):
 *   - Platform owner  → orgSlug === 'codevertex'  OR  is_platform_owner claim true.
 *     The axios interceptor omits X-Tenant-ID/X-Tenant-Slug and instead drills
 *     into a tenant via ?tenantId=<uuid> (TenantFilter selection).
 *   - Tenant user     → scoped to their own org slug; axios sends
 *     X-Tenant-ID / X-Tenant-Slug headers.
 */

// The platform-owner org slug. Mirrors ordering-frontend where
// `orgSlug === 'codevertex'` ⇒ platform owner (user-menu-drawer.tsx, platform/page.tsx).
export const PLATFORM_OWNER_SLUG = 'codevertex';

// The platform-owner slug, re-exported for callers that need an EXPLICIT default
// (e.g. platform-owner-only screens). NOTE: this is deliberately NOT used as an
// implicit fallback in resolveOrgSlug — unauthenticated users have no tenant yet,
// and silently defaulting them to 'codevertex' made the SSO flow request a tenant
// they are not a member of ("not a member of the requested tenant"). Resolution
// now returns '' when the tenant is unknown so the caller can show the generic
// (flat) login page instead of guessing.
export const DEFAULT_ORG_SLUG = PLATFORM_OWNER_SLUG;

// First path segments that are NOT tenant slugs — real top-level routes that must
// keep working unprefixed (SSO callback, landing page, standalone auth pages,
// static asset folders). The guard prefixes these with /{orgSlug} when needed.
export const RESERVED_FIRST_SEGMENTS = new Set([
    'auth', // legacy /auth/* (login, callback, forgot-password, …) — kept for fallback
    'landing',
    'unauthorized',
    'assets',
    'images',
    'media',
    'favicon.ico'
]);

// Top-level segments of the app route table (first path segment of every app
// route in src/router/*Routes.js). A bare/legacy path whose first segment is one
// of these is an UNSCOPED app path (e.g. '/hrm/employees', '/ess') that must be
// rewritten to /{orgSlug}/…  — it is NOT an org slug. This is the discriminator
// that lets the guard tell '/codevertex' (an org slug → render dashboard) apart
// from '/hrm' (a legacy app path → needs the slug prefix).
//
// Keep in sync with the route group files (payroll/hrm/employees/leave/reports/
// appraisal/security/settings/userManagement/dashboard live here).
export const KNOWN_APP_SEGMENTS = new Set([
    'hrm',
    'ess',
    'users',
    'settings',
    'security',
    'dashboard',
    'calendar',
    'messages',
    'regularpayroll'
]);

/**
 * Build an org-scoped path. The erp-ui equivalent of ordering-frontend's
 * `orgRoute(orgSlug, path)` in src/lib/routes.ts.
 * e.g. orgPath('mss', '/payroll') → '/mss/payroll'
 */
export function orgPath(orgSlug, path = '/') {
    const slug = orgSlug || resolveOrgSlug();
    const tail = path.startsWith('/') ? path : `/${path}`;
    return `/${slug}${tail === '/' ? '' : tail}` || `/${slug}`;
}

/**
 * Resolve the active org slug. Order of precedence:
 *   1. explicit argument (e.g. route.params.orgSlug)
 *   2. persisted tenant_slug (set by the SSO callback + the router guard)
 *   3. '' (unknown) — NO implicit 'codevertex' default. An unauthenticated user
 *      has no tenant; the caller (router guard / SSO service) must treat '' as
 *      "tenant unknown" and fall back to the generic, flat /auth/login + an
 *      SSO authorize request WITHOUT a tenant hint (auth-api then resolves the
 *      tenant from the user's primary org membership).
 */
export function resolveOrgSlug(explicit) {
    if (explicit && typeof explicit === 'string') return explicit;
    try {
        const stored = localStorage.getItem('tenant_slug');
        if (stored) return stored;
    } catch (_) {
        /* localStorage unavailable */
    }
    return '';
}

/** Persist the active org slug so axios + later navigations can read it. */
export function setOrgSlug(orgSlug) {
    if (!orgSlug) return;
    try {
        localStorage.setItem('tenant_slug', orgSlug);
    } catch (_) {
        /* localStorage unavailable */
    }
}

/**
 * Is the first path segment a tenant org slug? It is, unless it is a reserved
 * top-level route (auth, landing…) or a known unscoped app segment (hrm, ess…).
 * Empty first segment (bare '/') is NOT an org slug.
 */
export function isOrgSlugSegment(segment) {
    if (!segment) return false;
    if (RESERVED_FIRST_SEGMENTS.has(segment)) return false;
    if (KNOWN_APP_SEGMENTS.has(segment)) return false;
    return true;
}

/**
 * Split a path into { orgSlug, rest } where `rest` is the unprefixed app path
 * (always starting with '/').
 *   • First segment is an org slug  → { orgSlug, rest } (prefix stripped).
 *   • First segment is reserved / a known app segment / empty → the path is an
 *     UNSCOPED path: { orgSlug: null, rest: <path unchanged> }. The caller
 *     (router guard) then prefixes it with the resolved org slug.
 */
export function splitOrgPath(fullPath) {
    const [pathOnly] = String(fullPath || '/').split('?');
    const segments = pathOnly.split('/').filter(Boolean);
    if (segments.length === 0) return { orgSlug: null, rest: '/' };
    const first = segments[0];
    if (!isOrgSlugSegment(first)) {
        return { orgSlug: null, rest: pathOnly || '/' };
    }
    const rest = '/' + segments.slice(1).join('/');
    return { orgSlug: first, rest: rest === '/' ? '/' : rest };
}

/**
 * Platform-owner check from a Vuex user object. Mirrors ordering-frontend's
 * `isElevated`/`isPlatformOwner` logic: the `is_platform_owner` claim OR the
 * tenant slug being the platform-owner slug.
 */
export function isPlatformOwnerUser(user, orgSlug) {
    const slug = orgSlug || resolveOrgSlug();
    if (slug === PLATFORM_OWNER_SLUG) return true;
    if (!user) return false;
    return (
        user.is_platform_owner === true ||
        user.isPlatformOwner === true ||
        user.tenant_slug === PLATFORM_OWNER_SLUG
    );
}

/**
 * Cheap platform-owner check usable outside Vue (e.g. the axios interceptor),
 * reading the flags persisted by the auth store + the router guard.
 */
export function isPlatformOwnerContext() {
    try {
        if (localStorage.getItem('is_platform_owner') === 'true') return true;
        if (localStorage.getItem('tenant_slug') === PLATFORM_OWNER_SLUG) return true;
    } catch (_) {
        /* localStorage unavailable */
    }
    return false;
}

export default {
    PLATFORM_OWNER_SLUG,
    DEFAULT_ORG_SLUG,
    RESERVED_FIRST_SEGMENTS,
    orgPath,
    resolveOrgSlug,
    setOrgSlug,
    isOrgSlugSegment,
    splitOrgPath,
    isPlatformOwnerUser,
    isPlatformOwnerContext
};
