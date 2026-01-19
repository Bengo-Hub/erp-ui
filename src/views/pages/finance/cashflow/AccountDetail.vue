<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountDetail } from '@/composables/finance/useAccountDetail';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const { formatCurrencySync } = useGlobalCurrency();
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

const route = useRoute();
const props = defineProps({
    accountIdProp: { type: [String, Number], default: null }
});

const accountId = computed(() => props.accountIdProp ?? route.params.id);

// Use composable
const {
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
    pageTotal,
    fetchTransactions,
    applyFilters,
    formatTxnDate,
    setOrdering,
    refreshAll
} = useAccountDetail(accountId);
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
