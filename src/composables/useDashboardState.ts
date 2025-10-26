/**
 * Centralized Dashboard State Management Composable
 * Provides unified loading, error, and data state management across all dashboards
 * Ensures consistent UX with standardized error handling and loading indicators
 */

import { useToast } from '@/composables/useToast';
import { ref } from 'vue';

interface DashboardState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export const useDashboardState = () => {
    const { showToast } = useToast();

    const state = ref<DashboardState>({
        loading: false,
        error: null,
        success: false
    });

    /**
     * Start loading state
     */
    const startLoading = () => {
        state.value.loading = true;
        state.value.error = null;
        state.value.success = false;
    };

    /**
     * Handle successful data fetch
     */
    const handleSuccess = (message: string = 'Dashboard data refreshed successfully') => {
        state.value.loading = false;
        state.value.error = null;
        state.value.success = true;
        showToast('success', 'Success', message, 3000);
    };

    /**
     * Handle error with optional fallback
     */
    const handleError = (error: Error | string, message: string = 'Failed to load dashboard data', useFallback: boolean = false) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Dashboard Error: ${message}`, errorMsg);

        state.value.loading = false;
        state.value.error = errorMsg;
        state.value.success = false;

        const fallbackText = useFallback ? '. Using fallback data.' : '';
        showToast('error', 'Error', message + fallbackText, 5000);
    };

    /**
     * Reset state
     */
    const resetState = () => {
        state.value = {
            loading: false,
            error: null,
            success: false
        };
    };

    /**
     * Execute data fetch with state management
     */
    const executeDataFetch = async <T>(
        fetchFunction: () => Promise<T>,
        fallbackFunction?: () => Promise<T> | T,
        successMessage?: string
    ): Promise<T | null> => {
        startLoading();
        try {
            const result = await fetchFunction();
            handleSuccess(successMessage);
            return result;
        } catch (error) {
            handleError(error, 'Failed to load dashboard data', !!fallbackFunction);

            if (fallbackFunction) {
                try {
                    const fallbackResult = await fallbackFunction();
                    return fallbackResult;
                } catch (fallbackError) {
                    console.error('Fallback fetch also failed:', fallbackError);
                    return null;
                }
            }
            return null;
        }
    };

    return {
        state,
        startLoading,
        handleSuccess,
        handleError,
        resetState,
        executeDataFetch
    };
};
