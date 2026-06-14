/**
 * Outlet/branch context helpers (auth-api outlet list + selection state).
 *
 * Mirrors the Outlet/Branch Context section of
 * shared-docs/sso-integration-guide.md:
 *   - Outlet list comes from auth-api  GET /api/v1/tenants/{slug}/outlets  (public, no auth)
 *   - Selected outlet is stored in localStorage under `erp-selected-outlet-id`
 *     and sent as X-Outlet-ID on every request (see ssoService.setOutletId +
 *     the axios request interceptor).
 *
 * Env:
 *   VITE_AUTH_URL  e.g. https://sso.codevertexitsolutions.com  (auth-api base)
 *   (falls back to VITE_SSO_URL / VITE_AUTH_API_URL)
 */

import { getOutletId, setOutletId } from '@/services/auth/ssoService';

export { getOutletId, setOutletId };

/** Base URL of auth-api (no trailing slash). */
export function authApiBase() {
    const url = import.meta.env.VITE_AUTH_URL || import.meta.env.VITE_SSO_URL || import.meta.env.VITE_AUTH_API_URL || '';
    return url.replace(/\/$/, '');
}

export function getTenantSlug() {
    return localStorage.getItem('tenant_slug') || '';
}

export function getTenantId() {
    return localStorage.getItem('tenant_id') || '';
}

export function isHqUser() {
    return localStorage.getItem('is_hq_user') === 'true';
}

/**
 * Fetch the (non-archived) outlets for a tenant from auth-api. Public endpoint —
 * no Authorization header. Returns [] on any failure (fail-soft).
 *
 * @param {string} slug tenant slug
 * @returns {Promise<Array<{id,code,name,use_case,is_hq,status,settings}>>}
 */
export async function fetchOutlets(slug) {
    const base = authApiBase();
    const tenantSlug = slug || getTenantSlug();
    if (!base || !tenantSlug) return [];
    try {
        const res = await fetch(`${base}/api/v1/tenants/${encodeURIComponent(tenantSlug)}/outlets`, {
            headers: { Accept: 'application/json' }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.outlets || data?.results || [];
        // Filter out archived outlets before showing in UI.
        return list.filter((o) => String(o?.status || '').toLowerCase() !== 'archived');
    } catch (error) {
        console.warn('[outletService] fetchOutlets failed:', error?.message);
        return [];
    }
}

/**
 * Rehydrate the outlet header from localStorage on app mount / reload. Returns
 * the restored outlet id (or null). The axios interceptor reads the same key,
 * so this is mostly a no-op that also re-broadcasts the `outlet:changed` event.
 */
export function rehydrateOutlet() {
    const stored = getOutletId();
    if (stored) setOutletId(stored);
    return stored;
}

export default { fetchOutlets, rehydrateOutlet, getOutletId, setOutletId, authApiBase, getTenantSlug, getTenantId, isHqUser };
