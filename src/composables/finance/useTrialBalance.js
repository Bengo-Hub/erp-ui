/**
 * useTrialBalance Composable
 * Manages Trial Balance report data and operations
 */
import { ref, reactive, computed } from 'vue';
import { financeService } from '@/services/finance/financeService';
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/utils/formatters';

export function useTrialBalance() {
    const { showToast } = useToast();

    // State
    const loading = ref(false);
    const error = ref(null);
    const selectedDate = ref(new Date());
    const selectedBranch = ref(null);
    const selectedAccountTypes = ref([]);
    const branches = ref([]);
    const showFilters = ref(false);
    const filter = ref('');

    const summary = reactive({
        total_debits: 0,
        total_credits: 0,
        balance_difference: 0,
        debit_count: 0,
        credit_count: 0,
        total_accounts: 0
    });

    const trialBalanceData = ref([]);

    // Options
    const accountTypeOptions = [
        { label: 'Asset', value: 'asset' },
        { label: 'Liability', value: 'liability' },
        { label: 'Equity', value: 'equity' },
        { label: 'Revenue', value: 'revenue' },
        { label: 'Expense', value: 'expense' }
    ];

    // Computed
    const filteredData = computed(() => {
        if (!filter.value) return trialBalanceData.value;

        const searchTerm = filter.value.toLowerCase();
        return trialBalanceData.value.filter((item) => {
            return (
                item.account_name?.toLowerCase().includes(searchTerm) ||
                item.account_code?.toLowerCase().includes(searchTerm) ||
                item.account_type?.toLowerCase().includes(searchTerm)
            );
        });
    });

    const isBalanced = computed(() => {
        return Math.abs(summary.balance_difference) < 0.01;
    });

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
                account_types: selectedAccountTypes.value.join(',')
            };

            const response = await financeService.getTrialBalance(params);

            trialBalanceData.value = response.data.data || [];

            calculateSummary();

            showToast('success', 'Trial balance report has been generated successfully');
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to generate trial balance report';
            showToast('error', error.value);
        } finally {
            loading.value = false;
        }
    };

    const calculateSummary = () => {
        const data = trialBalanceData.value;

        summary.total_debits = data.reduce((sum, item) => sum + (item.debit_amount || 0), 0);
        summary.total_credits = data.reduce((sum, item) => sum + (item.credit_amount || 0), 0);
        summary.balance_difference = summary.total_debits - summary.total_credits;
        summary.debit_count = data.filter((item) => (item.debit_amount || 0) > 0).length;
        summary.credit_count = data.filter((item) => (item.credit_amount || 0) > 0).length;
        summary.total_accounts = data.length;
    };

    const exportToCSV = () => {
        const csvRows = [];
        const headers = ['Account Code', 'Account Name', 'Account Type', 'Debit Amount', 'Credit Amount', 'Balance'];
        csvRows.push(headers.join(','));

        trialBalanceData.value.forEach((item) => {
            const values = [
                item.account_code || '',
                item.account_name || '',
                item.account_type || '',
                item.debit_amount || 0,
                item.credit_amount || 0,
                (item.debit_amount || 0) - (item.credit_amount || 0)
            ];
            csvRows.push(values.join(','));
        });

        const csvData = csvRows.join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trial-balance-${formatDate(selectedDate.value)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Trial balance exported successfully');
    };

    const printReport = () => {
        showToast('info', 'Print functionality coming soon');
    };

    const clearFilters = () => {
        selectedBranch.value = null;
        selectedAccountTypes.value = [];
        filter.value = '';
        loadData();
    };

    const getAccountTypeSeverity = (type) => {
        const severityMap = {
            asset: 'info',
            liability: 'warning',
            equity: 'success',
            revenue: 'primary',
            expense: 'danger'
        };
        return severityMap[type?.toLowerCase()] || 'secondary';
    };

    const getBalanceClass = (debit, credit) => {
        const balance = (debit || 0) - (credit || 0);
        return balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600';
    };

    return {
        // State
        loading,
        error,
        selectedDate,
        selectedBranch,
        selectedAccountTypes,
        branches,
        showFilters,
        filter,
        summary,
        trialBalanceData,
        accountTypeOptions,

        // Computed
        filteredData,
        isBalanced,

        // Methods
        loadBranches,
        loadData,
        calculateSummary,
        exportToCSV,
        printReport,
        clearFilters,
        getAccountTypeSeverity,
        getBalanceClass
    };
}
