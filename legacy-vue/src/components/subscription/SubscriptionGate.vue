<script setup>
/**
 * SubscriptionGate — wraps content that requires a specific feature (or simply
 * an active subscription).
 *
 * Per shared-docs/subscription-gating-guide.md (SubscriptionGate):
 *  - Shows children optimistically while subscription state is still loading.
 *  - When gated, shows a lock + upgrade prompt linking to subscriptions-ui.
 *  - Platform owners always pass.
 *
 * Usage:
 *   <SubscriptionGate feature="multi_outlet"> ...gated UI... </SubscriptionGate>
 *   <SubscriptionGate require-active> ...mutation buttons... </SubscriptionGate>
 */
import { useSubscription } from '@/composables/useSubscription';
import { openExternalService } from '@/config/externalServices';
import { computed } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
    // Feature code required (Trinity Layer 2 feature gate). Optional.
    feature: { type: String, default: '' },
    // If true, gate purely on an active subscription (no specific feature).
    requireActive: { type: Boolean, default: false },
    // Optional friendly name shown in the upgrade prompt.
    label: { type: String, default: '' }
});

const store = useStore();
const { isActive, hasFeature, loaded } = useSubscription();

const user = computed(() => store.state.auth.user);
const isPlatformOwner = computed(() => user.value?.is_platform_owner === true || user.value?.isSuperuser === true);

const allowed = computed(() => {
    if (isPlatformOwner.value) return true;
    // Optimistic during loading — never flash a lock before we know.
    if (!loaded.value) return true;
    if (props.feature) return hasFeature(props.feature);
    if (props.requireActive) return isActive.value;
    return true;
});

function onUpgrade() {
    openExternalService('billing');
}
</script>

<template>
    <slot v-if="allowed" />
    <div v-else class="subscription-gate">
        <i class="pi pi-lock subscription-gate__icon" />
        <div class="subscription-gate__body">
            <p class="subscription-gate__title">{{ label || 'This feature requires an upgrade' }}</p>
            <p class="subscription-gate__hint">Upgrade your plan to unlock this feature.</p>
        </div>
        <Button label="Upgrade" icon="pi pi-arrow-up-right" size="small" @click="onUpgrade" />
    </div>
</template>

<style scoped>
.subscription-gate {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px dashed var(--surface-border, #e5e7eb);
    border-radius: 0.75rem;
    background: var(--surface-50, #f8fafc);
}
.subscription-gate__icon {
    font-size: 1.5rem;
    color: var(--text-color-secondary, #64748b);
    flex-shrink: 0;
}
.subscription-gate__body {
    flex: 1;
    min-width: 0;
}
.subscription-gate__title {
    margin: 0;
    font-weight: 600;
}
.subscription-gate__hint {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--text-color-secondary, #64748b);
}
.dark .subscription-gate {
    background: var(--surface-800, #1e293b);
}
</style>
