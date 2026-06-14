import { useToast } from '@/composables/useToast';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export function useEmployeeMapping() {
    const store = useStore();
    const router = useRouter();
    const { showToast } = useToast();

    const hasEmployeeMapping = computed(() => !!(store.state.auth.user?.employee_id));
    const isStaffOnly = computed(() => store.getters['auth/isStaffOnly']);

    const ensureEmployeeMapping = async () => {
        if (!hasEmployeeMapping.value) {
            try {
                await store.dispatch('auth/resolveEmployeeMapping');
            } catch (_) {}
        }
        return hasEmployeeMapping.value;
    };

    const requireEmployeeMapping = async (redirectIfMissing = true) => {
        const ok = await ensureEmployeeMapping();
        if (!ok && (isStaffOnly.value || redirectIfMissing)) {
            showToast('warn', 'Incomplete Setup', 'Your account is not linked to an employee record. Please contact HR or complete your profile.');
            if (redirectIfMissing) router.replace('/users/account');
        }
        return ok;
    };

    return {
        hasEmployeeMapping,
        isStaffOnly,
        ensureEmployeeMapping,
        requireEmployeeMapping
    };
}


