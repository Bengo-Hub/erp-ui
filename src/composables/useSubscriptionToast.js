/**
 * Global listener for the `subscription:inactive` window event.
 *
 * The axios 403 handler (utils/axiosConfig.js) dispatches `subscription:inactive`
 * when the backend returns {code:'subscription_inactive', upgrade:true} on a
 * mutation. Per shared-docs/subscription-gating-guide.md the frontend must show
 * an upgrade toast/banner — NOT redirect to login. This composable wires a
 * PrimeVue toast with an "Upgrade" action that opens subscriptions-ui (the
 * EXTERNAL_SERVICES.billing app).
 *
 * Mount once in the authenticated layout (AppLayout.vue), inside a component that
 * has the ToastService available.
 */
import { onBeforeUnmount, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { openExternalService } from '@/config/externalServices';

export function useSubscriptionToast() {
    const toast = useToast();
    let lastShown = 0;

    const handler = (event) => {
        // Debounce: a burst of failed mutations shouldn't stack toasts.
        const now = Date.now();
        if (now - lastShown < 4000) return;
        lastShown = now;

        const data = event?.detail || {};
        toast.add({
            severity: 'warn',
            summary: 'Subscription required',
            detail: data.error || 'Your subscription is not active. Upgrade to continue.',
            life: 8000,
            group: 'subscription'
        });
    };

    onMounted(() => {
        window.addEventListener('subscription:inactive', handler);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('subscription:inactive', handler);
    });

    return { openBilling: () => openExternalService('billing') };
}

export default useSubscriptionToast;
