<script setup>
import AccountForm from '@/components/finance/accounts/AccountForm.vue';
import AccountDetail from '@/views/pages/finance/cashflow/AccountDetail.vue';
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, reactive, ref } from 'vue';

const { showToast } = useToast();

// State
const loading = ref(false);
const accounts = ref([]);
const totalRecords = ref(0);
const showCreateForm = ref(false);
const showTransactionsDialog = ref(false);
const selectedAccount = ref(null);
const transactions = ref([]);
const transactionsLoading = ref(false);

// Filters
const filters = reactive({
    account_type: null,
    status: null,
    search: '',
    page: 1,
    page_size: 10,
    ordering: '-balance'
});

// Options
const accountTypeOptions = [
    { label: 'All Types', value: null },
    { label: 'Bank Account', value: 'bank' },
    { label: 'Cash Account', value: 'cash' },
    { label: 'Credit Card', value: 'credit_card' },
    { label: 'Investment', value: 'investment' },
    { label: 'Other', value: 'other' }
];

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' }
];

const sortOptions = [
    { label: 'Balance (High to Low)', value: '-balance' },
    { label: 'Balance (Low to High)', value: 'balance' },
    { label: 'Name (A-Z)', value: 'name' },
    { label: 'Name (Z-A)', value: '-name' },
    { label: 'Last Transaction', value: '-last_transaction' }
];

// Search with debounce
let searchTimeout;
const onSearchInput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filters.page = 1;
        loadAccounts();
    }, 500);
};

// Load accounts
const loadAccounts = async () => {
    loading.value = true;
    try {
        const params = { ...filters };
        const response = await financeService.getPaymentAccounts(params);
        accounts.value = response.data.results || response.data || [];
        totalRecords.value = response.data.count || accounts.value.length;
    } catch (error) {
        console.error('Error loading accounts:', error);
        showToast('error', 'Failed to load accounts');
    } finally {
        loading.value = false;
    }
};

// Pagination
const onPageChange = (event) => {
    filters.page = event.page + 1;
    filters.page_size = event.rows;
    loadAccounts();
};

// Sorting
const onSort = (event) => {
    filters.ordering = event.sortField === 'date' ? 'date' : `-${event.sortField}`;
    if (event.sortOrder === -1) {
        filters.ordering = filters.ordering.startsWith('-') ? filters.ordering.slice(1) : `-${filters.ordering}`;
    }
    loadAccounts();
};

// View account details (open details dialog)
const showAccountDetailDialog = ref(false);
const viewAccount = (account) => {
    selectedAccount.value = account;
    showAccountDetailDialog.value = true;
};

// View transactions
const viewTransactions = async (account) => {
    selectedAccount.value = account;
    showTransactionsDialog.value = true;
    await loadTransactions(account.id);
};

// Load transactions
const loadTransactions = async (accountId) => {
    transactionsLoading.value = true;
    try {
        const response = await financeService.getAccountTransactions(accountId);
        transactions.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('error', 'Failed to load transactions');
    } finally {
        transactionsLoading.value = false;
    }
};

// Edit account
const editAccount = (account) => {
    selectedAccount.value = account;
    showCreateForm.value = true;
};

// Delete account
const deleteAccount = async (account) => {
    if (!confirm(`Are you sure you want to delete account "${account.name}"?`)) return;

    try {
        await financeService.deletePaymentAccount(account.id);
        showToast('success', 'Account deleted successfully');
        loadAccounts();
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast('error', 'Failed to delete account');
    }
};

// Account saved callback
const onAccountSaved = () => {
    selectedAccount.value = null;
    loadAccounts();
};

// Utility functions
const getAccountTypeLabel = (type) => {
    const option = accountTypeOptions.find((opt) => opt.value === type);
    return option ? option.label : type;
};

const getAccountTypeSeverity = (type) => {
    const severityMap = {
        bank: 'primary',
        cash: 'success',
        credit_card: 'warning',
        investment: 'info',
        other: 'secondary'
    };
    return severityMap[type] || 'info';
};

const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
};

const getStatusSeverity = (status) => {
    const severityMap = {
        active: 'success',
        inactive: 'secondary',
        suspended: 'danger'
    };
    return severityMap[status] || 'info';
};

const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
};

// Load accounts on mount
onMounted(() => {
    loadAccounts();
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Accounts Management</h1>
                <p class="text-gray-600">Manage payment accounts and view transaction history</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
                <Button icon="pi pi-plus" label="Create Account" @click="showCreateForm = true" class="p-button-primary" />
                <Button icon="pi pi-refresh" label="Refresh" @click="loadAccounts" :loading="loading" severity="secondary" />
            </div>
        </div>

        <!-- Filters -->
        <Card>
            <template #content>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Account Type</label>
                        <Dropdown v-model="filters.account_type" :options="accountTypeOptions" optionLabel="label" optionValue="value" placeholder="All Types" class="w-full" @change="loadAccounts" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="All Statuses" class="w-full" @change="loadAccounts" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Search</label>
                        <InputText v-model="filters.search" class="w-full" placeholder="Search accounts..." @input="onSearchInput" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Sort By</label>
                        <Dropdown v-model="filters.ordering" :options="sortOptions" optionLabel="label" optionValue="value" class="w-full" @change="loadAccounts" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Accounts Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="accounts"
                    :loading="loading"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[10, 20, 50]"
                    :totalRecords="totalRecords"
                    :lazy="true"
                    @page="onPageChange"
                    @sort="onSort"
                    sortMode="single"
                    class="p-datatable-sm"
                    stripedRows
                    responsiveLayout="scroll"
                    :scrollable="true"
                    scrollHeight="400px"
                >
                    <Column field="name" header="Account Name" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="pi pi-wallet text-blue-600"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">{{ data.name }}</div>
                                    <div class="text-sm text-gray-500">{{ data.account_number }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="account_type" header="Type" sortable>
                        <template #body="{ data }">
                            <Tag :value="getAccountTypeLabel(data.account_type)" :severity="getAccountTypeSeverity(data.account_type)" />
                        </template>
                    </Column>

                    <Column field="balance" header="Current Balance" sortable>
                        <template #body="{ data }">
                            <div class="text-right">
                                <div class="font-bold text-lg" :class="getBalanceColor(data.balance)">
                                    {{ formatCurrency(data.balance) }}
                                </div>
                                <div class="text-sm text-gray-500">
                                    {{ data.currency || 'KES' }}
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>

                    <Column field="last_transaction" header="Last Transaction">
                        <template #body="{ data }">
                            <div class="text-sm">
                                <div class="text-gray-900">{{ formatDate(data.last_transaction) }}</div>
                                <div class="text-gray-500">{{ data.transaction_count || 0 }} transactions</div>
                            </div>
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 10rem">
                        <template #body="{ data }">
                            <div class="flex flex-col sm:flex-row gap-2">
                                <Button icon="pi pi-eye" severity="info" size="small" @click="viewAccount(data)" v-tooltip.top="'View Details'" />
                                <Button icon="pi pi-list" severity="secondary" size="small" @click="viewTransactions(data)" v-tooltip.top="'View Transactions'" />
                                <Button icon="pi pi-pencil" severity="secondary" size="small" @click="editAccount(data)" v-tooltip.top="'Edit Account'" />
                                <Button icon="pi pi-trash" severity="danger" size="small" @click="deleteAccount(data)" v-tooltip.top="'Delete Account'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Account Form Dialog -->
        <AccountForm v-model:visible="showCreateForm" :account="selectedAccount" @saved="onAccountSaved" />

        <!-- Transactions Dialog -->
        <Dialog v-model:visible="showTransactionsDialog" :modal="true" header="Account Transactions" :style="{ width: '90vw', height: '80vh' }">
            <div v-if="selectedAccount" class="space-y-4">
                <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                        <h3 class="text-lg font-medium">{{ selectedAccount.name }}</h3>
                        <p class="text-gray-600">Account: {{ selectedAccount.account_number }}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold" :class="getBalanceColor(selectedAccount.balance)">
                            {{ formatCurrency(selectedAccount.balance) }}
                        </div>
                        <div class="text-sm text-gray-500">Current Balance</div>
                    </div>
                </div>

                <DataTable :value="transactions" :loading="transactionsLoading" :paginator="true" :rows="20" class="p-datatable-sm" stripedRows>
                    <Column field="date" header="Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.transaction_date) }}
                        </template>
                    </Column>
                    <Column field="description" header="Description">
                        <template #body="{ data }">
                            <div class="max-w-xs truncate" :title="data.description">
                                {{ data.description }}
                            </div>
                        </template>
                    </Column>
                    <Column field="type" header="Type">
                        <template #body="{ data }">
                            <Tag :value="data.type === 'debit' ? 'Debit' : 'Credit'" :severity="data.type === 'debit' ? 'danger' : 'success'" />
                        </template>
                    </Column>
                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-medium">{{ formatCurrency(data.amount) }}</span>
                        </template>
                    </Column>
                    <Column field="balance" header="Running Balance" sortable>
                        <template #body="{ data }">
                            <span class="font-medium">{{ formatCurrency(data.balance) }}</span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </Dialog>

        <!-- Account Details Dialog -->
        <Dialog v-model:visible="showAccountDetailDialog" :modal="true" header="Account Details" :style="{ width: '80vw' }">
            <div v-if="selectedAccount">
                <AccountDetail :account-id-prop="selectedAccount.id" />
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.accounts-management {
    padding: 1.5rem;
}

.card {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
</style>
