<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { financeService } from '@/services/finance/financeService';
import { useToast } from '@/composables/useToast';
import { formatCurrency } from '@/utils/formatters';

const route = useRoute();
const props = defineProps({
    accountIdProp: { type: [String, Number], default: null }
});
const { showToast } = useToast();

const accountId = computed(() => props.accountIdProp ?? route.params.id);
const account = ref(null);
const transactions = ref([]);
const loading = ref(false);

// Pagination state
const page = ref(1);
const pageSize = ref(25);
const pageSizeOptions = [10, 25, 50, 100];
const ordering = ref('-transaction_date');
const searchQuery = ref('');
const totalPages = ref(1);
const totalCount = ref(0);

// Balance summary
const balanceSummary = ref(null);

const fetchAccount = async () => {
    try {
        const resp = await financeService.getPaymentAccount(accountId);
        account.value = resp.data || resp;
    } catch (e) {
        console.error('Error fetching account:', e);
        showToast('error', 'Error', 'Failed to load account details');
    }
};

// Filter state
const transactionTypeFilter = ref('');
const startDateFilter = ref(null);
const endDateFilter = ref(null);
const minAmountFilter = ref(null);
const maxAmountFilter = ref(null);

const fetchTransactions = async (opts = {}) => {
    loading.value = true;
    try {
        const params = { page: opts.page || page.value, page_size: opts.pageSize || pageSize.value, ordering: ordering.value };
        if (opts.search !== undefined) searchQuery.value = opts.search;
        if (searchQuery.value) params.search = searchQuery.value;

        // include filters
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

// Robust transaction date formatter (fallbacks: transaction_date, created_at, updated_at)
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
    // Toggle ordering: if current equals field -> -field, if -field -> field, else set -field (default DESC)
    if (ordering.value === field) ordering.value = '-' + field;
    else if (ordering.value === '-' + field) ordering.value = field;
    else ordering.value = '-' + field;
    // refresh with new ordering
    fetchTransactions({ page: 1 });
};

const fetchBalanceSummary = async () => {
    try {
        const resp = await financeService.getAccountBalance(accountId);
        balanceSummary.value = resp?.data || resp;
    } catch (e) {
        console.error('Error fetching account balance summary:', e);
        balanceSummary.value = null;
    }
};

const refreshAll = async (account_id) => {
    // If an account_id was provided, ensure it matches
    if (account_id && String(account_id) !== String(accountId)) return;
    await Promise.all([fetchAccount(), fetchTransactions(), fetchBalanceSummary()]);
};

const onPaymentRecorded = (e) => {
    const id = e?.detail?.account_id;
    refreshAll(id);
};

const pageTotal = computed(() => {
    return transactions.value.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
});

onMounted(() => {
    refreshAll();
    window.addEventListener('finance.payment.recorded', onPaymentRecorded);
});

onUnmounted(() => {
    window.removeEventListener('finance.payment.recorded', onPaymentRecorded);
});
</script>

<template>
    <div class="container-fluid">
        <div class="row mb-3">
            <div class="col-sm-6">
                <h3>Account: {{ account?.name || 'Account' }}</h3>
                <p class="text-muted">
                    Account Number: 
                    <span v-if="account?.account_type === 'mobile_money'">Mobile: {{ account?.account_number }}</span>
                    <span v-else>{{ account?.account_number }}</span>
                </p>
            </div>
            <div class="col-sm-3 text-end">
                <h4>Balance: {{ formatCurrency(balanceSummary?.current_balance || account?.opening_balance || 0) }}</h4>
            </div>
            <div class="col-sm-3 text-end">
                <div class="d-flex gap-2 justify-content-end align-items-center">
                    <input type="search" v-model="searchQuery" placeholder="Search transactions" class="form-control form-control-sm" @keyup.enter="fetchTransactions({ page: 1, search: searchQuery })" />
                    <select v-model.number="transactionTypeFilter" class="form-select form-select-sm" @change="applyFilters">
                        <option value="">All types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="payment">Payment</option>
                        <option value="refund">Refund</option>
                        <option value="transfer">Transfer</option>
                    </select>
                    <input type="date" v-model="startDateFilter" class="form-control form-control-sm" @change="applyFilters" />
                    <input type="date" v-model="endDateFilter" class="form-control form-control-sm" @change="applyFilters" />
                    <input type="number" v-model.number="minAmountFilter" placeholder="Min" class="form-control form-control-sm" style="width: 80px;" />
                    <input type="number" v-model.number="maxAmountFilter" placeholder="Max" class="form-control form-control-sm" style="width: 80px;" />
                    <select v-model.number="pageSize" @change="fetchTransactions({ page: 1, pageSize })" class="form-select form-select-sm">
                        <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <button class="btn btn-outline-secondary btn-sm" @click="refreshAll()">Refresh</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Transactions</h5>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th><button class="btn btn-link btn-sm p-0" @click="setOrdering('transaction_date')">Date</button></th>
                            <th><button class="btn btn-link btn-sm p-0" @click="setOrdering('transaction_type')">Type</button></th>
                            <th>Description</th>
                            <th>Reference</th>
                            <th class="text-end"><button class="btn btn-link btn-sm p-0" @click="setOrdering('amount')">Amount</button></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="t in transactions" :key="t.id">
                            <td>{{ formatTxnDate(t) }}</td>
                            <td>{{ t.transaction_type_display || t.transaction_type }}</td>
                            <td>{{ t.description }}</td>
                            <td>{{ t.reference_id }}</td>
                            <td class="text-end">{{ formatCurrency(t.amount) }}</td>
                        </tr>
                        <tr v-if="!transactions.length">
                            <td colspan="5" class="text-center">No transactions found</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" class="text-end"><strong>Page totals</strong></td>
                            <td class="text-end"><strong>{{ formatCurrency(pageTotal) }}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-end">Current Balance</td>
                            <td class="text-end"><strong>{{ formatCurrency(balanceSummary?.current_balance || account?.opening_balance || 0) }}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <small>Showing page {{ page }} of {{ totalPages }} — {{ totalCount }} total</small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-secondary me-2" :disabled="page <= 1" @click="fetchTransactions({ page: page - 1 })">Previous</button>
                            <button class="btn btn-sm btn-outline-secondary" :disabled="page >= totalPages" @click="fetchTransactions({ page: page + 1 })">Next</button>
                        </div>
                    </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container-fluid h3 { margin-bottom: 0.5rem }
</style>
