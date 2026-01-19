/**
 * useAccountDetail Composable
 * Manages account details and transactions
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { financeService } from '@/services/finance/financeService';
import { useToast } from '@/composables/useToast';

export function useAccountDetail(accountId) {
    const { showToast } = useToast();

    // State
    const account = ref(null);
    const transactions = ref([]);
    const loading = ref(false);
    const balanceSummary = ref(null);

    // Pagination state
    const page = ref(1);
    const pageSize = ref(25);
    const pageSizeOptions = [10, 25, 50, 100];
    const ordering = ref('-transaction_date');
    const searchQuery = ref('');
    const totalPages = ref(1);
    const totalCount = ref(0);

    // Filter state
    const transactionTypeFilter = ref('');
    const startDateFilter = ref(null);
    const endDateFilter = ref(null);
    const minAmountFilter = ref(null);
    const maxAmountFilter = ref(null);

    // Computed
    const pageTotal = computed(() => {
        return transactions.value.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    });

    // Methods
    const fetchAccount = async () => {
        try {
            const resp = await financeService.getPaymentAccount(accountId.value);
            account.value = resp.data || resp;
        } catch (e) {
            console.error('Error fetching account:', e);
            showToast('error', 'Error', 'Failed to load account details');
        }
    };

    const fetchTransactions = async (opts = {}) => {
        loading.value = true;
        try {
            const params = {
                page: opts.page || page.value,
                page_size: opts.pageSize || pageSize.value,
                ordering: ordering.value
            };

            if (opts.search !== undefined) searchQuery.value = opts.search;
            if (searchQuery.value) params.search = searchQuery.value;

            // Include filters
            if (transactionTypeFilter.value) params.transaction_type = transactionTypeFilter.value;
            if (startDateFilter.value) params.start_date = startDateFilter.value;
            if (endDateFilter.value) params.end_date = endDateFilter.value;
            if (minAmountFilter.value) params.min_amount = minAmountFilter.value;
            if (maxAmountFilter.value) params.max_amount = maxAmountFilter.value;

            const resp = await financeService.getAccountTransactions(accountId.value, params);
            const body = resp?.data ?? resp;

            if (body && Array.isArray(body.results)) {
                transactions.value = body.results;
                totalCount.value = body.count || 0;
                totalPages.value = body.total_pages || Math.ceil((body.count || 0) / (body.page_size || pageSize.value));
                page.value = body.page || page.value;
                pageSize.value = body.page_size || pageSize.value;
            } else if (Array.isArray(body)) {
                transactions.value = body;
                totalCount.value = body.length;
                totalPages.value = 1;
                page.value = 1;
            } else if (body && Array.isArray(body.data)) {
                transactions.value = body.data;
                totalCount.value = body.data.length;
                totalPages.value = 1;
                page.value = 1;
            } else {
                transactions.value = [];
                totalCount.value = 0;
                totalPages.value = 1;
            }
        } catch (e) {
            console.error('Error loading transactions:', e);
            showToast('error', 'Error', 'Failed to load transactions');
        } finally {
            loading.value = false;
        }
    };

    const applyFilters = () => {
        fetchTransactions({ page: 1 });
    };

    const formatTxnDate = (t) => {
        const raw = t.transaction_date || t.created_at || t.updated_at || null;
        if (!raw) return 'N/A';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return raw;
            return d.toLocaleString();
        } catch (e) {
            return raw;
        }
    };

    const setOrdering = (field) => {
        if (ordering.value === field) ordering.value = '-' + field;
        else if (ordering.value === '-' + field) ordering.value = field;
        else ordering.value = '-' + field;
        fetchTransactions({ page: 1 });
    };

    const fetchBalanceSummary = async () => {
        try {
            const resp = await financeService.getAccountBalance(accountId.value);
            balanceSummary.value = resp?.data || resp;
        } catch (e) {
            console.error('Error fetching account balance summary:', e);
            balanceSummary.value = null;
        }
    };

    const refreshAll = async (account_id) => {
        if (account_id && String(account_id) !== String(accountId.value)) return;
        await Promise.all([fetchAccount(), fetchTransactions(), fetchBalanceSummary()]);
    };

    const onPaymentRecorded = (e) => {
        const id = e?.detail?.account_id;
        refreshAll(id);
    };

    // Lifecycle
    onMounted(() => {
        refreshAll();
        window.addEventListener('finance.payment.recorded', onPaymentRecorded);
    });

    onUnmounted(() => {
        window.removeEventListener('finance.payment.recorded', onPaymentRecorded);
    });

    return {
        // State
        account,
        transactions,
        loading,
        balanceSummary,
        page,
        pageSize,
        pageSizeOptions,
        ordering,
        searchQuery,
        totalPages,
        totalCount,
        transactionTypeFilter,
        startDateFilter,
        endDateFilter,
        minAmountFilter,
        maxAmountFilter,

        // Computed
        pageTotal,

        // Methods
        fetchAccount,
        fetchTransactions,
        applyFilters,
        formatTxnDate,
        setOrdering,
        fetchBalanceSummary,
        refreshAll
    };
}
