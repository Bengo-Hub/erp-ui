/**
 * useSubscription — lazy subscription state for the ERP UI.
 *
 * Implements the frontend hook from shared-docs/subscription-gating-guide.md and
 * the Trinity Layer 2 (Licensing) contract:
 *   - Fetches AFTER auth from subscriptions-api:
 *       GET ${VITE_SUBSCRIPTIONS_API_URL}/api/v1/tenants/{tenant_id}/subscription
 *     with Bearer token + tenant headers (X-Tenant-ID / X-Tenant-Slug).
 *   - Fail-open: returns null on error and NEVER blocks the UI.
 *   - Skips the fetch for platform owners (auto-grants active/enterprise).
 *   - Exposes: isActive, isPastDue, isExpired, isTrial, needsSubscription,
 *     hasFeature(code), getLimit(key), plus trial/expiry helpers for the banner.
 *
 * The state is module-level (shared singleton) so the banner, gates and any page
 * all read the same lazily-loaded value.
 */

import { computed, ref } from 'vue';
import { getAccessToken } from '@/services/auth/ssoService';

const subscription = ref(null); // raw subscriptions-api payload (or null)
const loaded = ref(false);
const loading = ref(false);
let inflight = null;

function subsApiBase() {
    const url = import.meta.env.VITE_SUBSCRIPTIONS_API_URL || '';
    return url.replace(/\/$/, '');
}

function statusOf(sub) {
    return String(sub?.status || sub?.sub_status || '').toUpperCase();
}

/**
 * Lazily fetch subscription info once per session (call after auth). Platform
 * owners short-circuit to a synthetic active/enterprise record. Fail-open.
 *
 * @param {{ tenantId?: string, tenantSlug?: string, isPlatformOwner?: boolean, force?: boolean }} [opts]
 */
async function load(opts = {}) {
    const { isPlatformOwner = false, force = false } = opts;
    const tenantId = opts.tenantId || localStorage.getItem('tenant_id') || '';
    const tenantSlug = opts.tenantSlug || localStorage.getItem('tenant_slug') || '';

    if (loaded.value && !force) return subscription.value;
    if (inflight) return inflight;

    // Platform owners do not consume tenant subscriptions — auto-grant.
    if (isPlatformOwner) {
        subscription.value = { status: 'ACTIVE', plan: 'enterprise', features: [], limits: {}, _synthetic: true };
        loaded.value = true;
        return subscription.value;
    }

    const base = subsApiBase();
    const token = getAccessToken();
    if (!base || !tenantId || !token) {
        // Nothing to fetch with — fail-open (treat as no subscription record).
        loaded.value = true;
        subscription.value = null;
        return null;
    }

    loading.value = true;
    inflight = (async () => {
        try {
            const res = await fetch(`${base}/api/v1/tenants/${encodeURIComponent(tenantId)}/subscription`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'X-Tenant-ID': tenantId,
                    ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {})
                }
            });
            if (!res.ok) {
                // 404 → no subscription (free tier); other errors → fail-open null.
                subscription.value = null;
            } else {
                subscription.value = await res.json();
            }
        } catch (error) {
            console.warn('[useSubscription] fetch failed (fail-open):', error?.message);
            subscription.value = null;
        } finally {
            loaded.value = true;
            loading.value = false;
        }
        return subscription.value;
    })();

    try {
        return await inflight;
    } finally {
        inflight = null;
    }
}

function reset() {
    subscription.value = null;
    loaded.value = false;
    loading.value = false;
    inflight = null;
}

export function useSubscription() {
    const status = computed(() => statusOf(subscription.value));

    const isActive = computed(() => status.value === 'ACTIVE' || status.value === 'TRIAL' || status.value === 'TRIALING');
    const isTrial = computed(() => status.value === 'TRIAL' || status.value === 'TRIALING');
    const isPastDue = computed(() => status.value === 'PAST_DUE' || status.value === 'PASTDUE');
    const isExpired = computed(() => status.value === 'EXPIRED' || status.value === 'CANCELED' || status.value === 'CANCELLED');
    // No record at all (free tier / not provisioned).
    const isFree = computed(() => loaded.value && !subscription.value);
    // Non-platform tenant with no active sub → should be nudged to subscribe.
    const needsSubscription = computed(() => loaded.value && !isActive.value);

    const features = computed(() => {
        const s = subscription.value || {};
        return s.features || s.sub_features || s.plan?.features || [];
    });

    const limits = computed(() => {
        const s = subscription.value || {};
        return s.limits || s.sub_limits || s.plan?.limits || {};
    });

    const hasFeature = (code) => {
        if (!code) return false;
        // Optimistic during loading; platform/synthetic always true.
        if (!loaded.value) return true;
        if (subscription.value?._synthetic) return true;
        const f = features.value;
        return Array.isArray(f) ? f.includes(code) : !!f?.[code];
    };

    const getLimit = (key) => {
        const l = limits.value;
        const v = l ? l[key] : undefined;
        return typeof v === 'number' ? v : v == null ? null : Number(v);
    };

    // Expiry/trial timing for the banner.
    const expiresAt = computed(() => {
        const s = subscription.value || {};
        const raw = s.expires_at || s.current_period_end || s.trial_end || s.sub_expires;
        if (!raw) return null;
        // sub_expires is a unix seconds claim; ISO strings are also supported.
        const d = typeof raw === 'number' ? new Date(raw * 1000) : new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    });

    const daysUntilExpiry = computed(() => {
        if (!expiresAt.value) return null;
        return Math.ceil((expiresAt.value.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    });

    const trialEndingSoon = computed(() => isTrial.value && daysUntilExpiry.value !== null && daysUntilExpiry.value <= 3);

    return {
        // state
        subscription,
        loaded,
        loading,
        status,
        // booleans
        isActive,
        isTrial,
        isPastDue,
        isExpired,
        isFree,
        needsSubscription,
        trialEndingSoon,
        // data
        features,
        limits,
        expiresAt,
        daysUntilExpiry,
        // methods
        hasFeature,
        getLimit,
        load,
        reset
    };
}

export default useSubscription;
