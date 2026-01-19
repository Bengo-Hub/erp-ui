/**
 * useBalanceSheet Composable
 * Manages Balance Sheet report data and operations
 */
import { ref, reactive } from 'vue';
import { financeService } from '@/services/finance/financeService';
import { useToast } from '@/composables/useToast';

export function useBalanceSheet() {
    const { toast } = useToast();

    // State
    const loading = ref(false);
    const error = ref(null);
    const selectedDate = ref(new Date());
    const selectedBranch = ref(null);
    const selectedViewType = ref('standard');
    const branches = ref([]);

    const summary = reactive({
        total_assets: 0,
        total_liabilities: 0,
        total_equity: 0,
        assets_change: 0,
        liabilities_change: 0,
        equity_change: 0,
        debt_to_equity_ratio: 0,
        current_ratio: 0,
        asset_turnover: 0,
        return_on_assets: 0
    });

    const assetsData = ref([]);
    const liabilitiesData = ref([]);
    const equityData = ref([]);

    // Options
    const viewTypeOptions = [
        { label: 'Standard View', value: 'standard' },
        { label: 'Comparative View', value: 'comparative' },
        { label: 'Detailed View', value: 'detailed' }
    ];

    // Methods
    const loadBranches = async () => {
        try {
            const response = await financeService.getBranches();
            branches.value = response.data.results || [];
        } catch (err) {
            console.error('Error loading branches:', err);
        }
    };

    const loadData = async () => {
        loading.value = true;
        error.value = null;

        try {
            const params = {
                date: selectedDate.value?.toISOString().split('T')[0],
                branch_id: selectedBranch.value,
                view_type: selectedViewType.value
            };

            const response = await financeService.getBalanceSheet(params);

            // Update balance sheet data
            const data = response.data;
            assetsData.value = data.assets || [];
            liabilitiesData.value = data.liabilities || [];
            equityData.value = data.equity || [];

            // Update summary
            Object.assign(summary, data.summary || {});

            toast.add({
                severity: 'success',
                summary: 'Report Generated',
                detail: 'Balance sheet has been generated successfully',
                life: 3000
            });
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to generate balance sheet';
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.value,
                life: 5000
            });
        } finally {
            loading.value = false;
        }
    };

    const clearFilters = () => {
        selectedDate.value = new Date();
        selectedBranch.value = null;
        selectedViewType.value = 'standard';
        loadData();
    };

    const exportData = () => {
        toast.add({
            severity: 'info',
            summary: 'Export',
            detail: 'Export functionality will be implemented soon',
            life: 3000
        });
    };

    // Helper functions for display
    const getEquityChangeClass = () => {
        const change = summary.equity_change || 0;
        return change >= 0 ? 'card-change positive' : 'card-change negative';
    };

    const getEquityChangeIcon = () => {
        const change = summary.equity_change || 0;
        return change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
    };

    const getRatioStatus = () => {
        const ratio = summary.debt_to_equity_ratio || 0;
        if (ratio <= 0.5) return 'Excellent';
        if (ratio <= 1) return 'Good';
        if (ratio <= 2) return 'Fair';
        return 'High Risk';
    };

    const getRatioSeverity = () => {
        const ratio = summary.debt_to_equity_ratio || 0;
        if (ratio <= 0.5) return 'success';
        if (ratio <= 1) return 'info';
        if (ratio <= 2) return 'warning';
        return 'danger';
    };

    const getCurrentRatioStatus = () => {
        const ratio = summary.current_ratio || 0;
        if (ratio >= 2) return 'Excellent';
        if (ratio >= 1.5) return 'Good';
        if (ratio >= 1) return 'Fair';
        return 'Poor';
    };

    const getCurrentRatioSeverity = () => {
        const ratio = summary.current_ratio || 0;
        if (ratio >= 2) return 'success';
        if (ratio >= 1.5) return 'info';
        if (ratio >= 1) return 'warning';
        return 'danger';
    };

    const getAssetTurnoverStatus = () => {
        const turnover = summary.asset_turnover || 0;
        if (turnover >= 2) return 'Excellent';
        if (turnover >= 1) return 'Good';
        if (turnover >= 0.5) return 'Fair';
        return 'Poor';
    };

    const getAssetTurnoverSeverity = () => {
        const turnover = summary.asset_turnover || 0;
        if (turnover >= 2) return 'success';
        if (turnover >= 1) return 'info';
        if (turnover >= 0.5) return 'warning';
        return 'danger';
    };

    const getROAStatus = () => {
        const roa = summary.return_on_assets || 0;
        if (roa >= 15) return 'Excellent';
        if (roa >= 10) return 'Good';
        if (roa >= 5) return 'Fair';
        return 'Poor';
    };

    const getROASeverity = () => {
        const roa = summary.return_on_assets || 0;
        if (roa >= 15) return 'success';
        if (roa >= 10) return 'info';
        if (roa >= 5) return 'warning';
        return 'danger';
    };

    const getAssetIcon = (type) => {
        const icons = {
            current_assets: 'pi pi-money-bill',
            fixed_assets: 'pi pi-building',
            intangible_assets: 'pi pi-copyright',
            investments: 'pi pi-chart-line'
        };
        return icons[type?.toLowerCase()] || 'pi pi-wallet';
    };

    const getLiabilityIcon = (type) => {
        const icons = {
            current_liabilities: 'pi pi-credit-card',
            long_term_liabilities: 'pi pi-bank',
            contingent_liabilities: 'pi pi-exclamation-triangle'
        };
        return icons[type?.toLowerCase()] || 'pi pi-credit-card';
    };

    const getEquityIcon = (type) => {
        const icons = {
            shareholders_equity: 'pi pi-users',
            retained_earnings: 'pi pi-chart-line',
            capital_reserves: 'pi pi-save'
        };
        return icons[type?.toLowerCase()] || 'pi pi-chart-line';
    };

    return {
        // State
        loading,
        error,
        selectedDate,
        selectedBranch,
        selectedViewType,
        branches,
        summary,
        assetsData,
        liabilitiesData,
        equityData,
        viewTypeOptions,

        // Methods
        loadBranches,
        loadData,
        clearFilters,
        exportData,

        // Display helpers
        getEquityChangeClass,
        getEquityChangeIcon,
        getRatioStatus,
        getRatioSeverity,
        getCurrentRatioStatus,
        getCurrentRatioSeverity,
        getAssetTurnoverStatus,
        getAssetTurnoverSeverity,
        getROAStatus,
        getROASeverity,
        getAssetIcon,
        getLiabilityIcon,
        getEquityIcon
    };
}
