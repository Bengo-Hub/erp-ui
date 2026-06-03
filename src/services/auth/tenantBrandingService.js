/**
 * Tenant branding from auth-api (single source of truth — NOT stored locally).
 *
 * Per shared-docs/sso-integration-guide.md (Tenant branding, step 6):
 *   - Fetch GET ${VITE_AUTH_URL}/api/v1/tenants/by-slug/{slug}
 *   - Apply CSS variables: --tenant-primary / --tenant-secondary / --tenant-logo(-url)
 *   - Cache ~6h (matching JWT TTL). Do NOT provide an in-app branding editor —
 *     link to auth-ui /dashboard/settings?tab=branding instead.
 *
 * The cache is an in-memory + sessionStorage TTL cache of the *fetched* payload
 * only (transient), so we never persist branding as app config.
 */

import { authApiBase, getTenantSlug } from '@/services/auth/outletService';
import { EXTERNAL_SERVICES } from '@/config/externalServices';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = 'tenant-branding-cache';

function readCache(slug) {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.slug !== slug) return null;
        if (Date.now() - parsed.fetchedAt > SIX_HOURS_MS) return null;
        return parsed.data;
    } catch (_) {
        return null;
    }
}

function writeCache(slug, data) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ slug, data, fetchedAt: Date.now() }));
    } catch (_) {}
}

/**
 * Apply tenant branding CSS variables to :root. Sets the documented --tenant-*
 * vars and also mirrors them onto the app's existing --primary-color /
 * --secondary-color so current PrimeVue/Tailwind styles pick them up.
 */
export function applyTenantBrandingVars(tenant) {
    if (!tenant) return;
    const root = document.documentElement;
    const primary = tenant.primary_color || tenant.branding?.primary_color;
    const secondary = tenant.secondary_color || tenant.branding?.secondary_color;
    const logo = tenant.logo_url || tenant.logo || tenant.branding?.logo_url;

    if (primary) {
        root.style.setProperty('--tenant-primary', primary);
        root.style.setProperty('--primary-color', primary);
    }
    if (secondary) {
        root.style.setProperty('--tenant-secondary', secondary);
        root.style.setProperty('--secondary-color', secondary);
    }
    if (logo) {
        root.style.setProperty('--tenant-logo', `url("${logo}")`);
        root.style.setProperty('--tenant-logo-url', logo);
    }
    if (tenant.name) document.title = tenant.name;
}

/**
 * Fetch tenant branding from auth-api (public by-slug endpoint) and apply CSS
 * variables. Cached ~6h. Returns the tenant payload (or null). Fail-soft.
 *
 * @param {string} [slug]
 * @param {{ force?: boolean }} [opts]
 */
export async function loadTenantBranding(slug, opts = {}) {
    const tenantSlug = slug || getTenantSlug();
    const base = authApiBase();
    if (!tenantSlug || !base) return null;

    if (!opts.force) {
        const cached = readCache(tenantSlug);
        if (cached) {
            applyTenantBrandingVars(cached);
            return cached;
        }
    }

    try {
        const res = await fetch(`${base}/api/v1/tenants/by-slug/${encodeURIComponent(tenantSlug)}`, {
            headers: { Accept: 'application/json' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        writeCache(tenantSlug, data);
        applyTenantBrandingVars(data);
        return data;
    } catch (error) {
        console.warn('[tenantBrandingService] loadTenantBranding failed:', error?.message);
        return null;
    }
}

/** Deep-link to the auth-ui branding settings (we do NOT edit branding in-app). */
export function brandingSettingsUrl() {
    const base = (EXTERNAL_SERVICES.auth || '').replace(/\/$/, '');
    return `${base}/dashboard/settings?tab=branding`;
}

export default { loadTenantBranding, applyTenantBrandingVars, brandingSettingsUrl };
