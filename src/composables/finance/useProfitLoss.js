/**
 * useProfitLoss Composable
 * Manages Profit & Loss report data and operations
 */
import { ref } from 'vue';
import { financeService } from '@/services/finance/financeService';
import { useToast } from '@/composables/useToast';

export function useProfitLoss() {
    const { toast } = useToast();

    // State
    const profitData = ref(null);
    const loading = ref(true);
    const error = ref(null);

    // Methods
    const fetchData = async () => {
        try {
            loading.value = true;
            error.value = null;
            const response = await financeService.getProfitLoss();
            profitData.value = response.data;
        } catch (err) {
            console.error('Error fetching profit and loss data:', err);
            error.value = 'Failed to load profit data. Please try again.';
        } finally {
            loading.value = false;
        }
    };

    const refreshData = () => {
        fetchData();
    };

    return {
        // State
        profitData,
        loading,
        error,

        // Methods
        fetchData,
        refreshData
    };
}
