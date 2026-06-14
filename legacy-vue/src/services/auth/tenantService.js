/**
 * Tenant list + platform-owner tenant-filter state.
 *
 * Platform owners (codevertex superusers) do not send X-Tenant-ID; instead they
 * pick a tenant in the header TenantFilter and the selection is appended to
 * tenant-scoped API calls as `?tenantId=<uuid>` (see axiosConfig + the backend
 * pattern in shared-docs/TRINITY-AUTHORIZATION-PATTERN.md → Backend Tenant
 * Override for Platform Owners). "All Tenants" → no param → cross-tenant data.
 */

import axios from '@/utils/axiosConfig';
import { authApiBase } from '@/services/auth/outletService';

export const PLATFORM_TENANT_ID_KEY = 'platform-selected-tenant-id';
export const PLATFORM_TENANT_SLUG_KEY = 'platform-selected-tenant-slug';

export function getSelectedTenantId() {
    return localStorage.getItem(PLATFORM_TENANT_ID_KEY) || null;
}

export function getSelectedTenantSlug() {
    return localStorage.getItem(PLATFORM_TENANT_SLUG_KEY) || null;
}

/** Set (or clear) the platform-owner tenant filter. Pass null for "All Tenants". */
export function setSelectedTenant(tenant) {
    if (tenant && tenant.id) {
        localStorage.setItem(PLATFORM_TENANT_ID_KEY, tenant.id);
        if (tenant.slug) localStorage.setItem(PLATFORM_TENANT_SLUG_KEY, tenant.slug);
        else localStorage.removeItem(PLATFORM_TENANT_SLUG_KEY);
    } else {
        localStorage.removeItem(PLATFORM_TENANT_ID_KEY);
        localStorage.removeItem(PLATFORM_TENANT_SLUG_KEY);
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('tenant:changed', {
                detail: { tenantId: tenant?.id || null, tenantSlug: tenant?.slug || null }
            })
        );
    }
}

/**
 * Fetch the list of tenants for the platform-owner TenantFilter. Tries a couple
 * of likely auth-api endpoints and normalises to {id,name,slug}. Fail-soft → [].
 */
export async function fetchTenants() {
    const base = authApiBase();
    if (!base) return [];
    // Prefer the ERP/shared axios instance (carries Bearer for the admin list).
    const candidates = ['/tenants/', '/tenants'];
    for (const path of candidates) {
        try {
            const { data } = await axios.get(path, { baseURL: base.replace(/\/api\/v1$/, '') + '/api/v1' });
            const list = Array.isArray(data) ? data : data?.tenants || data?.results || [];
            if (list.length) {
                return list
                    .map((t) => ({ id: t.id || t.tenant_id, name: t.name || t.slug, slug: t.slug }))
                    .filter((t) => t.id);
            }
        } catch (_) {
            // try next candidate
        }
    }
    return [];
}

export default { fetchTenants, setSelectedTenant, getSelectedTenantId, getSelectedTenantSlug };
