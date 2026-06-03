<script setup>
import { handleCallback, getOutletId } from '@/services/auth/ssoService';
import { loadTenantBranding } from '@/services/auth/tenantBrandingService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
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
    const slug = claims.tenant_slug || localStorage.getItem('tenant_slug') || '';
    const selectOutletPath = slug ? `/${slug}/auth/select-outlet` : '/auth/select-outlet';

    // Already pinned (single-outlet staff) — handleCallback stored it.
    if (claims.outlet_id && claims.is_hq_user !== true) {
        return intended || '/';
    }
    // HQ user or no outlet in JWT: if we have a stored outlet, keep using it.
    if (getOutletId()) {
        return intended || '/';
    }
    // Otherwise force outlet selection first; remember where we were headed.
    if (intended && intended !== '/') {
        sessionStorage.setItem('post_outlet_redirect', intended);
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
    }
});
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
                <a href="/" class="text-primary">Return home</a>
            </template>
        </div>
    </div>
</template>
