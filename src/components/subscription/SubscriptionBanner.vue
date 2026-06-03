<script setup>
/**
 * SubscriptionBanner — persistent top-of-layout banner.
 *
 * Per shared-docs/subscription-gating-guide.md (SubscriptionBanner):
 *  - Shows nothing for active/trial subs (unless trial ends in < 3 days).
 *  - Warns for trial-ending-soon and past-due.
 *  - Errors for expired subscriptions.
 *  - Info for free tier (no subscription).
 *  - Dismissible per session. NEVER blocks access.
 *  - "Upgrade"/"Manage billing" links out to subscriptions-ui.
 *
 * Lazy-loads subscription state after auth; skips platform owners.
 */
import { useSubscription } from '@/composables/useSubscription';
import { EXTERNAL_SERVICES, openExternalService } from '@/config/externalServices';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const { isActive, isPastDue, isExpired, isFree, isTrial, trialEndingSoon, daysUntilExpiry, loaded, load } = useSubscription();

const dismissed = ref(sessionStorage.getItem('subscription-banner-dismissed') === 'true');

const user = computed(() => store.state.auth.user);
const isPlatformOwner = computed(() => user.value?.is_platform_owner === true || user.value?.isSuperuser === true);

onMounted(() => {
    // Lazy fetch after auth. Platform owners auto-grant (no fetch).
    if (store.state.auth.isAuthenticated) {
        load({
            tenantId: user.value?.tenant_id,
            tenantSlug: user.value?.tenant_slug,
            isPlatformOwner: isPlatformOwner.value
        });
    }
});

// What kind of banner (if any) to show.
const banner = computed(() => {
    if (!loaded.value || dismissed.value || isPlatformOwner.value) return null;

    if (isExpired.value) {
        return {
            severity: 'error',
            icon: 'pi pi-exclamation-triangle',
            text: 'Your subscription has expired. Renew to restore full access — your data is safe and remains viewable.',
            cta: 'Renew now'
        };
    }
    if (isPastDue.value) {
        return {
            severity: 'warn',
            icon: 'pi pi-credit-card',
            text: 'Your last payment failed and your subscription is past due. Please update your billing details.',
            cta: 'Update billing'
        };
    }
    if (trialEndingSoon.value) {
        const d = daysUntilExpiry.value;
        return {
            severity: 'warn',
            icon: 'pi pi-clock',
            text: `Your free trial ends ${d <= 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`}. Upgrade to keep using all features.`,
            cta: 'Upgrade plan'
        };
    }
    if (isFree.value) {
        return {
            severity: 'info',
            icon: 'pi pi-info-circle',
            text: 'You are on the free tier. Subscribe to unlock the full BengoBox platform.',
            cta: 'View plans'
        };
    }
    // Active (and not trial-ending) → nothing.
    if (isActive.value && !isTrial.value) return null;
    return null;
});

const billingUrl = computed(() => EXTERNAL_SERVICES.billing);

function onUpgrade() {
    openExternalService('billing');
}

function dismiss() {
    dismissed.value = true;
    sessionStorage.setItem('subscription-banner-dismissed', 'true');
}
</script>

<template>
    <div v-if="banner" class="subscription-banner" :class="`subscription-banner--${banner.severity}`" role="status">
        <div class="subscription-banner__content">
            <i :class="banner.icon" class="subscription-banner__icon" />
            <span class="subscription-banner__text">{{ banner.text }}</span>
        </div>
        <div class="subscription-banner__actions">
            <Button :label="banner.cta" size="small" severity="contrast" :title="billingUrl" @click="onUpgrade" />
            <button class="subscription-banner__close" aria-label="Dismiss" @click="dismiss">
                <i class="pi pi-times" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.subscription-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    flex-wrap: wrap;
}
.subscription-banner__content {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
}
.subscription-banner__icon {
    font-size: 1rem;
    flex-shrink: 0;
}
.subscription-banner__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}
.subscription-banner__close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    padding: 0.25rem;
}
.subscription-banner__close:hover {
    opacity: 1;
}
.subscription-banner--info {
    background: var(--blue-50, #eff6ff);
    color: var(--blue-700, #1d4ed8);
}
.subscription-banner--warn {
    background: var(--yellow-50, #fefce8);
    color: var(--yellow-800, #854d0e);
}
.subscription-banner--error {
    background: var(--red-50, #fef2f2);
    color: var(--red-700, #b91c1c);
}
.dark .subscription-banner--info {
    background: rgba(59, 130, 246, 0.15);
    color: #93c5fd;
}
.dark .subscription-banner--warn {
    background: rgba(234, 179, 8, 0.15);
    color: #fde047;
}
.dark .subscription-banner--error {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
}
</style>
