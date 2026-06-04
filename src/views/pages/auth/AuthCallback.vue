<script setup>
import { handleCallback, getOutletId } from '@/services/auth/ssoService';
import { loadTenantBranding } from '@/services/auth/tenantBrandingService';
import { orgPath, resolveOrgSlug, splitOrgPath } from '@/utils/tenantContext';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const route = useRoute();
const store = useStore();
const error = ref('');
const statusText = ref('Signing you in…');

/**
 * Decide where to go after a successful callback, honouring the outlet
 * preselection rules in shared-docs/sso-integration-guide.md (step 11):
 *  - single-outlet staff (outlet_id in JWT && is_hq_user=false) are auto-pinned
 *    in handleCallback() → proceed to the intended destination.
 *  - HQ users / empty outlet_id → restore a stored outlet, else send to the
 *    service-level select-outlet page.
 */
function resolveDestination(claims, intended) {
    // Org slug precedence: route param → JWT claim → captured tenant_slug.
    const slug = resolveOrgSlug(route.params?.orgSlug || claims.tenant_slug);
    const selectOutletPath = `/${slug}/auth/select-outlet`;

    // Scope an unprefixed intended destination to the tenant; leave already-scoped
    // paths untouched (avoid double-prefixing /{slug}/{slug}/…).
    const home = orgPath(slug, '/');
    let scopedIntended = home;
    if (intended && intended !== '/') {
        scopedIntended = splitOrgPath(intended).orgSlug ? intended : orgPath(slug, intended);
    }

    // Already pinned (single-outlet staff) — handleCallback stored it.
    if (claims.outlet_id && claims.is_hq_user !== true) {
        return scopedIntended;
    }
    // HQ user or no outlet in JWT: if we have a stored outlet, keep using it.
    if (getOutletId()) {
        return scopedIntended;
    }
    // Otherwise force outlet selection first; remember where we were headed.
    if (intended && intended !== '/') {
        sessionStorage.setItem('post_outlet_redirect', scopedIntended);
    }
    return selectOutletPath;
}

onMounted(async () => {
    try {
        const { claims, redirect } = await handleCallback();

        // Load the two-step /auth/me profile (SSO identity + ERP service RBAC).
        statusText.value = 'Loading your profile…';
        try {
            await store.dispatch('auth/loadSsoProfile', { force: true });
        } catch (e) {
            // Non-fatal: the user is authenticated; profile can refresh later.
            console.warn('Profile load after callback failed:', e?.message);
        }

        // Apply tenant branding from auth-api (cached ~6h). Fire-and-forget.
        loadTenantBranding(claims.tenant_slug).catch(() => {});

        const destination = resolveDestination(claims, redirect);
        router.replace(destination);
    } catch (e) {
        console.error('SSO callback failed:', e);
        error.value = e?.message || 'Sign-in failed. Please try again.';
        // Clean up the half-finished PKCE/state so a retry starts fresh, and drop
        // any stale tenant hint that triggered an access_denied ("not a member of
        // the requested tenant") so the retry resolves the tenant from the user's
        // primary org instead of re-sending the bad tenant.
        try {
            sessionStorage.removeItem('pkce_verifier');
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('sso_redirect_uri');
            if (e?.code === 'access_denied') localStorage.removeItem('tenant_slug');
        } catch (_) {
            /* storage unavailable */
        }
    }
});

/** Send the user back to the generic (flat) login page to retry. */
function backToSignIn() {
    router.replace('/auth/login');
}
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen">
        <div class="text-center">
            <template v-if="!error">
                <i class="pi pi-spin pi-spinner text-4xl text-primary" />
                <p class="mt-3 text-color-secondary">{{ statusText }}</p>
            </template>
            <template v-else>
                <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
                <p class="mt-3">{{ error }}</p>
                <div class="mt-3 flex gap-3 justify-content-center">
                    <a class="text-primary cursor-pointer" @click="backToSignIn">Back to sign in</a>
                    <a href="/" class="text-color-secondary">Return home</a>
                </div>
            </template>
        </div>
    </div>
</template>
