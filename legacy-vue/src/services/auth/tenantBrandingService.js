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

/** Parse a #rrggbb / #rgb hex into {r,g,b}; null if invalid. */
function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let h = hex.trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** Mix a color toward white (amt>0) or black (amt<0) by a 0..1 fraction → #rrggbb. */
function shade(rgb, amt) {
    const t = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    const ch = (c) => Math.round((t - c) * p + c).toString(16).padStart(2, '0');
    return `#${ch(rgb.r)}${ch(rgb.g)}${ch(rgb.b)}`;
}

/**
 * Apply tenant branding CSS variables to :root. Drives the PrimeVue v4 primary palette
 * (--p-primary-*) and legacy --primary-color from the tenant's brand color, so the whole app —
 * including the sidebar active item, buttons and accents — adopts the tenant theme (pos-ui pattern).
 */
export function applyTenantBrandingVars(tenant) {
    if (!tenant) return;
    const root = document.documentElement;
    // auth-api returns colors nested under `brand_colors`; also support legacy/flat shapes.
    const primary = tenant.brand_colors?.primary || tenant.primary_color || tenant.branding?.primary_color;
    const secondary = tenant.brand_colors?.secondary || tenant.secondary_color || tenant.branding?.secondary_color;
    const logo = tenant.logo_url || tenant.logo || tenant.branding?.logo_url;

    if (primary) {
        root.style.setProperty('--tenant-primary', primary);
        root.style.setProperty('--primary-color', primary);
        const rgb = hexToRgb(primary);
        if (rgb) {
            // Brand RGB triplet for rgba() utilities (e.g. sidebar hover tints).
            root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            // PrimeVue v4 primary palette — a brand-anchored ramp so hover/active shades work.
            const ramp = {
                50: shade(rgb, 0.85), 100: shade(rgb, 0.7), 200: shade(rgb, 0.5), 300: shade(rgb, 0.3),
                400: shade(rgb, 0.15), 500: primary, 600: shade(rgb, -0.12), 700: shade(rgb, -0.24),
                800: shade(rgb, -0.36), 900: shade(rgb, -0.48), 950: shade(rgb, -0.6),
            };
            Object.entries(ramp).forEach(([k, v]) => root.style.setProperty(`--p-primary-${k}`, v));
            root.style.setProperty('--p-primary-color', primary);
            root.style.setProperty('--p-primary-contrast-color', '#ffffff');
        }
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
