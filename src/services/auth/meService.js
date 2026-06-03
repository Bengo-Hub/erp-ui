/**
 * Two-step /auth/me profile loader (SSO identity + ERP service RBAC).
 *
 * Implements the "Profile" enrichment contract from
 * shared-docs/sso-integration-guide.md (step 4) and
 * shared-docs/TRINITY-AUTHORIZATION-PATTERN.md (Service auth/me endpoint):
 *
 *   (a) GET ${VITE_SSO_URL}/api/v1/auth/me   → identity + global roles + auth.* perms
 *   (b) GET  /api/v1/auth/me/                 → ERP service role + service.* permissions
 *
 * The two responses are merged into a single user object so the existing
 * usePermissions.js composable keeps working off `user.permissions`.
 *
 * Caching: a simple in-module cache with a TanStack-like staleTime keeps the
 * first read after login fast and avoids hammering the endpoints on every mount
 * (auth-api caches /auth/me in Redis; we mirror that with a client TTL).
 */

import axios from '@/utils/axiosConfig';
import { getAccessToken, ssoBaseUrl } from '@/services/auth/ssoService';

// ~5 minutes, aligned with the lower bound recommended in the SSO guide.
const STALE_TIME_MS = 5 * 60 * 1000;

const cache = {
    profile: null,
    fetchedAt: 0,
    inflight: null
};

export function clearProfileCache() {
    cache.profile = null;
    cache.fetchedAt = 0;
    cache.inflight = null;
}

function isFresh() {
    return cache.profile && Date.now() - cache.fetchedAt < STALE_TIME_MS;
}

/**
 * Step (a): SSO identity + global roles + auth-service permissions.
 * Uses fetch (not the ERP axios instance) so it always hits the SSO origin.
 */
export async function fetchSsoIdentity() {
    const base = ssoBaseUrl();
    const token = getAccessToken();
    if (!base || !token) return null;
    const res = await fetch(`${base}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    if (!res.ok) {
        // 401/403 here means the token is bad — let the caller decide. Other
        // codes are non-fatal (we can still fall back to JWT claims).
        const err = new Error(`SSO /auth/me failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

/**
 * Step (b): ERP service role + fine-grained service permissions.
 * Hits the ERP backend via the shared axios instance (Bearer + tenant headers).
 * NOTE the trailing slash — the ERP (Django) route is `/api/v1/auth/me/`.
 * The axios 401 handler already refreshes once; a 404 means the user is not yet
 * provisioned (JIT delay) and the caller falls back to global roles.
 */
export async function fetchErpProfile() {
    try {
        const { data } = await axios.get('/auth/me/', {
            // Mark so a future interceptor can choose to skip the logout path for
            // /auth/me (JIT sync delay) — see sso-integration-guide step 5.
            _skipAuthLogout: true
        });
        return data || null;
    } catch (error) {
        const status = error?.response?.status;
        if (status === 404) return null; // not provisioned yet → fall back
        throw error;
    }
}

/**
 * Normalise an array of role/permission-ish values to lowercase strings.
 */
function normaliseList(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map((v) => (typeof v === 'string' ? v.toLowerCase() : v)).filter(Boolean)));
}

/**
 * Merge SSO identity + ERP service profile into one user object that the rest of
 * the app (usePermissions, route guards, topbar) understands.
 *
 * Precedence:
 *  - identity (id, email, name, tenant) → SSO
 *  - permissions / service_roles        → ERP /auth/me/ (service RBAC, Layer 3)
 *  - global_roles                       → ERP if present else SSO
 *  - flags (is_platform_owner, is_superuser, is_hq_user, outlet_*) → ERP ?? SSO
 */
export function mergeProfiles(sso, erp) {
    const s = sso || {};
    const e = erp || {};

    const globalRoles = normaliseList(e.global_roles || s.global_roles || s.roles);
    const serviceRoles = normaliseList(e.service_roles || (e.service_role ? [e.service_role] : []));
    // RBAC roles used by usePermissions: union of global + service roles, plus a
    // singular service_role if present.
    const roles = Array.from(new Set([...globalRoles, ...serviceRoles]));

    // Permissions come from the ERP service (Layer 3). If the ERP call failed or
    // returned nothing, fall back to any auth-service permissions from SSO so the
    // UI is not completely locked down.
    const permissions = Array.isArray(e.permissions) && e.permissions.length
        ? e.permissions
        : Array.isArray(s.permissions)
            ? s.permissions
            : [];

    const isPlatformOwner = e.is_platform_owner ?? s.is_platform_owner ?? false;
    const isSuperuser = e.is_superuser ?? s.is_superuser ?? roles.includes('superuser');

    return {
        id: e.user_id || s.id || s.user_id || s.sub,
        email: e.email || s.email,
        name: e.name || s.name || s.full_name || s.fullName,
        first_name: s.first_name || s.given_name,
        last_name: s.last_name || s.family_name,
        roles,
        global_roles: globalRoles,
        service_roles: serviceRoles,
        service_role: e.service_role || null,
        permissions,
        is_platform_owner: isPlatformOwner === true,
        is_superuser: isSuperuser === true,
        // usePermissions checks isSuperuser (camel) too; mirror it.
        isSuperuser: isSuperuser === true || roles.includes('superuser'),
        is_hq_user: e.is_hq_user ?? s.is_hq_user ?? false,
        tenant_id: e.tenant_id || s.tenant_id || localStorage.getItem('tenant_id') || null,
        tenant_slug: e.tenant_slug || s.tenant_slug || localStorage.getItem('tenant_slug') || null,
        outlet_id: e.outlet_id || s.outlet_id || null,
        outlet_use_case: e.outlet_use_case || s.outlet_use_case || null
    };
}

/**
 * Load (and cache) the merged profile. Returns the merged user object.
 *
 * @param {{ force?: boolean }} [opts]
 */
export async function loadMergedProfile(opts = {}) {
    if (!opts.force && isFresh()) return cache.profile;
    if (cache.inflight) return cache.inflight;

    cache.inflight = (async () => {
        let sso = null;
        try {
            sso = await fetchSsoIdentity();
        } catch (error) {
            // If SSO identity itself is unauthorized, surface it; the axios/route
            // layer handles re-auth. For other failures we continue with ERP.
            if (error?.status === 401) throw error;
            console.warn('[meService] SSO /auth/me failed, continuing:', error?.message);
        }

        let erp = null;
        try {
            erp = await fetchErpProfile();
        } catch (error) {
            // Non-fatal: fall back to SSO identity / global roles.
            console.warn('[meService] ERP /auth/me/ failed, falling back to global roles:', error?.message);
        }

        const merged = mergeProfiles(sso, erp);
        cache.profile = merged;
        cache.fetchedAt = Date.now();
        return merged;
    })();

    try {
        return await cache.inflight;
    } finally {
        cache.inflight = null;
    }
}

export default { loadMergedProfile, fetchSsoIdentity, fetchErpProfile, mergeProfiles, clearProfileCache };
